// Types principaux pour ChantierPro

export type UserRole = 'admin' | 'technicien';

export interface User {
  id: string;
  name: string;
  code: string;
  role: UserRole;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
}

export type ChantierStatus = 'a_venir' | 'en_cours' | 'termine';

export interface Chantier {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  address: string;
  workType: string;
  startDatetime: Date;
  endDatetime: Date;
  status: ChantierStatus;
  notes?: string;
  technicianIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PhotoType = 'before' | 'after' | 'problem' | 'extra_work';

export interface RapportPhoto {
  id: string;
  rapportId: string;
  photoType: PhotoType;
  photoUrl: string; // base64 ou URL
  createdAt: Date;
}

export interface QuantityUsed {
  material: string;
  quantity: number;
  unit: string;
}

export type RapportStatus = 'draft' | 'submitted';

export interface Rapport {
  id: string;
  chantierId: string;
  technicianId: string;
  startTime: Date;
  endTime?: Date;
  quantitiesUsed: QuantityUsed[];
  hasProblems: boolean;
  problemsDescription?: string;
  problemPhotos?: string[];
  hasExtraWork: boolean;
  extraWorkDescription?: string;
  extraWorkPhotos?: string[];
  clientSignature?: string; // base64
  photos: RapportPhoto[];
  photoUrls?: string[]; // URLs des photos uploadées
  status: RapportStatus;
  createdAt: Date;
  syncedAt?: Date;
}

export type AlertType = 'retard' | 'annulation' | 'besoin_materiel' | 'autre';

export interface Alert {
  id: string;
  chantierId: string;
  technicianId: string;
  alertType: AlertType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType = 'new_chantier' | 'modification' | 'rapport' | 'alert';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface WorkType {
  id: string;
  name: string;
  materials: Material[];
}

export interface Material {
  name: string;
  unit: string;
  defaultQuantity?: number;
}

// État de synchronisation pour le mode offline
export interface SyncStatus {
  isOnline: boolean;
  pendingSync: number;
  lastSyncAt?: Date;
}

// Pour le calendrier
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: ChantierStatus;
  technicianIds: string[];
  chantier: Chantier;
}

// Stats pour le dashboard
export interface DashboardStats {
  totalChantiers: number;
  chantiersEnCours: number;
  chantiersAVenir: number;
  chantiersTermines: number;
  alertesNonLues: number;
  rapportsAujourdhui: number;
}
