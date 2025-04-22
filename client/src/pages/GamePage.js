import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import { GameContext } from '../contexts/GameContext';
import { GameEngine } from '../lib/gameEngine';
import HUD from '../components/UI/HUD';
import ConnectWallet from '../components/Wallet/ConnectWallet';

const GamePage = () => {
  const { account } = useContext(WalletContext);
  const { gameState, joinGame, leaveGame, updatePosition, fireWeapon } = useContext(GameContext);
  const navigate = useNavigate();
  
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  
  const [showGameOver, setShowGameOver] = useState(false);
  
  useEffect(() => {
    if (!account) return;
    
    // Initialize game engine
    if (canvasRef.current && !gameEngineRef.current) {
      gameEngineRef.current = new GameEngine(
        canvasRef.current,
        (position, rotation) => {
          updatePosition(position, rotation);
        },
        (direction) => {
          fireWeapon(direction);
        }
      );
      
      // Join game
      joinGame('default');
    }
    
    return () => {
      // Cleanup game engine
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
        gameEngineRef.current = null;
      }
      
      // Leave game
      leaveGame();
    };
  }, [account, joinGame, leaveGame, updatePosition, fireWeapon]);
  
  // Update other players
  useEffect(() => {
    if (!gameEngineRef.current) return;
    
    // Add/update other players
    gameState.players.forEach(player => {
      if (player.id !== account) {
        if (gameEngineRef.current.players[player.id]) {
          gameEngineRef.current.updateOtherPlayer(
            player.id,
            player.position,
            player.rotation
          );
        } else {
          gameEngineRef.current.addOtherPlayer(
            player.id,
            player.position
          );
        }
      }
    });
    
    // Remove disconnected players
    Object.keys(gameEngineRef.current.players).forEach(playerId => {
      if (!gameState.players.find(p => p.id === playerId)) {
        gameEngineRef.current.removeOtherPlayer(playerId);
      }
    });
  }, [account, gameState.players]);
  
  // Handle player death
  useEffect(() => {
    if (gameState.playerStats.health <= 0 && !showGameOver) {
      setShowGameOver(true);
    }
  }, [gameState.playerStats.health, showGameOver]);
  
  if (!account) {
    return <ConnectWallet />;
  }
  
  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      
      <HUD 
        health={gameState.playerStats.health}
        ammo={gameState.playerStats.ammo}
        score={gameState.playerStats.score}
      />
      
      {showGameOver && (
        <div className="menu-screen">
          <div className="menu-container">
            <h1>Game Over</h1>
            <p>Your final score: {gameState.playerStats.score}</p>
            <p>Kills: {gameState.playerStats.kills}</p>
            <div className="button-container">
              <button 
                className="connect-button" 
                onClick={() => {
                  setShowGameOver(false);
                  joinGame('default');
                }}
              >
                Play Again
              </button>
              <button 
                className="connect-button" 
                onClick={() => navigate('/')}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;