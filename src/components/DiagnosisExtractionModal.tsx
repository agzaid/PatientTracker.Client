import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  diagnosisExtractionApi, 
  type ExtractedDiagnosisDto, 
  type DiagnosisExtractionResponse,
  type UpdateExtractedDiagnosisRequest
} from '@/services/diagnosisExtractionApi';
import { toast } from 'sonner';
import { 
  X, Upload, FileText, CheckCircle, AlertCircle, Loader2, 
  Edit3, Save, RefreshCw, Eye, EyeOff 
} from 'lucide-react';

interface DiagnosisExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DiagnosisExtractionModal: React.FC<DiagnosisExtractionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [extractionResponse, setExtractionResponse] = useState<DiagnosisExtractionResponse | null>(null);
  const [extractedDiagnoses, setExtractedDiagnoses] = useState<ExtractedDiagnosisDto[]>([]);
  const [editingDiagnoses, setEditingDiagnoses] = useState<UpdateExtractedDiagnosisRequest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const clearState = useCallback(() => {
    setFile(null);
    setExtractionResponse(null);
    setExtractedDiagnoses([]);
    setEditingDiagnoses([]);
    setIsEditing(false);
    setIsUploading(false);
    setIsSaving(false);
    setStatusError(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const handleClose = () => {
    clearState();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please select a PDF or image file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await diagnosisExtractionApi.uploadDocument(file);
      setExtractionResponse(response);
      
      if (response.document.extractionStatus !== 4 && response.document.extractionStatus !== 5 && !(response.extractedDiagnoses && response.extractedDiagnoses.length > 0)) {
        pollIntervalRef.current = window.setInterval(() => {
          checkStatus(response.document.id);
        }, 2000);
      } else {
        setIsUploading(false);
        setExtractedDiagnoses(response.extractedDiagnoses);
        setEditingDiagnoses(response.extractedDiagnoses.map((diagnosis, index) => ({
          id: index + 1,
          diagnosisName: diagnosis.diagnosisName,
          diagnosisDate: diagnosis.diagnosisDate,
          severity: diagnosis.severity,
          status: diagnosis.status || 'active',
          notes: undefined
        })));
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMessage = error.error?.value || error.error || error.message || 'Failed to upload document';
      const displayMessage = errorMessage === 'ErrorUploadingDocument' ? 'Error uploading document. Please try again.' : errorMessage;
      toast.error(displayMessage);
      setIsUploading(false);
    }
  };

  const checkStatus = async (docId: number) => {
    try {
      const response = await diagnosisExtractionApi.getStatus(docId);
      setExtractionResponse(response);

      if (response.document.extractionStatus === 4 || (response.extractedDiagnoses && response.extractedDiagnoses.length > 0)) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsUploading(false);
        setExtractedDiagnoses(response.extractedDiagnoses);
        const editingDiagnosesData = response.extractedDiagnoses.map((diagnosis, index) => ({
          id: index + 1,
          diagnosisName: diagnosis.diagnosisName,
          diagnosisDate: diagnosis.diagnosisDate,
          severity: diagnosis.severity,
          status: diagnosis.status || 'active',
          notes: undefined
        }));
        setEditingDiagnoses(editingDiagnosesData);
        
      } else if (response.document.extractionStatus === 5) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsUploading(false);
        toast.error(response.document.extractionError || 'Extraction failed');
      }
    } catch (error: any) {
      console.error('Status check failed:', error);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Unable to check extraction status. Please try again.';
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      setIsUploading(false);
      toast.error(errorMessage);
      setStatusError(errorMessage);
    }
  };

  const handleRetry = async () => {
    if (!extractionResponse?.document.id) return;
    
    setIsUploading(true);
    setStatusError(null);
    try {
      const response = await diagnosisExtractionApi.retryExtraction(extractionResponse.document.id);
      setExtractionResponse(response);
      
      if (response.document.extractionStatus !== 4 && response.document.extractionStatus !== 5) {
        pollIntervalRef.current = window.setInterval(() => {
          checkStatus(response.document.id);
        }, 2000);
      } else {
        setIsUploading(false);
        if (response.document.extractionStatus === 5) {
          toast.error(response.document.extractionError || 'Extraction failed');
        }
      }
    } catch (error: any) {
      console.error('Retry failed:', error);
      toast.error(error.error || 'Failed to retry extraction');
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    const convertedDiagnoses: UpdateExtractedDiagnosisRequest[] = extractedDiagnoses.map((diagnosis, index) => ({
      id: index + 1,
      diagnosisName: diagnosis.diagnosisName,
      diagnosisDate: diagnosis.diagnosisDate,
      severity: diagnosis.severity,
      status: diagnosis.status || 'active',
      notes: undefined
    }));
    setEditingDiagnoses(convertedDiagnoses);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!extractionResponse?.document.id) return;
    
    setIsSaving(true);
    try {
      await diagnosisExtractionApi.updateExtractedDiagnoses(extractionResponse.document.id, editingDiagnoses);
      toast.success('Diagnoses saved successfully');
      setIsEditing(false);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.error || 'Failed to save diagnoses');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDiagnoses(extractedDiagnoses.map((diagnosis, index) => ({
      id: index + 1,
      diagnosisName: diagnosis.diagnosisName,
      diagnosisDate: diagnosis.diagnosisDate,
      severity: diagnosis.severity,
      status: diagnosis.status || 'active',
      notes: undefined
    })));
  };

  const getStatusIcon = (statusName: string) => {
    if (statusName === 'Completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (statusName === 'Failed') {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusMessage = (statusName: string) => {
    return statusName || 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Extract Diagnoses from Document</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!extractionResponse && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload a medical document to extract diagnoses</p>
                <p className="text-sm text-gray-400 mb-4">Supports PDF, JPEG, PNG (max 10MB)</p>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="diagnosis-file-input"
                />
                <label
                  htmlFor="diagnosis-file-input"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
                >
                  <FileText className="w-4 h-4" />
                  Select File
                </label>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Start Extraction'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {extractionResponse && (
            <div>
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon(extractionResponse.document.extractionStatusName || '')}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Status: {getStatusMessage(extractionResponse.document.extractionStatusName || '')}</p>
                  {statusError && (
                    <p className="text-sm text-red-600 mt-1">{statusError}</p>
                  )}
                  {extractionResponse?.document.extractionError && (
                    <p className="text-sm text-red-600 mt-1">{extractionResponse.document.extractionError}</p>
                  )}
                </div>
                {(extractionResponse?.document.extractionStatus === 5 || statusError) && (
                  <button
                    onClick={handleRetry}
                    className="ml-auto p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Retry"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>

              {(extractionResponse.document.extractionStatus === 4 || extractedDiagnoses.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      Extracted Diagnoses ({extractedDiagnoses.length})
                    </h4>
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {extractedDiagnoses.map((diagnosis, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Name</label>
                              <input
                                type="text"
                                value={editingDiagnoses[index]?.diagnosisName || ''}
                                onChange={(e) => {
                                  const updated = [...editingDiagnoses];
                                  updated[index] = { ...updated[index], diagnosisName: e.target.value };
                                  setEditingDiagnoses(updated);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Date</label>
                              <input
                                type="date"
                                value={editingDiagnoses[index]?.diagnosisDate || ''}
                                onChange={(e) => {
                                  const updated = [...editingDiagnoses];
                                  updated[index] = { ...updated[index], diagnosisDate: e.target.value };
                                  setEditingDiagnoses(updated);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                              <select
                                value={editingDiagnoses[index]?.severity || ''}
                                onChange={(e) => {
                                  const updated = [...editingDiagnoses];
                                  updated[index] = { ...updated[index], severity: e.target.value };
                                  setEditingDiagnoses(updated);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select severity</option>
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h5 className="font-medium text-gray-900">{diagnosis.diagnosisName}</h5>
                            {diagnosis.diagnosisDate && (
                              <p className="text-sm text-gray-600 mt-1">Date: {new Date(diagnosis.diagnosisDate).toLocaleDateString()}</p>
                            )}
                            {diagnosis.severity && (
                              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                diagnosis.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                diagnosis.severity === 'Severe' ? 'bg-orange-100 text-orange-700' :
                                diagnosis.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {diagnosis.severity}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisExtractionModal;
