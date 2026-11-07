import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ClientView } from './components/Client/ClientView';
import { DriverView } from './components/Driver/DriverView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthModal } from './components/Auth/AuthModal';
import { Language, Trip } from './types';
import { meshwarStore } from './services/storage';
import {
  Wifi,
  BatteryMedium,
  Signal,
  Smartphone,
  Shield,
  Layers,
  ExternalLink,
  Code2,
  FolderGit2,
  Check,
  X,
  Copy,
} from 'lucide-react';

export default function App() {
  // App Mode: Completely separate between User Application (Client & Driver) and Admin Portal
  const [appMode, setAppMode] = useState<'user_app' | 'admin_app'>('user_app');
  const [userView, setUserView] = useState<'client' | 'driver'>('client');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(meshwarStore.getActiveTrip());
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Google Maps API Key
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBKjd4VPlpAer7m1MYtq2Y2abueppfqU-o';

  // Synchronize active trip & listen for events
  useEffect(() => {
    const unsub = meshwarStore.subscribe(() => {
      const trip = meshwarStore.getActiveTrip();
      setActiveTrip(trip);
    });
    return unsub;
  }, []);

  // Update HTML dir and lang based on language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Show temporary toast notification
  const showToast = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div
      className={`min-h-screen w-full bg-slate-100 text-slate-900 flex flex-col font-sans ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      {/* Top Environment & Multi-App Switcher (فصل البرنامجين لمشروعي GitHub) */}
      <div className="bg-slate-900 text-white px-3 py-1.5 flex flex-wrap items-center justify-between text-xs border-b border-slate-800 z-40 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-emerald-400" />
            <span>مشروعين مستقلين على GitHub</span>
          </span>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setAppMode('user_app')}
              className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 ${
                appMode === 'user_app'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>📱 تطبيق المستخدمين (العميل والكابتن)</span>
            </button>

            <button
              type="button"
              onClick={() => setAppMode('admin_app')}
              className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 ${
                appMode === 'admin_app'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>🏢 المنصة الإدارية والشكاوى (منفصل)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowGithubModal(true)}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-bold transition flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>دليل تقسيم البرنامجين لـ GitHub</span>
          </button>
        </div>
      </div>

      {/* Floating In-App Toast */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* RENDER APP 1: PURE USER & CAPTAIN APPLICATION */}
      {appMode === 'user_app' && (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          {/* User Navbar (Strictly Client & Captain - Zero Admin links) */}
          <Navbar
            currentView={userView}
            onChangeView={(view) => {
              if (view === 'client' || view === 'driver') {
                setUserView(view);
              }
            }}
            isMobileFrame={isMobileFrame}
            onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
            language={language}
            onToggleLanguage={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            onOpenAuth={() => setIsAuthOpen(true)}
            activeNegotiationCount={activeTrip?.status === 'negotiating' ? 1 : 0}
          />

          {/* User App Body */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-100">
            {isMobileFrame ? (
              /* Simulated Smartphone Frame */
              <div className="py-4 px-2 w-full flex items-center justify-center">
                <div className="w-[390px] h-[810px] max-h-[92vh] bg-white border-[10px] border-slate-300 rounded-[48px] shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-slate-200">
                  {/* Phone Speaker Notch & Status Bar */}
                  <div className="h-7 bg-white px-6 flex items-center justify-between text-[11px] text-slate-600 select-none z-30 border-b border-slate-100">
                    <span className="font-mono font-bold text-slate-800">09:41</span>
                    <div className="w-24 h-4 bg-slate-900 rounded-full" />
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <BatteryMedium className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>

                  {/* Mobile View Content */}
                  <div className="flex-1 overflow-hidden relative bg-white">
                    {userView === 'client' ? (
                      <ClientView apiKey={apiKey} />
                    ) : (
                      <DriverView apiKey={apiKey} />
                    )}
                  </div>

                  {/* Bottom Home Indicator Bar */}
                  <div className="h-4 bg-white flex items-center justify-center border-t border-slate-100">
                    <div className="w-32 h-1 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              /* Full Responsive App View */
              <div className="w-full h-full flex-1">
                {userView === 'client' ? (
                  <ClientView apiKey={apiKey} />
                ) : (
                  <DriverView apiKey={apiKey} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER APP 2: STANDALONE ADMINISTRATIVE PORTAL & COMPLAINTS SYSTEM */}
      {appMode === 'admin_app' && (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          <AdminDashboard apiKey={apiKey} />
        </div>
      )}

      {/* Egyptian Phone Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(role) => {
          showToast(`تم تسجيل الدخول بنجاح كـ ${role === 'client' ? 'عميل' : 'كابتن'}!`, 'success');
          if (role === 'driver') setUserView('driver');
          else setUserView('client');
        }}
        initialRole={userView === 'driver' ? 'driver' : 'client'}
      />

      {/* Modal: GitHub Dual Project Separation Guide (دليل فصل البرنامجين على GitHub) */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  دليل إنشاء ورفع البرنامجين كـ مستودعين منفصلين على GitHub 🚀
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تمت هيكلة المنصة لتكون جاهزة تماماً للتقسيم إلى <strong>مشروعين مستقلين على GitHub</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* App 1 Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">📱 المشروع 1: تطبيق المستخدمين</span>
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800 font-mono">
                    meshwar-user-app
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  تطبيق الركاب والكباتن: خريطة بورسعيد، أداة رسم المسارات، الملاحظات، التفاوض العكسي (8 ج.م/كم، تخفيض لـ 6 ج.م بعد 12 كم، أقل مشوار 20 ج.م)، الدفع كاش، رادار الكرة الأرضية 5 كم، وخانة الإعدادات المنفصلة.
                </p>
                <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-1">
                  <div>📁 src/components/Client/</div>
                  <div>📁 src/components/Driver/</div>
                  <div>📁 src/components/Map/</div>
                </div>
              </div>

              {/* App 2 Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-sm">🏢 المشروع 2: المنصة الإدارية</span>
                  <span className="bg-cyan-950 text-cyan-300 text-[10px] px-2 py-0.5 rounded border border-cyan-800 font-mono">
                    meshwar-admin-portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  لوحة التحكم والعمليات: منظومة الشكاوى المتقدمة، تعيين أقسام الشكاوى، تعيين مسؤولي المتابعة وسجل الإجراءات، تدقيق المستندات، تعيين أسماء وصور العملاء، والتحكم الصارم في التسعير.
                </p>
                <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 space-y-1">
                  <div>📁 src/components/Admin/</div>
                  <div>📄 GITHUB_TWO_APPS_GUIDE.md</div>
                </div>
              </div>
            </div>

            {/* Quick Git Commands to Push */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 block">أوامر الرفع المباشرة لـ GitHub:</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 relative">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'git remote add origin-user https://github.com/USER/meshwar-user-app.git\ngit remote add origin-admin https://github.com/USER/meshwar-admin-portal.git',
                      'git_cmd'
                    )
                  }
                  className="absolute top-2.5 left-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedText === 'git_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText === 'git_cmd' ? 'تم النسخ' : 'نسخ الأوامر'}</span>
                </button>
                <div className="text-slate-500 mb-1"># 1. رفع مشروع المستخدمين:</div>
                <div>git push origin-user main</div>
                <div className="text-slate-500 mt-2 mb-1"># 2. رفع مشروع المنصة الإدارية:</div>
                <div>git push origin-admin main</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>تم حفظ الدليل الكامل في ملف: <code className="text-cyan-300">GITHUB_TWO_APPS_GUIDE.md</code></span>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
