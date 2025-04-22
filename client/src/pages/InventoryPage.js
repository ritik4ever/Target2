import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import { getNFTs, getTokenBalance } from '../lib/blockchain';
import ConnectWallet from '../components/Wallet/ConnectWallet';

const InventoryPage = () => {
  const { account, signer } = useContext(WalletContext);
  const navigate = useNavigate();
  
  const [nfts, setNfts] = useState([]);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!account || !signer) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [nftData, balance] = await Promise.all([
          getNFTs(signer),
          getTokenBalance(signer)
        ]);
        
        setNfts(nftData);
        setTokenBalance(balance);
      } catch (error) {
        console.error('Error loading inventory data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [account, signer]);
  
  if (!account) {
    return <ConnectWallet />;
  }
  
  return (
    <div className="menu-screen">
      <div className="menu-container" style={{ maxWidth: '800px' }}>
        <h1>My Inventory</h1>
        <p>ARENA Token Balance: {tokenBalance}</p>
        
        <button 
          className="connect-button" 
          onClick={() => navigate('/')}
          style={{ marginBottom: '20px' }}
        >
          Back to Menu
        </button>
        
        {isLoading ? (
          <p>Loading your NFTs...</p>
        ) : nfts.length === 0 ? (
          <p>You don't have any NFTs yet. Play games to earn weapons!</p>
        ) : (
          <div className="nft-grid">
            {nfts.map(nft => (
              <div key={nft.id} className="nft-item">
                <img src={nft.image} alt={nft.name} className="nft-image" />
                <p className="nft-name">{nft.name}</p>
                <p className="nft-rarity">
                  DMG: {nft.stats.damage} | FR: {nft.stats.fireRate}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;