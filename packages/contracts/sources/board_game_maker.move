/// Leviathan Board Game Maker - 10x10 Customizable Board Game System
/// 해커톤용 1vs1 턴제 보드게임 템플릿 제작
module leviathan::board_game_maker {
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};

    /// Error codes
    const E_INVALID_POSITION: u64 = 1;
    const E_INVALID_CELL_TYPE: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_INVALID_DICE_RANGE: u64 = 5;
    const E_INVALID_PIECE_COUNT: u64 = 6;
    const E_INVALID_POINTS: u64 = 7;

    /// Cell types for 10x10 board
    const CELL_TYPE_PASSABLE: u8 = 0;    // 말이 지나갈 수 있는 칸
    const CELL_TYPE_BLOCKED: u8 = 1;     // 벽 (말이 지나갈 수 없음)
    const CELL_TYPE_BOMB: u8 = 2;        // 폭탄 칸 (도착하면 죽음)
    const CELL_TYPE_START: u8 = 3;       // 출발점
    const CELL_TYPE_FINISH: u8 = 4;      // 도착점

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


    /// Events
    public struct TemplateCreated has copy, drop {
        template_id: ID,
        creator: address,
        name: String,
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

    /// Public getter functions for board_game_launcher module
    public fun is_template_active(template: &GameTemplate): bool {
        template.is_active
    }

    public fun get_template_stake_amount(template: &GameTemplate): u64 {
        template.stake_amount
    }

    public fun get_template_pieces_per_player(template: &GameTemplate): u8 {
        template.pieces_per_player
    }

    public fun get_template_dice_range(template: &GameTemplate): (u8, u8) {
        (template.dice_min, template.dice_max)
    }

    public fun get_template_start_positions(template: &GameTemplate): vector<u8> {
        template.start_positions
    }

    /// View functions
    public fun get_template_info(template: &GameTemplate): (String, String, u8, u8, u8, u64) {
        (template.name, template.description, template.dice_min, template.dice_max,
         template.pieces_per_player, template.stake_amount)
    }

    public fun get_board_cell(template: &GameTemplate, position: u8): u8 {
        *table::borrow(&template.board_cells, position)
    }
}