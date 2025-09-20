// React hooks for Leviathan contract interactions
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { MOCK_BOARD_GAME_TEMPLATES } from "./constants";
import {
  HermitFinanceTransactions,
  BoardGameTemplateTransactions,
  TransactionUtils
} from "./transactions";

// Hermit Finance (hSUI) Hooks
export const useHermitFinance = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const depositSui = useMutation({
    mutationFn: async (data: { vaultId: string; amount: number }) => {
      const amountMist = TransactionUtils.suiToMist(data.amount);
      const tx = HermitFinanceTransactions.depositSui(data.vaultId, amountMist);

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("SUI deposit successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("SUI deposit failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const redeemHSui = useMutation({
    mutationFn: async (data: { vaultId: string; hSuiCoinId: string }) => {
      const tx = HermitFinanceTransactions.redeemHSui(data.vaultId, data.hSuiCoinId);

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("hSUI redemption successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("hSUI redemption failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  // Mock vault statistics - replace with actual queries when contracts are deployed
  const vaultStats = useQuery({
    queryKey: ['hermit-finance-vault-stats'],
    queryFn: async () => {
      // TODO: Query actual vault data using get_vault_info
      return {
        suiBalance: "2,847,392 SUI",
        hSuiSupply: "2,844,547 hSUI",
        exchangeRate: "1.001",
        feeRate: "0.5%",
        totalDeposits: "5,691,939 SUI",
        totalWithdrawals: "2,844,547 SUI"
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  return {
    depositSui,
    redeemHSui,
    vaultStats,
    isLoading: depositSui.isPending || redeemHSui.isPending || vaultStats.isLoading
  };
};

// Board Game Template Hooks
export const useBoardGameTemplate = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const createTemplate = useMutation({
    mutationFn: async (templateData: {
      name: string;
      description: string;
      diceMin: number;
      diceMax: number;
      piecesPerPlayer: number;
      stakeAmount: number;
    }) => {
      const tx = BoardGameTemplateTransactions.createGameTemplate(
        templateData.name,
        templateData.description,
        templateData.diceMin,
        templateData.diceMax,
        templateData.piecesPerPlayer,
        TransactionUtils.suiToMist(templateData.stakeAmount)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Template creation successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Template creation failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-game-templates'] });
    }
  });

  const setBoardConfiguration = useMutation({
    mutationFn: async (configData: {
      templateId: string;
      positions: number[];
      cellTypes: number[];
    }) => {
      const tx = BoardGameTemplateTransactions.setMultipleCells(
        configData.templateId,
        configData.positions,
        configData.cellTypes
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Board configuration successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Board configuration failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const setStartPositions = useMutation({
    mutationFn: async (data: {
      templateId: string;
      positions: number[];
    }) => {
      const tx = BoardGameTemplateTransactions.setStartPositions(
        data.templateId,
        data.positions
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Start positions set successfully:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Setting start positions failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const setFinishPositions = useMutation({
    mutationFn: async (data: {
      templateId: string;
      positions: number[];
    }) => {
      const tx = BoardGameTemplateTransactions.setFinishPositions(
        data.templateId,
        data.positions
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Finish positions set successfully:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Setting finish positions failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  return {
    createTemplate,
    setBoardConfiguration,
    setStartPositions,
    setFinishPositions,
    isLoading: createTemplate.isPending || setBoardConfiguration.isPending ||
               setStartPositions.isPending || setFinishPositions.isPending
  };
};

// Board Game Instance Hooks (for playing games)
export const useBoardGameInstance = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const startGame = useMutation({
    mutationFn: async (gameData: {
      templateId: string;
      stakeAmount: number;
    }) => {
      const tx = BoardGameTemplateTransactions.startGame(
        gameData.templateId,
        TransactionUtils.suiToMist(gameData.stakeAmount)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Game instance started:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Failed to start game:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const joinGame = useMutation({
    mutationFn: async (gameData: {
      gameInstanceId: string;
      templateId: string;
      stakeAmount: number;
    }) => {
      const tx = BoardGameTemplateTransactions.joinGame(
        gameData.gameInstanceId,
        gameData.templateId,
        TransactionUtils.suiToMist(gameData.stakeAmount)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Successfully joined game:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Failed to join game:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  const rollDiceAndMove = useMutation({
    mutationFn: async (moveData: {
      gameInstanceId: string;
      templateId: string;
      pieceIndex: number;
      randomObjectId: string;
    }) => {
      const tx = BoardGameTemplateTransactions.rollDiceAndMove(
        moveData.gameInstanceId,
        moveData.templateId,
        moveData.pieceIndex,
        moveData.randomObjectId
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Move successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Move failed:", error);
              reject(error);
            }
          }
        );
      });
    }
  });

  return {
    startGame,
    joinGame,
    rollDiceAndMove,
    isLoading: startGame.isPending || joinGame.isPending || rollDiceAndMove.isPending
  };
};

// Wallet Balance Hooks
export const useWalletBalances = (address?: string) => {
  const client = useSuiClient();

  const balances = useQuery({
    queryKey: ['wallet-balances', address],
    queryFn: async () => {
      if (!address) return null;

      try {
        // Get SUI balance
        const suiBalance = await client.getBalance({ owner: address });

        // TODO: Get actual hSUI balance from contract
        return {
          sui: {
            balance: TransactionUtils.mistToSui(BigInt(suiBalance.totalBalance)),
            formatted: `${TransactionUtils.mistToSui(BigInt(suiBalance.totalBalance)).toFixed(4)} SUI`,
            raw: suiBalance.totalBalance
          },
          hSui: {
            balance: 0,
            formatted: "0.0000 hSUI",
            raw: "0"
          }
        };
      } catch (error) {
        console.error("Failed to fetch wallet balances:", error);
        return null;
      }
    },
    enabled: !!address,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  return balances;
};

// Game Templates Query Hook
export const useBoardGameTemplates = () => {
  const templates = useQuery({
    queryKey: ['board-game-templates'],
    queryFn: async () => {
      // TODO: Query actual templates from contract
      return MOCK_BOARD_GAME_TEMPLATES;
    },
    refetchInterval: 30000
  });

  return templates;
};

// Generic Contract Transaction Hook
export const useContractTransaction = () => {
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const executeTransaction = async (
    transaction: Transaction,
    options?: {
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      signAndExecute(
        { transaction },
        {
          onSuccess: (result: any) => {
            console.log("Transaction successful:", result);
            options?.onSuccess?.(result);
            resolve(result);
          },
          onError: (error: any) => {
            console.error("Transaction failed:", error);
            options?.onError?.(error);
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