import { useState } from 'react';
import { mapData } from '../data/mapData';
import type { GameState } from '../types';

interface RiskMapProps {
  gameState: GameState;
  onTerritoryClick: (territoryId: string) => void;
  selectedTerritory: string | null;
}

const RiskMap: React.FC<RiskMapProps> = ({ gameState, onTerritoryClick, selectedTerritory }) => {
  const [hoveredTerritory, setHoveredTerritory] = useState<string | null>(null);

  return (
    <div className="risk-map-container" style={{ width: '100%', height: 'auto', border: '1px solid #333', minHeight: '300px' }}>
      <svg viewBox="0 0 1000 600" style={{ width: '100%', height: '100%', display: 'block' }}>
        {mapData.map((territory) => {
          const state = gameState.territories[territory.id];
          // Check if owner exists in players (it should)
          const owner = state?.owner ? gameState.players[state.owner] : null;
          const isSelected = selectedTerritory === territory.id;
          const isHovered = hoveredTerritory === territory.id;

          let fill = '#333';
          if (owner) {
            fill = owner.color;
          }

          return (
            <g 
              key={territory.id}
              onClick={() => onTerritoryClick(territory.id)}
              onMouseEnter={() => setHoveredTerritory(territory.id)}
              onMouseLeave={() => setHoveredTerritory(null)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={territory.path}
                fill={fill}
                stroke={isSelected ? 'yellow' : (isHovered ? 'white' : '#555')}
                strokeWidth={isSelected ? 4 : (isHovered ? 2 : 1)}
                opacity={owner ? 0.8 : 0.2}
              />
              
              <circle cx={territory.centerX} cy={territory.centerY} r="15" fill="white" stroke="#333" strokeWidth="1" />
              <text 
                x={territory.centerX} 
                y={territory.centerY} 
                dy=".3em" 
                textAnchor="middle" 
                style={{ fontSize: '14px', fontWeight: 'bold', userSelect: 'none' }}
              >
                {state?.troops || 0}
              </text>
              
              {isHovered && (
                <text
                  x={territory.centerX}
                  y={territory.centerY - 25}
                  textAnchor="middle"
                  fill="white"
                  style={{ fontSize: '14px', pointerEvents: 'none', fontWeight: 'bold', textShadow: '0 0 3px black' }}
                >
                  {territory.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RiskMap;
