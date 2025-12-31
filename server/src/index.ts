import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RiskGame } from './game/RiskGame';
import { AIController } from './game/AIController';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Global Game State (Single Room)
let game: RiskGame | null = null;
let aiControllers: AIController[] = [];
const players: { [socketId: string]: string } = {}; // socketId -> playerId
const lobby: string[] = []; // socketIds or AI_ids waiting

function checkAiTurn() {
    if (!game) return;
    const currentPlayerId = game.getCurrentPlayerId();
    if (currentPlayerId.startsWith('AI_')) {
        const ai = aiControllers.find(c => c.playerId === currentPlayerId);
        if (ai) {
            console.log(`AI Turn: ${currentPlayerId}`);
            setTimeout(() => {
                ai.takeTurn();
                io.emit('game_update', game!.state);
                checkAiTurn();
            }, 1000);
        }
    }
}

app.get('/', (req, res) => {
  res.send('Risk Game Server is running');
});

io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_game', (playerName: string) => {
    if (game) {
       socket.emit('error', 'Game already in progress');
       return;
    }
    if (!lobby.includes(socket.id)) {
        lobby.push(socket.id);
        players[socket.id] = socket.id;
    }
    io.emit('lobby_update', lobby);
  });

  socket.on('add_ai', () => {
    if (game) return;
    const aiId = `AI_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    lobby.push(aiId);
    io.emit('lobby_update', lobby);
  });

  socket.on('start_game', () => {
    if (lobby.length < 1) return;
    
    // Create game
    game = new RiskGame(lobby);
    
    // Initialize AI controllers
    aiControllers = lobby
        .filter(id => id.startsWith('AI_'))
        .map(id => new AIController(game!, id));

    io.emit('game_start', game.state);
    
    // Check if first player is AI
    checkAiTurn();
  });

  socket.on('action_reinforce', ({ territoryId, amount }) => {
    if (!game) return;
    const playerId = players[socket.id];
    if (game.reinforce(playerId, territoryId, amount)) {
        io.emit('game_update', game.state);
        checkAiTurn(); // Check if phase changed to something AI needs to handle (unlikely here but safe)
    }
  });

  socket.on('action_attack', ({ fromId, toId }) => {
    if (!game) return;
    const playerId = players[socket.id];
    const result = game.attack(playerId, fromId, toId);
    if (result.success) {
        io.emit('game_update', game.state);
        io.emit('attack_result', result);
        // Turn doesn't end on attack, so no checkAiTurn needed usually, but purely player driven
    }
  });

  socket.on('action_end_phase', () => {
    if (!game) return;
    const playerId = players[socket.id];
    let changed = false;
    
    if (game.state.currentPhase === 'ATTACK') {
        if (game.endAttackPhase(playerId)) changed = true;
    } else if (game.state.currentPhase === 'FORTIFY') {
        if (game.skipFortify(playerId)) changed = true;
    }
    
    if (changed) {
        io.emit('game_update', game.state);
        checkAiTurn();
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const index = lobby.indexOf(socket.id);
    if (index > -1) {
        lobby.splice(index, 1);
        io.emit('lobby_update', lobby);
    }
    delete players[socket.id];
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
