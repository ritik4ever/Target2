import React, { createContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// Default context shape
const defaultContext = {
  account: null,
  provider: null,
  signer: null,
  isConnecting: false,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
};

// Create WalletContext
export const WalletContext = createContext(defaultContext);

// WalletProvider Component
export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const ethereum = await detectEthereumProvider();
      if (!ethereum) throw new Error('MetaMask not detected');

      await ethereum.request({ method: 'eth_requestAccounts' });

      const ethersProvider = new BrowserProvider(ethereum);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(address);
    } catch (err) {
      setError(err.message);
      console.error('connectWallet error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      const ethereum = await detectEthereumProvider();
      if (!ethereum) return;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const ethersProvider = new BrowserProvider(ethereum);
        const signer = await ethersProvider.getSigner();
        setProvider(ethersProvider);
        setSigner(signer);
        setAccount(accounts[0]);
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    const subscribeToEvents = async () => {
      const ethereum = await detectEthereumProvider();
      if (!ethereum?.on) return;

      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          const ethersProvider = new BrowserProvider(ethereum);
          const signer = await ethersProvider.getSigner();
          setProvider(ethersProvider);
          setSigner(signer);
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    };

    subscribeToEvents();
  }, [disconnectWallet]);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
