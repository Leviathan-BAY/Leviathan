import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Flex, Box, Heading, Text, Card, Button, Grid, Badge, Avatar, Separator } from "@radix-ui/themes";
import { PlayIcon, CubeIcon, HomeIcon } from "@radix-ui/react-icons";
import { useBoardGameInstance } from "../contracts/hooks";
import { BoardGameInstance } from "../utils/boardGameInstanceManager";

interface GamePiece {
  id: number;
  playerId: string;
  position: number;
  isHome: boolean;
}

interface BoardCell {
  id: number;
  type: 'normal' | 'start' | 'finish' | 'special';
  owner?: string;
  pieces: GamePiece[];
}

interface GameState {
  instanceId: string;
  templateId: string;
  players: string[];
  currentPlayerIndex: number;
  turn: number;
  board: BoardCell[];
  gamePhase: 'waiting' | 'playing' | 'finished';
  winner?: string;
  lastDiceRoll?: number;
}

export function BoardPlayPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const { rollDiceAndMove } = useBoardGameInstance();

  const location = useLocation();

  // ✅ location.state에서 instance 받기
  const passedInstance = (location.state as { instance?: BoardGameInstance })?.instance;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  // Board size is 5x5 = 25 cells
  const BOARD_SIZE = 5;
  const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

  useEffect(() => {
    if (instanceId) {
      loadGameState();
    }
  }, [instanceId, client]);

  const loadGameState = async () => {
    try {
      setIsLoading(true);

      // Load game instance from blockchain
      const gameObject = await client.getObject({
        id: instanceId!,
        options: { showContent: true }
      });

      if (!gameObject.data?.content || gameObject.data.content.dataType !== 'moveObject') {
        throw new Error("Invalid game object");
      }

      const gameFields = (gameObject.data.content as any).fields;

      // Create initial board state
      const board: BoardCell[] = Array.from({ length: TOTAL_CELLS }, (_, index) => ({
        id: index,
        type: getDefaultCellType(index),
        pieces: []
      }));

      // Mock game state - in real implementation, this would come from the blockchain
      const newGameState: GameState = {
        instanceId: instanceId!,
        templateId: gameFields.template_id,
        players: gameFields.players || [],
        currentPlayerIndex: gameFields.current_player_index || 0,
        turn: gameFields.turn || 1,
        board,
        gamePhase: gameFields.started ? 'playing' : 'waiting',
        winner: gameFields.winner
      };

      setGameState(newGameState);
      setIsMyTurn(
        currentAccount &&
        newGameState.players.length > 0 &&
        newGameState.players[newGameState.currentPlayerIndex] === currentAccount.address
      );
    } catch (error) {
      console.error("Failed to load game state:", error);
      alert("Failed to load game. Returning to Splash Zone.");
      navigate("/splash-zone");
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultCellType = (index: number): 'normal' | 'start' | 'finish' | 'special' => {
    // Corner cells are start positions
    if (index === 0 || index === 4 || index === 20 || index === 24) {
      return 'start';
    }
    // Center cell is finish
    if (index === 12) {
      return 'finish';
    }
    // Some random special cells
    if ([6, 8, 16, 18].includes(index)) {
      return 'special';
    }
    return 'normal';
  };

  const handleRollDice = async () => {
    if (!currentAccount || !gameState || !isMyTurn || diceRolling) return;

    try {
      setDiceRolling(true);

      // Mock dice roll for UI
      const mockRoll = Math.floor(Math.random() * 6) + 1;
      setGameState(prev => prev ? { ...prev, lastDiceRoll: mockRoll } : null);

      // In real implementation, call the blockchain function
      // await rollDiceAndMove.mutateAsync({
      //   gameInstanceId: gameState.instanceId,
      //   templateId: gameState.templateId,
      //   pieceIndex: selectedPiece || 0,
      //   randomObjectId: "0x123..." // Get from Sui random module
      // });

      // Mock turn advancement
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return null;
          const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
          return {
            ...prev,
            currentPlayerIndex: nextPlayerIndex,
            turn: nextPlayerIndex === 0 ? prev.turn + 1 : prev.turn
          };
        });
        setIsMyTurn(false);
        setSelectedPiece(null);
        setDiceRolling(false);
      }, 2000);

    } catch (error) {
      console.error("Failed to roll dice:", error);
      alert("Failed to make move. Please try again.");
      setDiceRolling(false);
    }
  };

  const getCellColor = (cell: BoardCell) => {
    switch (cell.type) {
      case 'start':
        return 'var(--green-9)';
      case 'finish':
        return 'var(--gold-9)';
      case 'special':
        return 'var(--purple-9)';
      default:
        return 'var(--gray-6)';
    }
  };

  const getPlayerColor = (playerIndex: number) => {
    const colors = ['var(--blue-9)', 'var(--red-9)', 'var(--green-9)', 'var(--yellow-9)'];
    return colors[playerIndex % colors.length];
  };

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <Text size="4" color="gray">Loading game...</Text>
      </Flex>
    );
  }

  if (!gameState) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
        <Text size="4" color="gray">Game not found</Text>
        <Button onClick={() => navigate("/splash-zone")} style={{ marginTop: "16px" }}>
          <HomeIcon /> Return to Splash Zone
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="6" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
      {/* Header */}
      <Card style={{
        background: "rgba(30, 41, 59, 0.6)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="6" style={{ color: "white", marginBottom: "8px" }}>
              Board Game - Turn {gameState.turn}
            </Heading>
            <Text size="3" color="gray">
              Instance: {gameState.instanceId.slice(0, 8)}...
            </Text>
          </Box>
          <Button
            onClick={() => navigate("/splash-zone")}
            variant="outline"
            style={{ border: "1px solid rgba(148, 163, 184, 0.3)" }}
          >
            <HomeIcon /> Exit Game
          </Button>
        </Flex>
      </Card>

      <Grid columns="3" gap="6">
        {/* Game Board */}
        <Box style={{ gridColumn: "span 2" }}>
          <Card style={{
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "16px",
            padding: "24px"
          }}>
            <Heading size="5" style={{ color: "white", marginBottom: "24px", textAlign: "center" }}>
              Game Board
            </Heading>

            <Grid
              columns={BOARD_SIZE.toString()}
              gap="2"
              style={{
                aspectRatio: "1",
                maxWidth: "500px",
                margin: "0 auto"
              }}
            >
              {gameState.board.map((cell) => (
                <Box
                  key={cell.id}
                  style={{
                    aspectRatio: "1",
                    background: getCellColor(cell),
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: cell.pieces.length > 0 ? "pointer" : "default"
                  }}
                  onClick={() => {
                    if (cell.pieces.length > 0 && isMyTurn) {
                      setSelectedPiece(cell.pieces[0].id);
                    }
                  }}
                >
                  {/* Cell type indicator */}
                  {cell.type === 'start' && (
                    <Text size="1" style={{ color: "white", fontWeight: "bold" }}>S</Text>
                  )}
                  {cell.type === 'finish' && (
                    <Text size="1" style={{ color: "white", fontWeight: "bold" }}>F</Text>
                  )}
                  {cell.type === 'special' && (
                    <Text size="1" style={{ color: "white", fontWeight: "bold" }}>★</Text>
                  )}

                  {/* Game pieces */}
                  {cell.pieces.map((piece, index) => (
                    <Box
                      key={piece.id}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: getPlayerColor(gameState.players.indexOf(piece.playerId)),
                        border: selectedPiece === piece.id ? "2px solid white" : "1px solid rgba(0,0,0,0.3)",
                        transform: `translate(${index * 8}px, ${index * 8}px)`
                      }}
                    />
                  ))}
                </Box>
              ))}
            </Grid>
          </Card>
        </Box>

        {/* Game Controls */}
        <Box>
          <Card style={{
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px"
          }}>
            <Heading size="4" style={{ color: "white", marginBottom: "16px" }}>
              Your Turn
            </Heading>

            {gameState.lastDiceRoll && (
              <Box style={{ textAlign: "center", marginBottom: "16px" }}>
                <Text size="6" style={{ color: "var(--leviathan-sky-blue)" }}>
                  🎲 {gameState.lastDiceRoll}
                </Text>
              </Box>
            )}

            <Flex direction="column" gap="3">
              <Button
                size="3"
                disabled={!isMyTurn || diceRolling}
                onClick={handleRollDice}
                style={{
                  width: "100%",
                  background: isMyTurn && !diceRolling ? "var(--leviathan-ocean)" : "var(--gray-6)",
                  color: "white"
                }}
              >
                <CubeIcon />
                {diceRolling ? "Rolling..." : "Roll Dice"}
              </Button>

              {!isMyTurn && (
                <Text size="2" color="gray" style={{ textAlign: "center" }}>
                  Waiting for other players...
                </Text>
              )}
            </Flex>
          </Card>

          {/* Players List */}
          <Card style={{
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "16px",
            padding: "24px"
          }}>
            <Heading size="4" style={{ color: "white", marginBottom: "16px" }}>
              Players ({gameState.players.length})
            </Heading>

            <Flex direction="column" gap="3">
              {gameState.players.map((playerId, index) => (
                <Flex key={playerId} align="center" gap="3">
                  <Box
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: getPlayerColor(index)
                    }}
                  />
                  <Text
                    size="2"
                    style={{
                      color: index === gameState.currentPlayerIndex ? "white" : "var(--gray-11)",
                      fontWeight: index === gameState.currentPlayerIndex ? "bold" : "normal"
                    }}
                  >
                    {playerId === currentAccount?.address ? "You" : `Player ${index + 1}`}
                    {index === gameState.currentPlayerIndex && " (Current)"}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>
        </Box>
      </Grid>
    </Flex>
  );
}
