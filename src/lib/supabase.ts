import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Debug au démarrage
console.log('[Supabase] URL configurée:', supabaseUrl ? '✅ Oui' : '❌ Non');
console.log('[Supabase] Clé configurée:', supabaseAnonKey ? '✅ Oui' : '❌ Non');

// Client Supabase
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Vérifier si configuré
export const isSupabaseConfigured = (): boolean => {
  const configured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));
  return configured;
};

// Log de la config au chargement
if (isSupabaseConfigured()) {
  console.log('[Supabase] ✅ Connecté à:', supabaseUrl);
} else {
  console.log('[Supabase] ⚠️ Non configuré - Mode local uniquement');
  console.log('[Supabase] Pour activer Supabase, créez un fichier .env avec:');
  console.log('  VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.log('  VITE_SUPABASE_ANON_KEY=votre-clé-anon');
}
