import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useSyncStore } from './stores';
import { db, initializeDemoData } from './db/database';
import { OnlineStatus, PWAPrompt } from './components/shared';
import { useAutoRefreshChantiers, useRefreshOnFocus } from './hooks/useAutoRefresh';

// Pages
import { LoginPage } from './pages/LoginPage';
import { TechHomePage } from './pages/technicien/TechHomePage';
import { TechChantierDetailPage } from './pages/technicien/TechChantierDetailPage';
import { TechRapportPage } from './pages/technicien/TechRapportPage';
import { TechCalendrierPage, TechAlertesPage, TechProfilPage } from './pages/technicien/TechOtherPages';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminChantiersPage } from './pages/admin/AdminChantiersPage';
import { AdminChantierFormPage } from './pages/admin/AdminChantierFormPage';
import { AdminCalendrierPage } from './pages/admin/AdminCalendrierPage';
import { AdminEquipePage } from './pages/admin/AdminEquipePage';
import { AdminHistoriquePage } from './pages/admin/AdminHistoriquePage';
import { AdminStatsPage } from './pages/admin/AdminStatsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminParametresPage } from './pages/admin/AdminParametresPage';
import { AdminWorkTypesPage } from './pages/admin/AdminWorkTypesPage';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: ('admin' | 'technicien')[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/tech'} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { updateOnlineStatus } = useSyncStore();

  // Rafraîchir automatiquement les statuts des chantiers toutes les minutes
  useAutoRefreshChantiers(60000);
  
  // Rafraîchir quand l'app revient au premier plan
  useRefreshOnFocus();

  useEffect(() => {
    // Initialiser la DB avec les données de démo
    initializeDemoData();

    // Gérer le statut online/offline
    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <OnlineStatus />
      <PWAPrompt />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Technicien Routes */}
        <Route path="/tech" element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechHomePage />
          </ProtectedRoute>
        } />
        <Route path="/tech/calendrier" element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechCalendrierPage />
          </ProtectedRoute>
        } />
        <Route path="/tech/alertes" element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechAlertesPage />
          </ProtectedRoute>
        } />
        <Route path="/tech/profil" element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechProfilPage />
          </ProtectedRoute>
        } />
        <Route path="/tech/chantier/:id" element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechChantierDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/tech/rapport/:id" element={
          <ProtectedRoute allowedRoles={['technicien']}>
            <TechRapportPage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/chantiers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChantiersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/chantiers/nouveau" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChantierFormPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/chantiers/:id" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChantierFormPage />
          </ProtectedRoute>
        } />
        
        {/* Fallback routes pour les pages admin non encore créées */}
        <Route path="/admin/calendrier" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCalendrierPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/equipe" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEquipePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/historique" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminHistoriquePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/stats" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStatsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/parametres" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminParametresPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/types-travaux" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminWorkTypesPage />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
