import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { labTestExtractionApi, type LabTestDocumentWithTestsDto, type LabTestDto } from '@/services/labTestExtractionApi';
import { documentApi } from '@/services/documentApi';
import { toast } from 'sonner';
import { 
  X, FileText, Calendar, Clock, CheckCircle, AlertCircle, Loader2, 
  Download, Eye, EyeOff
} from 'lucide-react';

interface LabTestDocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: number;
}

const LabTestDocumentViewModal: React.FC<LabTestDocumentViewModalProps> = ({
  isOpen,
  onClose,
  documentId
}) => {
  const { t } = useTranslation();
  const [document, setDocument] = useState<LabTestDocumentWithTestsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument(documentId);
    } else {
      clearState();
    }
  }, [isOpen, documentId]);

  const clearState = () => {
    setDocument(null);
    setShowDocument(false);
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
  };

  const fetchDocument = async (id: number) => {
    setLoading(true);
    try {
      const doc = await labTestExtractionApi.getLabTestDocumentWithTests(id);
      setDocument(doc);
    } catch (error: any) {
      console.error('Failed to fetch document:', error);
      toast.error(error.error || 'Failed to fetch document');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async () => {
    if (!document) return;

    try {
      // Use the documentUrl from the API response
      if (!document.documentUrl) {
        toast.error('Document URL not available');
        return;
      }
      
      const response = await fetch(document.documentUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDocumentUrl(url);
        setShowDocument(true);
      } else {
        toast.error('Failed to load document');
      }
    } catch (error) {
      console.error('Failed to view document:', error);
      toast.error('Failed to load document');
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: // uploading
      case 2: // processing
      case 3: // extracting
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 4: // completed
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 5: // failed
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Uploading';
      case 2:
        return 'Processing';
      case 3:
        return 'Extracting';
      case 4:
        return 'Completed';
      case 5:
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Lab Test Document</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : document ? (
            <div>
              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="w-10 h-10 text-gray-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{document.originalFileName}</h4>
                      <p className="text-sm text-gray-500">
                        {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {getStatusText(document.extractionStatus)}
                        </div>
                        {getStatusIcon(document.extractionStatus)}
                      </div>
                      {document.extractionError && (
                        <p className="text-sm text-red-600 mt-1">{document.extractionError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewDocument}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {showDocument ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showDocument ? 'Hide' : 'View'} Document
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              {showDocument && documentUrl && (
                <div className="mb-6">
                  <div className="border rounded-lg overflow-hidden">
                    {document.contentType.startsWith('image/') ? (
                      <img 
                        src={documentUrl} 
                        alt={document.originalFileName}
                        className="w-full h-auto max-h-96 object-contain bg-gray-50"
                      />
                    ) : document.contentType === 'application/pdf' ? (
                      <iframe
                        src={documentUrl}
                        className="w-full h-96"
                        title={document.originalFileName}
                      />
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p>Preview not available for this file type</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lab Tests */}
              {document.labTests && document.labTests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Lab Tests ({document.labTests.length})
                  </h4>
                  <div className="space-y-3">
                    {document.labTests.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Test Name
                            </label>
                            <p className="font-medium text-gray-900">{test.testName}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Result
                            </label>
                            <p className="text-gray-900">
                              {test.resultValue && test.resultUnit ? `${test.resultValue} ${test.resultUnit}` : test.results || test.resultValue || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Normal Range
                            </label>
                            <p className="text-gray-900">{test.normalRange || '-'}</p>
                          </div>
                        </div>
                        {test.doctorNotes && (
                          <div className="mt-3 pt-3 border-t">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <p className="text-sm text-gray-600">{test.doctorNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {document.labTests && document.labTests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p>No lab tests associated with this document</p>
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
    </div>
  );
};

export default LabTestDocumentViewModal;
