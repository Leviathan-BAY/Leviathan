// Prize Distribution and Game Completion Handler
// Handles prize pool calculation, distribution, and blockchain integration

import { GameInstance, PlayerInstance } from './gameInstanceManager';

export interface PrizeDistribution {
  winnerId: string;
  winnerShare: number;
  platformFee: number;
  creatorFee: number;
  totalPrizePool: number;
  distributions: {
    playerId: string;
    amount: number;
    reason: 'winner' | 'creator_fee' | 'platform_fee' | 'refund';
  }[];
}

export interface GameResult {
  instanceId: string;
  winnerId?: string;
  finalRankings: {
    playerId: string;
    position: number;
    score?: number;
  }[];
  gameEndReason: 'completed' | 'timeout' | 'forfeit' | 'cancelled';
  prizeDistribution: PrizeDistribution;
  blockchainTxId?: string;
}

export class PrizeDistributionManager {
  private static readonly PLATFORM_FEE_RATE = 0.05; // 5%
  private static readonly CREATOR_FEE_RATE = 0.02; // 2%

  // Calculate prize distribution based on game results
  static calculatePrizeDistribution(
    instance: GameInstance,
    winnerId?: string,
    finalRankings: { playerId: string; position: number; score?: number }[] = []
  ): PrizeDistribution {
    const totalPrizePool = instance.prizePool;
    const platformFee = totalPrizePool * this.PLATFORM_FEE_RATE;
    const creatorFee = totalPrizePool * this.CREATOR_FEE_RATE;
    const winnerShare = totalPrizePool - platformFee - creatorFee;

    const distributions: PrizeDistribution['distributions'] = [];

    // Winner gets the main prize
    if (winnerId && winnerShare > 0) {
      distributions.push({
        playerId: winnerId,
        amount: winnerShare,
        reason: 'winner'
      });
    }

    // Creator fee (paid to template creator)
    if (creatorFee > 0) {
      distributions.push({
        playerId: instance.creatorId,
        amount: creatorFee,
        reason: 'creator_fee'
      });
    }

    // Platform fee
    if (platformFee > 0) {
      distributions.push({
        playerId: 'platform',
        amount: platformFee,
        reason: 'platform_fee'
      });
    }

    return {
      winnerId: winnerId || '',
      winnerShare,
      platformFee,
      creatorFee,
      totalPrizePool,
      distributions
    };
  }

  // Handle game completion and prize distribution
  static async completeGame(
    instanceId: string,
    winnerId?: string,
    finalRankings: { playerId: string; position: number; score?: number }[] = [],
    gameEndReason: GameResult['gameEndReason'] = 'completed',
    signAndExecuteTransaction?: (params: { transaction: any }, options?: any) => void
  ): Promise<GameResult> {
    // This would typically interact with blockchain
    // For now, we'll simulate the process

    const instance = await this.getGameInstance(instanceId);
    if (!instance) {
      throw new Error('Game instance not found');
    }

    const prizeDistribution = this.calculatePrizeDistribution(instance, winnerId, finalRankings);

    // Submit blockchain transaction
    const blockchainTxId = await this.submitToBlockchain(instanceId, prizeDistribution, signAndExecuteTransaction);

    const gameResult: GameResult = {
      instanceId,
      winnerId,
      finalRankings,
      gameEndReason,
      prizeDistribution,
      blockchainTxId
    };

    // Update local state
    await this.updateInstanceResult(instance, gameResult);

    return gameResult;
  }

  // Simulate getting game instance (in real app, this would query the game manager)
  private static async getGameInstance(instanceId: string): Promise<GameInstance | null> {
    // This is a placeholder - in real implementation, this would use the gameInstanceManager
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock instance data
        resolve({
          id: instanceId,
          templateId: 'template-1',
          creatorId: 'creator-123',
          players: [],
          maxPlayers: 4,
          currentPlayers: 4,
          status: 'playing',
          prizePool: 4.0, // 4 SUI total
          entryFee: 1.0,
          createdAt: Date.now() - 600000, // 10 minutes ago
          startedAt: Date.now() - 300000   // 5 minutes ago
        });
      }, 100);
    });
  }

  // Submit prize distribution to blockchain
  private static async submitToBlockchain(
    instanceId: string,
    prizeDistribution: PrizeDistribution,
    signAndExecuteTransaction?: (params: { transaction: any }, options?: any) => void
  ): Promise<string> {
    // In real implementation with actual blockchain integration:
    if (signAndExecuteTransaction) {
      // Import transaction utilities
      const { CardPokerGameTransactions } = await import('../contracts/transactions');

      // Create winners array (in this case, just the single winner)
      const winners = prizeDistribution.winnerId ? [prizeDistribution.winnerId] : [];

      // Get creator from distributions
      const creatorDistribution = prizeDistribution.distributions.find(d => d.reason === 'creator_fee');
      const creatorAddress = creatorDistribution?.playerId || 'platform';

      try {
        // Create transaction for prize distribution
        // Note: The current Move contract handles distribution automatically in finalize()
        // This is a placeholder for future enhanced distribution logic
        console.log('Prize distribution would be submitted with:', {
          instanceId,
          winners,
          creatorAddress,
          distributions: prizeDistribution.distributions
        });

        // For now, return a mock transaction ID since the Move contract
        // handles distribution automatically
        return `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;

      } catch (error) {
        console.error('Error submitting prize distribution:', error);
        throw error;
      }
    }

    // Fallback to simulation for development
    return new Promise(resolve => {
      setTimeout(() => {
        // Generate mock transaction ID
        const txId = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
        console.log('Prize distribution simulated:', {
          instanceId,
          prizeDistribution,
          txId
        });
        resolve(txId);
      }, 2000); // Simulate blockchain delay
    });
  }

  // Update game instance with final results
  private static async updateInstanceResult(
    instance: GameInstance,
    gameResult: GameResult
  ): Promise<void> {
    // Update instance status
    instance.status = 'finished';
    instance.finishedAt = Date.now();
    instance.winnerId = gameResult.winnerId;

    // Update player winnings
    for (const distribution of gameResult.prizeDistribution.distributions) {
      if (distribution.reason === 'winner') {
        const winnerPlayer = instance.players.find(p => p.playerId === distribution.playerId);
        if (winnerPlayer) {
          winnerPlayer.winnings = distribution.amount;
          winnerPlayer.finalPosition = 1;
        }
      }
    }

    console.log('Game instance updated with results:', {
      instanceId: instance.id,
      status: instance.status,
      winnerId: instance.winnerId,
      prizeDistribution: gameResult.prizeDistribution
    });
  }

  // Calculate refunds for cancelled games
  static calculateRefunds(instance: GameInstance): PrizeDistribution {
    const distributions: PrizeDistribution['distributions'] = [];

    // Refund all players their entry fees
    for (const player of instance.players) {
      if (player.hasPaid) {
        distributions.push({
          playerId: player.playerId,
          amount: instance.entryFee,
          reason: 'refund'
        });
      }
    }

    return {
      winnerId: '',
      winnerShare: 0,
      platformFee: 0,
      creatorFee: 0,
      totalPrizePool: instance.prizePool,
      distributions
    };
  }

  // Handle game cancellation
  static async cancelGame(instanceId: string): Promise<GameResult> {
    const instance = await this.getGameInstance(instanceId);
    if (!instance) {
      throw new Error('Game instance not found');
    }

    const prizeDistribution = this.calculateRefunds(instance);

    // Submit refunds to blockchain
    const blockchainTxId = await this.submitToBlockchain(instanceId, prizeDistribution);

    const gameResult: GameResult = {
      instanceId,
      finalRankings: [],
      gameEndReason: 'cancelled',
      prizeDistribution,
      blockchainTxId
    };

    // Update local state
    await this.updateInstanceResult(instance, gameResult);

    return gameResult;
  }

  // Get prize distribution preview without executing
  static previewPrizeDistribution(
    prizePool: number,
    winnerId?: string
  ): {
    winnerShare: number;
    platformFee: number;
    creatorFee: number;
    breakdown: string[];
  } {
    const platformFee = prizePool * this.PLATFORM_FEE_RATE;
    const creatorFee = prizePool * this.CREATOR_FEE_RATE;
    const winnerShare = prizePool - platformFee - creatorFee;

    const breakdown = [
      `Winner: ${winnerShare.toFixed(3)} SUI (${((winnerShare / prizePool) * 100).toFixed(1)}%)`,
      `Creator: ${creatorFee.toFixed(3)} SUI (${(this.CREATOR_FEE_RATE * 100).toFixed(1)}%)`,
      `Platform: ${platformFee.toFixed(3)} SUI (${(this.PLATFORM_FEE_RATE * 100).toFixed(1)}%)`
    ];

    return {
      winnerShare,
      platformFee,
      creatorFee,
      breakdown
    };
  }

  // Validate prize distribution before execution
  static validatePrizeDistribution(prizeDistribution: PrizeDistribution): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if total distributions equal prize pool
    const totalDistributed = prizeDistribution.distributions.reduce(
      (sum, dist) => sum + dist.amount,
      0
    );

    if (Math.abs(totalDistributed - prizeDistribution.totalPrizePool) > 0.001) {
      errors.push(`Total distributed (${totalDistributed}) doesn't match prize pool (${prizeDistribution.totalPrizePool})`);
    }

    // Check for negative amounts
    for (const dist of prizeDistribution.distributions) {
      if (dist.amount < 0) {
        errors.push(`Negative distribution amount for ${dist.playerId}: ${dist.amount}`);
      }
    }

    // Check winner share calculation
    const expectedWinnerShare = prizeDistribution.totalPrizePool -
                                prizeDistribution.platformFee -
                                prizeDistribution.creatorFee;

    if (Math.abs(prizeDistribution.winnerShare - expectedWinnerShare) > 0.001) {
      errors.push(`Winner share calculation mismatch: expected ${expectedWinnerShare}, got ${prizeDistribution.winnerShare}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility functions for UI components
export function formatPrizeAmount(amount: number): string {
  return `${amount.toFixed(3)} SUI`;
}

export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function generateGameResultSummary(gameResult: GameResult): string {
  const { prizeDistribution, gameEndReason, winnerId } = gameResult;

  let summary = `Game ${gameResult.instanceId} `;

  switch (gameEndReason) {
    case 'completed':
      summary += winnerId
        ? `completed. Winner: ${winnerId.slice(0, 8)}... earned ${formatPrizeAmount(prizeDistribution.winnerShare)}`
        : 'completed with no winner';
      break;
    case 'cancelled':
      summary += 'was cancelled. All entry fees refunded.';
      break;
    case 'timeout':
      summary += 'ended due to timeout.';
      break;
    case 'forfeit':
      summary += 'ended due to forfeit.';
      break;
  }

  return summary;
}