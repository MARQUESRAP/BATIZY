import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Rapport, Chantier, User } from '../types';

export function generateRapportPDF(
  rapport: Rapport, 
  chantier: Chantier, 
  technician: User | undefined
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Couleurs
  const primaryColor = '#2563eb';
  const grayColor = '#6b7280';

  // === EN-TÊTE ===
  doc.setFillColor(37, 99, 235); // Bleu BTP
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Batizy', margin, 18);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport de chantier', margin, 28);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth - margin - 60, 28);

  yPos = 55;

  // === INFORMATIONS CHANTIER ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations du chantier', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  
  // Client
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(chantier.clientName, margin + 40, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(chantier.address, margin + 40, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Type:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(chantier.workType, margin + 40, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Téléphone:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(chantier.clientPhone, margin + 40, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Technicien:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(technician?.name || 'Non assigné', margin + 40, yPos);

  yPos += 15;

  // === HORAIRES ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Horaires d\'intervention', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(format(chantier.startDatetime, 'EEEE dd MMMM yyyy', { locale: fr }), margin + 40, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Début:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(rapport.startTime ? format(rapport.startTime, 'HH:mm', { locale: fr }) : '-', margin + 40, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fin:', margin + 80, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(rapport.endTime ? format(rapport.endTime, 'HH:mm', { locale: fr }) : '-', margin + 100, yPos);
  
  // Durée
  if (rapport.startTime && rapport.endTime) {
    const diff = rapport.endTime.getTime() - rapport.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const duration = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes} min`;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Durée:', margin + 130, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(duration, margin + 155, yPos);
  }

  yPos += 15;

  // === MATÉRIAUX UTILISÉS ===
  if (rapport.quantitiesUsed && rapport.quantitiesUsed.length > 0) {
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Matériaux utilisés', margin, yPos);
    
    yPos += 10;
    doc.setDrawColor(37, 99, 235);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // En-têtes tableau
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Matériau', margin + 5, yPos);
    doc.text('Quantité', margin + 100, yPos);
    doc.text('Unité', margin + 140, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    
    rapport.quantitiesUsed.forEach((item) => {
      if (item.quantity > 0) {
        doc.text(item.material, margin + 5, yPos);
        doc.text(item.quantity.toString(), margin + 100, yPos);
        doc.text(item.unit, margin + 140, yPos);
        yPos += 8;
      }
    });
    
    yPos += 7;
  }

  // === PROBLÈMES ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Problèmes rencontrés', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  if (rapport.hasProblems) {
    doc.setTextColor(234, 88, 12); // Orange
    doc.setFont('helvetica', 'bold');
    doc.text('Oui - Problème signalé', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    if (rapport.problemsDescription) {
      const lines = doc.splitTextToSize(rapport.problemsDescription, pageWidth - 2 * margin - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 6;
    }
  } else {
    doc.setTextColor(22, 163, 74); // Vert
    doc.text('Aucun problème signalé', margin, yPos);
    doc.setTextColor(0, 0, 0);
  }
  
  yPos += 10;

  // === TRAVAUX SUPPLÉMENTAIRES ===
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Travaux supplémentaires', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  if (rapport.hasExtraWork) {
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text('Oui - Travaux supplémentaires effectués', margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    if (rapport.extraWorkDescription) {
      const lines = doc.splitTextToSize(rapport.extraWorkDescription, pageWidth - 2 * margin - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 6;
    }
  } else {
    doc.text('Aucun travail supplémentaire', margin, yPos);
  }
  
  yPos += 15;

  // === PHOTOS ===
  const photoUrls = rapport.photoUrls || [];
  if (photoUrls.length > 0) {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Photos du chantier', margin, yPos);
    
    yPos += 10;
    doc.setDrawColor(37, 99, 235);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${photoUrls.length} photo(s) jointe(s) au rapport`, margin, yPos);
    
    yPos += 10;

    // Ajouter les photos (2 par ligne)
    const photoWidth = 80;
    const photoHeight = 60;
    let xPos = margin;
    
    for (let i = 0; i < photoUrls.length; i++) {
      const photo = photoUrls[i];
      
      // Nouvelle page si nécessaire
      if (yPos + photoHeight > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
        xPos = margin;
      }
      
      try {
        // Si c'est une URL base64 ou une URL d'image
        if (photo.startsWith('data:image') || photo.startsWith('http')) {
          doc.addImage(photo, 'JPEG', xPos, yPos, photoWidth, photoHeight);
        }
      } catch (e) {
        // Si l'image ne peut pas être chargée, afficher un placeholder
        doc.setFillColor(240, 240, 240);
        doc.rect(xPos, yPos, photoWidth, photoHeight, 'F');
        doc.setTextColor(150, 150, 150);
        doc.text('Photo non disponible', xPos + 10, yPos + 30);
      }
      
      // Passer à la colonne suivante ou à la ligne suivante
      if ((i + 1) % 2 === 0) {
        xPos = margin;
        yPos += photoHeight + 10;
      } else {
        xPos = margin + photoWidth + 10;
      }
    }
    
    // Réajuster yPos si on a fini sur une colonne impaire
    if (photoUrls.length % 2 !== 0) {
      yPos += photoHeight + 10;
    }
  }

  // === SIGNATURE CLIENT ===
  // Vérifier si on a besoin d'une nouvelle page
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature du client', margin, yPos);
  
  yPos += 10;
  doc.setDrawColor(37, 99, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;

  if (rapport.clientSignature) {
    try {
      // Ajouter l'image de signature (base64)
      doc.addImage(rapport.clientSignature, 'PNG', margin, yPos, 60, 30);
      yPos += 35;
    } catch (e) {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(10);
      doc.text('[Signature enregistrée]', margin, yPos);
      yPos += 10;
    }
  } else {
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.text('Signature non disponible', margin, yPos);
  }

  // === PIED DE PAGE ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.text(
      `Rapport généré automatiquement par Batizy - ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Page ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
  }

  // Sauvegarder le PDF
  const fileName = `rapport_${chantier.clientName.replace(/\s+/g, '_')}_${format(chantier.startDatetime, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
