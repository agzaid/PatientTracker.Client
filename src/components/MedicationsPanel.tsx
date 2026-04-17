import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { medicationApi, type MedicationDto, type CreateMedicationRequest, type UpdateMedicationRequest } from '@/services/medicationApi';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import { Plus, Pill, Search, Trash2, Edit2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

const medicationFields: FieldConfig[] = [
  { name: 'name', label: 'Medication Name', type: 'text', placeholder: 'e.g., Metformin', required: true },
  { name: 'dosage', label: 'Dosage', type: 'text', placeholder: 'e.g., 500mg twice daily' },
  { name: 'frequency', label: 'Frequency', type: 'select', options: ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Weekly', 'Monthly', 'Other'] },
  { name: 'start_date', label: 'Start Date', type: 'date' },
  { name: 'end_date', label: 'End Date', type: 'date' },
  { name: 'is_current', label: 'Currently Taking', type: 'checkbox', placeholder: 'This medication is currently active' },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes about this medication...' },
];

const MedicationsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MedicationDto | null>(null);
  const [filter, setFilter] = useState<'all' | 'current' | 'past'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchMedications();
  }, [user]);

  const fetchMedications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const medications = await medicationApi.getMedications();
      setMedications(medications);
    } catch (error: any) {
      console.error('Failed to fetch medications:', error);
      toast.error(error.error || t('medications.fetchError'));
    }
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string, documentId?: number) => {
    if (!user) return;

    // Convert form data to API format
    const payload: CreateMedicationRequest | UpdateMedicationRequest = {
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      isCurrent: data.is_current,
      notes: data.notes,
      prescriptionUrl: fileUrl || data.prescription_url || undefined,
      documentIds: documentId ? [documentId] : undefined
    };

    try {
      if (editItem) {
        await medicationApi.updateMedication(editItem.id, payload as UpdateMedicationRequest);
        toast.success(t('medications.updated'));
      } else {
        await medicationApi.createMedication(payload as CreateMedicationRequest);
        toast.success(t('medications.added'));
      }
      setEditItem(null);
      fetchMedications();
    } catch (error: any) {
      console.error('Failed to save medication:', error);
      toast.error(error.error || t('medications.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('medications.deleteConfirmTitle'),
      text: t('medications.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await medicationApi.deleteMedication(id);
        toast.success(t('medications.deleted'));
        fetchMedications();
      } catch (error: any) {
        console.error('Failed to delete medication:', error);
        toast.error(error.error || t('medications.deleteError'));
      }
    }
  };

  const handlePrescriptionDownload = async (medication: MedicationDto) => {
    try {
      // Extract document ID from the URL if it's available
      // Or we might need to fetch documents for this medication
      const documents = await documentApi.getEntityDocuments(ParentEntityType.Medication, medication.id);
      const prescriptionDoc = documents.find(doc => doc.documentType === DocumentType.Prescription);
      
      if (prescriptionDoc) {
        const blob = await documentApi.downloadDocument(prescriptionDoc.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = prescriptionDoc.originalFileName || 'prescription.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error(t('documents.prescriptionNotFound'));
      }
    } catch (error: any) {
      console.error('Failed to download prescription:', error);
      toast.error(error.error || t('documents.downloadError'));
    }
  };

  const filtered = medications
    .filter(m => filter === 'all' || (filter === 'current' ? m.isCurrent : !m.isCurrent))
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.notes || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-600" /> {t('medications.title')}
          </h2>
          <p className="text-sm text-gray-500">{medications.length} {t('common.total')}, {medications.filter(m => m.isCurrent).length} {t('medications.active')}</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-gradient-to-r from-emerald-500 to-green-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t('medications.add')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('medications.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'current', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t(`medications.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Pill className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('medications.noMedications')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(med => (
            <div key={med.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${med.isCurrent ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <Pill className={`w-5 h-5 ${med.isCurrent ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {med.name}
                      {med.isCurrent ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> {t('medications.active')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> {t('medications.past')}
                        </span>
                      )}
                    </h4>
                    {med.dosage && <p className="text-sm text-gray-600 mt-0.5">{med.dosage}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      {med.frequency && <span>{med.frequency}</span>}
                      {med.startDate && <span>{t('medications.started')}: {new Date(med.startDate).toLocaleDateString()}</span>}
                      {med.endDate && <span>{t('medications.ended')}: {new Date(med.endDate).toLocaleDateString()}</span>}
                    </div>
                    {med.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{med.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {med.prescriptionUrl && (
                    <button onClick={() => handlePrescriptionDownload(med)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition" title={t('medications.downloadPrescription')}>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => { setEditItem(med); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(med.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? t('medications.edit') : t('medications.add')}
        fields={medicationFields}
        initialData={editItem ? {
          ...editItem,
          start_date: editItem.startDate,
          end_date: editItem.endDate,
          is_current: editItem.isCurrent,
          prescription_url: editItem.prescriptionUrl
        } : { is_current: true }}
        onSave={handleSave}
        showFileUpload
        fileLabel={t('medications.uploadPrescription')}
        existingFileUrl={editItem?.prescriptionUrl}
        documentType={DocumentType.Prescription}
        parentEntityType={ParentEntityType.Medication}
        parentEntityId={editItem?.id}
      />
    </div>
  );
};

export default MedicationsPanel;
