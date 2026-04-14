import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import { Plus, ScanLine, Search, Trash2, Edit2, ExternalLink, Image as ImageIcon } from 'lucide-react';

const scanFields: FieldConfig[] = [
  { name: 'scan_type', label: 'Scan Type', type: 'select', options: ['X-ray', 'MRI', 'CT Scan', 'Ultrasound', 'PET Scan', 'Mammogram', 'DEXA Scan', 'Fluoroscopy', 'Other'], required: true },
  { name: 'body_part', label: 'Body Part', type: 'text', placeholder: 'e.g., Chest, Knee, Brain' },
  { name: 'scan_date', label: 'Scan Date', type: 'date', required: true },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the findings...' },
  { name: 'doctor_notes', label: 'Doctor Notes', type: 'textarea', placeholder: 'Notes from the radiologist...' },
];

const RadiologyPanel: React.FC = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchScans();
  }, [user]);

  const fetchScans = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('radiology_scans').select('*').eq('user_id', user.id).order('scan_date', { ascending: false });
    if (data) setScans(data);
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, image_url: fileUrl || data.image_url || '' };
    if (editItem) {
      const { error } = await supabase.from('radiology_scans').update(payload).eq('id', editItem.id);
      if (error) throw error;
      toast.success('Scan updated');
    } else {
      const { error } = await supabase.from('radiology_scans').insert(payload);
      if (error) throw error;
      toast.success('Scan added');
    }
    setEditItem(null);
    fetchScans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scan?')) return;
    await supabase.from('radiology_scans').delete().eq('id', id);
    toast.success('Scan deleted');
    fetchScans();
  };

  const getScanColor = (type: string) => {
    const colors: Record<string, string> = {
      'X-ray': 'bg-blue-50 text-blue-700',
      'MRI': 'bg-purple-50 text-purple-700',
      'CT Scan': 'bg-indigo-50 text-indigo-700',
      'Ultrasound': 'bg-cyan-50 text-cyan-700',
      'PET Scan': 'bg-amber-50 text-amber-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  const filtered = scans.filter(s =>
    !search || s.scan_type.toLowerCase().includes(search.toLowerCase()) || (s.body_part || '').toLowerCase().includes(search.toLowerCase()) || (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-purple-600" /> Radiology Scans
          </h2>
          <p className="text-sm text-gray-500">{scans.length} scan records</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-gradient-to-r from-purple-500 to-violet-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Scan
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scans..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <ScanLine className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No radiology scans found</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(scan => (
            <div key={scan.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScanColor(scan.scan_type)}`}>
                      {scan.scan_type}
                    </span>
                    {scan.body_part && <p className="text-sm font-semibold text-gray-900 mt-1">{scan.body_part}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {scan.image_url && (
                    <a href={scan.image_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => { setEditItem(scan); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(scan.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {scan.description && <p className="text-xs text-gray-600 mb-2">{scan.description}</p>}
              {scan.doctor_notes && (
                <div className="bg-purple-50/50 rounded-lg p-2 text-xs text-purple-700">
                  <strong>Doctor Notes:</strong> {scan.doctor_notes}
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-2">
                {scan.scan_date ? new Date(scan.scan_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
              </p>
              {scan.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                  <img src={scan.image_url} alt={scan.scan_type} className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? 'Edit Scan' : 'Add Radiology Scan'}
        fields={scanFields}
        initialData={editItem || {}}
        onSave={handleSave}
        showFileUpload
        fileLabel="Upload Scan Image"
        existingFileUrl={editItem?.image_url}
      />
    </div>
  );
};

export default RadiologyPanel;
