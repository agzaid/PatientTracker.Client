import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { labTestApi, type LabTestDto, type CreateLabTestRequest, type UpdateLabTestRequest } from '@/services/labTestApi';
import { PaginatedResponse } from '@/interfaces/pagination';
import Pagination from './Pagination';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import ViewModal from './ViewModal';
import LabTestExtractionModal from './LabTestExtractionModal';
import LabTestDocumentViewModal from './LabTestDocumentViewModal';
import { labTestExtractionApi, type LabTestDocumentDto } from '@/services/labTestExtractionApi';
import { Plus, FlaskConical, Search, Trash2, Edit2, ExternalLink, TrendingUp, TrendingDown, Minus, Eye, Scan, FileText, Calendar } from 'lucide-react';

const labFields: FieldConfig[] = [
  { name: 'test_name', label: 'labTests.testName', type: 'text', placeholder: 'labTests.testNamePlaceholder', required: true },
  { name: 'test_date', label: 'labTests.testDate', type: 'date', required: true },
  { name: 'result_value', label: 'labTests.resultValue', type: 'text', placeholder: 'labTests.resultValuePlaceholder' },
  { name: 'result_unit', label: 'labTests.unit', type: 'text', placeholder: 'labTests.unitPlaceholder' },
  { name: 'normal_range', label: 'labTests.normalRange', type: 'text', placeholder: 'labTests.normalRangePlaceholder' },
  { name: 'status', label: 'labTests.status', type: 'select', options: ['normal', 'high', 'low', 'abnormal', 'pending'] },
  { name: 'notes', label: 'common.notes', type: 'textarea', placeholder: 'labTests.notesPlaceholder' },
];

const LabTestsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [labTests, setLabTests] = useState<LabTestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<LabTestDto | null>(null);
  const [viewItem, setViewItem] = useState<LabTestDto | null>(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'documents'>('tests');
  const [documents, setDocuments] = useState<LabTestDocumentDto[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showDocumentViewModal, setShowDocumentViewModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | undefined>();
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsTotalPages, setDocumentsTotalPages] = useState(1);
  const [documentsTotalCount, setDocumentsTotalCount] = useState(0);
  const documentsPageSize = 10;

  useEffect(() => {
    if (user) {
      fetchTests();
      if (activeTab === 'documents') {
        fetchDocuments();
      }
    }
  }, [user, currentPage, search, activeTab, documentsPage]);

  const fetchTests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await labTestApi.getLabTests(currentPage, pageSize, search);
      setLabTests(response.items);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
      setTotalCount(response.totalCount);
    } catch (error: any) {
      console.error('Failed to fetch lab tests:', error);
      const errorMessage = error.error?.value || error.error || error.message || t('labTests.fetchError');
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  const fetchDocuments = async () => {
    if (!user) return;
    setDocumentsLoading(true);
    try {
      const response = await labTestExtractionApi.getLabTestDocuments(documentsPage, documentsPageSize);
      setDocuments(response.items);
      setDocumentsTotalPages(Math.ceil(response.totalCount / documentsPageSize));
      setDocumentsTotalCount(response.totalCount);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      const errorMessage = error.error?.value || error.error || error.message || 'Failed to fetch documents';
      toast.error(errorMessage);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDocumentClick = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setShowDocumentViewModal(true);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string, documentId?: number, allDocumentIds?: number[]) => {
    if (!user) return;

    // Convert form data to API format
    const payload: CreateLabTestRequest | UpdateLabTestRequest = {
      testName: data.test_name,
      testType: data.test_type,
      testDate: data.test_date,
      orderedBy: data.ordered_by,
      facility: data.facility,
      results: data.result_value ? `${data.result_value} ${data.result_unit || ''}`.trim() : undefined,
      normalRange: data.normal_range,
      status: data.status || 'normal',
      notes: data.notes,
      documentIds: allDocumentIds && allDocumentIds.length > 0 ? allDocumentIds : (documentId ? [documentId] : undefined)
    };

    try {
      if (editItem) {
        await labTestApi.updateLabTest(editItem.id, payload as UpdateLabTestRequest);
        toast.success(t('labTests.updated'));
      } else {
        await labTestApi.createLabTest(payload as CreateLabTestRequest);
        toast.success(t('labTests.added'));
      }
      setEditItem(null);
      fetchTests();
    } catch (error: any) {
      console.error('Failed to save lab test:', error);
      toast.error(error.error || t('labTests.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
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
        await labTestApi.deleteLabTest(id);
        fetchTests();
        toast.success(t('labTests.deleteSuccess'));
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.error || t('labTests.deleteError'));
      }
    }
  };

  const handleDocumentDelete = async (doc: any) => {
    const result = await Swal.fire({
      title: t('labTests.deleteDocumentConfirmTitle') || 'Delete Document?',
      text: t('labTests.confirmDeleteDocument') || 'This will delete the document and all extracted lab tests. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      try {
        await labTestExtractionApi.deleteDocument(doc.id);
        fetchDocuments();
        fetchTests(); // Refresh lab tests in case any were deleted
        toast.success(t('labTests.documentDeleteSuccess') || 'Document deleted successfully');
      } catch (error: any) {
        console.error('Document delete failed:', error);
        toast.error(error.error || t('labTests.documentDeleteError') || 'Failed to delete document');
      }
    }
  };

  const handleReportDownload = async (labTest: LabTestDto) => {
    try {
      // Get documents linked to this lab test
      const documents = await documentApi.getEntityDocuments(ParentEntityType.LabTest, labTest.id);
      
      if (documents.length === 0) {
        toast.error(t('labTests.noReportsFound'));
        return;
      }

      // Download all documents
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
      
      toast.success(t('labTests.reportsDownloaded'));
    } catch (error: any) {
      console.error('Failed to download reports:', error);
      toast.error(t('documents.downloadError'));
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      normal: { color: 'bg-emerald-100 text-emerald-700', icon: <Minus className="w-3 h-3" /> },
      high: { color: 'bg-red-100 text-red-700', icon: <TrendingUp className="w-3 h-3" /> },
      low: { color: 'bg-amber-100 text-amber-700', icon: <TrendingDown className="w-3 h-3" /> },
      abnormal: { color: 'bg-rose-100 text-rose-700', icon: <TrendingUp className="w-3 h-3" /> },
      pending: { color: 'bg-blue-100 text-blue-700', icon: <Minus className="w-3 h-3" /> },
    };
    return map[status] || map.normal;
  };

  const filtered = labTests.filter(t =>
    !search || t.testName.toLowerCase().includes(search.toLowerCase()) || (t.doctorNotes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" /> {t('labTests.title')}
          </h2>
          <p className="text-sm text-gray-500">{labTests.length} {t('labTests.testRecords')}</p>
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
            <Plus className="w-4 h-4" /> {t('labTests.add')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lab Tests
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

      {activeTab === 'tests' && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('labTests.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <FlaskConical className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('labTests.noLabTests')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(test => {
            const badge = getStatusBadge(test.status);
            return (
              <div key={test.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FlaskConical className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {test.testName}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${badge.color}`}>
                          {badge.icon} {test.status}
                        </span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {test.results && (
                          <span className="text-lg font-bold text-gray-900">
                            {test.results}
                          </span>
                        )}
                        {test.normalRange && (
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{t('labTests.normal')}: {test.normalRange}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {test.testDate ? new Date(test.testDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : t('common.noDate')}
                      </p>
                      {test.doctorNotes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{test.doctorNotes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setViewItem(test)} 
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition"
                      title={t('common.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleReportDownload(test)} 
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                      title={t('labTests.downloadReports')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditItem(test); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(test.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
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
              <p className="text-xs text-gray-400 mt-1">Upload lab test documents to extract results automatically</p>
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
                        onClick={() => handleDocumentClick(doc.id)}
                        className="flex-1 cursor-pointer"
                      >
                        {doc.thumbnailUrl ? (
                          <img 
                            src={doc.thumbnailUrl} 
                            alt={doc.originalFileName}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
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
                        onClick={() => handleDocumentDelete(doc)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Documents Pagination */}
              {documentsTotalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={documentsPage}
                    totalPages={documentsTotalPages}
                    totalCount={documentsTotalCount}
                    pageSize={documentsPageSize}
                    onPageChange={setDocumentsPage}
                    loading={documentsLoading}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? t('labTests.edit') : t('labTests.add')}
        fields={labFields}
        initialData={editItem ? {
          ...editItem,
          test_name: editItem.testName,
          test_type: editItem.testType,
          test_date: editItem.testDate,
          result_value: editItem.results?.split(' ')[0],
          result_unit: editItem.results?.split(' ')[1],
          normal_range: editItem.normalRange
        } : { status: 'normal' }}
        onSave={handleSave}
        showFileUpload
        fileLabel={t('labTests.uploadLabReport')}
        existingFileUrl={undefined}
        documentType={DocumentType.LabReport}
        parentEntityType={ParentEntityType.LabTest}
        parentEntityId={editItem ? editItem.id : undefined}
      />
      
      <ViewModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={t('labTests.viewLabTest')}
        type="labTest"
        data={viewItem}
      />
      
      <LabTestExtractionModal
        isOpen={showExtractionModal}
        onClose={() => setShowExtractionModal(false)}
        onSuccess={() => {
          setShowExtractionModal(false);
          fetchTests();
          if (activeTab === 'documents') {
            fetchDocuments();
          }
        }}
      />
      
      <LabTestDocumentViewModal
        isOpen={showDocumentViewModal}
        onClose={() => {
          setShowDocumentViewModal(false);
          setSelectedDocumentId(undefined);
        }}
        documentId={selectedDocumentId}
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

export default LabTestsPanel;
