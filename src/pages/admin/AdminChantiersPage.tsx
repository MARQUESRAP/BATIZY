import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { useChantierStore, useUserStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';
import { ChantierStatus } from '../../types';
import { formatDate, formatTime, getStatusLabel, getStatusBadgeClass } from '../../utils/helpers';

export function AdminChantiersPage() {
  const navigate = useNavigate();
  const { chantiers, loadChantiers, loading } = useChantierStore();
  const { technicians, loadUsers } = useUserStore();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChantierStatus | 'all'>('all');
  const [techFilter, setTechFilter] = useState<string>('all');

  useEffect(() => {
    loadChantiers();
    loadUsers();
  }, []);

  const filteredChantiers = chantiers.filter(c => {
    const matchesSearch = 
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.workType.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesTech = techFilter === 'all' || c.technicianIds.includes(techFilter);
    
    return matchesSearch && matchesStatus && matchesTech;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-800">
                Gestion des chantiers
              </h1>
              <p className="text-gray-500">{chantiers.length} chantier(s) au total</p>
            </div>
            <button
              onClick={() => navigate('/admin/chantiers/nouveau')}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nouveau chantier
            </button>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client, adresse..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-12"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ChantierStatus | 'all')}
                className="input-field lg:w-48"
              >
                <option value="all">Tous les statuts</option>
                <option value="a_venir">À venir</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>

              {/* Tech Filter */}
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="input-field lg:w-48"
              >
                <option value="all">Tous les techniciens</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chantiers List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-btp-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredChantiers.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Aucun chantier trouvé</h3>
              <p className="text-gray-500 mb-4">
                {search || statusFilter !== 'all' || techFilter !== 'all' 
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par créer votre premier chantier'}
              </p>
              {!search && statusFilter === 'all' && techFilter === 'all' && (
                <button
                  onClick={() => navigate('/admin/chantiers/nouveau')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Créer un chantier
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChantiers.map((chantier) => {
                const techs = technicians.filter(t => chantier.technicianIds.includes(t.id));
                
                return (
                  <div
                    key={chantier.id}
                    onClick={() => navigate(`/admin/chantiers/${chantier.id}`)}
                    className={`card card-hover cursor-pointer border-l-4 ${
                      chantier.status === 'en_cours' ? 'border-l-chantier-orange' :
                      chantier.status === 'termine' ? 'border-l-chantier-green' :
                      'border-l-blue-500'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display font-semibold text-lg text-gray-800">
                            {chantier.clientName}
                          </h3>
                          <span className={`badge ${getStatusBadgeClass(chantier.status)}`}>
                            {getStatusLabel(chantier.status)}
                          </span>
                        </div>
                        
                        <p className="text-btp-600 font-medium mb-3">{chantier.workType}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            {formatDate(chantier.startDatetime)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            {formatTime(chantier.startDatetime)} - {formatTime(chantier.endDatetime)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="truncate max-w-[200px]">{chantier.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Techniciens */}
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <div className="flex -space-x-2">
                            {techs.slice(0, 3).map((tech, i) => (
                              <div
                                key={tech.id}
                                className="w-8 h-8 rounded-full bg-btp-600 text-white text-xs font-semibold flex items-center justify-center border-2 border-white"
                                title={tech.name}
                              >
                                {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            ))}
                            {techs.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 text-xs font-semibold flex items-center justify-center border-2 border-white">
                                +{techs.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        <ChevronRight size={24} className="text-gray-300 hidden lg:block" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
