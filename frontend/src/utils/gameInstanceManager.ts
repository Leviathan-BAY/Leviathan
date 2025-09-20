// Game Instance Management for Card Games
// Handles creation, joining, and management of game instances

import { CardGameConfig, CardGameEngine, GameState } from './cardGameEngine';

export interface GameTemplate {
  id: string;
  creatorId: string;
  config: CardGameConfig;
  isActive: boolean;
  totalGames: number;
  totalStaked: number;
  createdAt: number;
  onChainAddress?: string;
}

export interface GameInstance {
  id: string;
  templateId: string;
  creatorId: string;
  players: PlayerInstance[];
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  prizePool: number;
  entryFee: number;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  winnerId?: string;
  gameEngine?: CardGameEngine;
  onChainInstanceId?: string;
}

export interface PlayerInstance {
  playerId: string;
  playerName: string;
  hasJoined: boolean;
  hasPaid: boolean;
  joinedAt: number;
  finalPosition?: number;
  winnings?: number;
}

export class GameInstanceManager {
  private instances: Map<string, GameInstance> = new Map();
  private templates: Map<string, GameTemplate> = new Map();
  private playerInstances: Map<string, string[]> = new Map(); // playerId -> instanceIds

  constructor() {
    // Initialize with some mock templates for development
    this.initializeMockTemplates();
  }

  private initializeMockTemplates(): void {
    const mockTemplates: GameTemplate[] = [
      {
        id: 'template-1',
        creatorId: 'creator-1',
        config: {
          title: 'Classic Poker Hand',
          description: 'Best poker hand wins with 5-card draw',
          numPlayers: 4,
          winCondition: 'highest_card',
          initialCardsInHand: 5,
          initialCardsOnField: 0,
          handVisibility: 'private',
          fieldVisibility: 'public',
          deckComposition: { suits: 4, ranksPerSuit: 13, jokers: 0 },
          cardsDrawnPerTurn: 1,
          cardsPlayedPerTurn: 1,
          jokerRule: 'none',
          allowedActions: ['draw', 'play', 'fold'],
          turnLimit: 20,
          launchFee: 0.1
        },
        isActive: true,
        totalGames: 15,
        totalStaked: 30.0,
        createdAt: Date.now() - 86400000
      },
      {
        id: 'template-2',
        creatorId: 'creator-2',
        config: {
          title: 'Blackjack Battle',
          description: 'Get closest to 21 without going over',
          numPlayers: 3,
          winCondition: 'closest_sum',
          initialCardsInHand: 2,
          initialCardsOnField: 1,
          handVisibility: 'private',
          fieldVisibility: 'public',
          deckComposition: { suits: 4, ranksPerSuit: 13, jokers: 2 },
          cardsDrawnPerTurn: 1,
          cardsPlayedPerTurn: 0,
          jokerRule: 'wildcard',
          allowedActions: ['draw', 'pass', 'fold'],
          blackjackTarget: 21,
          turnLimit: 15,
          launchFee: 0.05
        },
        isActive: true,
        totalGames: 28,
        totalStaked: 14.0,
        createdAt: Date.now() - 172800000
      },
      {
        id: 'template-3',
        creatorId: 'creator-3',
        config: {
          title: 'Speed Uno',
          description: 'First to empty hand wins',
          numPlayers: 6,
          winCondition: 'empty_hand',
          initialCardsInHand: 7,
          initialCardsOnField: 1,
          handVisibility: 'private',
          fieldVisibility: 'public',
          deckComposition: { suits: 4, ranksPerSuit: 10, jokers: 4 },
          cardsDrawnPerTurn: 1,
          cardsPlayedPerTurn: 1,
          jokerRule: 'wildcard',
          allowedActions: ['draw', 'play', 'pass'],
          turnLimit: 50,
          launchFee: 0.08
        },
        isActive: true,
        totalGames: 42,
        totalStaked: 25.2,
        createdAt: Date.now() - 259200000
      }
    ];

    mockTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Template Management
  createTemplate(config: CardGameConfig, creatorId: string): GameTemplate {
    const template: GameTemplate = {
      id: `template-${Date.now()}`,
      creatorId,
      config,
      isActive: true,
      totalGames: 0,
      totalStaked: 0,
      createdAt: Date.now()
    };

    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(templateId: string): GameTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): GameTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Instance Management
  createInstance(templateId: string, creatorId: string, entryFee: number): GameInstance | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    const instance: GameInstance = {
      id: `instance-${Date.now()}`,
      templateId,
      creatorId,
      players: [],
      maxPlayers: template.config.numPlayers,
      currentPlayers: 0,
      status: 'waiting',
      prizePool: 0,
      entryFee,
      createdAt: Date.now()
    };

    this.instances.set(instance.id, instance);
    return instance;
  }

  joinInstance(instanceId: string, playerId: string, playerName: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    if (instance.status !== 'waiting') {
      return { success: false, error: 'Instance is not accepting players' };
    }

    if (instance.currentPlayers >= instance.maxPlayers) {
      return { success: false, error: 'Instance is full' };
    }

    if (instance.players.some(p => p.playerId === playerId)) {
      return { success: false, error: 'Player already joined' };
    }

    const playerInstance: PlayerInstance = {
      playerId,
      playerName,
      hasJoined: true,
      hasPaid: false, // Will be set to true after payment confirmation
      joinedAt: Date.now()
    };

    instance.players.push(playerInstance);
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
      return { success: false, error: 'Instance not found' };
    }

    const player = instance.players.find(p => p.playerId === playerId);
    if (!player) {
      return { success: false, error: 'Player not in instance' };
    }

    player.hasPaid = true;
    instance.prizePool += instance.entryFee;

    // Check if all players have paid and we can start the game
    const allPaid = instance.players.every(p => p.hasPaid);
    const isFull = instance.currentPlayers === instance.maxPlayers;

    if (allPaid && isFull) {
      this.startInstance(instanceId);
    }

    return { success: true };
  }

  startInstance(instanceId: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    if (instance.status !== 'waiting') {
      return { success: false, error: 'Instance cannot be started' };
    }

    if (instance.currentPlayers < 2) {
      return { success: false, error: 'Not enough players' };
    }

    const template = this.getTemplate(instance.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Create game engine
    const playerIds = instance.players.map(p => p.playerId);
    const gameEngine = new CardGameEngine(template.config, playerIds, instanceId, instance.templateId);
    gameEngine.initializeGame();

    instance.gameEngine = gameEngine;
    instance.status = 'playing';
    instance.startedAt = Date.now();

    return { success: true };
  }

  executeGameAction(instanceId: string, action: any): { success: boolean; error?: string; gameState?: any } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    if (!instance.gameEngine) {
      return { success: false, error: 'Game not started' };
    }

    const result = instance.gameEngine.executeAction(action);

    // Check if game finished
    if (result.state.phase === 'finished') {
      this.finishInstance(instanceId, result.state.winner);
    }

    return {
      success: result.success,
      error: result.error,
      gameState: result.state
    };
  }

  finishInstance(instanceId: string, winnerId?: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.status = 'finished';
    instance.finishedAt = Date.now();
    instance.winnerId = winnerId;

    // Calculate winnings
    if (winnerId) {
      const winner = instance.players.find(p => p.playerId === winnerId);
      if (winner) {
        winner.finalPosition = 1;
        winner.winnings = instance.prizePool * 0.95; // 5% platform fee
      }
    }

    // Update template stats
    const template = this.getTemplate(instance.templateId);
    if (template) {
      template.totalGames++;
      template.totalStaked += instance.prizePool;
    }
  }

  getInstance(instanceId: string): GameInstance | undefined {
    return this.instances.get(instanceId);
  }

  getPlayerInstances(playerId: string): GameInstance[] {
    const instanceIds = this.playerInstances.get(playerId) || [];
    return instanceIds
      .map(id => this.instances.get(id))
      .filter(instance => instance !== undefined) as GameInstance[];
  }

  getActiveInstances(): GameInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.status === 'waiting' || instance.status === 'playing')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getWaitingInstances(): GameInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.status === 'waiting')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get visible game state for a specific player
  getVisibleGameState(instanceId: string, playerId: string): any {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.gameEngine) {
      return null;
    }

    return instance.gameEngine.getVisibleState(playerId);
  }

  // Validate if player can perform action
  validatePlayerAction(instanceId: string, playerId: string, action: any): { valid: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { valid: false, error: 'Instance not found' };
    }

    if (!instance.gameEngine) {
      return { valid: false, error: 'Game not started' };
    }

    const player = instance.players.find(p => p.playerId === playerId);
    if (!player) {
      return { valid: false, error: 'Player not in instance' };
    }

    if (!player.hasPaid) {
      return { valid: false, error: 'Player has not paid entry fee' };
    }

    return instance.gameEngine.validateAction({ ...action, playerId });
  }

  // Leave instance (before game starts)
  leaveInstance(instanceId: string, playerId: string): { success: boolean; error?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    if (instance.status !== 'waiting') {
      return { success: false, error: 'Cannot leave after game started' };
    }

    const playerIndex = instance.players.findIndex(p => p.playerId === playerId);
    if (playerIndex === -1) {
      return { success: false, error: 'Player not in instance' };
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

    return { success: true };
  }

  // Get instance statistics for UI
  getInstanceStats(): {
    totalInstances: number;
    activeInstances: number;
    totalPrizePool: number;
    totalPlayers: number;
  } {
    const instances = Array.from(this.instances.values());

    return {
      totalInstances: instances.length,
      activeInstances: instances.filter(i => i.status === 'waiting' || i.status === 'playing').length,
      totalPrizePool: instances.reduce((sum, i) => sum + i.prizePool, 0),
      totalPlayers: instances.reduce((sum, i) => sum + i.currentPlayers, 0)
    };
  }
}

// Singleton instance for global use
export const gameInstanceManager = new GameInstanceManager();