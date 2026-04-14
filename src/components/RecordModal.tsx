import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
  onSave: (data: Record<string, any>, fileUrl?: string) => Promise<void>;
  showFileUpload?: boolean;
  fileLabel?: string;
  existingFileUrl?: string;
}

const RecordModal: React.FC<RecordModalProps> = ({
  isOpen, onClose, title, fields, initialData, onSave, showFileUpload, fileLabel, existingFileUrl
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, any>>(initialData || {});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(existingFileUrl || '');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('medical-files')
      .upload(path, file);

    if (error) {
      toast.error('Failed to upload file');
    } else {
      const { data: urlData } = supabase.storage.from('medical-files').getPublicUrl(path);
      setFileUrl(urlData.publicUrl);
      setFileName(file.name);
      toast.success('File uploaded successfully');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = fields.filter(f => f.required);
    for (const f of required) {
      if (!form[f.name]) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      await onSave(form, fileUrl || undefined);
      onClose();
    } catch (err) {
      toast.error('Failed to save record');
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
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={form[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={form[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
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
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              )}
            </div>
          ))}

          {showFileUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{fileLabel || 'Upload File'}</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
              >
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : fileUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">{fileName || 'File uploaded'}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload (max 10MB)</p>
                    <p className="text-xs text-gray-400">Images, PDFs accepted</p>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordModal;
