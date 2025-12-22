import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FolderKanban, 
  Users, 
  History, 
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  HardHat,
  Wrench
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useNotificationStore, useAlertStore } from '../../stores';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const { unreadCount: notifCount } = useNotificationStore();
  const { unreadCount: alertCount } = useAlertStore();

  const totalBadge = notifCount + alertCount;

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/chantiers', icon: FolderKanban, label: 'Chantiers' },
    { to: '/admin/calendrier', icon: Calendar, label: 'Calendrier' },
    { to: '/admin/equipe', icon: Users, label: 'Équipe' },
    { to: '/admin/types-travaux', icon: Wrench, label: 'Types de travaux' },
    { to: '/admin/historique', icon: History, label: 'Historique' },
    { to: '/admin/stats', icon: BarChart3, label: 'Statistiques' },
    { to: '/admin/notifications', icon: Bell, label: 'Notifications', badge: totalBadge },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between px-4 z-50 safe-top">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-baseline">
          <span className="font-display text-xl font-bold text-white">Bat</span>
          <span 
            className="font-display text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            izy
          </span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex items-baseline">
              <span className="font-display text-xl font-bold text-gray-800">Bat</span>
              <span 
                className="font-display text-2xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #f97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                izy
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-btp-100 text-btp-600 rounded-full flex items-center justify-center font-semibold">
              {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">Administrateur</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-btp-600 text-white shadow-button' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span className="font-medium">{label}</span>
              {badge && badge > 0 && (
                <span className="absolute right-4 w-6 h-6 bg-chantier-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <NavLink
            to="/admin/parametres"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-gray-100 text-gray-800' 
                : 'text-gray-500 hover:bg-gray-50'
              }`
            }
          >
            <Settings size={20} />
            <span className="font-medium">Paramètres</span>
          </NavLink>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-chantier-red transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
