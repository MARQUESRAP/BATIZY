import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore, useChantierStore } from '../../stores';
import { TechnicianNav } from '../../components/shared';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Chantier } from '../../types';

export function TechCalendrierPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chantiers, loadChantiersByTechnician } = useChantierStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (user) loadChantiersByTechnician(user.id);
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startPadding = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  const getChantiersByDay = (day: Date): Chantier[] => {
    return chantiers.filter(c => isSameDay(c.startDatetime, day));
  };

  const selectedChantiers = selectedDay ? getChantiersByDay(selectedDay) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-btp-600 text-white pt-safe-top px-5 py-6">
        <h1 className="font-display text-2xl font-bold">Mon calendrier</h1>
      </header>

      <main className="p-5">
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft size={24} /></button>
            <h2 className="font-display font-semibold text-lg capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronRight size={24} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const dayChantiers = getChantiersByDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const hasChantier = dayChantiers.length > 0;
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                    ${isToday(day) ? 'bg-btp-600 text-white' : ''}
                    ${isSelected && !isToday(day) ? 'bg-btp-100 text-btp-600' : ''}
                    ${!isSelected && !isToday(day) ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {hasChantier && (
                    <div className="flex gap-0.5 mt-1">
                      {dayChantiers.slice(0, 3).map((c, j) => (
                        <span key={j} className={`w-1.5 h-1.5 rounded-full ${
                          c.status === 'en_cours' ? 'bg-chantier-orange' :
                          c.status === 'termine' ? 'bg-chantier-green' : 'bg-blue-500'
                        }`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-gray-800">
              {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
            </h3>
            {selectedChantiers.length === 0 ? (
              <div className="card text-center py-6 text-gray-500">Aucun chantier ce jour</div>
            ) : (
              selectedChantiers.map(c => (
                <div key={c.id} onClick={() => navigate(`/tech/chantier/${c.id}`)}
                  className={`card card-hover cursor-pointer border-l-4 ${
                    c.status === 'en_cours' ? 'border-l-chantier-orange' :
                    c.status === 'termine' ? 'border-l-chantier-green' : 'border-l-blue-500'
                  }`}>
                  <p className="text-sm text-gray-500">{format(c.startDatetime, 'HH:mm')} - {format(c.endDatetime, 'HH:mm')}</p>
                  <h4 className="font-semibold text-gray-800">{c.clientName}</h4>
                  <p className="text-sm text-btp-600">{c.workType}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <TechnicianNav />
    </div>
  );
}

export function TechAlertesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, loadNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => { if (user) loadNotifications(user.id); }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-btp-600 text-white pt-safe-top px-5 py-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <button onClick={() => user && markAllAsRead(user.id)} className="text-sm text-btp-200 hover:text-white">
              Tout marquer lu
            </button>
          )}
        </div>
      </header>
      <main className="p-5 space-y-3">
        {notifications.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">Aucune notification</div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} onClick={() => markAsRead(notif.id)}
              className={`card cursor-pointer ${!notif.isRead ? 'bg-btp-50 border-l-4 border-l-btp-600' : ''}`}>
              <p className="font-semibold text-gray-800">{notif.title}</p>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-2">{format(notif.createdAt, 'dd/MM à HH:mm')}</p>
            </div>
          ))
        )}
      </main>
      <TechnicianNav />
    </div>
  );
}

export function TechProfilPage() {
  const { user, logout } = useAuthStore();
  const { chantiers, loadChantiersByTechnician } = useChantierStore();
  const { rapports, loadRapports } = useRapportStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profil' | 'stats' | 'historique'>('profil');

  useEffect(() => {
    if (user) {
      loadChantiersByTechnician(user.id);
      loadRapports();
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  // Stats du technicien
  const myRapports = rapports.filter(r => r.technicianId === user?.id);
  const myChantiers = chantiers;
  const chantiersTermines = myChantiers.filter(c => c.status === 'termine').length;
  const chantiersEnCours = myChantiers.filter(c => c.status === 'en_cours').length;
  const chantiersAVenir = myChantiers.filter(c => c.status === 'a_venir').length;

  // Calcul des heures travaillées
  let totalMinutes = 0;
  myRapports.forEach(r => {
    if (r.startTime && r.endTime) {
      totalMinutes += (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60);
    }
  });
  const totalHeures = Math.round(totalMinutes / 60);

  // Stats ce mois-ci
  const thisMonth = new Date();
  const monthStart = startOfMonth(thisMonth);
  const monthEnd = endOfMonth(thisMonth);
  const rapportsThisMonth = myRapports.filter(r => {
    const date = new Date(r.createdAt);
    return date >= monthStart && date <= monthEnd;
  });

  // Téléchargement PDF d'un rapport
  const handleDownloadPDF = async (rapport: any) => {
    const chantier = myChantiers.find(c => c.id === rapport.chantierId);
    if (chantier) {
      const { generateRapportPDF } = await import('../../utils/pdfGenerator');
      generateRapportPDF(rapport, chantier, user || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-btp-600 text-white pt-safe-top px-5 py-6">
        <h1 className="font-display text-2xl font-bold">Mon espace</h1>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profil' ? 'text-btp-600 border-btp-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stats' ? 'text-btp-600 border-btp-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'historique' ? 'text-btp-600 border-btp-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Mes rapports
          </button>
        </div>
      </div>

      <main className="p-5 space-y-4">
        {/* Tab Profil */}
        {activeTab === 'profil' && (
          <>
            <div className="card text-center py-8">
              <div className="w-20 h-20 bg-btp-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h2 className="font-display text-xl font-semibold text-gray-800">{user?.name}</h2>
              <p className="text-gray-500">Technicien</p>
            </div>
            
            <div className="card space-y-3">
              {user?.phone && <div><p className="text-sm text-gray-500">Téléphone</p><p className="font-medium">{user.phone}</p></div>}
              <div><p className="text-sm text-gray-500">Code d'accès</p><p className="font-mono font-medium">{user?.code}</p></div>
            </div>

            <button onClick={handleLogout} className="btn-danger w-full">Se déconnecter</button>
          </>
        )}

        {/* Tab Stats */}
        {activeTab === 'stats' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="card bg-gradient-to-br from-btp-500 to-btp-600 text-white">
                <p className="text-3xl font-bold">{myChantiers.length}</p>
                <p className="text-btp-100 text-sm">Chantiers assignés</p>
              </div>
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <p className="text-3xl font-bold">{chantiersTermines}</p>
                <p className="text-green-100 text-sm">Terminés</p>
              </div>
              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <p className="text-3xl font-bold">{chantiersEnCours + chantiersAVenir}</p>
                <p className="text-orange-100 text-sm">À faire</p>
              </div>
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <p className="text-3xl font-bold">{totalHeures}h</p>
                <p className="text-purple-100 text-sm">Heures travaillées</p>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📊 Ce mois-ci ({format(thisMonth, 'MMMM', { locale: fr })})
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Rapports soumis</span>
                  <span className="font-semibold text-btp-600">{rapportsThisMonth.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Problèmes signalés</span>
                  <span className="font-semibold text-orange-600">
                    {rapportsThisMonth.filter(r => r.hasProblems).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Travaux supplémentaires</span>
                  <span className="font-semibold text-blue-600">
                    {rapportsThisMonth.filter(r => r.hasExtraWork).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">📈 Total carrière</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Rapports totaux</span>
                  <span className="font-semibold">{myRapports.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Taux de complétion</span>
                  <span className="font-semibold text-green-600">
                    {myChantiers.length > 0 
                      ? Math.round((chantiersTermines / myChantiers.length) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Heures totales</span>
                  <span className="font-semibold">{totalHeures}h</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab Historique */}
        {activeTab === 'historique' && (
          <>
            {myRapports.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-gray-500">Aucun rapport soumis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRapports
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(rapport => {
                    const chantier = myChantiers.find(c => c.id === rapport.chantierId);
                    return (
                      <div key={rapport.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {chantier?.clientName || 'Chantier inconnu'}
                            </h4>
                            <p className="text-sm text-btp-600">{chantier?.workType}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Soumis
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-3">
                          <p>{format(new Date(rapport.createdAt), 'dd MMMM yyyy', { locale: fr })}</p>
                          {rapport.startTime && rapport.endTime && (
                            <p>
                              {format(new Date(rapport.startTime), 'HH:mm')} - {format(new Date(rapport.endTime), 'HH:mm')}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 mb-3">
                          {rapport.hasProblems && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              ⚠️ Problème
                            </span>
                          )}
                          {rapport.hasExtraWork && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              🔧 Travaux +
                            </span>
                          )}
                          {rapport.photoUrls && rapport.photoUrls.length > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              📷 {rapport.photoUrls.length} photo(s)
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDownloadPDF(rapport)}
                          className="w-full py-2 bg-btp-50 text-btp-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-btp-100 transition-colors"
                        >
                          📄 Télécharger le rapport PDF
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </main>
      <TechnicianNav />
    </div>
  );
}

import { useNotificationStore, useRapportStore } from '../../stores';
