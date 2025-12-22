import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Play, Clock, MapPin, AlertTriangle, ChevronRight, HardHat, FileWarning, ClipboardList } from 'lucide-react';
import { useAuthStore, useChantierStore, useUserStore, useNotificationStore, useRapportStore } from '../../stores';
import { TechnicianNav, OnlineStatusBadge, ChantierCard } from '../../components/shared';
import { Chantier } from '../../types';
import { formatTime, formatRelativeDate } from '../../utils/helpers';
import { isToday as isTodayFns, isBefore } from 'date-fns';

export function TechHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chantiers, loadChantiersByTechnician, loading } = useChantierStore();
  const { technicians, loadUsers } = useUserStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { rapports, loadRapports } = useRapportStore();

  useEffect(() => {
    if (user) {
      loadChantiersByTechnician(user.id);
      loadUsers();
      loadNotifications(user.id);
      loadRapports();
    }
  }, [user]);

  // Trouver les chantiers dont l'heure de fin est passée mais qui n'ont pas de rapport soumis
  const now = new Date();
  const chantiersNeedingReport = chantiers.filter(c => {
    // Le chantier est terminé par l'heure (endDatetime passée)
    const isTimeOver = isBefore(new Date(c.endDatetime), now);
    // Pas encore marqué comme terminé OU pas de rapport soumis
    const hasNoReport = !rapports.some(r => r.chantierId === c.id && r.status === 'submitted');
    // Exclure ceux déjà terminés avec rapport
    return isTimeOver && hasNoReport && c.status !== 'termine';
  });

  const todayChantiers = chantiers.filter(c => isTodayFns(c.startDatetime));
  const currentChantier = todayChantiers.find(c => c.status === 'en_cours');
  const upcomingToday = todayChantiers.filter(c => c.status === 'a_venir');
  const upcomingChantiers = chantiers.filter(c => c.status === 'a_venir' && !isTodayFns(c.startDatetime)).slice(0, 3);

  const handleStartChantier = (chantier: Chantier) => {
    navigate(`/tech/chantier/${chantier.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-btp-600 text-white pt-safe-top">
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-btp-200 text-sm">Bonjour,</p>
              <h1 className="font-display text-2xl font-bold">{user?.name.split(' ')[0]} 👋</h1>
            </div>
            <div className="flex items-center gap-3">
              <OnlineStatusBadge />
              {unreadCount > 0 && (
                <button
                  onClick={() => navigate('/tech/alertes')}
                  className="relative p-2 bg-white/10 rounded-xl"
                >
                  <AlertTriangle size={22} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-chantier-red text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-btp-200 text-sm">Aujourd'hui</p>
              <p className="text-3xl font-display font-bold">{todayChantiers.length}</p>
              <p className="text-btp-200 text-sm">chantier{todayChantiers.length > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-btp-200 text-sm">À venir</p>
              <p className="text-3xl font-display font-bold">{chantiers.filter(c => c.status === 'a_venir').length}</p>
              <p className="text-btp-200 text-sm">chantier{chantiers.filter(c => c.status === 'a_venir').length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6">
        {/* 🚨 ALERTE : Rapports en attente */}
        {chantiersNeedingReport.length > 0 && (
          <section className="animate-slide-up">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-4 text-white shadow-lg">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileWarning size={24} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">
                    {chantiersNeedingReport.length} rapport{chantiersNeedingReport.length > 1 ? 's' : ''} en attente
                  </h2>
                  <p className="text-white/80 text-sm">
                    Ces chantiers sont terminés, veuillez remplir le rapport de fin.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {chantiersNeedingReport.slice(0, 3).map((chantier) => (
                  <button
                    key={chantier.id}
                    onClick={() => navigate(`/tech/rapport/${chantier.id}`)}
                    className="w-full bg-white/10 hover:bg-white/20 rounded-xl p-3 text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{chantier.clientName}</p>
                      <p className="text-sm text-white/70">{chantier.workType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList size={18} />
                      <span className="text-sm font-medium">Remplir</span>
                    </div>
                  </button>
                ))}
              </div>
              
              {chantiersNeedingReport.length > 3 && (
                <p className="text-center text-white/70 text-sm mt-3">
                  + {chantiersNeedingReport.length - 3} autre(s) rapport(s) en attente
                </p>
              )}
            </div>
          </section>
        )}

        {/* Chantier en cours */}
        {currentChantier && (
          <section className="animate-slide-up">
            <h2 className="font-display font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-chantier-orange rounded-full animate-pulse"></span>
              En cours maintenant
            </h2>
            <div
              onClick={() => handleStartChantier(currentChantier)}
              className="card border-2 border-chantier-orange cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-inprogress">En cours</span>
                <span className="text-sm text-gray-500">
                  {formatTime(currentChantier.startDatetime)} - {formatTime(currentChantier.endDatetime)}
                </span>
              </div>
              <h3 className="font-display font-semibold text-xl text-gray-800 mb-1">
                {currentChantier.clientName}
              </h3>
              <p className="text-btp-600 font-medium mb-3">{currentChantier.workType}</p>
              <div className="flex items-start gap-2 text-gray-600 mb-4">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <span className="text-sm">{currentChantier.address}</span>
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Play size={20} />
                Remplir le rapport
              </button>
            </div>
          </section>
        )}

        {/* Chantiers du jour */}
        {upcomingToday.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-display font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-btp-600" />
              Aujourd'hui
            </h2>
            <div className="space-y-3">
              {upcomingToday.map((chantier) => (
                <div
                  key={chantier.id}
                  onClick={() => handleStartChantier(chantier)}
                  className="card card-hover cursor-pointer border-l-4 border-l-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatTime(chantier.startDatetime)} - {formatTime(chantier.endDatetime)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800">{chantier.clientName}</h3>
                      <p className="text-sm text-btp-600">{chantier.workType}</p>
                    </div>
                    <ChevronRight size={24} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pas de chantier aujourd'hui */}
        {todayChantiers.length === 0 && chantiersNeedingReport.length === 0 && (
          <section className="animate-slide-up">
            <div className="card text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HardHat size={32} className="text-gray-400" />
              </div>
              <h3 className="font-display font-semibold text-gray-800 mb-2">
                Pas de chantier aujourd'hui
              </h3>
              <p className="text-gray-500 mb-4">Profitez de cette journée de repos !</p>
              <button
                onClick={() => navigate('/tech/calendrier')}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Calendar size={18} />
                Voir mon planning
              </button>
            </div>
          </section>
        )}

        {/* Prochains chantiers */}
        {upcomingChantiers.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-gray-800">Prochains chantiers</h2>
              <button
                onClick={() => navigate('/tech/calendrier')}
                className="text-btp-600 text-sm font-medium hover:underline"
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-3">
              {upcomingChantiers.map((chantier) => (
                <div
                  key={chantier.id}
                  onClick={() => handleStartChantier(chantier)}
                  className="card card-hover cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-btp-100 rounded-2xl flex flex-col items-center justify-center text-btp-600">
                      <span className="text-xs font-medium">
                        {new Date(chantier.startDatetime).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-bold">
                        {new Date(chantier.startDatetime).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{chantier.clientName}</h3>
                      <p className="text-sm text-btp-600">{chantier.workType}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(chantier.startDatetime)} - {formatTime(chantier.endDatetime)}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <TechnicianNav />
    </div>
  );
}
