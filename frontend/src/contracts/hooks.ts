// React hooks for contract interactions
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_ADDRESSES, MOCK_GAMES } from "./constants";
import {
  HermitFinanceTransactions,
  GameMakerTransactions,
  GameLaunchpadTransactions,
  TransactionUtils
} from "./transactions";

// Hermit Finance Hooks
export const useHermitFinance = () => {
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const depositSui = useMutation({
    mutationFn: async (amount: number) => {
      const amountMist = TransactionUtils.suiToMist(amount);
      const tx = HermitFinanceTransactions.depositSui(amountMist);

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Deposit successful:", result);
              resolve(result);
            },
            onError: (error) => {
              console.error("Deposit failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const withdrawHSui = useMutation({
    mutationFn: async (amount: number) => {
      const amountMist = TransactionUtils.suiToMist(amount);
      const tx = HermitFinanceTransactions.withdrawHSui(amountMist);

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Withdrawal successful:", result);
              resolve(result);
            },
            onError: (error) => {
              console.error("Withdrawal failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  // Mock data for now - replace with actual queries when contracts are deployed
  const vaultStats = useQuery({
    queryKey: ['hermit-finance-stats'],
    queryFn: async () => {
      // This will query actual contract data when deployed
      return {
        totalValueLocked: "1,234,567 SUI",
        currentApy: "5.2%",
        exchangeRate: "1.00",
        userBalance: "0 SUI",
        userHSuiBalance: "0 hSUI"
      };
    }
  });

  return {
    depositSui,
    withdrawHSui,
    vaultStats,
    isLoading: depositSui.isPending || withdrawHSui.isPending || vaultStats.isLoading
  };
};

// Game Maker Hooks
export const useGameMaker = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const createGame = useMutation({
    mutationFn: async (gameData: {
      title: string;
      handMaxSlots: number;
      privateAreaSlots: number;
    }) => {
      const tx = GameMakerTransactions.createGameComponents(
        gameData.title,
        gameData.handMaxSlots,
        gameData.privateAreaSlots
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Game creation successful:", result);
              resolve(result);
            },
            onError: (error) => {
              console.error("Game creation failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const configureBoardCell = useMutation({
    mutationFn: async (cellData: {
      gameId: string;
      position: number;
      cellType: number;
      backgroundImageUrl: string;
      specialEffects: string[];
    }) => {
      const tx = GameMakerTransactions.configureSharedBoardCell(
        cellData.gameId,
        cellData.position,
        cellData.cellType,
        cellData.backgroundImageUrl,
        cellData.specialEffects
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Board cell configuration successful:", result);
              resolve(result);
            },
            onError: (error) => {
              console.error("Board cell configuration failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const addCard = useMutation({
    mutationFn: async (cardData: {
      gameId: string;
      cardId: number;
      frontImageUrl: string;
      backImageUrl: string;
      symbol: string;
      number: number;
    }) => {
      const tx = GameMakerTransactions.createCard(
        cardData.gameId,
        cardData.cardId,
        cardData.frontImageUrl,
        cardData.backImageUrl,
        cardData.symbol,
        cardData.number
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log("Card creation successful:", result);
              resolve(result);
            },
            onError: (error) => {
              console.error("Card creation failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  return {
    createGame,
    configureBoardCell,
    addCard,
    isLoading: createGame.isPending || configureBoardCell.isPending || addCard.isPending
  };
};

// Game Launchpad Hooks
export const useGameLaunchpad = () => {
  const client = useSuiClient();
  const queryClient = useQueryClient();

  // Mock published games for now
  const publishedGames = useQuery({
    queryKey: ['published-games'],
    queryFn: async () => {
      // This will query actual contract data when deployed
      return MOCK_GAMES;
    }
  });

  const gameStats = useQuery({
    queryKey: ['game-stats'],
    queryFn: async () => {
      return {
        totalGames: MOCK_GAMES.length,
        totalPlays: MOCK_GAMES.reduce((sum, game) => sum + game.totalPlays, 0),
        totalValueStaked: MOCK_GAMES.reduce((sum, game) => sum + game.totalStaked, 0),
        activeGames: MOCK_GAMES.filter(game => game.isActive).length
      };
    }
  });

  const getGameById = (gameId: string) => {
    return MOCK_GAMES.find(game => game.id === gameId);
  };

  return {
    publishedGames,
    gameStats,
    getGameById,
    isLoading: publishedGames.isLoading || gameStats.isLoading
  };
};

// Generic contract interaction hook
export const useContractTransaction = () => {
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const executeTransaction = async (transaction: Transaction): Promise<any> => {
    return new Promise((resolve, reject) => {
      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            reject(error);
          }
        }
      );
    });
  };

  return {
    executeTransaction,
    isLoading: isPending
  };
};

// Wallet balance hooks
export const useWalletBalances = (address?: string) => {
  const client = useSuiClient();

  const balances = useQuery({
    queryKey: ['wallet-balances', address],
    queryFn: async () => {
      if (!address) return null;

      try {
        // Get SUI balance
        const suiBalance = await client.getBalance({ owner: address });

        // Mock hSUI balance for now
        const hSuiBalance = {
          coinType: "0x0::hermit_finance::HSUI",
          coinObjectCount: 0,
          totalBalance: "0",
          lockedBalance: {}
        };

        return {
          sui: {
            balance: TransactionUtils.mistToSui(BigInt(suiBalance.totalBalance)),
            formatted: `${TransactionUtils.mistToSui(BigInt(suiBalance.totalBalance)).toFixed(4)} SUI`
          },
          hSui: {
            balance: 0,
            formatted: "0.0000 hSUI"
          }
        };
      } catch (error) {
        console.error("Failed to fetch balances:", error);
        return null;
      }
    },
    enabled: !!address,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  return balances;
};