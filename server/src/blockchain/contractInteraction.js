const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

// Use the project root approach to locate the artifact file
const projectRoot = path.resolve(__dirname, '../../../'); // Go up to the monad-arena folder
const coreContractPath = path.join(projectRoot, 'artifacts/contracts/MonadArenaCore.sol/MonadArenaCore.json');
const nftContractPath = path.join(projectRoot, 'artifacts/contracts/MonadArenaNFT.sol/MonadArenaNFT.json');

// Check if the files exist before requiring them
if (!fs.existsSync(coreContractPath)) {
  console.error(`Contract artifact not found at: ${coreContractPath}`);
  process.exit(1);
} else {
  console.log(`Found contract artifact at: ${coreContractPath}`);
}

if (!fs.existsSync(nftContractPath)) {
  console.error(`Contract artifact not found at: ${nftContractPath}`);
  process.exit(1);
} else {
  console.log(`Found contract artifact at: ${nftContractPath}`);
}

// Import ABI from artifacts
const MonadArenaCore = require(coreContractPath);
const MonadArenaNFT = require(nftContractPath);

// Contract addresses
const CORE_CONTRACT_ADDRESS = process.env.CORE_CONTRACT_ADDRESS || '0xD99C84178DFda5AB45C9970Fe5c7936cd96BD880';
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x123...'; // Replace with your actual NFT contract address

// Initialize provider
if (!process.env.MONAD_RPC_URL) {
  console.error('MONAD_RPC_URL is not set in the environment variables.');
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(process.env.MONAD_RPC_URL);

// Initialize read-only contracts
const coreContract = new ethers.Contract(
  CORE_CONTRACT_ADDRESS,
  MonadArenaCore.abi,
  provider
);

const nftContract = new ethers.Contract(
  NFT_CONTRACT_ADDRESS,
  MonadArenaNFT.abi,
  provider
);

// Initialize wallet and signer-enabled contracts for write ops
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
const coreContractWithSigner = coreContract.connect(wallet);
const nftContractWithSigner = nftContract.connect(wallet);

/**
 * Verify game result on the blockchain
 * @param {string} account Player's wallet address
 * @param {string} gameId Game session ID
 * @param {number} score Player's score
 * @returns {Promise<object>} Verification result
 */
const verifyGameResult = async (account, gameId, score) => {
  try {
    // For testing purposes, without actual blockchain interaction
    // Replace with actual contract calls when deployed
    console.log(`Verifying game result for player ${account} in game ${gameId} with score ${score}`);
    
    // Mock rewards calculation (1 token per 100 score points)
    const rewards = ethers.utils.parseEther((score / 100).toString());
    
    return {
      verified: true,
      rewards: ethers.utils.formatEther(rewards),
      gameId,
      score
    };
    
    // Uncomment when using actual contract
    /*
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
    */
  } catch (error) {
    console.error('Game verification error:', error);
    throw error;
  }
};

/**
 * Mint a new NFT for a player
 * @param {string} playerAddress Player's wallet address
 * @param {string} tokenURI Metadata URI for the NFT
 * @returns {Promise<object>} Minting result
 */
const mintNFT = async (playerAddress, tokenURI) => {
  try {
    // For testing purposes - replace with actual contract call
    console.log(`Minting NFT for player ${playerAddress} with URI ${tokenURI}`);
    
    // Mock tokenId
    const tokenId = Math.floor(Math.random() * 10000);
    
    return {
      success: true,
      tokenId,
      playerAddress,
      tokenURI
    };
    
    // Uncomment when using actual contract
    /*
    const tx = await nftContractWithSigner.mint(playerAddress, tokenURI);
    const receipt = await tx.wait();
    
    // Get token ID from event
    const event = receipt.events.find(e => e.event === 'Transfer');
    const tokenId = event.args.tokenId.toNumber();
    
    return {
      success: true,
      tokenId,
      playerAddress,
      tokenURI,
      transactionHash: receipt.transactionHash
    };
    */
  } catch (error) {
    console.error('NFT minting error:', error);
    throw error;
  }
};

module.exports = {
  verifyGameResult,
  mintNFT,
  coreContract,
  nftContract,
  coreContractWithSigner,
  nftContractWithSigner
};