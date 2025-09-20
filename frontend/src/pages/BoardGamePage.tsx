import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Avatar } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PlayIcon,
  ExitIcon,
  PersonIcon,
  CheckIcon
} from "@radix-ui/react-icons";
import { boardGameInstanceManager, BoardGameInstance, BoardGamePlayer } from "../utils/boardGameInstanceManager";
import { useBoardGameInstance } from "../contracts/hooks";

export function BoardGamePage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

  const [instance, setInstance] = useState<BoardGameInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [gameTime, setGameTime] = useState(0);

  const { rollDiceAndMove } = useBoardGameInstance();

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
      setError('Game not found');
      return;
    }

    if (loadedInstance.status !== 'playing') {
      navigate(`/board-game-lobby/${instanceId}`);
      return;
    }

    setInstance(loadedInstance);
  }, [instanceId, navigate]);

  // Refresh game state periodically
  useEffect(() => {
    if (!instanceId) return;

    const interval = setInterval(() => {
      const updatedInstance = boardGameInstanceManager.getInstance(instanceId);
      if (updatedInstance) {
        setInstance(updatedInstance);

        // Navigate away if game ends
        if (updatedInstance.status === 'finished') {
          // Stay on the page to show results, but could navigate after delay
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [instanceId]);

  // Game timer
  useEffect(() => {
    if (instance?.status === 'playing') {
      const startTime = instance.startedAt || Date.now();
      const timer = setInterval(() => {
        setGameTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [instance?.status, instance?.startedAt]);

  const handleRollDice = async (pieceIndex: number) => {
    if (!instance || !currentAccount || !instanceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Execute move locally first
      const moveResult = boardGameInstanceManager.rollDiceAndMove(
        instanceId,
        currentAccount.address,
        pieceIndex
      );

      if (!moveResult.success) {
        setError(moveResult.error || 'Move failed');
        return;
      }

      // TODO: Execute blockchain transaction
      // await rollDiceAndMove.mutateAsync({
      //   gameInstanceId: instanceId,
      //   templateId: instance.templateId,
      //   pieceIndex,
      //   randomObjectId: "0x..." // Need to implement random oracle
      // });

      console.log('Move result:', moveResult.result);

      // Update local state
      const updatedInstance = boardGameInstanceManager.getInstance(instanceId);
      setInstance(updatedInstance);
      setSelectedPiece(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPlayer = (): BoardGamePlayer | null => {
    if (!instance) return null;
    return instance.players[instance.currentPlayerIndex] || null;
  };

  const getPlayerByPiece = (position: number): { player: BoardGamePlayer; piece: any } | null => {
    if (!instance) return null;

    for (const player of instance.players) {
      for (const piece of player.pieces) {
        if (piece.position === position) {
          return { player, piece };
        }
      }
    }
    return null;
  };

  const renderBoard = () => {
    const boardSize = 10; // 10x10 board
    const cells = [];

    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / boardSize);
      const col = i % boardSize;
      const isStart = i === 0;
      const isFinish = i === 99;
      const isPath = row === 0 || row === 9 || col === 0 || col === 9; // Outer ring

      const pieceOnCell = getPlayerByPiece(i);

      cells.push(
        <Card
          key={i}
          style={{
            ...cardStyle,
            padding: "4px",
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isStart ? "var(--green-9)" :
                       isFinish ? "var(--orange-9)" :
                       isPath ? "rgba(56, 189, 248, 0.3)" :
                       "rgba(148, 163, 184, 0.1)",
            border: pieceOnCell ? "2px solid var(--purple-9)" : cardStyle.border,
            cursor: "default"
          }}
        >
          {pieceOnCell && (
            <Flex direction="column" align="center">
              <Avatar
                fallback={pieceOnCell.player.playerName.charAt(0)}
                size="1"
                style={{
                  background: `var(--${['blue', 'green', 'red', 'purple'][instance?.players.indexOf(pieceOnCell.player) || 0]}-9)`
                }}
              />
              <Text size="1" style={{ fontSize: "8px" }}>
                P{pieceOnCell.piece.pieceId + 1}
              </Text>
            </Flex>
          )}
          {isStart && !pieceOnCell && (
            <Text size="1" style={{ color: "white" }}>START</Text>
          )}
          {isFinish && !pieceOnCell && (
            <Text size="1" style={{ color: "white" }}>FINISH</Text>
          )}
          {!isPath && !isStart && !isFinish && !pieceOnCell && (
            <Text size="1" color="gray">{i}</Text>
          )}
        </Card>
      );
    }

    return (
      <Grid
        columns="10"
        gap="1"
        style={{
          maxWidth: "400px",
          margin: "0 auto"
        }}
      >
        {cells}
      </Grid>
    );
  };

  const renderPlayerPanel = (player: BoardGamePlayer, index: number) => {
    const isCurrentPlayer = getCurrentPlayer()?.playerId === player.playerId;
    const isMyTurn = isCurrentPlayer && player.playerId === currentAccount?.address;
    const playerColor = ['blue', 'green', 'red', 'purple'][index];

    return (
      <Card
        key={player.playerId}
        style={{
          ...cardStyle,
          padding: "16px",
          border: isCurrentPlayer ? `2px solid var(--${playerColor}-9)` : cardStyle.border
        }}
      >
        <Flex align="center" gap="3" mb="3">
          <Avatar
            fallback={player.playerName.charAt(0)}
            size="3"
            style={{ background: `var(--${playerColor}-9)` }}
          />
          <Box flex="1">
            <Flex align="center" gap="2">
              <Text size="3" weight="bold" style={{ color: "white" }}>
                {player.playerName}
              </Text>
              {player.playerId === currentAccount?.address && (
                <Badge size="1" color="blue">You</Badge>
              )}
              {isCurrentPlayer && (
                <Badge size="1" color="green">
                  <PlayIcon width="12" height="12" />
                  Turn
                </Badge>
              )}
            </Flex>
            <Text size="2" color="gray">
              {player.pieces.filter(p => p.isFinished).length}/{player.pieces.length} pieces finished
            </Text>
          </Box>
        </Flex>

        <Heading size="3" style={{ color: "white" }} mb="2">Pieces</Heading>
        <Grid columns="1" gap="2">
          {player.pieces.map((piece, pieceIndex) => (
            <Card
              key={pieceIndex}
              style={{
                ...cardStyle,
                padding: "8px",
                border: selectedPiece === pieceIndex && isMyTurn ? "2px solid var(--purple-9)" : cardStyle.border,
                cursor: isMyTurn && !piece.isFinished ? "pointer" : "default",
                opacity: piece.isFinished ? 0.6 : 1
              }}
              onClick={() => {
                if (isMyTurn && !piece.isFinished) {
                  setSelectedPiece(pieceIndex);
                }
              }}
            >
              <Flex justify="between" align="center">
                <Text size="2" style={{ color: "white" }}>
                  Piece {pieceIndex + 1}
                </Text>
                <Flex align="center" gap="2">
                  <Text size="2" color="gray">
                    Position: {piece.position}
                  </Text>
                  {piece.isFinished && (
                    <Badge size="1" color="green">
                      <CheckIcon width="12" height="12" />
                    </Badge>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>

        {isMyTurn && (
          <Box mt="3">
            <Button
              size="3"
              onClick={() => selectedPiece !== null && handleRollDice(selectedPiece)}
              disabled={isLoading || selectedPiece === null}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, var(--purple-9), var(--violet-9))"
              }}
            >
              {isLoading ? "Rolling..." : "🎲 Roll Dice & Move"}
            </Button>

            {selectedPiece === null && (
              <Text size="2" color="gray" style={{ textAlign: "center", marginTop: "8px" }}>
                Select a piece to move
              </Text>
            )}
          </Box>
        )}
      </Card>
    );
  };

  if (!instance) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
        <Text size="4" color="gray">
          {error || 'Loading game...'}
        </Text>
      </Flex>
    );
  }

  const template = boardGameInstanceManager.getTemplate(instance.templateId);
  const currentPlayer = getCurrentPlayer();

  return (
    <Flex direction="column" gap="6">
      {/* Game Header */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="6" style={{ color: "white" }} mb="1">
              {template?.name || 'Board Game'}
            </Heading>
            <Text size="3" color="gray">
              Turn {instance.gameState.turn} • {currentPlayer?.playerName || 'Game'}'s turn
            </Text>
          </Box>

          <Flex align="center" gap="4">
            <Box style={{ textAlign: "right" }}>
              <Text size="2" color="gray">Game Time</Text>
              <Flex align="center" gap="1">
                🕐
                <Text size="3" style={{ color: "white" }} weight="bold">
                  {formatTime(gameTime)}
                </Text>
              </Flex>
            </Box>

            <Box style={{ textAlign: "right" }}>
              <Text size="2" color="gray">Prize Pool</Text>
              <Text size="3" style={{ color: "var(--green-11)" }} weight="bold">
                {instance.prizePool.toFixed(2)} SUI
              </Text>
            </Box>

            <Button
              size="2"
              variant="outline"
              onClick={() => navigate('/splash-zone')}
            >
              <ExitIcon /> Exit Game
            </Button>
          </Flex>
        </Flex>

        {instance.gameState.lastDiceRoll && instance.gameState.lastMove && (
          <Box mt="4" p="3" style={{
            background: "rgba(147, 51, 234, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(147, 51, 234, 0.3)"
          }}>
            <Text size="2" style={{ color: "var(--purple-11)" }}>
              Last move: {instance.players.find(p => p.playerId === instance.gameState.lastMove?.playerId)?.playerName}
              rolled {instance.gameState.lastDiceRoll} and moved piece {(instance.gameState.lastMove.pieceId || 0) + 1}
              from {instance.gameState.lastMove.fromPosition} to {instance.gameState.lastMove.toPosition}
            </Text>
          </Box>
        )}
      </Card>

      {/* Game Board */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Heading size="4" style={{ color: "white" }} mb="4" textAlign="center">
          Game Board
        </Heading>
        {renderBoard()}
      </Card>

      {/* Players */}
      <Grid columns="2" gap="4">
        {instance.players.map((player, index) => renderPlayerPanel(player, index))}
      </Grid>

      {/* Game Actions */}
      {error && (
        <Card style={{
          ...cardStyle,
          padding: "16px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)"
        }}>
          <Text size="3" style={{ color: "var(--red-11)" }}>
            {error}
          </Text>
        </Card>
      )}

      {/* Game Finished */}
      {instance.status === 'finished' && (
        <Card style={{
          ...cardStyle,
          padding: "32px",
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))",
          border: "2px solid var(--green-9)"
        }}>
          <Text size="8" style={{ fontSize: "64px", margin: "0 auto 16px", display: "block", textAlign: "center" }}>🏆</Text>
          <Heading size="5" style={{ color: "white" }} mb="2">Game Finished!</Heading>

          {instance.winnerId && (
            <Box mb="4">
              <Text size="4" style={{ color: "var(--green-11)" }} weight="bold" mb="2">
                🎉 Winner: {instance.players.find(p => p.playerId === instance.winnerId)?.playerName}
              </Text>
              <Text size="3" color="gray">
                Prize: {(instance.prizePool * 0.95).toFixed(2)} SUI
              </Text>
            </Box>
          )}

          <Flex gap="4" justify="center">
            <Button
              size="3"
              onClick={() => navigate('/splash-zone')}
              style={{ background: "linear-gradient(135deg, var(--sky-9), var(--blue-9))" }}
            >
              Back to Splash Zone
            </Button>
            <Button
              size="3"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Play Again
            </Button>
          </Flex>
        </Card>
      )}

      {/* Game Info */}
      <Card style={{ ...cardStyle, padding: "16px" }}>
        <Heading size="3" style={{ color: "white" }} mb="3">Game Info</Heading>
        <Grid columns="3" gap="3">
          <Box>
            <Text size="2" color="gray">Dice Range</Text>
            <Text size="3" style={{ color: "white" }} weight="bold">
              🎲 {template?.diceMin}-{template?.diceMax}
            </Text>
          </Box>
          <Box>
            <Text size="2" color="gray">Players</Text>
            <Text size="3" style={{ color: "white" }} weight="bold">
              {instance.currentPlayers}/{instance.maxPlayers}
            </Text>
          </Box>
          <Box>
            <Text size="2" color="gray">Status</Text>
            <Badge color={instance.status === 'playing' ? 'green' : 'gray'}>
              {instance.status}
            </Badge>
          </Box>
        </Grid>
      </Card>
    </Flex>
  );
}