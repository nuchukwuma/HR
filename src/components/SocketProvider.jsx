import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from '../context/SocketContext';
import { API_SERVER_URL } from '../utils/config';

function SocketProvider({ children }) {

  const [socket] = useState(() =>
    io(API_SERVER_URL, { withCredentials: true, autoConnect: false })
  );

  useEffect(() => {
    socket.on('connect_error', (err) => console.log('Socket refused:', err.message));
    socket.connect();

    return () => {
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export default SocketProvider;
