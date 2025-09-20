// Contract addresses and constants for Leviathan platform
// These will be updated with actual deployed contract addresses

// Main package ID - update this when contracts are deployed
export const PACKAGE_ID = "0x76be803ab8660d9087dd4b1e5ffd7b075772ebf1d6607070690f277707c37fb6";

// Object IDs for deployed contracts - update when deployed
export const CONTRACT_OBJECTS = {
  // hSUI Vault object ID
  HSUI_VAULT: "0xeac6161403e0c82a54ae5dfb2125ead64eaada834ee09e80e21e108d231e42fd",
  // hSUI Admin Cap object ID
  HSUI_ADMIN_CAP: "0xcf6f069de322507e795e3941ab6caf63bff4f40046dddd708fc5952ddae5d81b",
  // Game Launchpad object ID (if exists)
} as const;

// Cell types from board_game_maker.move (for board game templates)
export const BOARD_CELL_TYPES = {
  PASSABLE: 0,    // 말이 지나갈 수 있는 칸
  BLOCKED: 1,     // 벽 (말이 지나갈 수 없음)
  BOMB: 2,        // 폭탄 칸 (도착하면 죽음)
  START: 3,       // 출발점
  FINISH: 4       // 도착점
} as const;

// Original cell types for game components (cards/tokens)
export const CELL_TYPES = {
  IMAGE: 0,
  DECK: 1,
  TRACK: 2
} as const;

// Space types from game_maker.move
export const SPACE_TYPES = {
  HAND: 0,
  SHARED_BOARD: 1,
  PRIVATE_AREA: 2
} as const;

// Movement types from game_maker.move
export const MOVEMENT_TYPES = {
  DIRECT_MAPPING: 0,
  DISTANCE_BASED: 1
} as const;

// Game configuration limits
export const GAME_LIMITS = {
  MAX_HAND_SLOTS: 20,
  MIN_PRIVATE_AREA_SLOTS: 3,
  MAX_PRIVATE_AREA_SLOTS: 5,
  BOARD_SIZE: 5, // 5x5 shared board
  MAX_BOARD_CELLS: 25,
  // Board game template limits
  BOARD_GAME_SIZE: 10, // 10x10 board for the new system
  MAX_BOARD_GAME_CELLS: 100,
  MIN_DICE_VALUE: 1,
  MAX_DICE_VALUE: 20,
  MIN_PIECES_PER_PLAYER: 1,
  MAX_PIECES_PER_PLAYER: 5
} as const;

// Function names for contract calls
export const CONTRACT_FUNCTIONS = {
  // Hermit Finance (hSUI)
  DEPOSIT_SUI: "deposit_sui",
  REDEEM_HSUI: "redeem_hsui",
  UPDATE_EXCHANGE_RATE: "update_exchange_rate",
  UPDATE_FEE_RATE: "update_fee_rate",
  GET_VAULT_INFO: "get_vault_info",

  // Board Game Maker - Template creation and configuration functions
  CREATE_GAME_TEMPLATE: "create_game_template",
  SET_BOARD_CELL: "set_board_cell",
  SET_MULTIPLE_CELLS: "set_multiple_cells",
  SET_START_POSITIONS: "set_start_positions",
  SET_FINISH_POSITIONS: "set_finish_positions",

  // Board Game Launcher - Game instance and gameplay functions
  START_GAME: "start_game",
  JOIN_GAME: "join_game",
  ROLL_DICE_AND_MOVE: "roll_dice_and_move",

  // Card Game Maker - Card/token functions (for future card games)
  CREATE_GAME_COMPONENTS: "create_game_components",
  CONFIGURE_SHARED_BOARD_CELL: "configure_shared_board_cell",
  CREATE_CARD: "create_card",
  CREATE_TOKEN: "create_token",
  CREATE_COUNTER: "create_counter",
  CREATE_FLAG: "create_flag",
  SET_WALRUS_REFERENCE: "set_walrus_reference",
  FLIP_CARD: "flip_card",
  FLIP_TOKEN: "flip_token",
  UPDATE_COUNTER: "update_counter",
  UPDATE_FLAG: "update_flag",
  ADD_MOVEMENT_RULES: "add_movement_rules",
  ADD_DIRECT_MAPPING: "add_direct_mapping",

  // Game Launchpad
  PUBLISH_GAME: "publish_game",
  UPDATE_GAME_STATS: "update_game_stats",
  SET_LAUNCH_FEE: "set_launch_fee",
  DEACTIVATE_GAME: "deactivate_game",

  // Game Engine
  CREATE_TEMPLATE: "create_template",
  CREATE_INSTANCE: "create_instance",
  ACT: "act",
  FINALIZE: "finalize"
} as const;

// Default game configuration
export const DEFAULT_GAME_CONFIG = {
  handSlots: 10,
  privateAreaSlots: 3,
  boardRows: 5,
  boardCols: 5,
  title: "My Game"
} as const;

// Mock board game templates for development
export const MOCK_BOARD_GAME_TEMPLATES = [
  {
    id: "template_1",
    name: "Classic Racing Track",
    description: "Traditional racing game with obstacles and power-ups",
    creator: "0x123abc...",
    diceMin: 1,
    diceMax: 6,
    piecesPerPlayer: 3,
    stakeAmount: 1000000000, // 1 SUI in mist
    totalGames: 42,
    totalStaked: 42000000000, // 42 SUI
    isActive: true,
    createdAt: Date.now() - 86400000 // 1 day ago
  },
  {
    id: "template_2",
    name: "Bomb Maze Challenge",
    description: "Navigate through dangerous maze filled with bombs",
    creator: "0x456def...",
    diceMin: 1,
    diceMax: 8,
    piecesPerPlayer: 2,
    stakeAmount: 500000000, // 0.5 SUI
    totalGames: 28,
    totalStaked: 14000000000, // 14 SUI
    isActive: true,
    createdAt: Date.now() - 172800000 // 2 days ago
  },
  {
    id: "template_3",
    name: "Speed Runner",
    description: "Fast-paced racing with high dice values",
    creator: "0x789ghi...",
    diceMin: 3,
    diceMax: 12,
    piecesPerPlayer: 1,
    stakeAmount: 2000000000, // 2 SUI
    totalGames: 15,
    totalStaked: 30000000000, // 30 SUI
    isActive: true,
    createdAt: Date.now() - 259200000 // 3 days ago
  }
] as const;

// Event names for listening to contract events
export const CONTRACT_EVENTS = {
  // Hermit Finance (hSUI)
  SUI_DEPOSITED: "SuiDeposited",
  HSUI_REDEEMED: "HSuiRedeemed",

  // Board Game Maker
  TEMPLATE_CREATED: "TemplateCreated",
  GAME_STARTED: "GameStarted",
  DICE_ROLLED: "DiceRolled",
  PIECE_MOVED: "PieceMoved",
  PIECE_DIED: "PieceDied",
  GAME_FINISHED: "GameFinished",

  // Game Launchpad
  GAME_PUBLISHED: "GamePublished",
  LAUNCH_FEE_UPDATED: "LaunchFeeUpdated"
} as const;

// Network configuration
export const NETWORK = {
  DEVNET: "devnet",
  TESTNET: "testnet",
  MAINNET: "mainnet"
} as const;