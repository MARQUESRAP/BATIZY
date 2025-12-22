import { supabase, isSupabaseConfigured } from './supabase';

// ============================================
// SERVICE DE STOCKAGE PHOTOS - SUPABASE STORAGE
// ============================================

const BUCKET_NAME = 'rapport-photos';

/**
 * Convertit une image base64 en Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Génère un nom de fichier unique
 */
function generateFileName(rapportId: string, index: number): string {
  const timestamp = Date.now();
  return `${rapportId}/${timestamp}_${index}.jpg`;
}

/**
 * Upload une photo vers Supabase Storage
 */
export async function uploadPhoto(
  base64Image: string, 
  rapportId: string, 
  index: number
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.log('[Storage] Supabase non configuré, photo stockée localement');
    return base64Image; // Retourne l'image base64 si pas de Supabase
  }

  try {
    const blob = base64ToBlob(base64Image);
    const fileName = generateFileName(rapportId, index);
    
    console.log('[Storage] Upload photo:', fileName);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('[Storage] Erreur upload:', error);
      // Si le bucket n'existe pas, on retourne l'image base64
      if (error.message.includes('Bucket not found')) {
        console.log('[Storage] Bucket non trouvé, création nécessaire dans Supabase');
        return base64Image;
      }
      return base64Image;
    }
    
    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    console.log('[Storage] ✅ Photo uploadée:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (e) {
    console.error('[Storage] Erreur:', e);
    return base64Image;
  }
}

/**
 * Upload plusieurs photos
 */
export async function uploadPhotos(
  base64Images: string[], 
  rapportId: string
): Promise<string[]> {
  const urls: string[] = [];
  
  for (let i = 0; i < base64Images.length; i++) {
    const url = await uploadPhoto(base64Images[i], rapportId, i);
    if (url) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Supprime une photo
 */
export async function deletePhoto(photoUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !photoUrl.includes('supabase')) {
    return true;
  }

  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = photoUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return true;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('[Storage] Erreur suppression:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[Storage] Erreur:', e);
    return false;
  }
}

/**
 * Supprime toutes les photos d'un rapport
 */
export async function deleteRapportPhotos(rapportId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(rapportId);
    
    if (listError || !files || files.length === 0) return true;
    
    const filePaths = files.map(f => `${rapportId}/${f.name}`);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);
    
    if (error) {
      console.error('[Storage] Erreur suppression photos rapport:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[Storage] Erreur:', e);
    return false;
  }
}
