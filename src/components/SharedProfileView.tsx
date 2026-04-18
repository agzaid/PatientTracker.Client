import React, { useEffect, useState } from 'react';
import { shareApi, type SharedProfileResponse } from '@/services/shareApi';
import { documentApi, type DocumentDto, DocumentType } from '@/services/documentApi';
import DocumentsList from './DocumentsList';
import {
  Heart, Pill, FlaskConical, ScanLine, Stethoscope, Scissors,
  AlertTriangle, User, Phone, Droplets, Shield, Clock, ExternalLink,
  FileText, Download, ImageIcon
} from 'lucide-react';

interface SharedProfileViewProps {
  token: string;
}

const SharedProfileView: React.FC<SharedProfileViewProps> = ({ token }) => {
  const [data, setData] = useState<SharedProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchSharedData();
  }, [token]);

  const fetchSharedData = async () => {
    setLoading(true);
    try {
      const result = await shareApi.getSharedProfile(token);
      setData(result);
      
      // Collect all documents from all entities
      const allDocuments: DocumentDto[] = [];
      
      // Add documents from medications
      result.medications?.forEach(med => {
        med.documents?.forEach(doc => allDocuments.push(doc));
      });
      
      // Add documents from lab tests
      result.labTests?.forEach(test => {
        test.documents?.forEach(doc => allDocuments.push(doc));
      });
      
      // Add documents from radiology scans
      result.radiologyScans?.forEach(scan => {
        scan.documents?.forEach(doc => allDocuments.push(doc));
      });
      
      // Add documents from diagnoses
      result.diagnoses?.forEach(diagnosis => {
        diagnosis.documents?.forEach(doc => allDocuments.push(doc));
      });
      
      // Add documents from surgeries
      result.surgeries?.forEach(surgery => {
        surgery.documents?.forEach(doc => allDocuments.push(doc));
      });
      
      // Fetch image blobs for image documents
      if (allDocuments.length > 0) {
        const imagePromises = allDocuments
          .filter(doc => doc.contentType.startsWith('image/'))
          .map(async (doc) => {
            try {
              const blob = await shareApi.downloadSharedDocument(token, doc.id);
              const url = URL.createObjectURL(blob);
              return { id: doc.id, url };
            } catch (error) {
              console.error(`Failed to fetch image ${doc.id}:`, error);
              return null;
            }
          });
        
        const imageResults = await Promise.all(imagePromises);
        const newImageUrls: Record<number, string> = {};
        imageResults.forEach(result => {
          if (result) {
            newImageUrls[result.id] = result.url;
          }
        });
        setImageUrls(newImageUrls);
      }
    } catch (e: any) {
      setError(e.error || 'Failed to load shared profile');
    }
    setLoading(false);
  };

  const handleDownload = async (document: DocumentDto) => {
    try {
      const blob = await shareApi.downloadSharedDocument(token, document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.originalFileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download document:', error);
      const errorMessage = error.error || 'Failed to download document';
      alert(errorMessage);
    }
  };

  const handleView = async (document: DocumentDto) => {
    try {
      if (document.contentType.startsWith('image/')) {
        // For images, open the blob URL directly
        if (imageUrls[document.id]) {
          window.open(imageUrls[document.id], '_blank');
        }
      } else {
        // For PDFs and other documents, download and open
        const blob = await shareApi.downloadSharedDocument(token, document.id);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Don't revoke immediately to allow the new tab to load
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } catch (error: any) {
      console.error('Failed to view document:', error);
      const errorMessage = error.error || 'Failed to view document';
      alert(errorMessage);
    }
  };

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

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
              <h1 className="text-2xl font-bold">{profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Patient Profile'}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-blue-100">
                {profile.gender && <span>{profile.gender}</span>}
                {profile.dateOfBirth && <span>DOB: {new Date(profile.dateOfBirth).toLocaleDateString()}</span>}
                {profile.bloodType && (
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {profile.bloodType}</span>
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
        {profile?.emergencyContactName && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Emergency Contact: {profile.emergencyContactName}</p>
              <p className="text-xs text-red-600">{profile.emergencyContactPhone} ({profile.emergencyContactRelation})</p>
            </div>
          </div>
        )}

        {/* Chronic Diseases */}
        {profile?.chronicDiseases?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2">
              {profile.chronicDiseases.map((d: string) => (
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
                <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Pill className={`w-4 h-4 mt-0.5 ${m.isCurrent ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.name}
                        {m.isCurrent && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}
                      </p>
                      {m.dosage && <p className="text-xs text-gray-500">{m.dosage} {m.frequency && `- ${m.frequency}`}</p>}
                      {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                    </div>
                  </div>
                  <DocumentsList 
                    documents={m.documents || []} 
                    imageUrls={imageUrls} 
                    onDownload={handleDownload} 
                    onView={handleView}
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Lab Tests */}
        {data?.labTests?.length > 0 && (
          <Section title={`Lab Tests (${data.labTests.length})`} icon={FlaskConical} color="text-amber-700">
            <div className="space-y-3">
              {data.labTests.map((t: any) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.testName}</p>
                      <p className="text-xs text-gray-500">{t.testDate ? new Date(t.testDate).toLocaleDateString() : ''}</p>
                      {t.doctorNotes && <p className="text-xs text-gray-400 mt-1">{t.doctorNotes}</p>}
                    </div>
                    {t.results && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{t.results}</p>
                        {t.normalRange && <p className="text-[10px] text-gray-400">Normal: {t.normalRange}</p>}
                      </div>
                    )}
                  </div>
                  <DocumentsList 
                    documents={t.documents || []} 
                    imageUrls={imageUrls} 
                    onDownload={handleDownload} 
                    onView={handleView}
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Radiology */}
        {data?.radiologyScans?.length > 0 && (
          <Section title={`Radiology (${data.radiologyScans.length})`} icon={ScanLine} color="text-purple-700">
            <div className="space-y-3">
              {data.radiologyScans.map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{s.scanType} {s.bodyPart && `- ${s.bodyPart}`}</p>
                  <p className="text-xs text-gray-500">{s.scanDate ? new Date(s.scanDate).toLocaleDateString() : ''}</p>
                  {s.description && <p className="text-xs text-gray-600 mt-1">{s.description}</p>}
                  {s.doctorNotes && <p className="text-xs text-purple-600 mt-1">Doctor: {s.doctorNotes}</p>}
                  <DocumentsList 
                    documents={s.documents || []} 
                    imageUrls={imageUrls} 
                    onDownload={handleDownload} 
                    onView={handleView}
                  />
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
                    {d.diagnosisName}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{d.status}</span>
                  </p>
                  {d.diagnosedBy && <p className="text-xs text-gray-500">Dr. {d.diagnosedBy}</p>}
                  {d.diagnosisDate && <p className="text-xs text-gray-400">{new Date(d.diagnosisDate).toLocaleDateString()}</p>}
                  {d.description && <p className="text-xs text-gray-400 mt-1">{d.description}</p>}
                  <DocumentsList 
                    documents={d.documents || []} 
                    imageUrls={imageUrls} 
                    onDownload={handleDownload} 
                    onView={handleView}
                  />
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
                  <p className="text-sm font-medium text-gray-900">{s.surgeryName}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                    {s.hospitalName && <span>{s.hospitalName}</span>}
                    {s.surgeonName && <span>Dr. {s.surgeonName}</span>}
                    {s.surgeryDate && <span>{new Date(s.surgeryDate).toLocaleDateString()}</span>}
                  </div>
                  {s.description && <p className="text-xs text-gray-400 mt-1">{s.description}</p>}
                  <DocumentsList 
                    documents={s.documents || []} 
                    imageUrls={imageUrls} 
                    onDownload={handleDownload} 
                    onView={handleView}
                  />
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
