import { useState, useEffect, useCallback } from 'react';
import { discordService, DiscordAuthState, DiscordUser } from '../services/discord';

export function useDiscord() {
  const [state, setState] = useState<DiscordAuthState>({
    user: discordService.getUser(),
    isAuthenticated: discordService.isAuthenticated(),
    isLoading: false,
    error: null
  });

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = discordService.addListener(setState);
    return unsubscribe;
  }, []);

  const login = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      discordService.login();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to login'
      }));
    }
  }, []);

  const logout = useCallback(() => {
    discordService.logout();
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await discordService.handleCallback(code, state);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  }, []);

  const getAvatarUrl = useCallback((size?: number) => {
    return discordService.getAvatarUrl(size);
  }, [state.user]);

  const getDisplayName = useCallback(() => {
    return discordService.getDisplayName();
  }, [state.user]);

  const getDiscordTag = useCallback(() => {
    return discordService.getDiscordTag();
  }, [state.user]);

  return {
    ...state,
    login,
    logout,
    handleCallback,
    getAvatarUrl,
    getDisplayName,
    getDiscordTag
  };
}