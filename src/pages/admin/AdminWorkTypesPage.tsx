import { useState, useEffect } from 'react';
import { 
  Wrench, Plus, Edit2, Trash2, Save, X, Package, 
  ChevronDown, ChevronUp, Loader2, AlertCircle
} from 'lucide-react';
import { useWorkTypeStore } from '../../stores';
import { AdminSidebar } from '../../components/shared';
import { WorkType, Material } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function AdminWorkTypesPage() {
  const { workTypes, loadWorkTypes } = useWorkTypeStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMaterials, setFormMaterials] = useState<Material[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await loadWorkTypes();
    setLoading(false);
  };

  const handleAddNew = () => {
    setFormName('');
    setFormMaterials([{ name: '', unit: 'pièces', defaultQuantity: 1 }]);
    setShowAddModal(true);
  };

  const handleEdit = (workType: WorkType) => {
    setEditingId(workType.id);
    setFormName(workType.name);
    setFormMaterials([...workType.materials]);
    setExpandedId(workType.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormName('');
    setFormMaterials([]);
  };

  const handleAddMaterial = () => {
    setFormMaterials([...formMaterials, { name: '', unit: 'pièces', defaultQuantity: 1 }]);
  };

  const handleRemoveMaterial = (index: number) => {
    setFormMaterials(formMaterials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: keyof Material, value: string | number) => {
    const updated = [...formMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setFormMaterials(updated);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('Le nom du type de travaux est requis');
      return;
    }

    const validMaterials = formMaterials.filter(m => m.name.trim());
    if (validMaterials.length === 0) {
      alert('Ajoutez au moins un matériau');
      return;
    }

    setSaving(true);

    try {
      if (isSupabaseConfigured()) {
        if (editingId) {
          // Mise à jour
          const { error } = await supabase
            .from('work_types')
            .update({ 
              name: formName.trim(), 
              materials: JSON.stringify(validMaterials) 
            })
            .eq('id', editingId);
          
          if (error) throw error;
        } else {
          // Création
          const { error } = await supabase
            .from('work_types')
            .insert({ 
              name: formName.trim(), 
              materials: JSON.stringify(validMaterials) 
            });
          
          if (error) throw error;
        }
      }

      await loadWorkTypes();
      handleCancelEdit();
      setShowAddModal(false);
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('work_types')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }

      await loadWorkTypes();
      setShowDeleteModal(null);
    } catch (e) {
      console.error('Erreur suppression:', e);
      alert('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="lg:ml-72 pt-16 lg:pt-0 flex items-center justify-center min-h-screen">
          <Loader2 size={32} className="animate-spin text-btp-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-800">Types de travaux</h1>
              <p className="text-gray-500 mt-1">Gérez les types de travaux et leurs matériaux associés</p>
            </div>
            <button 
              onClick={handleAddNew}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter un type
            </button>
          </div>

          {/* Info */}
          {!isSupabaseConfigured() && (
            <div className="card bg-yellow-50 border border-yellow-200 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">Mode hors-ligne</p>
                  <p className="text-sm text-yellow-700">
                    Les modifications ne seront pas synchronisées avec Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Liste des types de travaux */}
          <div className="space-y-4">
            {workTypes.length === 0 ? (
              <div className="card text-center py-12">
                <Wrench size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun type de travaux défini</p>
                <button 
                  onClick={handleAddNew}
                  className="btn-primary mt-4"
                >
                  Créer le premier type
                </button>
              </div>
            ) : (
              workTypes.map(workType => {
                const isEditing = editingId === workType.id;
                const isExpanded = expandedId === workType.id;

                return (
                  <div 
                    key={workType.id}
                    className="card overflow-hidden"
                  >
                    {/* En-tête */}
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => !isEditing && toggleExpand(workType.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-btp-100 rounded-xl flex items-center justify-center">
                          <Wrench size={24} className="text-btp-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{workType.name}</h3>
                          <p className="text-sm text-gray-500">
                            {workType.materials.length} matériau{workType.materials.length > 1 ? 'x' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(workType);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={18} className="text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteModal(workType.id);
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                          </>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Contenu déplié */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {isEditing ? (
                          // Mode édition
                          <div className="space-y-4">
                            <div>
                              <label className="input-label">Nom du type de travaux</label>
                              <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="input-field"
                                placeholder="Ex: Couverture, Plomberie..."
                              />
                            </div>

                            <div>
                              <label className="input-label flex items-center gap-2">
                                <Package size={16} />
                                Matériaux
                              </label>
                              <div className="space-y-3">
                                {formMaterials.map((material, index) => (
                                  <div key={index} className="flex gap-2 items-start">
                                    <input
                                      type="text"
                                      value={material.name}
                                      onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                                      className="input-field flex-1"
                                      placeholder="Nom du matériau"
                                    />
                                    <input
                                      type="text"
                                      value={material.unit}
                                      onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                                      className="input-field w-24"
                                      placeholder="Unité"
                                    />
                                    <input
                                      type="number"
                                      value={material.defaultQuantity || 0}
                                      onChange={(e) => handleMaterialChange(index, 'defaultQuantity', parseInt(e.target.value) || 0)}
                                      className="input-field w-20"
                                      placeholder="Qté"
                                      min="0"
                                    />
                                    <button
                                      onClick={() => handleRemoveMaterial(index)}
                                      className="p-3 hover:bg-red-50 rounded-xl text-red-500"
                                      disabled={formMaterials.length <= 1}
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={handleAddMaterial}
                                className="mt-2 text-sm text-btp-600 font-medium flex items-center gap-1"
                              >
                                <Plus size={16} />
                                Ajouter un matériau
                              </button>
                            </div>

                            <div className="flex gap-3 pt-4">
                              <button
                                onClick={handleCancelEdit}
                                className="btn-secondary flex-1"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                              >
                                {saving ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Save size={18} />
                                )}
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Mode affichage
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Package size={16} />
                              Liste des matériaux
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {workType.materials.map((material, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                >
                                  <span className="font-medium text-gray-700">{material.name}</span>
                                  <span className="text-sm text-gray-500">
                                    {material.defaultQuantity} {material.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-display text-xl font-bold text-gray-800 mb-6">
                Nouveau type de travaux
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Nom du type de travaux *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input-field"
                    placeholder="Ex: Couverture, Plomberie, Électricité..."
                  />
                </div>

                <div>
                  <label className="input-label flex items-center gap-2">
                    <Package size={16} />
                    Matériaux associés *
                  </label>
                  <div className="space-y-3">
                    {formMaterials.map((material, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={material.name}
                          onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                          className="input-field flex-1"
                          placeholder="Nom du matériau"
                        />
                        <input
                          type="text"
                          value={material.unit}
                          onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                          className="input-field w-24"
                          placeholder="Unité"
                        />
                        <button
                          onClick={() => handleRemoveMaterial(index)}
                          className="p-3 hover:bg-red-50 rounded-xl text-red-500"
                          disabled={formMaterials.length <= 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddMaterial}
                    className="mt-2 text-sm text-btp-600 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Ajouter un matériau
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h3 className="font-display text-xl font-semibold text-gray-800 mb-2">
              Supprimer ce type de travaux ?
            </h3>
            <p className="text-gray-500 mb-6">
              Cette action est irréversible. Les chantiers existants utilisant ce type ne seront pas affectés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={saving}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
