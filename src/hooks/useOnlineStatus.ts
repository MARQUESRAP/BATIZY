import { useEffect } from 'react';
import { useSyncStore } from '../stores';

export function useOnlineStatus() {
  const { isOnline, updateOnlineStatus, checkPendingSync } = useSyncStore();

  useEffect(() => {
    const handleOnline = () => {
      updateOnlineStatus(true);
    };

    const handleOffline = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier le statut initial
    updateOnlineStatus(navigator.onLine);
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateOnlineStatus, checkPendingSync]);

  return isOnline;
}

// Hook pour charger les données initiales
export function useInitializeData() {
  const { user } = useAuthStore();
  const loadChantiers = useChantierStore(state => state.loadChantiers);
  const loadChantiersByTechnician = useChantierStore(state => state.loadChantiersByTechnician);
  const loadUsers = useUserStore(state => state.loadUsers);
  const loadWorkTypes = useWorkTypeStore(state => state.loadWorkTypes);
  const loadAlerts = useAlertStore(state => state.loadAlerts);
  const loadNotifications = useNotificationStore(state => state.loadNotifications);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      await loadUsers();
      await loadWorkTypes();
      await loadAlerts();
      await loadNotifications(user.id);

      if (user.role === 'admin') {
        await loadChantiers();
      } else {
        await loadChantiersByTechnician(user.id);
      }
    };

    loadData();
  }, [user]);
}

import { useAuthStore, useChantierStore, useUserStore, useWorkTypeStore, useAlertStore, useNotificationStore } from '../stores';
