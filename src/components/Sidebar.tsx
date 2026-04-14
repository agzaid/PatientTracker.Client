import React from 'react';
import {
  LayoutDashboard, User, Pill, FlaskConical, ScanLine, Stethoscope,
  Scissors, Clock, Share2, X, Heart, Shield
} from 'lucide-react';

export type ViewType = 'dashboard' | 'profile' | 'medications' | 'lab_tests' | 'radiology' | 'diagnoses' | 'surgeries' | 'timeline' | 'share';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
  { id: 'profile', label: 'My Profile', icon: User, color: 'text-indigo-600' },
  { id: 'medications', label: 'Medications', icon: Pill, color: 'text-emerald-600' },
  { id: 'lab_tests', label: 'Lab Tests', icon: FlaskConical, color: 'text-amber-600' },
  { id: 'radiology', label: 'Radiology', icon: ScanLine, color: 'text-purple-600' },
  { id: 'diagnoses', label: 'Diagnoses', icon: Stethoscope, color: 'text-rose-600' },
  { id: 'surgeries', label: 'Surgeries', icon: Scissors, color: 'text-cyan-600' },
  { id: 'timeline', label: 'Timeline', icon: Clock, color: 'text-orange-600' },
  { id: 'share', label: 'Share Profile', icon: Share2, color: 'text-teal-600' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">HealthProfile</h1>
                <p className="text-[10px] text-gray-400 font-medium">PATIENT PORTAL</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-600' : item.color}`} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">HIPAA Compliant</span>
            </div>
            <p className="text-[10px] text-blue-600/70">Your data is encrypted and secure</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
