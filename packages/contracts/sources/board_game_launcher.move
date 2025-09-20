/// Leviathan Board Game Launcher - Game Instance Management and Gameplay
/// 게임 인스턴스 실행 및 플레이 로직
module leviathan::board_game_launcher {
    use sui::table::{Self, Table};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::random::{Self, Random};

    // Import GameTemplate from board_game_maker
    use leviathan::board_game_maker::{Self, GameTemplate};

    /// Error codes
    const E_GAME_NOT_FOUND: u64 = 4;
    const E_GAME_FULL: u64 = 8;
    const E_NOT_YOUR_TURN: u64 = 9;
    const E_GAME_FINISHED: u64 = 10;
    const E_INSUFFICIENT_STAKE: u64 = 11;
    const E_INVALID_MOVE: u64 = 13;
    const E_UNAUTHORIZED: u64 = 3;
    const E_NO_DICE_ROLL: u64 = 5;

    /// Cell types for 10x10 board (imported constants)
    const CELL_TYPE_BLOCKED: u8 = 1;
    const CELL_TYPE_BOMB: u8 = 2;
    const CELL_TYPE_FINISH: u8 = 4;

    /// Game states
    const GAME_STATE_WAITING: u8 = 0;    // 플레이어 대기 중
    const GAME_STATE_PLAYING: u8 = 1;    // 게임 진행 중
    const GAME_STATE_FINISHED: u8 = 2;   // 게임 종료

    /// 게임 인스턴스 (실제 플레이되는 게임)
    public struct GameInstance has key, store {
        id: UID,
        template_id: ID,                     // 참조하는 템플릿 ID
        player1: Option<address>,
        player2: Option<address>,
        current_player: u8,                  // 1 또는 2
        state: u8,                          // 게임 상태
        winner: Option<address>,

        // 말 위치 (플레이어별로 관리)
        player1_pieces: Table<u8, u8>,      // piece_index -> position
        player2_pieces: Table<u8, u8>,
        player1_dead_pieces: vector<u8>,    // 죽은 말들의 인덱스
        player2_dead_pieces: vector<u8>,
        player1_finished_pieces: vector<u8>, // 완주한 말들의 인덱스
        player2_finished_pieces: vector<u8>,

        // 게임 진행 상태
        stake_pool: Balance<SUI>,           // 판돈 풀
        turn_count: u64,
        last_dice_roll: Option<u8>,
        created_at: u64,
    }

    /// Events
    public struct GameStarted has copy, drop {
        game_id: ID,
        template_id: ID,
        player1: address,
        player2: address,
        timestamp: u64,
    }

    public struct DiceRolled has copy, drop {
        game_id: ID,
        player: address,
        dice_value: u8,
        timestamp: u64,
    }

    public struct PieceMoved has copy, drop {
        game_id: ID,
        player: address,
        piece_index: u8,
        from_position: u8,
        to_position: u8,
        timestamp: u64,
    }

    public struct PieceDied has copy, drop {
        game_id: ID,
        player: address,
        piece_index: u8,
        position: u8,
        timestamp: u64,
    }

    public struct GameFinished has copy, drop {
        game_id: ID,
        winner: address,
        loser: address,
        prize_amount: u64,
        timestamp: u64,
    }

    /// 게임 시작 (1vs1 매칭)
    public entry fun start_game(
        template: &GameTemplate,
        stake: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 템플릿 활성화 확인
        assert!(board_game_maker::is_template_active(template), E_GAME_NOT_FOUND);

        // 판돈 확인
        let stake_value = coin::value(&stake);
        let template_stake = board_game_maker::get_template_stake_amount(template);
        assert!(stake_value >= template_stake, E_INSUFFICIENT_STAKE);

        let mut game = GameInstance {
            id: object::new(ctx),
            template_id: object::id(template),
            player1: option::some(tx_context::sender(ctx)),
            player2: option::none(),
            current_player: 1,
            state: GAME_STATE_PLAYING, // 바로 플레이 상태로 시작
            winner: option::none(),
            player1_pieces: table::new(ctx),
            player2_pieces: table::new(ctx),
            player1_dead_pieces: vector::empty(),
            player2_dead_pieces: vector::empty(),
            player1_finished_pieces: vector::empty(),
            player2_finished_pieces: vector::empty(),
            stake_pool: coin::into_balance(stake),
            turn_count: 0,
            last_dice_roll: option::none(),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        // 플레이어1의 말들을 시작점에 배치
        initialize_player_pieces(&mut game, 1, template);

        transfer::share_object(game);
    }

    /// 두 번째 플레이어 합류
    public entry fun join_game(
        game: &mut GameInstance,
        template: &GameTemplate,
        stake: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 게임 상태 확인
        assert!(game.state == GAME_STATE_WAITING, E_GAME_FULL);
        assert!(option::is_none(&game.player2), E_GAME_FULL);

        // 판돈 확인
        let stake_value = coin::value(&stake);
        let template_stake = board_game_maker::get_template_stake_amount(template);
        assert!(stake_value >= template_stake, E_INSUFFICIENT_STAKE);

        // 두 번째 플레이어 설정
        game.player2 = option::some(tx_context::sender(ctx));
        game.state = GAME_STATE_PLAYING;

        // 판돈 추가
        balance::join(&mut game.stake_pool, coin::into_balance(stake));

        // 플레이어2의 말들을 시작점에 배치
        initialize_player_pieces(game, 2, template);

        let player1 = *option::borrow(&game.player1);
        let player2 = tx_context::sender(ctx);

        event::emit(GameStarted {
            game_id: object::id(game),
            template_id: game.template_id,
            player1,
            player2,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// 주사위 굴리기 및 말 이동 (누구나 호출 가능)
    #[allow(lint(public_random))]
    public entry fun roll_dice(
        game: &mut GameInstance,
        template: &GameTemplate,
        r: &Random,
        ctx: &mut TxContext
    ) {
        assert!(game.state == GAME_STATE_PLAYING, E_GAME_FINISHED);
        // 소유권 확인 제거 - 누구나 주사위를 굴릴 수 있음

        let mut gen = random::new_generator(r, ctx);
        let (dice_min, dice_max) = board_game_maker::get_template_dice_range(template);
        let dice_range = (dice_max - dice_min + 1) as u16;
        let dice_value = (random::generate_u16(&mut gen) % dice_range) as u8 + dice_min;

        // game에 마지막 주사위 값 저장
        game.last_dice_roll = option::some(dice_value);

        event::emit(DiceRolled {
            game_id: object::id(game),
            player: tx_context::sender(ctx),
            dice_value,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    public entry fun move_piece_with_dice(
        game: &mut GameInstance,
        template: &GameTemplate,
        piece_index: u8,
        ctx: &mut TxContext
    ) {
        assert!(game.state == GAME_STATE_PLAYING, E_GAME_FINISHED);
        // 소유권 확인 제거 - 누구나 말을 움직일 수 있음

        // ✅ 먼저 Option 값이 있는지 체크
        let has_roll = option::is_some(&game.last_dice_roll);
        assert!(option::is_some(&game.last_dice_roll), E_NO_DICE_ROLL);
        let dice_value_ref = option::borrow(&game.last_dice_roll);
        let dice_value = *dice_value_ref; // u8 값 복사
        // 이동 후 dice roll 초기화
        game.last_dice_roll = option::none<u8>();

        let pieces_per_player = board_game_maker::get_template_pieces_per_player(template);
        assert!(piece_index < pieces_per_player, E_INVALID_MOVE);

        // 기본적으로 플레이어 1로 처리 (단순화)
        move_piece(game, template, 1, piece_index, dice_value, ctx);

        // 턴 전환
        game.current_player = if (game.current_player == 1) { 2 } else { 1 };
        game.turn_count = game.turn_count + 1;

        // 승리 조건 확인
        check_victory_condition(game, template, ctx);
    }



    /// 말 이동 로직
    fun move_piece(
        game: &mut GameInstance,
        template: &GameTemplate,
        player_num: u8,
        piece_index: u8,
        steps: u8,
        ctx: &mut TxContext
    ) {
        let pieces_table = if (player_num == 1) {
            &mut game.player1_pieces
        } else {
            &mut game.player2_pieces
        };

        // 현재 위치 가져오기
        let current_pos = *table::borrow(pieces_table, piece_index);
        let new_pos = calculate_new_position(current_pos, steps, template);

        // 새로운 위치 유효성 검사
        assert!(new_pos < 100, E_INVALID_MOVE);

        let cell_type = board_game_maker::get_board_cell(template, new_pos);
        assert!(cell_type != CELL_TYPE_BLOCKED, E_INVALID_MOVE);

        // 말 이동
        let piece_ref = table::borrow_mut(pieces_table, piece_index);
        *piece_ref = new_pos;

        event::emit(PieceMoved {
            game_id: object::id(game),
            player: tx_context::sender(ctx), // 실제 호출자 주소 사용
            piece_index,
            from_position: current_pos,
            to_position: new_pos,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        // 특수 칸 처리
        handle_special_cell(game, template, player_num, piece_index, new_pos, ctx);
    }

    /// 특수 칸 처리
    fun handle_special_cell(
        game: &mut GameInstance,
        template: &GameTemplate,
        player_num: u8,
        piece_index: u8,
        position: u8,
        ctx: &mut TxContext
    ) {
        let cell_type = board_game_maker::get_board_cell(template, position);

        if (cell_type == CELL_TYPE_BOMB) {
            // 폭탄 칸: 말 죽음
            let dead_pieces = if (player_num == 1) {
                &mut game.player1_dead_pieces
            } else {
                &mut game.player2_dead_pieces
            };

            vector::push_back(dead_pieces, piece_index);

            event::emit(PieceDied {
                game_id: object::id(game),
                player: tx_context::sender(ctx), // 실제 호출자 주소 사용
                piece_index,
                position,
                timestamp: tx_context::epoch_timestamp_ms(ctx),
            });

        } else if (cell_type == CELL_TYPE_FINISH) {
            // 도착점: 말 완주
            let finished_pieces = if (player_num == 1) {
                &mut game.player1_finished_pieces
            } else {
                &mut game.player2_finished_pieces
            };

            vector::push_back(finished_pieces, piece_index);
        };
    }

    /// 새로운 위치 계산 (단순한 선형 이동)
    fun calculate_new_position(current_pos: u8, steps: u8, _template: &GameTemplate): u8 {
        // 10x10 보드에서의 간단한 이동 (오른쪽으로 이동, 끝에서 다음 줄로)
        let new_pos = (current_pos as u16) + (steps as u16);
        if (new_pos >= 100) {
            99 // 보드 끝에서 멈춤
        } else {
            (new_pos as u8)
        }
    }

    /// 플레이어 말들 초기화
    fun initialize_player_pieces(
        game: &mut GameInstance,
        player_num: u8,
        template: &GameTemplate
    ) {
        let pieces_table = if (player_num == 1) {
            &mut game.player1_pieces
        } else {
            &mut game.player2_pieces
        };

        // 시작점에 말들 배치
        let start_positions = board_game_maker::get_template_start_positions(template);
        let start_pos = if (vector::length(&start_positions) > 0) {
            *vector::borrow(&start_positions, 0)
        } else {
            0 // 기본 시작점
        };

        let pieces_per_player = board_game_maker::get_template_pieces_per_player(template);
        let mut i = 0;
        while (i < pieces_per_player) {
            table::add(pieces_table, i, start_pos);
            i = i + 1;
        };
    }

    /// 승리 조건 확인
    fun check_victory_condition(
        game: &mut GameInstance,
        template: &GameTemplate,
        ctx: &mut TxContext
    ) {
        let p1_finished = vector::length(&game.player1_finished_pieces);
        let p2_finished = vector::length(&game.player2_finished_pieces);

        let pieces_per_player = board_game_maker::get_template_pieces_per_player(template);

        // 모든 말이 도착하면 승리
        if (p1_finished == (pieces_per_player as u64)) {
            declare_winner(game, 1, ctx);
        } else if (p2_finished == (pieces_per_player as u64)) {
            declare_winner(game, 2, ctx);
        };
    }

    /// 승자 선언 및 상금 지급
    fun declare_winner(
        game: &mut GameInstance,
        winner_num: u8,
        ctx: &mut TxContext
    ) {
        game.state = GAME_STATE_FINISHED;
        let winner_addr = get_player_address(game, winner_num);
        let loser_addr = get_player_address(game, if (winner_num == 1) { 2 } else { 1 });

        game.winner = option::some(winner_addr);

        // 상금 지급 (95%, 5%는 수수료)
        let total_prize = balance::value(&game.stake_pool);
        let winner_prize = total_prize * 95 / 100;

        let prize_balance = balance::split(&mut game.stake_pool, winner_prize);
        let prize_coin = coin::from_balance(prize_balance, ctx);
        transfer::public_transfer(prize_coin, winner_addr);

        event::emit(GameFinished {
            game_id: object::id(game),
            winner: winner_addr,
            loser: loser_addr,
            prize_amount: winner_prize,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Helper functions
    fun get_player_number(game: &GameInstance, player: address): u8 {
        if (option::is_some(&game.player1) && *option::borrow(&game.player1) == player) {
            1
        } else if (option::is_some(&game.player2) && *option::borrow(&game.player2) == player) {
            2
        } else {
            abort E_UNAUTHORIZED
        }
    }

    fun get_player_address(game: &GameInstance, player_num: u8): address {
        if (player_num == 1) {
            *option::borrow(&game.player1)
        } else {
            *option::borrow(&game.player2)
        }
    }

    /// View functions
    public fun get_game_state(game: &GameInstance): (u8, Option<address>, u8, u64) {
        (game.state, game.winner, game.current_player, game.turn_count)
    }

    public fun get_piece_positions(game: &GameInstance, player_num: u8): vector<u8> {
        let pieces_table = if (player_num == 1) {
            &game.player1_pieces
        } else {
            &game.player2_pieces
        };

        let mut positions = vector::empty<u8>();
        let mut i = 0;
        while (i < 5) {  // 최대 5개 말까지 (pieces_per_player 최대값)
            if (table::contains(pieces_table, i)) {
                vector::push_back(&mut positions, *table::borrow(pieces_table, i));
            };
            i = i + 1;
        };
        positions
    }

    public fun get_last_dice_roll(game: &GameInstance): Option<u8> {
        game.last_dice_roll
    }
}