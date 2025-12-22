import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO, isBefore, isAfter, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChantierStatus, AlertType, Chantier } from '../types';

// ============================================
// CALCUL AUTOMATIQUE DU STATUT DES CHANTIERS
// ============================================

/**
 * Calcule le statut d'un chantier en fonction de la date/heure actuelle
 * - À venir : la date de début est dans le futur
 * - En cours : on est entre la date de début et la date de fin
 * - Terminé : la date de fin est passée OU le chantier a été marqué terminé manuellement
 */
export function calculateChantierStatus(startDatetime: Date, endDatetime: Date): ChantierStatus {
  const now = new Date();
  
  // Si la date de fin est passée → Terminé
  if (isBefore(endDatetime, now)) {
    return 'termine';
  }
  
  // Si la date de début est dans le futur → À venir
  if (isAfter(startDatetime, now)) {
    return 'a_venir';
  }
  
  // Sinon, on est entre les deux → En cours
  return 'en_cours';
}

/**
 * Applique le statut calculé automatiquement à un chantier
 * IMPORTANT: Ne pas écraser le statut "termine" s'il a été défini par un rapport
 */
export function applyAutoStatus(chantier: Chantier): Chantier {
  // Si le chantier est déjà terminé (via rapport), NE PAS le modifier
  if (chantier.status === 'termine') {
    return chantier;
  }
  
  const calculatedStatus = calculateChantierStatus(chantier.startDatetime, chantier.endDatetime);
  return {
    ...chantier,
    status: calculatedStatus
  };
}

/**
 * Applique le statut calculé automatiquement à une liste de chantiers
 */
export function applyAutoStatusToList(chantiers: Chantier[]): Chantier[] {
  return chantiers.map(applyAutoStatus);
}

// ============================================
// FORMATAGE DES DATES
// ============================================

// Formatage des dates
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMMM yyyy', { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd MMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: fr });
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return 'Demain';
  if (isYesterday(d)) return 'Hier';
  
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function formatDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE', { locale: fr });
}

// Formatage du statut
export function getStatusLabel(status: ChantierStatus): string {
  const labels: Record<ChantierStatus, string> = {
    'a_venir': 'À venir',
    'en_cours': 'En cours',
    'termine': 'Terminé'
  };
  return labels[status];
}

export function getStatusColor(status: ChantierStatus): string {
  const colors: Record<ChantierStatus, string> = {
    'a_venir': 'blue',
    'en_cours': 'orange',
    'termine': 'green'
  };
  return colors[status];
}

export function getStatusBadgeClass(status: ChantierStatus): string {
  const classes: Record<ChantierStatus, string> = {
    'a_venir': 'badge-upcoming',
    'en_cours': 'badge-inprogress',
    'termine': 'badge-completed'
  };
  return classes[status];
}

// Formatage des alertes
export function getAlertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    'retard': 'Retard',
    'annulation': 'Annulation',
    'besoin_materiel': 'Besoin matériel',
    'autre': 'Autre'
  };
  return labels[type];
}

export function getAlertTypeIcon(type: AlertType): string {
  const icons: Record<AlertType, string> = {
    'retard': '⏰',
    'annulation': '❌',
    'besoin_materiel': '🔧',
    'autre': '❗'
  };
  return icons[type];
}

// Génération d'ID unique
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validation
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s/g, '');
  return /^(0|\+33)[1-9][0-9]{8}$/.test(cleanPhone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Formatage téléphone pour affichage
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

// Création de lien téléphonique
export function getPhoneLink(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  return `tel:+33${clean.slice(1)}`;
}

// Création de lien Google Maps
export function getMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Compression d'image pour upload
export async function compressImage(file: File, maxSizeMB: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Redimensionner si nécessaire
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compression avec qualité adaptative
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        // Réduire la qualité si trop gros
        while (result.length > maxSizeMB * 1024 * 1024 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(result);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Calcul de durée entre deux dates
export function calculateDuration(start: Date, end: Date): string {
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

// Grouper les chantiers par date
export function groupChantiersByDate<T extends { startDatetime: Date }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  items.forEach(item => {
    const dateKey = format(item.startDatetime, 'yyyy-MM-dd');
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, item]);
  });
  
  return groups;
}

// Obtenir les initiales d'un nom
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Couleurs pour les avatars des techniciens
export function getTechnicianColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500'
  ];
  return colors[index % colors.length];
}

// Export CSV
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        if (value instanceof Date) {
          return format(value, 'yyyy-MM-dd HH:mm');
        }
        return String(value);
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}
