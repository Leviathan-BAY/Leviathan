/// Purpose: A creator-focused Move module that lets game designers configure boards, cards, and tokens, register metadata, and publish their game on-chain.
module leviathan::game_maker {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use sui::event;

    /// -----------------------------
    /// Error Codes (for debugging / frontend UX)
    const E_NOT_OWNER: u64 = 1;
    const E_INVALID_BOARD_SIZE: u64 = 2;
    const E_INVALID_HAND_SIZE: u64 = 3;

    /// -----------------------------
    /// Cell Types (Board Representation)
    /// Stored as u8 to minimize storage cost.
    const CELL_EMPTY: u8 = 0;   // No special feature
    const CELL_IMAGE: u8 = 1;   // Static image / background
    const CELL_DECK: u8 = 2;    // Deck slot (draw/shuffle)
    const CELL_TRACK: u8 = 3;   // Track cell (token movement)

    /// -----------------------------
    /// Core Struct: GameComponents
    /// Holds the entire board layout, player hand size, private area, and asset references.
    public struct GameComponents has key, store {
        id: UID,
        owner: address,
        board: vector<u8>,          // Flattened 2D board layout
        board_rows: u8,
        board_cols: u8,
        hand_slots: u8,             // Number of card/token slots per player
        private_slots: u8,          // Number of private area cells
        cards: Table<u64, Card>,    // Registered cards
        tokens: Table<u64, Token>,  // Registered tokens
    }

    /// Card object metadata
    public struct Card has store {
        id: u64,
        front_uri: String,
        back_uri: String,
        value: u8,
        is_face_up: bool,
    }

    /// Token object metadata
    public struct Token has store {
        id: u64,
        image_uri: String,
        is_face_up: bool,
        counter: u64, // Optional score/counter binding
    }

    /// GameInfo: public metadata for Splash Zone
    public struct GameInfo has key, store {
        id: UID,
        name: String,
        components: address,
        game_owner: address,
        thumbnail_uri: String,
        join_fee: u64,
        player_sum: u8,
        created_at: u64,
        is_published: bool,
    }

    /// -----------------------------
    /// Events (subscribed by frontend)
    public struct GamePublished has copy, drop {
        game: address,
        timestamp: u64,
    }

    public struct BoardCellUpdated has copy, drop {
        row: u8,
        col: u8,
        cell_type: u8,
    }

    public struct AssetRegistered has copy, drop {
        asset_type: String, // "card" or "token"
        asset_id: u64,
    }

    /// -----------------------------
    /// Create a new empty GameComponents object
    public entry fun create_components(
        board_rows: u8,
        board_cols: u8,
        hand_slots: u8,
        private_slots: u8,
        ctx: &mut TxContext
    ): GameComponents {
        assert!(board_rows <= 10 && board_cols <= 10, E_INVALID_BOARD_SIZE);
        assert!(hand_slots <= 10, E_INVALID_HAND_SIZE);

        GameComponents {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            board: vector::empty<u8>(),
            board_rows,
            board_cols,
            hand_slots,
            private_slots,
            cards: table::new(ctx),
            tokens: table::new(ctx),
        }
    }

    /// Set or update a cell in the board layout
    public entry fun set_cell(
        components: &mut GameComponents,
        row: u8,
        col: u8,
        cell_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.owner, E_NOT_OWNER);

        let idx = (row as u64) * (components.board_cols as u64) + (col as u64);
        if (idx < vector::length(&components.board)) {
            *vector::borrow_mut(&mut components.board, idx) = cell_type;
        } else {
            // Fill missing cells with empty slots if needed
            while (vector::length(&components.board) < idx) {
                vector::push_back(&mut components.board, CELL_EMPTY);
            };
            vector::push_back(&mut components.board, cell_type);
        }

        event::emit(BoardCellUpdated { row, col, cell_type });
    }

    /// Register a card asset for the game
    public entry fun register_card(
        components: &mut GameComponents,
        card_id: u64,
        front_uri: vector<u8>,
        back_uri: vector<u8>,
        value: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.owner, E_NOT_OWNER);

        let card = Card {
            id: card_id,
            front_uri: string::utf8(front_uri),
            back_uri: string::utf8(back_uri),
            value,
            is_face_up: false,
        };
        table::add(&mut components.cards, card_id, card);

        event::emit(AssetRegistered {
            asset_type: string::utf8(b"card"),
            asset_id: card_id,
        });
    }

    /// Register a token asset for the game
    public entry fun register_token(
        components: &mut GameComponents,
        token_id: u64,
        image_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.owner, E_NOT_OWNER);

        let token = Token {
            id: token_id,
            image_uri: string::utf8(image_uri),
            is_face_up: true,
            counter: 0,
        };
        table::add(&mut components.tokens, token_id, token);

        event::emit(AssetRegistered {
            asset_type: string::utf8(b"token"),
            asset_id: token_id,
        });
    }

    /// Create the GameInfo object before publishing
    public entry fun create_game_info(
        name: vector<u8>,
        components: &GameComponents,
        thumbnail_uri: vector<u8>,
        join_fee: u64,
        player_sum: u8,
        ctx: &mut TxContext
    ): GameInfo {
        GameInfo {
            id: object::new(ctx),
            name: string::utf8(name),
            components: object::address_of(components),
            game_owner: tx_context::sender(ctx),
            thumbnail_uri: string::utf8(thumbnail_uri),
            join_fee,
            player_sum,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            is_published: false,
        }
    }

    /// Publish the game to Splash Zone
    public entry fun publish_game(
        info: &mut GameInfo,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == info.game_owner, E_NOT_OWNER);
        info.is_published = true;

        event::emit(GamePublished {
            game: object::address_of(info),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        transfer::share_object(info);
    }
}
