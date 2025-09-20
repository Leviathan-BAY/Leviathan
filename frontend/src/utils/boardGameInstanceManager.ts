// Board Game Instance Management
// Handles board game instance creation, joining, and state management

export interface BoardGameTemplate {
  id: string;
  name: string;
  description: string;
  diceMin: number;
  diceMax: number;
  piecesPerPlayer: number;
  stakeAmount: number; // in mist
  totalGames: number;
  totalStaked: number;
  isActive: boolean;
  createdAt: number;
  creator: string;
  boardConfiguration?: number[];
  startPositions?: number[];
  finishPositions?: number[];
}

export interface BoardGamePlayer {
  playerId: string;
  playerName: string;
  walletAddress: string;
  avatarUrl?: string;
  hasJoined: boolean;
  hasPaid: boolean;
  joinedAt: number;
  pieces: {
    pieceId: number;
    position: number;
    isFinished: boolean;
  }[];
  isReady: boolean;
  finalPosition?: number;
  winnings?: number;
}

export interface BoardGameInstance {
  id: string;
  templateId: string;
  creatorId: string;
  players: BoardGamePlayer[];
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'cancelled';
  prizePool: number; // in SUI
  entryFee: number; // in SUI
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  winnerId?: string;
  currentPlayerIndex: number;
  gameState: {
    turn: number;
    phase: 'setup' | 'playing' | 'finished';
    lastDiceRoll?: number;
    lastMove?: {
      playerId: string;
      pieceId: number;
      fromPosition: number;
      toPosition: number;
      timestamp: number;
    };
  };
  onChainInstanceId?: string;
}

export class BoardGameInstanceManager {
  private instances: Map<string, BoardGameInstance> = new Map();
  private playerInstances: Map<string, string[]> = new Map(); // playerId -> instanceIds
  private templates: Map<string, BoardGameTemplate> = new Map();

  constructor() {
    this.initializeMockTemplates();
  }

  private initializeMockTemplates(): void {
    // Use the same mock templates from constants but convert to our format
    const mockTemplates: BoardGameTemplate[] = [
      {
        id: 'template_1',
        name: 'Classic Racing Track',
        description: 'Traditional racing game with obstacles and power-ups',
        diceMin: 1,
        diceMax: 6,
        piecesPerPlayer: 3,
        stakeAmount: 1000000000, // 1 SUI in mist
        totalGames: 42,
        totalStaked: 42000000000, // 42 SUI
        isActive: true,
        createdAt: Date.now() - 86400000, // 1 day ago
        creator: '0x123abc...'
      },
      {
        id: 'template_2',
        name: 'Bomb Maze Challenge',
        description: 'Navigate through dangerous maze filled with bombs',
        diceMin: 1,
        diceMax: 8,
        piecesPerPlayer: 2,
        stakeAmount: 500000000, // 0.5 SUI
        totalGames: 28,
        totalStaked: 14000000000, // 14 SUI
        isActive: true,
        createdAt: Date.now() - 172800000, // 2 days ago
        creator: '0x456def...'
      },
      {
        id: 'template_3',
        name: 'Speed Runner',
        description: 'Fast-paced racing with high dice values',
        diceMin: 3,
        diceMax: 12,
        piecesPerPlayer: 1,
        stakeAmount: 2000000000, // 2 SUI
        totalGames: 15,
        totalStaked: 30000000000, // 30 SUI
        isActive: true,
        createdAt: Date.now() - 259200000, // 3 days ago
        creator: '0x789ghi...'
      }
    ];

    mockTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Template management
  getTemplate(templateId: string): BoardGameTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): BoardGameTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Instance management
  createInstance(templateId: string, creatorId: string, playerName: string): BoardGameInstance | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    const instanceId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const entryFee = template.stakeAmount / 1000000000; // Convert mist to SUI

    // Determine max players based on pieces per player (assume 4 players max for now)
    const maxPlayers = Math.min(4, Math.max(2, template.piecesPerPlayer));

    const creatorPlayer: BoardGamePlayer = {
      playerId: creatorId,
      playerName,
      walletAddress: creatorId,
      hasJoined: true,
      hasPaid: false, // Will be set after blockchain transaction
      joinedAt: Date.now(),
      pieces: Array.from({ length: template.piecesPerPlayer }, (_, i) => ({
        pieceId: i,
        position: 0, // Start position
        isFinished: false
      })),
      isReady: false
    };

    const instance: BoardGameInstance = {
      id: instanceId,
      templateId,
      creatorId,
      players: [creatorPlayer],
      maxPlayers,
      currentPlayers: 1,
      status: 'waiting',
      prizePool: 0,
      entryFee,
      createdAt: Date.now(),
      currentPlayerIndex: 0,
      gameState: {
        turn: 1,
        phase: 'setup'
      }
    };

    this.instances.set(instanceId, instance);

    // Track player instances
    const playerInstances = this.playerInstances.get(creatorId) || [];
    playerInstances.push(instanceId);
    this.playerInstances.set(creatorId, playerInstances);

    return instance;
  }

  joinInstance(instanceId: string, playerId: string, playerName: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Game instance not found' };
    }

    if (instance.status !== 'waiting') {
      return { success: false, error: 'Game is not accepting new players' };
    }

    if (instance.currentPlayers >= instance.maxPlayers) {
      return { success: false, error: 'Game is full' };
    }

    if (instance.players.some(p => p.playerId === playerId)) {
      return { success: false, error: 'Player already in this game' };
    }

    const template = this.getTemplate(instance.templateId);
    if (!template) {
      return { success: false, error: 'Game template not found' };
    }

    const newPlayer: BoardGamePlayer = {
      playerId,
      playerName,
      walletAddress: playerId,
      hasJoined: true,
      hasPaid: false,
      joinedAt: Date.now(),
      pieces: Array.from({ length: template.piecesPerPlayer }, (_, i) => ({
        pieceId: i,
        position: 0,
        isFinished: false
      })),
      isReady: false
    };

    instance.players.push(newPlayer);
    instance.currentPlayers++;

    // Track player instances
    const playerInstances = this.playerInstances.get(playerId) || [];
    playerInstances.push(instanceId);
    this.playerInstances.set(playerId, playerInstances);

    return { success: true };
  }

  confirmPayment(instanceId: string, playerId: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Game instance not found' };
    }

    const player = instance.players.find(p => p.playerId === playerId);
    if (!player) {
      return { success: false, error: 'Player not in this game' };
    }

    player.hasPaid = true;
    instance.prizePool += instance.entryFee;

    // Check if all players have paid
    const allPaid = instance.players.every(p => p.hasPaid);

    if (allPaid && instance.currentPlayers >= 2) {
      instance.status = 'ready';
    }

    return { success: true };
  }

  setPlayerReady(instanceId: string, playerId: string, isReady: boolean): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Game instance not found' };
    }

    const player = instance.players.find(p => p.playerId === playerId);
    if (!player) {
      return { success: false, error: 'Player not in this game' };
    }

    player.isReady = isReady;

    // Check if all players are ready
    const allReady = instance.players.every(p => p.isReady);

    if (allReady && instance.status === 'ready') {
      // Can start the game
      instance.status = 'playing';
      instance.startedAt = Date.now();
      instance.gameState.phase = 'playing';
    }

    return { success: true };
  }

  startGame(instanceId: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Game instance not found' };
    }

    if (instance.status !== 'ready') {
      return { success: false, error: 'Game is not ready to start' };
    }

    instance.status = 'playing';
    instance.startedAt = Date.now();
    instance.gameState.phase = 'playing';

    return { success: true };
  }

  leaveInstance(instanceId: string, playerId: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Game instance not found' };
    }

    if (instance.status === 'playing') {
      return { success: false, error: 'Cannot leave game in progress' };
    }

    const playerIndex = instance.players.findIndex(p => p.playerId === playerId);
    if (playerIndex === -1) {
      return { success: false, error: 'Player not in this game' };
    }

    const player = instance.players[playerIndex];
    instance.players.splice(playerIndex, 1);
    instance.currentPlayers--;

    // Refund entry fee if paid
    if (player.hasPaid) {
      instance.prizePool -= instance.entryFee;
      // TODO: Handle actual refund to blockchain
    }

    // Update player instances tracking
    const playerInstances = this.playerInstances.get(playerId) || [];
    const filteredInstances = playerInstances.filter(id => id !== instanceId);
    this.playerInstances.set(playerId, filteredInstances);

    // If no players left, mark as cancelled
    if (instance.currentPlayers === 0) {
      instance.status = 'cancelled';
    }

    return { success: true };
  }

  // Game state queries
  getInstance(instanceId: string): BoardGameInstance | undefined {
    return this.instances.get(instanceId);
  }

  getPlayerInstances(playerId: string): BoardGameInstance[] {
    const instanceIds = this.playerInstances.get(playerId) || [];
    return instanceIds
      .map(id => this.instances.get(id))
      .filter(instance => instance !== undefined) as BoardGameInstance[];
  }

  getWaitingInstances(): BoardGameInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.status === 'waiting' || instance.status === 'ready')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getActiveInstances(): BoardGameInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.status === 'waiting' || instance.status === 'ready' || instance.status === 'playing')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Gameplay actions
  rollDiceAndMove(instanceId: string, playerId: string, pieceIndex: number): { success: boolean; error?: string; result?: any } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Game instance not found' };
    }

    if (instance.status !== 'playing') {
      return { success: false, error: 'Game is not in progress' };
    }

    const currentPlayer = instance.players[instance.currentPlayerIndex];
    if (currentPlayer.playerId !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    const player = instance.players.find(p => p.playerId === playerId);
    if (!player) {
      return { success: false, error: 'Player not in this game' };
    }

    if (pieceIndex >= player.pieces.length) {
      return { success: false, error: 'Invalid piece index' };
    }

    const piece = player.pieces[pieceIndex];
    const template = this.getTemplate(instance.templateId);
    if (!template) {
      return { success: false, error: 'Game template not found' };
    }

    // Roll dice
    const diceRoll = Math.floor(Math.random() * (template.diceMax - template.diceMin + 1)) + template.diceMin;

    // Calculate new position (simple linear movement for now)
    const oldPosition = piece.position;
    const newPosition = Math.min(99, oldPosition + diceRoll); // Assume 100 positions (0-99)

    // Update piece position
    piece.position = newPosition;

    // Check if piece finished (reached position 99)
    if (newPosition >= 99) {
      piece.isFinished = true;
    }

    // Record move
    instance.gameState.lastDiceRoll = diceRoll;
    instance.gameState.lastMove = {
      playerId,
      pieceId: pieceIndex,
      fromPosition: oldPosition,
      toPosition: newPosition,
      timestamp: Date.now()
    };

    // Check win condition (all pieces finished)
    const allPiecesFinished = player.pieces.every(p => p.isFinished);
    if (allPiecesFinished) {
      instance.status = 'finished';
      instance.finishedAt = Date.now();
      instance.winnerId = playerId;
      instance.gameState.phase = 'finished';
      player.finalPosition = 1;
      player.winnings = instance.prizePool * 0.95; // 5% platform fee

      // Update template stats
      const template = this.getTemplate(instance.templateId);
      if (template) {
        template.totalGames++;
        template.totalStaked += instance.prizePool;
      }
    } else {
      // Next player's turn
      instance.currentPlayerIndex = (instance.currentPlayerIndex + 1) % instance.currentPlayers;
      instance.gameState.turn++;
    }

    return {
      success: true,
      result: {
        diceRoll,
        oldPosition,
        newPosition,
        isFinished: piece.isFinished,
        gameFinished: instance.status === 'finished',
        winnerId: instance.winnerId
      }
    };
  }

  // Statistics
  getInstanceStats(): {
    totalInstances: number;
    waitingInstances: number;
    activeInstances: number;
    totalPrizePool: number;
    totalPlayers: number;
  } {
    const instances = Array.from(this.instances.values());

    return {
      totalInstances: instances.length,
      waitingInstances: instances.filter(i => i.status === 'waiting').length,
      activeInstances: instances.filter(i => i.status === 'waiting' || i.status === 'ready' || i.status === 'playing').length,
      totalPrizePool: instances.reduce((sum, i) => sum + i.prizePool, 0),
      totalPlayers: instances.reduce((sum, i) => sum + i.currentPlayers, 0)
    };
  }
}

// Singleton instance for global use
export const boardGameInstanceManager = new BoardGameInstanceManager();