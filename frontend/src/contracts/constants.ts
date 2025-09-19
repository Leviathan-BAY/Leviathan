// Contract addresses and constants for Leviathan platform
// These will be updated with actual deployed contract addresses

export const CONTRACT_ADDRESSES = {
  // Mock addresses for development - replace with actual deployed addresses
  HERMIT_FINANCE: "0x0000000000000000000000000000000000000000000000000000000000000001",
  GAME_LAUNCHPAD: "0x0000000000000000000000000000000000000000000000000000000000000002",
  GAME_MAKER: "0x0000000000000000000000000000000000000000000000000000000000000003",
  MATCH_SETTLEMENT: "0x0000000000000000000000000000000000000000000000000000000000000004",
  GAME_ENGINE: "0x0000000000000000000000000000000000000000000000000000000000000005"
} as const;

export const PACKAGE_ID = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Cell types from game_maker.move
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
  MAX_BOARD_CELLS: 25
} as const;

// Function names for contract calls
export const CONTRACT_FUNCTIONS = {
  // Hermit Finance
  DEPOSIT_SUI: "deposit_sui",
  WITHDRAW_HSUI: "withdraw_hsui",
  GET_EXCHANGE_RATE: "get_exchange_rate",

  // Game Maker
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

// Mock game data for development
export const MOCK_GAMES = [
  {
    id: "game_1",
    title: "5x5 Yut Nori",
    description: "Traditional Korean board game with modern Web3 features",
    creator: "0x123...",
    category: "Board Game",
    thumbnail: "/images/game1.png",
    totalPlays: 42,
    totalStaked: 1000,
    isActive: true,
    joinFee: 100, // in mist
    maxPlayers: 4
  },
  {
    id: "game_2",
    title: "Card Battle Arena",
    description: "Strategic card game with NFT integration",
    creator: "0x456...",
    category: "Card Game",
    thumbnail: "/images/game2.png",
    totalPlays: 128,
    totalStaked: 5000,
    isActive: true,
    joinFee: 250,
    maxPlayers: 2
  },
  {
    id: "game_3",
    title: "Token Track Race",
    description: "Racing game with token mechanics",
    creator: "0x789...",
    category: "Racing",
    thumbnail: "/images/game3.png",
    totalPlays: 89,
    totalStaked: 3200,
    isActive: true,
    joinFee: 150,
    maxPlayers: 6
  }
] as const;

// Event names for listening to contract events
export const CONTRACT_EVENTS = {
  // Hermit Finance
  DEPOSIT_EVENT: "DepositEvent",
  WITHDRAW_EVENT: "WithdrawEvent",

  // Game Maker
  GAME_CREATED: "GameCreated",
  GAME_UPDATED: "GameUpdated",
  COMPONENT_ADDED: "ComponentAdded",

  // Game Launchpad
  GAME_PUBLISHED: "GamePublished",
  LAUNCH_FEE_UPDATED: "LaunchFeeUpdated",

  // Game Engine
  GAME_CREATED_ENGINE: "GameCreated",
  ACTION_PERFORMED: "ActionPerformed",
  GAME_ENDED: "GameEnded"
} as const;

// Network configuration
export const NETWORK = {
  DEVNET: "devnet",
  TESTNET: "testnet",
  MAINNET: "mainnet"
} as const;