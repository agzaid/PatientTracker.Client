import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  User, Save, Plus, X, Heart, Phone, MapPin, AlertTriangle,
  Activity, Mail, Calendar, Droplets
} from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const PatientProfile: React.FC = () => {
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setForm({
        full_name: data.full_name || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        blood_type: data.blood_type || '',
        phone: data.phone || '',
        email: data.email || user.email || '',
        address: data.address || '',
        allergies: data.allergies || [],
        chronic_diseases: data.chronic_diseases || [],
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_relation: data.emergency_contact_relation || '',
      });
    } else {
      setForm(prev => ({ ...prev, email: user.email || '' }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString() };

    let error;
    if (existing) {
      ({ error } = await supabase.from('profiles').update(payload).eq('user_id', user.id));
    } else {
      ({ error } = await supabase.from('profiles').insert(payload));
    }

    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile saved successfully');
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

  const InputField = ({ label, icon: Icon, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Patient Profile</h2>
          <p className="text-sm text-gray-500">Manage your personal and medical information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField label="Full Name" icon={User} value={form.full_name} onChange={(e: any) => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
          <InputField label="Date of Birth" icon={Calendar} value={form.date_of_birth} onChange={(e: any) => setForm(p => ({ ...p, date_of_birth: e.target.value }))} type="date" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
            >
              <option value="">Select gender</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Type</label>
            <div className="relative">
              <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.blood_type}
                onChange={(e) => setForm(p => ({ ...p, blood_type: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
              >
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
          </div>
          <InputField label="Phone" icon={Phone} value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 123-4567" />
          <InputField label="Email" icon={Mail} value={form.email} onChange={(e: any) => setForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="your@email.com" />
        </div>
        <div className="mt-4">
          <InputField label="Address" icon={MapPin} value={form.address} onChange={(e: any) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, City, State" />
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Allergies
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.allergies.map(a => (
            <span key={a} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border border-amber-200">
              {a}
              <button onClick={() => removeAllergy(a)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {form.allergies.length === 0 && <p className="text-sm text-gray-400">No allergies recorded</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
            placeholder="Add allergy (e.g., Penicillin)"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button onClick={addAllergy} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Chronic Diseases */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-600" /> Chronic Diseases
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.chronic_diseases.map(d => (
            <span key={d} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border border-rose-200">
              {d}
              <button onClick={() => removeDisease(d)} className="hover:text-rose-900"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {form.chronic_diseases.length === 0 && <p className="text-sm text-gray-400">No chronic diseases recorded</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newDisease}
            onChange={(e) => setNewDisease(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDisease()}
            placeholder="Add condition (e.g., Diabetes Type 2)"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button onClick={addDisease} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-600" /> Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Contact Name" icon={User} value={form.emergency_contact_name} onChange={(e: any) => setForm(p => ({ ...p, emergency_contact_name: e.target.value }))} placeholder="Jane Doe" />
          <InputField label="Contact Phone" icon={Phone} value={form.emergency_contact_phone} onChange={(e: any) => setForm(p => ({ ...p, emergency_contact_phone: e.target.value }))} placeholder="+1 (555) 987-6543" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
            <select
              value={form.emergency_contact_relation}
              onChange={(e) => setForm(p => ({ ...p, emergency_contact_relation: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm bg-white"
            >
              <option value="">Select relationship</option>
              {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
