import { useEffect, useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Calendar,
  Clock, CheckCircle, AlertTriangle, PieChart
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useChantierStore, useRapportStore, useUserStore, useAlertStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';

export function AdminStatsPage() {
  const { chantiers, loadChantiers } = useChantierStore();
  const { rapports, loadRapports } = useRapportStore();
  const { technicians, loadUsers } = useUserStore();
  const { alerts, loadAlerts } = useAlertStore();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadChantiers();
    loadRapports();
    loadUsers();
    loadAlerts();
  }, []);

  // Calculs des statistiques
  const stats = {
    totalChantiers: chantiers.length,
    chantiersTermines: chantiers.filter(c => c.status === 'termine').length,
    chantiersEnCours: chantiers.filter(c => c.status === 'en_cours').length,
    chantiersAVenir: chantiers.filter(c => c.status === 'a_venir').length,
    totalRapports: rapports.length,
    rapportsAvecProblemes: rapports.filter(r => r.hasProblems).length,
    totalAlerts: alerts.length,
    alertsNonLues: alerts.filter(a => !a.isRead).length,
  };

  const tauxCompletion = stats.totalChantiers > 0 
    ? Math.round((stats.chantiersTermines / stats.totalChantiers) * 100) 
    : 0;

  const tauxProblemes = stats.totalRapports > 0
    ? Math.round((stats.rapportsAvecProblemes / stats.totalRapports) * 100)
    : 0;

  // Données pour le graphique (chantiers par jour ce mois)
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const chartData = daysInMonth.map(day => ({
    day: format(day, 'd'),
    count: chantiers.filter(c => isSameDay(c.startDatetime, day)).length
  }));

  // Chantiers par type de travaux
  const workTypeStats = chantiers.reduce((acc, c) => {
    acc[c.workType] = (acc[c.workType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const workTypeArray = Object.entries(workTypeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Performance des techniciens
  const techPerformance = technicians.map(tech => {
    const techChantiers = chantiers.filter(c => c.technicianIds.includes(tech.id));
    const techRapports = rapports.filter(r => r.technicianId === tech.id);
    return {
      name: tech.name,
      chantiers: techChantiers.length,
      termines: techChantiers.filter(c => c.status === 'termine').length,
      rapports: techRapports.length
    };
  }).sort((a, b) => b.chantiers - a.chantiers);

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-800">Statistiques</h1>
              <p className="text-gray-500 mt-1">Analysez les performances de votre équipe</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['week', 'month', 'year'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
          </div>

          {/* KPIs principaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Total chantiers</span>
                <Calendar size={20} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalChantiers}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp size={16} />
                <span>+12% vs mois dernier</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Taux de complétion</span>
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{tauxCompletion}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${tauxCompletion}%` }}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Rapports soumis</span>
                <BarChart3 size={20} className="text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalRapports}</p>
              <p className="text-sm text-gray-500 mt-2">
                {stats.rapportsAvecProblemes} avec incidents
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Alertes</span>
                <AlertTriangle size={20} className="text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.totalAlerts}</p>
              <p className="text-sm text-orange-600 mt-2">
                {stats.alertsNonLues} non lues
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Graphique activité mensuelle */}
            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
                Activité du mois - {format(new Date(), 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="h-48 flex items-end gap-1">
                {chartData.map((d, i) => {
                  const maxCount = Math.max(...chartData.map(x => x.count), 1);
                  const height = (d.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${d.day}: ${d.count} chantier(s)`}
                      />
                      {(i % 5 === 0 || i === chartData.length - 1) && (
                        <span className="text-xs text-gray-400 mt-1">{d.day}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Répartition par type */}
            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
                Répartition par type de travaux
              </h2>
              {workTypeArray.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {workTypeArray.map(([type, count], index) => {
                    const percentage = Math.round((count / stats.totalChantiers) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{type}</span>
                          <span className="text-sm font-medium text-gray-800">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`${colors[index % colors.length]} h-3 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Performance techniciens */}
          <div className="card">
            <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
              Performance des techniciens
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Technicien</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Chantiers assignés</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Terminés</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Rapports</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Taux complétion</th>
                  </tr>
                </thead>
                <tbody>
                  {techPerformance.map((tech, index) => {
                    const taux = tech.chantiers > 0 
                      ? Math.round((tech.termines / tech.chantiers) * 100) 
                      : 0;
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-medium text-gray-800">{tech.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-800">{tech.chantiers}</td>
                        <td className="py-3 px-4 text-center text-green-600 font-medium">{tech.termines}</td>
                        <td className="py-3 px-4 text-center text-gray-800">{tech.rapports}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${taux >= 80 ? 'bg-green-500' : taux >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${taux}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{taux}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
