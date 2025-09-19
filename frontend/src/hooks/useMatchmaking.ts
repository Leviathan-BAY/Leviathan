import { useState, useEffect, useCallback } from 'react';
import { matchmakingService, MatchmakingState, GameMatch } from '../services/matchmaking';
import { useDiscord } from './useDiscord';
import { useCurrentAccount } from '@mysten/dapp-kit';

export function useMatchmaking() {
  const [state, setState] = useState<MatchmakingState>({
    currentMatch: matchmakingService.getCurrentMatch(),
    isSearching: matchmakingService.getIsSearching(),
    error: null
  });

  const { user: discordUser } = useDiscord();
  const currentAccount = useCurrentAccount();

  useEffect(() => {
    // Subscribe to matchmaking state changes
    const unsubscribe = matchmakingService.addListener(setState);
    return unsubscribe;
  }, []);

  const findMatch = useCallback(async (gameId: string, maxPlayers: number = 2) => {
    if (!discordUser) {
      setState(prev => ({ ...prev, error: 'Discord account not connected' }));
      return;
    }

    if (!currentAccount) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      await matchmakingService.findMatch(
        gameId,
        discordUser,
        currentAccount.address,
        maxPlayers
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to find match'
      }));
    }
  }, [discordUser, currentAccount]);

  const cancelMatch = useCallback(() => {
    matchmakingService.cancelMatch();
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const leaveMatch = useCallback(() => {
    matchmakingService.leaveMatch();
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const completeMatch = useCallback(() => {
    matchmakingService.completeMatch();
  }, []);

  return {
    ...state,
    findMatch,
    cancelMatch,
    leaveMatch,
    completeMatch,
    canSearch: !!discordUser && !!currentAccount
  };
}