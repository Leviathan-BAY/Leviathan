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

    /// 새 엔트리 함수: 한 번에 GameTemplate 생성 + 설정
    public entry fun create_full_game_template(
        name: String,
        description: String,
        dice_min: u8,
        dice_max: u8,
        pieces_per_player: u8,
        stake_amount: u64,
        board: vector<u8>,           // 길이 100, 각 위치의 cell_type
        start_positions: vector<u8>,
        finish_positions: vector<u8>,
        ctx: &mut TxContext
    ) {
        // === 1. 보드 테이블 생성 ===
        let mut table = table::new<u8, u8>(ctx);
        let mut i = 0;
        let len = vector::length(&board);
        while (i < len) {
            let cell_type = *vector::borrow(&board, i);
            if (cell_type != 0) {
                table::add(&mut table, i as u8, cell_type);
            };
            i = i + 1;
        };

        // === 2. GameTemplate 오브젝트 생성 ===
        let template = GameTemplate {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            name,
            description,
            board_cells: table,
            dice_min,
            dice_max,
            pieces_per_player,
            start_positions,
            finish_positions,
            stake_amount,
            created_at: tx_context::epoch_timestamp_ms(ctx),
            is_active: true,
        };

        // === 3. move_to로 소유자에게 발행 ===
        transfer::public_transfer(template, tx_context::sender(ctx));
    }

    /// Events
    public struct TemplateCreated has copy, drop {
        template_id: ID,
        creator: address,
        name: String,
        timestamp: u64,
    }


    /// 게임 템플릿 생성 (런치패드 기능)


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