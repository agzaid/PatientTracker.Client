import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { medicationApi } from '@/services/medicationApi';
import { labTestApi } from '@/services/labTestApi';
import { radiologyApi } from '@/services/radiologyApi';
import { diagnosisApi } from '@/services/diagnosisApi';
import { surgeryApi } from '@/services/surgeryApi';
import { profileApi } from '@/services/profileApi';
import type { ViewType } from './Sidebar';
import { toast } from 'sonner';
import {
  Pill, FlaskConical, ScanLine, Stethoscope, Scissors, TrendingUp,
  Activity, Calendar, AlertTriangle, Clock, ArrowRight, Plus, Heart, FileDown, Loader2
} from 'lucide-react';


interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

interface Stats {
  medications: number;
  currentMeds: number;
  labTests: number;
  scans: number;
  diagnoses: number;
  surgeries: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ medications: 0, currentMeds: 0, labTests: 0, scans: 0, diagnoses: 0, surgeries: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!user) {
      toast.error(t('dashboard.signInToExport'));
      return;
    }
    setExporting(true);
    toast.info(t('dashboard.generatingPDF'));
    try {
      // TODO: Implement PDF export with new API
      toast.error(t('dashboard.pdfExportNotImplemented'));
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error(t('dashboard.pdfExportError'));
    }
    setExporting(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all medical records using the new APIs
      const [medications, labTests, radiologyScans, diagnoses, surgeries] = await Promise.all([
        medicationApi.getMedications(),
        labTestApi.getLabTests(),
        radiologyApi.getRadiologyScans(),
        diagnosisApi.getDiagnoses(),
        surgeryApi.getSurgeries()
      ]);
      const currentMeds = medications.filter(m => m.isCurrent).length;
      
      // Fetch profile using the new API
      const profile = await profileApi.getProfile();
      
      setStats({
        medications: medications.length,
        currentMeds,
        labTests: labTests.length,
        scans: radiologyScans.length,
        diagnoses: diagnoses.length,
        surgeries: surgeries.length,
      });
      setProfile(profile);

      // Build recent items from all medical records
      const items: any[] = [];
      medications.slice(0, 8).forEach(m => items.push({ 
        ...m, 
        type: 'medication', 
        date: m.startDate,
        is_current: m.isCurrent
      }));
      
      labTests.slice(0, 8).forEach(l => items.push({ 
        ...l, 
        type: 'lab_test', 
        date: l.testDate,
        test_name: l.testName
      }));
      
      radiologyScans.slice(0, 8).forEach(r => items.push({ 
        ...r, 
        type: 'radiology_scan', 
        date: r.scanDate,
        scan_type: r.scanType,
        body_part: r.bodyPart
      }));
      
      diagnoses.slice(0, 8).forEach(d => items.push({ 
        ...d, 
        type: 'diagnosis', 
        date: d.diagnosisDate,
        diagnosis_name: d.diagnosisName
      }));
      
      surgeries.slice(0, 8).forEach(s => items.push({ 
        ...s, 
        type: 'surgery', 
        date: s.surgeryDate,
        surgery_name: s.surgeryName
      }));
      
      // Sort by date (newest first)
      items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setRecentItems(items.slice(0, 8));
    } catch (err) {
      console.error(err);
      toast.error(t('dashboard.fetchError'));
    }
    setLoading(false);
  };

  const statCards = [
    { label: t('dashboard.activeMedications'), value: stats.currentMeds, total: stats.medications, icon: Pill, color: 'from-emerald-500 to-green-400', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700', view: 'medications' as ViewType },
    { label: t('dashboard.labTests'), value: stats.labTests, icon: FlaskConical, color: 'from-amber-500 to-yellow-400', bgLight: 'bg-amber-50', textColor: 'text-amber-700', view: 'lab_tests' as ViewType },
    { label: t('dashboard.radiologyScans'), value: stats.scans, icon: ScanLine, color: 'from-purple-500 to-violet-400', bgLight: 'bg-purple-50', textColor: 'text-purple-700', view: 'radiology' as ViewType },
    { label: t('dashboard.diagnoses'), value: stats.diagnoses, icon: Stethoscope, color: 'from-rose-500 to-pink-400', bgLight: 'bg-rose-50', textColor: 'text-rose-700', view: 'diagnoses' as ViewType },
    { label: t('dashboard.surgeries'), value: stats.surgeries, icon: Scissors, color: 'from-cyan-500 to-blue-400', bgLight: 'bg-cyan-50', textColor: 'text-cyan-700', view: 'surgeries' as ViewType },
  ];

  const getItemIcon = (type: string, isActive?: boolean) => {
    switch (type) {
      case 'medication': return <Pill className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />;
      case 'lab_test': return <FlaskConical className="w-4 h-4 text-amber-600" />;
      case 'scan': return <ScanLine className="w-4 h-4 text-purple-600" />;
      case 'radiology_scan': return <ScanLine className="w-4 h-4 text-purple-600" />;
      case 'diagnosis': return <Stethoscope className="w-4 h-4 text-rose-600" />;
      case 'surgery': return <Scissors className="w-4 h-4 text-cyan-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getItemName = (item: any) => {
    switch (item.type) {
      case 'medication': return item.name;
      case 'lab_test': return item.test_name;
      case 'scan': return `${item.scan_type} - ${item.body_part}`;
      case 'radiology_scan': return `${item.scan_type} - ${item.body_part}`;
      case 'diagnosis': return item.diagnosis_name;
      case 'surgery': return item.surgery_name;
      default: return t('common.unknown');
    }
  };

  const getItemBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      medication: { label: t('dashboard.medication'), color: 'bg-emerald-100 text-emerald-700' },
      lab_test: { label: t('dashboard.labTest'), color: 'bg-amber-100 text-amber-700' },
      scan: { label: t('dashboard.radiology'), color: 'bg-purple-100 text-purple-700' },
      radiology_scan: { label: t('dashboard.radiology'), color: 'bg-purple-100 text-purple-700' },
      diagnosis: { label: t('dashboard.diagnosis'), color: 'bg-rose-100 text-rose-700' },
      surgery: { label: t('dashboard.surgery'), color: 'bg-cyan-100 text-cyan-700' },
    };
    return badges[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  const quickActions = [
    { label: t('dashboard.addMedication'), icon: Pill, view: 'medications' as ViewType, color: 'bg-emerald-500' },
    { label: t('dashboard.addLabTest'), icon: FlaskConical, view: 'lab_tests' as ViewType, color: 'bg-amber-500' },
    { label: t('dashboard.addScan'), icon: ScanLine, view: 'radiology' as ViewType, color: 'bg-purple-500' },
    { label: t('dashboard.viewTimeline'), icon: Clock, view: 'timeline' as ViewType, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                {t('dashboard.welcome')}{profile?.full_name ? `, ${profile.full_name}` : ''} 
              </h1>
              <p className="text-blue-100 text-sm lg:text-base max-w-lg">
                {t('dashboard.welcomeMessage')}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{new Date().toLocaleDateString(t('common.locale'), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          {profile?.blood_type && (
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-white/15 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {t('dashboard.bloodType')}: <strong>{profile.blood_type}</strong>
              </div>
              {profile.allergies?.length > 0 && (
                <div className="bg-white/15 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {profile.allergies.length} {t('dashboard.knownAllergies')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onNavigate(card.view)}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left group"
            >
              <div className={`w-10 h-10 ${card.bgLight} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              {card.total !== undefined && card.total > card.value && (
                <p className="text-[10px] text-gray-400 mt-1">{card.total} total</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Actions + Export PDF */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onNavigate(action.view)}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all group"
            >
              <div className={`w-9 h-9 ${action.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
              <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-3 hover:shadow-lg hover:shadow-blue-500/25 transition-all group col-span-2 lg:col-span-1"
        >
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            {exporting ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <FileDown className="w-4 h-4 text-white" />}
          </div>
          <span className="text-sm font-medium text-white">{exporting ? t('dashboard.generating') : t('dashboard.exportPDF')}</span>
        </button>
      </div>


      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t('dashboard.recentActivity')}</h2>
          <button onClick={() => onNavigate('timeline')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            {t('dashboard.viewAll')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recentItems.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t('dashboard.noRecords')}</p>
            <button
              onClick={() => onNavigate('medications')}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.addFirstRecord')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentItems.map((item, i) => {
              const badge = getItemBadge(item.type);
              const isActive = item.type === 'medication' ? item.is_current : undefined;
              return (
                <div key={item.id || i} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'medication' ? (item.is_current ? 'bg-emerald-50' : 'bg-gray-50') : 'bg-gray-50'
                  }`}>
                    {getItemIcon(item.type, isActive)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{getItemName(item)}</p>
                    <p className="text-xs text-gray-400">
                      {item.date ? new Date(item.date).toLocaleDateString(t('common.locale'), { month: 'short', day: 'numeric', year: 'numeric' }) : t('common.noDate')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Health Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Keep Records Updated</h3>
          <p className="text-xs text-gray-600">Regularly update your medications and test results for accurate health tracking.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Upload Documents</h3>
          <p className="text-xs text-gray-600">Attach prescriptions, lab reports, and scan images for a complete digital record.</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Share with Clinics</h3>
          <p className="text-xs text-gray-600">Generate secure links to share your profile with healthcare providers.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
