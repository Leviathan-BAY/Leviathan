// Card Game Engine - Frontend-based game logic processing
// 프론트엔드에서 실행되는 카드 게임 엔진

export interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number; // 1-13 (A, 2-10, J, Q, K)
  isVisible: boolean;
}

export interface Player {
  address: string;
  name: string;
  hand: Card[];
  score: number;
  isActive: boolean;
  isReady: boolean;
}

export interface GameMove {
  playerId: string;
  moveType: string;
  data: any;
  timestamp: number;
}

export interface CardGameState {
  gameId: string;
  templateId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  turnCount: number;
  gamePhase: 'setup' | 'playing' | 'finished';
  winner: string | null;
  seed: number;
  lastMove: GameMove | null;
  gameStartTime: number;
  gameEndTime: number | null;
}

export interface GameRules {
  gameType: 'poker' | 'blackjack' | 'uno' | 'custom';
  maxPlayers: number;
  minPlayers: number;
  deckSize: number;
  handSize: number;
  winConditions: WinCondition[];
  specialRules: SpecialRule[];
}

export interface WinCondition {
  type: 'score' | 'cards' | 'rounds';
  target: number;
  comparison: 'greater' | 'less' | 'equal';
}

export interface SpecialRule {
  trigger: string;
  action: string;
  parameters: any;
}

// 시드 기반 난수 생성기 (재현 가능한 랜덤)
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

export class CardGameEngine {
  private state: CardGameState;
  private rules: GameRules;
  private random: SeededRandom;

  constructor(gameId: string, templateId: string, players: string[], seed: number, rules: GameRules) {
    this.random = new SeededRandom(seed);
    this.rules = rules;
    this.state = this.initializeGame(gameId, templateId, players);
  }

  private initializeGame(gameId: string, templateId: string, playerAddresses: string[]): CardGameState {
    const players: Player[] = playerAddresses.map(address => ({
      address,
      name: `Player ${address.slice(0, 6)}...`,
      hand: [],
      score: 0,
      isActive: true,
      isReady: false
    }));

    const deck = this.createDeck();
    this.shuffleDeck(deck);

    return {
      gameId,
      templateId,
      players,
      deck,
      discardPile: [],
      currentPlayerIndex: 0,
      turnCount: 0,
      gamePhase: 'setup',
      winner: null,
      seed: this.random.seed,
      lastMove: null,
      gameStartTime: Date.now(),
      gameEndTime: null
    };
  }

  private createDeck(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          isVisible: false
        });
      }
    }

    return deck;
  }

  private shuffleDeck(deck: Card[]): void {
    // Fisher-Yates shuffle with seeded random
    for (let i = deck.length - 1; i > 0; i--) {
      const j = this.random.nextInt(i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  public startGame(): CardGameState {
    if (this.state.gamePhase !== 'setup') {
      throw new Error('Game is not in setup phase');
    }

    // Deal initial cards based on rules
    this.dealInitialCards();

    this.state.gamePhase = 'playing';
    this.state.gameStartTime = Date.now();

    return { ...this.state };
  }

  private dealInitialCards(): void {
    const cardsPerPlayer = this.rules.handSize || 7;

    for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex++) {
      for (const player of this.state.players) {
        if (this.state.deck.length > 0) {
          const card = this.state.deck.pop()!;
          card.isVisible = true;
          player.hand.push(card);
        }
      }
    }
  }

  public executeMove(move: GameMove): CardGameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.address !== move.playerId) {
      throw new Error('Not your turn');
    }

    // Validate and execute move based on game type
    switch (this.rules.gameType) {
      case 'poker':
        this.executePokerMove(move);
        break;
      case 'blackjack':
        this.executeBlackjackMove(move);
        break;
      case 'uno':
        this.executeUnoMove(move);
        break;
      default:
        this.executeCustomMove(move);
    }

    this.state.lastMove = move;
    this.state.turnCount++;

    // Check win conditions
    const winner = this.checkWinConditions();
    if (winner) {
      this.state.winner = winner;
      this.state.gamePhase = 'finished';
      this.state.gameEndTime = Date.now();
    } else {
      this.nextTurn();
    }

    return { ...this.state };
  }

  private executePokerMove(move: GameMove): void {
    switch (move.moveType) {
      case 'fold':
        this.state.players[this.state.currentPlayerIndex].isActive = false;
        break;
      case 'call':
      case 'raise':
      case 'check':
        // Poker-specific logic
        break;
    }
  }

  private executeBlackjackMove(move: GameMove): void {
    const player = this.state.players[this.state.currentPlayerIndex];

    switch (move.moveType) {
      case 'hit':
        if (this.state.deck.length > 0) {
          const card = this.state.deck.pop()!;
          card.isVisible = true;
          player.hand.push(card);
          player.score = this.calculateBlackjackScore(player.hand);
        }
        break;
      case 'stand':
        // Player stands, no action needed
        break;
      case 'double':
        // Double down logic
        break;
    }
  }

  private executeUnoMove(move: GameMove): void {
    const player = this.state.players[this.state.currentPlayerIndex];

    switch (move.moveType) {
      case 'playCard':
        const cardIndex = move.data.cardIndex;
        if (cardIndex >= 0 && cardIndex < player.hand.length) {
          const card = player.hand.splice(cardIndex, 1)[0];
          this.state.discardPile.push(card);
        }
        break;
      case 'drawCard':
        if (this.state.deck.length > 0) {
          const card = this.state.deck.pop()!;
          card.isVisible = true;
          player.hand.push(card);
        }
        break;
    }
  }

  private executeCustomMove(move: GameMove): void {
    // Custom game logic based on special rules
    for (const rule of this.rules.specialRules) {
      if (rule.trigger === move.moveType) {
        this.executeSpecialRule(rule, move);
      }
    }
  }

  private executeSpecialRule(rule: SpecialRule, move: GameMove): void {
    // Execute custom rule actions
    switch (rule.action) {
      case 'addScore':
        this.state.players[this.state.currentPlayerIndex].score += rule.parameters.amount;
        break;
      case 'drawCards':
        this.drawCards(this.state.currentPlayerIndex, rule.parameters.count);
        break;
      // Add more custom actions as needed
    }
  }

  private drawCards(playerIndex: number, count: number): void {
    const player = this.state.players[playerIndex];
    for (let i = 0; i < count && this.state.deck.length > 0; i++) {
      const card = this.state.deck.pop()!;
      card.isVisible = true;
      player.hand.push(card);
    }
  }

  private calculateBlackjackScore(hand: Card[]): number {
    let score = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.rank === 1) {
        aces++;
        score += 11;
      } else if (card.rank > 10) {
        score += 10;
      } else {
        score += card.rank;
      }
    }

    // Handle aces
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }

  private checkWinConditions(): string | null {
    for (const condition of this.rules.winConditions) {
      for (const player of this.state.players) {
        if (this.evaluateWinCondition(player, condition)) {
          return player.address;
        }
      }
    }
    return null;
  }

  private evaluateWinCondition(player: Player, condition: WinCondition): boolean {
    let value: number;

    switch (condition.type) {
      case 'score':
        value = player.score;
        break;
      case 'cards':
        value = player.hand.length;
        break;
      case 'rounds':
        value = this.state.turnCount;
        break;
      default:
        return false;
    }

    switch (condition.comparison) {
      case 'greater':
        return value > condition.target;
      case 'less':
        return value < condition.target;
      case 'equal':
        return value === condition.target;
      default:
        return false;
    }
  }

  private nextTurn(): void {
    let nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

    // Skip inactive players
    while (!this.state.players[nextPlayerIndex].isActive &&
           nextPlayerIndex !== this.state.currentPlayerIndex) {
      nextPlayerIndex = (nextPlayerIndex + 1) % this.state.players.length;
    }

    this.state.currentPlayerIndex = nextPlayerIndex;
  }

  public validateMove(move: GameMove): boolean {
    if (this.state.gamePhase !== 'playing') return false;

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.address !== move.playerId) return false;

    // Game-specific validation
    switch (this.rules.gameType) {
      case 'blackjack':
        return this.validateBlackjackMove(move);
      case 'uno':
        return this.validateUnoMove(move);
      case 'poker':
        return this.validatePokerMove(move);
      default:
        return true;
    }
  }

  private validateBlackjackMove(move: GameMove): boolean {
    const player = this.state.players[this.state.currentPlayerIndex];

    switch (move.moveType) {
      case 'hit':
        return player.score < 21;
      case 'stand':
        return true;
      case 'double':
        return player.hand.length === 2;
      default:
        return false;
    }
  }

  private validateUnoMove(move: GameMove): boolean {
    const player = this.state.players[this.state.currentPlayerIndex];

    switch (move.moveType) {
      case 'playCard':
        const cardIndex = move.data?.cardIndex;
        return cardIndex >= 0 && cardIndex < player.hand.length;
      case 'drawCard':
        return this.state.deck.length > 0;
      default:
        return false;
    }
  }

  private validatePokerMove(move: GameMove): boolean {
    switch (move.moveType) {
      case 'fold':
      case 'call':
      case 'raise':
      case 'check':
        return true;
      default:
        return false;
    }
  }

  public getGameState(): CardGameState {
    return { ...this.state };
  }

  public getPlayerHand(playerAddress: string): Card[] {
    const player = this.state.players.find(p => p.address === playerAddress);
    return player ? [...player.hand] : [];
  }

  public getCurrentPlayer(): Player | null {
    return this.state.players[this.state.currentPlayerIndex] || null;
  }

  public getWinner(): string | null {
    return this.state.winner;
  }

  public getFinalScores(): { [address: string]: number } {
    const scores: { [address: string]: number } = {};
    for (const player of this.state.players) {
      scores[player.address] = player.score;
    }
    return scores;
  }

  // Static utility methods
  static createSimplePokerRules(): GameRules {
    return {
      gameType: 'poker',
      maxPlayers: 4,
      minPlayers: 2,
      deckSize: 52,
      handSize: 5,
      winConditions: [
        { type: 'score', target: 100, comparison: 'greater' }
      ],
      specialRules: []
    };
  }

  static createBlackjackRules(): GameRules {
    return {
      gameType: 'blackjack',
      maxPlayers: 4,
      minPlayers: 2,
      deckSize: 52,
      handSize: 2,
      winConditions: [
        { type: 'score', target: 21, comparison: 'equal' },
        { type: 'score', target: 21, comparison: 'greater' } // Bust condition
      ],
      specialRules: []
    };
  }

  static createUnoRules(): GameRules {
    return {
      gameType: 'uno',
      maxPlayers: 8,
      minPlayers: 2,
      deckSize: 108,
      handSize: 7,
      winConditions: [
        { type: 'cards', target: 0, comparison: 'equal' }
      ],
      specialRules: [
        { trigger: 'draw4', action: 'drawCards', parameters: { count: 4 } },
        { trigger: 'draw2', action: 'drawCards', parameters: { count: 2 } }
      ]
    };
  }
}