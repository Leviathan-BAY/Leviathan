// Simple matchmaking service for Discord-based multiplayer games
import { DiscordUser } from './discord';

export interface Player {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string;
  isReady: boolean;
}

export interface GameMatch {
  id: string;
  gameId: string;
  players: Player[];
  status: 'waiting' | 'ready' | 'playing' | 'completed';
  maxPlayers: number;
  createdAt: number;
  startedAt?: number;
}

export interface MatchmakingState {
  currentMatch: GameMatch | null;
  isSearching: boolean;
  error: string | null;
}

class MatchmakingService {
  private matches: Map<string, GameMatch> = new Map();
  private listeners: ((state: MatchmakingState) => void)[] = [];
  private currentMatch: GameMatch | null = null;
  private isSearching: boolean = false;
  private searchTimeout: NodeJS.Timeout | null = null;

  // Add state change listener
  addListener(callback: (state: MatchmakingState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    const state: MatchmakingState = {
      currentMatch: this.currentMatch,
      isSearching: this.isSearching,
      error: null
    };
    this.listeners.forEach(listener => listener(state));
  }

  // Start searching for a match
  async findMatch(
    gameId: string,
    discordUser: DiscordUser,
    walletAddress: string,
    maxPlayers: number = 2
  ): Promise<void> {
    if (this.isSearching) {
      throw new Error('Already searching for a match');
    }

    this.isSearching = true;
    this.notifyListeners();

    const player: Player = {
      discordId: discordUser.id,
      displayName: discordUser.global_name || discordUser.username,
      avatarUrl: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
        : null,
      walletAddress,
      isReady: true
    };

    try {
      // Look for existing matches for this game
      const existingMatch = this.findAvailableMatch(gameId, maxPlayers);

      if (existingMatch) {
        // Join existing match
        existingMatch.players.push(player);

        if (existingMatch.players.length >= existingMatch.maxPlayers) {
          existingMatch.status = 'ready';
        }

        this.currentMatch = existingMatch;
      } else {
        // Create new match
        const newMatch: GameMatch = {
          id: this.generateMatchId(),
          gameId,
          players: [player],
          status: 'waiting',
          maxPlayers,
          createdAt: Date.now()
        };

        this.matches.set(newMatch.id, newMatch);
        this.currentMatch = newMatch;
      }

      this.isSearching = false;
      this.notifyListeners();

      // If match is ready, start it after a brief delay
      if (this.currentMatch.status === 'ready') {
        setTimeout(() => this.startMatch(), 2000);
      } else {
        // Set timeout for finding players (30 seconds)
        this.searchTimeout = setTimeout(() => {
          this.cancelMatch('Could not find enough players');
        }, 30000);
      }

    } catch (error) {
      this.isSearching = false;
      this.notifyListeners();
      throw error;
    }
  }

  // Cancel current match search
  cancelMatch(reason?: string): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    if (this.currentMatch) {
      this.matches.delete(this.currentMatch.id);
      this.currentMatch = null;
    }

    this.isSearching = false;
    this.notifyListeners();
  }

  // Start the matched game
  private startMatch(): void {
    if (this.currentMatch && this.currentMatch.status === 'ready') {
      this.currentMatch.status = 'playing';
      this.currentMatch.startedAt = Date.now();
      this.notifyListeners();

      // Clear search timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }
    }
  }

  // Find available match for game
  private findAvailableMatch(gameId: string, maxPlayers: number): GameMatch | null {
    for (const match of this.matches.values()) {
      if (match.gameId === gameId &&
          match.status === 'waiting' &&
          match.players.length < maxPlayers) {
        return match;
      }
    }
    return null;
  }

  // Generate unique match ID
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Get current match
  getCurrentMatch(): GameMatch | null {
    return this.currentMatch;
  }

  // Check if currently searching
  getIsSearching(): boolean {
    return this.isSearching;
  }

  // Complete current match
  completeMatch(): void {
    if (this.currentMatch) {
      this.currentMatch.status = 'completed';
      this.matches.delete(this.currentMatch.id);
      this.currentMatch = null;
      this.notifyListeners();
    }
  }

  // Leave current match
  leaveMatch(): void {
    this.cancelMatch('Player left the match');
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService();