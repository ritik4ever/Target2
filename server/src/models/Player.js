const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    default: null
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  totalRewards: {
    type: Number,
    default: 0
  },
  nfts: [{
    tokenId: Number,
    metadata: Object
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', PlayerSchema);