// Sui Testnet Contract Addresses
export const TESTNET_CONTRACTS = {
  // Package ID containing all modules
  PACKAGE_ID: '0xff744af12fc4de6eae0af442ec787adbab873a9f18b36efcb95591d1f1e95f41',

  // hSUI System
  HSUI_VAULT: '0x8885b711d44b78b4e7b01b6af0f469853ed02f6e7e7f699cee75e4563cf6e5de',
  ADMIN_CAP: '0xad0b33ed7b5acb027c4b6b86bd10b942fe2d33e495469d31e53ab56374b23c26',

  // Game System
  GAME_REGISTRY: '0x0bf6e2b278866cc12754f6ad9d278ba7848bd31bcb4f4af6c2b94c7e5d70adb4',

  // Network Configuration
  NETWORK: 'testnet' as const,
  RPC_URL: 'https://fullnode.testnet.sui.io:443',
} as const;

// Module Names
export const MODULES = {
  HSUI: 'hsui',
  GAME_REGISTRY: 'game_registry',
  BOARD_GAME_LAUNCHER: 'board_game_launcher',
  BOARD_GAME_MAKER: 'board_game_maker',
  CARD_POKER_GAME_LAUNCHER: 'card_poker_game_launcher',
  CARD_POKER_GAME_MAKER: 'card_poker_game_maker',
} as const;

// Function Names for hSUI module
export const HSUI_FUNCTIONS = {
  DEPOSIT_SUI: 'deposit_sui',
  REDEEM_HSUI: 'redeem_hsui',
  GET_VAULT_INFO: 'get_vault_info',
  CALCULATE_HSUI_OUTPUT: 'calculate_hsui_output',
  CALCULATE_SUI_OUTPUT: 'calculate_sui_output',
  GET_EXCHANGE_RATE: 'get_exchange_rate',
} as const;

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  testnet: TESTNET_CONTRACTS,
  // Add mainnet addresses when available
  // mainnet: MAINNET_CONTRACTS,
} as const;

export type NetworkType = keyof typeof CONTRACT_ADDRESSES;

// Helper function to get contract addresses for current network
export function getContractAddresses(network: NetworkType = 'testnet') {
  return CONTRACT_ADDRESSES[network];
}

// Helper function to build module call identifier
export function buildModuleCall(moduleName: string, functionName: string, network: NetworkType = 'testnet') {
  const contracts = getContractAddresses(network);
  return `${contracts.PACKAGE_ID}::${moduleName}::${functionName}`;
}