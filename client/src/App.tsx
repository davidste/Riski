import React, { useState, useEffect } from 'react';
import './App.css';
import RiskMap from './components/RiskMap';
import io from 'socket.io-client';
import { GameState } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? '/' : 'http://localhost:3001');
const socket = io(SERVER_URL);

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobby, setLobby] = useState<string[]>([]);
  const [inLobby, setInLobby] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [sourceTerritory, setSourceTerritory] = useState<string | null>(null); // For attack/fortify
  const [myId, setMyId] = useState<string>('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected', socket.id);
      setMyId(socket.id || '');
    });

    socket.on('lobby_update', (data: string[]) => {
      setLobby(data);
    });

    socket.on('game_start', (state: GameState) => {
      setGameState(state);
      setInLobby(false);
    });

    socket.on('game_update', (state: GameState) => {
      setGameState(state);
    });

    return () => {
      socket.off('connect');
      socket.off('lobby_update');
      socket.off('game_start');
      socket.off('game_update');
    };
  }, []);

  const joinGame = () => {
    socket.emit('join_game', 'Player');
  };

  const startGame = () => {
    socket.emit('start_game');
  };

  const handleTerritoryClick = (id: string) => {
    if (!gameState) return;
    
    const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === myId;
    if (!isMyTurn) {
        setSelectedTerritory(id);
        return;
    }

    if (gameState.currentPhase === 'REINFORCE') {
        setSelectedTerritory(id);
        // Maybe auto-reinforce on click? or button?
    } else if (gameState.currentPhase === 'ATTACK') {
        if (sourceTerritory) {
            if (sourceTerritory === id) {
                setSourceTerritory(null);
                setSelectedTerritory(null);
            } else {
                // Execute Attack
                socket.emit('action_attack', { fromId: sourceTerritory, toId: id });
                setSourceTerritory(null);
                setSelectedTerritory(null);
            }
        } else {
            // Select Source
            if (gameState.territories[id].owner === myId) {
                setSourceTerritory(id);
                setSelectedTerritory(id);
            }
        }
    } else if (gameState.currentPhase === 'FORTIFY') {
         // Similar logic
    }
  };

  const handleReinforce = () => {
    if (selectedTerritory && gameState) {
        socket.emit('action_reinforce', { territoryId: selectedTerritory, amount: 1 });
    }
  };

  const handleTrade = () => {
    // Simple auto-trade for now (finds first valid set)
    if (!gameState) return;
    const myCards = gameState.players[myId].cards;
    
    // Naive checker:
    // 1. Check for 3 same
    // 2. Check for 3 different
    // This is complex for UI, sending all card Ids for server to validate is easier
    const cardIds = myCards.map(c => c.id).slice(0, 3); // Just try first 3 for demo
    socket.emit('action_trade', cardIds);
  };

  const handleEndPhase = () => {
    socket.emit('action_end_phase');
    setSourceTerritory(null);
    setSelectedTerritory(null);
  };

  const addAI = () => {
    socket.emit('add_ai');
  };

  if (inLobby) {
    return (
      <div className="App">
        <h1>Risk Lobby</h1>
        <p>My ID: {myId}</p>
        <button onClick={joinGame}>Join Game</button>
        <button onClick={addAI}>Add AI Bot</button>
        <ul>
          {lobby.map(p => <li key={p}>{p}</li>)}
        </ul>
        {lobby.length > 0 && <button onClick={startGame}>Start Game</button>}
      </div>
    );
  }

  if (!gameState) return <div>Loading...</div>;

  const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayerId === myId;

  return (
    <div className="App">
      <header className="game-header">
        <h1>Risk Web</h1>
        <div className="game-info">
          <span>Current: <strong style={{ color: gameState.players[currentPlayerId].color }}>{gameState.players[currentPlayerId].name}</strong></span>
          <span>Phase: {gameState.currentPhase}</span>
          {isMyTurn && gameState.currentPhase === 'REINFORCE' && (
              <span>Troops to place: {gameState.unplacedTroops}</span>
          )}
          {myPlayer && (
              <span style={{marginLeft: 10, fontSize: '0.8em'}}>Cards: {myPlayer.cards.length}</span>
          )}
        </div>
      </header>
      
      <main className="game-board">
        <RiskMap 
          gameState={gameState} 
          onTerritoryClick={handleTerritoryClick} 
          selectedTerritory={selectedTerritory} 
        />
        {sourceTerritory && <div style={{position: 'absolute', top: 100, left: 10, background: 'white', color: 'black', padding: 5}}>Attacking from: {sourceTerritory}</div>}
      </main>

      <footer className="game-controls">
        <div className="selected-info">
          {selectedTerritory ? (
            <>
              <h3>Selected: {selectedTerritory}</h3>
              <p>Troops: {gameState.territories[selectedTerritory]?.troops}</p>
              <p>Owner: {gameState.territories[selectedTerritory]?.owner ? gameState.players[gameState.territories[selectedTerritory]?.owner!].name : 'Neutral'}</p>
              
              <div className="actions">
                 {isMyTurn && gameState.currentPhase === 'REINFORCE' && (
                     <>
                        <button onClick={handleReinforce}>Reinforce (+1)</button>
                        {myPlayer && myPlayer.cards.length >= 3 && (
                            <button onClick={handleTrade} style={{marginLeft: 5, background: '#88f'}}>Trade Cards (First 3)</button>
                        )}
                     </>
                 )}
                 {isMyTurn && gameState.currentPhase === 'ATTACK' && sourceTerritory && (
                     <p>Click target to attack!</p>
                 )}
              </div>
            </>
          ) : (
            <p>Select a territory</p>
          )}
        </div>
        {isMyTurn && (
            <button className="end-phase-btn" onClick={handleEndPhase}>
                {gameState.currentPhase === 'REINFORCE' ? 'Finish Reinforcing' : 'End Phase'}
            </button>
        )}
      </footer>
    </div>
  );
}

export default App;
