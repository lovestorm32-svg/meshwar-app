import React from 'react';
import {
  Car,
  User,
  Shield,
  Smartphone,
  Monitor,
  Globe,
  Bell,
  LogIn,
  CheckCircle,
} from 'lucide-react';
import { Language, UserRole } from '../types';

interface NavbarProps {
  currentView: 'client' | 'driver' | 'admin';
  onChangeView: (view: 'client' | 'driver' | 'admin') => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenAuth: () => void;
  activeNegotiationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  isMobileFrame,
  onToggleMobileFrame,
  language,
  onToggleLanguage,
  onOpenAuth,
  activeNegotiationCount,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between z-30 select-none shadow-sm text-slate-800">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-base shadow-md">
            مـ
          </div>
          <span className="font-black text-sm tracking-wide text-slate-900 hidden sm:inline">
            مِشْوَار <span className="text-emerald-600 font-mono text-xs font-normal">Meshwar</span>
          </span>
        </div>

        {/* Main User View Switcher (انضم كعميل / انضم كسائق) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => onChangeView('client')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              currentView === 'client'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>انضم كعميل</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('driver')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 relative ${
              currentView === 'driver'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>انضم كسائق</span>
            {activeNegotiationCount > 0 && currentView !== 'driver' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Mobile Device Frame Toggle (only for client or driver views) */}
        <button
          type="button"
          onClick={onToggleMobileFrame}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
            isMobileFrame
              ? 'bg-emerald-50 border-emerald-500/50 text-emerald-700 font-bold'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title="تبديل محاكي شاشة الهاتف"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isMobileFrame ? 'إطار الموبايل' : 'شاشة كاملة'}
          </span>
        </button>

        {/* Egyptian Phone / Login */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">دخول / OTP</span>
        </button>

        {/* Language switch */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'ar' ? 'English' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
};
