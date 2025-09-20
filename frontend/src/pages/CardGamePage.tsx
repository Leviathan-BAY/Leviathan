import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Avatar, Separator, TextField } from "@radix-ui/themes";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PlayIcon,
  PauseIcon,
  ExitIcon,
  PersonIcon,
  StackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon
} from "@radix-ui/react-icons";
import { gameInstanceManager, GameInstance } from "../utils/gameInstanceManager";
import { Card as GameCard, Player, GameState, GameAction } from "../utils/cardGameEngine";
import { PrizeDistributionManager, formatPrizeAmount } from "../utils/prizeDistribution";
import { CardPokerGameTransactions, TransactionUtils } from "../contracts/transactions";
import { useBlockchainSync, OnChainGameTemplate, OnChainGameInstance } from "../utils/blockchainSync";

export function CardGamePage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const blockchainSync = useBlockchainSync(suiClient);

  const [instance, setInstance] = useState<GameInstance | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [gameResult, setGameResult] = useState<any>(null);
  const [prizePreview, setPrizePreview] = useState<any>(null);

  // Blockchain integration state
  const [templateId, setTemplateId] = useState<string>("");
  const [onChainInstanceId, setOnChainInstanceId] = useState<string>("");
  const [onChainTemplate, setOnChainTemplate] = useState<OnChainGameTemplate | null>(null);
  const [onChainInstance, setOnChainInstance] = useState<OnChainGameInstance | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  };

  // Load instance and game state
  useEffect(() => {
    if (!instanceId) {
      navigate('/splash-zone');
      return;
    }

    const loadedInstance = gameInstanceManager.getInstance(instanceId);
    if (!loadedInstance) {
      setError('Game instance not found');
      return;
    }

    setInstance(loadedInstance);

    if (loadedInstance.gameEngine && currentAccount) {
      const visibleState = gameInstanceManager.getVisibleGameState(instanceId, currentAccount.address);
      setGameState(visibleState);
    }
  }, [instanceId, currentAccount, navigate]);

  // Refresh game state periodically
  useEffect(() => {
    if (!instanceId || !currentAccount || !instance?.gameEngine) return;

    const interval = setInterval(() => {
      const visibleState = gameInstanceManager.getVisibleGameState(instanceId, currentAccount.address);
      setGameState(visibleState);

      // Check if game just finished
      if (visibleState?.phase === 'finished' && !gameResult) {
        handleGameCompletion(visibleState);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [instanceId, currentAccount, instance, gameResult]);

  // Sync with blockchain when template ID changes
  useEffect(() => {
    if (templateId && blockchainSync.isValidObjectId(templateId)) {
      syncTemplateData();
    }
  }, [templateId]);

  // Sync with blockchain when instance ID changes
  useEffect(() => {
    if (onChainInstanceId && blockchainSync.isValidObjectId(onChainInstanceId)) {
      syncInstanceData();
    }
  }, [onChainInstanceId]);

  // Check if player has joined when currentAccount or instanceId changes
  useEffect(() => {
    if (currentAccount && onChainInstanceId) {
      checkPlayerJoinedStatus();
    }
  }, [currentAccount, onChainInstanceId]);

  // Calculate prize preview
  useEffect(() => {
    if (instance) {
      const preview = PrizeDistributionManager.previewPrizeDistribution(
        instance.prizePool,
        gameState?.winner
      );
      setPrizePreview(preview);
    }
  }, [instance, gameState?.winner]);

  // Sync template data from blockchain
  const syncTemplateData = async () => {
    try {
      setSyncError(null);
      const template = await blockchainSync.getGameTemplate(templateId);
      if (template) {
        setOnChainTemplate(template);
        console.log("Template synced:", template);
      } else {
        setSyncError("Template not found on blockchain");
      }
    } catch (error) {
      console.error("Error syncing template:", error);
      setSyncError("Failed to sync template data");
    }
  };

  // Sync instance data from blockchain
  const syncInstanceData = async () => {
    try {
      setSyncError(null);
      const gameInstance = await blockchainSync.getGameInstance(onChainInstanceId);
      if (gameInstance) {
        setOnChainInstance(gameInstance);
        setGameStarted(gameInstance.started);
        console.log("Instance synced:", gameInstance);

        // Update local game state based on blockchain data
        updateLocalGameState(gameInstance);
      } else {
        setSyncError("Game instance not found on blockchain");
      }
    } catch (error) {
      console.error("Error syncing instance:", error);
      setSyncError("Failed to sync game instance data");
    }
  };

  // Check if current player has joined the game
  const checkPlayerJoinedStatus = async () => {
    if (!currentAccount || !onChainInstanceId) return;

    try {
      const joined = await blockchainSync.hasPlayerJoined(onChainInstanceId, currentAccount.address);
      setHasJoined(joined);
    } catch (error) {
      console.error("Error checking join status:", error);
    }
  };

  // Update local game state based on blockchain data
  const updateLocalGameState = (onChainData: OnChainGameInstance) => {
    if (!gameState || !instance) return;

    // Update game state with blockchain data
    const updatedGameState = {
      ...gameState,
      phase: onChainData.ended ? 'finished' as const : onChainData.started ? 'playing' as const : 'waiting' as const,
      winner: onChainData.winners.length > 0 ? onChainData.winners[0] : undefined
    };

    setGameState(updatedGameState);

    // Update instance with pot value
    const updatedInstance = {
      ...instance,
      prizePool: blockchainSync.mistToSui(onChainData.pot),
      status: onChainData.ended ? 'finished' as const : onChainData.started ? 'playing' as const : 'waiting' as const
    };

    setInstance(updatedInstance);
  };

  // Create a new game instance on blockchain
  const createGameInstance = async () => {
    if (!currentAccount || !templateId) {
      setError("Template ID required to create instance");
      return;
    }

    setIsLoading(true);
    try {
      const tx = CardPokerGameTransactions.createGameInstance(templateId);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Game instance created:", result);

            // Extract instance ID from transaction result
            const newInstanceId = extractInstanceIdFromResult(result);
            if (newInstanceId) {
              setOnChainInstanceId(newInstanceId);
              console.log("Game instance ID:", newInstanceId);
            }
          },
          onError: (error) => {
            console.error("Failed to create game instance:", error);
            setError(`Failed to create game instance: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error("Error creating game instance:", error);
      setError("Failed to create game instance");
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing game instance
  const joinGame = async () => {
    if (!currentAccount || !onChainInstanceId || !instance) {
      setError("Missing required data to join game");
      return;
    }

    setIsJoining(true);
    try {
      const stakeAmount = TransactionUtils.suiToMist(instance.entryFee);
      const tx = CardPokerGameTransactions.joinGame(onChainInstanceId, stakeAmount);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Joined game successfully:", result);
            setHasJoined(true);
            setError(null);
          },
          onError: (error) => {
            console.error("Failed to join game:", error);
            setError(`Failed to join game: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error("Error joining game:", error);
      setError("Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };

  // Start the game (after all players have joined)
  const startGame = async () => {
    if (!currentAccount || !onChainInstanceId || !templateId) {
      setError("Missing required data to start game");
      return;
    }

    setIsStarting(true);
    try {
      // In a real app, you'd get the random object ID from Sui
      const randomObjectId = "0x8"; // Placeholder - use actual random object
      const tx = CardPokerGameTransactions.startGame(onChainInstanceId, templateId, randomObjectId);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Game started successfully:", result);
            setGameStarted(true);
            setError(null);
          },
          onError: (error) => {
            console.error("Failed to start game:", error);
            setError(`Failed to start game: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error("Error starting game:", error);
      setError("Failed to start game");
    } finally {
      setIsStarting(false);
    }
  };

  // Finalize the game (determine winner and distribute prizes)
  const finalizeGame = async () => {
    if (!currentAccount || !onChainInstanceId || !templateId) {
      setError("Missing required data to finalize game");
      return;
    }

    setIsLoading(true);
    try {
      const tx = CardPokerGameTransactions.finalizeGame(onChainInstanceId, templateId);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Game finalized successfully:", result);

            // Handle game completion
            handleGameCompletion(gameState!);
          },
          onError: (error) => {
            console.error("Failed to finalize game:", error);
            setError(`Failed to finalize game: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error("Error finalizing game:", error);
      setError("Failed to finalize game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameCompletion = async (finalGameState: GameState) => {
    if (!instance) return;

    try {
      // Create final rankings from game state
      const finalRankings = finalGameState.players.map((player, index) => ({
        playerId: player.id,
        position: player.hasWon ? 1 : index + 2,
        score: player.score
      }));

      // Complete the game and distribute prizes
      const result = await PrizeDistributionManager.completeGame(
        instance.id,
        finalGameState.winner,
        finalRankings,
        'completed',
        signAndExecuteTransaction
      );

      setGameResult(result);
      console.log('Game completed with result:', result);

    } catch (error) {
      console.error('Failed to complete game:', error);
      setError('Failed to process game completion');
    }
  };

  // Helper function to extract instance ID from transaction result
  const extractInstanceIdFromResult = (result: any): string | null => {
    try {
      if (result.effects?.created) {
        for (const created of result.effects.created) {
          if (created.objectType?.includes('PokerGameInstance')) {
            return created.objectId;
          }
        }
      }

      // Fallback: look for any created object
      if (result.effects?.created && result.effects.created.length > 0) {
        return result.effects.created[0].objectId;
      }

      return null;
    } catch (error) {
      console.error("Error extracting instance ID:", error);
      return null;
    }
  };

  const executeAction = useCallback(async (actionType: string, cardId?: string) => {
    if (!instanceId || !currentAccount || !gameState) return;

    setIsLoading(true);
    setError(null);

    try {
      const action: GameAction = {
        type: actionType as any,
        playerId: currentAccount.address,
        cardId
      };

      const validation = gameInstanceManager.validatePlayerAction(instanceId, currentAccount.address, action);
      if (!validation.valid) {
        setError(validation.error || 'Invalid action');
        return;
      }

      const result = gameInstanceManager.executeGameAction(instanceId, action);

      if (result.success) {
        setGameState(result.gameState);
        setSelectedCard(null);

        // TODO: Submit action to blockchain
        console.log('Action executed:', action);
      } else {
        setError(result.error || 'Action failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId, currentAccount, gameState]);

  const handleCardClick = (cardId: string) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  const canPerformAction = (actionType: string): boolean => {
    if (!instance || !gameState || !currentAccount) return false;

    const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === currentAccount.address;
    const isAllowedAction = instance.gameEngine?.getState().config.allowedActions.includes(actionType);

    return isMyTurn && !!isAllowedAction;
  };

  const renderCard = (card: GameCard, isInHand: boolean = false) => {
    const isSelected = selectedCard === card.id;
    const isHidden = card.id === 'hidden';

    return (
      <Card
        key={card.id}
        style={{
          ...cardStyle,
          padding: "8px",
          minWidth: "60px",
          height: "84px",
          cursor: isInHand && !isHidden ? "pointer" : "default",
          transform: isSelected ? "translateY(-8px)" : "none",
          border: isSelected ? "2px solid var(--purple-9)" : cardStyle.border,
          background: isHidden ? "rgba(148, 163, 184, 0.3)" : cardStyle.background
        }}
        onClick={() => isInHand && !isHidden && handleCardClick(card.id)}
      >
        <Flex direction="column" align="center" justify="center" style={{ height: "100%" }}>
          {isHidden ? (
            <StackIcon width="24" height="24" color="var(--gray-9)" />
          ) : (
            <>
              <Text size="3" weight="bold" style={{
                color: card.suit === 'hearts' || card.suit === 'diamonds' ? 'var(--red-11)' : 'white'
              }}>
                {card.isJoker ? 'J' : card.rank}
              </Text>
              <Text size="1" color="gray">
                {card.isJoker ? 'JOKER' : card.suit.charAt(0).toUpperCase()}
              </Text>
            </>
          )}
        </Flex>
      </Card>
    );
  };

  const renderPlayerHand = (player: Player, isCurrentPlayer: boolean) => {
    return (
      <Box>
        <Flex align="center" gap="2" mb="2">
          <Avatar
            size="2"
            fallback={player.name.charAt(0).toUpperCase()}
            color={isCurrentPlayer ? "purple" : "gray"}
          />
          <Box>
            <Text size="2" weight="bold" style={{ color: "white" }}>
              {player.name}
            </Text>
            <Text size="1" color="gray">
              {player.hand.length} cards
            </Text>
          </Box>
          {gameState?.players[gameState.currentPlayerIndex]?.id === player.id && (
            <Badge color="green" size="1">Current Turn</Badge>
          )}
          {player.hasFolded && (
            <Badge color="red" size="1">Folded</Badge>
          )}
        </Flex>

        <Flex gap="1" wrap="wrap" style={{ minHeight: "90px" }}>
          {player.hand.map(card => renderCard(card, isCurrentPlayer))}
          {player.hand.length === 0 && (
            <Text size="2" color="gray" style={{ fontStyle: "italic" }}>Empty hand</Text>
          )}
        </Flex>
      </Box>
    );
  };

  const renderGameActions = () => {
    if (!gameState || !currentAccount || !instance) return null;

    const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === currentAccount.address;
    const allowedActions = instance.gameEngine?.getState().config.allowedActions || [];

    if (!isMyTurn) {
      return (
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Text size="2" color="gray" style={{ textAlign: "center" }}>
            Waiting for {currentPlayer?.name || 'other player'}...
          </Text>
        </Card>
      );
    }

    return (
      <Card style={{ ...cardStyle, padding: "16px" }}>
        <Flex justify="between" align="center" mb="3">
          <Heading size="3" style={{ color: "white" }}>Your Turn</Heading>
          <Button
            size="1"
            variant="ghost"
            onClick={() => setShowActions(!showActions)}
          >
            {showActions ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </Flex>

        {showActions && (
          <Grid columns="2" gap="2">
            {allowedActions.includes('draw') && (
              <Button
                size="2"
                variant="outline"
                onClick={() => executeAction('draw')}
                disabled={isLoading || !canPerformAction('draw')}
              >
                <StackIcon /> Draw Card
              </Button>
            )}

            {allowedActions.includes('play') && (
              <Button
                size="2"
                variant="outline"
                onClick={() => selectedCard && executeAction('play', selectedCard)}
                disabled={isLoading || !selectedCard || !canPerformAction('play')}
              >
                <PlayIcon /> Play Card
              </Button>
            )}

            {allowedActions.includes('discard') && (
              <Button
                size="2"
                variant="outline"
                onClick={() => selectedCard && executeAction('discard', selectedCard)}
                disabled={isLoading || !selectedCard || !canPerformAction('discard')}
              >
                <ExitIcon /> Discard
              </Button>
            )}

            {allowedActions.includes('pass') && (
              <Button
                size="2"
                variant="outline"
                onClick={() => executeAction('pass')}
                disabled={isLoading || !canPerformAction('pass')}
              >
                <PauseIcon /> Pass
              </Button>
            )}

            {allowedActions.includes('fold') && (
              <Button
                size="2"
                color="red"
                variant="outline"
                onClick={() => executeAction('fold')}
                disabled={isLoading || !canPerformAction('fold')}
              >
                <ExitIcon /> Fold
              </Button>
            )}
          </Grid>
        )}

        {selectedCard && (
          <Box mt="3" p="2" style={{
            background: "rgba(147, 51, 234, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(147, 51, 234, 0.3)"
          }}>
            <Text size="2" style={{ color: "var(--purple-11)" }}>
              Selected card: {selectedCard}
            </Text>
          </Box>
        )}

        {error && (
          <Box mt="3" p="2" style={{
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }}>
            <Text size="2" style={{ color: "var(--red-11)" }}>
              {error}
            </Text>
          </Box>
        )}
      </Card>
    );
  };

  if (!instance) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
        <Text size="4" color="gray">Loading game...</Text>
      </Flex>
    );
  }

  if (error && !gameState) {
    return (
      <Flex align="center" justify="center" direction="column" gap="4" style={{ minHeight: "400px" }}>
        <Text size="4" color="red">{error}</Text>
        <Button onClick={() => navigate('/splash-zone')}>
          Back to Splash Zone
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="6">
      {/* Game Header */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="6" style={{ color: "white" }} mb="1">
              {onChainTemplate?.name || (instance.templateId && gameInstanceManager.getTemplate(instance.templateId)?.config.title) || "Poker Game"}
            </Heading>
            <Text size="3" color="gray">
              Turn {gameState?.turn || 1} • {instance.status}
            </Text>
            {onChainTemplate && (
              <Text size="2" color="gray">
                {onChainTemplate.description}
              </Text>
            )}
          </Box>

          <Flex align="center" gap="4">
            <Box style={{ textAlign: "right" }}>
              <Text size="2" color="gray">Prize Pool</Text>
              <Text size="3" style={{ color: "var(--green-11)" }} weight="bold">
                {instance.prizePool.toFixed(2)} SUI
              </Text>
            </Box>

            <Flex align="center" gap="2">
              <PersonIcon color="var(--gray-10)" />
              <Text size="2" color="gray">
                {instance.currentPlayers}/{instance.maxPlayers}
              </Text>
            </Flex>

            <Button
              size="2"
              variant="outline"
              onClick={() => navigate('/splash-zone')}
            >
              <ExitIcon /> Leave Game
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Game Field */}
      {gameState && gameState.field.length > 0 && (
        <Card style={{ ...cardStyle, padding: "24px" }}>
          <Heading size="4" style={{ color: "white" }} mb="3">Field</Heading>
          <Flex gap="2" wrap="wrap">
            {gameState.field.map(card => renderCard(card))}
          </Flex>
        </Card>
      )}

      {/* Players */}
      {gameState && (
        <Grid columns="1" gap="4">
          {gameState.players.map(player => (
            <Card key={player.id} style={{ ...cardStyle, padding: "16px" }}>
              {renderPlayerHand(player, player.id === currentAccount?.address)}
            </Card>
          ))}
        </Grid>
      )}

      {/* Sync Error Display */}
      {syncError && (
        <Card style={{
          ...cardStyle,
          padding: "16px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)"
        }}>
          <Text size="2" style={{ color: "var(--red-11)" }}>
            Blockchain Sync Error: {syncError}
          </Text>
        </Card>
      )}

      {/* Blockchain Status */}
      {(onChainTemplate || onChainInstance) && (
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Blockchain Status</Heading>
          <Grid columns="2" gap="3">
            {onChainTemplate && (
              <>
                <Box>
                  <Text size="2" color="gray">Template</Text>
                  <Text size="2" style={{ color: "var(--green-11)" }} weight="bold">
                    ✓ Synced ({blockchainSync.formatAddress(templateId)})
                  </Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">Cards per Hand</Text>
                  <Text size="2" style={{ color: "white" }} weight="bold">
                    {onChainTemplate.cardsPerHand}
                  </Text>
                </Box>
              </>
            )}
            {onChainInstance && (
              <>
                <Box>
                  <Text size="2" color="gray">Instance</Text>
                  <Text size="2" style={{ color: "var(--green-11)" }} weight="bold">
                    ✓ Synced ({blockchainSync.formatAddress(onChainInstanceId)})
                  </Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">Players Joined</Text>
                  <Text size="2" style={{ color: "white" }} weight="bold">
                    {onChainInstance.players.length}
                  </Text>
                </Box>
              </>
            )}
          </Grid>
        </Card>
      )}

      {/* Blockchain Actions */}
      {!onChainInstanceId && (
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Game Setup</Heading>
          <Text size="2" color="gray" mb="3">
            Create a blockchain game instance to play with real stakes
          </Text>
          <Flex gap="2">
            <TextField.Root
              placeholder="Template ID (0x...)"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              onClick={createGameInstance}
              disabled={!templateId || isLoading}
              size="2"
            >
              {isLoading ? "Creating..." : "Create Instance"}
            </Button>
          </Flex>
          {onChainTemplate && (
            <Box mt="2" p="2" style={{
              background: "rgba(147, 51, 234, 0.1)",
              borderRadius: "8px",
              border: "1px solid rgba(147, 51, 234, 0.3)"
            }}>
              <Text size="2" style={{ color: "var(--purple-11)" }}>
                Template loaded: {onChainTemplate.name} - {onChainTemplate.cardsPerHand} cards per hand
              </Text>
            </Box>
          )}
        </Card>
      )}

      {onChainInstanceId && !hasJoined && (
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Join Game</Heading>
          <Text size="2" color="gray" mb="3">
            Instance ID: {onChainInstanceId.slice(0, 16)}...
          </Text>
          <Button
            onClick={joinGame}
            disabled={isJoining || !instance}
            size="2"
          >
            {isJoining ? "Joining..." : `Join Game (${instance?.entryFee || 0} SUI)`}
          </Button>
        </Card>
      )}

      {hasJoined && !gameStarted && (
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Start Game</Heading>
          <Text size="2" color="gray" mb="3">
            Waiting for all players to join. Click start when ready.
          </Text>
          <Button
            onClick={startGame}
            disabled={isStarting}
            size="2"
            style={{ background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))" }}
          >
            {isStarting ? "Starting..." : "Start Game"}
          </Button>
        </Card>
      )}

      {gameStarted && gameState?.phase === 'finished' && (
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Finalize Game</Heading>
          <Text size="2" color="gray" mb="3">
            Game finished! Finalize to determine winner and distribute prizes.
          </Text>
          <Button
            onClick={finalizeGame}
            disabled={isLoading}
            size="2"
            style={{ background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))" }}
          >
            {isLoading ? "Finalizing..." : "Finalize & Distribute Prizes"}
          </Button>
        </Card>
      )}

      {/* Game Actions */}
      {renderGameActions()}

      {/* Game Finished */}
      {gameState?.phase === 'finished' && (
        <Card style={{
          ...cardStyle,
          padding: "24px",
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))"
        }}>
          <CheckIcon width="48" height="48" color="var(--green-11)" style={{ margin: "0 auto 16px" }} />
          <Heading size="5" style={{ color: "white" }} mb="2">Game Finished!</Heading>

          {gameState.winner ? (
            <Text size="3" color="gray" mb="4">
              Winner: {gameState.players.find(p => p.id === gameState.winner)?.name || gameState.winner}
            </Text>
          ) : (
            <Text size="3" color="gray" mb="4">Game ended in a draw</Text>
          )}

          <Button
            size="3"
            style={{ background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))" }}
            onClick={() => navigate('/splash-zone')}
          >
            Back to Splash Zone
          </Button>
        </Card>
      )}

      {/* Game Info Panel */}
      <Grid columns="2" gap="4">
        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Game Info</Heading>
          <Grid columns="2" gap="3">
            <Box>
              <Text size="2" color="gray">Deck Remaining</Text>
              <Text size="3" style={{ color: "white" }} weight="bold">
                {gameState?.deck.length || 0} cards
              </Text>
            </Box>
            <Box>
              <Text size="2" color="gray">Turn Limit</Text>
              <Text size="3" style={{ color: "white" }} weight="bold">
                {gameState?.turn || 1} / {instance.gameEngine?.getState().config.turnLimit || 50}
              </Text>
            </Box>
          </Grid>
        </Card>

        <Card style={{ ...cardStyle, padding: "16px" }}>
          <Heading size="3" style={{ color: "white" }} mb="3">Prize Distribution</Heading>
          {prizePreview ? (
            <Grid columns="1" gap="2">
              <Flex justify="between">
                <Text size="2" color="gray">Winner:</Text>
                <Text size="2" style={{ color: "var(--green-11)" }} weight="bold">
                  {formatPrizeAmount(prizePreview.winnerShare)}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Creator:</Text>
                <Text size="2" color="gray">
                  {formatPrizeAmount(prizePreview.creatorFee)}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Platform:</Text>
                <Text size="2" color="gray">
                  {formatPrizeAmount(prizePreview.platformFee)}
                </Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text size="2" style={{ color: "white" }} weight="bold">Total:</Text>
                <Text size="2" style={{ color: "white" }} weight="bold">
                  {formatPrizeAmount(instance?.prizePool || 0)}
                </Text>
              </Flex>
            </Grid>
          ) : (
            <Text size="2" color="gray">Loading prize info...</Text>
          )}
        </Card>
      </Grid>
    </Flex>
  );
}