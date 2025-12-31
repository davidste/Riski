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

  // Draw connections between neighbors
  const connections: JSX.Element[] = [];
  const processedPairs = new Set<string>();

  mapData.forEach(t1 => {
      t1.neighbors.forEach(nId => {
          const t2 = mapData.find(t => t.id === nId);
          if (t2) {
              const pairId = [t1.id, t2.id].sort().join('-');
              if (!processedPairs.has(pairId)) {
                  processedPairs.add(pairId);
                  connections.push(
                      <line 
                        key={pairId}
                        x1={t1.centerX} y1={t1.centerY}
                        x2={t2.centerX} y2={t2.centerY}
                        stroke="#334155" 
                        strokeWidth="2" 
                        strokeDasharray="5,5"
                        opacity="0.5"
                      />
                  );
              }
          }
      });
  });

  return (
    <div className="risk-map-container" style={{ width: '100%', height: 'auto', minHeight: '300px' }}>
      <svg viewBox="0 0 1000 600" style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.3))' }}>
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Connections Layer */}
        {connections}

        {/* Territories Layer */}
        {mapData.map((territory) => {
          const state = gameState.territories[territory.id];
          const owner = state?.owner ? gameState.players[state.owner] : null;
          const isSelected = selectedTerritory === territory.id;
          const isHovered = hoveredTerritory === territory.id;

          let fill = '#1e293b'; // Default dark slate
          let stroke = '#475569';
          let strokeWidth = 2;
          
          if (owner) {
            fill = owner.color;
          } else {
             // Subtle hint of continent color
             // fill = continents[territory.continent].color + '20'; // 20 hex opacity
          }

          if (isSelected) {
              stroke = '#fbbf24'; // Amber
              strokeWidth = 4;
          } else if (isHovered) {
              stroke = '#e2e8f0'; // Light slate
              strokeWidth = 3;
          }

          return (
            <g 
              key={territory.id}
              onClick={() => onTerritoryClick(territory.id)}
              onMouseEnter={() => setHoveredTerritory(territory.id)}
              onMouseLeave={() => setHoveredTerritory(null)}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <path
                d={territory.path}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fillOpacity={owner ? 0.6 : 0.3}
                filter={isSelected || isHovered || owner ? "url(#glow)" : ""}
                style={{ transition: 'all 0.2s ease' }}
              />
              
              {/* Troop Count Badge */}
              <circle 
                cx={territory.centerX} 
                cy={territory.centerY} 
                r="18" 
                fill="#0f172a" 
                stroke={stroke} 
                strokeWidth="2" 
              />
              <text 
                x={territory.centerX} 
                y={territory.centerY} 
                dy=".35em" 
                textAnchor="middle" 
                fill="#f8fafc"
                style={{ fontSize: '16px', fontWeight: '800', userSelect: 'none', fontFamily: 'monospace' }}
              >
                {state?.troops || 0}
              </text>
              
              {/* Territory Name Tooltip */}
              {isHovered && (
                <g>
                    <rect 
                        x={territory.centerX - 60} 
                        y={territory.centerY - 50} 
                        width="120" 
                        height="30" 
                        rx="4"
                        fill="#0f172a"
                        stroke="#475569"
                        opacity="0.9"
                    />
                    <text
                    x={territory.centerX}
                    y={territory.centerY - 30}
                    textAnchor="middle"
                    fill="#94a3b8"
                    style={{ fontSize: '12px', pointerEvents: 'none', fontWeight: '600' }}
                    >
                    {territory.name}
                    </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RiskMap;
