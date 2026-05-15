import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, Download, Loader2, CheckCircle, AlertCircle, Clock, Calendar, FileText, Droplets, Pill } from 'lucide-react';
import { documentApi } from '@/services/documentApi';
import { medicationExtractionApi, type MedicationDocumentWithMedicationsDto } from '@/services/medicationExtractionApi';
import { toast } from 'sonner';
import DocumentChatBubble from './DocumentChatBubble';

interface MedicationDocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
}

const MedicationDocumentViewModal: React.FC<MedicationDocumentViewModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const { t } = useTranslation();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [documentWithMedications, setDocumentWithMedications] = useState<MedicationDocumentWithMedicationsDto | null>(null);
  const [loadingMedications, setLoadingMedications] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentWithMedications();
    }
  }, [isOpen, document]);

  const fetchDocumentWithMedications = async () => {
    if (!document) return;
    
    const docId = document.id;
    if (!docId) {
      toast.error('Document ID not available');
      return;
    }

    setLoadingMedications(true);
    try {
      const data = await medicationExtractionApi.getMedicationDocumentWithMedications(docId);
      setDocumentWithMedications(data);
    } catch (error: any) {
      console.error('Failed to fetch document with medications:', error);
      toast.error(error.error || 'Failed to fetch medications');
    }
    setLoadingMedications(false);
  };

  const handleViewDocument = async () => {
    if (!document) return;

    try {
      const docId = document.documentId || document.id;
      if (!docId) {
        toast.error('Document ID not available');
        return;
      }
      
      const blob = await documentApi.downloadDocument(docId);
      
      if (blob.size === 0) {
        toast.error('Received empty file');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      setShowDocument(true);
    } catch (error) {
      console.error('Failed to view document:', error);
      toast.error('Failed to load document');
    }
  };

  const handleDownloadDocument = async () => {
    if (!document) return;

    try {
      const docId = document.documentId || document.id;
      if (!docId) {
        toast.error('Document ID not available');
        return;
      }

      const blob = await documentApi.downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.originalFileName || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const getStatusIcon = (statusName: string) => {
    if (statusName === 'Completed') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (statusName === 'Failed') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-[98%] max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate mr-2">
            Medication Document
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {document ? (
            <div>
              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{document.originalFileName}</h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {document.extractionStatusName}
                        </div>
                        {getStatusIcon(document.extractionStatusName || '')}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      title="Ask AI about this document"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Ask AI
                    </button>
                    <button
                      onClick={showDocument ? () => setShowDocument(false) : handleViewDocument}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {showDocument ? 'Hide' : 'View'}
                    </button>
                    <button
                      onClick={handleDownloadDocument}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      title="Download document"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              {showDocument && documentUrl && (
                <div className="mb-6">
                  <div className="border rounded-lg overflow-hidden">
                    {document.contentType && document.contentType.startsWith('image/') ? (
                      <img
                        src={documentUrl}
                        alt={document.originalFileName}
                        className="w-full h-auto"
                      />
                    ) : document.contentType === 'application/pdf' ? (
                      <iframe
                        src={documentUrl}
                        className="w-full h-[400px] sm:h-[500px] md:h-[600px]"
                        title={document.originalFileName}
                      />
                    ) : (
                      <div className="p-6 sm:p-8 text-center text-gray-500">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base">Preview not available for this file type</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Medications */}
              {documentWithMedications && (
                <div className="mt-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    Extracted Medications ({documentWithMedications.medications.length})
                  </h4>
                  {loadingMedications ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                    </div>
                  ) : documentWithMedications.medications.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
                      <Pill className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-gray-500">No medications extracted from this document</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documentWithMedications.medications.map((med, index) => (
                        <div key={med.id || index} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base truncate">{med.medicationName}</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                                {med.dosage && (
                                  <div>
                                    <span className="font-medium text-gray-700">Dosage:</span>
                                    <span className="ml-2 text-gray-600">{med.dosage}</span>
                                  </div>
                                )}
                                {med.frequency && (
                                  <div>
                                    <span className="font-medium text-gray-700">Frequency:</span>
                                    <span className="ml-2 text-gray-600">{med.frequency}</span>
                                  </div>
                                )}
                                {med.startDate && (
                                  <div>
                                    <span className="font-medium text-gray-700">Start Date:</span>
                                    <span className="ml-2 text-gray-600">{new Date(med.startDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {med.endDate && (
                                  <div>
                                    <span className="font-medium text-gray-700">End Date:</span>
                                    <span className="ml-2 text-gray-600">{new Date(med.endDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {med.status && (
                                  <div>
                                    <span className="font-medium text-gray-700">Status:</span>
                                    <span className="ml-2 text-gray-600">{med.status}</span>
                                  </div>
                                )}
                              </div>
                              {med.notes && (
                                <div className="mt-2">
                                  <span className="font-medium text-gray-700 text-sm">Notes:</span>
                                  <p className="text-gray-600 text-sm mt-1">{med.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Document not found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Document Chat Bubble */}
      {document && (
        <DocumentChatBubble
          documentId={document.documentId || document.id}
          documentType="medication"
          isOpen={showChat}
          onToggle={() => setShowChat(!showChat)}
        />
      )}
    </div>
  );
};

export default MedicationDocumentViewModal;
