const express = require('express');
const router = express.Router();
const ethers = require('ethers');
// Use the centralized contract loader
const { MonadArenaCore } = require('../utils/contractLoader');

// Contract address
const CORE_CONTRACT_ADDRESS = '0xD99C84178DFda5AB45C9970Fe5c7936cd96BD880';

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(process.env.MONAD_RPC_URL);

// Initialize contract
const coreContract = new ethers.Contract(
  CORE_CONTRACT_ADDRESS,
  MonadArenaCore.abi,
  provider
);

// Get player stats
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    // Get player stats from contract
    const stats = await coreContract.getPlayerStats(address);
    
    res.json({
      address,
      gamesPlayed: stats.gamesPlayed.toNumber(),
      wins: stats.wins.toNumber(),
      kills: stats.kills.toNumber(),
      deaths: stats.deaths.toNumber(),
      totalScore: stats.totalScore.toNumber()
    });
  } catch (error) {
    console.error('Error getting player stats:', error);
    res.status(500).json({ error: 'Failed to get player stats' });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Get leaderboard from contract
    let leaderboard;
    
    switch (type) {
      case 'score':
        leaderboard = await coreContract.getScoreLeaderboard();
        break;
      case 'kills':
        leaderboard = await coreContract.getKillsLeaderboard();
        break;
      case 'wins':
        leaderboard = await coreContract.getWinsLeaderboard();
        break;
      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }
    
    // Format leaderboard data
    const formattedLeaderboard = leaderboard.map(entry => ({
      address: entry.player,
      value: entry.value.toNumber()
    }));
    
    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;