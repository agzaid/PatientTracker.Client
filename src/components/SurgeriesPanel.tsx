import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import { Plus, Scissors, Search, Trash2, Edit2, ExternalLink, Building2, UserCircle } from 'lucide-react';

const surgeryFields: FieldConfig[] = [
  { name: 'surgery_name', label: 'Surgery Name', type: 'text', placeholder: 'e.g., Appendectomy', required: true },
  { name: 'surgery_date', label: 'Surgery Date', type: 'date', required: true },
  { name: 'hospital_name', label: 'Hospital/Clinic', type: 'text', placeholder: 'e.g., City General Hospital' },
  { name: 'surgeon_name', label: 'Surgeon Name', type: 'text', placeholder: 'Dr. Johnson' },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Pre/post-op notes, recovery details...' },
];

const SurgeriesPanel: React.FC = () => {
  const { user } = useAuth();
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchSurgeries();
  }, [user]);

  const fetchSurgeries = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('surgeries').select('*').eq('user_id', user.id).order('surgery_date', { ascending: false });
    if (data) setSurgeries(data);
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, document_url: fileUrl || data.document_url || '' };
    if (editItem) {
      const { error } = await supabase.from('surgeries').update(payload).eq('id', editItem.id);
      if (error) throw error;
      toast.success('Surgery updated');
    } else {
      const { error } = await supabase.from('surgeries').insert(payload);
      if (error) throw error;
      toast.success('Surgery added');
    }
    setEditItem(null);
    fetchSurgeries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this surgery record?')) return;
    await supabase.from('surgeries').delete().eq('id', id);
    toast.success('Surgery deleted');
    fetchSurgeries();
  };

  const filtered = surgeries.filter(s =>
    !search || s.surgery_name.toLowerCase().includes(search.toLowerCase()) || (s.hospital_name || '').toLowerCase().includes(search.toLowerCase()) || (s.surgeon_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-cyan-600" /> Surgeries & Operations
          </h2>
          <p className="text-sm text-gray-500">{surgeries.length} records</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-gradient-to-r from-cyan-500 to-blue-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Surgery
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search surgeries..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Scissors className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No surgery records found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(surg => (
            <div key={surg.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{surg.surgery_name}</h4>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {surg.hospital_name && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {surg.hospital_name}
                        </span>
                      )}
                      {surg.surgeon_name && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <UserCircle className="w-3 h-3" /> Dr. {surg.surgeon_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {surg.surgery_date ? new Date(surg.surgery_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                    </p>
                    {surg.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{surg.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {surg.document_url && (
                    <a href={surg.document_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => { setEditItem(surg); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(surg.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? 'Edit Surgery' : 'Add Surgery'}
        fields={surgeryFields}
        initialData={editItem || {}}
        onSave={handleSave}
        showFileUpload
        fileLabel="Upload Documents"
        existingFileUrl={editItem?.document_url}
      />
    </div>
  );
};

export default SurgeriesPanel;
