import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Chantier, Rapport, Alert, Notification, WorkType } from '../types';
import { db } from '../db/database';
import { isSupabaseConfigured } from '../lib/supabase';
import { syncUsers, syncChantiers, syncRapports, syncAlerts, syncNotifications, syncWorkTypes, SyncManager } from '../lib/sync';
import { applyAutoStatusToList } from '../utils/helpers';

// Génère un UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ============================================
// STORE AUTHENTIFICATION
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (code: string) => {
        // Essayer d'abord avec Supabase
        if (isSupabaseConfigured()) {
          try {
            const user = await syncUsers.authenticate(code);
            if (user) {
              set({ user, isAuthenticated: true });
              if (user.role === 'admin') {
                SyncManager.pullAll().catch(console.error);
              } else {
                SyncManager.pullForTechnician(user.id).catch(console.error);
              }
              return true;
            }
          } catch (e) { console.error('Auth Supabase error:', e); }
        }
        
        // Fallback sur la base locale
        const user = await db.users.where('code').equals(code).first();
        if (user && user.isActive) {
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    { name: 'batizy-auth' }
  )
);

// ============================================
// STORE CHANTIERS
// ============================================

interface ChantierState {
  chantiers: Chantier[];
  selectedChantier: Chantier | null;
  loading: boolean;
  loadChantiers: () => Promise<void>;
  loadChantiersByTechnician: (technicianId: string) => Promise<void>;
  getChantier: (id: string) => Promise<Chantier | undefined>;
  createChantier: (chantier: Omit<Chantier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateChantier: (id: string, updates: Partial<Chantier>) => Promise<void>;
  deleteChantier: (id: string) => Promise<void>;
  setSelectedChantier: (chantier: Chantier | null) => void;
}

export const useChantierStore = create<ChantierState>((set, get) => ({
  chantiers: [],
  selectedChantier: null,
  loading: false,
  
  loadChantiers: async () => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const chantiers = await syncChantiers.pullAll();
        // Appliquer le statut automatique basé sur la date/heure
        set({ chantiers: applyAutoStatusToList(chantiers), loading: false });
        return;
      }
    } catch (e) { console.error('Erreur sync chantiers:', e); }
    const chantiers = await db.chantiers.orderBy('startDatetime').toArray();
    // Appliquer le statut automatique basé sur la date/heure
    set({ chantiers: applyAutoStatusToList(chantiers), loading: false });
  },
  
  loadChantiersByTechnician: async (technicianId: string) => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const chantiers = await syncChantiers.pullByTechnician(technicianId);
        // Appliquer le statut automatique basé sur la date/heure
        set({ chantiers: applyAutoStatusToList(chantiers), loading: false });
        return;
      }
    } catch (e) { console.error('Erreur sync chantiers tech:', e); }
    const allChantiers = await db.chantiers.toArray();
    const chantiers = allChantiers.filter(c => c.technicianIds.includes(technicianId));
    // Appliquer le statut automatique basé sur la date/heure
    set({ chantiers: applyAutoStatusToList(chantiers), loading: false });
  },
  
  getChantier: async (id: string) => await db.chantiers.get(id),
  
  createChantier: async (chantierData) => {
    console.log('[Chantier] Création chantier:', chantierData.clientName);
    console.log('[Chantier] Supabase configuré:', isSupabaseConfigured());
    
    try {
      if (isSupabaseConfigured()) {
        console.log('[Chantier] Envoi vers Supabase...');
        const id = await syncChantiers.create(chantierData);
        console.log('[Chantier] ✅ Créé dans Supabase avec ID:', id);
        await get().loadChantiers();
        return id;
      } else {
        console.log('[Chantier] ⚠️ Supabase non configuré, création locale uniquement');
      }
    } catch (e) { 
      console.error('[Chantier] ❌ Erreur création chantier:', e); 
    }
    
    // Fallback local
    const id = generateUUID();
    const now = new Date();
    const chantier: Chantier = { ...chantierData, id, createdAt: now, updatedAt: now };
    await db.chantiers.add(chantier);
    console.log('[Chantier] Créé localement avec ID:', id);
    
    for (const techId of chantier.technicianIds) {
      await db.notifications.add({
        id: generateUUID(), userId: techId,
        title: 'Nouveau chantier assigné',
        message: `Vous êtes assigné au chantier chez ${chantier.clientName}`,
        type: 'new_chantier', relatedId: id, isRead: false, createdAt: now
      });
    }
    await get().loadChantiers();
    return id;
  },
  
  updateChantier: async (id, updates) => {
    try {
      if (isSupabaseConfigured()) {
        await syncChantiers.update(id, updates);
        await get().loadChantiers();
        return;
      }
    } catch (e) { console.error('Erreur update chantier:', e); }
    await db.chantiers.update(id, { ...updates, updatedAt: new Date() });
    await get().loadChantiers();
  },
  
  deleteChantier: async (id) => {
    try {
      if (isSupabaseConfigured()) {
        await syncChantiers.delete(id);
        await get().loadChantiers();
        return;
      }
    } catch (e) { console.error('Erreur delete chantier:', e); }
    await db.chantiers.delete(id);
    await get().loadChantiers();
  },
  
  setSelectedChantier: (chantier) => set({ selectedChantier: chantier })
}));

// ============================================
// STORE RAPPORTS
// ============================================

interface RapportState {
  rapports: Rapport[];
  currentRapport: Partial<Rapport> | null;
  currentPhotos: string[];
  loading: boolean;
  loadRapports: () => Promise<void>;
  startRapport: (chantierId: string, technicianId: string) => void;
  updateCurrentRapport: (updates: Partial<Rapport>) => void;
  addPhoto: (photo: string) => void;
  removePhoto: (index: number) => void;
  submitRapport: () => Promise<void>;
  clearCurrentRapport: () => void;
}

export const useRapportStore = create<RapportState>((set, get) => ({
  rapports: [],
  currentRapport: null,
  currentPhotos: [],
  loading: false,
  
  loadRapports: async () => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const rapports = await syncRapports.pullAll();
        set({ rapports, loading: false });
        return;
      }
    } catch (e) { console.error(e); }
    const rapports = await db.rapports.orderBy('createdAt').reverse().toArray();
    set({ rapports, loading: false });
  },
  
  startRapport: (chantierId: string, technicianId: string) => {
    set({
      currentRapport: {
        id: generateUUID(), chantierId, technicianId, startTime: new Date(),
        quantitiesUsed: [], hasProblems: false, hasExtraWork: false, photos: [],
        status: 'draft', createdAt: new Date()
      },
      currentPhotos: []
    });
  },
  
  updateCurrentRapport: (updates) => {
    const current = get().currentRapport;
    if (current) set({ currentRapport: { ...current, ...updates } });
  },
  
  addPhoto: (photo: string) => set({ currentPhotos: [...get().currentPhotos, photo] }),
  removePhoto: (index: number) => set({ currentPhotos: get().currentPhotos.filter((_, i) => i !== index) }),
  
  submitRapport: async () => {
    const rapport = get().currentRapport as Rapport;
    const photos = get().currentPhotos;
    if (!rapport) return;
    
    rapport.status = 'submitted';
    rapport.endTime = rapport.endTime || new Date();
    const isOnline = navigator.onLine && isSupabaseConfigured();
    
    console.log('[Rapport] Soumission rapport, online:', isOnline);
    
    if (isOnline) {
      try {
        await syncRapports.submit(rapport, photos);
        rapport.syncedAt = new Date();
        console.log('[Rapport] ✅ Rapport soumis avec succès');
      } catch (e) {
        console.error('[Rapport] ❌ Erreur submit rapport:', e);
        await db.pendingSync.add({ id: generateUUID(), type: 'rapport', data: { rapport, photos }, createdAt: new Date() });
      }
    } else {
      await db.rapports.add(rapport);
      await db.chantiers.update(rapport.chantierId, { status: 'termine', updatedAt: new Date() });
      await db.pendingSync.add({ id: generateUUID(), type: 'rapport', data: { rapport, photos }, createdAt: new Date() });
    }
    
    set({ currentRapport: null, currentPhotos: [] });
    await get().loadRapports();
    
    // IMPORTANT: Recharger les chantiers pour mettre à jour le statut
    // Force le rechargement depuis Supabase
    const chantierStore = useChantierStore.getState();
    
    // D'abord essayer de recharger tous les chantiers (pour admin)
    // puis recharger les chantiers du technicien
    try {
      await chantierStore.loadChantiers();
      console.log('[Rapport] ✅ Tous les chantiers rechargés');
    } catch (e) {
      console.log('[Rapport] Rechargement chantiers échoué, probablement technicien');
    }
    
    // Aussi mettre à jour localement le chantier concerné
    const chantierId = rapport.chantierId;
    try {
      await db.chantiers.update(chantierId, { status: 'termine', updatedAt: new Date() });
      console.log('[Rapport] ✅ Chantier local mis à jour:', chantierId);
    } catch (e) {
      console.log('[Rapport] Erreur mise à jour locale:', e);
    }
  },
  
  clearCurrentRapport: () => set({ currentRapport: null, currentPhotos: [] })
}));

// ============================================
// STORE ALERTES
// ============================================

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  loadAlerts: () => Promise<void>;
  createAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  loading: false,
  
  loadAlerts: async () => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const alerts = await syncAlerts.pullAll();
        await db.alerts.clear();
        await db.alerts.bulkAdd(alerts);
        set({ alerts, unreadCount: alerts.filter(a => !a.isRead).length, loading: false });
        return;
      }
    } catch (e) { console.error(e); }
    const alerts = await db.alerts.orderBy('createdAt').reverse().toArray();
    set({ alerts, unreadCount: alerts.filter(a => !a.isRead).length, loading: false });
  },
  
  createAlert: async (alertData) => {
    const isOnline = navigator.onLine && isSupabaseConfigured();
    if (isOnline) {
      try {
        await syncAlerts.create(alertData);
      } catch (e) {
        await db.pendingSync.add({ id: `sync-${Date.now()}`, type: 'alert', data: alertData, createdAt: new Date() });
      }
    } else {
      await db.alerts.add({ ...alertData, id: `alert-${Date.now()}`, isRead: false, createdAt: new Date() });
      await db.pendingSync.add({ id: `sync-${Date.now()}`, type: 'alert', data: alertData, createdAt: new Date() });
    }
    await get().loadAlerts();
  },
  
  markAsRead: async (id: string) => {
    try { if (isSupabaseConfigured()) await syncAlerts.markAsRead(id); } catch (e) { console.error(e); }
    await db.alerts.update(id, { isRead: true });
    await get().loadAlerts();
  },
  
  markAllAsRead: async () => {
    const alerts = await db.alerts.toArray();
    for (const alert of alerts.filter(a => !a.isRead)) {
      try { if (isSupabaseConfigured()) await syncAlerts.markAsRead(alert.id); } catch (e) {}
      await db.alerts.update(alert.id, { isRead: true });
    }
    await get().loadAlerts();
  }
}));

// ============================================
// STORE NOTIFICATIONS
// ============================================

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  
  loadNotifications: async (userId: string) => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const notifications = await syncNotifications.pullByUser(userId);
        set({ notifications, unreadCount: notifications.filter(n => !n.isRead).length, loading: false });
        return;
      }
    } catch (e) { console.error(e); }
    const notifications = await db.notifications.where('userId').equals(userId).reverse().sortBy('createdAt');
    set({ notifications, unreadCount: notifications.filter(n => !n.isRead).length, loading: false });
  },
  
  markAsRead: async (id: string) => {
    try { if (isSupabaseConfigured()) await syncNotifications.markAsRead(id); } catch (e) {}
    await db.notifications.update(id, { isRead: true });
    const user = useAuthStore.getState().user;
    if (user) await get().loadNotifications(user.id);
  },
  
  markAllAsRead: async (userId: string) => {
    try { if (isSupabaseConfigured()) await syncNotifications.markAllAsRead(userId); } catch (e) {}
    const notifs = await db.notifications.where('userId').equals(userId).toArray();
    for (const n of notifs.filter(n => !n.isRead)) await db.notifications.update(n.id, { isRead: true });
    await get().loadNotifications(userId);
  }
}));

// ============================================
// STORE UTILISATEURS
// ============================================

interface UserState {
  users: User[];
  technicians: User[];
  admins: User[];
  loading: boolean;
  loadUsers: () => Promise<void>;
  getUser: (id: string) => Promise<User | undefined>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  technicians: [],
  admins: [],
  loading: false,
  
  loadUsers: async () => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const users = await syncUsers.pullAll();
        set({ 
          users, 
          technicians: users.filter(u => u.role === 'technicien'),
          admins: users.filter(u => u.role === 'admin'),
          loading: false 
        });
        return;
      }
    } catch (e) { console.error(e); }
    const users = await db.users.toArray();
    set({ 
      users, 
      technicians: users.filter(u => u.role === 'technicien'),
      admins: users.filter(u => u.role === 'admin'),
      loading: false 
    });
  },
  
  getUser: async (id: string) => await db.users.get(id)
}));

// ============================================
// STORE TYPES DE TRAVAUX
// ============================================

interface WorkTypeState {
  workTypes: WorkType[];
  loading: boolean;
  loadWorkTypes: () => Promise<void>;
}

export const useWorkTypeStore = create<WorkTypeState>((set) => ({
  workTypes: [],
  loading: false,
  
  loadWorkTypes: async () => {
    set({ loading: true });
    try {
      if (isSupabaseConfigured()) {
        const workTypes = await syncWorkTypes.pullAll();
        set({ workTypes, loading: false });
        return;
      }
    } catch (e) { console.error(e); }
    const workTypes = await db.workTypes.toArray();
    set({ workTypes, loading: false });
  }
}));

// ============================================
// STORE SYNCHRONISATION
// ============================================

interface SyncState {
  isOnline: boolean;
  pendingSync: number;
  lastSyncAt?: Date;
  isSyncing: boolean;
  updateOnlineStatus: (status: boolean) => void;
  checkPendingSync: () => Promise<void>;
  syncPendingData: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: navigator.onLine,
  pendingSync: 0,
  lastSyncAt: undefined,
  isSyncing: false,
  
  updateOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    if (status) get().syncPendingData();
  },
  
  checkPendingSync: async () => {
    const pending = await db.pendingSync.count();
    set({ pendingSync: pending });
  },
  
  syncPendingData: async () => {
    if (!navigator.onLine || !isSupabaseConfigured()) return;
    if (get().isSyncing) return;
    
    set({ isSyncing: true });
    try {
      await SyncManager.pushPending();
      await get().checkPendingSync();
      set({ lastSyncAt: new Date() });
    } catch (e) {
      console.error('Erreur sync pending:', e);
    } finally {
      set({ isSyncing: false });
    }
  },
  
  forceSync: async () => {
    if (!isSupabaseConfigured()) return;
    set({ isSyncing: true });
    try {
      await SyncManager.pullAll();
      await SyncManager.pushPending();
      set({ lastSyncAt: new Date(), pendingSync: 0 });
    } catch (e) {
      console.error('Erreur force sync:', e);
    } finally {
      set({ isSyncing: false });
    }
  }
}));
