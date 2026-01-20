import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function NetworkStatusBar() {
  const { isOnline, isSyncing, pendingCount, lastSyncResult, syncData } = useNetworkStatus();

  if (isOnline && pendingCount.total === 0 && !lastSyncResult) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${
      isOnline ? 'bg-blue-600' : 'bg-orange-600'
    } text-white px-4 py-2 shadow-lg`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}

          <div className="flex flex-col">
            <span className="font-semibold">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>

            {pendingCount.total > 0 && (
              <span className="text-sm opacity-90">
                {pendingCount.releves} relevé(s) en attente
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSyncing && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Synchronisation...</span>
            </div>
          )}

          {lastSyncResult && !isSyncing && (
            <div className="flex items-center gap-2">
              {lastSyncResult.success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">
                    {lastSyncResult.syncedReleves} relevé(s) synchronisé(s)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Erreur de synchronisation</span>
                </>
              )}
            </div>
          )}

          {isOnline && pendingCount.total > 0 && !isSyncing && (
            <button
              onClick={syncData}
              className="px-3 py-1 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Synchroniser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
