export interface TerritoryState {
  owner: string | null;
  troops: number;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  cards: any[]; // To be implemented
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
  unplacedTroops: number; // For reinforce phase
}

// Simple map adjacency graph (id -> neighbors)
// In a real app this would be loaded from shared config
export const ADJACENCY: Record<string, string[]> = {
  "t1": ["t2", "t3"],
  "t2": ["t1", "t3"],
  "t3": ["t1", "t2", "t4"],
  "t4": ["t3", "t5", "t6"],
  "t5": ["t4", "t6"],
  "t6": ["t4", "t5"]
};

export class RiskGame {
  state: GameState;

  constructor(playerIds: string[]) {
    this.state = this.initializeGame(playerIds);
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

    // Initialize territories (random assignment for simplicity or empty)
    const territories: Record<string, TerritoryState> = {};
    const territoryIds = Object.keys(ADJACENCY);
    
    // Random distribution for setup
    territoryIds.forEach((tid, i) => {
      territories[tid] = {
        owner: playerIds[i % playerIds.length],
        troops: 3 // Initial troops
      };
    });

    return {
      territories,
      players,
      playerOrder: playerIds,
      currentPlayerIndex: 0,
      currentPhase: 'REINFORCE', // Skip setup for now for speed
      unplacedTroops: 3 // Fixed start reinforcement
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

    if (this.state.unplacedTroops === 0) {
      this.state.currentPhase = 'ATTACK';
    }
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

    // Simple Dice Logic (Blitz: 1 vs 1 roll)
    // Real Risk has up to 3 atk dice vs 2 def dice
    const attackerDice = [Math.ceil(Math.random() * 6)];
    const defenderDice = [Math.ceil(Math.random() * 6)];

    let conquered = false;

    if (attackerDice[0] > defenderDice[0]) {
      toT.troops -= 1;
      if (toT.troops <= 0) {
        // Conquered
        toT.owner = playerId;
        toT.troops = 1; // Move 1 troop in
        fromT.troops -= 1;
        conquered = true;
      }
    } else {
      fromT.troops -= 1;
    }

    // Check if player died (later)

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
    if (fromT.troops <= amount) return false; // Must leave 1 behind
    // Path checking (BFS) needed here, using simple adjacency for now
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
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.playerOrder.length;
    this.state.currentPhase = 'REINFORCE';
    this.calculateReinforcements();
  }

  private calculateReinforcements() {
    const playerId = this.getCurrentPlayerId();
    let territoryCount = 0;
    Object.values(this.state.territories).forEach(t => {
      if (t.owner === playerId) territoryCount++;
    });
    
    this.state.unplacedTroops = Math.max(3, Math.floor(territoryCount / 3));
    // Add continent bonuses here
  }
}
