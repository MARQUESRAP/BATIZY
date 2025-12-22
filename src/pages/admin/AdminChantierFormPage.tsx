import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { useChantierStore, useUserStore, useWorkTypeStore, useAuthStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';

export function AdminChantierFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const { user } = useAuthStore();
  const { getChantier, createChantier, updateChantier, deleteChantier } = useChantierStore();
  const { technicians, loadUsers } = useUserStore();
  const { workTypes, loadWorkTypes } = useWorkTypeStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    clientName: '', clientPhone: '', clientEmail: '', address: '', workType: '',
    startDate: '', startTime: '08:00', endDate: '', endTime: '17:00',
    technicianIds: [] as string[], notes: ''
  });

  useEffect(() => { loadUsers(); loadWorkTypes(); if (id) loadChantierData(); }, [id]);

  const loadChantierData = async () => {
    if (!id) return;
    setLoading(true);
    const chantier = await getChantier(id);
    if (chantier) {
      const startDate = new Date(chantier.startDatetime);
      const endDate = new Date(chantier.endDatetime);
      setForm({
        clientName: chantier.clientName, clientPhone: chantier.clientPhone,
        clientEmail: chantier.clientEmail || '', address: chantier.address,
        workType: chantier.workType,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        technicianIds: chantier.technicianIds, notes: chantier.notes || ''
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTechnicianToggle = (techId: string) => {
    setForm(prev => ({
      ...prev,
      technicianIds: prev.technicianIds.includes(techId)
        ? prev.technicianIds.filter(id => id !== techId)
        : [...prev.technicianIds, techId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.clientName || !form.clientPhone || !form.address || !form.workType || !form.startDate || !form.technicianIds.length) {
      alert('Veuillez remplir tous les champs obligatoires'); return;
    }
    setSaving(true);
    try {
      const chantierData = {
        clientName: form.clientName, clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || undefined, address: form.address,
        workType: form.workType,
        startDatetime: new Date(`${form.startDate}T${form.startTime}`),
        endDatetime: new Date(`${form.endDate || form.startDate}T${form.endTime}`),
        status: 'a_venir' as const, technicianIds: form.technicianIds,
        notes: form.notes || undefined, createdBy: user.id
      };
      if (isEditing && id) await updateChantier(id, chantierData);
      else await createChantier(chantierData);
      navigate('/admin/chantiers');
    } catch (err) { alert('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => { if (id) { await deleteChantier(id); navigate('/admin/chantiers'); } };

  if (loading) return <div className="min-h-screen bg-gray-50"><AdminSidebar /><main className="lg:ml-72 pt-16 lg:pt-0 flex items-center justify-center min-h-screen"><Loader2 size={32} className="animate-spin text-btp-600" /></main></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={24} className="text-gray-600" /></button>
            <h1 className="font-display text-2xl font-bold text-gray-800">{isEditing ? 'Modifier le chantier' : 'Nouveau chantier'}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">Informations client</h2>
              <div className="space-y-4">
                <div><label className="input-label">Nom du client *</label><input type="text" name="clientName" value={form.clientName} onChange={handleChange} placeholder="Ex: M. Dupont" className="input-field" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="input-label">Téléphone *</label><input type="tel" name="clientPhone" value={form.clientPhone} onChange={handleChange} placeholder="06 12 34 56 78" className="input-field" required /></div>
                  <div><label className="input-label">Email</label><input type="email" name="clientEmail" value={form.clientEmail} onChange={handleChange} placeholder="client@email.fr" className="input-field" /></div>
                </div>
                <div><label className="input-label">Adresse du chantier *</label><input type="text" name="address" value={form.address} onChange={handleChange} placeholder="15 rue de la Paix, 59000 Lille" className="input-field" required /></div>
              </div>
            </div>

            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">Type et planning</h2>
              <div className="space-y-4">
                <div><label className="input-label">Type de travaux *</label>
                  <select name="workType" value={form.workType} onChange={handleChange} className="input-field" required>
                    <option value="">Sélectionner...</option>
                    {workTypes.map(wt => <option key={wt.id} value={wt.name}>{wt.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="input-label">Date début *</label><input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input-field" required /></div>
                  <div><label className="input-label">Heure début</label><input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="input-field" /></div>
                  <div><label className="input-label">Date fin</label><input type="date" name="endDate" value={form.endDate || form.startDate} onChange={handleChange} className="input-field" /></div>
                  <div><label className="input-label">Heure fin</label><input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="input-field" /></div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">Technicien(s) assigné(s) *</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {technicians.map(tech => (
                  <button key={tech.id} type="button" onClick={() => handleTechnicianToggle(tech.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.technicianIds.includes(tech.id) ? 'border-btp-600 bg-btp-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${form.technicianIds.includes(tech.id) ? 'bg-btp-600' : 'bg-gray-400'}`}>
                        {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div><p className="font-medium text-gray-800">{tech.name}</p><p className="text-xs text-gray-500">{tech.phone}</p></div>
                    </div>
                  </button>
                ))}
              </div>
              {form.technicianIds.length === 0 && <p className="text-chantier-orange text-sm mt-3">⚠️ Sélectionnez au moins un technicien</p>}
            </div>

            <div className="card">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-4">Notes / Instructions</h2>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Instructions particulières..." rows={4} className="input-field resize-none" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isEditing && <button type="button" onClick={() => setShowDeleteModal(true)} className="btn-danger flex items-center justify-center gap-2 sm:order-1"><Trash2 size={20} />Supprimer</button>}
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={20} className="animate-spin" />Enregistrement...</> : <><Save size={20} />{isEditing ? 'Enregistrer' : 'Créer le chantier'}</>}
              </button>
            </div>
          </form>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-2">Supprimer ce chantier ?</h3>
            <p className="text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
