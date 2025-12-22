import { useEffect, useState } from 'react';
import { 
  Bell, Check, CheckCheck, Trash2, Filter,
  AlertTriangle, FileText, Calendar, Users, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAlertStore, useNotificationStore, useUserStore, useChantierStore, useAuthStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';
import { formatRelativeDate } from '../../utils/helpers';

type TabType = 'alerts' | 'notifications';

export function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const { alerts, loadAlerts, markAsRead } = useAlertStore();
  const { notifications, loadNotifications, markAllAsRead } = useNotificationStore();
  const { technicians, loadUsers } = useUserStore();
  const { chantiers, loadChantiers } = useChantierStore();
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadAlerts();
    if (user) {
      loadNotifications(user.id);
    }
    loadUsers();
    loadChantiers();
  }, [user]);

  const filteredAlerts = alerts.filter(a => filter === 'all' || !a.isRead);
  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.isRead);

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'retard': return '⏰';
      case 'besoin_materiel': return '🔧';
      case 'annulation': return '❌';
      default: return '❗';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'retard': return 'Retard';
      case 'besoin_materiel': return 'Besoin matériel';
      case 'annulation': return 'Annulation';
      default: return 'Autre';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_chantier': return <Calendar size={20} className="text-blue-600" />;
      case 'rapport': return <FileText size={20} className="text-green-600" />;
      case 'alert': return <AlertTriangle size={20} className="text-orange-600" />;
      default: return <Bell size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-500 mt-1">Gérez les alertes et notifications</p>
            </div>
            <button
              onClick={() => user && markAllAsRead(user.id)}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCheck size={20} />
              Tout marquer comme lu
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle size={20} />
              Alertes terrain
              {unreadAlertsCount > 0 && (
                <span className="w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell size={20} />
              Notifications
              {unreadNotificationsCount > 0 && (
                <span className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4 mb-6">
            <Filter size={20} className="text-gray-400" />
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                }`}
              >
                Non lues
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="card">
            {activeTab === 'alerts' ? (
              <>
                <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
                  Alertes terrain ({filteredAlerts.length})
                </h2>

                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune alerte</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlerts.map(alert => {
                      const tech = technicians.find(t => t.id === alert.technicianId);
                      const chantier = chantiers.find(c => c.id === alert.chantierId);
                      
                      return (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-xl border-l-4 transition-colors ${
                            alert.isRead 
                              ? 'bg-gray-50 border-l-gray-300' 
                              : 'bg-orange-50 border-l-orange-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <span className="text-2xl">{getAlertIcon(alert.alertType)}</span>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-800">
                                    {tech?.name || 'Technicien inconnu'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    alert.alertType === 'retard' ? 'bg-yellow-100 text-yellow-700' :
                                    alert.alertType === 'besoin_materiel' ? 'bg-blue-100 text-blue-700' :
                                    alert.alertType === 'annulation' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {getAlertTypeLabel(alert.alertType)}
                                  </span>
                                </div>
                                <p className="text-gray-700">{alert.message}</p>
                                {chantier && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Chantier: {chantier.clientName}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatRelativeDate(alert.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!alert.isRead && (
                                <button
                                  onClick={() => markAsRead(alert.id)}
                                  className="p-2 hover:bg-white rounded-lg transition-colors"
                                  title="Marquer comme lu"
                                >
                                  <Check size={18} className="text-gray-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
                  Notifications système ({filteredNotifications.length})
                </h2>

                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl transition-colors ${
                          notification.isRead 
                            ? 'bg-gray-50' 
                            : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            notification.isRead ? 'bg-gray-200' : 'bg-white'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatRelativeDate(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
