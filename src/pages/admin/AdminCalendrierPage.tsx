import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useChantierStore, useUserStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';
import { getStatusLabel } from '../../utils/helpers';

export function AdminCalendrierPage() {
  const navigate = useNavigate();
  const { chantiers, loadChantiers } = useChantierStore();
  const { technicians, loadUsers } = useUserStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadChantiers();
    loadUsers();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getChantiersByDate = (date: Date) => {
    return chantiers.filter(c => isSameDay(c.startDatetime, date));
  };

  const selectedDateChantiers = selectedDate ? getChantiersByDate(selectedDate) : [];

  const statusColors: Record<string, string> = {
    'a_venir': 'bg-blue-500',
    'en_cours': 'bg-orange-500',
    'termine': 'bg-green-500'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-800">Calendrier</h1>
              <p className="text-gray-500 mt-1">Vue d'ensemble de vos chantiers</p>
            </div>
            <button
              onClick={() => navigate('/admin/chantiers/nouveau')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Nouveau chantier
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendrier */}
            <div className="lg:col-span-2">
              <div className="card">
                {/* Navigation mois */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="font-display text-xl font-semibold text-gray-800 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grille du calendrier */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    const dayChantiers = getChantiersByDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-1 rounded-xl transition-all relative
                          ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}
                          ${isToday(day) ? 'bg-blue-100 font-bold' : ''}
                          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-100'}
                        `}
                      >
                        <span className="text-sm">{format(day, 'd')}</span>
                        {dayChantiers.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayChantiers.slice(0, 3).map((c, i) => (
                              <span 
                                key={i} 
                                className={`w-1.5 h-1.5 rounded-full ${statusColors[c.status]}`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Légende */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">À venir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-600">En cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Terminé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Détail du jour sélectionné */}
            <div className="card">
              <h3 className="font-display font-semibold text-lg text-gray-800 mb-4">
                {selectedDate 
                  ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                  : 'Sélectionnez une date'
                }
              </h3>

              {selectedDate && selectedDateChantiers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun chantier ce jour</p>
                  <button
                    onClick={() => navigate('/admin/chantiers/nouveau')}
                    className="mt-4 text-blue-600 font-medium hover:underline"
                  >
                    + Planifier un chantier
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {selectedDateChantiers.map(chantier => {
                  const techs = technicians.filter(t => chantier.technicianIds.includes(t.id));
                  return (
                    <div
                      key={chantier.id}
                      onClick={() => navigate(`/admin/chantiers/${chantier.id}`)}
                      className={`p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                        chantier.status === 'en_cours' ? 'border-l-orange-500 bg-orange-50' :
                        chantier.status === 'termine' ? 'border-l-green-500 bg-green-50' :
                        'border-l-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          chantier.status === 'en_cours' ? 'bg-orange-200 text-orange-800' :
                          chantier.status === 'termine' ? 'bg-green-200 text-green-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {getStatusLabel(chantier.status)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800">{chantier.clientName}</h4>
                      <p className="text-sm text-gray-600">{chantier.workType}</p>
                      
                      <div className="mt-3 space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>
                            {format(chantier.startDatetime, 'HH:mm')} - {format(chantier.endDatetime, 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span className="truncate">{chantier.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span>{techs.map(t => t.name.split(' ')[0]).join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
