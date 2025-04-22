const { verifyGameResult, contractWithSigner } = require('../blockchain/contractInteraction');
const Player = require('../models/Player');
const Game = require('../models/Game');
const { v4: uuidv4 } = require('uuid');

// Active game sessions
const activeGames = new Map();

/**
 * Create a new game session
 * @returns {Object} Game session data
 */
const createGame = async () => {
  try {
    const gameId = uuidv4();
    const newGame = {
      id: gameId,
      players: [],
      started: false,
      completed: false,
      startTime: null,
      endTime: null
    };
    
    activeGames.set(gameId, newGame);
    
    // Save to database
    await new Game({
      gameId,
      status: 'created',
      players: []
    }).save();
    
    return newGame;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

/**
 * Add player to game
 * @param {string} gameId Game session ID
 * @param {string} playerId Player ID
 * @param {string} walletAddress Player's wallet address
 * @returns {Object} Updated game data
 */
const joinGame = async (gameId, playerId, walletAddress) => {
  try {
    const game = activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.started) {
      throw new Error('Game already started');
    }
    
    // Check if player already exists
    const playerExists = game.players.some(p => p.id === playerId);
    if (!playerExists) {
      game.players.push({
        id: playerId,
        walletAddress,
        score: 0,
        ready: false
      });
    }
    
    // Update in database
    await Game.findOneAndUpdate(
      { gameId },
      { $addToSet: { players: { playerId, walletAddress } } }
    );
    
    return game;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

/**
 * Start a game session
 * @param {string} gameId Game session ID
 * @returns {Object} Updated game data
 */
const startGame = async (gameId) => {
  try {
    const game = activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.players.length < 1) {
      throw new Error('Not enough players to start the game');
    }
    
    game.started = true;
    game.startTime = Date.now();
    
    // Update in database
    await Game.findOneAndUpdate(
      { gameId },
      { status: 'active', startTime: new Date() }
    );
    
    return game;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

/**
 * Update player score
 * @param {string} gameId Game session ID
 * @param {string} playerId Player ID
 * @param {number} score Player's score
 * @returns {Object} Updated game data
 */
const updateScore = async (gameId, playerId, score) => {
  try {
    const game = activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found in this game');
    }
    
    player.score = score;
    
    return game;
  } catch (error) {
    console.error('Error updating score:', error);
    throw error;
  }
};

/**
 * End a game session and process results
 * @param {string} gameId Game session ID
 * @returns {Object} Final game results
 */
const endGame = async (gameId) => {
  try {
    const game = activeGames.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    game.completed = true;
    game.endTime = Date.now();
    
    // Process results and rewards
    const results = [];
    for (const player of game.players) {
      try {
        // Verify results on blockchain
        const verificationResult = await verifyGameResult(
          player.walletAddress,
          gameId,
          player.score
        );
        
        // Update player stats in database
        await Player.findOneAndUpdate(
          { walletAddress: player.walletAddress },
          { 
            $inc: { 
              gamesPlayed: 1,
              totalScore: player.score,
              totalRewards: parseFloat(verificationResult.rewards)
            }
          },
          { upsert: true }
        );
        
        results.push({
          playerId: player.id,
          walletAddress: player.walletAddress,
          score: player.score,
          rewards: verificationResult.rewards
        });
      } catch (err) {
        console.error(`Error processing results for player ${player.id}:`, err);
        results.push({
          playerId: player.id,
          walletAddress: player.walletAddress,
          score: player.score,
          error: 'Failed to verify results'
        });
      }
    }
    
    // Update game in database
    await Game.findOneAndUpdate(
      { gameId },
      { 
        status: 'completed',
        endTime: new Date(),
        results
      }
    );
    
    // Remove from active games
    activeGames.delete(gameId);
    
    return {
      gameId,
      completed: true,
      duration: game.endTime - game.startTime,
      results
    };
  } catch (error) {
    console.error('Error ending game:', error);
    throw error;
  }
};

/**
 * Initialize socket.io event handlers for game communication
 * @param {Object} io Socket.io server instance
 */
const initializeSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Create a new game
    socket.on('createGame', async (data, callback) => {
      try {
        const game = await createGame();
        socket.join(`game-${game.id}`);
        callback({ success: true, game });
      } catch (error) {
        console.error('Error in createGame event:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    // Join existing game
    socket.on('joinGame', async (data, callback) => {
      try {
        const { gameId, walletAddress } = data;
        const game = await joinGame(gameId, socket.id, walletAddress);
        
        socket.join(`game-${gameId}`);
        io.to(`game-${gameId}`).emit('playerJoined', {
          playerId: socket.id,
          walletAddress,
          playerCount: game.players.length
        });
        
        callback({ success: true, game });
      } catch (error) {
        console.error('Error in joinGame event:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    // Player ready to start
    socket.on('playerReady', async (data, callback) => {
      try {
        const { gameId } = data;
        const game = activeGames.get(gameId);
        
        if (!game) {
          throw new Error('Game not found');
        }
        
        const player = game.players.find(p => p.id === socket.id);
        if (!player) {
          throw new Error('Player not found in this game');
        }
        
        player.ready = true;
        
        // Check if all players are ready
        const allReady = game.players.every(p => p.ready);
        
        if (allReady) {
          const updatedGame = await startGame(gameId);
          io.to(`game-${gameId}`).emit('gameStarted', updatedGame);
        } else {
          io.to(`game-${gameId}`).emit('playerReady', {
            playerId: socket.id,
            readyCount: game.players.filter(p => p.ready).length,
            totalPlayers: game.players.length
          });
        }
        
        callback({ success: true });
      } catch (error) {
        console.error('Error in playerReady event:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    // Update player score
    socket.on('updateScore', async (data, callback) => {
      try {
        const { gameId, score } = data;
        await updateScore(gameId, socket.id, score);
        
        io.to(`game-${gameId}`).emit('scoreUpdated', {
          playerId: socket.id,
          score
        });
        
        callback({ success: true });
      } catch (error) {
        console.error('Error in updateScore event:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    // End game
    socket.on('endGame', async (data, callback) => {
      try {
        const { gameId } = data;
        const results = await endGame(gameId);
        
        io.to(`game-${gameId}`).emit('gameEnded', results);
        
        // Have all sockets leave the game room
        const sockets = await io.in(`game-${gameId}`).fetchSockets();
        for (const s of sockets) {
          s.leave(`game-${gameId}`);
        }
        
        callback({ success: true, results });
      } catch (error) {
        console.error('Error in endGame event:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    // Get active game info
    socket.on('getGame', (data, callback) => {
      try {
        const { gameId } = data;
        const game = activeGames.get(gameId);
        
        if (!game) {
          throw new Error('Game not found');
        }
        
        callback({ success: true, game });
      } catch (error) {
        console.error('Error in getGame event:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', async () => {
      console.log('Player disconnected:', socket.id);
      
      // Find any games the player was in
      for (const [gameId, game] of activeGames.entries()) {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          // Remove player from game
          game.players.splice(playerIndex, 1);
          
          // If game is empty, clean it up
          if (game.players.length === 0 && !game.completed) {
            activeGames.delete(gameId);
            await Game.findOneAndUpdate(
              { gameId },
              { status: 'abandoned' }
            );
          } else if (!game.completed) {
            // Notify remaining players
            io.to(`game-${gameId}`).emit('playerLeft', {
              playerId: socket.id,
              remainingPlayers: game.players.length
            });
          }
        }
      }
    });
  });
};

module.exports = {
  createGame,
  joinGame,
  startGame,
  updateScore,
  endGame,
  initializeSocketEvents
};