import io from 'socket.io-client';

const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.monadarena.com' 
  : 'http://localhost:3001';

export const initializeSocketConnection = (account) => {
  const socket = io(SERVER_URL, {
    query: {
      account
    }
  });

  return socket;
};