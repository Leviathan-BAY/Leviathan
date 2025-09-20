// React hooks for Leviathan contract interactions
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { MOCK_BOARD_GAME_TEMPLATES } from "./constants";
import {
  HermitFinanceTransactions,
  BoardGameTemplateTransactions,
  GameRegistryTransactions,
  CardPokerGameTransactions,
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

// Hook to fetch template data
export const useBoardGameTemplateData = (templateId: string | null) => {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['board-game-template-data', templateId],
    queryFn: async () => {
      if (!templateId) return null;

      try {
        // Fetch the template object from Sui blockchain
        const templateObject = await client.getObject({
          id: templateId,
          options: {
            showContent: true,
            showType: true,
          }
        });

        if (templateObject.data?.content && 'fields' in templateObject.data.content) {
          const fields = templateObject.data.content.fields as any;

          return {
            id: templateId,
            name: fields.name || 'Board Game',
            description: fields.description || 'A custom board game',
            diceMin: parseInt(fields.dice_min) || 1,
            diceMax: parseInt(fields.dice_max) || 6,
            piecesPerPlayer: parseInt(fields.pieces_per_player) || 3,
            stakeAmount: parseInt(fields.stake_amount) || 1000000000,
            boardCells: fields.board_cells || [],
            startPositions: fields.start_positions || [0, 1, 2],
            finishPositions: fields.finish_positions || [97, 98, 99],
            creator: fields.creator,
            isActive: fields.is_active || true,
            createdAt: parseInt(fields.created_at) || Date.now()
          };
        }

        return null;
      } catch (error) {
        console.error('Error fetching template data:', error);
        return null;
      }
    },
    enabled: !!templateId,
    refetchInterval: false, // Don't auto-refetch since template data is immutable
  });
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
  const REGISTRY_ID = "0x870ad8f56c67aa516355be89df97f407cb1a327e0d7fa281443dce7eb3e68442";

  const registerGameTemplate = useMutation({
    mutationFn: async (data: {
      templateId: string;
      gameType: number; // 0 = card, 1 = board
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
        data.templateId
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

  // Query all registered games from the registry
  const registeredGames = useQuery({
    queryKey: ['registered-games'],
    queryFn: async () => {
      try {
        // Get the registry object to access published_games array
        const registryObject = await client.getObject({
          id: REGISTRY_ID,
          options: { showContent: true }
        });

        if (!registryObject.data?.content || registryObject.data.content.dataType !== 'moveObject') {
          console.error("Invalid registry object");
          return [];
        }

        const registryFields = (registryObject.data.content as any).fields;
        const publishedGameIds = registryFields.published_games || [];

        // Fetch details for each published game
        const gamePromises = publishedGameIds.map(async (gameId: string) => {
          try {
            const gameObject = await client.getObject({
              id: gameId,
              options: { showContent: true }
            });

            if (!gameObject.data?.content || gameObject.data.content.dataType !== 'moveObject') {
              return null;
            }

            const gameFields = (gameObject.data.content as any).fields;

            // Now fetch the actual template details using package_id
            const templateObject = await client.getObject({
              id: gameFields.package_id,
              options: { showContent: true }
            });

            if (!templateObject.data?.content || templateObject.data.content.dataType !== 'moveObject') {
              return null;
            }

            const templateFields = (templateObject.data.content as any).fields;

            return {
              id: gameId,
              package_id: gameFields.package_id,
              game_type: gameFields.game_type,
              creator: gameFields.creator,
              created_at: gameFields.created_at,
              template: {
                id: gameFields.package_id,
                ...templateFields
              }
            };
          } catch (error) {
            console.error(`Failed to fetch game ${gameId}:`, error);
            return null;
          }
        });

        const games = await Promise.all(gamePromises);
        return games.filter(game => game !== null);
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
        // Get the registry object to access created_games array
        const registryObject = await client.getObject({
          id: REGISTRY_ID,
          options: { showContent: true }
        });

        if (!registryObject.data?.content || registryObject.data.content.dataType !== 'moveObject') {
          return [];
        }

        const registryFields = (registryObject.data.content as any).fields;
        const createdGameIds = registryFields.created_games || [];

        // Fetch details for each created game instance
        const instancePromises = createdGameIds.map(async (instanceId: string) => {
          try {
            const instanceObject = await client.getObject({
              id: instanceId,
              options: { showContent: true }
            });

            if (!instanceObject.data?.content || instanceObject.data.content.dataType !== 'moveObject') {
              return null;
            }

            const instanceFields = (instanceObject.data.content as any).fields;

            return {
              instance_id: instanceId,
              template_id: instanceFields.template_id,
              creator: instanceFields.creator,
              players: instanceFields.players || [],
              max_players: instanceFields.max_players,
              current_players: instanceFields.players?.length || 0,
              stake_amount: instanceFields.stake_amount,
              created_at: instanceFields.created_at,
              started: instanceFields.started || false,
              ended: instanceFields.ended || false,
              is_joinable: !instanceFields.started && !instanceFields.ended &&
                          (instanceFields.players?.length || 0) < instanceFields.max_players
            };
          } catch (error) {
            console.error(`Failed to fetch instance ${instanceId}:`, error);
            return null;
          }
        });

        const instances = await Promise.all(instancePromises);
        return instances.filter(instance => instance !== null && instance.is_joinable);
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
        const registryObject = await client.getObject({
          id: REGISTRY_ID,
          options: { showContent: true }
        });

        if (!registryObject.data?.content || registryObject.data.content.dataType !== 'moveObject') {
          return {
            totalGames: 0,
            activeInstances: 0,
            totalFeesCollected: 0
          };
        }

        const registryFields = (registryObject.data.content as any).fields;

        return {
          totalGames: registryFields.published_games?.length || 0,
          activeInstances: registryFields.created_games?.length || 0,
          totalFeesCollected: 0 // TODO: Add if this field exists in the registry
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

// Card Poker Game Hooks
export const useCardPokerGame = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const createTemplate = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      metaUri: string;
      numSuits: number;
      ranksPerSuit: number;
      cardsPerHand: number;
      combinationSize: number;
      victoryMode: number;
      stakeAmount: number;
      launchFee: number;
    }) => {
      const tx = CardPokerGameTransactions.createCardPokerTemplate(
        data.name,
        data.description,
        data.metaUri,
        data.numSuits,
        data.ranksPerSuit,
        data.cardsPerHand,
        data.combinationSize,
        data.victoryMode,
        TransactionUtils.suiToMist(data.stakeAmount),
        TransactionUtils.suiToMist(data.launchFee)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Card poker template created:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Card poker template creation failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-templates'] });
    }
  });

  const createGameInstance = useMutation({
    mutationFn: async (data: {
      templateId: string;
    }) => {
      const tx = CardPokerGameTransactions.createGameInstance(data.templateId);

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Poker game instance created:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Poker game instance creation failed:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-instances'] });
    }
  });

  const joinGame = useMutation({
    mutationFn: async (data: {
      instanceId: string;
      stakeAmount: number;
    }) => {
      const tx = CardPokerGameTransactions.joinGame(
        data.instanceId,
        TransactionUtils.suiToMist(data.stakeAmount)
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Joined poker game:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Failed to join poker game:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-instances'] });
    }
  });

  const startGame = useMutation({
    mutationFn: async (data: {
      instanceId: string;
      templateId: string;
      randomObjectId: string;
    }) => {
      const tx = CardPokerGameTransactions.startGame(
        data.instanceId,
        data.templateId,
        data.randomObjectId
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Poker game started:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Failed to start poker game:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-instances'] });
    }
  });

  const finalizeGame = useMutation({
    mutationFn: async (data: {
      instanceId: string;
      templateId: string;
    }) => {
      const tx = CardPokerGameTransactions.finalizeGame(
        data.instanceId,
        data.templateId
      );

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Poker game finalized:", result);
              resolve(result);
            },
            onError: (error: any) => {
              console.error("Failed to finalize poker game:", error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poker-instances'] });
    }
  });

  // Query poker game templates
  const pokerTemplates = useQuery({
    queryKey: ['poker-templates'],
    queryFn: async () => {
      try {
        // TODO: Query actual poker templates from the contract
        // For now, return mock data
        return [
          {
            id: "0xpoker1",
            creator: "0x1234567890abcdef1234567890abcdef12345678",
            name: "Texas Hold'em",
            description: "Classic Texas Hold'em poker with 2 hole cards and 5 community cards",
            metaUri: "https://example.com/texas-holdem",
            numSuits: 4,
            ranksPerSuit: 13,
            cardsPerHand: 7,
            combinationSize: 5,
            victoryMode: 0, // Best poker hand
            stakeAmount: 1000000000, // 1 SUI in mist
            launchFee: 100000000, // 0.1 SUI in mist
            createdAt: Date.now() - 86400000,
            isActive: true
          },
          {
            id: "0xpoker2",
            creator: "0xabcdef1234567890abcdef1234567890abcdef12",
            name: "Five Card Draw",
            description: "Simple 5-card draw poker game",
            metaUri: "https://example.com/five-card-draw",
            numSuits: 4,
            ranksPerSuit: 13,
            cardsPerHand: 5,
            combinationSize: 5,
            victoryMode: 0, // Best poker hand
            stakeAmount: 500000000, // 0.5 SUI in mist
            launchFee: 50000000, // 0.05 SUI in mist
            createdAt: Date.now() - 172800000,
            isActive: true
          }
        ];
      } catch (error) {
        console.error("Failed to fetch poker templates:", error);
        return [];
      }
    },
    refetchInterval: 15000
  });

  // Query poker game instances
  const pokerInstances = useQuery({
    queryKey: ['poker-instances'],
    queryFn: async () => {
      try {
        // TODO: Query actual poker instances from the contract
        // For now, return mock data
        return [
          {
            id: "0xinstance1",
            templateId: "0xpoker1",
            players: ["0x1234567890abcdef1234567890abcdef12345678"],
            deck: [],
            hands: [],
            pot: 1000000000, // 1 SUI in mist
            started: false,
            ended: false,
            winners: []
          }
        ];
      } catch (error) {
        console.error("Failed to fetch poker instances:", error);
        return [];
      }
    },
    refetchInterval: 5000
  });

  return {
    createTemplate,
    createGameInstance,
    joinGame,
    startGame,
    finalizeGame,
    pokerTemplates,
    pokerInstances,
    isLoading: createTemplate.isPending ||
              createGameInstance.isPending ||
              joinGame.isPending ||
              startGame.isPending ||
              finalizeGame.isPending ||
              pokerTemplates.isLoading ||
              pokerInstances.isLoading
  };
};