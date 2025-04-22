import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import ConnectWallet from '../components/Wallet/ConnectWallet';

const MarketplacePage = () => {
  const { account } = useContext(WalletContext);
  const navigate = useNavigate();
  
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!account) return;
    
    // Simulate loading marketplace listings
    setIsLoading(true);
    setTimeout(() => {
      // Mock data for demonstration
      setListings([
        {
          id: '1',
          name: 'Plasma Rifle',
          image: '/assets/models/plasma-rifle.png',
          price: '50',
          seller: '0x1234...5678',
          stats: {
            damage: 85,
            fireRate: 70,
            accuracy: 90,
            range: 80,
            type: 'Energy'
          }
        },
        {
          id: '2',
          name: 'Tactical Shotgun',
          image: '/assets/models/shotgun.png',
          price: '35',
          seller: '0x8765...4321',
          stats: {
            damage: 95,
            fireRate: 40,
            accuracy: 60,
            range: 30,
            type: 'Shotgun'
          }
        },
        {
          id: '3',
          name: 'Sniper Rifle',
          image: '/assets/models/sniper.png',
          price: '75',
          seller: '0x2468...1357',
          stats: {
            damage: 100,
            fireRate: 20,
            accuracy: 100,
            range: 100,
            type: 'Sniper'
          }
        }
      ]);
      setIsLoading(false);
    }, 1500);
  }, [account]);
  
  if (!account) {
    return <ConnectWallet />;
  }
  
  return (
    <div className="menu-screen">
      <div className="menu-container" style={{ maxWidth: '800px' }}>
        <h1>Marketplace</h1>
        <p>Buy and sell weapons with ARENA tokens</p>
        
        <button 
          className="connect-button" 
          onClick={() => navigate('/')}
          style={{ marginBottom: '20px' }}
        >
          Back to Menu
        </button>
        
        {isLoading ? (
          <p>Loading marketplace listings...</p>
        ) : listings.length === 0 ? (
          <p>No items are currently listed in the marketplace.</p>
        ) : (
          <div className="nft-grid">
            {listings.map(listing => (
              <div key={listing.id} className="nft-item">
                <img src={listing.image} alt={listing.name} className="nft-image" />
                <p className="nft-name">{listing.name}</p>
                <p className="nft-rarity">
                  Price: {listing.price} ARENA
                </p>
                <p className="nft-stats">
                  DMG: {listing.stats.damage} | FR: {listing.stats.fireRate}
                </p>
                <button 
                  className="connect-button" 
                  style={{ padding: '5px 10px', fontSize: '0.8rem', marginTop: '10px' }}
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;