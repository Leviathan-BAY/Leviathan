import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { TESTNET_CONTRACTS, MODULES, HSUI_FUNCTIONS, buildModuleCall } from '../config/contracts';

// Create Sui client instance
// Note: Using testnet since user has SUI there
export const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet')
});

// Real contract mode - contracts are now deployed!
const MOCK_MODE = false;

// Helper function to get user's SUI balance
export async function getUserSuiBalance(address: string): Promise<number> {
  try {
    console.log('Fetching SUI balance for address:', address);
    const balance = await suiClient.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI'
    });
    console.log('SUI balance response:', balance);
    const suiAmount = parseInt(balance.totalBalance) / 1_000_000_000; // Convert from MIST to SUI
    console.log('Converted SUI amount:', suiAmount);
    return suiAmount;
  } catch (error) {
    console.error('Error fetching SUI balance:', error);
    return 0;
  }
}

// Helper function to get user's hSUI balance
export async function getUserHSuiBalance(address: string): Promise<number> {
  if (MOCK_MODE) {
    // Mock hSUI balance for testing
    console.log('Mock mode: returning mock hSUI balance');
    return 5.25; // Mock balance
  }

  try {
    const balance = await suiClient.getBalance({
      owner: address,
      coinType: `${TESTNET_CONTRACTS.PACKAGE_ID}::hsui::HSUI`
    });
    return parseInt(balance.totalBalance) / 1_000_000_000; // Convert from MIST to hSUI
  } catch (error) {
    console.error('Error fetching hSUI balance:', error);
    return 0;
  }
}

// Get vault information
export async function getVaultInfo() {
  if (MOCK_MODE) {
    // Mock vault data for testing
    console.log('Mock mode: returning mock vault info');
    return {
      suiBalance: 1000,
      hsuiSupply: 950,
      exchangeRate: 1.001,
      feeRate: 0.005, // 0.5%
      totalDeposits: 1200,
      totalWithdrawals: 200,
    };
  }

  try {
    console.log('Fetching vault info for:', TESTNET_CONTRACTS.HSUI_VAULT);
    const result = await suiClient.getObject({
      id: TESTNET_CONTRACTS.HSUI_VAULT,
      options: {
        showContent: true,
        showOwner: true,
        showType: true,
      }
    });

    console.log('Vault object result:', result);

    if (result.data && result.data.content && 'fields' in result.data.content) {
      const fields = result.data.content.fields as any;
      console.log('Vault fields:', fields);
      return {
        suiBalance: parseInt(fields.sui_balance) / 1_000_000_000,
        hsuiSupply: parseInt(fields.hsui_supply) / 1_000_000_000,
        exchangeRate: parseInt(fields.exchange_rate) / 10000,
        feeRate: parseInt(fields.fee_rate) / 10000,
        totalDeposits: parseInt(fields.total_deposits) / 1_000_000_000,
        totalWithdrawals: parseInt(fields.total_withdrawals) / 1_000_000_000,
      };
    }
    console.error('Vault object not found or invalid structure');
    return null;
  } catch (error) {
    console.error('Error fetching vault info:', error);
    return null;
  }
}

// Create transaction to deposit SUI for hSUI
export function createDepositTransaction(amount: number): Transaction {
  const tx = new Transaction();

  // Convert SUI to MIST (multiply by 1e9)
  const amountInMist = Math.floor(amount * 1_000_000_000);

  // Split SUI from gas coin
  const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

  // Call deposit_sui function
  tx.moveCall({
    target: buildModuleCall(MODULES.HSUI, HSUI_FUNCTIONS.DEPOSIT_SUI),
    arguments: [
      tx.object(TESTNET_CONTRACTS.HSUI_VAULT),
      coin
    ]
  });

  return tx;
}

// Create transaction to redeem hSUI for SUI
export async function createRedeemTransaction(amount: number, userAddress: string): Promise<Transaction> {
  const tx = new Transaction();

  // Convert hSUI to MIST (multiply by 1e9)
  const amountInMist = Math.floor(amount * 1_000_000_000);

  // Get user's hSUI coins
  const hsuiCoins = await suiClient.getCoins({
    owner: userAddress,
    coinType: `${TESTNET_CONTRACTS.PACKAGE_ID}::hsui::HSUI`,
  });

  if (hsuiCoins.data.length === 0) {
    throw new Error('No hSUI coins found');
  }

  // Take the exact amount we need from the user's hSUI coins
  const [coin] = tx.splitCoins(tx.object(hsuiCoins.data[0].coinObjectId), [amountInMist]);

  // Call redeem_hsui function
  tx.moveCall({
    target: buildModuleCall(MODULES.HSUI, HSUI_FUNCTIONS.REDEEM_HSUI),
    arguments: [
      tx.object(TESTNET_CONTRACTS.HSUI_VAULT),
      coin
    ]
  });

  return tx;
}

// Calculate how much hSUI will be received for SUI amount
export async function calculateHSuiOutput(suiAmount: number): Promise<number> {
  const vaultInfo = await getVaultInfo();
  if (!vaultInfo) return suiAmount; // Fallback to 1:1 ratio

  return suiAmount * vaultInfo.exchangeRate;
}

// Calculate how much SUI will be received for hSUI amount (after fees)
export async function calculateSuiOutput(hsuiAmount: number): Promise<{ suiAmount: number; fee: number }> {
  const vaultInfo = await getVaultInfo();
  if (!vaultInfo) return { suiAmount: hsuiAmount, fee: 0 }; // Fallback

  const baseAmount = hsuiAmount / vaultInfo.exchangeRate;
  const fee = baseAmount * vaultInfo.feeRate;
  const suiAmount = baseAmount - fee;

  return { suiAmount, fee };
}

// Get user's transaction history (simplified version)
export async function getUserTransactionHistory(address: string) {
  try {
    // Get recent transactions for the user
    const transactions = await suiClient.queryTransactionBlocks({
      filter: {
        FromAddress: address,
      },
      options: {
        showEvents: true,
        showInput: true,
        showEffects: true,
      },
      limit: 10,
    });

    return transactions.data
      .filter(tx => {
        // Filter for hSUI related transactions
        return tx.events?.some(event =>
          event.type.includes('hsui') &&
          (event.type.includes('SuiDeposited') || event.type.includes('HSuiRedeemed'))
        );
      })
      .map(tx => {
        const event = tx.events?.find(e =>
          e.type.includes('SuiDeposited') || e.type.includes('HSuiRedeemed')
        );

        if (!event || !event.parsedJson) return null;

        const data = event.parsedJson as any;
        const isStaking = event.type.includes('SuiDeposited');

        return {
          id: tx.digest,
          type: isStaking ? 'stake' : 'unstake',
          amount: isStaking
            ? (parseInt(data.sui_amount) / 1_000_000_000).toString()
            : (parseInt(data.hsui_burned) / 1_000_000_000).toString(),
          received: isStaking
            ? (parseInt(data.hsui_minted) / 1_000_000_000).toString()
            : (parseInt(data.sui_returned) / 1_000_000_000).toString(),
          date: new Date(data.timestamp).toLocaleString(),
          status: 'completed',
          hash: tx.digest
        };
      })
      .filter(tx => tx !== null);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}