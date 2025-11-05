import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (user) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    // Join user's personal notification room
    socketRef.current.emit('join_user_room', user.id);

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  return socketRef.current;
};

export default useSocket;