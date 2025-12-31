export type CardType = 'INFANTRY' | 'CAVALRY' | 'ARTILLERY' | 'WILD';

export interface Card {
  id: string;
  type: CardType;
  territoryId?: string; // Optional territory bonus
}

export interface TerritoryState {
  owner: string | null;
  troops: number;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  cards: Card[];
  isAlive: boolean;
  isAi: boolean;
}

export type GamePhase = 'SETUP' | 'REINFORCE' | 'ATTACK' | 'FORTIFY';

export interface GameState {
  territories: Record<string, TerritoryState>;
  players: Record<string, PlayerState>;
  playerOrder: string[];
  currentPlayerIndex: number;
  currentPhase: GamePhase;
  unplacedTroops: number;
  conqueredThisTurn: boolean; // Track for card awarding
}

// Simple map adjacency graph (id -> neighbors)
export const ADJACENCY: Record<string, string[]> = {
  "t1": ["t2", "t3"],
  "t2": ["t1", "t3"],
  "t3": ["t1", "t2", "t4", "t3b"],
  "t3b": ["t3", "t4", "t2", "t6"],
  "t4": ["t3", "t5", "t6", "t3b"],
  "t5": ["t4", "t6"],
  "t6": ["t4", "t5", "t3b"]
};

export class RiskGame {
  state: GameState;
  private deck: Card[] = [];

  constructor(playerIds: string[]) {
    this.state = this.initializeGame(playerIds);
    this.initializeDeck();
  }

  private initializeDeck() {
    const types: CardType[] = ['INFANTRY', 'CAVALRY', 'ARTILLERY'];
    Object.keys(ADJACENCY).forEach((tid, i) => {
      this.deck.push({
        id: `card_${i}`,
        type: types[i % 3],
        territoryId: tid
      });
    });
    // Add Wild cards
    this.deck.push({ id: 'wild_1', type: 'WILD' });
    this.deck.push({ id: 'wild_2', type: 'WILD' });
    this.shuffleDeck();
  }

  private shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private initializeGame(playerIds: string[]): GameState {
    const players: Record<string, PlayerState> = {};
    const colors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44'];
    
    playerIds.forEach((id, index) => {
      players[id] = {
        id,
        name: id.startsWith('AI_') ? `AI Bot ${index}` : `Player ${index + 1}`,
        color: colors[index % colors.length],
        cards: [],
        isAlive: true,
        isAi: id.startsWith('AI_')
      };
    });

    const territories: Record<string, TerritoryState> = {};
    const territoryIds = Object.keys(ADJACENCY);
    
    territoryIds.forEach((tid, i) => {
      territories[tid] = {
        owner: playerIds[i % playerIds.length],
        troops: 3
      };
    });

    return {
      territories,
      players,
      playerOrder: playerIds,
      currentPlayerIndex: 0,
      currentPhase: 'REINFORCE',
      unplacedTroops: 3,
      conqueredThisTurn: false
    };
  }

  getCurrentPlayerId(): string {
    return this.state.playerOrder[this.state.currentPlayerIndex];
  }

  reinforce(playerId: string, territoryId: string, amount: number): boolean {
    if (playerId !== this.getCurrentPlayerId()) return false;
    if (this.state.currentPhase !== 'REINFORCE') return false;
    if (this.state.unplacedTroops < amount) return false;
    
    const territory = this.state.territories[territoryId];
    if (territory.owner !== playerId) return false;

    territory.troops += amount;
    this.state.unplacedTroops -= amount;

    // Auto advance if out of troops? No, user might want to trade cards first or wait
    if (this.state.unplacedTroops === 0) {
      // Client usually triggers end phase, but we can auto-switch to ATTACK if we want
      // For now, let's keep it manual or implicit in UI
      this.state.currentPhase = 'ATTACK';
    }
    return true;
  }

  tradeCards(playerId: string, cardIds: string[]): boolean {
    if (playerId !== this.getCurrentPlayerId()) return false;
    if (this.state.currentPhase !== 'REINFORCE') return false;
    
    const player = this.state.players[playerId];
    const cardsToTrade = player.cards.filter(c => cardIds.includes(c.id));
    
    if (cardsToTrade.length !== 3) return false;

    // Validate set
    const types = cardsToTrade.map(c => c.type);
    const isThreeSame = types[0] === types[1] && types[1] === types[2];
    const isThreeUnique = types.includes('INFANTRY') && types.includes('CAVALRY') && types.includes('ARTILLERY');
    const hasWild = types.includes('WILD');
    
    // Simplistic wild logic: if wild present, assume valid triad for now (or strictly check)
    // Real rules: Wild matches any. So 2 SAME + Wild = 3 SAME. 
    // For simplicity: any 3 cards with a WILD are valid, or standard sets.
    
    let isValid = isThreeSame || isThreeUnique || hasWild;

    if (!isValid) return false;

    // Remove cards from player
    player.cards = player.cards.filter(c => !cardIds.includes(c.id));
    
    // Return to deck
    this.deck.push(...cardsToTrade);
    this.shuffleDeck();

    // Give troops (Fixed bonus for simplicity)
    const bonus = 5; 
    this.state.unplacedTroops += bonus;
    
    // Territory bonus (if you own the territory on the card)
    cardsToTrade.forEach(c => {
      if (c.territoryId && this.state.territories[c.territoryId]?.owner === playerId) {
        this.state.territories[c.territoryId].troops += 2; // Immediate +2 on territory
      }
    });

    return true;
  }

  attack(playerId: string, fromId: string, toId: string): { success: boolean, diceResults?: { attacker: number[], defender: number[] }, conquered?: boolean } {
    if (playerId !== this.getCurrentPlayerId()) return { success: false };
    if (this.state.currentPhase !== 'ATTACK') return { success: false };

    const fromT = this.state.territories[fromId];
    const toT = this.state.territories[toId];

    if (fromT.owner !== playerId) return { success: false };
    if (toT.owner === playerId) return { success: false };
    if (fromT.troops < 2) return { success: false };
    if (!ADJACENCY[fromId].includes(toId)) return { success: false };

    const attackerDice = [Math.ceil(Math.random() * 6)];
    const defenderDice = [Math.ceil(Math.random() * 6)];

    let conquered = false;

    if (attackerDice[0] > defenderDice[0]) {
      toT.troops -= 1;
      if (toT.troops <= 0) {
        toT.owner = playerId;
        toT.troops = 1;
        fromT.troops -= 1;
        conquered = true;
        this.state.conqueredThisTurn = true;
      }
    } else {
      fromT.troops -= 1;
    }

    return { success: true, diceResults: { attacker: attackerDice, defender: defenderDice }, conquered };
  }

  endAttackPhase(playerId: string): boolean {
    if (playerId !== this.getCurrentPlayerId()) return false;
    if (this.state.currentPhase !== 'ATTACK') return false;
    
    this.state.currentPhase = 'FORTIFY';
    return true;
  }

  fortify(playerId: string, fromId: string, toId: string, amount: number): boolean {
    if (playerId !== this.getCurrentPlayerId()) return false;
    if (this.state.currentPhase !== 'FORTIFY') return false;
    
    const fromT = this.state.territories[fromId];
    const toT = this.state.territories[toId];

    if (fromT.owner !== playerId || toT.owner !== playerId) return false;
    if (fromT.troops <= amount) return false;
    if (!ADJACENCY[fromId].includes(toId)) return false; 

    fromT.troops -= amount;
    toT.troops += amount;

    this.endTurn();
    return true;
  }

  skipFortify(playerId: string): boolean {
    if (playerId !== this.getCurrentPlayerId()) return false;
    if (this.state.currentPhase !== 'FORTIFY') return false;
    this.endTurn();
    return true;
  }

  private endTurn() {
    // Award card if conquered
    if (this.state.conqueredThisTurn) {
        const playerId = this.getCurrentPlayerId();
        if (this.deck.length > 0) {
            const card = this.deck.shift();
            if (card) {
                this.state.players[playerId].cards.push(card);
            }
        }
    }

    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.playerOrder.length;
    this.state.currentPhase = 'REINFORCE';
    this.state.conqueredThisTurn = false;
    this.calculateReinforcements();
  }

  private calculateReinforcements() {
    const playerId = this.getCurrentPlayerId();
    let territoryCount = 0;
    Object.values(this.state.territories).forEach(t => {
      if (t.owner === playerId) territoryCount++;
    });
    
    this.state.unplacedTroops = Math.max(3, Math.floor(territoryCount / 3));
  }
}
