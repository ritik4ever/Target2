class PlayerManager {
    constructor() {
      this.players = {};
    }
    
    addPlayer(id, account) {
      this.players[id] = {
        id,
        account,
        gameId: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        health: 100,
        score: 0,
        kills: 0,
        deaths: 0
      };
      
      return this.players[id];
    }
    
    getPlayer(id) {
      return this.players[id];
    }
    
    removePlayer(id) {
      if (this.players[id]) {
        delete this.players[id];
      }
    }
    
    getPlayerByAccount(account) {
      return Object.values(this.players).find(player => player.account === account);
    }
  }
  
  module.exports = PlayerManager;