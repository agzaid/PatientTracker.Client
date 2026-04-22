import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { profileApi, type ProfileDto, type CreateProfileRequest, type UpdateProfileRequest } from '@/services/profileApi';
import { toast } from 'sonner';
import {
  User, Save, Plus, X, Heart, Phone, MapPin, AlertTriangle,
  Activity, Mail, Calendar, Droplets
} from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

// Extract InputField to prevent re-renders
const InputField: React.FC<{
  label: string;
  icon: any;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}> = ({ label, icon: Icon, value, onChange, type = 'text', placeholder = '' }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm ${
            isRTL ? 'pl-4 pr-10' : 'pl-10 pr-4'
          }`}
        />
      </div>
    </div>
  );
};

const PatientProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newDisease, setNewDisease] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    phone: '',
    email: '',
    address: '',
    allergies: [] as string[],
    chronic_diseases: [] as string[],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await profileApi.getProfile();
      
      if (profile) {
        setForm({
          full_name: profile.fullName || '',
          date_of_birth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: profile.gender || '',
          blood_type: profile.bloodType || '',
          phone: profile.phone || '',
          email: profile.email || user.email || '',
          address: profile.address || '',
          allergies: profile.allergies || [],
          chronic_diseases: profile.chronicDiseases || [],
          emergency_contact_name: profile.emergencyContactName || '',
          emergency_contact_phone: profile.emergencyContactPhone || '',
          emergency_contact_relation: profile.emergencyContactRelation || '',
        });
      } else {
        setForm(prev => ({ ...prev, email: user.email || '' }));
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error(t('profile.failedToFetch'));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const profile = await profileApi.getProfile();
      
      const request: CreateProfileRequest | UpdateProfileRequest = {
        fullName: form.full_name,
        dateOfBirth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        bloodType: form.blood_type || undefined,
        phone: form.phone || undefined,
        email: form.email,
        address: form.address,
        allergies: form.allergies,
        chronicDiseases: form.chronic_diseases,
        emergencyContactName: form.emergency_contact_name,
        emergencyContactPhone: form.emergency_contact_phone,
        emergencyContactRelation: form.emergency_contact_relation,
      };
      
      if (profile) {
        // Update existing profile
        await profileApi.updateProfile(request);
        toast.success(t('profile.profileUpdated'));
      } else {
        // Create new profile
        await profileApi.createProfile(request);
        toast.success(t('profile.profileCreated'));
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          toast.error(err.message || 'Validation error');
        });
      } else {
        toast.error(error.error || t('profile.failedToSave'));
      }
    }
    
    setSaving(false);
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !form.allergies.includes(newAllergy.trim())) {
      setForm(prev => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (a: string) => {
    setForm(prev => ({ ...prev, allergies: prev.allergies.filter(x => x !== a) }));
  };

  const addDisease = () => {
    if (newDisease.trim() && !form.chronic_diseases.includes(newDisease.trim())) {
      setForm(prev => ({ ...prev, chronic_diseases: [...prev.chronic_diseases, newDisease.trim()] }));
      setNewDisease('');
    }
  };

  const removeDisease = (d: string) => {
    setForm(prev => ({ ...prev, chronic_diseases: prev.chronic_diseases.filter(x => x !== d) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('profile.title')}</h2>
          <p className="text-sm text-gray-500">{t('profile.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {t('profile.saveProfile')}
        </button>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          {t('profile.personalInformation')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField label={t('profile.fullName')} icon={User} value={form.full_name} onChange={(e: any) => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
          <InputField label={t('profile.dateOfBirth')} icon={Calendar} value={form.date_of_birth} onChange={(e: any) => setForm(p => ({ ...p, date_of_birth: e.target.value }))} type="date" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.gender')}</label>
            <select
              value={form.gender}
              onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
            >
              <option value="">{t('profile.selectGender', 'Select gender')}</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.bloodType')}</label>
            <div className="relative">
              <Droplets className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${t('common.direction') === 'rtl' ? 'right-3' : 'left-3'}`} />
              <select
                value={form.blood_type}
                onChange={(e) => setForm(p => ({ ...p, blood_type: e.target.value }))}
                className={`w-full py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white ${
                  t('common.direction') === 'rtl' ? 'pl-4 pr-10' : 'pl-10 pr-4'
                }`}
              >
                <option value="">{t('profile.selectBloodType', 'Select blood type')}</option>
                {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
          </div>
          <InputField label={t('common.phone')} icon={Phone} value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 123-4567" />
          <InputField label={t('common.email')} icon={Mail} value={form.email} onChange={(e: any) => setForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="your@email.com" />
        </div>
        <div className="mt-4">
          <InputField label={t('common.address')} icon={MapPin} value={form.address} onChange={(e: any) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, City, State" />
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {t('profile.allergies')}
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.allergies.map(a => (
            <span key={a} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border border-amber-200">
              {a}
              <button onClick={() => removeAllergy(a)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {form.allergies.length === 0 && <p className="text-sm text-gray-400">{t('profile.noAllergies')}</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
            placeholder={t('profile.addAllergyPlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button onClick={addAllergy} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center gap-1">
            <Plus className="w-4 h-4" /> {t('common.add')}
          </button>
        </div>
      </div>

      {/* Chronic Diseases */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-600" /> {t('profile.chronicDiseases')}
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.chronic_diseases.map(d => (
            <span key={d} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border border-rose-200">
              {d}
              <button onClick={() => removeDisease(d)} className="hover:text-rose-900"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {form.chronic_diseases.length === 0 && <p className="text-sm text-gray-400">{t('profile.noDiseases')}</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newDisease}
            onChange={(e) => setNewDisease(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDisease()}
            placeholder={t('profile.addDiseasePlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button onClick={addDisease} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition flex items-center gap-1">
            <Plus className="w-4 h-4" /> {t('common.add')}
          </button>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4" />
          {t('profile.emergencyContact')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label={t('profile.contactName')} icon={User} value={form.emergency_contact_name} onChange={(e: any) => setForm(p => ({ ...p, emergency_contact_name: e.target.value }))} placeholder="Jane Doe" />
          <InputField label={t('profile.contactPhone')} icon={Phone} value={form.emergency_contact_phone} onChange={(e: any) => setForm(p => ({ ...p, emergency_contact_phone: e.target.value }))} placeholder="+1 (555) 987-6543" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.relationship')}</label>
            <select
              value={form.emergency_contact_relation}
              onChange={(e) => setForm(p => ({ ...p, emergency_contact_relation: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
            >
              <option value="">{t('profile.selectRelationship') || 'Select relationship'}</option>
              {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
