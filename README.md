# Leviathan - Web3 Game Launchpad

<div align="center">
  <img src="./images/Leviathan.png" alt="Leviathan Logo" width="200" />

  <h3>Create, customize, and launch your own Web3 games on Sui blockchain</h3>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Sui](https://img.shields.io/badge/Sui-4DA3FC?logo=sui&logoColor=white)](https://sui.io/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
</div>

## 🌊 Overview

Leviathan is a revolutionary Web3 game launchpad built on the Sui blockchain that empowers creators to build and launch custom games without deep smart contract knowledge. The platform features three core modules:

- **🏦 Hermit Finance**: Delta-neutral financial engine that provides stability through hSui tokens
- **🚢 Humpback Launchpad**: No-code game creation tools for custom board games and more
- **🎮 Splash Zone**: Gaming arena where players discover and compete in community-created games

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Sui CLI (for smart contract development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/leviathan.git
   cd leviathan
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d

   # Or run individual services
   pnpm frontend:dev # Frontend (localhost:3000)
   pnpm backend:dev  # Backend API (localhost:3001)
   ```

5. **Deploy smart contracts** (optional for development)
   ```bash
   cd packages/contracts
   sui move build
   sui client publish --gas-budget 100000000
   ```

## 🏗️ Architecture

### Monorepo Structure

```
leviathan/
├── frontend/                   # React frontend application
├── backend/                    # Node.js API server
├── packages/
│   ├── contracts/              # Sui Move smart contracts
│   ├── ui/                     # Shared UI components
│   ├── utils/                  # Utility libraries
│   └── types/                  # TypeScript type definitions
├── tools/                      # Development tools and scripts
└── docs/                       # Documentation
```

### Frontend Architecture (Feature-Based)

```
frontend/src/features/
├── hermit-finance/             # hSui token management
├── humpback-launchpad/         # Game creation tools
├── splash-zone/                # Game discovery and play
├── wallet/                     # Sui wallet integration
└── shared/                     # Common components and utilities
```

## 🎯 Core Features

### Hermit Finance
- **SUI ↔ hSui Conversion**: 1:1 conversion with delta-neutral backing
- **Price Stability**: Protection from SUI token volatility
- **DeFi Integration**: Staking and futures position management

### Humpback Launchpad
- **Game Templates**: Pre-built templates for board games, card games, etc.
- **Visual Editor**: Drag-and-drop interface for game customization
- **Test Playground**: AI bots and simulation for game testing
- **Publishing**: One-click deployment to Walrus storage and on-chain registry

### Splash Zone
- **Game Discovery**: Browse and filter community-created games
- **PvP Matchmaking**: Real-time multiplayer with stake-based competitions
- **Leaderboards**: Rankings and seasonal tournaments
- **Social Features**: Player profiles, friends, and communities

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev                        # Start all services
pnpm frontend:dev               # Frontend only
pnpm backend:dev                # Backend only

# Building
pnpm build                      # Build all packages
pnpm contracts:build            # Build smart contracts only

# Testing
pnpm test                       # Run all tests
pnpm contracts:test             # Test smart contracts

# Linting
pnpm lint                       # Lint all packages
```

### Smart Contract Development

```bash
cd packages/contracts

# Build contracts
sui move build

# Run tests
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000
```

### Database Setup

```bash
cd backend

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# Frontend tests
cd frontend && pnpm test

# Backend tests
cd backend && pnpm test

# Smart contract tests
cd packages/contracts && sui move test
```

### E2E Testing

```bash
# Install Playwright
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e
```

## 📦 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Build Docker images
docker-compose -f docker-compose.prod.yml build
```

### Smart Contract Deployment

1. **Testnet Deployment**
   ```bash
   cd packages/contracts
   sui client publish --gas-budget 100000000
   ```

2. **Mainnet Deployment**
   ```bash
   sui client switch --env mainnet
   sui client publish --gas-budget 100000000
   ```

3. **Update Environment Variables**
   ```bash
   # Add contract addresses to .env
   HERMIT_FINANCE_PACKAGE_ID=0x...
   GAME_LAUNCHPAD_PACKAGE_ID=0x...
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Website](https://leviathan.game) (Coming Soon)
- [Documentation](./docs/)
- [Sui Documentation](https://docs.sui.io/)
- [Discord Community](#) (Coming Soon)

## 🙏 Acknowledgments

- [Sui Foundation](https://sui.io/) for the amazing blockchain platform
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the frontend tooling
- All the open-source contributors who made this project possible

---

<div align="center">
  <strong>Built with ❤️ for the Web3 gaming community</strong>
</div>