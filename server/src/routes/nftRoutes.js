const express = require('express');
const router = express.Router();
const ethers = require('ethers');
// Use the centralized contract loader
const { MonadArenaNFT } = require('../utils/contractLoader');

// Contract address (to be updated after deployment)
const NFT_CONTRACT_ADDRESS = '0x0e53D4a9A4176E911cC38EAc89e099c8343608AC';

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(process.env.MONAD_RPC_URL);

// Initialize contract
const nftContract = new ethers.Contract(
  NFT_CONTRACT_ADDRESS,
  MonadArenaNFT.abi,
  provider
);

// Get NFTs by owner
router.get('/owner/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    // Get NFT count
    const balance = await nftContract.balanceOf(address);
    
    // Get all NFTs
    const nfts = [];
    
    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
      const tokenURI = await nftContract.tokenURI(tokenId);
      const weaponStats = await nftContract.getWeaponStats(tokenId);
      
      nfts.push({
        tokenId: tokenId.toString(),
        tokenURI,
        stats: {
          damage: weaponStats.damage,
          fireRate: weaponStats.fireRate,
          accuracy: weaponStats.accuracy,
          range: weaponStats.range,
          weaponType: weaponStats.weaponType
        }
      });
    }
    
    res.json(nfts);
  } catch (error) {
    console.error('Error getting NFTs:', error);
    res.status(500).json({ error: 'Failed to get NFTs' });
  }
});

// Get NFT details
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    // Check if token exists
    const exists = await nftContract.exists(tokenId);
    if (!exists) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    
    // Get token details
    const owner = await nftContract.ownerOf(tokenId);
    const tokenURI = await nftContract.tokenURI(tokenId);
    const weaponStats = await nftContract.getWeaponStats(tokenId);
    
    res.json({
      tokenId,
      owner,
      tokenURI,
      stats: {
        damage: weaponStats.damage,
        fireRate: weaponStats.fireRate,
        accuracy: weaponStats.accuracy,
        range: weaponStats.range,
        weaponType: weaponStats.weaponType
      }
    });
  } catch (error) {
    console.error('Error getting NFT details:', error);
    res.status(500).json({ error: 'Failed to get NFT details' });
  }
});

module.exports = router;