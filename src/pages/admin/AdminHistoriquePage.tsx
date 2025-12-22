import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, Search, Filter, Calendar, CheckCircle, 
  FileText, Download, Eye, ChevronDown, FileDown, FileSpreadsheet, BarChart2
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useChantierStore, useRapportStore, useUserStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';
import { generateRapportPDF } from '../../utils/pdfGenerator';
import { exportChantiersCSV, exportRapportsCSV, generateMonthlyReport } from '../../utils/exportUtils';
import { Rapport, Chantier } from '../../types';

export function AdminHistoriquePage() {
  const navigate = useNavigate();
  const { chantiers, loadChantiers } = useChantierStore();
  const { rapports, loadRapports } = useRapportStore();
  const { technicians, loadUsers } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [expandedChantier, setExpandedChantier] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadChantiers();
    loadRapports();
    loadUsers();
  }, []);

  // Filtrer les chantiers terminés et avec rapports
  const completedChantiers = chantiers
    .filter(c => c.status === 'termine')
    .sort((a, b) => new Date(b.endDatetime).getTime() - new Date(a.endDatetime).getTime());

  const filteredChantiers = completedChantiers.filter(chantier => {
    const matchesSearch = 
      chantier.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chantier.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chantier.workType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getChantierRapports = (chantierId: string) => {
    return rapports.filter(r => r.chantierId === chantierId);
  };

  const handleDownloadPDF = (rapport: Rapport, chantier: Chantier) => {
    const technician = technicians.find(t => t.id === rapport.technicianId);
    generateRapportPDF(rapport, chantier, technician);
  };

  const toggleExpand = (chantierId: string) => {
    setExpandedChantier(expandedChantier === chantierId ? null : chantierId);
  };

  // Fonctions d'export
  const handleExportChantiersCSV = () => {
    exportChantiersCSV(chantiers, technicians);
    setShowExportMenu(false);
  };

  const handleExportRapportsCSV = () => {
    exportRapportsCSV(rapports, chantiers, technicians);
    setShowExportMenu(false);
  };

  const handleMonthlyReport = (monthOffset: number = 0) => {
    const targetMonth = monthOffset === 0 ? new Date() : subMonths(new Date(), Math.abs(monthOffset));
    generateMonthlyReport(chantiers, rapports, technicians, targetMonth);
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-800">Historique</h1>
              <p className="text-gray-500 mt-1">Consultez les chantiers terminés et leurs rapports</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={20} />
                Exporter
                <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Export CSV</p>
                      <button
                        onClick={handleExportChantiersCSV}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <FileSpreadsheet size={18} className="text-green-600" />
                        <span className="text-sm font-medium">Tous les chantiers</span>
                      </button>
                      <button
                        onClick={handleExportRapportsCSV}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <FileSpreadsheet size={18} className="text-blue-600" />
                        <span className="text-sm font-medium">Tous les rapports</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Rapport mensuel PDF</p>
                      <button
                        onClick={() => handleMonthlyReport(0)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <BarChart2 size={18} className="text-purple-600" />
                        <span className="text-sm font-medium">Ce mois-ci</span>
                      </button>
                      <button
                        onClick={() => handleMonthlyReport(-1)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <BarChart2 size={18} className="text-purple-600" />
                        <span className="text-sm font-medium">Mois précédent</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{completedChantiers.length}</p>
                  <p className="text-sm text-gray-500">Chantiers terminés</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{rapports.length}</p>
                  <p className="text-sm text-gray-500">Rapports soumis</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {completedChantiers.filter(c => {
                      const date = new Date(c.endDatetime);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-sm text-gray-500">Ce mois-ci</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <History size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {rapports.filter(r => r.hasProblems).length}
                  </p>
                  <p className="text-sm text-gray-500">Avec incidents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="card mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par client, adresse, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="quarter">Ce trimestre</option>
                  <option value="year">Cette année</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des chantiers terminés */}
          <div className="card">
            <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
              Chantiers terminés ({filteredChantiers.length})
            </h2>

            {filteredChantiers.length === 0 ? (
              <div className="text-center py-12">
                <History size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun chantier terminé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChantiers.map(chantier => {
                  const chantierRapports = getChantierRapports(chantier.id);
                  const techs = technicians.filter(t => chantier.technicianIds.includes(t.id));
                  const hasProblems = chantierRapports.some(r => r.hasProblems);
                  const isExpanded = expandedChantier === chantier.id;
                  
                  return (
                    <div
                      key={chantier.id}
                      className="bg-gray-50 rounded-2xl overflow-hidden"
                    >
                      {/* En-tête du chantier */}
                      <div 
                        className="p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(chantier.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-800">{chantier.clientName}</h3>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Terminé
                              </span>
                              {hasProblems && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                  Incident signalé
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{chantier.workType} • {chantier.address}</p>
                            <p className="text-sm text-gray-500">
                              {format(chantier.startDatetime, 'dd MMMM yyyy', { locale: fr })}
                              {' • '}
                              Techniciens: {techs.map(t => t.name.split(' ')[0]).join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <p className="text-sm font-medium text-gray-800">
                                {chantierRapports.length} rapport{chantierRapports.length > 1 ? 's' : ''}
                              </p>
                            </div>
                            <ChevronDown 
                              size={20} 
                              className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Rapports dépliables */}
                      {isExpanded && chantierRapports.length > 0 && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FileText size={16} />
                            Rapports de ce chantier
                          </h4>
                          <div className="space-y-3">
                            {chantierRapports.map(rapport => {
                              const tech = technicians.find(t => t.id === rapport.technicianId);
                              return (
                                <div 
                                  key={rapport.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-800">
                                        {tech?.name || 'Technicien inconnu'}
                                      </span>
                                      {rapport.hasProblems && (
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                          Problème
                                        </span>
                                      )}
                                      {rapport.hasExtraWork && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                          Travaux +
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {rapport.startTime && format(rapport.startTime, 'HH:mm', { locale: fr })}
                                      {rapport.endTime && ` - ${format(rapport.endTime, 'HH:mm', { locale: fr })}`}
                                      {rapport.quantitiesUsed && rapport.quantitiesUsed.length > 0 && (
                                        <> • {rapport.quantitiesUsed.filter(q => q.quantity > 0).length} matériaux</>
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadPDF(rapport, chantier);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-btp-600 text-white rounded-xl hover:bg-btp-700 transition-colors"
                                  >
                                    <FileDown size={18} />
                                    <span className="hidden sm:inline">Télécharger PDF</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Message si pas de rapport */}
                      {isExpanded && chantierRapports.length === 0 && (
                        <div className="border-t border-gray-200 bg-white p-4 text-center">
                          <p className="text-gray-500 text-sm">Aucun rapport disponible pour ce chantier</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
