// Card Game Engine for Leviathan Platform
// Handles deck management, card distribution, turn logic, and win condition checking

export interface Card {
  id: string;
  suit: string;
  rank: number;
  isJoker: boolean;
  value: number; // Calculated value considering joker rules
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  hasWon: boolean;
  hasFolded: boolean;
}

export interface GameState {
  instanceId: string;
  templateId: string;
  players: Player[];
  currentPlayerIndex: number;
  turn: number;
  deck: Card[];
  field: Card[];
  phase: 'waiting' | 'playing' | 'finished';
  winner?: string;
  config: CardGameConfig;
  lastAction?: GameAction;
}

export interface CardGameConfig {
  title: string;
  description: string;
  numPlayers: number;
  winCondition: 'highest_card' | 'closest_sum' | 'empty_hand';
  initialCardsInHand: number;
  initialCardsOnField: number;
  handVisibility: 'public' | 'private';
  fieldVisibility: 'public' | 'private';
  deckComposition: {
    suits: number;
    ranksPerSuit: number;
    jokers: number;
  };
  cardsDrawnPerTurn: number;
  cardsPlayedPerTurn: number;
  jokerRule: 'wildcard' | 'lowest' | 'highest' | 'none';
  allowedActions: string[];
  blackjackTarget?: number;
  turnLimit: number;
  launchFee: number;
}

export interface GameAction {
  type: 'draw' | 'play' | 'pass' | 'fold' | 'discard' | 'swap';
  playerId: string;
  cardId?: string;
  targetCardId?: string;
  data?: any;
}

export class CardGameEngine {
  private state: GameState;

  constructor(config: CardGameConfig, players: string[], instanceId: string, templateId: string) {
    this.state = {
      instanceId,
      templateId,
      players: players.map(id => ({
        id,
        name: `Player ${id.slice(0, 6)}`,
        hand: [],
        score: 0,
        hasWon: false,
        hasFolded: false
      })),
      currentPlayerIndex: 0,
      turn: 1,
      deck: this.createDeck(config.deckComposition, config.jokerRule),
      field: [],
      phase: 'waiting',
      config
    };
  }

  // Create and shuffle deck based on configuration
  private createDeck(composition: CardGameConfig['deckComposition'], jokerRule: string): Card[] {
    const deck: Card[] = [];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades', 'stars', 'moons'].slice(0, composition.suits);

    // Add regular cards
    for (const suit of suits) {
      for (let rank = 1; rank <= composition.ranksPerSuit; rank++) {
        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          isJoker: false,
          value: rank
        });
      }
    }

    // Add jokers
    for (let i = 0; i < composition.jokers; i++) {
      const value = jokerRule === 'lowest' ? 1 :
                   jokerRule === 'highest' ? composition.ranksPerSuit :
                   0; // Wildcard value determined during play

      deck.push({
        id: `joker-${i}`,
        suit: 'joker',
        rank: 0,
        isJoker: true,
        value
      });
    }

    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Initialize game and deal initial cards
  initializeGame(): GameState {
    // Deal initial cards to hands
    for (let i = 0; i < this.state.config.initialCardsInHand; i++) {
      for (const player of this.state.players) {
        if (this.state.deck.length > 0) {
          const card = this.state.deck.pop()!;
          player.hand.push(card);
        }
      }
    }

    // Deal initial cards to field
    for (let i = 0; i < this.state.config.initialCardsOnField; i++) {
      if (this.state.deck.length > 0) {
        const card = this.state.deck.pop()!;
        this.state.field.push(card);
      }
    }

    this.state.phase = 'playing';
    return this.state;
  }

  // Execute a game action
  executeAction(action: GameAction): { success: boolean; error?: string; state: GameState } {
    const player = this.state.players.find(p => p.id === action.playerId);

    if (!player) {
      return { success: false, error: "Player not found", state: this.state };
    }

    if (player.hasFolded) {
      return { success: false, error: "Player has folded", state: this.state };
    }

    if (this.state.players[this.state.currentPlayerIndex].id !== action.playerId) {
      return { success: false, error: "Not your turn", state: this.state };
    }

    if (!this.state.config.allowedActions.includes(action.type)) {
      return { success: false, error: `Action ${action.type} not allowed`, state: this.state };
    }

    let success = false;
    let error: string | undefined;

    switch (action.type) {
      case 'draw':
        ({ success, error } = this.executeDrawAction(player));
        break;
      case 'play':
        ({ success, error } = this.executePlayAction(player, action.cardId!));
        break;
      case 'pass':
        success = true;
        break;
      case 'fold':
        player.hasFolded = true;
        success = true;
        break;
      case 'discard':
        ({ success, error } = this.executeDiscardAction(player, action.cardId!));
        break;
      default:
        error = `Action ${action.type} not implemented`;
    }

    if (success) {
      this.state.lastAction = action;
      this.advanceTurn();
      this.checkWinConditions();
    }

    return { success, error, state: this.state };
  }

  private executeDrawAction(player: Player): { success: boolean; error?: string } {
    if (this.state.deck.length === 0) {
      return { success: false, error: "Deck is empty" };
    }

    const cardsToDraw = Math.min(this.state.config.cardsDrawnPerTurn, this.state.deck.length);
    for (let i = 0; i < cardsToDraw; i++) {
      const card = this.state.deck.pop()!;
      player.hand.push(card);
    }

    return { success: true };
  }

  private executePlayAction(player: Player, cardId: string): { success: boolean; error?: string } {
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: "Card not in hand" };
    }

    const card = player.hand.splice(cardIndex, 1)[0];
    this.state.field.push(card);

    return { success: true };
  }

  private executeDiscardAction(player: Player, cardId: string): { success: boolean; error?: string } {
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, error: "Card not in hand" };
    }

    player.hand.splice(cardIndex, 1);
    return { success: true };
  }

  private advanceTurn(): void {
    // Find next active player
    let nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    let attempts = 0;

    while (this.state.players[nextPlayerIndex].hasFolded && attempts < this.state.players.length) {
      nextPlayerIndex = (nextPlayerIndex + 1) % this.state.players.length;
      attempts++;
    }

    this.state.currentPlayerIndex = nextPlayerIndex;

    // If we've cycled back to the original player, increment turn
    if (nextPlayerIndex === 0) {
      this.state.turn++;
    }

    // Check turn limit
    if (this.state.turn > this.state.config.turnLimit) {
      this.endGame();
    }
  }

  private checkWinConditions(): void {
    const { winCondition } = this.state.config;
    const activePlayers = this.state.players.filter(p => !p.hasFolded);

    if (activePlayers.length <= 1) {
      this.endGame(activePlayers[0]?.id);
      return;
    }

    switch (winCondition) {
      case 'empty_hand':
        const emptyHandPlayer = activePlayers.find(p => p.hand.length === 0);
        if (emptyHandPlayer) {
          this.endGame(emptyHandPlayer.id);
        }
        break;

      case 'highest_card':
      case 'closest_sum':
        // These are typically checked at the end of the game
        // For now, we'll check if all players have passed or if deck is empty
        if (this.state.deck.length === 0 || this.allPlayersPassedRecently()) {
          this.endGame(this.determineWinner());
        }
        break;
    }
  }

  private allPlayersPassedRecently(): boolean {
    // This would need to track recent actions to determine if all players passed
    // For now, return false to avoid premature game ending
    return false;
  }

  private determineWinner(): string | undefined {
    const { winCondition } = this.state.config;
    const activePlayers = this.state.players.filter(p => !p.hasFolded);

    switch (winCondition) {
      case 'highest_card':
        return this.getPlayerWithHighestCard(activePlayers)?.id;

      case 'closest_sum':
        return this.getPlayerClosestToTarget(activePlayers)?.id;

      case 'empty_hand':
        return activePlayers.find(p => p.hand.length === 0)?.id;

      default:
        return activePlayers[0]?.id;
    }
  }

  private getPlayerWithHighestCard(players: Player[]): Player | undefined {
    let highestPlayer: Player | undefined;
    let highestValue = -1;

    for (const player of players) {
      const highestCard = Math.max(...player.hand.map(c => c.value));
      if (highestCard > highestValue) {
        highestValue = highestCard;
        highestPlayer = player;
      }
    }

    return highestPlayer;
  }

  private getPlayerClosestToTarget(players: Player[]): Player | undefined {
    const target = this.state.config.blackjackTarget || 21;
    let closestPlayer: Player | undefined;
    let closestDistance = Infinity;

    for (const player of players) {
      const sum = player.hand.reduce((total, card) => total + card.value, 0);
      const distance = sum > target ? Infinity : target - sum;

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlayer = player;
      }
    }

    return closestPlayer;
  }

  private endGame(winnerId?: string): void {
    this.state.phase = 'finished';
    this.state.winner = winnerId;

    if (winnerId) {
      const winner = this.state.players.find(p => p.id === winnerId);
      if (winner) {
        winner.hasWon = true;
      }
    }
  }

  // Get current game state
  getState(): GameState {
    return { ...this.state };
  }

  // Get visible state for a specific player (respects hand/field visibility)
  getVisibleState(playerId: string): Partial<GameState> {
    const visibleState = { ...this.state };

    // Hide other players' hands if hand visibility is private
    if (this.state.config.handVisibility === 'private') {
      visibleState.players = visibleState.players.map(player => ({
        ...player,
        hand: player.id === playerId ? player.hand : player.hand.map(() => ({
          id: 'hidden',
          suit: 'hidden',
          rank: 0,
          isJoker: false,
          value: 0
        }))
      }));
    }

    // Hide field if field visibility is private (rare case)
    if (this.state.config.fieldVisibility === 'private') {
      visibleState.field = [];
    }

    return visibleState;
  }

  // Validate if an action is legal
  validateAction(action: GameAction): { valid: boolean; error?: string } {
    const player = this.state.players.find(p => p.id === action.playerId);

    if (!player) {
      return { valid: false, error: "Player not found" };
    }

    if (this.state.phase !== 'playing') {
      return { valid: false, error: "Game is not in playing phase" };
    }

    if (player.hasFolded) {
      return { valid: false, error: "Player has folded" };
    }

    if (this.state.players[this.state.currentPlayerIndex].id !== action.playerId) {
      return { valid: false, error: "Not your turn" };
    }

    if (!this.state.config.allowedActions.includes(action.type)) {
      return { valid: false, error: `Action ${action.type} not allowed` };
    }

    // Action-specific validation
    switch (action.type) {
      case 'draw':
        if (this.state.deck.length === 0) {
          return { valid: false, error: "Deck is empty" };
        }
        break;

      case 'play':
      case 'discard':
        if (!action.cardId) {
          return { valid: false, error: "Card ID required" };
        }
        if (!player.hand.find(c => c.id === action.cardId)) {
          return { valid: false, error: "Card not in hand" };
        }
        break;
    }

    return { valid: true };
  }

  // Serialize game state for blockchain storage
  serializeForBlockchain(): string {
    const blockchainState = {
      instanceId: this.state.instanceId,
      templateId: this.state.templateId,
      playerIds: this.state.players.map(p => p.id),
      currentPlayerIndex: this.state.currentPlayerIndex,
      turn: this.state.turn,
      phase: this.state.phase,
      winner: this.state.winner,
      deckSize: this.state.deck.length,
      fieldSize: this.state.field.length,
      playerHandSizes: this.state.players.map(p => p.hand.length)
    };

    return JSON.stringify(blockchainState);
  }
}

// Utility functions for card game management
export function createCardGameInstance(
  config: CardGameConfig,
  players: string[],
  instanceId: string,
  templateId: string
): CardGameEngine {
  return new CardGameEngine(config, players, instanceId, templateId);
}

export function calculateHandValue(hand: Card[], jokerRule: string, target?: number): number {
  let value = 0;
  let jokers = hand.filter(c => c.isJoker);
  let regularCards = hand.filter(c => !c.isJoker);

  // Calculate value of regular cards
  value = regularCards.reduce((sum, card) => sum + card.value, 0);

  // Handle jokers based on rule
  for (const joker of jokers) {
    switch (jokerRule) {
      case 'wildcard':
        // For blackjack-style games, jokers could be optimal value
        if (target) {
          const remaining = target - value;
          value += Math.max(1, Math.min(remaining, target));
        } else {
          value += 1; // Default wildcard value
        }
        break;
      case 'lowest':
        value += 1;
        break;
      case 'highest':
        value += regularCards.length > 0 ? Math.max(...regularCards.map(c => c.value)) : 1;
        break;
    }
  }

  return value;
}