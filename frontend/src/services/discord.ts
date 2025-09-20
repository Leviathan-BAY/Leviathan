// Discord OAuth integration for Leviathan
// This provides Discord authentication for player profiles and matchmaking

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
  email?: string;
}

export interface DiscordAuthState {
  user: DiscordUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class DiscordService {
  private readonly CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
  private readonly REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}/auth/discord/callback`;
  private readonly SCOPES = ['identify', 'email'];

  private user: DiscordUser | null = null;
  private accessToken: string | null = null;
  private listeners: ((state: DiscordAuthState) => void)[] = [];

  constructor() {
    // Validate environment configuration
    if (!this.CLIENT_ID) {
      console.warn('Discord Client ID not found in environment variables. Discord functionality will be disabled.');
    }

    // Load saved auth state from localStorage
    this.loadAuthState();
  }

  // Add state change listener
  addListener(callback: (state: DiscordAuthState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    const state: DiscordAuthState = {
      user: this.user,
      isAuthenticated: !!this.user,
      isLoading: false,
      error: null
    };
    this.listeners.forEach(listener => listener(state));
  }

  // Generate Discord OAuth URL
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: this.SCOPES.join(' '),
      state: this.generateState() // CSRF protection
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  // Redirect to Discord OAuth
  login() {
    if (!this.CLIENT_ID) {
      console.error('Discord Client ID not configured. Please check your .env file.');
      alert('Discord is not configured. Please check the setup instructions in the README.');
      return;
    }

    // Store current page to return to after Discord auth
    localStorage.setItem('discord_return_url', window.location.pathname);

    const authUrl = this.getAuthUrl();
    console.log('Redirecting to Discord:', authUrl);
    window.location.href = authUrl;
  }

  // Handle OAuth callback (called from callback page)
  async handleCallback(code: string, state: string): Promise<void> {
    try {
      // Verify state parameter for CSRF protection
      const savedState = localStorage.getItem('discord_oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      this.accessToken = tokenResponse.access_token;

      // Fetch user profile
      const userProfile = await this.fetchUserProfile();
      this.user = userProfile;

      // Save to localStorage
      this.saveAuthState();
      this.notifyListeners();

    } catch (error) {
      console.error('Discord OAuth callback error:', error);
      this.logout();
      throw error;
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(code: string) {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: import.meta.env.VITE_DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  // Fetch user profile from Discord API
  private async fetchUserProfile(): Promise<DiscordUser> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  // Logout and clear state
  logout() {
    this.user = null;
    this.accessToken = null;
    this.clearAuthState();
    this.notifyListeners();
  }

  // Get current user
  getUser(): DiscordUser | null {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.user;
  }

  // Get user avatar URL
  getAvatarUrl(size: number = 128): string | null {
    if (!this.user) return null;

    if (this.user.avatar) {
      return `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png?size=${size}`;
    }

    // Default avatar based on discriminator
    const defaultAvatar = parseInt(this.user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
  }

  // Get display name (prioritizing global_name over username)
  getDisplayName(): string | null {
    if (!this.user) return null;
    return this.user.global_name || this.user.username;
  }

  // Get full Discord tag (username#discriminator)
  getDiscordTag(): string | null {
    if (!this.user) return null;
    return `${this.user.username}#${this.user.discriminator}`;
  }

  // Generate random state for CSRF protection
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('discord_oauth_state', state);
    return state;
  }

  // Save auth state to localStorage
  private saveAuthState() {
    if (this.user && this.accessToken) {
      localStorage.setItem('discord_user', JSON.stringify(this.user));
      localStorage.setItem('discord_access_token', this.accessToken);
    }
  }

  // Load auth state from localStorage
  private loadAuthState() {
    try {
      const savedUser = localStorage.getItem('discord_user');
      const savedToken = localStorage.getItem('discord_access_token');

      if (savedUser && savedToken) {
        this.user = JSON.parse(savedUser);
        this.accessToken = savedToken;

        // Verify token is still valid by making a quick API call
        this.verifyToken().catch(() => {
          // Token expired or invalid, logout
          this.logout();
        });
      }
    } catch (error) {
      console.error('Error loading Discord auth state:', error);
      this.clearAuthState();
    }
  }

  // Verify access token is still valid
  private async verifyToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }
  }

  // Clear auth state from localStorage
  private clearAuthState() {
    localStorage.removeItem('discord_user');
    localStorage.removeItem('discord_access_token');
    localStorage.removeItem('discord_oauth_state');
    localStorage.removeItem('discord_return_url');
  }
}

// Export singleton instance
export const discordService = new DiscordService();