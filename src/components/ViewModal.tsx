import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, FileText, Image as ImageIcon, Calendar, User, MapPin, Phone, Mail, Heart, AlertTriangle, Activity, Pill, FlaskConical } from 'lucide-react';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'medication' | 'labTest' | 'radiology' | 'diagnosis' | 'surgery';
  data: any;
}

const ViewModal: React.FC<ViewModalProps> = ({ isOpen, onClose, title, type, data }) => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && data?.id) {
      fetchDocuments();
    }
    return () => {
      // Cleanup blob URLs when modal closes
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [isOpen, data]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let entityType: ParentEntityType;
      if (type === 'medication') {
        entityType = ParentEntityType.Medication;
      } else if (type === 'labTest') {
        entityType = ParentEntityType.LabTest;
      } else if (type === 'radiology') {
        entityType = ParentEntityType.RadiologyScan;
      } else if (type === 'diagnosis') {
        entityType = ParentEntityType.Diagnosis;
      } else if (type === 'surgery') {
        entityType = ParentEntityType.Surgery;
      } else {
        entityType = ParentEntityType.None;
      }
      
      const docs = await documentApi.getEntityDocuments(entityType, data.id);
      setDocuments(docs);
      
      // Fetch image blobs for image documents
      const imagePromises = docs
        .filter(doc => doc.contentType.startsWith('image/'))
        .map(async (doc) => {
          try {
            const blob = await documentApi.downloadDocument(doc.id);
            const url = URL.createObjectURL(blob);
            return { id: doc.id, url };
          } catch (error) {
            console.error(`Failed to fetch image ${doc.id}:`, error);
            return null;
          }
        });
      
      const imageResults = await Promise.all(imagePromises);
      const newImageUrls: Record<number, string> = {};
      imageResults.forEach(result => {
        if (result) {
          newImageUrls[result.id] = result.url;
        }
      });
      setImageUrls(newImageUrls);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
    }
    setLoading(false);
  };

  const handleDownload = async (document: any) => {
    try {
      const blob = await documentApi.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.originalFileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download document:', error);
      toast.error(t('documents.downloadError'));
    }
  };

  if (!isOpen) return null;

  const isImage = (contentType: string) => contentType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Details Section */}
            <div className="space-y-4">
              {type === 'medication' ? (
                <>
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-medium text-gray-900">{data.name}</h4>
                    {data.isCurrent && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        {t('medications.active')}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {data.dosage && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{t('medications.dosage')}:</span>
                        <span className="font-medium">{data.dosage}</span>
                      </div>
                    )}
                    
                    {data.frequency && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{t('medications.frequency')}:</span>
                        <span className="font-medium">{data.frequency}</span>
                      </div>
                    )}
                    
                    {data.startDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('medications.started')}:</span>
                        <span className="font-medium">
                          {new Date(data.startDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {data.endDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('medications.ended')}:</span>
                        <span className="font-medium">
                          {new Date(data.endDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {data.prescribedBy && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('medications.prescribedBy')}:</span>
                        <span className="font-medium">{data.prescribedBy}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : type === 'labTest' ? (
                <>
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-amber-600" />
                    <h4 className="font-medium text-gray-900">{data.testName}</h4>
                    {data.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        data.status === 'normal' ? 'bg-emerald-100 text-emerald-700' :
                        data.status === 'high' ? 'bg-red-100 text-red-700' :
                        data.status === 'low' ? 'bg-amber-100 text-amber-700' :
                        data.status === 'abnormal' ? 'bg-rose-100 text-rose-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {data.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {data.testType && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{t('labTests.testType')}:</span>
                        <span className="font-medium">{data.testType}</span>
                      </div>
                    )}
                    
                    {data.testDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('labTests.testDate')}:</span>
                        <span className="font-medium">
                          {new Date(data.testDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {data.results && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{t('labTests.results')}:</span>
                        <span className="font-medium">{data.results}</span>
                      </div>
                    )}
                    
                    {data.normalRange && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{t('labTests.normalRange')}:</span>
                        <span className="font-medium">{data.normalRange}</span>
                      </div>
                    )}
                    
                    {data.orderedBy && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('labTests.orderedBy')}:</span>
                        <span className="font-medium">{data.orderedBy}</span>
                      </div>
                    )}
                    
                    {data.facility && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('labTests.facility')}:</span>
                        <span className="font-medium">{data.facility}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : type === 'radiology' ? (
                <>
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-gray-900">{data.scanType}</h4>
                    {data.bodyPart && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {data.bodyPart}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {data.scanDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('radiology.scanDate')}:</span>
                        <span className="font-medium">
                          {new Date(data.scanDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {data.description && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500">{t('radiology.description')}:</span>
                        <span className="font-medium">{data.description}</span>
                      </div>
                    )}
                    
                    {data.doctorNotes && (
                      <div className="flex items-start gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-500">{t('radiology.doctorNotes')}:</span>
                        <span className="font-medium">{data.doctorNotes}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : type === 'diagnosis' ? (
                <>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-rose-600" />
                    <h4 className="font-medium text-gray-900">{data.diagnosisName}</h4>
                    {data.severity && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        data.severity === 'mild' ? 'bg-green-100 text-green-700' :
                        data.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                        data.severity === 'severe' ? 'bg-orange-100 text-orange-700' :
                        data.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {data.severity}
                      </span>
                    )}
                    {data.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        data.status === 'active' ? 'bg-red-50 text-red-700' :
                        data.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                        data.status === 'managed' ? 'bg-blue-50 text-blue-700' :
                        data.status === 'monitoring' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {data.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {data.diagnosisDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('diagnoses.diagnosisDate')}:</span>
                        <span className="font-medium">
                          {new Date(data.diagnosisDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {data.diagnosedBy && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('diagnoses.diagnosedBy')}:</span>
                        <span className="font-medium">{data.diagnosedBy}</span>
                      </div>
                    )}
                    
                    {data.hospitalName && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('diagnoses.hospitalName')}:</span>
                        <span className="font-medium">{data.hospitalName}</span>
                      </div>
                    )}
                    
                    {data.description && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500">{t('diagnoses.description')}:</span>
                        <span className="font-medium">{data.description}</span>
                      </div>
                    )}
                    
                    {data.treatmentPlan && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500">{t('diagnoses.treatmentPlan')}:</span>
                        <span className="font-medium">{data.treatmentPlan}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : type === 'surgery' ? (
                <>
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-cyan-600" />
                    <h4 className="font-medium text-gray-900">{data.surgeryName}</h4>
                    {data.surgeryType && (
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">
                        {data.surgeryType}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {data.surgeryDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('surgeries.surgeryDate')}:</span>
                        <span className="font-medium">
                          {new Date(data.surgeryDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {data.hospitalName && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('surgeries.hospitalName')}:</span>
                        <span className="font-medium">{data.hospitalName}</span>
                      </div>
                    )}
                    
                    {data.surgeonName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('surgeries.surgeonName')}:</span>
                        <span className="font-medium">{data.surgeonName}</span>
                      </div>
                    )}
                    
                    {data.description && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500">{t('surgeries.description')}:</span>
                        <span className="font-medium">{data.description}</span>
                      </div>
                    )}
                    
                    {data.complications && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-500">{t('surgeries.complications')}:</span>
                        <span className="font-medium">{data.complications}</span>
                      </div>
                    )}
                    
                    {data.outcome && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500">{t('surgeries.outcome')}:</span>
                        <span className="font-medium">{data.outcome}</span>
                      </div>
                    )}
                    
                    {data.followUpDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">{t('surgeries.followUpDate')}:</span>
                        <span className="font-medium">
                          {new Date(data.followUpDate).toLocaleDateString(t('common.locale'), {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
              
              {data.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{data.notes}</p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('documents.attachedDocuments')}
              </h4>
              
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id}>
                      {isImage(doc.contentType) ? (
                        // Display images directly
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-3 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-gray-600" />
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.originalFileName}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition"
                              title={t('common.download')}
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          <img
                            src={imageUrls[doc.id] || ''}
                            alt={doc.originalFileName}
                            className="w-full max-h-96 object-contain bg-gray-100 cursor-pointer"
                            onClick={() => window.open(imageUrls[doc.id], '_blank')}
                          />
                        </div>
                      ) : (
                        // Display PDFs and other documents
                        <div className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.originalFileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • 
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition"
                              title={t('common.download')}
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('documents.noDocuments')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
