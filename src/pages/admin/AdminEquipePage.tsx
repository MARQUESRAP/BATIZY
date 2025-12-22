import { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Phone, Mail, MoreVertical,
  CheckCircle, XCircle, Edit2, Trash2, HardHat
} from 'lucide-react';
import { useUserStore, useChantierStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';

export function AdminEquipePage() {
  const { technicians, admins, loadUsers } = useUserStore();
  const { chantiers, loadChantiers } = useChantierStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadChantiers();
  }, []);

  const allUsers = [...admins, ...technicians];
  
  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.code.includes(searchTerm)
  );

  const getTechnicianStats = (techId: string) => {
    const techChantiers = chantiers.filter(c => c.technicianIds.includes(techId));
    return {
      total: techChantiers.length,
      enCours: techChantiers.filter(c => c.status === 'en_cours').length,
      termines: techChantiers.filter(c => c.status === 'termine').length
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-800">Équipe</h1>
              <p className="text-gray-500 mt-1">Gérez vos techniciens et administrateurs</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter un membre
            </button>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{allUsers.length}</p>
                  <p className="text-sm text-gray-500">Total membres</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <HardHat size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{technicians.length}</p>
                  <p className="text-sm text-gray-500">Techniciens</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Users size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{admins.length}</p>
                  <p className="text-sm text-gray-500">Administrateurs</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {allUsers.filter(u => u.isActive).length}
                  </p>
                  <p className="text-sm text-gray-500">Actifs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="card mb-6">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Liste des membres */}
          <div className="card">
            <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
              Membres de l'équipe ({filteredUsers.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Membre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Rôle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Chantiers</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const stats = user.role === 'technicien' ? getTechnicianStats(user.id) : null;
                    const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
                    
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                            }`}>
                              {initials}
                            </div>
                            <span className="font-medium text-gray-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Technicien'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {user.code}
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {user.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone size={14} />
                                {user.phone}
                              </div>
                            )}
                            {user.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail size={14} />
                                {user.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {stats ? (
                            <div className="text-sm">
                              <span className="text-gray-800 font-medium">{stats.total}</span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span className="text-orange-600">{stats.enCours} en cours</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {user.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle size={16} />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400 text-sm">
                              <XCircle size={16} />
                              Inactif
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} className="text-gray-500" />
                            </button>
                            
                            {selectedUser === user.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border z-10 py-1 min-w-[150px]">
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                  <Edit2 size={16} />
                                  Modifier
                                </button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                                  <Trash2 size={16} />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun membre trouvé</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Ajouter membre (simplifié) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Ajouter un membre</h2>
            
            <div className="space-y-4">
              <div>
                <label className="input-label">Nom complet</label>
                <input type="text" className="input-field" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="input-label">Code d'accès (4 chiffres)</label>
                <input type="text" className="input-field" placeholder="1234" maxLength={4} />
              </div>
              <div>
                <label className="input-label">Rôle</label>
                <select className="input-field">
                  <option value="technicien">Technicien</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="input-label">Téléphone</label>
                <input type="tel" className="input-field" placeholder="06 12 34 56 78" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button className="btn-primary flex-1">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
