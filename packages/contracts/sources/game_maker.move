/// Game Making Tool - Implements the game creation interface described in PRD 4.2.5
/// Handles the three-space system: Hand, Shared Board (5x5), and Private Area
module leviathan::game_maker {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::vector;
    use std::option::{Self, Option};
    use sui::event;

    /// Error codes
    const E_INVALID_SPACE_TYPE: u64 = 1;
    const E_INVALID_CELL_TYPE: u64 = 2;
    const E_INVALID_POSITION: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;
    const E_GAME_NOT_FOUND: u64 = 5;
    const E_INVALID_HAND_SIZE: u64 = 6;
    const E_INVALID_PRIVATE_AREA_SIZE: u64 = 7;

    /// Cell types as defined in PRD 4.2.5
    const CELL_TYPE_IMAGE: u8 = 0;
    const CELL_TYPE_DECK: u8 = 1;
    const CELL_TYPE_TRACK: u8 = 2;

    /// Game space types
    const SPACE_TYPE_HAND: u8 = 0;
    const SPACE_TYPE_SHARED_BOARD: u8 = 1;
    const SPACE_TYPE_PRIVATE_AREA: u8 = 2;

    /// Movement rule types for Track cells
    const MOVEMENT_TYPE_DIRECT_MAPPING: u8 = 0;
    const MOVEMENT_TYPE_DISTANCE_BASED: u8 = 1;

    /// Game Components - Main structure containing all game elements
    public struct GameComponents has key, store {
        id: UID,
        creator: address,
        game_title: String,
        hand_config: HandConfig,
        shared_board: SharedBoard,
        private_area_config: PrivateAreaConfig,
        cards: Table<u64, Card>,
        tokens: Table<u64, Token>,
        counters: Table<String, Counter>,
        flags: Table<String, Flag>,
        walrus_blob_id: Option<String>, // Reference to Walrus storage
        created_at: u64,
        last_modified: u64,
    }

    /// Hand configuration (variable size)
    public struct HandConfig has store {
        max_slots: u8, // Configurable by creator (with max limit)
        allowed_items: vector<u8>, // What types can be placed: cards, tokens, counters
    }

    /// Shared Board (fixed 5x5 grid)
    public struct SharedBoard has store {
        cells: Table<u8, Cell>, // Position (0-24) -> Cell
        size: u8, // Always 5 for 5x5
    }

    /// Private Area configuration (3-5 slots per player)
    public struct PrivateAreaConfig has store {
        slots_per_player: u8, // 3-5 slots
        cell_configs: Table<u8, Cell>, // Position -> Cell configuration
    }

    /// Individual cell definition
    public struct Cell has store {
        cell_type: u8, // IMAGE, DECK, or TRACK
        background_image_url: Option<String>,
        special_effects: vector<String>, // Additional turn, score changes, etc.
        movement_rules: Option<MovementRules>, // Only for TRACK cells
        deck_config: Option<DeckConfig>, // Only for DECK cells
    }

    /// Movement rules for Track cells
    public struct MovementRules has store {
        movement_type: u8, // DIRECT_MAPPING or DISTANCE_BASED
        mapping: Table<u8, u8>, // source_position -> target_position (for direct mapping)
        distance_formula: Option<String>, // For dice/yut results
    }

    /// Deck configuration for Deck cells
    public struct DeckConfig has store {
        max_cards: u8,
        shuffle_enabled: bool,
        face_up_default: bool, // Whether cards are shown face up or down
    }

    /// Card definition (front/back images, symbols, numbers)
    public struct Card has store {
        id: u64,
        front_image_url: String,
        back_image_url: String,
        symbol: Option<String>,
        number: Option<u8>,
        is_face_up: bool,
        metadata: Table<String, String>, // Additional properties
    }

    /// Token definition (1/4 cell size, front/back, flip capability)
    public struct Token has store {
        id: u64,
        front_image_url: String,
        back_image_url: String,
        is_flipped: bool,
        bound_counter: Option<String>, // Reference to counter name
        bound_flag: Option<String>, // Reference to flag name
        metadata: Table<String, String>,
    }

    /// Counter for scores, turn counting, etc.
    public struct Counter has store {
        name: String,
        value: u64,
        max_value: Option<u64>,
        display_type: u8, // Number, HP bar, gauge, etc.
    }

    /// Flag for boolean game states
    public struct Flag has store {
        name: String,
        value: bool,
        description: String,
    }

    /// Turn management state
    public struct TurnManager has store {
        current_player: u8,
        turn_count: u64,
        max_turns: Option<u64>,
        victory_conditions: Table<String, String>, // Condition name -> expression
    }

    /// Events for game creation and updates
    public struct GameCreated has copy, drop {
        components_id: ID,
        creator: address,
        title: String,
        timestamp: u64,
    }

    public struct GameUpdated has copy, drop {
        components_id: ID,
        field_updated: String,
        timestamp: u64,
    }

    public struct ComponentAdded has copy, drop {
        components_id: ID,
        component_type: String, // "card", "token", "counter", "flag"
        component_id: String,
        timestamp: u64,
    }

    /// Create new game components structure
    public entry fun create_game_components(
        title: vector<u8>,
        hand_max_slots: u8,
        private_area_slots: u8,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(hand_max_slots > 0 && hand_max_slots <= 20, E_INVALID_HAND_SIZE);
        assert!(private_area_slots >= 3 && private_area_slots <= 5, E_INVALID_PRIVATE_AREA_SIZE);

        let components = GameComponents {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            game_title: string::utf8(title),
            hand_config: HandConfig {
                max_slots: hand_max_slots,
                allowed_items: vector[0, 1, 2], // Allow all types by default
            },
            shared_board: SharedBoard {
                cells: table::new(ctx),
                size: 5,
            },
            private_area_config: PrivateAreaConfig {
                slots_per_player: private_area_slots,
                cell_configs: table::new(ctx),
            },
            cards: table::new(ctx),
            tokens: table::new(ctx),
            counters: table::new(ctx),
            flags: table::new(ctx),
            walrus_blob_id: option::none(),
            created_at: tx_context::epoch_timestamp_ms(ctx),
            last_modified: tx_context::epoch_timestamp_ms(ctx),
        };

        let components_id = object::id(&components);

        // Initialize default 5x5 board with empty Image cells
        let i = 0;
        while (i < 25) {
            let cell = Cell {
                cell_type: CELL_TYPE_IMAGE,
                background_image_url: option::none(),
                special_effects: vector::empty(),
                movement_rules: option::none(),
                deck_config: option::none(),
            };
            table::add(&mut components.shared_board.cells, i, cell);
            i = i + 1;
        };

        // Initialize private area cells
        let j = 0;
        while (j < private_area_slots) {
            let cell = Cell {
                cell_type: CELL_TYPE_IMAGE,
                background_image_url: option::none(),
                special_effects: vector::empty(),
                movement_rules: option::none(),
                deck_config: option::none(),
            };
            table::add(&mut components.private_area_config.cell_configs, j, cell);
            j = j + 1;
        };

        transfer::public_transfer(components, tx_context::sender(ctx));

        // Emit creation event
        event::emit(GameCreated {
            components_id,
            creator: tx_context::sender(ctx),
            title: string::utf8(title),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Configure a cell in the shared board (5x5 grid)
    public entry fun configure_shared_board_cell(
        components: &mut GameComponents,
        position: u8, // 0-24 for 5x5 grid
        cell_type: u8,
        background_image_url: vector<u8>,
        special_effects: vector<String>,
        ctx: &mut TxContext
    ) {
        // Verify ownership
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);
        assert!(position < 25, E_INVALID_POSITION);
        assert!(cell_type <= CELL_TYPE_TRACK, E_INVALID_CELL_TYPE);

        let cell = Cell {
            cell_type,
            background_image_url: if (vector::length(&background_image_url) > 0) {
                option::some(string::utf8(background_image_url))
            } else {
                option::none()
            },
            special_effects,
            movement_rules: option::none(),
            deck_config: option::none(),
        };

        if (table::contains(&components.shared_board.cells, position)) {
            table::remove(&mut components.shared_board.cells, position);
        };
        table::add(&mut components.shared_board.cells, position, cell);

        components.last_modified = tx_context::epoch_timestamp_ms(ctx);

        event::emit(GameUpdated {
            components_id: object::id(components),
            field_updated: string::utf8(b"shared_board_cell"),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Create a new card
    public entry fun create_card(
        components: &mut GameComponents,
        card_id: u64,
        front_image_url: vector<u8>,
        back_image_url: vector<u8>,
        symbol: vector<u8>,
        number: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let card = Card {
            id: card_id,
            front_image_url: string::utf8(front_image_url),
            back_image_url: string::utf8(back_image_url),
            symbol: if (vector::length(&symbol) > 0) {
                option::some(string::utf8(symbol))
            } else {
                option::none()
            },
            number: if (number > 0) {
                option::some(number)
            } else {
                option::none()
            },
            is_face_up: false,
            metadata: table::new(ctx),
        };

        table::add(&mut components.cards, card_id, card);
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);

        event::emit(ComponentAdded {
            components_id: object::id(components),
            component_type: string::utf8(b"card"),
            component_id: u64_to_string(card_id),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Create a new token
    public entry fun create_token(
        components: &mut GameComponents,
        token_id: u64,
        front_image_url: vector<u8>,
        back_image_url: vector<u8>,
        bound_counter: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let token = Token {
            id: token_id,
            front_image_url: string::utf8(front_image_url),
            back_image_url: string::utf8(back_image_url),
            is_flipped: false,
            bound_counter: if (vector::length(&bound_counter) > 0) {
                option::some(string::utf8(bound_counter))
            } else {
                option::none()
            },
            bound_flag: option::none(),
            metadata: table::new(ctx),
        };

        table::add(&mut components.tokens, token_id, token);
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);

        event::emit(ComponentAdded {
            components_id: object::id(components),
            component_type: string::utf8(b"token"),
            component_id: u64_to_string(token_id),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Add movement rules to a Track cell
    public entry fun add_movement_rules(
        components: &mut GameComponents,
        position: u8,
        movement_type: u8,
        distance_formula: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);
        assert!(position < 25, E_INVALID_POSITION);
        assert!(movement_type <= MOVEMENT_TYPE_DISTANCE_BASED, E_INVALID_CELL_TYPE);

        let cell = table::borrow_mut(&mut components.shared_board.cells, position);
        assert!(cell.cell_type == CELL_TYPE_TRACK, E_INVALID_CELL_TYPE);

        let movement_rules = MovementRules {
            movement_type,
            mapping: table::new(ctx),
            distance_formula: if (vector::length(&distance_formula) > 0) {
                option::some(string::utf8(distance_formula))
            } else {
                option::none()
            },
        };

        cell.movement_rules = option::some(movement_rules);
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);
    }

    /// Create a counter (for scores, HP, etc.)
    public entry fun create_counter(
        components: &mut GameComponents,
        name: vector<u8>,
        initial_value: u64,
        max_value: u64,
        display_type: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let counter = Counter {
            name: string::utf8(name),
            value: initial_value,
            max_value: if (max_value > 0) {
                option::some(max_value)
            } else {
                option::none()
            },
            display_type,
        };

        let name_str = string::utf8(name);
        table::add(&mut components.counters, name_str, counter);
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);

        event::emit(ComponentAdded {
            components_id: object::id(components),
            component_type: string::utf8(b"counter"),
            component_id: name_str,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Create a flag (boolean state)
    public entry fun create_flag(
        components: &mut GameComponents,
        name: vector<u8>,
        initial_value: bool,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let flag = Flag {
            name: string::utf8(name),
            value: initial_value,
            description: string::utf8(description),
        };

        let name_str = string::utf8(name);
        table::add(&mut components.flags, name_str, flag);
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);

        event::emit(ComponentAdded {
            components_id: object::id(components),
            component_type: string::utf8(b"flag"),
            component_id: name_str,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Set Walrus blob reference for storing complete game data
    public entry fun set_walrus_reference(
        components: &mut GameComponents,
        blob_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        components.walrus_blob_id = option::some(string::utf8(blob_id));
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);

        event::emit(GameUpdated {
            components_id: object::id(components),
            field_updated: string::utf8(b"walrus_reference"),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Flip a card (face up/down)
    public entry fun flip_card(
        components: &mut GameComponents,
        card_id: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let card = table::borrow_mut(&mut components.cards, card_id);
        card.is_face_up = !card.is_face_up;
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);
    }

    /// Flip a token
    public entry fun flip_token(
        components: &mut GameComponents,
        token_id: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let token = table::borrow_mut(&mut components.tokens, token_id);
        token.is_flipped = !token.is_flipped;
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);
    }

    /// Update counter value
    public entry fun update_counter(
        components: &mut GameComponents,
        name: vector<u8>,
        new_value: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let name_str = string::utf8(name);
        let counter = table::borrow_mut(&mut components.counters, name_str);

        // Check max value constraint
        if (option::is_some(&counter.max_value)) {
            let max_val = *option::borrow(&counter.max_value);
            if (new_value <= max_val) {
                counter.value = new_value;
            };
        } else {
            counter.value = new_value;
        };

        components.last_modified = tx_context::epoch_timestamp_ms(ctx);
    }

    /// Update flag value
    public entry fun update_flag(
        components: &mut GameComponents,
        name: vector<u8>,
        new_value: bool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let name_str = string::utf8(name);
        let flag = table::borrow_mut(&mut components.flags, name_str);
        flag.value = new_value;
        components.last_modified = tx_context::epoch_timestamp_ms(ctx);
    }

    /// Add direct mapping rule for Track cell movement
    public entry fun add_direct_mapping(
        components: &mut GameComponents,
        position: u8,
        from_pos: u8,
        to_pos: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == components.creator, E_UNAUTHORIZED);

        let cell = table::borrow_mut(&mut components.shared_board.cells, position);
        assert!(cell.cell_type == CELL_TYPE_TRACK, E_INVALID_CELL_TYPE);

        if (option::is_some(&cell.movement_rules)) {
            let rules = option::borrow_mut(&mut cell.movement_rules);
            table::add(&mut rules.mapping, from_pos, to_pos);
        };
    }

    /// View functions
    public fun get_game_title(components: &GameComponents): String {
        components.game_title
    }

    public fun get_creator(components: &GameComponents): address {
        components.creator
    }

    public fun get_hand_config(components: &GameComponents): &HandConfig {
        &components.hand_config
    }

    public fun get_shared_board_size(components: &GameComponents): u8 {
        components.shared_board.size
    }

    public fun get_private_area_slots(components: &GameComponents): u8 {
        components.private_area_config.slots_per_player
    }

    public fun get_walrus_reference(components: &GameComponents): Option<String> {
        components.walrus_blob_id
    }

    /// Helper function to convert u64 to string
    fun u64_to_string(value: u64): String {
        if (value == 0) {
            string::utf8(b"0")
        } else {
            let buffer = vector::empty<u8>();
            while (value > 0) {
                let digit = ((value % 10) as u8) + 48; // ASCII '0' = 48
                vector::push_back(&mut buffer, digit);
                value = value / 10;
            };
            vector::reverse(&mut buffer);
            string::utf8(buffer)
        }
    }

    /// Test-only functions
    #[test_only]
    public fun test_create_components(ctx: &mut TxContext): GameComponents {
        GameComponents {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            game_title: string::utf8(b"Test Game"),
            hand_config: HandConfig {
                max_slots: 10,
                allowed_items: vector[0, 1, 2],
            },
            shared_board: SharedBoard {
                cells: table::new(ctx),
                size: 5,
            },
            private_area_config: PrivateAreaConfig {
                slots_per_player: 3,
                cell_configs: table::new(ctx),
            },
            cards: table::new(ctx),
            tokens: table::new(ctx),
            counters: table::new(ctx),
            flags: table::new(ctx),
            walrus_blob_id: option::none(),
            created_at: 0,
            last_modified: 0,
        }
>>>>>>> Stashed changes
    }
}
