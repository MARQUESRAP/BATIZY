import { jsPDF } from 'jspdf';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Chantier, Rapport, User, WorkType } from '../types';

// ============================================
// EXPORT CSV
// ============================================

/**
 * Convertit des données en CSV et déclenche le téléchargement
 */
function downloadCSV(data: string[][], filename: string) {
  const csvContent = data.map(row => 
    row.map(cell => {
      // Échapper les guillemets et entourer de guillemets si nécessaire
      const escaped = String(cell || '').replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
        ? `"${escaped}"` 
        : escaped;
    }).join(',')
  ).join('\n');

  // Ajouter BOM pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

/**
 * Export des chantiers en CSV
 */
export function exportChantiersCSV(chantiers: Chantier[], technicians: User[]) {
  const headers = [
    'ID', 'Client', 'Téléphone', 'Email', 'Adresse', 'Type de travaux',
    'Date début', 'Heure début', 'Date fin', 'Heure fin', 'Statut',
    'Techniciens', 'Notes', 'Créé le'
  ];

  const rows = chantiers.map(c => {
    const techs = technicians.filter(t => c.technicianIds.includes(t.id));
    return [
      c.id,
      c.clientName,
      c.clientPhone,
      c.clientEmail || '',
      c.address,
      c.workType,
      format(c.startDatetime, 'dd/MM/yyyy'),
      format(c.startDatetime, 'HH:mm'),
      format(c.endDatetime, 'dd/MM/yyyy'),
      format(c.endDatetime, 'HH:mm'),
      c.status === 'termine' ? 'Terminé' : c.status === 'en_cours' ? 'En cours' : 'À venir',
      techs.map(t => t.name).join('; '),
      c.notes || '',
      format(c.createdAt, 'dd/MM/yyyy HH:mm')
    ];
  });

  downloadCSV([headers, ...rows], 'chantiers');
}

/**
 * Export des rapports en CSV
 */
export function exportRapportsCSV(rapports: Rapport[], chantiers: Chantier[], technicians: User[]) {
  const headers = [
    'ID', 'Chantier', 'Client', 'Technicien', 'Date',
    'Heure début', 'Heure fin', 'Durée (min)',
    'Problèmes', 'Description problème',
    'Travaux supplémentaires', 'Description travaux',
    'Nb matériaux', 'Statut', 'Créé le'
  ];

  const rows = rapports.map(r => {
    const chantier = chantiers.find(c => c.id === r.chantierId);
    const tech = technicians.find(t => t.id === r.technicianId);
    
    let duration = 0;
    if (r.startTime && r.endTime) {
      duration = Math.round((r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60));
    }

    return [
      r.id,
      chantier?.clientName || 'Inconnu',
      chantier?.clientName || '',
      tech?.name || 'Inconnu',
      r.startTime ? format(r.startTime, 'dd/MM/yyyy') : '',
      r.startTime ? format(r.startTime, 'HH:mm') : '',
      r.endTime ? format(r.endTime, 'HH:mm') : '',
      duration.toString(),
      r.hasProblems ? 'Oui' : 'Non',
      r.problemsDescription || '',
      r.hasExtraWork ? 'Oui' : 'Non',
      r.extraWorkDescription || '',
      (r.quantitiesUsed?.filter(q => q.quantity > 0).length || 0).toString(),
      r.status === 'submitted' ? 'Soumis' : 'Brouillon',
      format(r.createdAt, 'dd/MM/yyyy HH:mm')
    ];
  });

  downloadCSV([headers, ...rows], 'rapports');
}

/**
 * Export des techniciens en CSV
 */
export function exportTechniciensCSV(technicians: User[], chantiers: Chantier[], rapports: Rapport[]) {
  const headers = [
    'ID', 'Nom', 'Code', 'Téléphone', 'Email', 'Actif',
    'Nb chantiers total', 'Nb chantiers terminés', 'Nb rapports', 'Créé le'
  ];

  const rows = technicians.map(t => {
    const techChantiers = chantiers.filter(c => c.technicianIds.includes(t.id));
    const techRapports = rapports.filter(r => r.technicianId === t.id);
    
    return [
      t.id,
      t.name,
      t.code,
      t.phone || '',
      t.email || '',
      t.isActive ? 'Oui' : 'Non',
      techChantiers.length.toString(),
      techChantiers.filter(c => c.status === 'termine').length.toString(),
      techRapports.length.toString(),
      format(t.createdAt, 'dd/MM/yyyy')
    ];
  });

  downloadCSV([headers, ...rows], 'techniciens');
}

// ============================================
// RAPPORT MENSUEL PDF
// ============================================

interface MonthlyStats {
  totalChantiers: number;
  chantiersTermines: number;
  chantiersEnCours: number;
  chantiersAVenir: number;
  totalRapports: number;
  rapportsAvecProblemes: number;
  rapportsAvecTravauxSupp: number;
  totalHeures: number;
  chantiersByType: Record<string, number>;
  chantiersByTech: Record<string, number>;
}

function calculateMonthlyStats(
  chantiers: Chantier[], 
  rapports: Rapport[], 
  technicians: User[],
  month: Date
): MonthlyStats {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Filtrer les chantiers du mois
  const monthChantiers = chantiers.filter(c => {
    const startDate = new Date(c.startDatetime);
    return startDate >= monthStart && startDate <= monthEnd;
  });

  // Filtrer les rapports du mois
  const monthRapports = rapports.filter(r => {
    const date = new Date(r.createdAt);
    return date >= monthStart && date <= monthEnd;
  });

  // Calculer les heures totales
  let totalMinutes = 0;
  monthRapports.forEach(r => {
    if (r.startTime && r.endTime) {
      totalMinutes += (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60);
    }
  });

  // Chantiers par type
  const chantiersByType: Record<string, number> = {};
  monthChantiers.forEach(c => {
    chantiersByType[c.workType] = (chantiersByType[c.workType] || 0) + 1;
  });

  // Chantiers par technicien
  const chantiersByTech: Record<string, number> = {};
  monthChantiers.forEach(c => {
    c.technicianIds.forEach(techId => {
      const tech = technicians.find(t => t.id === techId);
      const name = tech?.name || 'Inconnu';
      chantiersByTech[name] = (chantiersByTech[name] || 0) + 1;
    });
  });

  return {
    totalChantiers: monthChantiers.length,
    chantiersTermines: monthChantiers.filter(c => c.status === 'termine').length,
    chantiersEnCours: monthChantiers.filter(c => c.status === 'en_cours').length,
    chantiersAVenir: monthChantiers.filter(c => c.status === 'a_venir').length,
    totalRapports: monthRapports.length,
    rapportsAvecProblemes: monthRapports.filter(r => r.hasProblems).length,
    rapportsAvecTravauxSupp: monthRapports.filter(r => r.hasExtraWork).length,
    totalHeures: Math.round(totalMinutes / 60),
    chantiersByType,
    chantiersByTech
  };
}

/**
 * Génère un rapport mensuel en PDF
 */
export function generateMonthlyReport(
  chantiers: Chantier[],
  rapports: Rapport[],
  technicians: User[],
  month: Date = new Date()
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  const stats = calculateMonthlyStats(chantiers, rapports, technicians, month);
  const monthName = format(month, 'MMMM yyyy', { locale: fr });

  // === EN-TÊTE ===
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Batizy', margin, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport mensuel', margin, 32);
  
  doc.setFontSize(12);
  doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth - margin - 50, 32);

  yPos = 60;

  // === RÉSUMÉ ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé du mois', margin, yPos);
  
  yPos += 15;
  
  // Boxes de stats
  const boxWidth = (pageWidth - 2 * margin - 30) / 4;
  const boxHeight = 35;
  const boxes = [
    { label: 'Chantiers', value: stats.totalChantiers.toString(), color: [37, 99, 235] },
    { label: 'Terminés', value: stats.chantiersTermines.toString(), color: [22, 163, 74] },
    { label: 'Rapports', value: stats.totalRapports.toString(), color: [147, 51, 234] },
    { label: 'Heures', value: `${stats.totalHeures}h`, color: [234, 88, 12] }
  ];

  boxes.forEach((box, i) => {
    const x = margin + i * (boxWidth + 10);
    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(box.value, x + boxWidth / 2, yPos + 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(box.label, x + boxWidth / 2, yPos + 27, { align: 'center' });
  });

  yPos += boxHeight + 20;

  // === RÉPARTITION PAR TYPE ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Répartition par type de travaux', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const types = Object.entries(stats.chantiersByType).sort((a, b) => b[1] - a[1]);
  if (types.length === 0) {
    doc.text('Aucun chantier ce mois-ci', margin, yPos);
    yPos += 10;
  } else {
    types.forEach(([type, count]) => {
      const percentage = Math.round((count / stats.totalChantiers) * 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`${type}:`, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`${count} (${percentage}%)`, margin + 80, yPos);
      
      // Barre de progression
      const barWidth = 60;
      const barHeight = 4;
      const barX = margin + 120;
      doc.setFillColor(229, 231, 235);
      doc.rect(barX, yPos - 3, barWidth, barHeight, 'F');
      doc.setFillColor(37, 99, 235);
      doc.rect(barX, yPos - 3, barWidth * (percentage / 100), barHeight, 'F');
      
      yPos += 10;
    });
  }

  yPos += 10;

  // === RÉPARTITION PAR TECHNICIEN ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Répartition par technicien', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  const techs = Object.entries(stats.chantiersByTech).sort((a, b) => b[1] - a[1]);
  if (techs.length === 0) {
    doc.text('Aucun technicien assigné ce mois-ci', margin, yPos);
    yPos += 10;
  } else {
    techs.forEach(([name, count]) => {
      const percentage = Math.round((count / stats.totalChantiers) * 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`${name}:`, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`${count} chantier(s)`, margin + 80, yPos);
      yPos += 10;
    });
  }

  yPos += 10;

  // === INCIDENTS ===
  if (stats.rapportsAvecProblemes > 0 || stats.rapportsAvecTravauxSupp > 0) {
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Incidents et travaux supplémentaires', margin, yPos);
    
    yPos += 10;
    doc.setDrawColor(37, 99, 235);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (stats.rapportsAvecProblemes > 0) {
      doc.setTextColor(234, 88, 12);
      doc.text(`⚠ ${stats.rapportsAvecProblemes} rapport(s) avec problème(s) signalé(s)`, margin, yPos);
      yPos += 8;
    }
    
    if (stats.rapportsAvecTravauxSupp > 0) {
      doc.setTextColor(37, 99, 235);
      doc.text(`🔧 ${stats.rapportsAvecTravauxSupp} rapport(s) avec travaux supplémentaires`, margin, yPos);
      yPos += 8;
    }
  }

  // === PIED DE PAGE ===
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(
    `Rapport généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} par Batizy`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  // Sauvegarder
  const fileName = `rapport_mensuel_${format(month, 'yyyy-MM')}.pdf`;
  doc.save(fileName);
}
