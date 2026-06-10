import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Hook for subscribing to real-time sync status updates
 */
export const useSyncStatus = (userId) => {
  const [syncStatus, setSyncStatus] = useState({
    status: 'idle',
    platform: null,
    progress: null,
    error: null,
    results: null,
    timestamp: null
  });
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Connect to socket
    const socket = io(SOCKET_URL, {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to user's sync updates
      socket.emit('sync:subscribe', userId);
    });

    socket.on('sync:status', (data) => {
      setSyncStatus({
        status: data.status,
        platform: data.platform || null,
        progress: data.progress || null,
        error: data.error || null,
        results: data.results || null,
        aggregated: data.aggregated || null,
        duration: data.duration || null,
        timestamp: data.timestamp || new Date()
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Sync socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('sync:unsubscribe', userId);
        socketRef.current.disconnect();
      }
      setIsConnected(false);
    };
  }, [userId]);

  // Reset status
  const resetStatus = useCallback(() => {
    setSyncStatus({
      status: 'idle',
      platform: null,
      progress: null,
      error: null,
      results: null,
      timestamp: null
    });
  }, []);

  return {
    syncStatus,
    resetStatus,
    isConnected
  };
};

/**
 * Hook for real-time sync progress with auto-refresh
 */
export const useSyncWithRefresh = (userId, onComplete) => {
  const { syncStatus, resetStatus, isConnected } = useSyncStatus(userId);
  const completedOnceRef = useRef(false);

  useEffect(() => {
    if (syncStatus.status !== 'completed') {
      completedOnceRef.current = false;
      return;
    }

    if (completedOnceRef.current) return;
    completedOnceRef.current = true;

    if (onComplete) {
      onComplete(syncStatus.results, syncStatus.aggregated);
    }

    const t = setTimeout(() => {
      resetStatus();
      completedOnceRef.current = false;
    }, 2000);

    return () => clearTimeout(t);
  }, [syncStatus.status, onComplete, resetStatus, syncStatus.results, syncStatus.aggregated]);

  return {
    syncStatus,
    isConnected,
    isSyncing: syncStatus.status === 'syncing',
    hasError: syncStatus.status === 'failed',
    resetStatus
  };
};

export default useSyncStatus;
