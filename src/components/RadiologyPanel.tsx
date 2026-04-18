import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { radiologyApi, type RadiologyScanDto, type CreateRadiologyScanRequest, type UpdateRadiologyScanRequest } from '@/services/radiologyApi';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import ViewModal from './ViewModal';
import { Plus, ScanLine, Search, Trash2, Edit2, ExternalLink, Eye } from 'lucide-react';

const radiologyFields: FieldConfig[] = [
  { name: 'scan_type', label: 'radiology.scanType', type: 'select', options: ['X-ray', 'MRI', 'CT Scan', 'Ultrasound', 'PET Scan', 'Mammogram', 'DEXA Scan', 'Fluoroscopy', 'Other'], required: true },
  { name: 'body_part', label: 'radiology.bodyPart', type: 'text', placeholder: 'e.g., Chest, Knee, Brain' },
  { name: 'scan_date', label: 'radiology.scanDate', type: 'date', required: true },
  { name: 'description', label: 'radiology.description', type: 'textarea', placeholder: 'radiology.descriptionPlaceholder' },
  { name: 'doctor_notes', label: 'radiology.doctorNotes', type: 'textarea', placeholder: 'radiology.doctorNotesPlaceholder' },
];

const RadiologyPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [scans, setScans] = useState<RadiologyScanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<RadiologyScanDto | null>(null);
  const [viewItem, setViewItem] = useState<RadiologyScanDto | null>(null);

  useEffect(() => {
    if (user) fetchScans();
  }, [user]);

  const fetchScans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const radiologyScans = await radiologyApi.getRadiologyScans();
      setScans(radiologyScans);
    } catch (error: any) {
      console.error('Failed to fetch radiology scans:', error);
      toast.error(error.error || t('radiology.fetchError'));
    }
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string, documentId?: number, allDocumentIds?: number[]) => {
    if (!user) return;

    console.log('Document IDs received:', { documentId, allDocumentIds });

    const payload: CreateRadiologyScanRequest | UpdateRadiologyScanRequest = {
      scanType: data.scan_type,
      bodyPart: data.body_part,
      scanDate: data.scan_date,
      description: data.description,
      doctorNotes: data.doctor_notes,
      documentIds: allDocumentIds && allDocumentIds.length > 0 ? allDocumentIds : (documentId ? [documentId] : undefined)
    };

    console.log('Payload being sent:', payload);

    try {
      if (editItem) {
        await radiologyApi.updateRadiologyScan(editItem.id, payload as UpdateRadiologyScanRequest);
        toast.success(t('radiology.updated'));
      } else {
        await radiologyApi.createRadiologyScan(payload as CreateRadiologyScanRequest);
        toast.success(t('radiology.added'));
      }
      setEditItem(null);
      fetchScans();
    } catch (error: any) {
      console.error('Failed to save radiology scan:', error);
      toast.error(error.error || t('radiology.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('radiology.deleteConfirmTitle'),
      text: t('radiology.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      try {
        await radiologyApi.deleteRadiologyScan(id);
        toast.success(t('radiology.deleted'));
        fetchScans();
      } catch (error: any) {
        console.error('Failed to delete radiology scan:', error);
        toast.error(error.error || t('radiology.deleteError'));
      }
    }
  };

  const handleReportDownload = async (scan: RadiologyScanDto) => {
    try {
      const documents = await documentApi.getEntityDocuments(ParentEntityType.RadiologyScan, scan.id);
      
      if (documents.length === 0) {
        toast.error(t('radiology.noReportsFound'));
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
      
      toast.success(t('radiology.reportsDownloaded'));
    } catch (error: any) {
      console.error('Failed to download reports:', error);
      toast.error(t('documents.downloadError'));
    }
  };

  const filteredScans = scans.filter(scan => 
    scan.scanType.toLowerCase().includes(search.toLowerCase()) ||
    scan.bodyPart.toLowerCase().includes(search.toLowerCase()) ||
    scan.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{t('radiology.title')}</h2>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('radiology.add')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('radiology.searchPlaceholder')}
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

      {/* Scans List */}
      {!loading && (
        <div className="space-y-4">
          {filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <ScanLine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('radiology.noScans')}</p>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <div key={scan.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ScanLine className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">{scan.scanType}</h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {scan.bodyPart}
                      </span>
                    </div>
                    {scan.description && <p className="text-sm text-gray-600 mt-1">{scan.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {scan.scanDate ? new Date(scan.scanDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : t('common.noDate')}
                    </p>
                    {scan.doctorNotes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{scan.doctorNotes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setViewItem(scan)} 
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition"
                      title={t('common.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleReportDownload(scan)} 
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                      title={t('radiology.downloadReports')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditItem(scan); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(scan.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? t('radiology.edit') : t('radiology.add')}
        fields={radiologyFields}
        initialData={editItem ? {
          ...editItem,
          scan_type: editItem.scanType,
          body_part: editItem.bodyPart,
          scan_date: editItem.scanDate,
          description: editItem.description,
          doctor_notes: editItem.doctorNotes
        } : {}}
        onSave={handleSave}
        showFileUpload
        fileLabel={t('radiology.uploadScan')}
        documentType={DocumentType.RadiologyImage}
        parentEntityType={ParentEntityType.RadiologyScan}
        parentEntityId={editItem ? editItem.id : undefined}
      />
      
      <ViewModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={t('radiology.viewScan')}
        type="radiology"
        data={viewItem}
      />
    </div>
  );
};

export default RadiologyPanel;
