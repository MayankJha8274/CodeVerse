import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, AlertCircle, Clock, Loader2 } from 'lucide-react';
import api from '../services/api';

/**
 * SyncStatusBadge Component
 * Shows current sync status and allows manual sync trigger
 */
const SyncStatusBadge = ({ onSyncComplete, showButton = true, compact = false }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch current sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
      setIsSyncing(status.syncStatus === 'syncing');
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchSyncStatus();

    // Poll every 10 seconds when syncing
    const interval = setInterval(() => {
      if (isSyncing) {
        fetchSyncStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchSyncStatus, isSyncing]);

  // Trigger manual sync
  const handleSync = async (forceSync = false) => {
    if (isSyncing) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.syncPlatforms({ forceSync });

      if (result.cached) {
        // Data was cached, show message
        setError(`Data is fresh. Next sync available in ${result.data?.nextSyncIn || 0}s`);
        setTimeout(() => setError(null), 3000);
      } else {
        setIsSyncing(true);
        // Poll for completion
        pollSyncStatus();
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Sync failed';
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll sync status until complete
  const pollSyncStatus = async () => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsSyncing(false);
        setError('Sync timed out');
        return;
      }

      try {
        const status = await api.getSyncStatus();
        setSyncStatus(status);

        if (status.syncStatus === 'completed' || status.syncStatus === 'failed') {
          setIsSyncing(false);
          if (status.syncStatus === 'completed' && onSyncComplete) {
            onSyncComplete();
          }
          if (status.syncStatus === 'failed') {
            setError(status.lastSyncError || 'Sync failed');
            setTimeout(() => setError(null), 5000);
          }
          return;
        }

        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (err) {
        console.error('Polling error:', err);
        setIsSyncing(false);
      }
    };

    poll();
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Never';

    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Render status indicator
  const renderStatus = () => {
    if (!syncStatus) return null;

    const { syncStatus: status, lastSyncedAt, isCached } = syncStatus;

    if (status === 'syncing' || isSyncing) {
      return (
        <div className="flex items-center gap-2 text-blue-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {!compact && <span className="text-sm">Syncing...</span>}
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          {!compact && <span className="text-sm">Sync failed</span>}
        </div>
      );
    }

    if (status === 'completed' || status === 'idle') {
      return (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          {isCached ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          {!compact && (
            <span className="text-sm">
              {lastSyncedAt ? formatTimeAgo(lastSyncedAt) : 'Not synced'}
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderStatus()}
        {showButton && (
          <button
            onClick={() => handleSync(false)}
            disabled={isSyncing || isLoading}
            className={`p-1.5 rounded-lg transition-all ${
              isSyncing || isLoading
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title={isSyncing ? 'Syncing...' : 'Sync Now'}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isSyncing || isLoading ? 'animate-spin text-blue-500' : 'text-gray-600 dark:text-gray-400'
              }`}
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Sync Status</h3>
            {renderStatus()}
          </div>
        </div>

        {showButton && (
          <button
            onClick={() => handleSync(false)}
            disabled={isSyncing || isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isSyncing || isLoading
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSyncing || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {syncStatus?.queue && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Queue: {syncStatus.queue.waiting} waiting</span>
            <span>{syncStatus.queue.active} active</span>
            <span>{syncStatus.queue.completed} completed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusBadge;
