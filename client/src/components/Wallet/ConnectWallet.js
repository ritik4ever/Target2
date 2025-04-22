import React, { useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContext';

const ConnectWallet = () => {
  const { account, isConnecting, error, connectWallet } = useContext(WalletContext);

  return (
    <div className="menu-screen">
      <div className="menu-container">
        <h1>Monad Arena</h1>
        <p>Connect your wallet to enter the battle arena and start earning NFTs</p>
        <button 
          className="connect-button" 
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
        </button>
        {error && <p className="error-message">{error}</p>}
        {account && (
          <p className="wallet-connected">
            Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;