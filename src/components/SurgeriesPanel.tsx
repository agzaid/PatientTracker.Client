import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { surgeryApi, type SurgeryDto, type CreateSurgeryRequest, type UpdateSurgeryRequest } from '@/services/surgeryApi';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import ViewModal from './ViewModal';
import { Plus, Scissors, Search, Trash2, Edit2, Eye, Building2, UserCircle, FileDown } from 'lucide-react';

const surgeryFields: FieldConfig[] = [
  { name: 'surgery_name', label: 'surgeries.surgeryName', type: 'text', placeholder: 'surgeries.surgeryNamePlaceholder', required: true },
  { name: 'surgery_date', label: 'surgeries.surgeryDate', type: 'date', required: true },
  { name: 'hospital_name', label: 'surgeries.hospitalName', type: 'text', placeholder: 'surgeries.hospitalNamePlaceholder' },
  { name: 'surgeon_name', label: 'surgeries.surgeonName', type: 'text', placeholder: 'surgeries.surgeonNamePlaceholder' },
  { name: 'surgery_type', label: 'surgeries.surgeryType', type: 'text', placeholder: 'surgeries.surgeryTypePlaceholder' },
  { name: 'description', label: 'surgeries.description', type: 'textarea', placeholder: 'surgeries.descriptionPlaceholder' },
  { name: 'complications', label: 'surgeries.complications', type: 'textarea', placeholder: 'surgeries.complicationsPlaceholder' },
  { name: 'outcome', label: 'surgeries.outcome', type: 'textarea', placeholder: 'surgeries.outcomePlaceholder' },
  { name: 'follow_up_date', label: 'surgeries.followUpDate', type: 'date' },
];

const SurgeriesPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [surgeries, setSurgeries] = useState<SurgeryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SurgeryDto | null>(null);
  const [viewItem, setViewItem] = useState<SurgeryDto | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchSurgeries();
  }, [user]);

  const fetchSurgeries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const surgeryData = await surgeryApi.getSurgeries();
      setSurgeries(surgeryData);
    } catch (error: any) {
      console.error('Failed to fetch surgeries:', error);
      toast.error(error.error || t('surgeries.fetchError'));
    }
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string, documentId?: number, allDocumentIds?: number[]) => {
    if (!user) return;

    const payload: CreateSurgeryRequest | UpdateSurgeryRequest = {
      surgeryName: data.surgery_name,
      surgeryDate: data.surgery_date,
      hospitalName: data.hospital_name,
      surgeonName: data.surgeon_name,
      surgeryType: data.surgery_type,
      description: data.description,
      complications: data.complications,
      outcome: data.outcome,
      followUpDate: data.follow_up_date,
      documentIds: allDocumentIds && allDocumentIds.length > 0 ? allDocumentIds : (documentId ? [documentId] : undefined)
    };

    try {
      if (editItem) {
        await surgeryApi.updateSurgery(editItem.id, payload as UpdateSurgeryRequest);
        toast.success(t('surgeries.updated'));
      } else {
        await surgeryApi.createSurgery(payload as CreateSurgeryRequest);
        toast.success(t('surgeries.added'));
      }
      setEditItem(null);
      fetchSurgeries();
    } catch (error: any) {
      console.error('Failed to save surgery:', error);
      toast.error(error.error || t('surgeries.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('surgeries.deleteConfirmTitle'),
      text: t('surgeries.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      try {
        await surgeryApi.deleteSurgery(id);
        toast.success(t('surgeries.deleted'));
        fetchSurgeries();
      } catch (error: any) {
        console.error('Failed to delete surgery:', error);
        toast.error(error.error || t('surgeries.deleteError'));
      }
    }
  };

  const handleReportDownload = async (surgery: SurgeryDto) => {
    try {
      const documents = await documentApi.getEntityDocuments(ParentEntityType.Surgery, surgery.id);
      
      if (documents.length === 0) {
        toast.error(t('surgeries.noReportsFound'));
        return;
      }

      for (const doc of documents) {
        const blob = await documentApi.downloadDocument(doc.id);
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = doc.originalFileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      toast.success(t('surgeries.reportsDownloaded'));
    } catch (error: any) {
      console.error('Failed to download reports:', error);
      toast.error(t('documents.downloadError'));
    }
  };

  const filteredSurgeries = surgeries.filter(s =>
    !search || s.surgeryName.toLowerCase().includes(search.toLowerCase()) || (s.hospitalName || '').toLowerCase().includes(search.toLowerCase()) || (s.surgeonName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('surgeries.title')}</h2>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('surgeries.add')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('surgeries.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Surgeries List */}
      {!loading && (
        <div className="space-y-4">
          {filteredSurgeries.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('surgeries.noSurgeries')}</p>
            </div>
          ) : (
            filteredSurgeries.map((surgery) => (
              <div key={surgery.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="w-5 h-5 text-cyan-600" />
                      <h3 className="font-semibold text-gray-900">{surgery.surgeryName}</h3>
                    </div>
                    <div className="space-y-1">
                      {surgery.hospitalName && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {surgery.hospitalName}
                        </p>
                      )}
                      {surgery.surgeonName && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <UserCircle className="w-4 h-4 text-gray-400" />
                          {surgery.surgeonName}
                        </p>
                      )}
                      {surgery.surgeryDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(surgery.surgeryDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                      {surgery.description && <p className="text-sm text-gray-600 mt-1">{surgery.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setViewItem(surgery)} 
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition"
                      title={t('common.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleReportDownload(surgery)} 
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                      title={t('surgeries.downloadReports')}
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditItem(surgery); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(surgery.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? t('surgeries.edit') : t('surgeries.add')}
        fields={surgeryFields}
        initialData={editItem ? {
          ...editItem,
          surgery_name: editItem.surgeryName,
          surgery_date: editItem.surgeryDate,
          hospital_name: editItem.hospitalName,
          surgeon_name: editItem.surgeonName,
          surgery_type: editItem.surgeryType,
          description: editItem.description,
          complications: editItem.complications,
          outcome: editItem.outcome,
          follow_up_date: editItem.followUpDate
        } : {}}
        onSave={handleSave}
        showFileUpload
        fileLabel={t('surgeries.uploadReport')}
        documentType={DocumentType.MedicalRecord}
        parentEntityType={ParentEntityType.Surgery}
        parentEntityId={editItem ? editItem.id : undefined}
      />
      
      <ViewModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={t('surgeries.viewSurgery')}
        type="surgery"
        data={viewItem}
      />
    </div>
  );
};

export default SurgeriesPanel;
