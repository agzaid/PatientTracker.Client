import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  labTestExtractionApi, 
  type ExtractedLabTestDto, 
  type LabTestExtractionResponse,
  type UpdateExtractedLabTestRequest
} from '@/services/labTestExtractionApi';
import { toast } from 'sonner';
import { 
  X, Upload, FileText, CheckCircle, AlertCircle, Loader2, 
  Edit3, Save, RefreshCw, Eye, EyeOff 
} from 'lucide-react';

interface LabTestExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LabTestExtractionModal: React.FC<LabTestExtractionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [extractionResponse, setExtractionResponse] = useState<LabTestExtractionResponse | null>(null);
  const [extractedTests, setExtractedTests] = useState<ExtractedLabTestDto[]>([]);
  const [editingTests, setEditingTests] = useState<UpdateExtractedLabTestRequest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  const clearState = useCallback(() => {
    setFile(null);
    setExtractionResponse(null);
    setExtractedTests([]);
    setEditingTests([]);
    setIsEditing(false);
    setIsUploading(false);
    setIsSaving(false);
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
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please select a PDF or image file');
        return;
      }
      // Validate file size (10MB max)
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
      const response = await labTestExtractionApi.uploadDocument(file);
      setExtractionResponse(response);
      
      // Start polling for status if not completed and no data
      if (response.document.extractionStatus !== 4 && response.document.extractionStatus !== 5 && !(response.extractedTests && response.extractedTests.length > 0)) { // Not completed, not failed, and no data
        pollIntervalRef.current = window.setInterval(() => {
          checkStatus(response.document.id);
        }, 2000);
      } else {
        setIsUploading(false);
        setExtractedTests(response.extractedTests);
        setEditingTests(response.extractedTests.map((test, index) => ({
          id: index + 1, // Temporary ID, backend will assign proper IDs
          testName: test.testName,
          resultValue: test.resultValue,
          resultUnit: test.resultUnit,
          normalRange: test.normalRange,
          status: test.status || 'normal',
          notes: undefined
        })));
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMessage = error.error?.value || error.error || error.message || 'Failed to upload document';
      // If the error value is the same as the key (resource not found), show a default message
      const displayMessage = errorMessage === 'ErrorUploadingDocument' ? 'Error uploading document. Please try again.' : errorMessage;
      toast.error(displayMessage);
      setIsUploading(false);
    }
  };

  const checkStatus = async (docId: number) => {
    try {
      const response = await labTestExtractionApi.getStatus(docId);
      setExtractionResponse(response);

      
      if (response.document.extractionStatus === 4 || (response.extractedTests && response.extractedTests.length > 0)) { // completed or has data
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsUploading(false);
        setExtractedTests(response.extractedTests);
        const editingTestsData = response.extractedTests.map((test, index) => ({
          id: index + 1, // Temporary ID, backend will assign proper IDs
          testName: test.testName,
          resultValue: test.resultValue,
          resultUnit: test.resultUnit,
          normalRange: test.normalRange,
          status: test.status || 'normal',
          notes: undefined
        }));
        setEditingTests(editingTestsData);
        
      } else if (response.document.extractionStatus === 5) { // failed
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsUploading(false);
        toast.error(response.document.extractionError || 'Extraction failed');
      }
    } catch (error: any) {
      console.error('Status check failed:', error);
    }
  };

  const handleRetry = async () => {
    if (!extractionResponse?.document.id) return;
    
    setIsUploading(true);
    try {
      const response = await labTestExtractionApi.retryExtraction(extractionResponse.document.id);
      setExtractionResponse(response);
      
      // Start polling if not completed
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
    const convertedTests: UpdateExtractedLabTestRequest[] = extractedTests.map((test, index) => ({
      id: index + 1, // Temporary ID, backend will assign proper IDs
      testName: test.testName,
      resultValue: test.resultValue,
      resultUnit: test.resultUnit,
      normalRange: test.normalRange,
      status: test.status || 'normal',
      notes: undefined
    }));
    setEditingTests(convertedTests);
    setIsEditing(true);
  };

  const handleTestChange = (index: number, field: keyof UpdateExtractedLabTestRequest, value: string) => {
    const updatedTests = [...editingTests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    setEditingTests(updatedTests);
  };

  const handleSave = async () => {
    if (!extractionResponse?.document.id) return;

    setIsSaving(true);
    try {
      await labTestExtractionApi.updateExtractedTests(extractionResponse.document.id, editingTests);
      toast.success('Lab tests saved successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.error || 'Failed to save lab tests');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = () => {
    if (!extractionResponse) return null;
    
    // If we have extracted data, show success regardless of status
    if (extractedTests.length > 0) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    switch (extractionResponse.document.extractionStatus) {
      case 1: // uploading
      case 2: // processing
      case 3: // extracting
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 4: // completed
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 5: // failed
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (!extractionResponse) return '';
    
    // If we have extracted data, show completed regardless of status
    if (extractedTests.length > 0) {
      return 'Extraction completed!';
    }
    
    switch (extractionResponse.document.extractionStatus) {
      case 1:
        return 'Uploading document...';
      case 2:
        return 'Processing document...';
      case 3:
        return 'Extracting lab test results...';
      case 4:
        return 'Extraction completed!';
      case 5:
        return extractionResponse.document.extractionError || 'Extraction failed';
      default:
        return '';
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Extract Lab Test Results</h3>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!file && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload a lab test document</p>
                <p className="text-sm text-gray-400 mb-4">PDF, JPG, or PNG (max 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="lab-test-file"
                />
                <label
                  htmlFor="lab-test-file"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition"
                >
                  <FileText className="w-4 h-4" />
                  Select File
                </label>
              </div>
            </div>
          )}

          {file && !extractionResponse && (
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
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

          {extractionResponse && (
            <div>
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon()}
                <div>
                  <p className="font-medium text-gray-900">Status: {extractionResponse.document.extractionStatus}</p>
                  <p className="text-sm text-gray-600">{getStatusMessage()}</p>
                </div>
                {extractionResponse.document.extractionStatus === 5 && (
                  <button
                    onClick={handleRetry}
                    className="ml-auto p-2 rounded-lg hover:bg-gray-100 transition"
                    title="Retry"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>

              {(extractionResponse.document.extractionStatus === 4 || extractedTests.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      Extracted Lab Tests ({extractedTests.length})
                    </h4>
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditingTests(extractedTests.map((test, index) => ({
                              id: index + 1,
                              testName: test.testName,
                              resultValue: test.resultValue,
                              resultUnit: test.resultUnit,
                              normalRange: test.normalRange,
                              status: test.status || 'normal',
                              notes: undefined
                            })));
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
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
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3" />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(isEditing ? editingTests : extractedTests).map((test, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Test Name
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={test.testName}
                                onChange={(e) => handleTestChange(index, 'testName', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900">{test.testName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Result
                            </label>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={test.resultValue || ''}
                                  onChange={(e) => handleTestChange(index, 'resultValue', e.target.value)}
                                  placeholder="Value"
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  value={test.resultUnit || ''}
                                  onChange={(e) => handleTestChange(index, 'resultUnit', e.target.value)}
                                  placeholder="Unit"
                                  className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-gray-900">
                                {test.resultValue} {test.resultUnit}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Normal Range
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={test.normalRange || ''}
                                onChange={(e) => handleTestChange(index, 'normalRange', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <p className="text-sm text-gray-600">{test.normalRange || '-'}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            {isEditing ? (
                              <select
                                value={test.status || 'normal'}
                                onChange={(e) => handleTestChange(index, 'status', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="low">Low</option>
                                <option value="abnormal">Abnormal</option>
                                <option value="pending">Pending</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                test.status === 'normal' ? 'bg-green-100 text-green-700' :
                                test.status === 'high' ? 'bg-red-100 text-red-700' :
                                test.status === 'low' ? 'bg-blue-100 text-blue-700' :
                                test.status === 'abnormal' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {test.status || 'normal'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          {isEditing ? (
                            <textarea
                              value={test.notes || ''}
                              onChange={(e) => handleTestChange(index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-600">{test.notes || '-'}</p>
                          )}
                        </div>
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

export default LabTestExtractionModal;
