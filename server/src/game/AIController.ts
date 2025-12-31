import { RiskGame, ADJACENCY } from './RiskGame';

export class AIController {
  constructor(private game: RiskGame, public playerId: string) {}

  takeTurn() {
    console.log(`AI ${this.playerId} taking turn...`);
    
    // 1. Reinforce
    if (this.game.state.currentPhase === 'REINFORCE') {
        // Find my territories
        const myTerritories = Object.entries(this.game.state.territories)
          .filter(([id, t]) => t.owner === this.playerId);
        
        if (myTerritories.length > 0) {
            // Strategy: reinforce border territories
            // For now: Random owned territory
            const target = myTerritories[Math.floor(Math.random() * myTerritories.length)][0];
            console.log(`AI reinforcing ${target}`);
            this.game.reinforce(this.playerId, target, this.game.state.unplacedTroops);
        }
    }

    // 2. Attack
    if (this.game.state.currentPhase === 'ATTACK') {
       let attempts = 0;
       while (attempts < 10) {
           attempts++;
           const myTerritories = Object.entries(this.game.state.territories)
             .filter(([id, t]) => t.owner === this.playerId && t.troops > 1);
            
           if (myTerritories.length === 0) break;

           const [myId, myT] = myTerritories[Math.floor(Math.random() * myTerritories.length)];
           const neighbors = ADJACENCY[myId];
           const targets = neighbors.filter(nid => this.game.state.territories[nid].owner !== this.playerId);
           
           if (targets.length > 0) {
               const targetId = targets[Math.floor(Math.random() * targets.length)];
               console.log(`AI attacking ${targetId} from ${myId}`);
               const res = this.game.attack(this.playerId, myId, targetId);
               // If successful or not, loop again to potentially attack more
           }
       }
       this.game.endAttackPhase(this.playerId);
    }

    // 3. Fortify
    if (this.game.state.currentPhase === 'FORTIFY') {
        // Simple skip for now
        this.game.skipFortify(this.playerId);
    }
  }
}
