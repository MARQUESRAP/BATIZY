import { useState, useEffect } from 'react';
import { 
  Settings, Building2, Palette, Bell, Shield, Database,
  Save, Plus, Trash2, Edit2, Check, X, HardHat
} from 'lucide-react';
import { useWorkTypeStore, useAuthStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';

type TabType = 'entreprise' | 'travaux' | 'notifications' | 'securite';

export function AdminParametresPage() {
  const { user } = useAuthStore();
  const { workTypes, loadWorkTypes } = useWorkTypeStore();
  const [activeTab, setActiveTab] = useState<TabType>('entreprise');
  const [editingWorkType, setEditingWorkType] = useState<string | null>(null);
  const [showAddWorkType, setShowAddWorkType] = useState(false);
  const [newWorkTypeName, setNewWorkTypeName] = useState('');

  // États des formulaires
  const [entrepriseSettings, setEntrepriseSettings] = useState({
    name: 'Entreprise BTP',
    address: '15 rue de la Construction, 59000 Lille',
    phone: '03 20 12 34 56',
    email: 'contact@entreprise-btp.fr',
    siret: '123 456 789 00012'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushAlerts: true,
    emailRapports: true,
    dailyDigest: false
  });

  useEffect(() => {
    loadWorkTypes();
  }, []);

  const tabs = [
    { id: 'entreprise', label: 'Entreprise', icon: Building2 },
    { id: 'travaux', label: 'Types de travaux', icon: HardHat },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-gray-800">Paramètres</h1>
            <p className="text-gray-500 mt-1">Configurez votre application Batizy</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Tabs */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="card p-2">
                <nav className="space-y-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon size={20} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Entreprise */}
              {activeTab === 'entreprise' && (
                <div className="card">
                  <h2 className="font-display font-semibold text-lg text-gray-800 mb-6">
                    Informations de l'entreprise
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="input-label">Nom de l'entreprise</label>
                      <input
                        type="text"
                        value={entrepriseSettings.name}
                        onChange={(e) => setEntrepriseSettings({...entrepriseSettings, name: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">Adresse</label>
                      <input
                        type="text"
                        value={entrepriseSettings.address}
                        onChange={(e) => setEntrepriseSettings({...entrepriseSettings, address: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Téléphone</label>
                        <input
                          type="tel"
                          value={entrepriseSettings.phone}
                          onChange={(e) => setEntrepriseSettings({...entrepriseSettings, phone: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label">Email</label>
                        <input
                          type="email"
                          value={entrepriseSettings.email}
                          onChange={(e) => setEntrepriseSettings({...entrepriseSettings, email: e.target.value})}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">SIRET</label>
                      <input
                        type="text"
                        value={entrepriseSettings.siret}
                        onChange={(e) => setEntrepriseSettings({...entrepriseSettings, siret: e.target.value})}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <button className="btn-primary flex items-center gap-2">
                      <Save size={20} />
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Types de travaux */}
              {activeTab === 'travaux' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display font-semibold text-lg text-gray-800">
                      Types de travaux
                    </h2>
                    <button
                      onClick={() => setShowAddWorkType(true)}
                      className="btn-primary flex items-center gap-2 py-2 px-4"
                    >
                      <Plus size={18} />
                      Ajouter
                    </button>
                  </div>

                  {/* Formulaire ajout */}
                  {showAddWorkType && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Nom du type de travaux"
                          value={newWorkTypeName}
                          onChange={(e) => setNewWorkTypeName(e.target.value)}
                          className="input-field flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            // Logique d'ajout ici
                            setShowAddWorkType(false);
                            setNewWorkTypeName('');
                          }}
                          className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddWorkType(false);
                            setNewWorkTypeName('');
                          }}
                          className="p-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {workTypes.map(workType => (
                      <div
                        key={workType.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <h3 className="font-medium text-gray-800">{workType.name}</h3>
                          <p className="text-sm text-gray-500">
                            {workType.materials.length} matériaux configurés
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingWorkType(workType.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} className="text-gray-500" />
                          </button>
                          <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {workTypes.length === 0 && (
                    <div className="text-center py-8">
                      <HardHat size={48} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun type de travaux configuré</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="card">
                  <h2 className="font-display font-semibold text-lg text-gray-800 mb-6">
                    Préférences de notifications
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-gray-800">Alertes par email</h3>
                        <p className="text-sm text-gray-500">Recevoir les alertes terrain par email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailAlerts}
                          onChange={(e) => setNotificationSettings({...notificationSettings, emailAlerts: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-gray-800">Notifications push</h3>
                        <p className="text-sm text-gray-500">Recevoir des notifications sur votre appareil</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushAlerts}
                          onChange={(e) => setNotificationSettings({...notificationSettings, pushAlerts: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-gray-800">Rapports par email</h3>
                        <p className="text-sm text-gray-500">Recevoir une copie des rapports soumis</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailRapports}
                          onChange={(e) => setNotificationSettings({...notificationSettings, emailRapports: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-gray-800">Résumé quotidien</h3>
                        <p className="text-sm text-gray-500">Recevoir un email récapitulatif chaque jour</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.dailyDigest}
                          onChange={(e) => setNotificationSettings({...notificationSettings, dailyDigest: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 pt-6 border-t">
                    <button className="btn-primary flex items-center gap-2">
                      <Save size={20} />
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Sécurité */}
              {activeTab === 'securite' && (
                <div className="space-y-6">
                  <div className="card">
                    <h2 className="font-display font-semibold text-lg text-gray-800 mb-6">
                      Sécurité du compte
                    </h2>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">Changer le code d'accès</h3>
                            <p className="text-sm text-gray-500">
                              Code actuel: <code className="bg-gray-200 px-2 py-0.5 rounded">{user?.code}</code>
                            </p>
                          </div>
                          <button className="btn-secondary py-2 px-4">
                            Modifier
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">Sessions actives</h3>
                            <p className="text-sm text-gray-500">Gérer les appareils connectés</p>
                          </div>
                          <button className="btn-secondary py-2 px-4">
                            Voir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h2 className="font-display font-semibold text-lg text-gray-800 mb-6 flex items-center gap-2">
                      <Database size={20} />
                      Données
                    </h2>

                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">Exporter les données</h3>
                            <p className="text-sm text-gray-500">Télécharger toutes vos données</p>
                          </div>
                          <button className="btn-secondary py-2 px-4">
                            Exporter
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-red-800">Zone de danger</h3>
                            <p className="text-sm text-red-600">Supprimer toutes les données</p>
                          </div>
                          <button className="btn-danger py-2 px-4">
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
