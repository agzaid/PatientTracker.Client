import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  medicationExtractionApi, 
  type ExtractedMedicationDto, 
  type MedicationExtractionResponse,
  type UpdateExtractedMedicationRequest
} from '@/services/medicationExtractionApi';
import { toast } from 'sonner';
import { 
  X, Upload, FileText, CheckCircle, AlertCircle, Loader2, 
  Edit3, Save, RefreshCw, Eye, EyeOff 
} from 'lucide-react';

interface MedicationExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MedicationExtractionModal: React.FC<MedicationExtractionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [extractionResponse, setExtractionResponse] = useState<MedicationExtractionResponse | null>(null);
  const [extractedMedications, setExtractedMedications] = useState<ExtractedMedicationDto[]>([]);
  const [editingMedications, setEditingMedications] = useState<UpdateExtractedMedicationRequest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const clearState = useCallback(() => {
    setFile(null);
    setExtractionResponse(null);
    setExtractedMedications([]);
    setEditingMedications([]);
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
      const response = await medicationExtractionApi.uploadDocument(file);
      setExtractionResponse(response);
      
      if (response.document.extractionStatus !== 4 && response.document.extractionStatus !== 5 && !(response.extractedMedications && response.extractedMedications.length > 0)) {
        pollIntervalRef.current = window.setInterval(() => {
          checkStatus(response.document.id);
        }, 2000);
      } else {
        setIsUploading(false);
        setExtractedMedications(response.extractedMedications);
        setEditingMedications(response.extractedMedications.map((medication, index) => ({
          id: index + 1,
          medicationName: medication.medicationName,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: medication.startDate,
          endDate: medication.endDate,
          status: medication.status || 'active',
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
      const response = await medicationExtractionApi.getStatus(docId);
      setExtractionResponse(response);

      if (response.document.extractionStatus === 4 || (response.extractedMedications && response.extractedMedications.length > 0)) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsUploading(false);
        setExtractedMedications(response.extractedMedications);
        const editingMedicationsData = response.extractedMedications.map((medication, index) => ({
          id: index + 1,
          medicationName: medication.medicationName,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: medication.startDate,
          endDate: medication.endDate,
          status: medication.status || 'active',
          notes: undefined
        }));
        setEditingMedications(editingMedicationsData);
        
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
      const response = await medicationExtractionApi.retryExtraction(extractionResponse.document.id);
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
    const convertedMedications: UpdateExtractedMedicationRequest[] = extractedMedications.map((medication, index) => ({
      id: index + 1,
      medicationName: medication.medicationName,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      endDate: medication.endDate,
      status: medication.status || 'active',
      notes: undefined
    }));
    setEditingMedications(convertedMedications);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!extractionResponse?.document.id) return;
    
    setIsSaving(true);
    try {
      await medicationExtractionApi.updateExtractedMedications(extractionResponse.document.id, editingMedications);
      toast.success('Medications saved successfully');
      setIsEditing(false);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.error || 'Failed to save medications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMedications(extractedMedications.map((medication, index) => ({
      id: index + 1,
      medicationName: medication.medicationName,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      endDate: medication.endDate,
      status: medication.status || 'active',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-[98%] max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
    
    {/* Header - Fixed height */}
    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate mr-2">
        Extract Medications
      </h3>
      <button
        onClick={handleClose}
        className="p-2 hover:bg-gray-100 rounded-lg transition shrink-0"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>
    </div>

    {/* Content - Scrollable area */}
    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
      {!extractionResponse && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1 text-sm sm:text-base font-medium">
              Upload a medical document
            </p>
            <p className="text-xs text-gray-400 mb-4">PDF, JPEG, PNG (max 10MB)</p>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="medication-file-input"
            />
            <label
              htmlFor="medication-file-input"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer transition"
            >
              <FileText className="w-4 h-4" />
              Select File
            </label>
          </div>

          {file && (
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="overflow-hidden w-full">
                <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Extracting...
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
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="shrink-0 mt-1">
              {getStatusIcon(extractionResponse.document.extractionStatusName || '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                Status: {getStatusMessage(extractionResponse.document.extractionStatusName || '')}
              </p>
              {(statusError || extractionResponse?.document.extractionError) && (
                <p className="text-xs sm:text-sm text-red-600 mt-1 break-words">
                  {statusError || extractionResponse.document.extractionError}
                </p>
              )}
            </div>
            {(extractionResponse?.document.extractionStatus === 5 || statusError) && (
              <button
                onClick={handleRetry}
                className="p-2 rounded-lg hover:bg-gray-200 transition shrink-0"
                title="Retry"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          {/* Medications List */}
          {(extractionResponse.document.extractionStatus === 4 || extractedMedications.length > 0) && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="font-semibold text-gray-900">
                  Extracted Medications ({extractedMedications.length})
                </h4>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {extractedMedications.map((medication, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-1">
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Name</label>
                            <input
                              type="text"
                              value={editingMedications[index]?.medicationName || ''}
                              onChange={(e) => {
                                const updated = [...editingMedications];
                                updated[index] = { ...updated[index], medicationName: e.target.value };
                                setEditingMedications(updated);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Dosage</label>
                            <input
                              type="text"
                              value={editingMedications[index]?.dosage || ''}
                              onChange={(e) => {
                                const updated = [...editingMedications];
                                updated[index] = { ...updated[index], dosage: e.target.value };
                                setEditingMedications(updated);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Frequency</label>
                            <input
                              type="text"
                              value={editingMedications[index]?.frequency || ''}
                              onChange={(e) => {
                                const updated = [...editingMedications];
                                updated[index] = { ...updated[index], frequency: e.target.value };
                                setEditingMedications(updated);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={editingMedications[index]?.startDate || ''}
                              onChange={(e) => {
                                const updated = [...editingMedications];
                                updated[index] = { ...updated[index], startDate: e.target.value };
                                setEditingMedications(updated);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">End Date</label>
                            <input
                              type="date"
                              value={editingMedications[index]?.endDate || ''}
                              onChange={(e) => {
                                const updated = [...editingMedications];
                                updated[index] = { ...updated[index], endDate: e.target.value };
                                setEditingMedications(updated);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <h5 className="font-semibold text-blue-900 truncate">{medication.medicationName}</h5>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {medication.dosage && (
                            <p className="text-xs text-gray-600 flex gap-2">
                              <span className="font-medium text-gray-400">Dosage:</span> {medication.dosage}
                            </p>
                          )}
                          {medication.frequency && (
                            <p className="text-xs text-gray-600 flex gap-2">
                              <span className="font-medium text-gray-400">Freq:</span> {medication.frequency}
                            </p>
                          )}
                        </div>
                        {(medication.startDate || medication.endDate) && (
                          <div className="mt-2 pt-2 border-t border-gray-50 flex flex-wrap gap-2 text-[10px] sm:text-xs text-gray-500">
                            {medication.startDate && (
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                Starts: {new Date(medication.startDate).toLocaleDateString()}
                              </span>
                            )}
                            {medication.endDate && (
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                Ends: {new Date(medication.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
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
    
    {/* Footer spacing for mobile tap targets */}
    <div className="h-4 shrink-0" />
  </div>
</div>
  );
};

export default MedicationExtractionModal;
