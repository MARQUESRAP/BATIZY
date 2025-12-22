import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Clock, User, FileText, 
  Play, Camera, CheckCircle, AlertTriangle, Navigation
} from 'lucide-react';
import { useChantierStore, useAuthStore, useUserStore, useRapportStore, useAlertStore } from '../../stores';
import { Chantier } from '../../types';
import { formatDate, formatTime, getStatusLabel, getStatusBadgeClass, getMapsLink, getPhoneLink } from '../../utils/helpers';

export function TechChantierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getChantier, updateChantier } = useChantierStore();
  const { technicians, loadUsers } = useUserStore();
  const { startRapport, currentRapport } = useRapportStore();
  const { createAlert } = useAlertStore();
  
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<'retard' | 'annulation' | 'besoin_materiel' | 'autre'>('autre');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadUsers();
    loadChantier();
  }, [id]);

  const loadChantier = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getChantier(id);
    setChantier(data || null);
    setLoading(false);
  };

  const handleStartChantier = async () => {
    if (!chantier || !user) return;
    
    // Mettre le chantier en cours
    await updateChantier(chantier.id, { status: 'en_cours' });
    
    // Démarrer le rapport
    startRapport(chantier.id, user.id);
    
    // Naviguer vers le formulaire de rapport
    navigate(`/tech/rapport/${chantier.id}`);
  };

  const handleSendAlert = async () => {
    if (!chantier || !user || !alertMessage.trim()) return;
    
    await createAlert({
      chantierId: chantier.id,
      technicianId: user.id,
      alertType,
      message: alertMessage
    });
    
    setShowAlertModal(false);
    setAlertMessage('');
    alert('Alerte envoyée avec succès !');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-btp-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button onClick={() => navigate(-1)} className="btn-secondary mb-4">
          <ArrowLeft size={20} /> Retour
        </button>
        <div className="card text-center py-10">
          <p className="text-gray-500">Chantier non trouvé</p>
        </div>
      </div>
    );
  }

  const assignedTechs = technicians.filter(t => chantier.technicianIds.includes(t.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <header className="bg-btp-600 text-white pt-safe-top">
        <div className="px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-btp-200 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <span className={`badge ${getStatusBadgeClass(chantier.status)} mb-2`}>
                {getStatusLabel(chantier.status)}
              </span>
              <h1 className="font-display text-2xl font-bold">{chantier.clientName}</h1>
              <p className="text-btp-200">{chantier.workType}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-4">
        {/* Date & Heure */}
        <div className="card">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-12 h-12 bg-btp-100 rounded-2xl flex items-center justify-center">
              <Clock size={24} className="text-btp-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{formatDate(chantier.startDatetime)}</p>
              <p className="text-sm">{formatTime(chantier.startDatetime)} - {formatTime(chantier.endDatetime)}</p>
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="card">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 mb-1">Adresse</p>
              <p className="text-gray-600 text-sm mb-3">{chantier.address}</p>
              <a
                href={getMapsLink(chantier.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-btp-600 font-medium text-sm hover:underline"
              >
                <Navigation size={16} />
                Ouvrir dans Maps
              </a>
            </div>
          </div>
        </div>

        {/* Contact Client */}
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Phone size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Contact client</p>
              <p className="text-gray-600 text-sm">{chantier.clientPhone}</p>
            </div>
            <a
              href={getPhoneLink(chantier.clientPhone)}
              className="btn-icon bg-green-100 text-green-600"
            >
              <Phone size={20} />
            </a>
          </div>
        </div>

        {/* Équipe */}
        {assignedTechs.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-gray-400" />
              <p className="font-semibold text-gray-800">Équipe sur ce chantier</p>
            </div>
            <div className="space-y-2">
              {assignedTechs.map((tech) => (
                <div key={tech.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-btp-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{tech.name}</p>
                    {tech.phone && <p className="text-xs text-gray-500">{tech.phone}</p>}
                  </div>
                  {tech.id === user?.id && (
                    <span className="text-xs bg-btp-100 text-btp-600 px-2 py-1 rounded-full">Vous</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {chantier.notes && (
          <div className="card bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Notes importantes</p>
                <p className="text-amber-700 text-sm">{chantier.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {chantier.status === 'a_venir' && (
            <button
              onClick={handleStartChantier}
              className="btn-success w-full flex items-center justify-center gap-2 text-lg"
            >
              <Play size={24} />
              Remplir le rapport
            </button>
          )}

          {chantier.status === 'en_cours' && (
            <button
              onClick={() => navigate(`/tech/rapport/${chantier.id}`)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
            >
              <Camera size={24} />
              Remplir le rapport
            </button>
          )}

          {chantier.status === 'termine' && (
            <div className="card bg-green-50 border border-green-200 text-center">
              <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">Chantier terminé</p>
              <p className="text-sm text-green-600">Le rapport a été soumis</p>
            </div>
          )}

          {chantier.status !== 'termine' && (
            <button
              onClick={() => setShowAlertModal(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-chantier-orange border-chantier-orange hover:bg-orange-50"
            >
              <AlertTriangle size={20} />
              Signaler un problème
            </button>
          )}
        </div>
      </main>

      {/* Modal Alerte */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md animate-slide-up">
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-gray-800 mb-4">
                Signaler un problème
              </h3>
              
              <div className="space-y-3 mb-4">
                <label className="input-label">Type de problème</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'retard', label: '⏰ Retard' },
                    { value: 'annulation', label: '❌ Annulation' },
                    { value: 'besoin_materiel', label: '🔧 Matériel' },
                    { value: 'autre', label: '❗ Autre' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAlertType(opt.value as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        alertType === opt.value
                          ? 'border-btp-600 bg-btp-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="input-label">Description</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Décrivez le problème..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendAlert}
                  disabled={!alertMessage.trim()}
                  className="btn-danger flex-1"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
