import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('online_users', (data) => {
      setOnlineUsers(data.users || []);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const joinSociety = useCallback((societyId) => {
    socketRef.current?.emit('join_society', societyId);
  }, []);

  const joinChannel = useCallback((channelId) => {
    socketRef.current?.emit('join_channel', channelId);
  }, []);

  const leaveChannel = useCallback((channelId) => {
    socketRef.current?.emit('leave_channel', channelId);
  }, []);

  const sendMessage = useCallback((data) => {
    socketRef.current?.emit('send_message', data);
  }, []);

  const startTyping = useCallback((channelId) => {
    socketRef.current?.emit('typing_start', channelId);
  }, []);

  const stopTyping = useCallback((channelId) => {
    socketRef.current?.emit('typing_stop', channelId);
  }, []);

  const reactToMessage = useCallback((data) => {
    socketRef.current?.emit('react_message', data);
  }, []);

  const on = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    socketRef.current?.off(event, callback);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      joinSociety,
      joinChannel,
      leaveChannel,
      sendMessage,
      startTyping,
      stopTyping,
      reactToMessage,
      on,
      off
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
