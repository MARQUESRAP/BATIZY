import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Clock, Camera, Package, AlertTriangle, 
  Wrench, PenTool, CheckCircle, X, Plus, Minus, Loader2
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useChantierStore, useRapportStore, useWorkTypeStore, useAuthStore } from '../../stores';
import { Chantier, QuantityUsed } from '../../types';
import { formatTime, compressImage } from '../../utils/helpers';

type Step = 'start' | 'materials' | 'photos' | 'problems' | 'extra' | 'signature';

export function TechRapportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getChantier } = useChantierStore();
  const { currentRapport, updateCurrentRapport, submitRapport, startRapport } = useRapportStore();
  const { workTypes, loadWorkTypes } = useWorkTypeStore();
  const signatureRef = useRef<SignatureCanvas>(null);

  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [step, setStep] = useState<Step>('start');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [endTime, setEndTime] = useState('');
  const [quantities, setQuantities] = useState<QuantityUsed[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasProblems, setHasProblems] = useState(false);
  const [problemsDescription, setProblemDescription] = useState('');
  const [hasExtraWork, setHasExtraWork] = useState(false);
  const [extraWorkDescription, setExtraWorkDescription] = useState('');

  useEffect(() => {
    loadWorkTypes();
    loadChantierData();
  }, [id]);

  const loadChantierData = async () => {
    if (!id || !user) return;
    const data = await getChantier(id);
    setChantier(data || null);
    
    // Si pas de rapport en cours, en créer un
    if (!currentRapport || currentRapport.chantierId !== id) {
      startRapport(id, user.id);
    }
    
    // Initialiser les quantités avec les matériaux du type de travaux
    if (data) {
      const wt = workTypes.find(w => w.name === data.workType);
      if (wt) {
        setQuantities(wt.materials.map(m => ({
          material: m.name,
          quantity: 0,
          unit: m.unit
        })));
      }
    }
    
    setLoading(false);
  };

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'start', label: 'Début', icon: Clock },
    { key: 'materials', label: 'Matériaux', icon: Package },
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'problems', label: 'Problèmes', icon: AlertTriangle },
    { key: 'extra', label: 'Travaux +', icon: Wrench },
    { key: 'signature', label: 'Signature', icon: PenTool },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file);
        setPhotos(prev => [...prev, compressed]);
      } catch (err) {
        console.error('Erreur compression:', err);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setQuantities(prev => prev.map((q, i) => 
      i === index ? { ...q, quantity: Math.max(0, q.quantity + delta) } : q
    ));
  };

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Veuillez faire signer le client');
      return;
    }

    setSubmitting(true);
    try {
      const signature = signatureRef.current.toDataURL();
      
      updateCurrentRapport({
        startTime: new Date(`${new Date().toDateString()} ${startTime}`),
        endTime: endTime ? new Date(`${new Date().toDateString()} ${endTime}`) : new Date(),
        quantitiesUsed: quantities.filter(q => q.quantity > 0),
        hasProblems,
        problemsDescription: hasProblems ? problemsDescription : undefined,
        hasExtraWork,
        extraWorkDescription: hasExtraWork ? extraWorkDescription : undefined,
        clientSignature: signature,
        photos: photos.map((p, i) => ({
          id: `photo-${Date.now()}-${i}`,
          rapportId: currentRapport?.id || '',
          photoType: 'after' as const,
          photoUrl: p,
          createdAt: new Date()
        }))
      });

      await submitRapport();
      
      // Forcer le rechargement des chantiers du technicien
      if (user) {
        const { loadChantiersByTechnician } = useChantierStore.getState();
        await loadChantiersByTechnician(user.id);
        console.log('[TechRapport] Chantiers technicien rechargés');
      }
      
      navigate('/tech', { replace: true });
    } catch (err) {
      console.error('Erreur soumission:', err);
      alert('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-btp-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="font-display font-semibold text-gray-800">Rapport de chantier</h1>
            <div className="w-10" />
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i <= currentStepIndex ? 'bg-btp-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Étape {currentStepIndex + 1}/{steps.length} : {steps[currentStepIndex].label}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-5 pb-32">
        {/* Étape 1: Début */}
        {step === 'start' && (
          <div className="animate-fade-in space-y-6">
            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">
                Heure de début
              </h2>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-field text-2xl text-center font-mono"
              />
            </div>

            <div className="card bg-btp-50 border border-btp-200">
              <h3 className="font-semibold text-btp-800 mb-2">{chantier?.clientName}</h3>
              <p className="text-btp-600">{chantier?.workType}</p>
              <p className="text-sm text-btp-500 mt-1">{chantier?.address}</p>
            </div>
          </div>
        )}

        {/* Étape 2: Matériaux */}
        {step === 'materials' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-display font-semibold text-lg text-gray-800">
              Quantités utilisées
            </h2>
            
            {quantities.map((q, index) => (
              <div key={q.material} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{q.material}</p>
                    <p className="text-sm text-gray-500">{q.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="w-16 text-center text-2xl font-bold text-gray-800">
                      {q.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="w-12 h-12 rounded-xl bg-btp-600 text-white flex items-center justify-center active:bg-btp-700"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Étape 3: Photos */}
        {step === 'photos' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-display font-semibold text-lg text-gray-800">
              Photos du travail terminé
            </h2>
            <p className="text-gray-500 text-sm">Prenez 2-3 photos du résultat</p>

            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-btp-500 hover:bg-btp-50 transition-colors">
                  <Camera size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>

            {photos.length < 2 && (
              <p className="text-chantier-orange text-sm">
                ⚠️ Minimum 2 photos requises
              </p>
            )}
          </div>
        )}

        {/* Étape 4: Problèmes */}
        {step === 'problems' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-display font-semibold text-lg text-gray-800">
              Problèmes rencontrés ?
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setHasProblems(false)}
                className={`card text-center py-8 ${!hasProblems ? 'border-2 border-green-500 bg-green-50' : ''}`}
              >
                <CheckCircle size={40} className={`mx-auto mb-2 ${!hasProblems ? 'text-green-500' : 'text-gray-300'}`} />
                <p className="font-semibold">Non</p>
              </button>
              <button
                onClick={() => setHasProblems(true)}
                className={`card text-center py-8 ${hasProblems ? 'border-2 border-chantier-orange bg-orange-50' : ''}`}
              >
                <AlertTriangle size={40} className={`mx-auto mb-2 ${hasProblems ? 'text-chantier-orange' : 'text-gray-300'}`} />
                <p className="font-semibold">Oui</p>
              </button>
            </div>

            {hasProblems && (
              <div className="animate-slide-up">
                <label className="input-label">Décrivez le problème</label>
                <textarea
                  value={problemsDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Ex: Client absent, manque de matériel..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Étape 5: Travaux supplémentaires */}
        {step === 'extra' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-display font-semibold text-lg text-gray-800">
              Travaux supplémentaires ?
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setHasExtraWork(false)}
                className={`card text-center py-8 ${!hasExtraWork ? 'border-2 border-green-500 bg-green-50' : ''}`}
              >
                <CheckCircle size={40} className={`mx-auto mb-2 ${!hasExtraWork ? 'text-green-500' : 'text-gray-300'}`} />
                <p className="font-semibold">Non</p>
              </button>
              <button
                onClick={() => setHasExtraWork(true)}
                className={`card text-center py-8 ${hasExtraWork ? 'border-2 border-btp-600 bg-btp-50' : ''}`}
              >
                <Wrench size={40} className={`mx-auto mb-2 ${hasExtraWork ? 'text-btp-600' : 'text-gray-300'}`} />
                <p className="font-semibold">Oui</p>
              </button>
            </div>

            {hasExtraWork && (
              <div className="animate-slide-up">
                <label className="input-label">Description des travaux</label>
                <textarea
                  value={extraWorkDescription}
                  onChange={(e) => setExtraWorkDescription(e.target.value)}
                  placeholder="Décrivez les travaux supplémentaires effectués..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Étape 6: Signature */}
        {step === 'signature' && (
          <div className="animate-fade-in space-y-4">
            <div className="card">
              <label className="input-label">Heure de fin</label>
              <input
                type="time"
                value={endTime || new Date().toTimeString().slice(0, 5)}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-field text-xl text-center font-mono"
              />
            </div>

            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-2">
                Signature du client
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Faites signer le client dans la zone ci-dessous
              </p>
              
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-48',
                    style: { width: '100%', height: '200px' }
                  }}
                  backgroundColor="white"
                />
              </div>

              <button
                onClick={() => signatureRef.current?.clear()}
                className="mt-3 text-sm text-btp-600 font-medium"
              >
                Effacer la signature
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-bottom">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <button onClick={goPrev} className="btn-secondary flex-1">
              <ArrowLeft size={20} />
              Précédent
            </button>
          )}

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={goNext}
              disabled={step === 'photos' && photos.length < 2}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Suivant
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-success flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={20} className="animate-spin" />Envoi...</>
              ) : (
                <><CheckCircle size={20} />Valider le rapport</>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
