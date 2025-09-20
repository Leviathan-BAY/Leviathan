import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
  Flex,
  Box,
  Heading,
  Text,
  Card,
  Button,
  Grid,
  Badge,
  Avatar
} from '@radix-ui/themes';
import {
  PlayIcon,
  CubeIcon,
  HomeIcon,
  PersonIcon,
  ExitIcon
} from '@radix-ui/react-icons';
import { BOARD_CELL_TYPES } from '../contracts/constants';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '../contracts/constants';
import { useSuiClient } from '@mysten/dapp-kit';
// Board cell types matching the Move contract
const CELL_TYPES = {
  UNSET: -1,
  PASSABLE: BOARD_CELL_TYPES.PASSABLE,
  BLOCKED: BOARD_CELL_TYPES.BLOCKED,
  BOMB: BOARD_CELL_TYPES.BOMB,
  START: BOARD_CELL_TYPES.START,
  FINISH: BOARD_CELL_TYPES.FINISH,
} as const;
const RANDOM_OBJECT_ID = "0x8";
const CELL_TYPE_COLORS = {
  [CELL_TYPES.UNSET]: '#1e293b',
  [CELL_TYPES.PASSABLE]: '#16a34a',
  [CELL_TYPES.BLOCKED]: '#6b7280',
  [CELL_TYPES.BOMB]: '#dc2626',
  [CELL_TYPES.START]: '#059669',
  [CELL_TYPES.FINISH]: '#2563eb',
} as const;

const CELL_TYPE_EMOJIS = {
  [CELL_TYPES.UNSET]: '',
  [CELL_TYPES.PASSABLE]: '',
  [CELL_TYPES.BLOCKED]: '🧱',
  [CELL_TYPES.BOMB]: '💣',
  [CELL_TYPES.START]: '🏁',
  [CELL_TYPES.FINISH]: '🏆',
} as const;

interface GamePiece {
  id: number;
  playerId: string;
  position: number;
  isFinished: boolean;
}

interface BoardCell {
  id: number;
  type: number;
  pieces: GamePiece[];
}

interface Player {
  playerId: string;
  playerName: string;
  pieces: { pieceId: number; position: number; isFinished: boolean }[];
  isReady: boolean;
}

export function BoardGamePlayPage() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  // 하드코딩된 패키지 ID
  const HARDCODED_PACKAGE_ID = '0xa1a8da6c1b3bea68fe5f9d5c0d1a9fe6507664f77fd8ec7f84681a7287c2caef';
  const HARDCODED_GAME_ID = '0x56b600c2a79683ba8e549bd623317a193e8e9d60e04e4abf17457771501fe693'; // 하드코딩된 게임 인스턴스 ID

  // 하드코딩된 게임 데이터
  const [GAME_ID, setGameId] = useState();
  const [gameBoard, setGameBoard] = useState<BoardCell[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [lastDiceRoll, setLastDiceRoll] = useState<number | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<string>('playing');
  const [winnerPlayerId, setWinnerPlayerId] = useState<string | null>(null);

  // 하드코딩된 플레이어 데이터
  const hardcodedPlayers: Player[] = [
    {
      playerId: currentAccount?.address || 'player1',
      playerName: 'You',
      pieces: [
        { pieceId: 0, position: 0, isFinished: false },
        { pieceId: 1, position: 1, isFinished: false },
        { pieceId: 2, position: 2, isFinished: false }
      ],
      isReady: true
    },
    {
      playerId: 'player2',
      playerName: 'AI Player',
      pieces: [
        { pieceId: 10, position: 0, isFinished: false },
        { pieceId: 11, position: 1, isFinished: false },
        { pieceId: 12, position: 2, isFinished: false }
      ],
      isReady: true
    }
  ];

  // 하드코딩된 게임 설정
  const hardcodedTemplate = {
    name: 'Racing Track Game',
    description: 'A fun racing game with obstacles',
    diceMin: 1,
    diceMax: 6,
    piecesPerPlayer: 3,
    stakeAmount: 1000000000,
    packageId: HARDCODED_PACKAGE_ID
  };

  const cardStyle = {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    borderRadius: "16px",
    transition: "all 0.3s ease",
  };

  // Initialize board
  useEffect(() => {
    const cells: BoardCell[] = [];

    // Create 10x10 board (100 cells)
    for (let i = 0; i < 100; i++) {
      let cellType = CELL_TYPES.PASSABLE; // Default to passable

      // Create a pattern like in the image
      if (i < 3) {
        cellType = CELL_TYPES.START; // Top row start positions (0, 1, 2)
      } else if (i >= 97 && i < 100) {
        cellType = CELL_TYPES.FINISH; // Bottom row finish positions (97, 98, 99)
      } else if ([
        // Brick wall pattern from the image
        13, 14, 15, 16, // Row 1
        23, 26, // Row 2 ends
        33, 36, // Row 3 ends
        43, 44, 45, 46, // Row 4
        53, 56, // Row 5 ends
        63, 66, // Row 6 ends
        73, 74, 75, 76, // Row 7
        83, 86  // Row 8 ends
      ].includes(i)) {
        cellType = CELL_TYPES.BLOCKED;
      }

      cells.push({
        id: i,
        type: cellType,
        pieces: []
      });
    }

    // Place player pieces at start positions
    hardcodedPlayers.forEach((player, playerIndex) => {
      player.pieces.forEach((piece, pieceIndex) => {
        const startPositions = [0, 1, 2];
        const startPosition = startPositions[pieceIndex % startPositions.length] || 0;

        const gamePiece: GamePiece = {
          id: playerIndex * 100 + pieceIndex, // Unique ID
          playerId: player.playerId,
          position: startPosition,
          isFinished: piece.isFinished
        };

        cells[startPosition].pieces.push(gamePiece);
      });
    });

    setGameBoard(cells);
    setIsMyTurn(hardcodedPlayers[0]?.playerId === currentAccount?.address);
  }, [currentAccount]);

  const handleStartGame = async () => {
    if (!currentAccount) {
      alert("Please connect your Sui wallet first to start the game!");
      return;
    }

    try {
      const tx = new Transaction();

      // Move 컨트랙트의 start_game 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::board_game_launcher::start_game`,
        arguments: [
          tx.object(HARDCODED_PACKAGE_ID), // 템플릿 object
          tx.splitCoins(tx.gas, [1_000_000_0])[0] // 1 SUI 스테이크
        ]
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Start game transaction successful:", result);
            alert("Game started!");
            // 게임 시작 시 추가 로직이 있다면 여기에서 state 업데이트 가능
          },
          onError: (error) => {
            console.error("Start game transaction failed:", error);
            alert("Transaction failed: " + error.message);
          },
        }
      );

    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating start_game transaction");
    }
  };

  const handleDiceRoll = async () => {
    if (!isMyTurn || gameStatus === 'finished' || !currentAccount) return;

    try {
      // 블록체인 트랜잭션 생성
      const tx = new Transaction();

      // Move 컨트랙트의 roll_dice_and_move 함수 호출
      tx.moveCall({
        target: `${PACKAGE_ID}::board_game_launcher::roll_dice`,
        arguments: [
          tx.object(HARDCODED_GAME_ID), // game_id
          tx.object(HARDCODED_PACKAGE_ID),
          tx.object(RANDOM_OBJECT_ID),
        ]
      });

      // 트랜잭션 실행
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Dice roll transaction successful:', result);

            // 트랜잭션 성공 후 로컬 게임 상태 업데이트
            simulateLocalMove();
          },
          onError: (error) => {
            console.error('Dice roll transaction failed:', error);
            alert('Transaction failed: ' + error.message);
          }
        }
      );

    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction');
    }
  };

  // 로컬 게임 상태 시뮬레이션 (트랜잭션 성공 후 호출)
  const simulateLocalMove = () => {
    // Roll dice using template configuration
    const diceResult = Math.floor(Math.random() * (hardcodedTemplate.diceMax - hardcodedTemplate.diceMin + 1)) + hardcodedTemplate.diceMin;
    setLastDiceRoll(diceResult);

    // Find current player's piece
    let currentPiecePosition = 0;
    let boardPiece: GamePiece | null = null;

    for (let i = 0; i < gameBoard.length; i++) {
      const piece = gameBoard[i].pieces.find(p => p.playerId === currentAccount?.address && !p.isFinished);
      if (piece) {
        currentPiecePosition = i;
        boardPiece = piece;
        break;
      }
    }

    if (boardPiece) {
      // Calculate new position
      let newPosition = currentPiecePosition + diceResult;

      // Check bounds
      if (newPosition >= 100) {
        newPosition = 99; // Cap at last position
      }

      // Check if new position is blocked
      if (gameBoard[newPosition] && gameBoard[newPosition].type === CELL_TYPES.BLOCKED) {
        // Move back to a safe position
        newPosition = currentPiecePosition;
      }

      // Update local game state
      const updatedBoard = [...gameBoard];

      // Remove piece from old position
      updatedBoard[currentPiecePosition].pieces =
        updatedBoard[currentPiecePosition].pieces.filter(p => p.id !== boardPiece!.id);

      // Update piece data
      boardPiece.position = newPosition;
      boardPiece.isFinished = gameBoard[newPosition].type === CELL_TYPES.FINISH;

      // Add piece to new position
      updatedBoard[newPosition].pieces.push(boardPiece);

      setGameBoard(updatedBoard);

      // Check for game end
      if (boardPiece.isFinished) {
        setGameStatus('finished');
        setWinnerPlayerId(currentAccount?.address || 'player1');
      } else {
        // Next player's turn
        const nextPlayerIndex = (currentPlayerIndex + 1) % hardcodedPlayers.length;
        setCurrentPlayerIndex(nextPlayerIndex);
        setIsMyTurn(hardcodedPlayers[nextPlayerIndex]?.playerId === currentAccount?.address);
      }
    }
  };

  const handleBackToLobby = () => {
    navigate('/splash-zone');
  };

  const handleExitGame = () => {
    navigate('/splash-zone');
  };

  const getCurrentPlayer = () => {
    return hardcodedPlayers[currentPlayerIndex];
  };

  const getPlayerColor = (playerId: string): string => {
    const playerIndex = hardcodedPlayers.findIndex(p => p.playerId === playerId);
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']; // red, blue, green, amber
    return colors[playerIndex] || '#6b7280';
  };

  const renderBoard = () => (
    <Grid columns="10" gap="1" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {gameBoard.map((cell, index) => (
        <Box
          key={index}
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: CELL_TYPE_COLORS[cell.type as keyof typeof CELL_TYPE_COLORS],
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            position: 'relative',
            cursor: cell.pieces.length > 0 ? 'pointer' : 'default'
          }}
          title={`Cell ${index}: ${Object.keys(CELL_TYPES).find(key => CELL_TYPES[key as keyof typeof CELL_TYPES] === cell.type) || 'Unknown'}`}
        >
          {/* Cell type emoji */}
          {CELL_TYPE_EMOJIS[cell.type as keyof typeof CELL_TYPE_EMOJIS]}

          {/* Player pieces */}
          {cell.pieces.length > 0 && (
            <Box
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1px',
                zIndex: 10
              }}
            >
              {cell.pieces.map((piece, pieceIndex) => (
                <Box
                  key={piece.id}
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: getPlayerColor(piece.playerId),
                    borderRadius: '50%',
                    border: '2px solid white',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                  title={`Player: ${hardcodedPlayers.find(p => p.playerId === piece.playerId)?.playerName || 'Unknown'}`}
                >
                  {pieceIndex + 1}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Grid>
  );

  const currentPlayer = getCurrentPlayer();

  return (
    <Flex direction="column" gap="6" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <Card style={{ ...cardStyle, padding: "24px" }}>
        <Flex justify="between" align="center">
          <Box>
            <Heading size="6" style={{ color: "white" }} mb="1">
              {hardcodedTemplate.name}
            </Heading>
            <Text size="3" color="gray">
              {gameStatus === 'finished'
                ? `Game Finished! Winner: ${hardcodedPlayers.find(p => p.playerId === winnerPlayerId)?.playerName || 'Unknown'}`
                : `${currentPlayer?.playerName || 'Unknown'}'s Turn`
              }
            </Text>
          </Box>

          <Flex align="center" gap="4">
            <Text size="2" color="gray">
              Package ID: {HARDCODED_PACKAGE_ID.slice(0, 10)}...
            </Text>
            <Button
              size="2"
              variant="outline"
              onClick={handleBackToLobby}
            >
              <HomeIcon />
              Back to Lobby
            </Button>
            <Button
              size="2"
              variant="outline"
              color="red"
              onClick={handleExitGame}
            >
              <ExitIcon />
              Exit Game
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Grid columns={{ initial: '1', lg: '4' }} gap="6">
        {/* Game Board */}
        <Box style={{ gridColumn: 'span 3' }}>
          <Card style={{ ...cardStyle, padding: "24px" }}>
            <Heading size="4" style={{ color: "white" }} mb="4" align="center">
              Game Board
            </Heading>
            {renderBoard()}

            <Box mt="4" style={{ textAlign: 'center' }}>
              <Text size="2" color="gray">
                Total 100 cells -
                Unset: {gameBoard.filter(cell => cell.type === CELL_TYPES.UNSET).length},
                Passable: {gameBoard.filter(cell => cell.type === CELL_TYPES.PASSABLE).length},
                Walls: {gameBoard.filter(cell => cell.type === CELL_TYPES.BLOCKED).length},
                Bombs: {gameBoard.filter(cell => cell.type === CELL_TYPES.BOMB).length},
                Start: {gameBoard.filter(cell => cell.type === CELL_TYPES.START).length},
                Finish: {gameBoard.filter(cell => cell.type === CELL_TYPES.FINISH).length}
              </Text>
            </Box>
          </Card>
        </Box>

        {/* Game Controls and Info */}
        <Box>
            <Button
              size="3"
              onClick={handleStartGame}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, var(--green-9), var(--emerald-9))",
                marginBottom: "8px"
              }}
            >
              ▶ Start Game
            </Button>
          <Flex direction="column" gap="4">
            {/* Current Turn */}
            <Card style={{ ...cardStyle, padding: "16px" }}>
              <Heading size="4" style={{ color: "white" }} mb="3">Current Turn</Heading>

              {currentPlayer && (
                <Flex align="center" gap="3" mb="3">
                  <Avatar
                    fallback={<PersonIcon />}
                    size="3"
                    style={{
                      backgroundColor: getPlayerColor(currentPlayer.playerId),
                      color: 'white'
                    }}
                  />
                  <Box>
                    <Text size="3" style={{ color: "white" }} weight="bold">
                      {currentPlayer.playerName}
                    </Text>
                    <Text size="2" color="gray">
                      {isMyTurn ? "Your turn!" : "Waiting..."}
                    </Text>
                  </Box>
                </Flex>
              )}

              {lastDiceRoll && (
                <Box mb="3" p="3" style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <Text size="4" style={{ color: "white" }}>
                    🎲 {lastDiceRoll}
                  </Text>
                </Box>
              )}

              <Button
                size="3"
                onClick={handleDiceRoll}
                disabled={!isMyTurn || gameStatus === 'finished'}
                style={{
                  width: "100%",
                  background: isMyTurn ? "linear-gradient(135deg, var(--blue-9), var(--violet-9))" : "var(--gray-6)"
                }}
              >
                <CubeIcon />
                {isMyTurn ? "Roll Dice" : "Wait for Turn"}
              </Button>
            </Card>

            {/* Players */}
            <Card style={{ ...cardStyle, padding: "16px" }}>
              <Heading size="4" style={{ color: "white" }} mb="3">Players</Heading>

              <Flex direction="column" gap="2">
                {hardcodedPlayers.map((player, index) => (
                  <Flex key={player.playerId} align="center" gap="3" p="2" style={{
                    background: index === currentPlayerIndex ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    borderRadius: "8px",
                    border: index === currentPlayerIndex ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent"
                  }}>
                    <Avatar
                      fallback={<PersonIcon />}
                      size="2"
                      style={{
                        backgroundColor: getPlayerColor(player.playerId),
                        color: 'white'
                      }}
                    />
                    <Box style={{ flex: 1 }}>
                      <Text size="2" style={{ color: "white" }} weight="medium">
                        {player.playerName}
                      </Text>
                      <Text size="1" color="gray">
                        Pieces: {player.pieces.filter(p => !p.isFinished).length}/{player.pieces.length}
                      </Text>
                    </Box>
                    {index === currentPlayerIndex && (
                      <Badge size="1" color="blue">Active</Badge>
                    )}
                  </Flex>
                ))}
              </Flex>
            </Card>

            {/* Game Info */}
            <Card style={{ ...cardStyle, padding: "16px" }}>
              <Heading size="4" style={{ color: "white" }} mb="3">Game Info</Heading>

              <Flex direction="column" gap="3">
                <Box>
                  <Text size="2" color="gray">Dice Range</Text>
                  <Text size="3" style={{ color: "white" }} weight="bold">
                    🎲 {hardcodedTemplate.diceMin}-{hardcodedTemplate.diceMax}
                  </Text>
                </Box>

                <Box>
                  <Text size="2" color="gray">Prize Pool</Text>
                  <Text size="3" style={{ color: "var(--green-11)" }} weight="bold">
                    2.0 SUI
                  </Text>
                </Box>

                <Box>
                  <Text size="2" color="gray">Package ID</Text>
                  <Text size="1" style={{ color: "white", wordBreak: "break-all" }}>
                    {HARDCODED_PACKAGE_ID}
                  </Text>
                </Box>

                {gameStatus === 'finished' && winnerPlayerId && (
                  <Box p="3" style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    textAlign: "center"
                  }}>
                    <Text size="3" style={{ color: "var(--green-11)" }} weight="bold">
                      🏆 {hardcodedPlayers.find(p => p.playerId === winnerPlayerId)?.playerName} Wins!
                    </Text>
                  </Box>
                )}
              </Flex>
            </Card>
          </Flex>
        </Box>
      </Grid>
    </Flex>
  );
}

export default BoardGamePlayPage;