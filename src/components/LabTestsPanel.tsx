import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import { Plus, FlaskConical, Search, Trash2, Edit2, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const labFields: FieldConfig[] = [
  { name: 'test_name', label: 'Test Name', type: 'text', placeholder: 'e.g., Complete Blood Count', required: true },
  { name: 'test_date', label: 'Test Date', type: 'date', required: true },
  { name: 'result_value', label: 'Result Value', type: 'text', placeholder: 'e.g., 120' },
  { name: 'result_unit', label: 'Unit', type: 'text', placeholder: 'e.g., mg/dL' },
  { name: 'normal_range', label: 'Normal Range', type: 'text', placeholder: 'e.g., 70-100' },
  { name: 'status', label: 'Status', type: 'select', options: ['normal', 'high', 'low', 'abnormal', 'pending'] },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
];

const LabTestsPanel: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) fetchTests();
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('lab_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false });
    if (data) setTests(data);
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>, fileUrl?: string) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id, report_url: fileUrl || data.report_url || '' };
    if (editItem) {
      const { error } = await supabase.from('lab_tests').update(payload).eq('id', editItem.id);
      if (error) throw error;
      toast.success('Lab test updated');
    } else {
      const { error } = await supabase.from('lab_tests').insert(payload);
      if (error) throw error;
      toast.success('Lab test added');
    }
    setEditItem(null);
    fetchTests();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lab test?')) return;
    await supabase.from('lab_tests').delete().eq('id', id);
    toast.success('Lab test deleted');
    fetchTests();
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      normal: { color: 'bg-emerald-100 text-emerald-700', icon: <Minus className="w-3 h-3" /> },
      high: { color: 'bg-red-100 text-red-700', icon: <TrendingUp className="w-3 h-3" /> },
      low: { color: 'bg-amber-100 text-amber-700', icon: <TrendingDown className="w-3 h-3" /> },
      abnormal: { color: 'bg-rose-100 text-rose-700', icon: <TrendingUp className="w-3 h-3" /> },
      pending: { color: 'bg-blue-100 text-blue-700', icon: <Minus className="w-3 h-3" /> },
    };
    return map[status] || map.normal;
  };

  const filtered = tests.filter(t =>
    !search || t.test_name.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" /> Lab Tests
          </h2>
          <p className="text-sm text-gray-500">{tests.length} test records</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Lab Test
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lab tests..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <FlaskConical className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No lab tests found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(test => {
            const badge = getStatusBadge(test.status);
            return (
              <div key={test.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FlaskConical className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {test.test_name}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${badge.color}`}>
                          {badge.icon} {test.status}
                        </span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {test.result_value && (
                          <span className="text-lg font-bold text-gray-900">
                            {test.result_value} <span className="text-xs font-normal text-gray-400">{test.result_unit}</span>
                          </span>
                        )}
                        {test.normal_range && (
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Normal: {test.normal_range}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {test.test_date ? new Date(test.test_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                      </p>
                      {test.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{test.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {test.report_url && (
                      <a href={test.report_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => { setEditItem(test); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(test.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        title={editItem ? 'Edit Lab Test' : 'Add Lab Test'}
        fields={labFields}
        initialData={editItem || { status: 'normal' }}
        onSave={handleSave}
        showFileUpload
        fileLabel="Upload Lab Report"
        existingFileUrl={editItem?.report_url}
      />
    </div>
  );
};

export default LabTestsPanel;
