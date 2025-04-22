const { ethers } = require('ethers');
require('dotenv').config(); // Load environment variables

// Import from centralized contract loader
const { MonadArenaCore } = require('../utils/contractLoader');

// Contract address
const CORE_CONTRACT_ADDRESS = '0xD99C84178DFda5AB45C9970Fe5c7936cd96BD880';

// Initialize provider
if (!process.env.MONAD_RPC_URL) {
  console.error('MONAD_RPC_URL is not set in the environment variables.');
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(process.env.MONAD_RPC_URL);

// Initialize read-only contract
const coreContract = new ethers.Contract(
  CORE_CONTRACT_ADDRESS,
  MonadArenaCore.abi,
  provider
);

// Initialize wallet and signer-enabled contract for write ops
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
const contractWithSigner = coreContract.connect(wallet);

/**
 * Verify game result on the blockchain
 * @param {string} account Player's wallet address
 * @param {string} gameId Game session ID
 * @param {number} score Player's score
 * @returns {Promise<object>} Verification result
 */
const verifyGameResult = async (account, gameId, score) => {
  try {
    // Check if game session exists
    const gameExists = await coreContract.gameExists(gameId);
    if (!gameExists) {
      throw new Error('Game session not found');
    }

    // Check if player participated in the game
    const playerParticipated = await coreContract.playerParticipated(gameId, account);
    if (!playerParticipated) {
      throw new Error('Player did not participate in this game');
    }

    // Calculate rewards based on score
    const rewards = await coreContract.calculateRewards(score);

    return {
      verified: true,
      rewards: ethers.utils.formatEther(rewards),
      gameId,
      score
    };
  } catch (error) {
    console.error('Game verification error:', error);
    throw error;
  }
};

module.exports = {
  verifyGameResult,
  contractWithSigner // export in case other routes need it
};