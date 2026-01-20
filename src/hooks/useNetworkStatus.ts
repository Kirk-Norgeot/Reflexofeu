import { useState, useEffect } from 'react';
import { syncService, SyncResult } from '../services/sync.service';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState({ releves: 0, photos: 0, total: 0 });
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const updatePendingCount = async () => {
    const count = await syncService.getPendingCount();
    setPendingCount(count);
  };

  const syncData = async () => {
    if (!isOnline || isSyncing) return;

    const hasData = await syncService.hasDataToSync();
    if (!hasData) return;

    setIsSyncing(true);
    try {
      const result = await syncService.syncAll();
      setLastSyncResult(result);
      await updatePendingCount();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setTimeout(() => {
        syncData();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();

    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncData();
    }
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncResult,
    syncData,
    updatePendingCount
  };
}
