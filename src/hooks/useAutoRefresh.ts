import { useEffect, useRef } from 'react';
import { useChantierStore, useAuthStore, useNotificationStore, useRapportStore } from '../stores';
import { isBefore } from 'date-fns';
import { db } from '../db/database';

/**
 * Hook qui rafraîchit automatiquement les statuts des chantiers
 * - Vérifie toutes les minutes si un chantier doit changer de statut
 * - Recharge les chantiers si nécessaire
 * - Crée des notifications pour les rapports en attente
 */
export function useAutoRefreshChantiers(intervalMs: number = 60000) {
  const { user } = useAuthStore();
  const { chantiers, loadChantiers, loadChantiersByTechnician } = useChantierStore();
  const { rapports, loadRapports } = useRapportStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedChantiersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const refresh = async () => {
      if (user.role === 'admin') {
        await loadChantiers();
      } else {
        await loadChantiersByTechnician(user.id);
        await loadRapports();
        
        // Vérifier les chantiers qui viennent de se terminer (pour techniciens)
        checkForEndedChantiers();
      }
    };

    const checkForEndedChantiers = async () => {
      const now = new Date();
      
      for (const chantier of chantiers) {
        // Si le chantier est terminé par l'heure mais n'a pas de rapport
        const isTimeOver = isBefore(new Date(chantier.endDatetime), now);
        const hasNoReport = !rapports.some(r => r.chantierId === chantier.id && r.status === 'submitted');
        const notAlreadyNotified = !notifiedChantiersRef.current.has(chantier.id);
        
        if (isTimeOver && hasNoReport && notAlreadyNotified && chantier.status !== 'termine') {
          // Marquer comme notifié pour éviter les doublons
          notifiedChantiersRef.current.add(chantier.id);
          
          // Créer une notification locale
          const notification = {
            id: `notif-rapport-${chantier.id}-${Date.now()}`,
            userId: user.id,
            title: '📋 Rapport en attente',
            message: `Le chantier "${chantier.clientName}" est terminé. N'oubliez pas de remplir le rapport de fin.`,
            type: 'rapport' as const,
            relatedId: chantier.id,
            isRead: false,
            createdAt: new Date()
          };
          
          try {
            await db.notifications.add(notification);
            console.log('[Notification] Rapport en attente créé pour:', chantier.clientName);
          } catch (e) {
            // Notification peut déjà exister
          }
        }
      }
    };

    // Rafraîchir immédiatement au montage
    refresh();

    // Puis toutes les X millisecondes
    intervalRef.current = setInterval(refresh, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, intervalMs, chantiers.length, rapports.length]);
}

/**
 * Hook qui rafraîchit les chantiers quand l'app revient au premier plan
 */
export function useRefreshOnFocus() {
  const { user } = useAuthStore();
  const { loadChantiers, loadChantiersByTechnician } = useChantierStore();
  const { loadRapports } = useRapportStore();

  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (user.role === 'admin') {
          loadChantiers();
        } else {
          loadChantiersByTechnician(user.id);
          loadRapports();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);
}
