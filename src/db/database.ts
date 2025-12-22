import Dexie, { Table } from 'dexie';
import { User, Chantier, Rapport, Alert, Notification, WorkType } from '../types';

// Base de données locale pour le mode offline
export class BatizyDB extends Dexie {
  users!: Table<User>;
  chantiers!: Table<Chantier>;
  rapports!: Table<Rapport>;
  alerts!: Table<Alert>;
  notifications!: Table<Notification>;
  workTypes!: Table<WorkType>;
  pendingSync!: Table<{ id: string; type: string; data: any; createdAt: Date }>;

  constructor() {
    super('BatizyDB');
    
    this.version(1).stores({
      users: 'id, code, role, isActive',
      chantiers: 'id, status, *technicianIds, startDatetime, createdAt',
      rapports: 'id, chantierId, technicianId, status, createdAt',
      alerts: 'id, chantierId, technicianId, isRead, createdAt',
      notifications: 'id, userId, isRead, createdAt',
      workTypes: 'id, name',
      pendingSync: 'id, type, createdAt'
    });
  }
}

export const db = new BatizyDB();

// ============================================
// CODES D'ACCÈS FIXES (pour mode hors-ligne)
// Correspondent aux codes dans Supabase
// ============================================
const DEMO_USERS: User[] = [
  {
    id: 'admin-001',
    name: 'Pierre Dupont',
    code: '0001',
    role: 'admin',
    phone: '0600000001',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'admin-002',
    name: 'Marie Dupont',
    code: '0000',
    role: 'admin',
    phone: '0600000000',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-001',
    name: 'Jean Martin',
    code: '1234',
    role: 'technicien',
    phone: '0611111111',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-002',
    name: 'Luc Bernard',
    code: '2345',
    role: 'technicien',
    phone: '0622222222',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-003',
    name: 'Marc Durand',
    code: '3456',
    role: 'technicien',
    phone: '0633333333',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-004',
    name: 'Paul Moreau',
    code: '4567',
    role: 'technicien',
    phone: '0644444444',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-005',
    name: 'Antoine Lefebvre',
    code: '5678',
    role: 'technicien',
    phone: '0655555555',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-006',
    name: 'Thomas Petit',
    code: '6789',
    role: 'technicien',
    phone: '0666666666',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'tech-007',
    name: 'Nicolas Roux',
    code: '7890',
    role: 'technicien',
    phone: '0677777777',
    isActive: true,
    createdAt: new Date()
  }
];

const DEMO_WORK_TYPES: WorkType[] = [
  {
    id: 'wt-001',
    name: 'Couverture',
    materials: [
      { name: 'Tuiles', unit: 'm²', defaultQuantity: 0 },
      { name: 'Ardoises', unit: 'm²', defaultQuantity: 0 },
      { name: 'Liteaux', unit: 'ml', defaultQuantity: 0 },
      { name: 'Gouttières', unit: 'ml', defaultQuantity: 0 }
    ]
  },
  {
    id: 'wt-002',
    name: 'Plomberie',
    materials: [
      { name: 'Tuyaux cuivre', unit: 'ml', defaultQuantity: 0 },
      { name: 'Tuyaux PVC', unit: 'ml', defaultQuantity: 0 },
      { name: 'Raccords', unit: 'pièces', defaultQuantity: 0 },
      { name: 'Joints', unit: 'pièces', defaultQuantity: 0 }
    ]
  },
  {
    id: 'wt-003',
    name: 'Électricité',
    materials: [
      { name: 'Câble électrique', unit: 'ml', defaultQuantity: 0 },
      { name: 'Prises', unit: 'pièces', defaultQuantity: 0 },
      { name: 'Interrupteurs', unit: 'pièces', defaultQuantity: 0 },
      { name: 'Disjoncteurs', unit: 'pièces', defaultQuantity: 0 }
    ]
  },
  {
    id: 'wt-004',
    name: 'Maçonnerie',
    materials: [
      { name: 'Ciment', unit: 'sacs', defaultQuantity: 0 },
      { name: 'Sable', unit: 'm³', defaultQuantity: 0 },
      { name: 'Parpaings', unit: 'pièces', defaultQuantity: 0 },
      { name: 'Béton', unit: 'm³', defaultQuantity: 0 }
    ]
  }
];

// ============================================
// INITIALISATION - DONNÉES DE DÉMO LOCALES
// ============================================

export async function initializeDemoData() {
  console.log('[DB] Vérification des données locales...');
  
  // Vérifier si les utilisateurs existent déjà
  const existingUsers = await db.users.count();
  
  if (existingUsers === 0) {
    console.log('[DB] Création des utilisateurs de démo...');
    await db.users.bulkAdd(DEMO_USERS);
    console.log('[DB] ✅ Utilisateurs créés');
    console.log('[DB] 📋 Codes d\'accès :');
    console.log('[DB]    Admin: ADMIN123');
    console.log('[DB]    Tech 1: TECH001');
    console.log('[DB]    Tech 2: TECH002');
    console.log('[DB]    Tech 3: TECH003');
  }
  
  // Vérifier les types de travaux
  const existingWorkTypes = await db.workTypes.count();
  
  if (existingWorkTypes === 0) {
    console.log('[DB] Création des types de travaux...');
    await db.workTypes.bulkAdd(DEMO_WORK_TYPES);
    console.log('[DB] ✅ Types de travaux créés');
  }
  
  console.log('[DB] Base locale prête');
}

// Réinitialiser la DB (pour debug)
export async function resetDatabase() {
  console.log('[DB] Réinitialisation de la base locale...');
  await db.delete();
  await db.open();
  console.log('[DB] Base locale réinitialisée');
}

// Vider toutes les données locales
export async function clearAllLocalData() {
  console.log('[DB] Suppression de toutes les données locales...');
  try {
    await db.users.clear();
    await db.chantiers.clear();
    await db.rapports.clear();
    await db.alerts.clear();
    await db.notifications.clear();
    await db.workTypes.clear();
    await db.pendingSync.clear();
    console.log('[DB] ✅ Données locales supprimées');
    // Supprimer aussi le localStorage
    localStorage.clear();
    console.log('[DB] ✅ LocalStorage vidé');
  } catch (e) {
    console.error('[DB] Erreur suppression:', e);
    // En cas d'erreur, supprimer la DB complètement
    await db.delete();
    console.log('[DB] ✅ Base supprimée complètement');
  }
}

// Exposer en global pour debug depuis la console
if (typeof window !== 'undefined') {
  (window as any).resetBatizy = async () => {
    await clearAllLocalData();
    console.log('🔄 Rechargez la page (F5) pour resynchroniser avec Supabase');
    return 'Cache vidé ! Rechargez la page.';
  };
  
  (window as any).clearPendingSync = async () => {
    const count = await db.pendingSync.count();
    await db.pendingSync.clear();
    console.log(`✅ ${count} éléments en attente supprimés`);
    return `${count} éléments supprimés`;
  };
  
  console.log('💡 Commandes disponibles:');
  console.log('  - resetBatizy() : Vide tout le cache local');
  console.log('  - clearPendingSync() : Vide les éléments en attente de sync');
}
