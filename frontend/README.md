# Leviathan - Web3 Game Launchpad

Leviathan is a Sui blockchain-based Web3 game launchpad where users can create custom board games and play them with others. The platform features Discord integration for multiplayer gaming and stable value liquid staking through Hermit Finance.

## Tech Stack

- [React](https://react.dev/) as the UI framework
- [TypeScript](https://www.typescriptlang.org/) for type checking
- [Vite](https://vitejs.dev/) for build tooling
- [Radix UI](https://www.radix-ui.com/) for pre-built UI components
- [ESLint](https://eslint.org/)
- [`@mysten/dapp-kit`](https://sdk.mystenlabs.com/dapp-kit) for connecting to
  wallets and loading data
- [pnpm](https://pnpm.io/) for package management
- Discord OAuth2 for multiplayer authentication

## Setup

### 1. Environment Configuration

Copy the environment template and configure your Discord application:

```bash
cp .env.example .env
```

Edit `.env` with your Discord application credentials:

```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
VITE_DISCORD_CLIENT_SECRET=your_discord_client_secret_here
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback
VITE_SUI_NETWORK=devnet
```

### 2. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or use an existing one
3. Go to **OAuth2** settings
4. Copy your **Client ID** and **Client Secret**
5. Add the following redirect URIs:
   - `http://localhost:5173/auth/discord/callback`
   - `http://localhost:3000/auth/discord/callback` (alternative port)
   - `http://localhost:5174/auth/discord/callback` (alternative port)
   - `http://127.0.0.1:5173/auth/discord/callback` (IP alternative)

### 3. Installation & Development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

## Building

To build your app for deployment you can run

```bash
pnpm build
```

## Troubleshooting

### Discord Connection Issues

If the "Connect Discord" button doesn't redirect to Discord:

1. **Check your `.env` file**: Make sure you copied `.env.example` to `.env` and filled in your actual Discord credentials
2. **Verify Discord Application Settings**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - In OAuth2 settings, ensure the redirect URI `http://localhost:5173/auth/discord/callback` is added
3. **Check your port**: If running on a different port, update both your `.env` file and Discord application settings
4. **Try alternative URLs**: Add these redirect URIs to your Discord app settings:
   - `http://127.0.0.1:5173/auth/discord/callback`
   - `http://localhost:5174/auth/discord/callback`

### Common Issues

- **"Invalid Client" error**: Your Discord Client ID or Secret is incorrect
- **"Invalid Redirect URI" error**: The redirect URI in your Discord app doesn't match your `.env` file
- **Port conflicts**: Try running on a different port with `pnpm dev --port 3000`

## Features

- **Humpback Launchpad**: Create custom board games with no-code tools
- **Splash Zone**: Play community-created games with SUI staking
- **Hermit Finance**: Stable value liquid staking (hSui) with delta-neutral strategy
- **Discord Integration**: Multiplayer gaming with Discord authentication
- **Sui Blockchain**: Web3 gaming on Sui network with low gas fees
