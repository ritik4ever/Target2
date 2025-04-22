require('dotenv').config();  // Ensure dotenv is loaded
require('@nomicfoundation/hardhat-toolbox');

console.log('MONAD_RPC_URL:', process.env.MONAD_RPC_URL);

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.24" },
      { version: "0.8.28" },
    ]
  },
  networks: {
    hardhat: {},

    monad: {
      url: process.env.MONAD_RPC_URL,
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },

    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337
    }
  }
};
