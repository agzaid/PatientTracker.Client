import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Clock, Pill, FlaskConical, ScanLine, Stethoscope, Scissors,
  Search, Filter, Calendar, ChevronDown, FileDown, Loader2
} from 'lucide-react';


interface TimelineItem {
  id: string;
  type: 'medication' | 'lab_test' | 'radiology' | 'diagnosis' | 'surgery';
  title: string;
  subtitle: string;
  date: string;
  details?: string;
  status?: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  medication: { icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Medication' },
  lab_test: { icon: FlaskConical, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Lab Test' },
  radiology: { icon: ScanLine, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Radiology' },
  diagnosis: { icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Diagnosis' },
  surgery: { icon: Scissors, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Surgery' },
};

const TimelineView: React.FC = () => {
  const { user, session } = useAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to export');
      return;
    }
    setExporting(true);
    toast.info('Generating your health profile PDF...');
    try {
      const { data, error } = await supabase.functions.invoke('export-pdf', {});
      if (error) throw error;
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthProfile_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
    setExporting(false);
  };


  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [medsRes, labsRes, scansRes, diagRes, surgRes] = await Promise.all([
      supabase.from('medications').select('*').eq('user_id', user.id),
      supabase.from('lab_tests').select('*').eq('user_id', user.id),
      supabase.from('radiology_scans').select('*').eq('user_id', user.id),
      supabase.from('diagnoses').select('*').eq('user_id', user.id),
      supabase.from('surgeries').select('*').eq('user_id', user.id),
    ]);

    const all: TimelineItem[] = [];

    (medsRes.data || []).forEach(m => all.push({
      id: m.id, type: 'medication', title: m.name,
      subtitle: `${m.dosage || ''} ${m.frequency || ''}`.trim() || 'No dosage info',
      date: m.start_date || m.created_at, details: m.notes,
      status: m.is_current ? 'Active' : 'Past',
    }));

    (labsRes.data || []).forEach(l => all.push({
      id: l.id, type: 'lab_test', title: l.test_name,
      subtitle: l.result_value ? `${l.result_value} ${l.result_unit || ''}` : 'Pending',
      date: l.test_date || l.created_at, details: l.notes,
      status: l.status,
    }));

    (scansRes.data || []).forEach(s => all.push({
      id: s.id, type: 'radiology', title: `${s.scan_type}${s.body_part ? ` - ${s.body_part}` : ''}`,
      subtitle: s.description || 'No description',
      date: s.scan_date || s.created_at, details: s.doctor_notes,
    }));

    (diagRes.data || []).forEach(d => all.push({
      id: d.id, type: 'diagnosis', title: d.diagnosis_name,
      subtitle: d.doctor_name ? `Dr. ${d.doctor_name}` : 'No doctor specified',
      date: d.date_diagnosed || d.created_at, details: d.notes,
      status: d.status,
    }));

    (surgRes.data || []).forEach(s => all.push({
      id: s.id, type: 'surgery', title: s.surgery_name,
      subtitle: s.hospital_name || 'No hospital specified',
      date: s.surgery_date || s.created_at, details: s.notes,
    }));

    all.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    setItems(all);
    setLoading(false);
  };

  const getDateCutoff = () => {
    const now = new Date();
    switch (dateRange) {
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '6m': return new Date(now.setMonth(now.getMonth() - 6));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return null;
    }
  };

  const filtered = items
    .filter(i => typeFilter === 'all' || i.type === typeFilter)
    .filter(i => {
      const cutoff = getDateCutoff();
      if (!cutoff) return true;
      return new Date(i.date) >= cutoff;
    })
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || (i.subtitle || '').toLowerCase().includes(search.toLowerCase()));

  // Group by month/year
  const grouped: Record<string, TimelineItem[]> = {};
  filtered.forEach(item => {
    const d = new Date(item.date);
    const key = d.getTime() ? `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}` : 'Unknown Date';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" /> Health Timeline
          </h2>
          <p className="text-sm text-gray-500">Complete chronological view of your medical history</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exporting ? 'Generating...' : 'Export PDF'}
        </button>
      </div>


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search timeline..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All Types</option>
          <option value="medication">Medications</option>
          <option value="lab_test">Lab Tests</option>
          <option value="radiology">Radiology</option>
          <option value="diagnosis">Diagnoses</option>
          <option value="surgery">Surgeries</option>
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All Time</option>
          <option value="30d">Last 30 Days</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = items.filter(i => i.type === key).length;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                typeFilter === key ? `${cfg.bg} ${cfg.color}` : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No timeline entries found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([monthYear, groupItems]) => (
            <div key={monthYear}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">{monthYear}</h3>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">{groupItems.length} entries</span>
              </div>

              <div className="relative pl-8 space-y-3">
                {/* Vertical line */}
                <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

                {groupItems.map((item) => {
                  const cfg = typeConfig[item.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={item.id} className="relative">
                      {/* Dot on timeline */}
                      <div className={`absolute -left-5 top-4 w-3 h-3 rounded-full border-2 border-white ${cfg.bg}`} />

                      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {item.status && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {item.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                            {item.details && <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 rounded-lg p-2">{item.details}</p>}
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineView;
