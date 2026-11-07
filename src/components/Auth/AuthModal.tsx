import React, { useState } from 'react';
import { Smartphone, CheckCircle, Shield, ArrowRight, UserCheck, Car, User } from 'lucide-react';
import { Client, Driver, UserRole } from '../../types';
import { meshwarStore } from '../../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialRole = 'client' }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('1012345678');
  const [otpCode, setOtpCode] = useState('');
  const [userName, setUserName] = useState('ميدو السعيد');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [isDriverCarMode, setIsDriverCarMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleaned = phoneNumber.replace(/\s+/g, '');
    if (cleaned.length < 9) {
      setErrorMsg('يرجى إدخال رقم هاتف مصري صحيح (مثلاً: 01012345678)');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    // Any 4 or 6 digit code or default 1234
    if (otpCode.length < 4) {
      setErrorMsg('رمز التحقق مكون من 4 أرقام على الأقل');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('profile');
    }, 500);
  };

  const handleCompleteProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('يرجى كتابة اسمك');
      return;
    }

    // Save client or driver to store
    if (selectedRole === 'client') {
      const current = meshwarStore.getCurrentClient();
      const updated: Client = {
        ...current,
        name: userName,
        phone: `+20${phoneNumber}`,
        status: 'active', // الموافقة على العميل تلقائية فورية
      };
      meshwarStore.setCurrentClient(updated);
    } else if (selectedRole === 'driver') {
      const current = meshwarStore.getCurrentDriver();
      const updated: Driver = {
        ...current,
        name: userName,
        phone: `+20${phoneNumber}`,
        status: 'pending_verification', // الموافقة على الكابتن بعد قبول المستندات والتفعيل من الإدارة
        isOnline: false,
      };
      meshwarStore.updateDriver(updated);
      meshwarStore.setCurrentDriverId(updated.id);
    }

    onSuccess(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20 mb-3">
            مـ
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            مشوار <span className="text-emerald-400 text-sm font-normal">Meshwar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">تطبيق النقل الذكي المصري بنظام التفاوض المباشر</p>
        </div>

        {/* Step 1: Phone */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الموبايل المصري
              </label>
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 focus-within:border-emerald-500 overflow-hidden px-3 py-2.5">
                <span className="text-xs font-bold text-emerald-400 pl-2 border-l border-slate-700 flex items-center gap-1">
                  <span>🇪🇬</span> +20
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01012345678"
                  className="w-full bg-transparent text-sm text-white px-3 focus:outline-none placeholder:text-slate-500 font-mono"
                  dir="ltr"
                  autoFocus
                />
                <Smartphone className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ندعم جميع شبكات المحمول المصرية (فودافون، أورنج، إي آند اتصالات، وي).
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>{isSubmitting ? 'جارٍ إرسال الكود...' : 'إرسال رمز التحقق OTP'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <div className="text-center text-[11px] text-slate-500 pt-2 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> بياناتك مؤمنة ومشفرة تماماً وفق معايير الأمان
            </div>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-slate-300 font-medium">أدخل رمز التحقق المرسل إلى:</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5 dir-ltr">
                +20 {phoneNumber}
              </div>
              <div className="mt-2 inline-block bg-emerald-950/60 text-emerald-300 text-[11px] px-3 py-1 rounded-full border border-emerald-800">
                رمز تجريبي سريع: <strong>1234</strong>
              </div>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="1 2 3 4"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 text-center text-2xl tracking-[0.5em] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>{isSubmitting ? 'جارٍ التحقق...' : 'تأكيد الرمز'}</span>
              <CheckCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-xs text-slate-400 hover:text-white py-1"
            >
              تعديل رقم الهاتف
            </button>
          </form>
        )}

        {/* Step 3: Profile & Role Selection */}
        {step === 'profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الاسم بالكامل
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="اسمك الكامل"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                اختر طريقة الانضمام لمنصة مشوار:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between ${
                    selectedRole === 'client'
                      ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <User className="w-6 h-6 text-emerald-400" />
                    <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      موافقة فورية تلقائياً ⚡
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">انضم كعميل</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    طلب مشاوير فوراً والتفاوض المباشر على السعر دون انتظار
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between ${
                    selectedRole === 'driver'
                      ? 'border-amber-500 bg-amber-950/40 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Car className="w-6 h-6 text-amber-400" />
                    <span className="text-[9px] bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      موافقة الإدارة 🛡️
                    </span>
                  </div>
                  <div className="text-sm font-black text-white">انضم كسائق</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    الموافقة بعد تدقيق المستندات والتفعيل من الإدارة
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>
                {selectedRole === 'client' ? 'تأكيد وبدء الاستخدام كعميل' : 'إرسال طلب الانضمام كسائق للمراجعة'}
              </span>
              <UserCheck className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
