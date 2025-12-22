import { NavLink } from 'react-router-dom';
import { Home, Calendar, AlertTriangle, User } from 'lucide-react';
import { useNotificationStore } from '../../stores';

export function TechnicianNav() {
  const { unreadCount } = useNotificationStore();

  const navItems = [
    { to: '/tech', icon: Home, label: 'Accueil', end: true },
    { to: '/tech/calendrier', icon: Calendar, label: 'Calendrier' },
    { to: '/tech/alertes', icon: AlertTriangle, label: 'Alertes', badge: unreadCount },
    { to: '/tech/profil', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item flex-1 relative ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <div className="relative">
              <Icon size={24} strokeWidth={2} />
              {badge && badge > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-chantier-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
