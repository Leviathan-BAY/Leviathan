# Leviathan - Web3 Game Launchpad on Sui

<div align="center">
  <img src="./images/Leviathanlogo.png" alt="Leviathan Logo" width="200" />

  <h3>Create, customize, and launch your own dice/board games on Sui blockchain with financial stability</h3>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Sui](https://img.shields.io/badge/Sui-4DA3FC?logo=sui&logoColor=white)](https://sui.io/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
</div>

## 🌊 Overview

Leviathan is a Web3 game launchpad built on Sui blockchain that enables creators to build and launch custom dice/board games without requiring smart contract expertise. The platform combines game creation tools with financial stability mechanisms to create a thriving creator economy.

### 🎯 Core Modules

- **🏦 Hermit Finance**: Liquid staking system providing financial stability through hSUI tokens with delta-neutral strategy
- **🚢 Humpback Launchpad**: Visual game creation tools for customizing dice/board games with drag-and-drop editor
- **🎮 Splash Zone**: Gaming arena for discovering and playing community-created games with real stakes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Sui CLI for smart contract interaction
- A Sui wallet (like Slush) for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Leviathan-BAY/Leviathan.git
   cd Leviathan
   ```
   
2. **Install frontend dependencies**
   ```bash
   cd frontend
   pnpm install
   ```

3. **Set up Sui environment**
   ```bash
   # Install Sui CLI
   curl -fsSL https://sui.io/install.sh | sh

   # Configure testnet
   sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
   sui client switch --env testnet
   sui client faucet  # Get test SUI
   ```

4. **Start development server**
   ```bash
   cd frontend
   pnpm run dev  # Frontend (localhost:5173)
   ```

5. **Smart contracts** (already deployed on testnet)
   - hSUI contracts: Live on Sui testnet
   - Game contracts: Available for board game and poker

## 🏗️ Project Structure

### Current Architecture

```
leviathan/
├── frontend/                   # React + Vite frontend application
│   ├── src/
│   │   ├── pages/              # Main pages (HomePage, HermitFinancePage, etc.)
│   │   ├── layouts/            # Layout components (MainLayout)
│   │   ├── config/             # Contract addresses and configuration
│   │   ├── utils/              # Sui client and utilities
│   │   ├── hooks/              # React hooks for Sui integration
│   │   ├── assets/             # Images and static assets
│   │   └── WalletStatus.tsx    # Wallet connection component
├── packages/
│   └── contracts/              # Sui Move smart contracts
│       ├── sources/            # Move contract source files
│       │   ├── hsui.move      # hSUI liquid staking token
│       │   ├── board_game_*.move  # Board game contracts
│       │   └── card_poker_*.move  # Poker game contracts
│       └── Move.toml          # Move package configuration
├── images/                     # Logo and branding assets
└── docs/                      # Documentation
```

### Tech Stack

- **Frontend**: React 18.3.1 + TypeScript + Vite 7.1.5
- **UI Library**: Radix UI Themes 3.2.1 (glassmorphism design)
- **Blockchain**: Sui Move smart contracts
- **Wallet Integration**: @mysten/dapp-kit 0.18.0
- **State Management**: @tanstack/react-query 5.87.1

## 🎯 Core Features

### 🏦 Hermit Finance - Liquid Staking Engine
The financial backbone providing stability for the gaming ecosystem:

- **SUI ↔ hSUI Conversion**: 1:1 deposit ratio with delta-neutral strategy backing
- **Price Stability**: Protects users from SUI token volatility through hedging mechanisms
- **Live Implementation**: Fully deployed on Sui testnet with real SUI deposits
- **User Benefits**: Stake SUI, receive hSUI, and use stable tokens for gaming
- **APY Rewards**: Earn staking rewards while maintaining value stability

### 🚢 Humpback Launchpad - Game Creation Studio
Visual no-code tools for creating custom dice and board games:

- **5×5 Board Templates**: Pre-configured game boards with customizable layouts
- **Dice Game Mechanics**: Roll-and-move gameplay with configurable dice (1-6)
- **Game Customization**:
  - Set player count (2-4 players)
  - Configure dice rules and movement
  - Design board layouts with start/finish points
  - Set stake amounts for competitive play
- **Visual Editor**: Drag-and-drop interface for game piece placement
- **Publishing**: Deploy games to blockchain with template system
- **Community Showcase**: Browse and play games created by other users

### 🎮 Splash Zone - Gaming Arena
Discover and play community-created games with real stakes:

- **Game Discovery**: Browse published dice/board games
- **Competitive Play**: Join games with SUI stakes
- **Community Features**: Rate and review games
- **Fair Gameplay**: Smart contract-enforced rules and payouts


## 🛠️ Development

### Available Scripts

```bash

# Smart Contract Development
cd packages/contracts
sui move build                  # Build Move contracts
sui move test                   # Run contract tests
sui client publish --gas-budget 200000000  # Deploy to testnet
```

### Smart Contract Development

```bash
cd packages/contracts

# Build contracts
sui move build

# Run tests (if available)
sui move test

# Deploy to testnet (requires sufficient gas)
sui client publish --gas-budget 200000000

# Check wallet balance
sui client gas

# Get testnet SUI
sui client faucet
```

### Contract Addresses (Testnet)

Current deployed contracts on Sui testnet:

```typescript
export const TESTNET_CONTRACTS = {
  PACKAGE_ID: '0xff744af12fc4de6eae0af442ec787adbab873a9f18b36efcb95591d1f1e95f41',
  HSUI_VAULT: '0x8885b711d44b78b4e7b01b6af0f469853ed02f6e7e7f699cee75e4563cf6e5de',
  ADMIN_CAP: '0xad0b33ed7b5acb027c4b6b86bd10b942fe2d33e495469d31e53ab56374b23c26',
  GAME_REGISTRY: '0x0bf6e2b278866cc12754f6ad9d278ba7848bd31bcb4f4af6c2b94c7e5d70adb4',
};
```

## 🎮 How to Use

### For Players

1. **Connect Wallet**: Use a Sui-compatible wallet (like Slush)
2. **Get Testnet SUI**: Use the Sui faucet for testing
3. **Try Hermit Finance**:
   - Visit `/hermit-finance` to stake SUI for stable hSUI
   - Experience 1:1 conversion with delta-neutral backing
4. **Create Games**:
   - Go to `/humpback-launchpad`
   - Choose board game template
   - Customize your 5×5 board game
   - Publish to the blockchain
5. **Play Games**:
   - Visit `/splash-zone` to discover community games
   - Join games with real SUI stakes
6. **Poker Demo**:
   - Try `/poker-game` for a simple 2-player poker experience

### For Developers

1. **Clone and Setup**: Follow the Quick Start guide above
2. **Study the Code**:
   - `frontend/src/pages/` - Main application pages
   - `packages/contracts/sources/` - Smart contract implementations
   - `frontend/src/config/contracts.ts` - Contract addresses and configuration
3. **Extend Features**:
   - Add new game templates
   - Enhance the visual editor
   - Integrate additional DeFi features

## 🔧 Configuration

### Environment Setup

The project uses several configuration files:

- `frontend/src/config/contracts.ts` - Contract addresses
- `packages/contracts/Move.toml` - Move package configuration
- `frontend/vite.config.ts` - Vite build configuration

### Wallet Integration

Supported wallets through @mysten/dapp-kit:
- Slush Wallet
- Sui Wallet
- And other Sui-compatible wallets

## 🎯 Features Roadmap

### ✅ Implemented
- **Hermit Finance**: Full hSUI liquid staking system
- **Humpback Launchpad**: 5×5 board game creation tools
- **Basic Poker**: Smart contract implementation
- **Wallet Integration**: Sui wallet connection
- **Glassmorphism UI**: Modern design system

### 🚧 In Development
- **Enhanced Game Templates**: More board game varieties
- **Splash Zone**: Game discovery and matchmaking
- **Advanced Poker**: Full frontend implementation
- **Tournament System**: Organized competitions

### 🎯 Planned
- **NFT Integration**: Game pieces as NFTs
- **Advanced Editor**: More customization options
- **Mobile Support**: React Native implementation
- **Mainnet Deployment**: Production-ready launch

## 🤝 Contributing

We welcome contributions to the Leviathan ecosystem!

### How to Contribute
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Areas for Contribution
- 🎮 New game templates and mechanics
- 🎨 UI/UX improvements and design enhancements
- 🔧 Smart contract optimizations
- 📚 Documentation and tutorials
- 🐛 Bug fixes and testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links & Resources

- **Sui Documentation**: [https://docs.sui.io/](https://docs.sui.io/)
- **Sui Move Language**: [https://move-language.github.io/](https://move-language.github.io/)
- **Radix UI**: [https://www.radix-ui.com/](https://www.radix-ui.com/)
- **Vite**: [https://vitejs.dev/](https://vitejs.dev/)

## 🙏 Acknowledgments

- **Sui Foundation** for the innovative blockchain platform and Move language
- **Radix UI Team** for the excellent component library
- **React & Vite Teams** for the outstanding development tools
- **Web3 Gaming Community** for inspiration and feedback

---

<div align="center">
  <img src="./images/Humpbacklogo.png" alt="Humpback" width="50" />
  <img src="./images/Hermitlogo.png" alt="Hermit" width="50" />
  <img src="./images/SplashZonelogo.png" alt="Splash Zone" width="50" />

  <br><br>
  <strong>🌊 Built with ❤️ for the Web3 gaming community 🎮</strong>

  <br><br>
  <em>Empowering creators to build the future of decentralized gaming on Sui</em>
</div>
