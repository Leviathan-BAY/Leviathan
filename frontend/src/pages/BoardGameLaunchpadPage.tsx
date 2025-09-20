import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  TextField,
  Select,
  Grid,
  Container,
  Heading,
  Separator,
  Callout
} from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { BoardGameTemplateTransactions, TransactionUtils } from '../contracts/transactions';
import { BOARD_CELL_TYPES, GAME_LIMITS } from '../contracts/constants';

// Cell type constants matching the Move contract
const CELL_TYPES = {
  UNSET: -1,      // 설정되지 않은 타일 (디폴트)
  PASSABLE: BOARD_CELL_TYPES.PASSABLE,    // 지나갈 수 있는 칸
  BLOCKED: BOARD_CELL_TYPES.BLOCKED,     // 벽 (지나갈 수 없음)
  BOMB: BOARD_CELL_TYPES.BOMB,        // 폭탄 칸 (도착하면 죽음)
  START: BOARD_CELL_TYPES.START,       // 출발점
  FINISH: BOARD_CELL_TYPES.FINISH,      // 도착점
} as const;

const CELL_TYPE_NAMES = {
  [CELL_TYPES.UNSET]: 'Unset',
  [CELL_TYPES.PASSABLE]: 'Passable',
  [CELL_TYPES.BLOCKED]: 'Wall',
  [CELL_TYPES.BOMB]: 'Bomb',
  [CELL_TYPES.START]: 'Start',
  [CELL_TYPES.FINISH]: 'Finish',
} as const;

const CELL_TYPE_COLORS = {
  [CELL_TYPES.UNSET]: '#000000',
  [CELL_TYPES.PASSABLE]: 'var(--green-6)',
  [CELL_TYPES.BLOCKED]: 'var(--gray-9)',
  [CELL_TYPES.BOMB]: 'var(--red-8)',
  [CELL_TYPES.START]: 'var(--green-8)',
  [CELL_TYPES.FINISH]: 'var(--blue-8)',
} as const;

const CELL_TYPE_EMOJIS = {
  [CELL_TYPES.UNSET]: '',
  [CELL_TYPES.PASSABLE]: '',
  [CELL_TYPES.BLOCKED]: '🧱',
  [CELL_TYPES.BOMB]: '💣',
  [CELL_TYPES.START]: '🏁',
  [CELL_TYPES.FINISH]: '🏆',
} as const;

interface GameConfig {
  name: string;
  description: string;
  diceMin: number;
  diceMax: number;
  piecesPerPlayer: number;
  stakeAmount: number;
  board: number[]; // 100 elements for 10x10 board (GAME_LIMITS.BOARD_GAME_SIZE * GAME_LIMITS.BOARD_GAME_SIZE)
  startPositions: number[];
  finishPositions: number[];
}

const BoardGameLaunchpadPage: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const isConnected = !!currentAccount;
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const client = useSuiClient();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Game deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedGameId, setDeployedGameId] = useState<string | null>(null);

  // Selected cell type for painting
  const [selectedCellType, setSelectedCellType] = useState<number>(CELL_TYPES.PASSABLE);

  // Game configuration state
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    name: '',
    description: '',
    diceMin: 1,
    diceMax: 6,
    piecesPerPlayer: 3,
    stakeAmount: 1, // SUI
    board: new Array(GAME_LIMITS.MAX_BOARD_GAME_CELLS).fill(CELL_TYPES.UNSET),
    startPositions: [],
    finishPositions: [],
  });

  // Board editing functions
  const handleCellClick = useCallback((position: number) => {
    setGameConfig(prev => {
      const newBoard = [...prev.board];
      const currentCellType = newBoard[position];

      // If clicking on the same type, reset to UNSET
      let newCellType;
      if (currentCellType === selectedCellType) {
        newCellType = CELL_TYPES.UNSET;
      } else {
        newCellType = selectedCellType;
      }

      newBoard[position] = newCellType;

      // Update start/finish positions based on cell type
      let newStartPositions = [...prev.startPositions];
      let newFinishPositions = [...prev.finishPositions];

      if (newCellType === CELL_TYPES.START) {
        if (!newStartPositions.includes(position)) {
          newStartPositions.push(position);
        }
      } else {
        newStartPositions = newStartPositions.filter(pos => pos !== position);
      }

      if (newCellType === CELL_TYPES.FINISH) {
        if (!newFinishPositions.includes(position)) {
          newFinishPositions.push(position);
        }
      } else {
        newFinishPositions = newFinishPositions.filter(pos => pos !== position);
      }

      return {
        ...prev,
        board: newBoard,
        startPositions: newStartPositions,
        finishPositions: newFinishPositions,
      };
    });
  }, [selectedCellType]);

  const clearBoard = useCallback(() => {
    setGameConfig(prev => ({
      ...prev,
      board: new Array(GAME_LIMITS.MAX_BOARD_GAME_CELLS).fill(CELL_TYPES.UNSET),
      startPositions: [],
      finishPositions: [],
    }));
  }, []);

  const setPresetBoard = useCallback((preset: 'racing' | 'maze' | 'deathmatch') => {
    let newBoard = new Array(GAME_LIMITS.MAX_BOARD_GAME_CELLS).fill(CELL_TYPES.UNSET);
    let startPositions: number[] = [];
    let finishPositions: number[] = [];

    switch (preset) {
      case 'racing':
        // Simple racing track
        startPositions = [0, 1, 2];
        finishPositions = [GAME_LIMITS.MAX_BOARD_GAME_CELLS - 3, GAME_LIMITS.MAX_BOARD_GAME_CELLS - 2, GAME_LIMITS.MAX_BOARD_GAME_CELLS - 1];
        // Add passable lanes
        [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22, 24, 25, 27, 28, 29, 30, 31, 32, 34, 35, 37, 38, 39, 40, 41, 42, 47, 48, 49, 50, 51, 52, 54, 55, 57, 58, 59, 60, 61, 62, 64, 65, 67, 68, 69, 70, 71, 72, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96].forEach(pos => {
          newBoard[pos] = CELL_TYPES.PASSABLE;
        });
        // Add some walls to create lanes
        [13, 14, 15, 16, 23, 26, 33, 36, 43, 44, 45, 46, 53, 56, 63, 66, 73, 74, 75, 76].forEach(pos => {
          newBoard[pos] = CELL_TYPES.BLOCKED;
        });
        break;

      case 'maze':
        // Maze-like structure
        startPositions = [0];
        finishPositions = [GAME_LIMITS.MAX_BOARD_GAME_CELLS - 1];
        // Create passable paths
        [0, 2, 4, 6, 8, 11, 13, 15, 17, 19, 20, 22, 24, 26, 28, 31, 33, 35, 37, 39, 40, 42, 44, 46, 48, 51, 53, 55, 57, 59, 60, 62, 64, 66, 68, 71, 73, 75, 77, 79, 80, 82, 84, 86, 88, 91, 93, 95, 97, 99].forEach(pos => {
          newBoard[pos] = CELL_TYPES.PASSABLE;
        });
        // Create maze walls
        [1, 3, 5, 7, 9, 10, 12, 14, 16, 18, 21, 23, 25, 27, 29, 30, 32, 34, 36, 38, 41, 43, 45, 47, 49, 50, 52, 54, 56, 58, 61, 63, 65, 67, 69, 70, 72, 74, 76, 78, 81, 83, 85, 87, 89, 90, 92, 94, 96, 98].forEach(pos => {
          newBoard[pos] = CELL_TYPES.BLOCKED;
        });
        break;

      case 'deathmatch':
        // Dangerous course with bombs
        startPositions = [0];
        finishPositions = [GAME_LIMITS.MAX_BOARD_GAME_CELLS - 1];
        // Add passable paths
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 19, 20, 21, 23, 25, 27, 29, 30, 32, 34, 36, 38, 39, 40, 41, 43, 45, 47, 49, 50, 52, 54, 56, 58, 59, 60, 61, 63, 65, 67, 69, 70, 72, 74, 76, 78, 79, 80, 81, 83, 85, 87, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99].forEach(pos => {
          newBoard[pos] = CELL_TYPES.PASSABLE;
        });
        // Add bombs randomly
        [11, 13, 15, 17, 22, 24, 26, 28, 31, 33, 35, 37, 42, 44, 46, 48, 51, 53, 55, 57, 62, 64, 66, 68, 71, 73, 75, 77, 82, 84, 86, 88].forEach(pos => {
          newBoard[pos] = CELL_TYPES.BOMB;
        });
        break;
    }

    // Set start and finish positions on board
    startPositions.forEach(pos => {
      newBoard[pos] = CELL_TYPES.START;
    });
    finishPositions.forEach(pos => {
      newBoard[pos] = CELL_TYPES.FINISH;
    });

    setGameConfig(prev => ({
      ...prev,
      board: newBoard,
      startPositions,
      finishPositions,
    }));
  }, []);

  const deployGameTemplate = useCallback(async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!gameConfig.name.trim()) {
      alert('Please enter a game name');
      return;
    }

    if (gameConfig.startPositions.length === 0) {
      alert('Please set at least one start position');
      return;
    }

    if (gameConfig.finishPositions.length === 0) {
      alert('Please set at least one finish position');
      return;
    }

    setIsDeploying(true);

    try {
      // 🆕 1단계 → 하나의 트랜잭션 생성
      const createFullTemplateTx = BoardGameTemplateTransactions.createFullGameTemplate(
        gameConfig.name,
        gameConfig.description,
        gameConfig.diceMin,
        gameConfig.diceMax,
        gameConfig.piecesPerPlayer,
        TransactionUtils.suiToMist(gameConfig.stakeAmount),
        gameConfig.board,           // vector<u8>
        gameConfig.startPositions,  // vector<u8>
        gameConfig.finishPositions  // vector<u8>
      );

      console.log('Creating full game template...');

      // 🆕 단일 signAndExecute 호출
      const templateResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: createFullTemplateTx },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      });

      console.log("template Result: ", templateResult);

      const digest = templateResult.digest;
      console.log('Transaction digest:', digest);
      await wait(1000);
      // 🆕 objectChanges에서 GameTemplate objectId 추출
      const txResult = await client.getTransactionBlock({
        digest,
        options: { showObjectChanges: true },
      });

      const createdTemplate = txResult.objectChanges?.find(
        (change: any) =>
          change.type === 'created' &&
          change.objectType.endsWith('::GameTemplate')
      );
      const templateId = createdTemplate.objectId;

      console.log('Template created successfully, templateId:', templateId);

      setDeployedGameId(templateId);
      alert(`Game template deployed successfully!\nTemplate ID: ${templateId}`);

    } catch (error) {
      console.error('Deployment failed:', error);
      alert(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  }, [isConnected, gameConfig, signAndExecute]);


  const renderCellTypeSelector = () => (
    <Box mb="4">
      <Text size="2" weight="medium" mb="3">Select Cell Type:</Text>
      <Flex gap="2" wrap="wrap" justify="center">
        {Object.entries(CELL_TYPE_NAMES).map(([type, name]) => {
          const cellType = parseInt(type);
          const isSelected = selectedCellType === cellType;
          return (
            <Button
              key={cellType}
              size="2"
              variant={isSelected ? "solid" : "outline"}
              color={isSelected ? "blue" : "gray"}
              onClick={() => setSelectedCellType(cellType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '80px',
                backgroundColor: isSelected ? CELL_TYPE_COLORS[cellType as keyof typeof CELL_TYPE_COLORS] : undefined,
                borderColor: isSelected ? CELL_TYPE_COLORS[cellType as keyof typeof CELL_TYPE_COLORS] : undefined,
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {CELL_TYPE_EMOJIS[cellType as keyof typeof CELL_TYPE_EMOJIS] || '⬜'}
              </span>
              <span>{name}</span>
            </Button>
          );
        })}
      </Flex>
    </Box>
  );

  const renderBoard = () => (
    <Grid columns={GAME_LIMITS.BOARD_GAME_SIZE.toString()} gap="1" style={{ maxWidth: '500px', margin: '0 auto' }}>
      {gameConfig.board.map((cellType, index) => (
        <Box
          key={index}
          onClick={() => handleCellClick(index)}
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: CELL_TYPE_COLORS[cellType as keyof typeof CELL_TYPE_COLORS],
            border: '1px solid var(--gray-6)',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease',
          }}
          className="board-cell"
        >
          {CELL_TYPE_EMOJIS[cellType as keyof typeof CELL_TYPE_EMOJIS]}
        </Box>
      ))}
    </Grid>
  );

  return (
    <Container size="4" style={{ padding: '2rem 0' }}>
      <Box mb="6">
        <Heading size="8" mb="2" align="center">
          🎮 Board Game Launchpad
        </Heading>
        <Text size="4" color="gray" align="center">
          Create and deploy your custom {GAME_LIMITS.BOARD_GAME_SIZE}x{GAME_LIMITS.BOARD_GAME_SIZE} board game
        </Text>
      </Box>

      <Grid columns={{ initial: '1', lg: '2' }} gap="6">
        {/* Game Configuration Panel */}
        <Card style={{ padding: '20px' }}>
          <Heading size="5" mb="4">Game Configuration</Heading>

          <Box mb="4">
            <Text size="2" weight="medium" mb="2">Game Name</Text>
            <TextField.Root
              placeholder="Enter game name"
              value={gameConfig.name}
              onChange={(e) => setGameConfig(prev => ({ ...prev, name: e.target.value }))}
            />
          </Box>

          <Box mb="4">
            <Text size="2" weight="medium" mb="2">Description</Text>
            <TextField.Root
              placeholder="Enter game description"
              value={gameConfig.description}
              onChange={(e) => setGameConfig(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>

          <Flex gap="3" mb="4">
            <Box style={{ flex: 1 }}>
              <Text size="2" weight="medium" mb="2">Dice Min</Text>
              <Select.Root
                value={gameConfig.diceMin.toString()}
                onValueChange={(value) => setGameConfig(prev => ({ ...prev, diceMin: parseInt(value) }))}
              >
                <Select.Trigger />
                <Select.Content>
                  {[1, 2, 3, 4, 5].map(num => (
                    <Select.Item key={num} value={num.toString()}>{num}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box style={{ flex: 1 }}>
              <Text size="2" weight="medium" mb="2">Dice Max</Text>
              <Select.Root
                value={gameConfig.diceMax.toString()}
                onValueChange={(value) => setGameConfig(prev => ({ ...prev, diceMax: parseInt(value) }))}
              >
                <Select.Trigger />
                <Select.Content>
                  {[3, 4, 5, 6, 8, 10, 12, 20].map(num => (
                    <Select.Item key={num} value={num.toString()}>{num}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          <Flex gap="3" mb="4">
            <Box style={{ flex: 1 }}>
              <Text size="2" weight="medium" mb="2">Pieces per Player</Text>
              <Select.Root
                value={gameConfig.piecesPerPlayer.toString()}
                onValueChange={(value) => setGameConfig(prev => ({ ...prev, piecesPerPlayer: parseInt(value) }))}
              >
                <Select.Trigger />
                <Select.Content>
                  {[1, 2, 3, 4, 5].map(num => (
                    <Select.Item key={num} value={num.toString()}>{num}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box style={{ flex: 1 }}>
              <Text size="2" weight="medium" mb="2">Stake Amount (SUI)</Text>
              <TextField.Root
                type="number"
                placeholder="1.0"
                value={gameConfig.stakeAmount}
                onChange={(e) => setGameConfig(prev => ({ ...prev, stakeAmount: parseFloat(e.target.value) || 0 }))}
              />
            </Box>
          </Flex>

          <Separator my="4" />

          <Box mb="4">
            <Text size="2" weight="medium" mb="2">Quick Presets</Text>
            <Flex gap="2" wrap="wrap">
              <Button size="1" variant="outline" onClick={() => setPresetBoard('racing')}>
                🏁 Racing
              </Button>
              <Button size="1" variant="outline" onClick={() => setPresetBoard('maze')}>
                🌀 Maze
              </Button>
              <Button size="1" variant="outline" onClick={() => setPresetBoard('deathmatch')}>
                💀 Deathmatch
              </Button>
              <Button size="1" variant="outline" color="red" onClick={clearBoard}>
                🗑️ Clear
              </Button>
            </Flex>
          </Box>

          {renderCellTypeSelector()}

          <Callout.Root mb="4" color={gameConfig.startPositions.length === 0 || gameConfig.finishPositions.length === 0 ? "orange" : "blue"}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Select a cell type above, then click on board cells to paint them with the selected type.
              <br />
              <strong>Start positions:</strong> {gameConfig.startPositions.length} (required: ≥1),
              <strong> Finish positions:</strong> {gameConfig.finishPositions.length} (required: ≥1)
              {(gameConfig.startPositions.length === 0 || gameConfig.finishPositions.length === 0) && (
                <>
                  <br />
                  <em>⚠️ You need at least one start position and one finish position to deploy.</em>
                </>
              )}
            </Callout.Text>
          </Callout.Root>

          <Button
            size="3"
            style={{ width: '100%' }}
            onClick={deployGameTemplate}
            disabled={!isConnected || isDeploying}
            loading={isDeploying}
          >
            {isDeploying
              ? 'Deploying...'
              : isConnected
                ? 'Deploy Game Template'
                : 'Connect Wallet First'
            }
          </Button>

          {deployedGameId && (
            <Callout.Root mt="3" color="green">
              <Callout.Icon>
                ✅
              </Callout.Icon>
              <Callout.Text>
                Game template deployed successfully!<br />
                Template ID: <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{deployedGameId}</code>
              </Callout.Text>
            </Callout.Root>
          )}

          {deployedGameId && (
            <Button
              size="2"
              variant="outline"
              style={{ width: '100%', marginTop: '12px' }}
              onClick={async () => {
                try {
                  const startGameTx = BoardGameTemplateTransactions.startGame(
                    deployedGameId,
                    TransactionUtils.suiToMist(gameConfig.stakeAmount)
                  );

                  signAndExecute(
                    { transaction: startGameTx },
                    {
                      onSuccess: (result) => {
                        console.log('Game instance created:', result);
                        alert('Game instance created! Waiting for another player to join...');
                      },
                      onError: (error) => {
                        console.error('Failed to start game:', error);
                        alert(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      },
                    }
                  );
                } catch (error) {
                  console.error('Error starting game:', error);
                  alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }}
            >
              🎮 Start Game Instance (Stake {gameConfig.stakeAmount} SUI)
            </Button>
          )}
        </Card>

        {/* Board Editor */}
        <Card style={{ padding: '20px' }}>
          <Heading size="5" mb="4">{GAME_LIMITS.BOARD_GAME_SIZE}x{GAME_LIMITS.BOARD_GAME_SIZE} Board Editor</Heading>

          {renderBoard()}

          <Box mt="4" style={{ textAlign: 'center' }}>
            <Text size="2" color="gray">
              Total {GAME_LIMITS.MAX_BOARD_GAME_CELLS} cells -
              Unset: {gameConfig.board.filter(cell => cell === CELL_TYPES.UNSET).length},
              Passable: {gameConfig.board.filter(cell => cell === CELL_TYPES.PASSABLE).length},
              Walls: {gameConfig.board.filter(cell => cell === CELL_TYPES.BLOCKED).length},
              Bombs: {gameConfig.board.filter(cell => cell === CELL_TYPES.BOMB).length},
              Start: {gameConfig.board.filter(cell => cell === CELL_TYPES.START).length},
              Finish: {gameConfig.board.filter(cell => cell === CELL_TYPES.FINISH).length}
            </Text>
          </Box>
        </Card>
      </Grid>

      <style>{`
        .board-cell:hover {
          transform: scale(1.05);
          border-color: #60a5fa !important;
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
        }
      `}</style>
    </Container>
  );
};

export default BoardGameLaunchpadPage;