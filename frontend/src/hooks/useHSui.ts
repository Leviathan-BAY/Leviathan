import { useState, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserSuiBalance,
  getUserHSuiBalance,
  getVaultInfo,
  calculateHSuiOutput,
  calculateSuiOutput,
  createDepositTransaction,
  createRedeemTransaction,
  getUserTransactionHistory
} from '../utils/suiClient';

export interface HSuiTransaction {
  id: string;
  type: 'stake' | 'unstake';
  amount: string;
  received: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
}

export function useHSui() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's SUI balance
  const { data: suiBalance = 0, refetch: refetchSuiBalance } = useQuery({
    queryKey: ['suiBalance', account?.address],
    queryFn: () => account ? getUserSuiBalance(account.address) : Promise.resolve(0),
    enabled: !!account,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch user's hSUI balance
  const { data: hsuiBalance = 0, refetch: refetchHSuiBalance } = useQuery({
    queryKey: ['hsuiBalance', account?.address],
    queryFn: () => account ? getUserHSuiBalance(account.address) : Promise.resolve(0),
    enabled: !!account,
    refetchInterval: 10000,
  });

  // Fetch vault information
  const { data: vaultInfo, refetch: refetchVaultInfo } = useQuery({
    queryKey: ['vaultInfo'],
    queryFn: getVaultInfo,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch transaction history
  const { data: transactionHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['hsuiHistory', account?.address],
    queryFn: () => account ? getUserTransactionHistory(account.address) : Promise.resolve([]),
    enabled: !!account,
    refetchInterval: 15000,
  });

  // Calculate exchange rates
  const calculateStakeOutput = useCallback(async (amount: number) => {
    if (!amount || amount <= 0) return 0;
    return calculateHSuiOutput(amount);
  }, []);

  const calculateUnstakeOutput = useCallback(async (amount: number) => {
    if (!amount || amount <= 0) return { suiAmount: 0, fee: 0 };
    return calculateSuiOutput(amount);
  }, []);

  // Stake SUI for hSUI
  const stakeSui = useCallback(async (amount: number) => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (amount > suiBalance) {
      setError('Insufficient SUI balance');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Real contract mode - contracts are now deployed!
      const MOCK_MODE = false;

      if (MOCK_MODE) {
        // Simulate transaction time
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Mock staking successful for amount:', amount);

        // Refetch balances (they'll show updated values)
        await Promise.all([
          refetchSuiBalance(),
          refetchHSuiBalance(),
          refetchVaultInfo(),
          refetchHistory()
        ]);

        setIsLoading(false);
        return true;
      }

      const transaction = createDepositTransaction(amount);

      return new Promise<boolean>((resolve) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: async (result) => {
              console.log('Staking successful:', result);

              // Refetch balances and history
              await Promise.all([
                refetchSuiBalance(),
                refetchHSuiBalance(),
                refetchVaultInfo(),
                refetchHistory()
              ]);

              setIsLoading(false);
              resolve(true);
            },
            onError: (error) => {
              console.error('Staking failed:', error);
              setError(error.message || 'Staking transaction failed');
              setIsLoading(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error('Error creating staking transaction:', error);
      setError('Failed to create transaction');
      setIsLoading(false);
      return false;
    }
  }, [account, suiBalance, signAndExecuteTransaction, refetchSuiBalance, refetchHSuiBalance, refetchVaultInfo, refetchHistory]);

  // Unstake hSUI for SUI
  const unstakeHSui = useCallback(async (amount: number) => {
    if (!account) {
      setError('Please connect your wallet');
      return false;
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (amount > hsuiBalance) {
      setError('Insufficient hSUI balance');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Real contract mode - contracts are now deployed!
      const MOCK_MODE = false;

      if (MOCK_MODE) {
        // Simulate transaction time
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Mock unstaking successful for amount:', amount);

        // Refetch balances (they'll show updated values)
        await Promise.all([
          refetchSuiBalance(),
          refetchHSuiBalance(),
          refetchVaultInfo(),
          refetchHistory()
        ]);

        setIsLoading(false);
        return true;
      }

      const transaction = await createRedeemTransaction(amount, account.address);

      return new Promise<boolean>((resolve) => {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: async (result) => {
              console.log('Unstaking successful:', result);

              // Refetch balances and history
              await Promise.all([
                refetchSuiBalance(),
                refetchHSuiBalance(),
                refetchVaultInfo(),
                refetchHistory()
              ]);

              setIsLoading(false);
              resolve(true);
            },
            onError: (error) => {
              console.error('Unstaking failed:', error);
              setError(error.message || 'Unstaking transaction failed');
              setIsLoading(false);
              resolve(false);
            },
          }
        );
      });
    } catch (error) {
      console.error('Error creating unstaking transaction:', error);
      setError('Failed to create transaction');
      setIsLoading(false);
      return false;
    }
  }, [account, hsuiBalance, signAndExecuteTransaction, refetchSuiBalance, refetchHSuiBalance, refetchVaultInfo, refetchHistory]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchSuiBalance(),
      refetchHSuiBalance(),
      refetchVaultInfo(),
      refetchHistory()
    ]);
  }, [refetchSuiBalance, refetchHSuiBalance, refetchVaultInfo, refetchHistory]);

  return {
    // Balances
    suiBalance,
    hsuiBalance,

    // Vault info
    vaultInfo,

    // Transaction history
    transactionHistory: transactionHistory as HSuiTransaction[],

    // State
    isLoading,
    error,

    // Actions
    stakeSui,
    unstakeHSui,
    calculateStakeOutput,
    calculateUnstakeOutput,
    clearError,
    refreshData,

    // Utils
    isConnected: !!account,
  };
}