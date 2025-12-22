import { supabase, isSupabaseConfigured } from './supabase';
import { db } from '../db/database';
import type { User, Chantier, Rapport, Alert, Notification, WorkType } from '../types';

// Helper dates
const toISO = (d: Date | string): string => typeof d === 'string' ? d : d.toISOString();
const toDate = (s: string): Date => new Date(s);

// Génère un UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback pour les navigateurs plus anciens
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Debug logger
const log = (msg: string, data?: any) => {
  console.log(`[Sync] ${msg}`, data || '');
};

const logError = (msg: string, error: any) => {
  console.error(`[Sync Error] ${msg}`, error);
};

// ============================================
// USERS
// ============================================
export const syncUsers = {
  async pullAll(): Promise<User[]> {
    if (!isSupabaseConfigured()) {
      log('Supabase non configuré, chargement local');
      return await db.users.toArray();
    }
    
    log('Récupération des utilisateurs depuis Supabase...');
    const { data, error } = await supabase.from('users').select('*').order('name');
    
    if (error) {
      logError('Erreur récupération users', error);
      return await db.users.toArray();
    }
    
    if (!data || data.length === 0) {
      log('Aucun utilisateur dans Supabase');
      return [];
    }
    
    const users: User[] = data.map((u: any) => ({
      id: u.id, name: u.name, code: u.code, role: u.role,
      email: u.email || undefined, phone: u.phone || undefined,
      isActive: u.is_active, createdAt: toDate(u.created_at)
    }));
    
    log(`${users.length} utilisateurs récupérés`);
    
    // Vider et recharger pour éviter les conflits
    try {
      await db.users.clear();
      await db.users.bulkAdd(users);
    } catch (e) {
      logError('Erreur sauvegarde locale users, tentative individuelle', e);
      // Si bulkAdd échoue, essayer un par un avec put (qui écrase)
      for (const user of users) {
        try {
          await db.users.put(user);
        } catch (e2) {
          logError('Erreur put user', e2);
        }
      }
    }
    
    return users;
  },

  async authenticate(code: string): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      log('Auth locale pour code:', code);
      const user = await db.users.where('code').equals(code).first();
      return user && user.isActive ? user : null;
    }
    
    log('Authentification Supabase pour code:', code);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();
    
    if (error) {
      logError('Erreur auth', error);
      // Fallback local
      const user = await db.users.where('code').equals(code).first();
      return user && user.isActive ? user : null;
    }
    
    if (!data) return null;
    
    log('Utilisateur authentifié:', data.name);
    return {
      id: data.id, name: data.name, code: data.code, role: data.role,
      email: data.email || undefined, phone: data.phone || undefined,
      isActive: data.is_active, createdAt: toDate(data.created_at)
    };
  },

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    const id = generateUUID();
    const now = new Date();
    
    if (isSupabaseConfigured()) {
      log('Création utilisateur Supabase:', userData.name);
      const { error } = await supabase.from('users').insert({
        id,
        name: userData.name,
        code: userData.code,
        role: userData.role,
        email: userData.email || null,
        phone: userData.phone || null,
        is_active: userData.isActive,
        created_at: toISO(now)
      });
      
      if (error) {
        logError('Erreur création user', error);
        throw error;
      }
    }
    
    await db.users.add({ ...userData, id, createdAt: now });
    return id;
  }
};

// ============================================
// CHANTIERS
// ============================================
export const syncChantiers = {
  async pullAll(): Promise<Chantier[]> {
    if (!isSupabaseConfigured()) {
      log('Supabase non configuré, chargement local des chantiers');
      return await db.chantiers.toArray();
    }
    
    log('Récupération des chantiers depuis Supabase...');
    const { data: chantiersData, error: chError } = await supabase
      .from('chantiers')
      .select('*')
      .order('start_datetime');
    
    if (chError) {
      logError('Erreur récupération chantiers', chError);
      return await db.chantiers.toArray();
    }
    
    const { data: techData, error: techError } = await supabase
      .from('chantier_technicians')
      .select('*');
    
    if (techError) {
      logError('Erreur récupération techniciens chantiers', techError);
    }
    
    if (!chantiersData || chantiersData.length === 0) {
      log('Aucun chantier dans Supabase');
      await db.chantiers.clear();
      return [];
    }
    
    const chantiers: Chantier[] = chantiersData.map((c: any) => ({
      id: c.id, 
      clientName: c.client_name, 
      clientPhone: c.client_phone,
      clientEmail: c.client_email || undefined, 
      address: c.address, 
      workType: c.work_type,
      startDatetime: toDate(c.start_datetime), 
      endDatetime: toDate(c.end_datetime),
      status: c.status, 
      notes: c.notes || undefined,
      technicianIds: (techData || [])
        .filter((t: any) => t.chantier_id === c.id)
        .map((t: any) => t.technician_id),
      createdBy: c.created_by, 
      createdAt: toDate(c.created_at), 
      updatedAt: toDate(c.updated_at)
    }));
    
    log(`${chantiers.length} chantiers récupérés`);
    
    // Vider et recharger pour éviter les conflits
    try {
      await db.chantiers.clear();
      await db.chantiers.bulkAdd(chantiers);
    } catch (e) {
      logError('Erreur sync chantiers, tentative individuelle', e);
      await db.chantiers.clear();
      for (const ch of chantiers) {
        try {
          await db.chantiers.put(ch);
        } catch (e2) {
          logError('Erreur put chantier', e2);
        }
      }
    }
    
    return chantiers;
  },

  async pullByTechnician(techId: string): Promise<Chantier[]> {
    if (!isSupabaseConfigured()) {
      const allChantiers = await db.chantiers.toArray();
      return allChantiers.filter(c => c.technicianIds.includes(techId));
    }
    
    log('Récupération chantiers pour technicien:', techId);
    const { data: techData, error: techError } = await supabase
      .from('chantier_technicians')
      .select('chantier_id')
      .eq('technician_id', techId);
    
    if (techError) {
      logError('Erreur récupération affectations', techError);
      const allChantiers = await db.chantiers.toArray();
      return allChantiers.filter(c => c.technicianIds.includes(techId));
    }
    
    if (!techData?.length) {
      log('Aucun chantier pour ce technicien');
      return [];
    }
    
    const ids = techData.map((t: any) => t.chantier_id);
    const { data: chantiersData } = await supabase
      .from('chantiers')
      .select('*')
      .in('id', ids);
    
    const { data: allTech } = await supabase
      .from('chantier_technicians')
      .select('*')
      .in('chantier_id', ids);
    
    if (!chantiersData) return [];
    
    const chantiers: Chantier[] = chantiersData.map((c: any) => ({
      id: c.id, 
      clientName: c.client_name, 
      clientPhone: c.client_phone,
      clientEmail: c.client_email || undefined, 
      address: c.address, 
      workType: c.work_type,
      startDatetime: toDate(c.start_datetime), 
      endDatetime: toDate(c.end_datetime),
      status: c.status, 
      notes: c.notes || undefined,
      technicianIds: (allTech || [])
        .filter((t: any) => t.chantier_id === c.id)
        .map((t: any) => t.technician_id),
      createdBy: c.created_by, 
      createdAt: toDate(c.created_at), 
      updatedAt: toDate(c.updated_at)
    }));
    
    log(`${chantiers.length} chantiers pour technicien`);
    for (const ch of chantiers) await db.chantiers.put(ch);
    return chantiers;
  },

  async create(data: Omit<Chantier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateUUID();
    const now = new Date();
    
    log('Création chantier:', data.clientName);
    log('Techniciens:', data.technicianIds);
    log('Créé par (user ID):', data.createdBy);
    
    if (isSupabaseConfigured()) {
      // Vérifier si createdBy est un UUID valide
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.createdBy || '');
      
      // Insérer le chantier
      const { error: chError } = await supabase.from('chantiers').insert({
        id, 
        client_name: data.clientName, 
        client_phone: data.clientPhone,
        client_email: data.clientEmail || null, 
        address: data.address, 
        work_type: data.workType,
        start_datetime: toISO(data.startDatetime), 
        end_datetime: toISO(data.endDatetime),
        status: data.status, 
        notes: data.notes || null, 
        created_by: isValidUUID ? data.createdBy : null, // NULL si pas un UUID valide
        created_at: toISO(now), 
        updated_at: toISO(now)
      });
      
      if (chError) {
        logError('Erreur création chantier Supabase', chError);
        throw chError;
      }
      
      log('Chantier créé dans Supabase:', id);
      
      // Insérer les techniciens
      if (data.technicianIds.length > 0) {
        const techInserts = data.technicianIds.map(tid => ({ 
          id: generateUUID(), 
          chantier_id: id, 
          technician_id: tid 
        }));
        
        const { error: techError } = await supabase
          .from('chantier_technicians')
          .insert(techInserts);
        
        if (techError) {
          logError('Erreur affectation techniciens', techError);
        } else {
          log(`${data.technicianIds.length} techniciens affectés`);
        }
      }
    }
    
    // Sauvegarder localement aussi
    await db.chantiers.add({ ...data, id, createdAt: now, updatedAt: now });
    log('Chantier sauvegardé localement:', id);
    
    return id;
  },

  async update(id: string, updates: Partial<Chantier>): Promise<void> {
    const now = new Date();
    log('Mise à jour chantier:', id);
    
    if (isSupabaseConfigured()) {
      const u: any = { updated_at: toISO(now) };
      if (updates.clientName) u.client_name = updates.clientName;
      if (updates.clientPhone) u.client_phone = updates.clientPhone;
      if (updates.clientEmail !== undefined) u.client_email = updates.clientEmail || null;
      if (updates.address) u.address = updates.address;
      if (updates.workType) u.work_type = updates.workType;
      if (updates.startDatetime) u.start_datetime = toISO(updates.startDatetime);
      if (updates.endDatetime) u.end_datetime = toISO(updates.endDatetime);
      if (updates.status) u.status = updates.status;
      if (updates.notes !== undefined) u.notes = updates.notes || null;
      
      const { error } = await supabase.from('chantiers').update(u).eq('id', id);
      
      if (error) {
        logError('Erreur mise à jour chantier', error);
      }
      
      // Mise à jour des techniciens si fournis
      if (updates.technicianIds) {
        await supabase.from('chantier_technicians').delete().eq('chantier_id', id);
        
        if (updates.technicianIds.length > 0) {
          const techInserts = updates.technicianIds.map(tid => ({ 
            id: generateUUID(), 
            chantier_id: id, 
            technician_id: tid 
          }));
          await supabase.from('chantier_technicians').insert(techInserts);
        }
      }
    }
    
    await db.chantiers.update(id, { ...updates, updatedAt: now });
  },

  async delete(id: string): Promise<void> {
    log('Suppression chantier:', id);
    
    if (isSupabaseConfigured()) {
      await supabase.from('chantier_technicians').delete().eq('chantier_id', id);
      const { error } = await supabase.from('chantiers').delete().eq('id', id);
      if (error) logError('Erreur suppression chantier', error);
    }
    
    await db.chantiers.delete(id);
  }
};

// ============================================
// RAPPORTS
// ============================================
import { uploadPhotos } from './storage';

export const syncRapports = {
  async submit(rapport: Rapport, photos: string[]): Promise<void> {
    log('Soumission rapport:', rapport.id);
    log('Chantier ID:', rapport.chantierId);
    log('Technicien ID:', rapport.technicianId);
    log('Nombre de photos:', photos.length);
    
    let photoUrls: string[] = photos;
    
    if (isSupabaseConfigured()) {
      // Vérifier si les IDs sont des UUIDs valides
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
      
      const chantierId = rapport.chantierId;
      const technicianId = rapport.technicianId;
      
      // Upload des photos vers Supabase Storage
      if (photos.length > 0) {
        log('Upload des photos vers Supabase Storage...');
        photoUrls = await uploadPhotos(photos, rapport.id);
        log(`✅ ${photoUrls.length} photos uploadées`);
      }
      
      // Essayer d'insérer le rapport seulement si les IDs sont valides
      if (isValidUUID(chantierId) && isValidUUID(technicianId)) {
        const { error } = await supabase.from('rapports').insert({
          id: rapport.id, 
          chantier_id: chantierId, 
          technician_id: technicianId,
          start_time: toISO(rapport.startTime), 
          end_time: rapport.endTime ? toISO(rapport.endTime) : null,
          quantities_used: rapport.quantitiesUsed, 
          has_problems: rapport.hasProblems,
          problems_description: rapport.problemsDescription || null, 
          has_extra_work: rapport.hasExtraWork,
          extra_work_description: rapport.extraWorkDescription || null, 
          client_signature: rapport.clientSignature || null,
          photos: photoUrls, // Ajout des URLs des photos
          status: rapport.status, 
          created_at: toISO(rapport.createdAt), 
          synced_at: toISO(new Date())
        });
        
        if (error) {
          logError('Erreur soumission rapport', error);
        } else {
          log('✅ Rapport inséré dans Supabase');
        }
      } else {
        log('⚠️ IDs non valides, rapport non envoyé à Supabase');
      }
      
      // TOUJOURS mettre à jour le statut du chantier (même si rapport échoue)
      if (isValidUUID(chantierId)) {
        const { error: updateError } = await supabase
          .from('chantiers')
          .update({ status: 'termine', updated_at: toISO(new Date()) })
          .eq('id', chantierId);
        
        if (updateError) {
          logError('Erreur mise à jour statut chantier', updateError);
        } else {
          log('✅ Chantier marqué comme terminé dans Supabase');
        }
      }
    }
    
    // Sauvegarder localement avec les URLs des photos
    const rapportWithPhotos = { ...rapport, photoUrls };
    try {
      await db.rapports.put(rapportWithPhotos);
    } catch (e) {
      log('Rapport déjà existant localement');
    }
    
    await db.chantiers.update(rapport.chantierId, { status: 'termine', updatedAt: new Date() });
    log('✅ Chantier marqué comme terminé localement');
  },

  async pullAll(): Promise<Rapport[]> {
    if (!isSupabaseConfigured()) {
      return await db.rapports.toArray();
    }
    
    const { data, error } = await supabase
      .from('rapports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logError('Erreur récupération rapports', error);
      return await db.rapports.toArray();
    }
    
    if (!data) return [];
    
    return data.map((r: any) => ({
      id: r.id, 
      chantierId: r.chantier_id, 
      technicianId: r.technician_id,
      startTime: toDate(r.start_time), 
      endTime: r.end_time ? toDate(r.end_time) : undefined,
      quantitiesUsed: r.quantities_used || [], 
      hasProblems: r.has_problems,
      problemsDescription: r.problems_description || undefined, 
      hasExtraWork: r.has_extra_work,
      extraWorkDescription: r.extra_work_description || undefined, 
      clientSignature: r.client_signature || undefined,
      photos: [], 
      status: r.status, 
      createdAt: toDate(r.created_at), 
      syncedAt: r.synced_at ? toDate(r.synced_at) : undefined
    }));
  }
};

// ============================================
// ALERTS
// ============================================
export const syncAlerts = {
  async create(data: Omit<Alert, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    const id = generateUUID();
    const now = new Date();
    
    log('Création alerte:', data.alertType);
    
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('alerts').insert({
        id, 
        chantier_id: data.chantierId, 
        technician_id: data.technicianId,
        alert_type: data.alertType, 
        message: data.message, 
        is_read: false, 
        created_at: toISO(now)
      });
      
      if (error) {
        logError('Erreur création alerte', error);
      }
    }
    
    await db.alerts.add({ ...data, id, isRead: false, createdAt: now });
  },

  async pullAll(): Promise<Alert[]> {
    if (!isSupabaseConfigured()) {
      return await db.alerts.toArray();
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logError('Erreur récupération alertes', error);
      return await db.alerts.toArray();
    }
    
    if (!data) return [];
    
    const alerts = data.map((a: any) => ({
      id: a.id, 
      chantierId: a.chantier_id, 
      technicianId: a.technician_id,
      alertType: a.alert_type, 
      message: a.message, 
      isRead: a.is_read, 
      createdAt: toDate(a.created_at)
    }));
    
    // Mettre à jour le cache local
    await db.alerts.clear();
    await db.alerts.bulkAdd(alerts);
    
    return alerts;
  },

  async markAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    }
    await db.alerts.update(id, { isRead: true });
  }
};

// ============================================
// NOTIFICATIONS
// ============================================
export const syncNotifications = {
  async pullByUser(userId: string): Promise<Notification[]> {
    if (!isSupabaseConfigured()) {
      return await db.notifications.where('userId').equals(userId).toArray();
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logError('Erreur récupération notifications', error);
      return await db.notifications.where('userId').equals(userId).toArray();
    }
    
    if (!data) return [];
    
    return data.map((n: any) => ({
      id: n.id, 
      userId: n.user_id, 
      title: n.title, 
      message: n.message,
      type: n.type, 
      relatedId: n.related_id || undefined, 
      isRead: n.is_read, 
      createdAt: toDate(n.created_at)
    }));
  },

  async markAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
    await db.notifications.update(id, { isRead: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    }
    // Mettre à jour localement aussi
    const notifs = await db.notifications.where('userId').equals(userId).toArray();
    for (const n of notifs) {
      await db.notifications.update(n.id, { isRead: true });
    }
  }
};

// ============================================
// WORK TYPES
// ============================================
export const syncWorkTypes = {
  async pullAll(): Promise<WorkType[]> {
    if (!isSupabaseConfigured()) {
      log('Supabase non configuré, chargement local des types de travaux');
      return await db.workTypes.toArray();
    }
    
    log('Récupération des types de travaux depuis Supabase...');
    const { data, error } = await supabase
      .from('work_types')
      .select('*')
      .order('name');
    
    if (error) {
      logError('Erreur récupération work_types', error);
      return await db.workTypes.toArray();
    }
    
    if (!data || data.length === 0) {
      log('Aucun type de travaux dans Supabase');
      return [];
    }
    
    const workTypes: WorkType[] = data.map((w: any) => ({ 
      id: w.id, 
      name: w.name, 
      materials: w.materials || [] 
    }));
    
    log(`${workTypes.length} types de travaux récupérés`);
    await db.workTypes.clear();
    await db.workTypes.bulkAdd(workTypes);
    return workTypes;
  }
};

// ============================================
// SYNC MANAGER
// ============================================
export const SyncManager = {
  async pullAll(): Promise<void> {
    if (!isSupabaseConfigured()) {
      log('⚠️ Supabase non configuré - mode local uniquement');
      return;
    }
    
    log('🔄 Synchronisation complète...');
    try {
      await syncUsers.pullAll();
      await syncWorkTypes.pullAll();
      await syncChantiers.pullAll();
      await syncAlerts.pullAll();
      await syncRapports.pullAll();
      log('✅ Synchronisation terminée');
    } catch (e) { 
      logError('❌ Erreur sync globale', e); 
    }
  },

  async pullForTechnician(techId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      log('⚠️ Supabase non configuré - mode local uniquement');
      return;
    }
    
    log('🔄 Sync technicien:', techId);
    try {
      await syncWorkTypes.pullAll();
      await syncChantiers.pullByTechnician(techId);
      await syncNotifications.pullByUser(techId);
      log('✅ Sync technicien terminée');
    } catch (e) { 
      logError('❌ Erreur sync technicien', e); 
    }
  },

  async pushPending(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const pending = await db.pendingSync.toArray();
    if (pending.length === 0) return;
    
    log(`📤 Push ${pending.length} éléments en attente...`);
    
    for (const item of pending) {
      try {
        if (item.type === 'rapport') {
          await syncRapports.submit(item.data.rapport, item.data.photos || []);
        }
        if (item.type === 'alert') {
          await syncAlerts.create(item.data);
        }
        await db.pendingSync.delete(item.id);
        log('✅ Élément synchronisé:', item.type);
      } catch (e) { 
        logError('Erreur push élément', e); 
      }
    }
  }
};
