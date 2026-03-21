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

  useEffect(() => {
    if (!userId) return;

    // Connect to socket
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
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
      console.log('Sync socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('sync:unsubscribe', userId);
        socketRef.current.disconnect();
      }
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
    isConnected: socketRef.current?.connected || false
  };
};

/**
 * Hook for real-time sync progress with auto-refresh
 */
export const useSyncWithRefresh = (userId, onComplete) => {
  const { syncStatus, resetStatus, isConnected } = useSyncStatus(userId);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (syncStatus.status === 'completed' && !hasCompleted) {
      setHasCompleted(true);
      if (onComplete) {
        onComplete(syncStatus.results, syncStatus.aggregated);
      }
      // Reset after a delay
      setTimeout(() => {
        resetStatus();
        setHasCompleted(false);
      }, 2000);
    }
  }, [syncStatus.status, hasCompleted, onComplete, resetStatus, syncStatus.results, syncStatus.aggregated]);

  return {
    syncStatus,
    isConnected,
    isSyncing: syncStatus.status === 'syncing',
    hasError: syncStatus.status === 'failed',
    resetStatus
  };
};

export default useSyncStatus;
