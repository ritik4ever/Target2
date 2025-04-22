const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['created', 'active', 'completed', 'abandoned'],
    default: 'created'
  },
  players: [{
    playerId: String,
    walletAddress: String
  }],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  results: [{
    playerId: String,
    walletAddress: String,
    score: Number,
    rewards: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', GameSchema);