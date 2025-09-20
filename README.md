Here’s the **complete README.md** including everything we just refined — fully merged into a single, cohesive file for you to drop into your repo.

```markdown
# Leviathan – 100% On-Chain Web3 Game Platform

<div align="center">
  <img src="./images/Leviathan.png" alt="Leviathan Logo" width="200" />

  <h3>Create, deploy, and play fully on-chain games — no backend, no servers, just Sui</h3>

  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" /></a>
  <a href="https://sui.io/"><img src="https://img.shields.io/badge/Sui-4DA3FC?logo=sui&logoColor=white" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" /></a>
</div>

---

## 🌊 Overview

**Leviathan** is a fully on-chain game launchpad built on the **Sui blockchain**.  
Unlike traditional Web3 games, **there is no backend or centralized database** — game rules, maps, state, and player actions live entirely in Move smart contracts. The frontend communicates with Sui directly using the Sui SDK.

---

## 🎯 Platform Offers

Leviathan consists of four main modules, all deployed as Move smart contracts:

- **🏦 Hermit Finance** – Our delta-neutral financial engine. Users stake SUI to mint **hSUI** (1:1), which they can use for launch fees, tournament entry, or in-game economy. This protects players from sudden SUI price swings. Users can unstake anytime to redeem SUI back.

- **🛠️ Humpback Launchpad** – A no-code game creation hub where creators design their own **board maps**, choose dice ranges, set up obstacles (walls, bombs), and configure start/goal points. Once published, a **RuleConfig** object is minted on-chain — immutable, permanent, and ready for players to spawn new games.

- **🎮 Game Engine** – The universal runtime that enforces game rules, processes dice rolls, updates board state, and determines winners. All actions emit events that the frontend can subscribe to for real-time UI updates.

- **🌊 Splash Zone** – The discovery and play arena. Players browse available games, join open instances, spectate or compete, and see leaderboards and history — all powered by on-chain events and state.

---

## 🏗️ Architecture

### Monorepo Layout

```

leviathan/
├── frontend/           # React app (connects directly to Sui, no backend)
├── packages/           # Move contracts and TypeScript bindings
└── images/             # Logos and assets

````

> This dApp is 100% on-chain — matchmaking, turn order, deck state, and victory checks are all done in Move modules.

---

## 🎲 Main Game: Custom Dice Board Game

The flagship experience of Leviathan is a fully on-chain board game builder:

- **Board**: 10×10 grid (100 tiles) fully configurable.
- **Tile Types**: Passable, Wall (blocks movement), Bomb (triggers death/loss), Start, Goal.
- **Player & Dice Rules**: Creators choose number of players, pawns per player, dice range (1–6, 1–10, etc.).
- **Game Objective**: Reach the goal first or survive traps.
- **Publishing**: Once deployed, rules are immutable and can be reused by anyone to create multiple concurrent play sessions.

---

## 🃏 Card Game Engine (Optional)

Leviathan also supports card-based games with **two win conditions only**:

- **Poker Hand** – Compare hands using customizable ranking (you can choose card count, suit count, and number range).
- **Card Sum** – Closest to a target sum wins (Blackjack-like).

This mode is **not turn-based** — cards are dealt, compared, and winner is declared in a single transaction.  
(Frontend integration is still in progress — contracts are already implemented.)

---

## 🏦 hSUI: In-Platform Token

- **Stake SUI → Receive hSUI** (1:1 ratio)
- **Unstake → Redeem SUI** with rewards
- **Protects from volatility** with a delta-neutral hedging strategy
- **Mandatory for publishing games** and can be used for staking in matches

---

## 🚀 Quick Start

```bash
git clone https://github.com/Leviathan-BAY/Leviathan.git
cd Leviathan
pnpm install
cd frontend
pnpm run dev
````


---

## 🔗 On-Chain Flow

1. **Create Template** – Publish your map and rules on-chain.
2. **Spawn Instance** – Players join and a shared game instance is created.
3. **Play** – Dice rolls and movements processed on-chain.
4. **Finalize** – Winner is declared, events emitted.

---

## 📄 License

MIT © Leviathan Contributors

---

<div align="center">
<strong>Build, deploy, and play — all on-chain. Powered by Sui.</strong>
</div>
```

---