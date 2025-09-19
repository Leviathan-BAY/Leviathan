/// Game Launchpad - Allows creators to publish games and manage game registry
module leviathan::game_launchpad {
    use sui::coin::{Self, Coin};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    use leviathan::hermit_finance::HSUI;

    /// Error codes
    const E_INSUFFICIENT_PAYMENT: u64 = 1;
    const E_GAME_NOT_FOUND: u64 = 2;
    /// const E_UNAUTHORIZED: u64 = 3; not used
    /// const E_GAME_ALREADY_EXISTS: u64 = 4; not used

    /// Admin capability for managing the launchpad
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Game registry that stores all published games
    public struct GameRegistry has key {
        id: UID,
        games: Table<String, GameInfo>,
        next_game_id: u64,
        launch_fee: u64, // Fee in hSui MIST
    }

    /// Individual game information
    public struct GameInfo has store {
        id: String,
        title: String,
        description: String,
        creator: address,
        category: String,
        walrus_object_id: String, // Reference to game data in Walrus storage
        thumbnail_url: String,
        total_plays: u64,
        total_staked: u64, // Total SUI staked in this game
        created_at: u64,
        is_active: bool,
    }

    /// Game NFT that represents ownership of a published game
    public struct GameNFT has key, store {
        id: UID,
        game_id: String,
        title: String,
        creator: address,
        created_at: u64,
    }

    /// Events
    public struct GamePublished has copy, drop {
        game_id: String,
        title: String,
        creator: address,
        walrus_object_id: String,
        launch_fee_paid: u64,
        timestamp: u64,
    }

    public struct GameUpdated has copy, drop {
        game_id: String,
        field_updated: String,
        timestamp: u64,
    }

    public struct LaunchFeeUpdated has copy, drop {
        old_fee: u64,
        new_fee: u64,
        timestamp: u64,
    }

    /// Initialize the Game Launchpad
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        let game_registry = GameRegistry {
            id: object::new(ctx),
            games: table::new(ctx),
            next_game_id: 1,
            launch_fee: 1_000_000_000, // 1 hSui (in MIST)
        };

        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(game_registry);
    }

    /// Publish a new game to the launchpad
    public entry fun publish_game(
        registry: &mut GameRegistry,
        payment: Coin<HSUI>,
        title: vector<u8>,
        description: vector<u8>,
        category: vector<u8>,
        walrus_object_id: vector<u8>,
        thumbnail_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Verify payment
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= registry.launch_fee, E_INSUFFICIENT_PAYMENT);

        // Burn the payment (or transfer to treasury in future versions)
        coin::burn(payment);

        // Generate game ID
        let game_id = generate_game_id(registry.next_game_id);
        registry.next_game_id = registry.next_game_id + 1;

        // Create game info
        let game_info = GameInfo {
            id: game_id,
            title: string::utf8(title),
            description: string::utf8(description),
            creator: tx_context::sender(ctx),
            category: string::utf8(category),
            walrus_object_id: string::utf8(walrus_object_id),
            thumbnail_url: string::utf8(thumbnail_url),
            total_plays: 0,
            total_staked: 0,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            is_active: true,
        };

        // Store game in registry
        table::add(&mut registry.games, game_id, game_info);

        // Create and transfer Game NFT to creator
        let game_nft = GameNFT {
            id: object::new(ctx),
            game_id,
            title: string::utf8(title),
            creator: tx_context::sender(ctx),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        transfer::public_transfer(game_nft, tx_context::sender(ctx));

        // Emit event
        event::emit(GamePublished {
            game_id,
            title: string::utf8(title),
            creator: tx_context::sender(ctx),
            walrus_object_id: string::utf8(walrus_object_id),
            launch_fee_paid: payment_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Update game statistics (called by match settlement)
    public(package) fun update_game_stats(
        registry: &mut GameRegistry,
        game_id: String,
        plays_increment: u64,
        stake_increment: u64,
        ctx: &mut TxContext
    ) {
        if (table::contains(&registry.games, game_id)) {
            let game_info = table::borrow_mut(&mut registry.games, game_id);
            game_info.total_plays = game_info.total_plays + plays_increment;
            game_info.total_staked = game_info.total_staked + stake_increment;

            event::emit(GameUpdated {
                game_id,
                field_updated: string::utf8(b"stats"),
                timestamp: tx_context::epoch_timestamp_ms(ctx),
            });
        }
    }

    /// Admin function to set launch fee
    public entry fun set_launch_fee(
        _: &AdminCap,
        registry: &mut GameRegistry,
        new_fee: u64,
        ctx: &mut TxContext
    ) {
        let old_fee = registry.launch_fee;
        registry.launch_fee = new_fee;

        event::emit(LaunchFeeUpdated {
            old_fee,
            new_fee,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Admin function to deactivate a game
    public entry fun deactivate_game(
        _: &AdminCap,
        registry: &mut GameRegistry,
        game_id: String,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.games, game_id), E_GAME_NOT_FOUND);

        let game_info = table::borrow_mut(&mut registry.games, game_id);
        game_info.is_active = false;

        event::emit(GameUpdated {
            game_id,
            field_updated: string::utf8(b"deactivated"),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// View functions
    public fun get_game_info(registry: &GameRegistry, game_id: String): &GameInfo {
        assert!(table::contains(&registry.games, game_id), E_GAME_NOT_FOUND);
        table::borrow(&registry.games, game_id)
    }

    public fun get_launch_fee(registry: &GameRegistry): u64 {
        registry.launch_fee
    }

    public fun get_total_games(registry: &GameRegistry): u64 {
        registry.next_game_id - 1
    }

    public fun is_game_active(registry: &GameRegistry, game_id: String): bool {
        if (!table::contains(&registry.games, game_id)) {
            false
        } else {
            let game_info = table::borrow(&registry.games, game_id);
            game_info.is_active
        }
    }

    /// Helper function to generate game ID
    fun generate_game_id(id: u64): String {
        let id_str = u64_to_string(id);
        let prefix = string::utf8(b"game_");
        string::append(&mut prefix, id_str);
        prefix
    }

    /// Helper function to convert u64 to string (simplified)
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
    public fun test_init(ctx: &mut TxContext) {
        init(ctx)
    }
}