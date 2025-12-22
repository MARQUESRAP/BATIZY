import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, Users, Calendar, ChevronRight, Plus
} from 'lucide-react';
import { useChantierStore, useUserStore, useAlertStore, useRapportStore, useAuthStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';
import { formatRelativeDate, formatTime, getStatusBadgeClass, getStatusLabel } from '../../utils/helpers';
import { isToday } from 'date-fns';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chantiers, loadChantiers, loading: loadingChantiers } = useChantierStore();
  const { technicians, loadUsers } = useUserStore();
  const { alerts, unreadCount: alertsUnread, loadAlerts } = useAlertStore();
  const { rapports, loadRapports } = useRapportStore();

  useEffect(() => {
    loadChantiers();
    loadUsers();
    loadAlerts();
    loadRapports();
  }, []);

  const stats = {
    total: chantiers.length,
    enCours: chantiers.filter(c => c.status === 'en_cours').length,
    aVenir: chantiers.filter(c => c.status === 'a_venir').length,
    termines: chantiers.filter(c => c.status === 'termine').length,
    alertes: alertsUnread,
  };

  const todayChantiers = chantiers.filter(c => isToday(c.startDatetime));
  const recentAlerts = alerts.filter(a => !a.isRead).slice(0, 3);
  const recentRapports = rapports.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-gray-800">
              Bonjour, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Voici un aperçu de vos chantiers
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card bg-gradient-btp text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total chantiers</p>
                  <p className="text-4xl font-display font-bold mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <FolderKanban size={24} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">En cours</p>
                  <p className="text-4xl font-display font-bold text-chantier-orange mt-1">{stats.enCours}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Clock size={24} className="text-chantier-orange" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">À venir</p>
                  <p className="text-4xl font-display font-bold text-blue-600 mt-1">{stats.aVenir}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Calendar size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Terminés</p>
                  <p className="text-4xl font-display font-bold text-chantier-green mt-1">{stats.termines}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-chantier-green" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chantiers du jour */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-gray-800">
                    Aujourd'hui
                  </h2>
                  <button
                    onClick={() => navigate('/admin/chantiers/nouveau')}
                    className="flex items-center gap-2 text-btp-600 font-medium text-sm hover:underline"
                  >
                    <Plus size={18} />
                    Nouveau
                  </button>
                </div>

                {todayChantiers.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun chantier prévu aujourd'hui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayChantiers.map((chantier) => {
                      const techs = technicians.filter(t => chantier.technicianIds.includes(t.id));
                      return (
                        <div
                          key={chantier.id}
                          onClick={() => navigate(`/admin/chantiers/${chantier.id}`)}
                          className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 cursor-pointer transition-colors border-l-4"
                          style={{
                            borderLeftColor: chantier.status === 'en_cours' ? '#f97316' : 
                                           chantier.status === 'termine' ? '#059669' : '#3b82f6'
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`badge text-xs ${getStatusBadgeClass(chantier.status)}`}>
                              {getStatusLabel(chantier.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTime(chantier.startDatetime)} - {formatTime(chantier.endDatetime)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800">{chantier.clientName}</h3>
                          <p className="text-sm text-btp-600">{chantier.workType}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {techs.map(t => t.name.split(' ')[0]).join(', ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => navigate('/admin/calendrier')}
                  className="w-full mt-4 py-3 text-center text-btp-600 font-medium hover:bg-btp-50 rounded-xl transition-colors"
                >
                  Voir le calendrier complet
                </button>
              </div>
            </div>

            {/* Sidebar - Alertes et Rapports */}
            <div className="space-y-6">
              {/* Alertes */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-gray-800 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-chantier-orange" />
                    Alertes
                    {alertsUnread > 0 && (
                      <span className="w-6 h-6 bg-chantier-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {alertsUnread}
                      </span>
                    )}
                  </h2>
                </div>

                {recentAlerts.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Aucune alerte</p>
                ) : (
                  <div className="space-y-3">
                    {recentAlerts.map((alert) => {
                      const tech = technicians.find(t => t.id === alert.technicianId);
                      return (
                        <div
                          key={alert.id}
                          className="p-3 bg-orange-50 border border-orange-200 rounded-xl"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {alert.alertType === 'retard' ? '⏰' : 
                               alert.alertType === 'besoin_materiel' ? '🔧' : 
                               alert.alertType === 'annulation' ? '❌' : '❗'}
                            </span>
                            <span className="font-medium text-orange-800">{tech?.name}</span>
                          </div>
                          <p className="text-sm text-orange-700">{alert.message}</p>
                          <p className="text-xs text-orange-500 mt-1">
                            {formatRelativeDate(alert.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => navigate('/admin/notifications')}
                  className="w-full mt-4 py-2 text-center text-sm text-btp-600 font-medium hover:underline"
                >
                  Voir tout
                </button>
              </div>

              {/* Équipe */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-gray-800">
                    Équipe
                  </h2>
                  <span className="text-sm text-gray-500">{technicians.length} techniciens</span>
                </div>

                <div className="space-y-2">
                  {technicians.slice(0, 5).map((tech, index) => {
                    const techChantiers = todayChantiers.filter(c => c.technicianIds.includes(tech.id));
                    const isWorking = techChantiers.some(c => c.status === 'en_cours');
                    
                    return (
                      <div key={tech.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          isWorking ? 'bg-chantier-orange' : techChantiers.length > 0 ? 'bg-btp-600' : 'bg-gray-400'
                        }`}>
                          {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{tech.name}</p>
                          <p className="text-xs text-gray-500">
                            {isWorking ? 'En chantier' : 
                             techChantiers.length > 0 ? `${techChantiers.length} chantier(s)` : 
                             'Disponible'}
                          </p>
                        </div>
                        {isWorking && (
                          <span className="w-2 h-2 bg-chantier-orange rounded-full animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate('/admin/equipe')}
                  className="w-full mt-4 py-2 text-center text-sm text-btp-600 font-medium hover:underline"
                >
                  Gérer l'équipe
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
