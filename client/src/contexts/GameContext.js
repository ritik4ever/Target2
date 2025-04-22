import React, { createContext, useState, useEffect, useContext } from 'react';
import { WalletContext } from './WalletContext';
import { initializeSocketConnection } from '../lib/socketService';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { account } = useContext(WalletContext);
  const [gameState, setGameState] = useState({
    isPlaying: false,
    players: [],
    playerStats: {
      health: 100,
      ammo: 30,
      score: 0,
      kills: 0,
      deaths: 0
    },
    gameId: null,
    socket: null
  });

  // Initialize socket connection when account changes
  useEffect(() => {
    if (account && !gameState.socket) {
      const socket = initializeSocketConnection(account);
      
      socket.on('connect', () => {
        console.log('Connected to game server');
        setGameState(prev => ({ ...prev, socket }));
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from game server');
      });
      
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [account, gameState.socket]);

  // Handle game events
  useEffect(() => {
    if (gameState.socket) {
      const socket = gameState.socket;
      
      socket.on('gameJoined', (data) => {
        setGameState(prev => ({
          ...prev,
          isPlaying: true,
          players: data.players,
          gameId: data.gameId
        }));
      });
      
      socket.on('playerJoined', (data) => {
        setGameState(prev => ({
          ...prev,
          players: [...prev.players, data.player]
        }));
      });
      
      socket.on('playerLeft', (data) => {
        setGameState(prev => ({
          ...prev,
          players: prev.players.filter(player => player.id !== data.playerId)
        }));
      });
      
      socket.on('playerMoved', (data) => {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(player => 
            player.id === data.playerId 
              ? { ...player, position: data.position, rotation: data.rotation } 
              : player
          )
        }));
      });
      
      socket.on('playerHit', (data) => {
        if (data.targetId === account) {
          setGameState(prev => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              health: data.newHealth
            }
          }));
        }
      });
      
      socket.on('playerKilled', (data) => {
        if (data.targetId === account) {
          setGameState(prev => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              health: 0,
              deaths: prev.playerStats.deaths + 1
            }
          }));
        } else if (data.killerId === account) {
          setGameState(prev => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              kills: prev.playerStats.kills + 1,
              score: prev.playerStats.score + 10
            }
          }));
        }
      });
      
      socket.on('playerRespawned', (data) => {
        if (data.playerId === account) {
          setGameState(prev => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              health: 100,
              ammo: 30
            }
          }));
        }
      });
      
      socket.on('gameEnded', (data) => {
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          players: [],
          gameId: null
        }));
      });
      
      return () => {
        socket.off('gameJoined');
        socket.off('playerJoined');
        socket.off('playerLeft');
        socket.off('playerMoved');
        socket.off('playerHit');
        socket.off('playerKilled');
        socket.off('playerRespawned');
        socket.off('gameEnded');
      };
    }
  }, [account, gameState.socket]);

  const joinGame = (gameId) => {
    if (gameState.socket) {
      gameState.socket.emit('joinGame', { gameId });
    }
  };

  const leaveGame = () => {
    if (gameState.socket) {
      gameState.socket.emit('leaveGame');
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        players: [],
        gameId: null
      }));
    }
  };

  const updatePosition = (position, rotation) => {
    if (gameState.socket && gameState.isPlaying) {
      gameState.socket.emit('updatePosition', { position, rotation });
    }
  };

  const fireWeapon = (direction) => {
    if (gameState.socket && gameState.isPlaying) {
      gameState.socket.emit('fireWeapon', { direction });
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          ammo: Math.max(0, prev.playerStats.ammo - 1)
        }
      }));
    }
  };

  const reloadWeapon = () => {
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        ammo: 30
      }
    }));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        joinGame,
        leaveGame,
        updatePosition,
        fireWeapon,
        reloadWeapon
      }}
    >
      {children}
    </GameContext.Provider>
  );
};