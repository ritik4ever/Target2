import { Contract, formatEther, BrowserProvider } from 'ethers';
import MonadArenaCoreABI from '../contracts/MonadArenaCore.json';
import MonadArenaNFTABI from '../contracts/MonadArenaNFT.json';
import MonadArenaTokenABI from '../contracts/MonadArenaToken.json';

// Contract addresses (ensure these are correct after deployment)
const CORE_CONTRACT_ADDRESS = '0xD99C84178DFda5AB45C9970Fe5c7936cd96BD880';
const NFT_CONTRACT_ADDRESS = '0x0e53D4a9A4176E911cC38EAc89e099c8343608AC';
const TOKEN_CONTRACT_ADDRESS = '0x9428dA7C202356d431Ae8a68Bd30D9712FFb07F1';

export const getTokenBalance = async (signer) => {
  try {
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      MonadArenaTokenABI.abi,
      signer
    );

    const address = await signer.getAddress();
    const balance = await tokenContract.balanceOf(address);

    return formatEther(balance); // ethers v6 utility
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

export const getNFTs = async (signer) => {
  try {
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      MonadArenaNFTABI.abi,
      signer
    );

    const address = await signer.getAddress();
    const balance = await nftContract.balanceOf(address);
    
    if (balance.toString() === '0') {
      return [];
    }

    const nfts = await Promise.all(
      Array.from({ length: Number(balance) }, async (_, i) => {
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
        const tokenURI = await nftContract.tokenURI(tokenId);
        const weaponStats = await nftContract.getWeaponStats(tokenId);

        let metadata = {};
        try {
          const response = await fetch(tokenURI);
          metadata = await response.json();
        } catch (err) {
          console.error('Error fetching metadata:', err);
          metadata = {
            name: `Weapon #${tokenId}`,
            description: 'A mysterious weapon',
            image: '/assets/default-weapon.png'
          };
        }

        return {
          id: tokenId.toString(),
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          stats: {
            damage: weaponStats.damage.toString(),
            fireRate: weaponStats.fireRate.toString(),
            accuracy: weaponStats.accuracy.toString(),
            range: weaponStats.range.toString(),
            type: weaponStats.weaponType
          }
        };
      })
    );

    return nfts;
  } catch (error) {
    console.error('Error getting NFTs:', error);
    return [];
  }
};

export const claimRewards = async (signer, gameId, score) => {
  try {
    const coreContract = new Contract(
      CORE_CONTRACT_ADDRESS,
      MonadArenaCoreABI.abi,
      signer
    );

    const tx = await coreContract.claimRewards(gameId, score);
    await tx.wait(); // Wait for confirmation

    return tx.hash;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};
