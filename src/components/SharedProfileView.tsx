import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Heart, Pill, FlaskConical, ScanLine, Stethoscope, Scissors,
  AlertTriangle, User, Phone, Droplets, Shield, Clock, ExternalLink
} from 'lucide-react';

interface SharedProfileViewProps {
  token: string;
}

const SharedProfileView: React.FC<SharedProfileViewProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedData();
  }, [token]);

  const fetchSharedData = async () => {
    setLoading(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('view-shared-profile', {
        body: { token },
      });
      if (err || result?.error) {
        setError(result?.error || 'Failed to load profile');
      } else {
        setData(result);
      }
    } catch (e) {
      setError('Failed to load shared profile');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading health profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  const Section = ({ title, icon: Icon, color, children }: any) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-2 ${color}`}>
        <Icon className="w-4 h-4" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6" />
            <span className="font-bold">HealthProfile</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Shared View</span>
          </div>
          {profile && (
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name || 'Patient Profile'}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-blue-100">
                {profile.gender && <span>{profile.gender}</span>}
                {profile.date_of_birth && <span>DOB: {new Date(profile.date_of_birth).toLocaleDateString()}</span>}
                {profile.blood_type && (
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {profile.blood_type}</span>
                )}
              </div>
              {profile.allergies?.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">Allergies: {profile.allergies.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Emergency Contact */}
        {profile?.emergency_contact_name && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Emergency Contact: {profile.emergency_contact_name}</p>
              <p className="text-xs text-red-600">{profile.emergency_contact_phone} ({profile.emergency_contact_relation})</p>
            </div>
          </div>
        )}

        {/* Chronic Diseases */}
        {profile?.chronic_diseases?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2">
              {profile.chronic_diseases.map((d: string) => (
                <span key={d} className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-medium">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {data?.medications?.length > 0 && (
          <Section title={`Medications (${data.medications.length})`} icon={Pill} color="text-emerald-700">
            <div className="space-y-3">
              {data.medications.map((m: any) => (
                <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Pill className={`w-4 h-4 mt-0.5 ${m.is_current ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.name}
                      {m.is_current && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}
                    </p>
                    {m.dosage && <p className="text-xs text-gray-500">{m.dosage} {m.frequency && `- ${m.frequency}`}</p>}
                    {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Lab Tests */}
        {data?.lab_tests?.length > 0 && (
          <Section title={`Lab Tests (${data.lab_tests.length})`} icon={FlaskConical} color="text-amber-700">
            <div className="space-y-3">
              {data.lab_tests.map((t: any) => (
                <div key={t.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.test_name}</p>
                    <p className="text-xs text-gray-500">{t.test_date ? new Date(t.test_date).toLocaleDateString() : ''}</p>
                    {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
                  </div>
                  {t.result_value && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{t.result_value} {t.result_unit}</p>
                      {t.normal_range && <p className="text-[10px] text-gray-400">Normal: {t.normal_range}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Radiology */}
        {data?.radiology_scans?.length > 0 && (
          <Section title={`Radiology (${data.radiology_scans.length})`} icon={ScanLine} color="text-purple-700">
            <div className="space-y-3">
              {data.radiology_scans.map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{s.scan_type} {s.body_part && `- ${s.body_part}`}</p>
                  <p className="text-xs text-gray-500">{s.scan_date ? new Date(s.scan_date).toLocaleDateString() : ''}</p>
                  {s.description && <p className="text-xs text-gray-600 mt-1">{s.description}</p>}
                  {s.doctor_notes && <p className="text-xs text-purple-600 mt-1">Doctor: {s.doctor_notes}</p>}
                  {s.image_url && (
                    <a href={s.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> View Image
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Diagnoses */}
        {data?.diagnoses?.length > 0 && (
          <Section title={`Diagnoses (${data.diagnoses.length})`} icon={Stethoscope} color="text-rose-700">
            <div className="space-y-3">
              {data.diagnoses.map((d: any) => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {d.diagnosis_name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{d.status}</span>
                  </p>
                  {d.doctor_name && <p className="text-xs text-gray-500">Dr. {d.doctor_name}</p>}
                  {d.date_diagnosed && <p className="text-xs text-gray-400">{new Date(d.date_diagnosed).toLocaleDateString()}</p>}
                  {d.notes && <p className="text-xs text-gray-400 mt-1">{d.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Surgeries */}
        {data?.surgeries?.length > 0 && (
          <Section title={`Surgeries (${data.surgeries.length})`} icon={Scissors} color="text-cyan-700">
            <div className="space-y-3">
              {data.surgeries.map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{s.surgery_name}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                    {s.hospital_name && <span>{s.hospital_name}</span>}
                    {s.surgeon_name && <span>Dr. {s.surgeon_name}</span>}
                    {s.surgery_date && <span>{new Date(s.surgery_date).toLocaleDateString()}</span>}
                  </div>
                  {s.notes && <p className="text-xs text-gray-400 mt-1">{s.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <Shield className="w-4 h-4" />
            <span>This is a read-only view shared by the patient via HealthProfile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedProfileView;
