import React from 'react';
import {
  Heart, Shield, Share2, Clock, Pill, FlaskConical, ScanLine, Stethoscope,
  Scissors, ArrowRight, CheckCircle2, Lock, Smartphone, Globe, FileText,
  Activity, Users, Zap
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">HealthProfile</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider">PATIENT PORTAL</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenAuth} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition hidden sm:block">
              Sign In
            </button>
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-100/30 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium mb-6">
                <Shield className="w-3.5 h-3.5" /> HIPAA Compliant & Secure
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Complete
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> Health Profile</span>
                <br />in One Place
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
                Securely manage your medical records, medications, lab results, and more. Share your health history with any clinic instantly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onOpenAuth}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenAuth}
                  className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  Sign In
                </button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free to use</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure</span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:block relative">
              <div className="bg-white rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-100 p-6 relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Health Dashboard</h3>
                    <p className="text-xs text-gray-400">Last updated today</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Medications', count: 5, icon: Pill, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Lab Tests', count: 12, icon: FlaskConical, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Diagnoses', count: 3, icon: Stethoscope, color: 'bg-rose-50 text-rose-600' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 ${s.color.split(' ')[0]}`}>
                      <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]} mb-2`} />
                      <p className="text-xl font-bold text-gray-900">{s.count}</p>
                      <p className="text-[10px] text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Metformin 500mg', type: 'Medication', color: 'bg-emerald-100 text-emerald-700' },
                    { name: 'CBC - Complete Blood Count', type: 'Lab Test', color: 'bg-amber-100 text-amber-700' },
                    { name: 'Chest X-Ray', type: 'Radiology', color: 'bg-purple-100 text-purple-700' },
                  ].map(item => (
                    <div key={item.name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-medium text-gray-700 flex-1">{item.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.color}`}>{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">256-bit Encrypted</p>
                  <p className="text-[10px] text-gray-400">Bank-level security</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Instant Sharing</p>
                  <p className="text-[10px] text-gray-400">Share with any clinic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Manage Your
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> Health Records</span>
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              A comprehensive platform designed to give you full control over your medical history.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Pill, title: 'Medications', desc: 'Track current and past medications with dosage, frequency, and prescription uploads.', color: 'from-emerald-500 to-green-400', bg: 'bg-emerald-50' },
              { icon: FlaskConical, title: 'Lab Tests', desc: 'Record test results with normal ranges, upload reports, and track trends over time.', color: 'from-amber-500 to-yellow-400', bg: 'bg-amber-50' },
              { icon: ScanLine, title: 'Radiology Scans', desc: 'Store X-rays, MRIs, CT scans with images and radiologist notes.', color: 'from-purple-500 to-violet-400', bg: 'bg-purple-50' },
              { icon: Stethoscope, title: 'Diagnoses', desc: 'Maintain a complete list of diagnoses with severity levels and status tracking.', color: 'from-rose-500 to-pink-400', bg: 'bg-rose-50' },
              { icon: Scissors, title: 'Surgeries', desc: 'Document surgical procedures with hospital details and recovery notes.', color: 'from-cyan-500 to-blue-400', bg: 'bg-cyan-50' },
              { icon: Clock, title: 'Timeline View', desc: 'See your complete medical history in a beautiful chronological timeline.', color: 'from-orange-500 to-amber-400', bg: 'bg-orange-50' },
              { icon: Share2, title: 'Clinic Sharing', desc: 'Generate secure, time-limited links to share your records with healthcare providers.', color: 'from-teal-500 to-emerald-400', bg: 'bg-teal-50' },
              { icon: FileText, title: 'File Storage', desc: 'Upload prescriptions, lab reports, and scan images. All organized by category.', color: 'from-indigo-500 to-blue-400', bg: 'bg-indigo-50' },
              { icon: Shield, title: 'Security First', desc: 'End-to-end encryption, private accounts, and HIPAA-compliant data handling.', color: 'from-gray-600 to-gray-500', bg: 'bg-gray-50' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 bg-gradient-to-r ${feature.color} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-gray-600">Three simple steps to take control of your health records</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up in seconds with your email. Your data is encrypted from day one.', icon: Users },
              { step: '02', title: 'Add Your Records', desc: 'Input your medications, lab tests, diagnoses, surgeries, and upload documents.', icon: Activity },
              { step: '03', title: 'Share with Clinics', desc: 'Generate secure links to share your complete health profile with any healthcare provider.', icon: Share2 },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Take Control of Your Health Records Today
              </h2>
              <p className="text-blue-100 max-w-lg mx-auto mb-8">
                Join thousands of patients who manage their complete medical history digitally. Free, secure, and accessible from anywhere.
              </p>
              <button
                onClick={onOpenAuth}
                className="bg-white text-blue-600 px-8 py-3.5 rounded-xl text-sm font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                Get Started for Free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-sm">HealthProfile</span>
              </div>
              <p className="text-xs leading-relaxed">
                Your secure personal medical record system. Manage your health history and share it with any clinic.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Features</h4>
              <ul className="space-y-2 text-xs">
                <li>Medications Tracking</li>
                <li>Lab Test Records</li>
                <li>Radiology Scans</li>
                <li>Diagnosis History</li>
                <li>Surgery Records</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Platform</h4>
              <ul className="space-y-2 text-xs">
                <li>Health Timeline</li>
                <li>Clinic Sharing</li>
                <li>File Storage</li>
                <li>Search & Filter</li>
                <li>Mobile Responsive</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-3">Security</h4>
              <ul className="space-y-2 text-xs">
                <li>End-to-End Encryption</li>
                <li>HIPAA Compliant</li>
                <li>Private Accounts</li>
                <li>Secure Sharing</li>
                <li>Data Ownership</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">Patient Health Profile. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition">Terms of Service</span>
              <span className="hover:text-white cursor-pointer transition">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
