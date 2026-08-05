import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'applicant') => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status & Validation States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both your email/username and password.');
      return;
    }

    setIsSubmitting(true);

    // Simulate standard authentication delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg('Successfully logged in! Accessing OBO application form...');
      
      // Auto-trigger success after 1 second
      setTimeout(() => {
        onSuccess('applicant');
        onClose();
        // Reset state
        setLoginEmail('');
        setLoginPassword('');
      }, 1000);
    }, 800);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('You must agree to the eTAYO Terms of Service & Privacy Policy.');
      return;
    }

    setIsSubmitting(true);

    // Simulate standard registration delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg('Account successfully created! Loading application portal...');
      
      // Auto-trigger success after 1.2 seconds
      setTimeout(() => {
        onSuccess('applicant');
        onClose();
        // Reset state
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setAgreeTerms(false);
      }, 1200);
    }, 1000);
  };

  const handleDemoLogin = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg('Logging in as Demo Applicant (Juan)...');
      
      setTimeout(() => {
        onSuccess('applicant');
        onClose();
      }, 800);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs transition-opacity duration-300"
      id="auth-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-blue-100 shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        id="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colorful accent line at the top */}
        <div className="h-2 w-full bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
          title="Close Dialog"
          id="auth-modal-close-btn"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 text-center border-b border-gray-100 bg-blue-50/20">
          <div className="flex justify-center mb-2">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-blue-50 flex items-center">
              <Logo height={38} />
            </div>
          </div>
          <h3 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
            Apply Online Portal
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Please log in or register a free account to file digital building permits and locational clearances.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 p-2 bg-gray-50/50">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-[#0038A8] shadow-xs border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
            }`}
            id="auth-tab-login"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In / Login
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-white text-[#0038A8] shadow-xs border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
            }`}
            id="auth-tab-signup"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Register Account
          </button>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake" id="auth-error-banner">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2" id="auth-success-banner">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms Container */}
        <div className="p-6">
          {activeTab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Email Address or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. juan.delacruz@gmail.com"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="login-email-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="login-password-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0038A8] hover:bg-[#002D86] text-white font-bold py-2.5 rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 text-xs"
                id="login-submit-btn"
              >
                {isSubmitting ? 'Verifying Account...' : 'Sign In & Continue'}
                <LogIn className="h-4 w-4" />
              </button>

              {/* DEMO BYPASS OPTION */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200/85"></div>
                </div>
                <span className="relative px-3 bg-white text-[10px] text-gray-400 font-mono uppercase">
                  Or Demo Access
                </span>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isSubmitting}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 text-xs group"
                id="demo-login-btn"
              >
                <Sparkles className="h-4 w-4 text-[#FCD116] group-hover:animate-bounce" />
                Demo Fast Login (Juan)
              </button>
            </form>
          ) : (
            /* REGISTER/SIGNUP FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full Name (First & Last Name)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="register-name-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. juan.delacruz@example.com"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="register-email-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 09123456789"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="register-phone-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="register-password-input"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0038A8] transition-all duration-150"
                    id="register-confirm-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  id="agree-terms-checkbox"
                  className="mt-0.5 rounded text-[#0038A8] focus:ring-[#0038A8]"
                  disabled={isSubmitting}
                />
                <label htmlFor="agree-terms-checkbox" className="text-[10px] text-gray-500 leading-tight">
                  I agree to the <strong>eTAYO Tomasino Terms of Service</strong> and <strong>Privacy Policy</strong> for Sto. Tomas, Pampanga.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0038A8] hover:bg-[#002D86] text-white font-bold py-2.5 rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 text-xs"
                id="register-submit-btn"
              >
                {isSubmitting ? 'Registering Account...' : 'Create Account & Continue'}
                <UserPlus className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
