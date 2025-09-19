/// 게임 엔진 모듈 (Game Engine)
module leviathan::game_engine {
    use sui::event;
    use std::string::String;

    /// ------------------------------
    /// 에러 코드 정의
    const E_INVALID_ACTION: u64 = 1;
    const E_NOT_PLAYER_TURN: u64 = 2;
    const E_GAME_ALREADY_FINISHED: u64 = 3;

    /// ------------------------------
    /// 게임 템플릿 (RuleConfig)
    /// - 제작자가 한 번 배포하면 영구 저장
    public struct RuleConfig has key, store {
        id: object::UID,            // ✅ fully-qualified UID
        creator: address,
        max_players: u8,
        board_size: u8,
        turn_limit: u64,
        victory_condition: String,
        actions: vector<String>,
        metadata_uri: String,
        is_active: bool,
    }

    /// ------------------------------
    /// 게임 인스턴스 (GameInstance)
    /// - 플레이어들이 매번 새 게임 시작 시 생성
    public struct GameInstance has key, store {
        id: object::UID,
        template_id: object::ID,
        players: vector<address>,
        current_turn: u8,
        turn_count: u64,
        board_state: vector<u8>,
        is_finished: bool,
        winner: Option<address>,
    }

    /// ------------------------------
    /// 이벤트 정의 (프론트엔드에서 구독)
    public struct GameCreated has copy, drop {
        instance: object::ID,
        template: object::ID,
        players: vector<address>,
        timestamp: u64,
    }

    public struct ActionPerformed has copy, drop {
        instance: object::ID,
        actor: address,
        action_kind: u8,
        payload: vector<u8>,
        turn: u64,
    }

    public struct GameEnded has copy, drop {
        instance: object::ID,
        winner: Option<address>,
        turn_count: u64,
    }

    /// ------------------------------
    /// 게임 템플릿 생성
    public entry fun create_template(
        creator: address,
        max_players: u8,
        board_size: u8,
        victory_condition: vector<u8>,
        actions: vector<String>,
        metadata_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        let template = RuleConfig {
            id: object::new(ctx),
            creator,
            max_players,
            board_size,
            turn_limit: 0,
            victory_condition: std::string::utf8(victory_condition),
            actions,
            metadata_uri: std::string::utf8(metadata_uri),
            is_active: true,
        };
        transfer::share_object(template);
    }

    /// ------------------------------
    /// 새로운 게임 인스턴스 생성
    public entry fun create_instance(
        template: &RuleConfig,
        players: vector<address>,
        ctx: &mut TxContext
    ) {

        let instance = GameInstance {
            id: object::new(ctx),
            template_id: object::id(template),
            players,
            current_turn: 0,
            turn_count: 0,
            board_state: vector::empty<u8>(),
            is_finished: false,
            winner: option::none<address>(),
        };

        event::emit(GameCreated {
            instance: object::id(&instance),
            template: object::id(template),
            players,
            timestamp: sui::tx_context::epoch_timestamp_ms(ctx),
        });

        transfer::share_object(instance);
    }


    /// ------------------------------
    /// 게임 액션 처리
    public entry fun act(
        instance: &mut GameInstance,
        actor: address,
        action_kind: u8,
        payload: vector<u8>,
        _ctx: &mut TxContext
    ) {
        assert!(!instance.is_finished, E_GAME_ALREADY_FINISHED);

        let current_player = *vector::borrow(&instance.players, instance.current_turn as u64);
        assert!(actor == current_player, E_NOT_PLAYER_TURN);

        // TODO: action_kind 값에 따라 보드 상태 업데이트 로직 구현

        instance.turn_count = instance.turn_count + 1;
        instance.current_turn =
            (instance.current_turn + 1) % (vector::length(&instance.players) as u8);

        event::emit(ActionPerformed {
            instance: object::id(instance),
            actor,
            action_kind,
            payload,
            turn: instance.turn_count,
        });
    }

    /// ------------------------------
    /// 게임 종료 및 승자 확정
    public entry fun finalize(
        instance: &mut GameInstance,
        winner: Option<address>
    ) {
        instance.is_finished = true;
        instance.winner = winner;

        event::emit(GameEnded {
            instance: object::id(instance),
            winner,
            turn_count: instance.turn_count,
        });
    }
}
