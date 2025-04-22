import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import ConnectWallet from '../components/Wallet/ConnectWallet';

const HomePage = () => {
  const { account } = useContext(WalletContext);
  const navigate = useNavigate();

  if (!account) {
    return <ConnectWallet />;
  }

  return (
    <div className="menu-screen">
      <div className="menu-container">
        <h1>Monad Arena</h1>
        <p>Welcome to the blockchain battle royale!</p>
        <div className="button-container">
          <button className="connect-button" onClick={() => navigate('/game')}>
            Play Now
          </button>
          <button className="connect-button" onClick={() => navigate('/inventory')}>
            My Inventory
          </button>
          <button className="connect-button" onClick={() => navigate('/marketplace')}>
            Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;