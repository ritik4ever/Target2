class GameRoom {
    constructor(id) {
      this.id = id;
      this.players = {};
      this.projectiles = [];
      this.lastUpdate = Date.now();
      
      // Start game loop
      this.gameLoopInterval = setInterval(() => this.gameLoop(), 16); // ~60fps
    }
    
    addPlayer(player) {
      this.players[player.id] = player;
      player.gameId = this.id;
      player.health = 100;
      player.score = 0;
      
      // Set initial position
      player.position = {
        x: (Math.random() - 0.5) * 20,
        y: 0,
        z: (Math.random() - 0.5) * 20
      };
      
      player.rotation = { x: 0, y: 0, z: 0 };
      
      return player;
    }
    
    removePlayer(playerId) {
      if (this.players[playerId]) {
        delete this.players[playerId];
      }
    }
    
    getPlayers() {
      return Object.values(this.players);
    }
    
    isEmpty() {
      return Object.keys(this.players).length === 0;
    }
    
    handleProjectile(player, direction) {
      // Create new projectile
      const projectile = {
        id: Date.now() + Math.random(),
        playerId: player.id,
        position: { ...player.position, y: 1.5 }, // Adjust height to match player's weapon
        direction,
        speed: 0.5,
        damage: 20,
        createdAt: Date.now()
      };
      
      this.projectiles.push(projectile);
      
      // Remove projectile after 5 seconds
      setTimeout(() => {
        this.projectiles = this.projectiles.filter(p => p.id !== projectile.id);
      }, 5000);
    }
    
    gameLoop() {
      const now = Date.now();
      const deltaTime = now - this.lastUpdate;
      this.lastUpdate = now;
      
      // Update projectiles
      for (const projectile of this.projectiles) {
        // Move projectile
        projectile.position.x += projectile.direction.x * projectile.speed * deltaTime;
        projectile.position.y += projectile.direction.y * projectile.speed * deltaTime;
        projectile.position.z += projectile.direction.z * projectile.speed * deltaTime;
        
        // Check for collisions with players
        for (const playerId in this.players) {
          // Skip the player who fired the projectile
          if (playerId === projectile.playerId) continue;
          
          const player = this.players[playerId];
          
          // Simple collision detection (sphere-sphere)
          const dx = player.position.x - projectile.position.x;
          const dy = player.position.y + 1 - projectile.position.y; // Adjust for player height
          const dz = player.position.z - projectile.position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance < 1) { // Hit radius of 1 unit
            // Player hit
            player.health = Math.max(0, player.health - projectile.damage);
            
            // Notify players
            this.notifyPlayerHit(player.id, projectile.playerId, player.health);
            
            // Remove projectile
            this.projectiles = this.projectiles.filter(p => p.id !== projectile.id);
            
            // Check if player is killed
            if (player.health <= 0) {
              this.handlePlayerKilled(player.id, projectile.playerId);
            }
            
            break;
          }
        }
      }
    }
    
    notifyPlayerHit(targetId, shooterId, newHealth) {
      // Get socket.io instance
      const io = require('socket.io').instance;
      
      // Notify target player
      io.to(targetId).emit('playerHit', {
        shooterId,
        newHealth
      });
      
      // Notify shooter
      io.to(shooterId).emit('hitConfirmed', {
        targetId
      });
    }
    
    handlePlayerKilled(targetId, killerId) {
      // Get socket.io instance
      const io = require('socket.io').instance;
      
      // Get players
      const target = this.players[targetId];
      const killer = this.players[killerId];
      
      // Update scores
      if (killer) {
        killer.score += 10;
        killer.kills = (killer.kills || 0) + 1;
      }
      
      target.deaths = (target.deaths || 0) + 1;
      
      // Notify all players in the room
      io.to(this.id).emit('playerKilled', {
        targetId,
        killerId,
        killerScore: killer ? killer.score : 0
      });
      
      // Respawn player after 3 seconds
      setTimeout(() => this.respawnPlayer(targetId), 3000);
    }
    
    respawnPlayer(playerId) {
      const player = this.players[playerId];
      if (!player) return;
      
      // Reset health
      player.health = 100;
      
      // Set new position
      player.position = {
        x: (Math.random() - 0.5) * 20,
        y: 0,
        z: (Math.random() - 0.5) * 20
      };
      
      // Get socket.io instance
      const io = require('socket.io').instance;
      
      // Notify player
      io.to(playerId).emit('playerRespawned', {
        position: player.position,
        health: player.health
      });
      
      // Notify other players
      io.to(this.id).emit('playerRespawned', {
        playerId,
        position: player.position
      });
    }
    
    cleanup() {
      clearInterval(this.gameLoopInterval);
    }
  }
  
  module.exports = GameRoom;