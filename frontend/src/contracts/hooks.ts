// React hooks for Leviathan contract interactions
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { MOCK_BOARD_GAME_TEMPLATES } from "./constants";
import {
  HermitFinanceTransactions,
  BoardGameTemplateTransactions,
  GameRegistryTransactions,
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

// Game Registry Hooks
export const useGameRegistry = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const client = useSuiClient();

  // TODO: Replace with actual registry object ID from deployment
  const REGISTRY_ID = "0x1234567890abcdef1234567890abcdef12345678";

  const registerGameTemplate = useMutation({
    mutationFn: async (data: {
      templateId: string;
      registrationFee?: number; // Default to 1 SUI
    }) => {
      const fee = data.registrationFee || 1;
      const tx = GameRegistryTransactions.registerGameTemplate(
        REGISTRY_ID,
        data.templateId,
        TransactionUtils.suiToMist(fee)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Template registration successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Template registration failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registered-games'] });
    }
  });

  const createGameInstance = useMutation({
    mutationFn: async (data: {
      templateId: string;
      maxPlayers: number;
      stakeAmount: number;
    }) => {
      const tx = GameRegistryTransactions.createGameInstance(
        REGISTRY_ID,
        data.templateId,
        data.maxPlayers,
        TransactionUtils.suiToMist(data.stakeAmount)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Game instance creation successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Game instance creation failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-instances'] });
    }
  });

  const joinGameInstance = useMutation({
    mutationFn: async (data: {
      instanceId: string;
      stakeAmount: number;
    }) => {
      const tx = GameRegistryTransactions.joinGameInstance(
        REGISTRY_ID,
        data.instanceId,
        TransactionUtils.suiToMist(data.stakeAmount)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Game instance join successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Game instance join failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-instances'] });
    }
  });

  const updateGameStatistics = useMutation({
    mutationFn: async (data: {
      templateId: string;
      totalStakes: number;
      winner: string;
    }) => {
      const tx = GameRegistryTransactions.updateGameStatistics(
        REGISTRY_ID,
        data.templateId,
        TransactionUtils.suiToMist(data.totalStakes),
        data.winner
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Game statistics update successful:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Game statistics update failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registered-games'] });
    }
  });

  // Query all registered games
  const registeredGames = useQuery({
    queryKey: ['registered-games'],
    queryFn: async () => {
      try {
        // TODO: Query actual registered games from the contract
        // For now, return mock data
        return MOCK_BOARD_GAME_TEMPLATES.map(template => ({
          template_id: template.id,
          template_package_id: template.id,
          creator: "0x1234567890abcdef1234567890abcdef12345678",
          name: template.name,
          description: template.description,
          stake_amount: template.stakeAmount,
          pieces_per_player: template.piecesPerPlayer,
          dice_min: template.diceMin,
          dice_max: template.diceMax,
          registered_at: Date.now() - Math.random() * 86400000,
          total_instances_created: Math.floor(Math.random() * 50),
          total_games_played: Math.floor(Math.random() * 200),
          total_stakes_wagered: Math.floor(Math.random() * 10000),
          is_active: true
        }));
      } catch (error) {
        console.error("Failed to fetch registered games:", error);
        return [];
      }
    },
    refetchInterval: 15000 // Refetch every 15 seconds
  });

  // Query waiting game instances
  const waitingInstances = useQuery({
    queryKey: ['waiting-instances'],
    queryFn: async () => {
      try {
        // TODO: Query actual waiting instances from the contract
        // For now, return mock data
        return [
          {
            instance_id: "0xinstance1",
            template_id: "template_1",
            creator: "0x1234567890abcdef1234567890abcdef12345678",
            max_players: 2,
            current_players: 1,
            stake_amount: 1000000000, // 1 SUI in mist
            created_at: Date.now() - 300000, // 5 minutes ago
            is_joinable: true
          },
          {
            instance_id: "0xinstance2",
            template_id: "template_2",
            creator: "0xabcdef1234567890abcdef1234567890abcdef12",
            max_players: 4,
            current_players: 2,
            stake_amount: 500000000, // 0.5 SUI in mist
            created_at: Date.now() - 600000, // 10 minutes ago
            is_joinable: true
          }
        ];
      } catch (error) {
        console.error("Failed to fetch waiting instances:", error);
        return [];
      }
    },
    refetchInterval: 5000 // Refetch every 5 seconds for real-time updates
  });

  // Query registry statistics
  const registryStats = useQuery({
    queryKey: ['registry-stats'],
    queryFn: async () => {
      try {
        // TODO: Query actual registry stats from the contract
        return {
          totalGames: 42,
          activeInstances: 7,
          totalFeesCollected: 50 // in SUI
        };
      } catch (error) {
        console.error("Failed to fetch registry stats:", error);
        return {
          totalGames: 0,
          activeInstances: 0,
          totalFeesCollected: 0
        };
      }
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  return {
    registerGameTemplate,
    createGameInstance,
    joinGameInstance,
    updateGameStatistics,
    registeredGames,
    waitingInstances,
    registryStats,
    isLoading: registerGameTemplate.isPending ||
              createGameInstance.isPending ||
              joinGameInstance.isPending ||
              updateGameStatistics.isPending ||
              registeredGames.isLoading ||
              waitingInstances.isLoading ||
              registryStats.isLoading
  };
};