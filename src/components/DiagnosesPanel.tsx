import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { diagnosisApi, type DiagnosisDto, type CreateDiagnosisRequest, type UpdateDiagnosisRequest } from '@/services/diagnosisApi';
import { diagnosisExtractionApi, type DiagnosisDocumentDto } from '@/services/diagnosisExtractionApi';
import { PaginatedResponse } from '@/interfaces/pagination';
import Pagination from './Pagination';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import ViewModal from './ViewModal';
import DiagnosisExtractionModal from './DiagnosisExtractionModal';
import DiagnosisDocumentViewModal from './DiagnosisDocumentViewModal';
import { Plus, Stethoscope, Search, Trash2, Edit2, Eye, FileDown, CheckCircle2, AlertCircle, Upload, FileText, Calendar, Clock, Loader2, Scan } from 'lucide-react';

const diagnosisFields: FieldConfig[] = [
  { name: 'diagnosis_name', label: 'diagnoses.diagnosisName', type: 'text', placeholder: 'e.g., Type 2 Diabetes', required: true },
  { name: 'diagnosis_date', label: 'diagnoses.diagnosisDate', type: 'date', required: true },
  { name: 'diagnosed_by', label: 'diagnoses.diagnosedBy', type: 'text', placeholder: 'Dr. Smith' },
  { name: 'severity', label: 'diagnoses.severity', type: 'select', options: ['mild', 'moderate', 'severe', 'critical'] },
  { name: 'status', label: 'diagnoses.status', type: 'select', options: ['active', 'resolved', 'managed', 'monitoring'] },
  { name: 'hospital_name', label: 'diagnoses.hospitalName', type: 'text', placeholder: 'Hospital name' },
  { name: 'description', label: 'diagnoses.description', type: 'textarea', placeholder: 'diagnoses.descriptionPlaceholder' },
  { name: 'treatment_plan', label: 'diagnoses.treatmentPlan', type: 'textarea', placeholder: 'diagnoses.treatmentPlanPlaceholder' },
];

const DiagnosesPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<DiagnosisDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<DiagnosisDto | null>(null);
  const [viewItem, setViewItem] = useState<DiagnosisDto | null>(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnoses' | 'documents'>('diagnoses');
  const [documents, setDocuments] = useState<DiagnosisDocumentDto[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DiagnosisDocumentDto | null>(null);
  const [showDocumentViewModal, setShowDocumentViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) fetchDiagnoses();
  }, [user, currentPage, search, statusFilter]);

  useEffect(() => {
    if (user && activeTab === 'documents') fetchDocuments();
  }, [user, activeTab]);

  const fetchDocuments = async () => {
    if (!user) return;
    setDocumentsLoading(true);
    try {
      const response = await diagnosisExtractionApi.getDiagnosisDocuments(1, 50);
      setDocuments(response.items);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      toast.error(error.error || 'Failed to fetch documents');
    }
    setDocumentsLoading(false);
  };

  const handleDocumentClick = (document: DiagnosisDocumentDto) => {
    setSelectedDocument(document);
    setShowDocumentViewModal(true);
  };

  const handleDocumentDelete = async (documentId: number) => {
    const result = await Swal.fire({
      title: t('labTests.deleteConfirmTitle'),
      text: t('labTests.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      try {
        await diagnosisExtractionApi.deleteDocument(documentId);
        fetchDocuments();
        toast.success(t('labTests.deleteSuccess'));
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.error || t('labTests.deleteError'));
      }
    }
  };

  const fetchDiagnoses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await diagnosisApi.getDiagnoses(currentPage, pageSize, search);
      let filteredItems = response.items;
      
      // Apply status filter on frontend
      if (statusFilter !== 'all') {
        filteredItems = response.items.filter(d => d.status === statusFilter);
      }
      
      setDiagnoses(filteredItems);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
      setTotalCount(response.totalCount);
    } catch (error: any) {
      console.error('Failed to fetch diagnoses:', error);
      toast.error(error.error || t('diagnoses.fetchError'));
    }
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string, documentId?: number, allDocumentIds?: number[]) => {
    if (!user) return;

    const payload: CreateDiagnosisRequest | UpdateDiagnosisRequest = {
      diagnosisName: data.diagnosis_name,
      diagnosisDate: data.diagnosis_date,
      diagnosedBy: data.diagnosed_by,
      severity: data.severity,
      status: data.status,
      hospitalName: data.hospital_name,
      description: data.description,
      treatmentPlan: data.treatment_plan,
      documentIds: allDocumentIds && allDocumentIds.length > 0 ? allDocumentIds : (documentId ? [documentId] : undefined)
    };

    try {
      if (editItem) {
        await diagnosisApi.updateDiagnosis(editItem.id, payload as UpdateDiagnosisRequest);
        toast.success(t('diagnoses.updated'));
      } else {
        await diagnosisApi.createDiagnosis(payload as CreateDiagnosisRequest);
        toast.success(t('diagnoses.added'));
      }
      setEditItem(null);
      fetchDiagnoses();
    } catch (error: any) {
      console.error('Failed to save diagnosis:', error);
      toast.error(error.error || t('diagnoses.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('diagnoses.deleteConfirmTitle'),
      text: t('diagnoses.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      try {
        await diagnosisApi.deleteDiagnosis(id);
        toast.success(t('diagnoses.deleted'));
        fetchDiagnoses();
      } catch (error: any) {
        console.error('Failed to delete diagnosis:', error);
        toast.error(error.error || t('diagnoses.deleteError'));
      }
    }
  };

  const getSeverityColor = (s: string) => {
    const m: Record<string, string> = { mild: 'bg-green-100 text-green-700', moderate: 'bg-amber-100 text-amber-700', severe: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (s: string) => {
    if (s === 'resolved') return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    if (s === 'active') return <AlertCircle className="w-3 h-3 text-red-500" />;
    return null;
  };

  const handleReportDownload = async (diagnosis: DiagnosisDto) => {
    try {
      const documents = await documentApi.getEntityDocuments(ParentEntityType.Diagnosis, diagnosis.id);
      
      if (documents.length === 0) {
        toast.error(t('diagnoses.noReportsFound'));
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
      
      toast.success(t('diagnoses.reportsDownloaded'));
    } catch (error: any) {
      console.error('Failed to download reports:', error);
      toast.error(t('documents.downloadError'));
    }
  };

  const filteredDiagnoses = diagnoses.filter(d => {
    const matchesSearch = !search || d.diagnosisName.toLowerCase().includes(search.toLowerCase()) || (d.diagnosedBy || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { active: 'bg-red-50 text-red-700', resolved: 'bg-emerald-50 text-emerald-700', managed: 'bg-blue-50 text-blue-700', monitoring: 'bg-amber-50 text-amber-700' };
    return m[s] || 'bg-gray-50 text-gray-700';
  };


  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-rose-600" /> {t('diagnoses.title')}
          </h2>
          <p className="text-sm text-gray-500">{totalCount} {t('diagnoses.testRecords')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExtractionModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Scan className="w-4 h-4" /> Scan Document
          </button>
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('diagnoses.add')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('diagnoses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'diagnoses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('diagnoses.title')}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
        </nav>
      </div>

      {/* Diagnoses Tab Content */}
      {activeTab === 'diagnoses' && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('diagnoses.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">{t('diagnoses.allStatus')}</option>
              <option value="active">{t('diagnoses.active')}</option>
              <option value="resolved">{t('diagnoses.resolved')}</option>
              <option value="managed">{t('diagnoses.managed')}</option>
              <option value="monitoring">{t('diagnoses.monitoring')}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            </div>
          ) : filteredDiagnoses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('diagnoses.noDiagnoses')}</p>
            </div>
          ) : (

            <div className="grid gap-3">
              {filteredDiagnoses.map((diagnosis) => {
                const statusBadge = diagnosis.status ? {
                  color: getStatusColor(diagnosis.status),
                  icon: getStatusIcon(diagnosis.status)
                } : null;
                
                return (
                  <div key={diagnosis.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            {diagnosis.diagnosisName}
                            {diagnosis.severity && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getSeverityColor(diagnosis.severity)}`}>
                                {diagnosis.severity}
                              </span>
                            )}
                            {statusBadge && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${statusBadge.color}`}>
                                {statusBadge.icon} {diagnosis.status}
                              </span>
                            )}
                          </h4>
                          {diagnosis.description && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{diagnosis.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {diagnosis.diagnosisDate ? new Date(diagnosis.diagnosisDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : t('common.noDate')}
                            {diagnosis.diagnosedBy && ` • ${diagnosis.diagnosedBy}`}
                          </p>
                          {diagnosis.hospitalName && <p className="text-xs text-gray-500 mt-1">{diagnosis.hospitalName}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setViewItem(diagnosis)} 
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition"
                          title={t('common.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleReportDownload(diagnosis)} 
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                          title={t('diagnoses.downloadReports')}
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditItem(diagnosis); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(diagnosis.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'documents' && (
        <div>
          {documentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No documents uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload diagnosis documents to extract information automatically</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        onClick={() => handleDocumentClick(doc)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0 mt-3">
                          <h4 className="font-medium text-gray-900 truncate">{doc.originalFileName}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                            {doc.extractionStatusName && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                doc.extractionStatusName === 'Completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {doc.extractionStatusName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentDelete(doc.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? t('diagnoses.edit') : t('diagnoses.add')}
        fields={diagnosisFields}
        initialData={editItem ? {
          ...editItem,
          diagnosis_name: editItem.diagnosisName,
          diagnosis_date: editItem.diagnosisDate,
          diagnosed_by: editItem.diagnosedBy,
          hospital_name: editItem.hospitalName,
          description: editItem.description,
          treatment_plan: editItem.treatmentPlan
        } : {}}
        onSave={handleSave}
        showFileUpload
        fileLabel={t('diagnoses.uploadReport')}
        documentType={DocumentType.MedicalRecord}
        parentEntityType={ParentEntityType.Diagnosis}
        parentEntityId={editItem ? editItem.id : undefined}
      />
      
      <ViewModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={t('diagnoses.viewDiagnosis')}
        type="diagnosis"
        data={viewItem}
      />
      
      <DiagnosisExtractionModal
        isOpen={showExtractionModal}
        onClose={() => setShowExtractionModal(false)}
        onSuccess={() => fetchDiagnoses()}
      />
      
      <DiagnosisDocumentViewModal
        isOpen={showDocumentViewModal}
        onClose={() => setShowDocumentViewModal(false)}
        document={selectedDocument}
      />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        loading={loading}
      />
    </div>
  );
};

export default DiagnosesPanel;
