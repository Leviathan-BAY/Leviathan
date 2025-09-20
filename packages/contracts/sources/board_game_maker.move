/// Leviathan Board Game Maker - 10x10 Customizable Board Game System
/// 해커톤용 1vs1 턴제 보드게임 템플릿 제작 및 플레이
module leviathan::board_game_maker {
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::random::{Self, Random};

    /// Error codes
    const E_INVALID_POSITION: u64 = 1;
    const E_INVALID_CELL_TYPE: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_GAME_NOT_FOUND: u64 = 4;
    const E_INVALID_DICE_RANGE: u64 = 5;
    const E_INVALID_PIECE_COUNT: u64 = 6;
    const E_INVALID_POINTS: u64 = 7;
    const E_GAME_FULL: u64 = 8;
    const E_NOT_YOUR_TURN: u64 = 9;
    const E_GAME_FINISHED: u64 = 10;
    const E_INSUFFICIENT_STAKE: u64 = 11;
    #[allow(unused_const)]
    const E_PIECE_DIED: u64 = 12;
    const E_INVALID_MOVE: u64 = 13;

    /// Cell types for 10x10 board
    const CELL_TYPE_PASSABLE: u8 = 0;    // 말이 지나갈 수 있는 칸
    const CELL_TYPE_BLOCKED: u8 = 1;     // 벽 (말이 지나갈 수 없음)
    const CELL_TYPE_BOMB: u8 = 2;        // 폭탄 칸 (도착하면 죽음)
    const CELL_TYPE_START: u8 = 3;       // 출발점
    const CELL_TYPE_FINISH: u8 = 4;      // 도착점

    /// Game states
    const GAME_STATE_WAITING: u8 = 0;    // 플레이어 대기 중
    const GAME_STATE_PLAYING: u8 = 1;    // 게임 진행 중
    const GAME_STATE_FINISHED: u8 = 2;   // 게임 종료

    /// 게임 템플릿 (런치패드에서 생성)
    public struct GameTemplate has key, store {
        id: UID,
        creator: address,
        name: String,
        description: String,

        // 10x10 보드 설정 (0-99 인덱스)
        board_cells: Table<u8, u8>,  // position -> cell_type

        // 게임 규칙 설정
        dice_min: u8,                // 주사위 최소값 (예: 1)
        dice_max: u8,                // 주사위 최대값 (예: 10)
        pieces_per_player: u8,       // 플레이어당 말 개수 (1-5)

        // 시작점과 도착점
        start_positions: vector<u8>, // 출발점 위치들
        finish_positions: vector<u8>, // 도착점 위치들

        // 경제 설정
        stake_amount: u64,           // 게임 참가비 (SUI)

        created_at: u64,
        is_active: bool,
    }

    /// 실제 게임 인스턴스 (게임 플레이용)
    public struct GameInstance has key {
        id: UID,
        template_id: ID,             // 어떤 템플릿 기반인지

        // 플레이어
        player1: Option<address>,
        player2: Option<address>,
        current_player: u8,          // 1 or 2

        // 게임 상태
        state: u8,                   // WAITING, PLAYING, FINISHED
        winner: Option<address>,

        // 말들의 위치 (player -> piece_index -> position)
        player1_pieces: Table<u8, u8>, // piece_index -> board_position
        player2_pieces: Table<u8, u8>,

        // 죽은 말들 (폭탄에 당한 말들)
        player1_dead_pieces: vector<u8>, // piece indices
        player2_dead_pieces: vector<u8>,

        // 도착한 말들
        player1_finished_pieces: vector<u8>,
        player2_finished_pieces: vector<u8>,

        // 판돈
        stake_pool: Balance<SUI>,

        // 게임 히스토리
        turn_count: u64,
        last_dice_roll: Option<u8>,

        created_at: u64,
    }

    /// 말 위치 정보
    #[allow(unused_field)]
    public struct PiecePosition has copy, drop, store {
        player: u8,
        piece_index: u8,
        position: u8,
    }

    /// Events
    public struct TemplateCreated has copy, drop {
        template_id: ID,
        creator: address,
        name: String,
        timestamp: u64,
    }

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

    /// 게임 템플릿 생성 (런치패드 기능)
    public entry fun create_game_template(
        name: vector<u8>,
        description: vector<u8>,
        dice_min: u8,
        dice_max: u8,
        pieces_per_player: u8,
        stake_amount: u64,
        ctx: &mut TxContext
    ) {
        // 유효성 검사
        assert!(dice_min >= 1 && dice_max <= 20 && dice_min <= dice_max, E_INVALID_DICE_RANGE);
        assert!(pieces_per_player >= 1 && pieces_per_player <= 5, E_INVALID_PIECE_COUNT);

        let mut template = GameTemplate {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            board_cells: table::new(ctx),
            dice_min,
            dice_max,
            pieces_per_player,
            start_positions: vector::empty(),
            finish_positions: vector::empty(),
            stake_amount,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            is_active: true,
        };

        let template_id = object::id(&template);

        // 기본적으로 모든 칸을 PASSABLE로 초기화
        let mut i = 0;
        while (i < 100) {
            table::add(&mut template.board_cells, i, CELL_TYPE_PASSABLE);
            i = i + 1;
        };

        // 템플릿을 공유 객체로 만들어서 누구나 게임을 시작할 수 있도록
        transfer::share_object(template);

        event::emit(TemplateCreated {
            template_id,
            creator: tx_context::sender(ctx),
            name: string::utf8(name),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// 보드 셀 설정 (런치패드 기능)
    public entry fun set_board_cell(
        template: &mut GameTemplate,
        position: u8,
        cell_type: u8,
        ctx: &mut TxContext
    ) {
        // 권한 확인
        assert!(tx_context::sender(ctx) == template.creator, E_UNAUTHORIZED);
        assert!(position < 100, E_INVALID_POSITION);
        assert!(cell_type <= CELL_TYPE_FINISH, E_INVALID_CELL_TYPE);

        // 셀 타입 업데이트
        if (table::contains(&template.board_cells, position)) {
            let cell_ref = table::borrow_mut(&mut template.board_cells, position);
            *cell_ref = cell_type;
        } else {
            table::add(&mut template.board_cells, position, cell_type);
        };
    }

    /// 여러 셀을 한번에 설정 (효율성을 위해)
    public entry fun set_multiple_cells(
        template: &mut GameTemplate,
        positions: vector<u8>,
        cell_types: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == template.creator, E_UNAUTHORIZED);
        assert!(vector::length(&positions) == vector::length(&cell_types), E_INVALID_POSITION);

        let mut i = 0;
        let len = vector::length(&positions);
        while (i < len) {
            let pos = *vector::borrow(&positions, i);
            let cell_type = *vector::borrow(&cell_types, i);

            assert!(pos < 100, E_INVALID_POSITION);
            assert!(cell_type <= CELL_TYPE_FINISH, E_INVALID_CELL_TYPE);

            if (table::contains(&template.board_cells, pos)) {
                let cell_ref = table::borrow_mut(&mut template.board_cells, pos);
                *cell_ref = cell_type;
            } else {
                table::add(&mut template.board_cells, pos, cell_type);
            };

            i = i + 1;
        };
    }

    /// 시작점 설정
    public entry fun set_start_positions(
        template: &mut GameTemplate,
        positions: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == template.creator, E_UNAUTHORIZED);
        assert!(vector::length(&positions) > 0, E_INVALID_POINTS);

        // 기존 시작점들을 일반 칸으로 되돌리기
        let mut i = 0;
        let old_len = vector::length(&template.start_positions);
        while (i < old_len) {
            let old_pos = *vector::borrow(&template.start_positions, i);
            if (table::contains(&template.board_cells, old_pos)) {
                let cell_ref = table::borrow_mut(&mut template.board_cells, old_pos);
                *cell_ref = CELL_TYPE_PASSABLE;
            };
            i = i + 1;
        };

        // 새로운 시작점 설정
        template.start_positions = positions;
        let mut j = 0;
        let new_len = vector::length(&positions);
        while (j < new_len) {
            let pos = *vector::borrow(&positions, j);
            assert!(pos < 100, E_INVALID_POSITION);

            if (table::contains(&template.board_cells, pos)) {
                let cell_ref = table::borrow_mut(&mut template.board_cells, pos);
                *cell_ref = CELL_TYPE_START;
            } else {
                table::add(&mut template.board_cells, pos, CELL_TYPE_START);
            };
            j = j + 1;
        };
    }

    /// 도착점 설정
    public entry fun set_finish_positions(
        template: &mut GameTemplate,
        positions: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == template.creator, E_UNAUTHORIZED);
        assert!(vector::length(&positions) > 0, E_INVALID_POINTS);

        // 기존 도착점들을 일반 칸으로 되돌리기
        let mut i = 0;
        let old_len = vector::length(&template.finish_positions);
        while (i < old_len) {
            let old_pos = *vector::borrow(&template.finish_positions, i);
            if (table::contains(&template.board_cells, old_pos)) {
                let cell_ref = table::borrow_mut(&mut template.board_cells, old_pos);
                *cell_ref = CELL_TYPE_PASSABLE;
            };
            i = i + 1;
        };

        // 새로운 도착점 설정
        template.finish_positions = positions;
        let mut j = 0;
        let new_len = vector::length(&positions);
        while (j < new_len) {
            let pos = *vector::borrow(&positions, j);
            assert!(pos < 100, E_INVALID_POSITION);

            if (table::contains(&template.board_cells, pos)) {
                let cell_ref = table::borrow_mut(&mut template.board_cells, pos);
                *cell_ref = CELL_TYPE_FINISH;
            } else {
                table::add(&mut template.board_cells, pos, CELL_TYPE_FINISH);
            };
            j = j + 1;
        };
    }

    /// 게임 시작 (1vs1 매칭)
    public entry fun start_game(
        template: &GameTemplate,
        stake: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 템플릿 활성화 확인
        assert!(template.is_active, E_GAME_NOT_FOUND);

        // 판돈 확인
        let stake_value = coin::value(&stake);
        assert!(stake_value >= template.stake_amount, E_INSUFFICIENT_STAKE);

        let mut game = GameInstance {
            id: object::new(ctx),
            template_id: object::id(template),
            player1: option::some(tx_context::sender(ctx)),
            player2: option::none(),
            current_player: 1,
            state: GAME_STATE_WAITING,
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
        assert!(stake_value >= template.stake_amount, E_INSUFFICIENT_STAKE);

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

    /// 주사위 굴리기 및 말 이동
    #[allow(lint(public_random))]
    public entry fun roll_dice_and_move(
        game: &mut GameInstance,
        template: &GameTemplate,
        piece_index: u8,
        r: &Random,
        ctx: &mut TxContext
    ) {
        // 게임 상태 확인
        assert!(game.state == GAME_STATE_PLAYING, E_GAME_FINISHED);

        let player = tx_context::sender(ctx);
        let current_player_num = get_player_number(game, player);
        assert!(current_player_num == game.current_player, E_NOT_YOUR_TURN);
        assert!(piece_index < template.pieces_per_player, E_INVALID_MOVE);

        // 주사위 굴리기
        let mut gen = random::new_generator(r, ctx);
        let dice_range = (template.dice_max - template.dice_min + 1) as u16;
        let dice_value = (random::generate_u16(&mut gen) % dice_range) as u8 + template.dice_min;

        game.last_dice_roll = option::some(dice_value);

        // 말 이동
        move_piece(game, template, current_player_num, piece_index, dice_value, ctx);

        // 턴 전환
        game.current_player = if (game.current_player == 1) { 2 } else { 1 };
        game.turn_count = game.turn_count + 1;

        event::emit(DiceRolled {
            game_id: object::id(game),
            player,
            dice_value,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

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

        let cell_type = *table::borrow(&template.board_cells, new_pos);
        assert!(cell_type != CELL_TYPE_BLOCKED, E_INVALID_MOVE);

        // 말 이동
        let piece_ref = table::borrow_mut(pieces_table, piece_index);
        *piece_ref = new_pos;

        event::emit(PieceMoved {
            game_id: object::id(game),
            player: get_player_address(game, player_num),
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
        let cell_type = *table::borrow(&template.board_cells, position);

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
                player: get_player_address(game, player_num),
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
        let start_pos = if (vector::length(&template.start_positions) > 0) {
            *vector::borrow(&template.start_positions, 0)
        } else {
            0 // 기본 시작점
        };

        let mut i = 0;
        while (i < template.pieces_per_player) {
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

        // 모든 말이 도착하면 승리
        if (p1_finished == (template.pieces_per_player as u64)) {
            declare_winner(game, 1, ctx);
        } else if (p2_finished == (template.pieces_per_player as u64)) {
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
    public fun get_template_info(template: &GameTemplate): (String, String, u8, u8, u8, u64) {
        (template.name, template.description, template.dice_min, template.dice_max,
         template.pieces_per_player, template.stake_amount)
    }

    public fun get_game_state(game: &GameInstance): (u8, Option<address>, u8, u64) {
        (game.state, game.winner, game.current_player, game.turn_count)
    }

    public fun get_board_cell(template: &GameTemplate, position: u8): u8 {
        *table::borrow(&template.board_cells, position)
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