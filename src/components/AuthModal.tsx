import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, Mail, Lock, User, Heart, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          // Handle API error format
          if (error.errors && Array.isArray(error.errors)) {
            // Validation errors from API
            error.errors.forEach((err: any) => {
              toast.error(err.message || 'Validation error');
            });
          } else if (error.error) {
            // Single error from API
            toast.error(error.error);
          } else {
            toast.error(t('auth.loginFailed'));
          }
        } else {
          toast.success(t('auth.welcomeBack'));
          onClose();
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          // Handle API error format
          if (error.errors && Array.isArray(error.errors)) {
            // Validation errors from API
            error.errors.forEach((err: any) => {
              toast.error(err.message || 'Validation error');
            });
          } else if (error.error) {
            // Single error from API
            toast.error(error.error);
          } else {
            toast.error(t('auth.signupFailed'));
          }
        } else {
          toast.success(t('auth.accountCreated'));
          setMode('login');
        }
      }
    } catch (err) {
      toast.error(t('auth.loginFailed'));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Patient Health Profile</h2>
          </div>
          <p className="text-blue-100 text-sm">
            {mode === 'login' ? t('auth.signInToAccess') : t('auth.createAccount')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('auth.signIn')}
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('auth.signUp')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? t('auth.signIn') : t('auth.signUp')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your health data is encrypted and secure.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
