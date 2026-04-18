import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { documentApi, DocumentType, ParentEntityType } from '@/services/documentApi';
import { toast } from 'sonner';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'date' | 'textarea' | 'select' | 'checkbox' | 'number';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>, fileUrl?: string, documentId?: number, allDocumentIds?: number[]) => Promise<void>;
  showFileUpload?: boolean;
  fileLabel?: string;
  existingFileUrl?: string;
  documentType?: DocumentType;
  parentEntityType?: ParentEntityType;
  parentEntityId?: number;
}

const RecordModal: React.FC<RecordModalProps> = ({
  isOpen, onClose, title, fields, initialData, onSave, showFileUpload, fileLabel, existingFileUrl,
  documentType = DocumentType.General, parentEntityType = ParentEntityType.None, parentEntityId
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, any>>(initialData || {});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(existingFileUrl || '');
  const [fileName, setFileName] = useState('');
  const [documentIds, setDocumentIds] = useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, id: number}[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Update form when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(initialData || {});
      setFileUrl(existingFileUrl || '');
      setFileName('');
      setDocumentIds([]);
      setUploadedFiles([]);
    }
  }, [initialData, existingFileUrl, isOpen]);

  if (!isOpen) return null;

  const handleChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(t('documents.fileSizeError'));
      return;
    }

    setUploading(true);
    
    try {
      const documents = await documentApi.uploadDocumentList(
        files,
        documentType,
        parentEntityType,
        parentEntityId
      );
      
      const newDocumentIds = documents.map(doc => doc.id);
      const newUploadedFiles = documents.map(doc => ({
        name: doc.originalFileName,
        id: doc.id
      }));
      
      setDocumentIds(prev => [...prev, ...newDocumentIds]);
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      
      if (newUploadedFiles.length > 0) {
        setFileUrl('multiple');
        setFileName(`${newUploadedFiles.length} file(s) uploaded`);
      }
      
      toast.success(t('documents.uploadSuccess'));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.error || t('documents.uploadError'));
    }
    
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await documentApi.deleteDocument(docId);
      setDocumentIds(prev => prev.filter(id => id !== docId));
      setUploadedFiles(prev => prev.filter(file => file.id !== docId));
      
      if (uploadedFiles.length === 1) {
        setFileUrl('');
        setFileName('');
      } else {
        setFileName(`${uploadedFiles.length - 1} file(s) uploaded`);
      }
      
      toast.success(t('documents.deleteSuccess'));
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.error || t('documents.deleteError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = fields.filter(f => f.required);
    for (const f of required) {
      if (!form[f.name]) {
        toast.error(t('validation.required', { field: f.label }));
        return;
      }
    }
    setSaving(true);
    try {
      // Pass all document IDs to the parent component
      await onSave(form, fileUrl || undefined, documentIds[0], documentIds);
      onClose();
    } catch (err) {
      toast.error(t('common.saveError'));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(field.label)} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={form[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder && t(field.placeholder)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
                >
                  <option value="">{field.placeholder ? t(field.placeholder) : t('common.select')}</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[field.name] || false}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{field.placeholder || 'Yes'}</span>
                </label>
              ) : (
                <input
                  type={field.type}
                  value={form[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder && t(field.placeholder)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              )}
            </div>
          ))}

          {showFileUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {fileLabel || t('documents.uploadFile')}
              </label>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(file.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-500 transition flex-shrink-0"
                        title={t('common.delete')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Area */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
              >
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" multiple />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t('documents.uploading')}</span>
                  </div>
                ) : uploadedFiles.length > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('documents.addMoreFiles')}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t('documents.clickToUpload')}</p>
                    <p className="text-xs text-gray-400">{t('documents.acceptedFormats')}</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordModal;
