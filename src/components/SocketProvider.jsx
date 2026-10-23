import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from '../context/SocketContext';


function SocketProvider({ children }) {

  const [socket] = useState(() =>
    io(import.meta.env.VITE_API_URL, { withCredentials: true, autoConnect: false })
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
