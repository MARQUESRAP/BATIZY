import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSyncStore } from '../../stores';

export function OnlineStatus() {
  const { isOnline, pendingSync, lastSyncAt } = useSyncStore();

  if (isOnline && pendingSync === 0) {
    return null; // Ne rien afficher si tout va bien
  }

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-2 px-4 py-2 rounded-full
        shadow-lg animate-slide-down
        ${isOnline 
          ? 'bg-chantier-orange text-white' 
          : 'bg-gray-800 text-white'
        }
      `}
    >
      {isOnline ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm font-medium">
            {pendingSync} élément{pendingSync > 1 ? 's' : ''} en attente de sync
          </span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span className="text-sm font-medium">Mode hors-ligne</span>
        </>
      )}
    </div>
  );
}

// Badge compact pour afficher dans la nav
export function OnlineStatusBadge() {
  const { isOnline, pendingSync } = useSyncStore();

  return (
    <div className="flex items-center gap-1.5">
      {isOnline ? (
        <Wifi size={14} className="text-chantier-green" />
      ) : (
        <WifiOff size={14} className="text-gray-400" />
      )}
      {pendingSync > 0 && (
        <span className="text-xs bg-chantier-orange text-white px-1.5 py-0.5 rounded-full sync-pending">
          {pendingSync}
        </span>
      )}
    </div>
  );
}
