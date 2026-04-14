import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import RecordModal, { FieldConfig } from './RecordModal';
import { Plus, Stethoscope, Search, Trash2, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';

const diagnosisFields: FieldConfig[] = [
  { name: 'diagnosis_name', label: 'Diagnosis Name', type: 'text', placeholder: 'e.g., Type 2 Diabetes', required: true },
  { name: 'date_diagnosed', label: 'Date Diagnosed', type: 'date' },
  { name: 'doctor_name', label: 'Doctor Name', type: 'text', placeholder: 'Dr. Smith' },
  { name: 'severity', label: 'Severity', type: 'select', options: ['mild', 'moderate', 'severe', 'critical'] },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'resolved', 'managed', 'monitoring'] },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details...' },
];

const DiagnosesPanel: React.FC = () => {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) fetchDiagnoses();
  }, [user]);

  const fetchDiagnoses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('diagnoses').select('*').eq('user_id', user.id).order('date_diagnosed', { ascending: false });
    if (data) setDiagnoses(data);
    setLoading(false);
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!user) return;
    const payload = { ...data, user_id: user.id };
    if (editItem) {
      const { error } = await supabase.from('diagnoses').update(payload).eq('id', editItem.id);
      if (error) throw error;
      toast.success('Diagnosis updated');
    } else {
      const { error } = await supabase.from('diagnoses').insert(payload);
      if (error) throw error;
      toast.success('Diagnosis added');
    }
    setEditItem(null);
    fetchDiagnoses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this diagnosis?')) return;
    await supabase.from('diagnoses').delete().eq('id', id);
    toast.success('Diagnosis deleted');
    fetchDiagnoses();
  };

  const getSeverityColor = (s: string) => {
    const m: Record<string, string> = { mild: 'bg-green-100 text-green-700', moderate: 'bg-amber-100 text-amber-700', severe: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (s: string) => {
    if (s === 'resolved') return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    if (s === 'active') return <AlertCircle className="w-3 h-3 text-red-500" />;
    return <AlertCircle className="w-3 h-3 text-amber-500" />;
  };

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { active: 'bg-red-50 text-red-700', resolved: 'bg-emerald-50 text-emerald-700', managed: 'bg-blue-50 text-blue-700', monitoring: 'bg-amber-50 text-amber-700' };
    return m[s] || 'bg-gray-50 text-gray-700';
  };

  const filtered = diagnoses
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .filter(d => !search || d.diagnosis_name.toLowerCase().includes(search.toLowerCase()) || (d.doctor_name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-rose-600" /> Diagnoses
          </h2>
          <p className="text-sm text-gray-500">{diagnoses.length} records, {diagnoses.filter(d => d.status === 'active').length} active</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="bg-gradient-to-r from-rose-500 to-pink-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-rose-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Diagnosis
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search diagnoses..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="managed">Managed</option>
          <option value="monitoring">Monitoring</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No diagnoses found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(diag => (
            <div key={diag.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                      {diag.diagnosis_name}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getSeverityColor(diag.severity)}`}>{diag.severity}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${getStatusColor(diag.status)}`}>
                        {getStatusIcon(diag.status)} {diag.status}
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      {diag.doctor_name && <span>Dr. {diag.doctor_name}</span>}
                      {diag.date_diagnosed && <span>{new Date(diag.date_diagnosed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                    </div>
                    {diag.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{diag.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditItem(diag); setShowModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(diag.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
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
        title={editItem ? 'Edit Diagnosis' : 'Add Diagnosis'}
        fields={diagnosisFields}
        initialData={editItem || { severity: 'moderate', status: 'active' }}
        onSave={handleSave}
      />
    </div>
  );
};

export default DiagnosesPanel;
