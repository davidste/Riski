export interface TerritoryState {
  owner: string | null;
  troops: number;
}

export interface Card {
  id: string;
  type: 'INFANTRY' | 'CAVALRY' | 'ARTILLERY' | 'WILD';
  territoryId?: string;
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
  conqueredThisTurn: boolean;
}
