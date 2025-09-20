module leviathan::game_registry {
    use std::vector;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;

    const GAME_TYPE_CARD: u8 = 1;
    const GAME_TYPE_BOARD: u8 = 2;

    public struct PublishedGame has key, store {
        id: UID,
        game_type: u8,
        package_id: address,
        creator: address,
        created_at: u64,
    }

    public struct GameRegistry has key {
        id: UID,
        published_games: vector<ID>,  // ✅ ID로 변경
        created_games: vector<ID>,
    }

    /// ✅ visibility 추가
    public struct GamePublished has copy, drop {
        game: ID,
        game_type: u8,
        package_id: address,
    }

    public struct GameCreated has copy, drop {
        game: ID,
    }

    /// ✅ init에서 public 제거
    fun init(ctx: &mut TxContext) {
        let registry = GameRegistry {
            id: object::new(ctx),
            published_games: vector::empty<ID>(),
            created_games: vector::empty<ID>(),
        };
        transfer::share_object(registry);
    }

    public entry fun publish_game(
        registry: &mut GameRegistry,
        game_type: u8,
        package_id: address,
        ctx: &mut TxContext
    ) {
        assert!(game_type == GAME_TYPE_CARD || game_type == GAME_TYPE_BOARD, 1);

        let published = PublishedGame {
            id: object::new(ctx),
            game_type,
            package_id,
            creator: tx_context::sender(ctx),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        let id = object::id(&published); // ✅ ID 타입
        vector::push_back(&mut registry.published_games, id);

        event::emit(GamePublished {
            game: id,
            game_type,
            package_id,
        });

        transfer::share_object(published);
    }

    public entry fun register_created_game(
        registry: &mut GameRegistry,
        game_id: ID
    ) {
        vector::push_back(&mut registry.created_games, game_id);
        event::emit(GameCreated { game: game_id });
    }

    public fun get_published_games(registry: &GameRegistry): &vector<ID> {
        &registry.published_games
    }

    public fun get_created_games(registry: &GameRegistry): &vector<ID> {
        &registry.created_games
    }
}
