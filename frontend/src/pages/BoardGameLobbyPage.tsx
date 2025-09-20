import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Avatar, Separator, Progress } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  PlayIcon,
  ExitIcon,
  PersonIcon,
  CheckIcon,
  Cross2Icon
} from "@radix-ui/react-icons";
import { boardGameInstanceManager, BoardGameInstance } from "../utils/boardGameInstanceManager";
import { useBoardGameInstance } from "../contracts/hooks";
import { useDiscord } from "../hooks/useDiscord";

export function BoardGameLobbyPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { getDisplayName, getAvatarUrl } = useDiscord();

  const location = useLocation();
  const passedInstance = location.state?.instance as BoardGameInstance | null;

  const [instance, setInstance] = useState<BoardGameInstance | null>(passedInstance);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeInLobby, setTimeInLobby] = useState(0);

  // const { startGame, joinGame } = useBoardGameInstance();

  useEffect(() => {
    if (!passedInstance) {
      console.error("No instance passed from SplashZonePage");
      navigate("/splash-zone");
    }
  }, [passedInstance, navigate]);

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  };

  // Load instance
  useEffect(() => {
    if (!instanceId) {
      navigate('/splash-zone');
      return;
    }

    const loadedInstance = boardGameInstanceManager.getInstance(instanceId);
    
    if (!loadedInstance) {
      setError('Game lobby not found');
      return;
    }

    setInstance(loadedInstance);
  }, [instanceId, navigate]);

  // Refresh instance state periodically
  useEffect(() => {
    if (!instanceId) return;

    const interval = setInterval(() => {
      const updatedInstance = boardGameInstanceManager.getInstance(instanceId);
      if (updatedInstance) {
        setInstance(updatedInstance);

        // Start countdown when all players are ready
        if (updatedInstance.status === 'ready' && !countdown) {
          setCountdown(5);
        }

        // Navigate to game when it starts
        if (updatedInstance.status === 'playing' && !countdown) {
          navigate(`/board-game/${instanceId}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [instanceId, countdown, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Start the game
      if (instance && currentAccount) {
        handleStartGame();
      }
    }
  }, [countdown, instance, currentAccount]);

  // Time in lobby tracker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInLobby(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleJoinGame = async () => {
    if (!instance || !currentAccount || !instanceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Join the instance locally
      const joinResult = boardGameInstanceManager.joinInstance(
        instanceId,
        currentAccount.address,
        getDisplayName() || `Player ${currentAccount.address.slice(0, 6)}`
      );

      if (!joinResult.success) {
        setError(joinResult.error || 'Failed to join game');
        return;
      }

      // TODO: Execute blockchain transaction
      // const template = boardGameInstanceManager.getTemplate(instance.templateId);
      // await joinGame.mutateAsync({
      //   gameInstanceId: instanceId,
      //   templateId: instance.templateId,
      //   stakeAmount: template?.stakeAmount || 1000000000
      // });

      // Simulate payment confirmation
      boardGameInstanceManager.confirmPayment(instanceId, currentAccount.address);

      // Update local state
      const updatedInstance = boardGameInstanceManager.getInstance(instanceId);
      setInstance(updatedInstance);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!instance || !currentAccount || !instanceId) return;

    setIsLoading(true);

    try {
      const leaveResult = boardGameInstanceManager.leaveInstance(instanceId, currentAccount.address);

      if (leaveResult.success) {
        navigate('/splash-zone');
      } else {
        setError(leaveResult.error || 'Failed to leave game');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReady = () => {
    if (!instance || !currentAccount || !instanceId) return;

    const currentPlayer = instance.players.find(p => p.playerId === currentAccount.address);
    if (!currentPlayer) return;

    const newReadyState = !currentPlayer.isReady;
    boardGameInstanceManager.setPlayerReady(instanceId, currentAccount.address, newReadyState);

    const updatedInstance = boardGameInstanceManager.getInstance(instanceId);
    setInstance(updatedInstance);

    // If player just became ready, navigate to game play page
    if (newReadyState) {
      navigate('/board-game-play');
    }
  };

  const handleStartGame = async () => {
    if (!instance || !instanceId) return;

    try {
      const startResult = boardGameInstanceManager.startGame(instanceId);
      if (startResult.success) {
        navigate(`/board-game/${instanceId}`);
      } else {
        setError(startResult.error || 'Failed to start game');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = (): string => {
    if (!instance) return 'Loading...';

    if (countdown && countdown > 0) return `Starting in ${countdown}...`;
    if (instance.status === 'playing') return 'Game has started!';
    if (instance.status === 'ready') return 'All players ready! Starting soon...';
    if (instance.status === 'waiting') {
      const needed = instance.maxPlayers - instance.currentPlayers;
      return needed > 0 ? `Waiting for ${needed} more player${needed === 1 ? '' : 's'}...` : 'Waiting for players to get ready...';
    }
    return 'Game lobby';
  };

  const isPlayerInGame = (): boolean => {
    return !!instance?.players.some(p => p.playerId === currentAccount?.address);
  };

  const getCurrentPlayer = () => {
    return instance?.players.find(p => p.playerId === currentAccount?.address);
  };

  if (!instance) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
        <Text size="4" color="gray">
          {error || 'Loading game lobby...'}
        </Text>
      </Flex>
    );
  }

  const template = boardGameInstanceManager.getTemplate(instance.templateId);
  const currentPlayer = getCurrentPlayer();
  const canJoin = !isPlayerInGame() && instance.status === 'waiting' && instance.currentPlayers < instance.maxPlayers;
  const allPlayersReady = instance.players.every(p => p.isReady);

  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="6" style={{ color: "white" }} mb="1">
              {template?.name || 'Board Game Lobby'}
            </Heading>
            <Text size="3" color="gray">
              {getStatusMessage()}
            </Text>
          </Box>

          <Flex align="center" gap="4">
            <Box style={{ textAlign: "right" }}>
              <Text size="2" color="gray">Prize Pool</Text>
              <Text size="3" style={{ color: "var(--green-11)" }} weight="bold">
                {instance.prizePool.toFixed(2)} SUI
              </Text>
            </Box>

            <Box style={{ textAlign: "right" }}>
              <Text size="2" color="gray">Entry Fee</Text>
              <Text size="3" style={{ color: "var(--sky-11)" }} weight="bold">
                {instance.entryFee.toFixed(2)} SUI
              </Text>
            </Box>

            <Flex align="center" gap="2">
              🕐
              <Text size="2" color="gray">
                {formatTime(timeInLobby)}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {countdown && countdown > 0 && (
          <Box mt="4">
            <Progress value={(5 - countdown) * 20} style={{ height: "8px" }} />
            <Text size="2" color="gray" style={{ textAlign: "center", marginTop: "8px" }}>
              Game starting in {countdown} seconds...
            </Text>
          </Box>
        )}
      </Card>

      {/* Players */}
      <Grid columns="2" gap="6">
        <Card style={{ ...cardStyle, padding: "24px" }}>
          <Heading size="4" style={{ color: "white" }} mb="4">
            Players ({instance.currentPlayers}/{instance.maxPlayers})
          </Heading>

          <Flex direction="column" gap="3">
            {instance.players.map((player, index) => (
              <Card key={player.playerId} style={{
                ...cardStyle,
                padding: "16px",
                border: player.playerId === currentAccount?.address
                  ? "1px solid var(--sky-9)"
                  : cardStyle.border
              }}>
                <Flex align="center" gap="3">
                  <Avatar
                    src={player.avatarUrl || getAvatarUrl(32) || undefined}
                    fallback={(player.playerName?.charAt(0).toUpperCase() 
                              || player.playerId.slice(2, 3).toUpperCase() 
                              || "?")}
                    size="3"
                  />

                  <Box flex="1">
                    <Flex align="center" gap="2">
                      <Text size="3" weight="bold" style={{ color: "white" }}>
                        {player.playerName}
                      </Text>
                      {player.playerId === instance.creatorId && (
                        <Badge size="1" color="blue">Host</Badge>
                      )}
                      {player.playerId === currentAccount?.address && (
                        <Badge size="1" color="green">You</Badge>
                      )}
                    </Flex>
                    <Text size="2" color="gray">
                      {player.walletAddress
                        ? `${player.walletAddress.slice(0, 8)}...${player.walletAddress.slice(-6)}`
                        : "(no wallet)"}
                    </Text>
                  </Box>

                  <Flex align="center" gap="2">
                    {player.hasPaid ? (
                      <Badge size="1" color="green">
                        <CheckIcon width="12" height="12" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge size="1" color="orange">
                        🕐
                        Pending
                      </Badge>
                    )}

                    {player.isReady ? (
                      <Badge size="1" color="blue">
                        ⭐
                        Ready
                      </Badge>
                    ) : (
                      <Badge size="1" color="gray">
                        🕐
                        Not Ready
                      </Badge>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))}

            {/* Empty slots */}
            {Array.from({ length: instance.maxPlayers - instance.currentPlayers }).map((_, index) => (
              <Card key={`empty-${index}`} style={{
                ...cardStyle,
                padding: "16px",
                opacity: 0.5,
                border: "1px dashed rgba(148, 163, 184, 0.3)"
              }}>
                <Flex align="center" gap="3">
                  <Avatar fallback={<PersonIcon />} size="3" />
                  <Text size="3" color="gray" style={{ fontStyle: "italic" }}>
                    Waiting for player...
                  </Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Card>

        <Card style={{ ...cardStyle, padding: "24px" }}>
          <Heading size="4" style={{ color: "white" }} mb="4">Game Info</Heading>

          <Grid columns="1" gap="4">
            <Box>
              <Text size="2" color="gray" mb="2">Game Type</Text>
              <Text size="3" style={{ color: "white" }} weight="bold">
                {template?.name || 'Board Game'}
              </Text>
              <Text size="2" color="gray">
                {template?.description}
              </Text>
            </Box>

            <Separator size="4" />

            <Grid columns="2" gap="4">
              <Box>
                <Text size="2" color="gray">Dice Range</Text>
                <Text size="3" style={{ color: "white" }} weight="bold">
                  🎲 {template?.diceMin}-{template?.diceMax}
                </Text>
              </Box>

              <Box>
                <Text size="2" color="gray">Pieces per Player</Text>
                <Text size="3" style={{ color: "white" }} weight="bold">
                  {template?.piecesPerPlayer || 1}
                </Text>
              </Box>
            </Grid>

            <Separator size="4" />

            {/* Actions */}
            <Flex direction="column" gap="3">
              {canJoin && (
                <Button
                  size="3"
                  onClick={handleJoinGame}
                  disabled={isLoading || !currentAccount}
                  style={{
                    background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))",
                    width: "100%"
                  }}
                >
                  <PlayIcon />
                  {isLoading ? "Joining..." : `Join Game (${instance.entryFee.toFixed(2)} SUI)`}
                </Button>
              )}

              {isPlayerInGame() && instance.status === 'waiting' && (
                <Button
                  size="3"
                  variant={currentPlayer?.isReady ? "outline" : "solid"}
                  color={currentPlayer?.isReady ? "gray" : "blue"}
                  onClick={handleToggleReady}
                  style={{ width: "100%" }}
                >
                  {currentPlayer?.isReady ? (
                    <>
                      <Cross2Icon />
                      Cancel Ready
                    </>
                  ) : (
                    <>
                      <CheckIcon />
                      I'm Ready
                    </>
                  )}
                </Button>
              )}

              {isPlayerInGame() && instance.status !== 'playing' && (
                <Button
                  size="3"
                  variant="outline"
                  color="red"
                  onClick={handleLeaveGame}
                  disabled={isLoading}
                  style={{ width: "100%" }}
                >
                  <ExitIcon />
                  Leave Game
                </Button>
              )}

              {instance.status === 'ready' && allPlayersReady && !countdown && (
                <Text size="2" color="gray" style={{ textAlign: "center" }}>
                  All players ready! Game will start automatically...
                </Text>
              )}
            </Flex>

            {error && (
              <Box
                p="3"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.3)"
                }}
              >
                <Text size="2" style={{ color: "var(--red-11)" }}>
                  {error}
                </Text>
              </Box>
            )}
          </Grid>
        </Card>
      </Grid>

      {/* Game Rules */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Heading size="4" style={{ color: "white" }} mb="3">How to Play</Heading>
        <Grid columns="3" gap="4">
          <Box>
            <Text size="3" style={{ color: "var(--sky-11)" }} weight="bold" mb="2">
              1. Join & Pay
            </Text>
            <Text size="2" color="gray">
              Pay the entry fee to join the game. All fees go into the prize pool for the winner.
            </Text>
          </Box>
          <Box>
            <Text size="3" style={{ color: "var(--sky-11)" }} weight="bold" mb="2">
              2. Get Ready
            </Text>
            <Text size="2" color="gray">
              Once all players have joined, mark yourself as ready. The game starts when everyone is ready.
            </Text>
          </Box>
          <Box>
            <Text size="3" style={{ color: "var(--sky-11)" }} weight="bold" mb="2">
              3. Play & Win
            </Text>
            <Text size="2" color="gray">
              Roll dice, move your pieces, and be the first to get all pieces to the finish line!
            </Text>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}