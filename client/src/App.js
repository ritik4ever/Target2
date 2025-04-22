import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { GameProvider } from './contexts/GameContext';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import InventoryPage from './pages/InventoryPage';
import MarketplacePage from './pages/MarketplacePage';
import LoadingScreen from './components/UI/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading assets (if needed)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);  // Adjust this to simulate any loading process you may have

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;  // Show loading screen until assets are loaded
  }

  return (
    <WalletProvider>
      <GameProvider>
        <div className="app-container">
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
            </Routes>
          </Router>
        </div>
      </GameProvider>
    </WalletProvider>
  );
}

export default App;
