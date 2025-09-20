// Game State Synchronization System
// 실시간 게임 상태 동기화 (localStorage 기반 데모, 실제로는 WebSocket 사용)

import { CardGameState, GameMove } from './CardGameEngine';

export interface SyncedGameSession {
  instanceId: string;
  gameState: CardGameState;
  moves: GameMove[];
  lastUpdateTime: number;
  participants: string[];
}

export interface GameSyncEvent {
  type: 'stateUpdate' | 'moveExecuted' | 'playerJoined' | 'playerLeft' | 'gameEnded';
  gameId: string;
  playerId: string;
  timestamp: number;
  data: any;
}

export class GameStateSync {
  private instanceId: string;
  private playerId: string;
  private listeners: Map<string, (event: GameSyncEvent) => void> = new Map();
  private pollInterval: number | null = null;
  private lastKnownState: CardGameState | null = null;

  constructor(instanceId: string, playerId: string) {
    this.instanceId = instanceId;
    this.playerId = playerId;
    this.startPolling();
  }

  // Subscribe to game events
  public subscribe(eventType: string, callback: (event: GameSyncEvent) => void): void {
    this.listeners.set(eventType, callback);
  }

  // Unsubscribe from events
  public unsubscribe(eventType: string): void {
    this.listeners.delete(eventType);
  }

  // Initialize game session
  public async initializeSession(initialState: CardGameState): Promise<void> {
    const session: SyncedGameSession = {
      instanceId: this.instanceId,
      gameState: initialState,
      moves: [],
      lastUpdateTime: Date.now(),
      participants: [this.playerId]
    };

    this.saveSession(session);
    this.lastKnownState = initialState;

    this.emitEvent({
      type: 'stateUpdate',
      gameId: this.instanceId,
      playerId: this.playerId,
      timestamp: Date.now(),
      data: { gameState: initialState }
    });
  }

  // Join existing game session
  public async joinSession(): Promise<CardGameState | null> {
    const session = this.loadSession();
    if (!session) {
      return null;
    }

    // Add player to participants if not already there
    if (!session.participants.includes(this.playerId)) {
      session.participants.push(this.playerId);
      this.saveSession(session);

      this.emitEvent({
        type: 'playerJoined',
        gameId: this.instanceId,
        playerId: this.playerId,
        timestamp: Date.now(),
        data: { participants: session.participants }
      });
    }

    this.lastKnownState = session.gameState;
    return session.gameState;
  }

  // Submit a move and sync with other players
  public async submitMove(move: GameMove, newState: CardGameState): Promise<boolean> {
    const session = this.loadSession();
    if (!session) {
      console.error('No active session found');
      return false;
    }

    // Add move to history
    session.moves.push(move);
    session.gameState = newState;
    session.lastUpdateTime = Date.now();

    this.saveSession(session);
    this.lastKnownState = newState;

    this.emitEvent({
      type: 'moveExecuted',
      gameId: this.instanceId,
      playerId: this.playerId,
      timestamp: Date.now(),
      data: { move, gameState: newState }
    });

    return true;
  }

  // Get current synchronized game state
  public getCurrentState(): CardGameState | null {
    const session = this.loadSession();
    return session?.gameState || null;
  }

  // Get move history
  public getMoveHistory(): GameMove[] {
    const session = this.loadSession();
    return session?.moves || [];
  }

  // Check if player is in sync with latest state
  public isInSync(): boolean {
    const session = this.loadSession();
    if (!session || !this.lastKnownState) return false;

    return session.lastUpdateTime === this.lastKnownState.gameStartTime ||
           JSON.stringify(session.gameState) === JSON.stringify(this.lastKnownState);
  }

  // Force sync with latest state
  public async forceSync(): Promise<CardGameState | null> {
    const session = this.loadSession();
    if (!session) return null;

    this.lastKnownState = session.gameState;

    this.emitEvent({
      type: 'stateUpdate',
      gameId: this.instanceId,
      playerId: this.playerId,
      timestamp: Date.now(),
      data: { gameState: session.gameState }
    });

    return session.gameState;
  }

  // End game session and submit final results
  public async endSession(finalState: CardGameState): Promise<void> {
    const session = this.loadSession();
    if (!session) return;

    session.gameState = finalState;
    session.lastUpdateTime = Date.now();
    this.saveSession(session);

    this.emitEvent({
      type: 'gameEnded',
      gameId: this.instanceId,
      playerId: this.playerId,
      timestamp: Date.now(),
      data: {
        finalState,
        winner: finalState.winner,
        scores: this.extractFinalScores(finalState)
      }
    });

    this.stopPolling();
  }

  // Leave current session
  public leaveSession(): void {
    const session = this.loadSession();
    if (session) {
      session.participants = session.participants.filter(p => p !== this.playerId);
      this.saveSession(session);

      this.emitEvent({
        type: 'playerLeft',
        gameId: this.instanceId,
        playerId: this.playerId,
        timestamp: Date.now(),
        data: { participants: session.participants }
      });
    }

    this.stopPolling();
  }

  // Get active participants
  public getParticipants(): string[] {
    const session = this.loadSession();
    return session?.participants || [];
  }

  // Private methods
  private getStorageKey(): string {
    return `leviathan_game_${this.instanceId}`;
  }

  private saveSession(session: SyncedGameSession): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save game session:', error);
    }
  }

  private loadSession(): SyncedGameSession | null {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load game session:', error);
      return null;
    }
  }

  private startPolling(): void {
    this.pollInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, 1000); // Poll every second
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private checkForUpdates(): void {
    const session = this.loadSession();
    if (!session || !this.lastKnownState) return;

    // Check if state has been updated by another player
    if (session.lastUpdateTime > this.lastKnownState.gameStartTime) {
      // State has been updated, check what changed
      const stateChanged = JSON.stringify(session.gameState) !== JSON.stringify(this.lastKnownState);

      if (stateChanged) {
        this.lastKnownState = session.gameState;

        this.emitEvent({
          type: 'stateUpdate',
          gameId: this.instanceId,
          playerId: 'system',
          timestamp: Date.now(),
          data: { gameState: session.gameState }
        });
      }
    }
  }

  private emitEvent(event: GameSyncEvent): void {
    // Emit to specific listener
    const listener = this.listeners.get(event.type);
    if (listener) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }

    // Emit to 'all' listener if it exists
    const allListener = this.listeners.get('all');
    if (allListener) {
      try {
        allListener(event);
      } catch (error) {
        console.error('Error in all-events listener:', error);
      }
    }
  }

  private extractFinalScores(state: CardGameState): { [address: string]: number } {
    const scores: { [address: string]: number } = {};
    for (const player of state.players) {
      scores[player.address] = player.score;
    }
    return scores;
  }

  // Static utility methods
  public static async getAllActiveSessions(): Promise<string[]> {
    const sessions: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('leviathan_game_')) {
          const instanceId = key.replace('leviathan_game_', '');
          sessions.push(instanceId);
        }
      }
    } catch (error) {
      console.error('Failed to get active sessions:', error);
    }

    return sessions;
  }

  public static async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('leviathan_game_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const session: SyncedGameSession = JSON.parse(data);
            if (session.lastUpdateTime < cutoffTime) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old game sessions`);
      }
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  public static getSessionInfo(instanceId: string): SyncedGameSession | null {
    try {
      const data = localStorage.getItem(`leviathan_game_${instanceId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }
}

// Utility hook for React components
export const useGameSync = (instanceId: string, playerId: string) => {
  const [sync, setSync] = React.useState<GameStateSync | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [gameState, setGameState] = React.useState<CardGameState | null>(null);

  React.useEffect(() => {
    if (!instanceId || !playerId) return;

    const syncInstance = new GameStateSync(instanceId, playerId);

    // Subscribe to state updates
    syncInstance.subscribe('stateUpdate', (event) => {
      setGameState(event.data.gameState);
    });

    syncInstance.subscribe('playerJoined', () => {
      setIsConnected(true);
    });

    syncInstance.subscribe('playerLeft', () => {
      // Handle player leaving
    });

    setSync(syncInstance);

    // Try to join existing session or wait for initialization
    syncInstance.joinSession().then((state) => {
      if (state) {
        setGameState(state);
        setIsConnected(true);
      }
    });

    return () => {
      syncInstance.leaveSession();
    };
  }, [instanceId, playerId]);

  return {
    sync,
    isConnected,
    gameState,
    participants: sync?.getParticipants() || [],
    submitMove: sync?.submitMove.bind(sync),
    initializeSession: sync?.initializeSession.bind(sync),
    endSession: sync?.endSession.bind(sync)
  };
};

// Export React for the hook
import React from 'react';