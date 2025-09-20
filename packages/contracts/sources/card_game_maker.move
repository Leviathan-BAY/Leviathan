/// Leviathan Card Game Maker - Template Creation and Result Settlement
/// 카드 게임 템플릿 생성 및 결과 정산 시스템
module leviathan::card_game_maker {
    use sui::table::{Self, Table};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use std::string::{Self, String};

    /// Error codes
    const E_INVALID_PLAYER_COUNT: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_GAME_NOT_FOUND: u64 = 3;
    const E_INSUFFICIENT_STAKE: u64 = 4;
    const E_INVALID_WINNER: u64 = 5;
    const E_GAME_ALREADY_SETTLED: u64 = 6;
    const E_INVALID_RULES: u64 = 7;

    /// Card game types
    const GAME_TYPE_POKER: u8 = 0;
    const GAME_TYPE_BLACKJACK: u8 = 1;
    const GAME_TYPE_UNO: u8 = 2;
    const GAME_TYPE_CUSTOM: u8 = 3;

    /// Game states
    const GAME_STATE_WAITING: u8 = 0;
    const GAME_STATE_PLAYING: u8 = 1;
    const GAME_STATE_FINISHED: u8 = 2;
    const GAME_STATE_SETTLED: u8 = 3;

    /// 카드 게임 템플릿 (온체인 저장)
    public struct CardGameTemplate has key, store {
        id: UID,
        creator: address,
        name: String,
        description: String,
        game_type: u8,                  // 게임 타입 (포커, 블랙잭 등)

        // 게임 규칙 (JSON 형태로 인코딩)
        rules_json: vector<u8>,         // 프론트엔드에서 파싱할 규칙 데이터

        // 게임 설정
        min_players: u8,                // 최소 플레이어 수
        max_players: u8,                // 최대 플레이어 수
        stake_amount: u64,              // 참가비 (SUI)
        game_duration_limit: u64,       // 게임 시간 제한 (밀리초)

        // 승리 조건
        win_conditions: vector<u8>,     // JSON으로 인코딩된 승리 조건

        // 통계
        total_games_played: u64,
        total_stakes_collected: u64,
        created_at: u64,
        is_active: bool,
    }

    /// 게임 인스턴스 (매치메이킹 및 스테이킹)
    public struct GameInstance has key, store {
        id: UID,
        template_id: ID,
        players: vector<address>,
        stakes: Table<address, u64>,    // 플레이어별 스테이크
        total_stake_pool: Balance<SUI>,
        state: u8,
        winner: Option<address>,
        final_scores: Table<address, u64>,
        game_seed: u64,                 // 랜덤 시드 (카드 셔플용)
        started_at: Option<u64>,
        finished_at: Option<u64>,
    }

    /// Events
    public struct TemplateCreated has copy, drop {
        template_id: ID,
        creator: address,
        name: String,
        game_type: u8,
        timestamp: u64,
    }

    public struct GameInstanceCreated has copy, drop {
        instance_id: ID,
        template_id: ID,
        creator: address,
        stake_amount: u64,
        timestamp: u64,
    }

    public struct PlayerJoined has copy, drop {
        instance_id: ID,
        player: address,
        stake_amount: u64,
        current_player_count: u64,
        timestamp: u64,
    }

    public struct GameStarted has copy, drop {
        instance_id: ID,
        template_id: ID,
        players: vector<address>,
        total_stake: u64,
        game_seed: u64,
        timestamp: u64,
    }

    public struct GameFinished has copy, drop {
        instance_id: ID,
        winner: address,
        final_scores: vector<u64>,
        total_prize: u64,
        game_duration: u64,
        timestamp: u64,
    }

    /// 카드 게임 템플릿 생성
    public entry fun create_card_game_template(
        name: vector<u8>,
        description: vector<u8>,
        game_type: u8,
        rules_json: vector<u8>,
        min_players: u8,
        max_players: u8,
        stake_amount: u64,
        game_duration_limit: u64,
        win_conditions: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 유효성 검사
        assert!(min_players >= 2 && max_players <= 8, E_INVALID_PLAYER_COUNT);
        assert!(min_players <= max_players, E_INVALID_PLAYER_COUNT);
        assert!(vector::length(&rules_json) > 0, E_INVALID_RULES);
        assert!(game_type <= GAME_TYPE_CUSTOM, E_INVALID_RULES);

        let template = CardGameTemplate {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            game_type,
            rules_json,
            min_players,
            max_players,
            stake_amount,
            game_duration_limit,
            win_conditions,
            total_games_played: 0,
            total_stakes_collected: 0,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            is_active: true,
        };

        let template_id = object::id(&template);

        // 템플릿을 공유 객체로 만들어서 누구나 게임을 시작할 수 있도록
        transfer::share_object(template);

        event::emit(TemplateCreated {
            template_id,
            creator: tx_context::sender(ctx),
            name: string::utf8(name),
            game_type,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// 게임 인스턴스 생성 (방 만들기)
    public entry fun create_game_instance(
        template: &CardGameTemplate,
        stake: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 템플릿 활성화 확인
        assert!(template.is_active, E_GAME_NOT_FOUND);

        // 스테이크 확인
        let stake_value = coin::value(&stake);
        assert!(stake_value >= template.stake_amount, E_INSUFFICIENT_STAKE);

        let player = tx_context::sender(ctx);

        let mut instance = GameInstance {
            id: object::new(ctx),
            template_id: object::id(template),
            players: vector::empty(),
            stakes: table::new(ctx),
            total_stake_pool: balance::zero(),
            state: GAME_STATE_WAITING,
            winner: option::none(),
            final_scores: table::new(ctx),
            game_seed: 0,
            started_at: option::none(),
            finished_at: option::none(),
        };

        // 첫 번째 플레이어 추가
        vector::push_back(&mut instance.players, player);
        table::add(&mut instance.stakes, player, stake_value);
        balance::join(&mut instance.total_stake_pool, coin::into_balance(stake));

        let instance_id = object::id(&instance);

        transfer::share_object(instance);

        event::emit(GameInstanceCreated {
            instance_id,
            template_id: object::id(template),
            creator: player,
            stake_amount: stake_value,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// 게임 인스턴스에 참여
    public entry fun join_game_instance(
        instance: &mut GameInstance,
        template: &CardGameTemplate,
        stake: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 게임 상태 확인
        assert!(instance.state == GAME_STATE_WAITING, E_GAME_NOT_FOUND);

        let current_players = vector::length(&instance.players);
        assert!(current_players < (template.max_players as u64), E_INVALID_PLAYER_COUNT);

        // 스테이크 확인
        let stake_value = coin::value(&stake);
        assert!(stake_value >= template.stake_amount, E_INSUFFICIENT_STAKE);

        let player = tx_context::sender(ctx);

        // 이미 참여한 플레이어인지 확인
        assert!(!vector::contains(&instance.players, &player), E_INVALID_PLAYER_COUNT);

        // 플레이어 추가
        vector::push_back(&mut instance.players, player);
        table::add(&mut instance.stakes, player, stake_value);
        balance::join(&mut instance.total_stake_pool, coin::into_balance(stake));

        let new_player_count = vector::length(&instance.players);

        event::emit(PlayerJoined {
            instance_id: object::id(instance),
            player,
            stake_amount: stake_value,
            current_player_count: new_player_count,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        // 최소 인원이 충족되면 게임 시작 가능 상태로 전환
        if (new_player_count >= (template.min_players as u64)) {
            instance.state = GAME_STATE_PLAYING;
            instance.game_seed = tx_context::epoch_timestamp_ms(ctx) % 1000000; // 간단한 시드
            instance.started_at = option::some(tx_context::epoch_timestamp_ms(ctx));

            event::emit(GameStarted {
                instance_id: object::id(instance),
                template_id: instance.template_id,
                players: instance.players,
                total_stake: balance::value(&instance.total_stake_pool),
                game_seed: instance.game_seed,
                timestamp: tx_context::epoch_timestamp_ms(ctx),
            });
        };
    }

    /// 게임 결과 제출 및 정산 (프론트엔드에서 게임 완료 후 호출)
    public entry fun submit_game_result(
        instance: &mut GameInstance,
        template: &mut CardGameTemplate,
        winner: address,
        final_scores: vector<u64>,
        ctx: &mut TxContext
    ) {
        // 게임 상태 확인
        assert!(instance.state == GAME_STATE_PLAYING, E_GAME_ALREADY_SETTLED);
        assert!(vector::contains(&instance.players, &winner), E_INVALID_WINNER);
        assert!(vector::length(&final_scores) == vector::length(&instance.players), E_INVALID_WINNER);

        // 승자 설정
        instance.winner = option::some(winner);
        instance.state = GAME_STATE_FINISHED;
        instance.finished_at = option::some(tx_context::epoch_timestamp_ms(ctx));

        // 최종 점수 저장
        let mut i = 0;
        let players_len = vector::length(&instance.players);
        while (i < players_len) {
            let player = *vector::borrow(&instance.players, i);
            let score = *vector::borrow(&final_scores, i);
            table::add(&mut instance.final_scores, player, score);
            i = i + 1;
        };

        // 상금 분배 (95% 승자, 5% 수수료)
        let total_prize = balance::value(&instance.total_stake_pool);
        let winner_prize = total_prize * 95 / 100;
        let platform_fee = total_prize - winner_prize;

        // 승자에게 상금 지급
        let winner_balance = balance::split(&mut instance.total_stake_pool, winner_prize);
        let winner_coin = coin::from_balance(winner_balance, ctx);
        transfer::public_transfer(winner_coin, winner);

        // 플랫폼 수수료는 풀에 남김 (나중에 관리자가 회수)

        // 템플릿 통계 업데이트
        template.total_games_played = template.total_games_played + 1;
        template.total_stakes_collected = template.total_stakes_collected + total_prize;

        instance.state = GAME_STATE_SETTLED;

        let game_duration = if (option::is_some(&instance.started_at) && option::is_some(&instance.finished_at)) {
            *option::borrow(&instance.finished_at) - *option::borrow(&instance.started_at)
        } else {
            0
        };

        event::emit(GameFinished {
            instance_id: object::id(instance),
            winner,
            final_scores,
            total_prize: winner_prize,
            game_duration,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// 템플릿 활성화/비활성화 (창작자만)
    public entry fun toggle_template_active(
        template: &mut CardGameTemplate,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == template.creator, E_UNAUTHORIZED);
        template.is_active = !template.is_active;
    }

    /// View functions
    public fun get_template_info(template: &CardGameTemplate): (String, String, u8, u8, u8, u64, u64, bool) {
        (
            template.name,
            template.description,
            template.game_type,
            template.min_players,
            template.max_players,
            template.stake_amount,
            template.total_games_played,
            template.is_active
        )
    }

    public fun get_template_rules(template: &CardGameTemplate): (vector<u8>, vector<u8>) {
        (template.rules_json, template.win_conditions)
    }

    public fun get_instance_info(instance: &GameInstance): (ID, vector<address>, u8, Option<address>, u64, u64) {
        (
            instance.template_id,
            instance.players,
            instance.state,
            instance.winner,
            balance::value(&instance.total_stake_pool),
            instance.game_seed
        )
    }

    public fun get_player_count(instance: &GameInstance): u64 {
        vector::length(&instance.players)
    }

    public fun is_player_in_game(instance: &GameInstance, player: address): bool {
        vector::contains(&instance.players, &player)
    }

    public fun get_game_seed(instance: &GameInstance): u64 {
        instance.game_seed
    }

    /// Test-only functions
    #[test_only]
    public fun create_test_template(ctx: &mut TxContext): CardGameTemplate {
        CardGameTemplate {
            id: object::new(ctx),
            creator: @0x1,
            name: string::utf8(b"Test Game"),
            description: string::utf8(b"Test Description"),
            game_type: GAME_TYPE_POKER,
            rules_json: b"{}",
            min_players: 2,
            max_players: 4,
            stake_amount: 1000000000,
            game_duration_limit: 600000,
            win_conditions: b"{}",
            total_games_played: 0,
            total_stakes_collected: 0,
            created_at: 0,
            is_active: true,
        }
    }
}