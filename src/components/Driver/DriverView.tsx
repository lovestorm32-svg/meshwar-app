import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Power,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  MessageSquare,
  Phone,
  Wallet,
  TrendingUp,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Send,
  User,
  Star,
  Globe,
  Menu,
  X,
  Upload,
  Copy,
  Zap,
  CreditCard,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';
import { GoogleMapView } from '../Map/GoogleMapView';
import { Driver, Trip, NegotiationSettings, PaymentTopupMethod } from '../../types';
import { meshwarStore } from '../../services/storage';

interface DriverViewProps {
  apiKey: string;
}

export const DriverView: React.FC<DriverViewProps> = ({ apiKey }) => {
  const [driver, setDriver] = useState<Driver>(meshwarStore.getCurrentDriver());
  const [driversList, setDriversList] = useState<Driver[]>(meshwarStore.getDrivers());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(meshwarStore.getActiveTrip());
  const [settings, setSettings] = useState<NegotiationSettings>(meshwarStore.getSettings());
  const [counterPrice, setCounterPrice] = useState<number>(0);
  
  // Side Drawer state (أزرار المستندات والمحفظة والإعدادات في قائمة جانبية)
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<'documents' | 'wallet' | 'settings' | 'vehicle'>('documents');

  const [chatInput, setChatInput] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);

  // Driver rating client modal (post trip)
  const [showDriverRatingModal, setShowDriverRatingModal] = useState(false);
  const [clientRatingStars, setClientRatingStars] = useState(5);
  const [clientFeedbackText, setClientFeedbackText] = useState('');

  // Driver personal settings state
  const [driverAutoAccept, setDriverAutoAccept] = useState(false);
  const [driverMaxDistance, setDriverMaxDistance] = useState(5);
  const [driverSoundAlerts, setDriverSoundAlerts] = useState(true);

  // Topup Balance Modal states (شحن الرصيد فوري أو محفظة إلكترونية ويكون التعديل متاح)
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupMethod, setTopupMethod] = useState<PaymentTopupMethod>('fawry');
  const [topupAmount, setTopupAmount] = useState<number>(100);
  const [fawryPayCode, setFawryPayCode] = useState<string>('842 195 733');
  const [senderWalletPhone, setSenderWalletPhone] = useState<string>('01012345678');
  const [transactionRefNumber, setTransactionRefNumber] = useState<string>('');
  const [copiedTopupText, setCopiedTopupText] = useState<string | null>(null);

  // Sync state with store
  useEffect(() => {
    const unsub = meshwarStore.subscribe(() => {
      setDriver(meshwarStore.getCurrentDriver());
      setDriversList(meshwarStore.getDrivers());
      const trip = meshwarStore.getActiveTrip();
      setActiveTrip(trip);
      setSettings(meshwarStore.getSettings());
      if (trip?.status === 'completed' && !trip.driverRating) {
        setShowDriverRatingModal(true);
      }
    });
    return unsub;
  }, []);

  // When a new negotiating trip appears, set default counter price to client offer + 5
  useEffect(() => {
    if (activeTrip && activeTrip.status === 'negotiating') {
      const maxAllowed = Math.round(activeTrip.clientInitialPrice * 1.6);
      const defaultCounter = Math.min(maxAllowed, activeTrip.clientInitialPrice + 5);
      setCounterPrice(defaultCounter);
    }
  }, [activeTrip?.id, activeTrip?.status]);

  // Toggle Driver Online / Offline
  const handleToggleOnline = () => {
    if (driver.status === 'pending_verification') {
      alert('حسابك قيد المراجعة والتدقيق من الإدارة. الموافقة على الكابتن تتم بعد قبول المستندات والتفعيل من الإدارة.');
      return;
    }
    const nextState = !driver.isOnline;
    meshwarStore.toggleDriverOnline(driver.id, nextState);
    setDriver((prev) => ({ ...prev, isOnline: nextState }));
  };

  // Driver accepts client's exact offer
  const handleAcceptClientPrice = () => {
    if (!activeTrip) return;
    const bid = meshwarStore.submitDriverBid(activeTrip.id, driver, activeTrip.clientInitialPrice);
    if (bid) {
      meshwarStore.acceptBid(activeTrip.id, bid.id);
    }
  };

  // Driver submits counter offer
  const handleSubmitCounterOffer = () => {
    if (!activeTrip) return;
    meshwarStore.submitDriverBid(activeTrip.id, driver, counterPrice);
  };

  // Advance trip status
  const handleAdvanceStatus = (
    nextStatus: 'driver_arriving' | 'arrived_pickup' | 'in_trip' | 'completed'
  ) => {
    if (!activeTrip) return;
    meshwarStore.advanceTripStatus(activeTrip.id, nextStatus);
    if (nextStatus === 'completed') {
      setShowDriverRatingModal(true);
    }
  };

  // Submit Driver Rating for Client
  const handleSubmitDriverRating = () => {
    if (!activeTrip) return;
    meshwarStore.rateClientByDriver(activeTrip.id, clientRatingStars, clientFeedbackText);
    setShowDriverRatingModal(false);
  };

  // زر فتح الخرائط الكابتن - توجيه وملاحة مباشرة لخرائط جوجل Turn-by-Turn
  const handleCaptainDirectGoogleNavigation = (customDest?: { lat: number; lng: number }) => {
    let dest = customDest;
    if (!dest) {
      if (activeTrip) {
        dest = (activeTrip.status === 'driver_arriving' || activeTrip.status === 'offer_accepted')
          ? activeTrip.pickup
          : activeTrip.dropoff;
      } else if (driver.currentLocation) {
        dest = driver.currentLocation;
      } else {
        dest = { lat: 31.2653, lng: 32.3019 };
      }
    }
    // Using dir_action=navigate launches Google Maps directly in turn-by-turn navigation mode
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving&dir_action=navigate`;
    window.open(url, '_blank');
  };

  // Handle Top-up balance via Fawry or E-Wallet (شحن الرصيد فوري أو محفظة إلكترونية ويكون التعديل متاح)
  const handleConfirmTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح لشحن الرصيد');
      return;
    }

    const success = meshwarStore.topupDriverBalance(driver.id, topupAmount, topupMethod, {
      fawryCode: fawryPayCode,
      senderPhone: senderWalletPhone,
      referenceNumber: transactionRefNumber || (topupMethod === 'fawry' ? fawryPayCode : undefined),
    });

    if (success) {
      setShowTopupModal(false);
      alert(`تم شحن رصيد المحفظة بمبلغ ${topupAmount} ج.م بنجاح! رصيدك المحدث: ${(driver.walletBalance + topupAmount).toFixed(2)} ج.م`);
    }
  };

  const handleCopyTopup = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTopupText(id);
    setTimeout(() => setCopiedTopupText(null), 2000);
  };

  // Check if driver has an existing bid on active trip
  const myExistingBid = useMemo(() => {
    if (!activeTrip || activeTrip.status !== 'negotiating') return null;
    return activeTrip.bids.find((b) => b.driverId === driver.id) || null;
  }, [activeTrip, driver.id]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-100 text-slate-800 overflow-hidden">
      {/* Control Panel Sidebar - White and Grey theme */}
      <div className="w-full md:w-[440px] lg:w-[480px] h-[55vh] md:h-full flex flex-col bg-white border-b md:border-b-0 md:border-l border-slate-200 z-20 shadow-xl overflow-y-auto">
        {/* Driver Header */}
        <div className="p-4 border-b border-slate-200 bg-white/95 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-11 h-11 rounded-full border-2 border-slate-300 object-cover shadow-sm"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  driver.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{driver.name}</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold">
                  {driver.rating} ★
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {driver.vehicle.nameAr} • <span className="font-mono font-bold text-slate-700">{driver.vehicle.plateNumber}</span>
              </div>
            </div>
          </div>

          {/* Controls: Commission Balance Badge + Direct Google Maps Button + Side Drawer Button + Online/Offline Toggle */}
          <div className="flex items-center gap-2">
            {/* Quick Commission Balance indicator */}
            <button
              type="button"
              onClick={() => {
                setDrawerSection('wallet');
                setIsSideDrawerOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center gap-1.5 shadow-2xs"
              title="رصيد سداد عمولة المنصة - اضغط للشحن فوري أو محفظة"
            >
              <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">عمولة:</span>
              <span className="font-mono font-black text-xs text-emerald-700">{driver.walletBalance.toFixed(0)} ج.م</span>
            </button>

            {/* Direct Google Maps Turn-by-Turn Button (زر فتح الخرائط الكابتن توجيه مباشر لخرائط جوجل) */}
            <button
              type="button"
              onClick={() => handleCaptainDirectGoogleNavigation()}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition flex items-center gap-1.5 shadow-xs text-xs font-bold"
              title="توجيه وملاحة مباشرة لخرائط جوجل Turn-by-Turn"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">توجيه خرائط جوجل</span>
              <span>🧭</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSideDrawerOpen(true)}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition flex items-center gap-1.5 shadow-xs"
              title="القائمة الجانبية (المستندات، رصيد العمولة، الإعدادات)"
            >
              <Menu className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold hidden sm:inline">القائمة</span>
            </button>

            {/* Online/Offline Toggle Button */}
            <button
              type="button"
              onClick={handleToggleOnline}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                driver.status === 'pending_verification'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : driver.isOnline
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {driver.status === 'pending_verification'
                  ? 'قيد الفحص'
                  : driver.isOnline
                  ? 'متصل للعمل'
                  : 'غير متصل'}
              </span>
            </button>
          </div>
        </div>

        {/* WAITING FOR TRIPS & REQUESTS (للكابتن في الواجهة فقط انتظار الرحلات) */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          {/* Status banner when pending verification */}
          {driver.status === 'pending_verification' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 mb-3 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>حسابك قيد المراجعة والتدقيق من الإدارة ⏳</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                الموافقة على الكابتن تتم بعد مراجعة المستندات والتفعيل من الإدارة. تم استلام ملفك ومستنداتك بنجاح، ويمكنك متابعة حالتها ورفع النواقص من القائمة الجانبية.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDrawerSection('documents');
                  setIsSideDrawerOpen(true);
                }}
                className="text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5 transition shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>فتح قائمة المستندات الجانبية 📂</span>
              </button>
            </div>
          )}
            {/* Condition 1: Driver is Offline */}
            {!driver.isOnline ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                  <Power className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">أنت غير متصل الآن</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  اضغط على زر &quot;متصل للعمل&quot; بالأعلى لبدء استقبال طلبات الركاب القريبة والتفاوض على الأسعار فوراً.
                </p>
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md"
                >
                  الاتصال الآن واستقبال الرحلات
                </button>
              </div>
            ) : !activeTrip ? (
              /* Condition 2: Online but no active requests in range (Globe Animation & 5km radius) */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  {/* Glowing Orbit Rings */}
                  <div className="w-32 h-32 rounded-full border-2 border-emerald-500/20 animate-ping absolute inset-0" />
                  <div className="w-28 h-28 rounded-full border border-dashed border-slate-300 animate-spin absolute" style={{ animationDuration: '14s' }} />

                  {/* 3D-styled Globe in clean white and grey aesthetic */}
                  <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-slate-300 shadow-md flex items-center justify-center relative overflow-hidden group">
                    <Globe className="w-14 h-14 text-emerald-600 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center justify-center gap-1.5">
                    <span>جاري البحث عن طلبات الركاب</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    الكورة الأرضية تبحث لحظياً عن الركاب في بورسعيد في محيطك الجغرافي.
                  </p>
                </div>

                <div className="text-[11px] text-slate-700 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-300 font-bold flex items-center gap-1.5 shadow-xs">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>نطاق البحث الجغرافي: ٥ كيلو حول موقعك</span>
                </div>
              </div>
            ) : activeTrip.status === 'negotiating' ? (
              /* Condition 3: Trip is open for negotiation / bidding! */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      طلب مشوار جديد
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      يبعد {activeTrip.distanceKm} كم
                    </span>
                  </div>

                  {/* Client info */}
                  <div className="flex items-center gap-3 py-1">
                    <img
                      src={activeTrip.clientAvatar}
                      alt={activeTrip.clientName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{activeTrip.clientName}</div>
                      <div className="text-[11px] text-slate-500">
                        وسيلة المشوار: <strong className="text-slate-800">{activeTrip.vehicleCategory}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Client Notes & Instructions to Captain (تعليمات وملاحظات العميل) */}
                  {activeTrip.clientNotes && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 text-right">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>تعليمات وملاحظات العميل:</span>
                      </div>
                      <p className="text-slate-800 text-xs leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-100">
                        {activeTrip.clientNotes}
                      </p>
                    </div>
                  )}

                  {/* Route points */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-500 block">نقطة الركوب:</span>
                        <span className="font-semibold text-slate-800">{activeTrip.pickup.name}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-500 block">وجهة الوصول:</span>
                        <span className="font-semibold text-slate-800">{activeTrip.dropoff.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer's Proposed Price */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500">سعر العميل المقترح:</div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        {activeTrip.clientInitialPrice} <span className="text-xs font-normal text-slate-500">ج.م</span>
                      </div>
                    </div>
                    <div className="text-left text-[11px] text-slate-500">
                      صافي أرباحك التقديرية:{' '}
                      <span className="font-bold text-slate-800 font-mono">
                        {Math.round(activeTrip.clientInitialPrice * 0.88)} ج.م
                      </span>
                    </div>
                  </div>

                  {/* My Status on this Bid */}
                  {myExistingBid && (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center justify-between">
                      <span>عرضك المقدم حالياً:</span>
                      <strong className="font-mono text-sm">{myExistingBid.proposedPrice} ج.م (في انتظار العميل)</strong>
                    </div>
                  )}

                  {/* Actions: Accept Client Price OR Offer Counter Price */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAcceptClientPrice}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>قبول سعر العميل فوراً ({activeTrip.clientInitialPrice} ج.م)</span>
                    </button>

                    {/* Counter Offer Box with hidden formulas and clean controls */}
                    {(() => {
                      const minAllowedCounter = Math.max(20, activeTrip.clientInitialPrice);
                      const maxNegotiationPct = settings.maxNegotiationPercent || 60;
                      const maxAllowedCounter = Math.round(activeTrip.clientInitialPrice * (1 + maxNegotiationPct / 100));
                      const canDecreaseCounter = counterPrice > minAllowedCounter;
                      const canIncreaseCounter = counterPrice < maxAllowedCounter;

                      const preset1 = Math.min(maxAllowedCounter, activeTrip.clientInitialPrice + 5);
                      const preset2 = Math.min(maxAllowedCounter, activeTrip.clientInitialPrice + 10);
                      const preset3 = Math.min(maxAllowedCounter, activeTrip.clientInitialPrice + 15);

                      return (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>قدّم عرض سعر بديل:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!canDecreaseCounter}
                              onClick={() => setCounterPrice((prev) => Math.max(minAllowedCounter, prev - 5))}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                                canDecreaseCounter
                                  ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs'
                                  : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                              }`}
                              title="تقليل السعر"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="flex-1 text-center font-mono font-bold text-lg text-slate-900">
                              {counterPrice} ج.م
                            </div>
                            <button
                              type="button"
                              disabled={!canIncreaseCounter}
                              onClick={() => setCounterPrice((prev) => Math.min(maxAllowedCounter, prev + 5))}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                                canIncreaseCounter
                                  ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs'
                                  : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                              }`}
                              title="زيادة السعر"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex gap-2">
                            {[
                              { label: '+5 ج.م', val: preset1 },
                              { label: '+10 ج.م', val: preset2 },
                              { label: '+15 ج.م', val: preset3 },
                            ].map((btn, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setCounterPrice(btn.val)}
                                className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition ${
                                  counterPrice === btn.val
                                    ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleSubmitCounterOffer}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
                          >
                            إرسال عرضي ({counterPrice} ج.م) للعميل
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              /* Condition 4: Driver has accepted trip and it's active! */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-md">
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeTrip.clientAvatar}
                        alt={activeTrip.clientName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{activeTrip.clientName}</div>
                        <div className="text-[11px] text-slate-500">الراكب متواجد في نقطة الركوب</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500">الأجرة المتفق عليها</div>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {activeTrip.agreedPrice} <span className="text-xs font-normal text-slate-500">ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Notes & Instructions during trip */}
                  {activeTrip.clientNotes && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 text-right">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>تعليمات وملاحظات العميل:</span>
                      </div>
                      <p className="text-slate-800 text-xs leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-100">
                        {activeTrip.clientNotes}
                      </p>
                    </div>
                  )}

                  {/* Trip Stage Controller (The 4 sequential driver actions) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800">
                      مرحلة الرحلة الحالية:{' '}
                      <span className="text-emerald-700">
                        {activeTrip.status === 'offer_accepted' || activeTrip.status === 'driver_arriving'
                          ? 'في الطريق لنقطة الركوب'
                          : activeTrip.status === 'arrived_pickup'
                          ? 'وصلت لموقع العميل'
                          : 'المشوار جارٍ إلى الوجهة'}
                      </span>
                    </div>

                    {/* Step buttons */}
                    {activeTrip.status === 'offer_accepted' || activeTrip.status === 'driver_arriving' ? (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus('arrived_pickup')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-xs"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>أنا وصلت لنقطة الركوب (إشعار العميل)</span>
                      </button>
                    ) : activeTrip.status === 'arrived_pickup' ? (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus('in_trip')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Car className="w-4 h-4" />
                        <span>ركب العميل - بدء المشوار الآن</span>
                      </button>
                    ) : activeTrip.status === 'in_trip' ? (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus('completed')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>وصلنا للوجهة - إنهاء المشوار واستلام الأجرة كاش</span>
                      </button>
                    ) : null}
                  </div>

                  {/* Driver Actions: Call Client & Chat */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${activeTrip.clientPhone}`}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>اتصال بالعميل</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowChatModal(true)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      <span>محادثة فورية</span>
                    </button>

                    {/* زر فتح الخرائط الكابتن - توجيه مباشر لخرائط جوجل Turn-by-Turn */}
                    <button
                      type="button"
                      onClick={() => handleCaptainDirectGoogleNavigation()}
                      className="col-span-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 transition active:scale-98"
                    >
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span>
                        {activeTrip.status === 'driver_arriving' || activeTrip.status === 'offer_accepted'
                          ? 'توجيه مباشر لخرائط جوجل (ملاحة للراكب 📍)'
                          : 'توجيه مباشر لخرائط جوجل (ملاحة لوجهة الوصول 🏁)'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Main Map View for Driver */}
      <div className="flex-1 h-[45vh] md:h-full relative overflow-hidden bg-slate-100">
        <GoogleMapView
          apiKey={apiKey}
          pickup={activeTrip?.pickup}
          dropoff={activeTrip?.dropoff}
          drivers={driversList}
          activeTrip={activeTrip}
          className="w-full h-full"
        />
      </div>

      {/* Modal: In-Trip Chat (Driver Side) */}
      {showChatModal && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md h-[600px] max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeTrip.clientAvatar}
                  alt={activeTrip.clientName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{activeTrip.clientName}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">الراكب في الرحلة</div>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets for Driver */}
            <div className="p-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[11px]">
              {['أنا في الطريق إليك الآن', 'وصلت لمكان الركوب منتظرك', 'تمام يا فندم'].map(
                (quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      meshwarStore.sendChatMessage(activeTrip.id, driver.id, 'driver', quick);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap shadow-xs"
                  >
                    {quick}
                  </button>
                )
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {activeTrip.messages.map((msg) => {
                const isMe = msg.senderType === 'driver';
                const isSys = msg.senderType === 'system';

                if (isSys) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs ${
                        isMe
                          ? 'bg-slate-800 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim() || !activeTrip) return;
                meshwarStore.sendChatMessage(activeTrip.id, driver.id, 'driver', chatInput.trim());
                setChatInput('');
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب ردك للعميل..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-white"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition shadow-xs"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Modal: Top-up Driver Balance (شحن الرصيد فوري أو محفظة إلكترونية ويكون التعديل متاح) */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowTopupModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 font-bold p-1 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">شحن رصيد الكابتن</h3>
                <p className="text-xs text-slate-500">اختر طريقة الشحن مع إمكانية تعديل كافة البيانات</p>
              </div>
            </div>

            {/* Topup Method Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setTopupMethod('fawry')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  topupMethod === 'fawry'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⚡ فوري (Fawry Pay)</span>
              </button>

              <button
                type="button"
                onClick={() => setTopupMethod('vodafone_cash')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  topupMethod !== 'fawry'
                    ? 'bg-slate-900 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📱 محفظة إلكترونية</span>
              </button>
            </div>

            <form onSubmit={handleConfirmTopup} className="space-y-4 pt-1">
              {/* Editable Amount Section (ويكون التعديل متاح) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex justify-between">
                  <span>المبلغ المراد شحنه (ج.م)</span>
                  <span className="text-emerald-700 font-mono font-bold">{topupAmount} ج.م</span>
                </label>
                
                {/* Preset quick buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition border ${
                        topupAmount === amt
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {amt} ج.م
                    </button>
                  ))}
                </div>

                {/* Custom Editable Amount Input */}
                <div className="relative">
                  <input
                    type="number"
                    min={20}
                    max={10000}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(+e.target.value)}
                    placeholder="اكتب أي مبلغ مخصص..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-500 focus:bg-white"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">جنية مصري</span>
                </div>
              </div>

              {/* METHOD 1: FAWRY PAY (فوري) */}
              {topupMethod === 'fawry' && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span>كود خدمة فوري:</span>
                      <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-slate-900">788</strong>
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                      صالح لمدة 24 ساعة
                    </span>
                  </div>

                  {/* Fawry Pay Code Box with Copy */}
                  <div className="p-3 bg-white rounded-xl border border-amber-300 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500">رقم الدفع المرجعي لدى فوري (Fawry Reference)</div>
                      <div className="text-lg font-black font-mono text-slate-900 tracking-wider">
                        {fawryPayCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTopup(fawryPayCode.replace(/\s+/g, ''), 'fawry_code')}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition"
                    >
                      {copiedTopupText === 'fawry_code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTopupText === 'fawry_code' ? 'تم النسخ' : 'نسخ الكود'}</span>
                    </button>
                  </div>

                  {/* Editable Fawry Code or Receipt Reference */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      رقم إيصال فوري أو مرجع العملية (تعديل متاح)
                    </label>
                    <input
                      type="text"
                      value={transactionRefNumber}
                      onChange={(e) => setTransactionRefNumber(e.target.value)}
                      placeholder="مثلاً: FAW-98231 أو رقم الإيصال..."
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    توجه لأي منفذ أو ماكينة فوري، اختر المعاملات المالية كود <strong>788</strong> (مشوار)، وأدخل كود الدفع <strong>{fawryPayCode}</strong>.
                  </p>
                </div>
              )}

              {/* METHOD 2: E-WALLETS (محافظ إلكترونية: فودافون كاش / إنستاباي / أورنج / اتصالات / وي) */}
              {topupMethod !== 'fawry' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-3">
                  {/* Select E-Wallet Provider */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      اختر المحفظة الإلكترونية المحول منها:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      {[
                        { id: 'vodafone_cash', name: 'فودافون كاش' },
                        { id: 'instapay', name: 'إنستاباي InstaPay' },
                        { id: 'orange_cash', name: 'أورنج كاش' },
                        { id: 'etisalat_cash', name: 'إي آند اتصالات' },
                        { id: 'we_pay', name: 'وي باي WE' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setTopupMethod(w.id as any)}
                          className={`py-2 px-1 rounded-xl font-bold transition border text-center ${
                            topupMethod === w.id
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Official Receiver Number */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500">رقم المحفظة المعتمد للتحويل (حساب شركة مشوار)</div>
                      <div className="text-base font-bold font-mono text-emerald-700 tracking-wider">
                        010 2345 6789
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyTopup('01023456789', 'wallet_phone')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition border border-emerald-200"
                    >
                      {copiedTopupText === 'wallet_phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTopupText === 'wallet_phone' ? 'تم النسخ' : 'نسخ الرقم'}</span>
                    </button>
                  </div>

                  {/* Sender's Phone (Editable) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      رقم محفظتك التي حولت منها (تعديل متاح):
                    </label>
                    <input
                      type="tel"
                      value={senderWalletPhone}
                      onChange={(e) => setSenderWalletPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-500"
                      required
                    />
                  </div>

                  {/* Reference ID (Editable) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      رقم العملية أو المرجع من رسالة التحويل (تعديل متاح):
                    </label>
                    <input
                      type="text"
                      value={transactionRefNumber}
                      onChange={(e) => setTransactionRefNumber(e.target.value)}
                      placeholder="مثلاً: REF-928174"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit Top-up Button */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد شحن الرصيد بمبلغ {topupAmount} ج.م فوراً ✅</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Driver Rates Client (نظام تقييم العميل بعد إنهاء المشوار) */}
      {showDriverRatingModal && activeTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">اكتمل المشوار بنجاح!</h3>
              <p className="text-xs text-slate-500 mt-1">
                كيف كانت تجربتك مع الراكب <strong className="text-slate-800">{activeTrip.clientName}</strong>؟
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setClientRatingStars(s)}
                  className={`p-1.5 transition transform hover:scale-110 ${
                    s <= clientRatingStars ? 'text-amber-500' : 'text-slate-300'
                  }`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
            </div>

            {/* Optional Comment */}
            <div>
              <textarea
                value={clientFeedbackText}
                onChange={(e) => setClientFeedbackText(e.target.value)}
                placeholder="اكتب ملاحظة أو تقييم اختياري عن الراكب..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitDriverRating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
            >
              إرسال تقييم الراكب ومتابعة العمل
            </button>
          </div>
        </div>
      )}

      {/* SIDE DRAWER (أزرار المستندات والمحفظة والإعدادات في قائمة جانبية للكابتن) */}
      {isSideDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          {/* Overlay Click to Close */}
          <div className="flex-1" onClick={() => setIsSideDrawerOpen(false)} />

          {/* Drawer Body Panel */}
          <div className="w-full sm:w-[460px] bg-white h-full shadow-2xl flex flex-col border-r border-slate-200 z-50 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Menu className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">القائمة الجانبية للكابتن</h3>
                  <p className="text-[10px] text-slate-500">المستندات القانونية والمحفظة والإعدادات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSideDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-nav tabs within Drawer */}
            <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDrawerSection('documents')}
                className={`flex-1 py-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                  drawerSection === 'documents'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>المستندات</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerSection('wallet')}
                className={`flex-1 py-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                  drawerSection === 'wallet'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>المحفظة</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerSection('settings')}
                className={`flex-1 py-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                  drawerSection === 'settings'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>الإعدادات</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerSection('vehicle')}
                className={`flex-1 py-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                  drawerSection === 'vehicle'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>المركبة</span>
              </button>
            </div>

            {/* Drawer Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* SECTION 1: DOCUMENTS (المستندات القانونية وقبول المستندات) */}
              {drawerSection === 'documents' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>حالة اعتماد وتفعيل الحساب</span>
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          driver.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {driver.status === 'active' ? 'معتمد ومفعل للعمل ✅' : 'قيد المراجعة والتدقيق ⏳'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      الموافقة على الكابتن تتم بعد قبول المستندات والتفعيل من الإدارة. يتم تدقيق بطاقة الرقم القومي ورخص القيادة والسيارة والفيش الجنائي.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 flex justify-between items-center">
                      <span>أزرار وقائمة المستندات المرفوعة ({driver.documents.length})</span>
                      <span className="text-[10px] text-slate-500">تدقيق إداري</span>
                    </div>

                    {driver.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{doc.titleAr}</div>
                            <div className="text-[10px] text-slate-500">تاريخ الرفع: {doc.uploadedAt}</div>
                            {doc.rejectionReason && (
                              <div className="text-[10px] text-rose-600 mt-0.5">سبب الرفض: {doc.rejectionReason}</div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            doc.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : doc.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {doc.status === 'approved' ? 'معتمد ✅' : doc.status === 'pending' ? 'قيد الفحص ⏳' : 'مرفوض ❌'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Upload new document button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        alert('تم استلام المستند بنجاح وسيتم تدقيقه من إدارة مشوار فوراً!');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>رفع أو تجديد مستند ورخصة 📤</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 2: WALLET - رصيد سداد وخصم عمولة المنصة فقط */}
              {drawerSection === 'wallet' && (
                <div className="space-y-4">
                  {/* Wallet Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">رصيد سداد عمولة المنصة</span>
                        <span className="text-[10px] text-slate-500">الرصيد المخصوم منه عمولة التطبيق للمشاوير</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-300 font-bold">
                        كابتن مشوار
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500">رصيد العمولة المتاح:</div>
                        <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                          {driver.walletBalance.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 block mb-1">
                          جاهز لاستقبال الطلبات ✅
                        </span>
                        <span className="text-[10px] text-slate-400">مشاوير كاش في اليد</span>
                      </div>
                    </div>

                    {/* Cash Notice & Commission Explanation */}
                    <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                        <span>💡 نظام التحصيل المباشر والعمولة:</span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        جميع مبالغ الرحلات يستلمها الكابتن <strong className="text-slate-900">نقداً بالكامل (كاش)</strong> في يده من الراكب فور الوصول. لا يوجد سحب أرباح لأن أموالك في جيبك لحظياً. يقتصر هذا الرصيد على سداد عمولة المنصة المخصومة تلقائياً.
                      </p>
                    </div>

                    {/* Single Prominent Recharge Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowTopupModal(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-98"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>+ شحن رصيد العمولة (فوري / محفظة إلكترونية)</span>
                      </button>
                    </div>
                  </div>

                  {/* Earnings Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500">مشاوير مكتملة</div>
                      <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{driver.totalTrips}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500">نسبة القبول</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1 font-mono">{driver.acceptanceRate}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500">نسبة الإلغاء</div>
                      <div className="text-sm font-bold text-amber-700 mt-1 font-mono">{driver.cancellationRate}%</div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700">سجل شحن الرصيد وخصم العمولات</div>
                    {meshwarStore
                      .getTransactions()
                      .filter((tx) => tx.userId === driver.id)
                      .slice(0, 5)
                      .map((tx) => (
                        <div key={tx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">{tx.description}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.createdAt.slice(0, 16)}</div>
                          </div>
                          <div className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} ج.م
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: SETTINGS */}
              {drawerSection === 'settings' && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <SettingsIcon className="w-4 h-4 text-slate-700" />
                      <span>إعدادات الكابتن ورحلات العمل</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تخصيص تفضيلات العمل، نطاق استقبال المشاوير، والتنبيهات.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Setting 1: Search Radius */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">نطاق بحث الطلبات الجغرافي</span>
                        <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-xs">
                          {driverMaxDistance} كم
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="15"
                        step="1"
                        value={driverMaxDistance}
                        onChange={(e) => setDriverMaxDistance(+e.target.value)}
                        className="w-full accent-slate-800 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>٢ كم</span>
                        <span className="text-slate-800 font-bold">٥ كم (الموصى به لبورسعيد)</span>
                        <span>١٥ كم</span>
                      </div>
                    </div>

                    {/* Setting 2: Auto Accept */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">قبول فوري للأسعار العادلة</div>
                        <div className="text-[10px] text-slate-500">قبول طلب المشوار تلقائياً إذا وافق سعر العميل السعر المعتمد</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={driverAutoAccept}
                        onChange={(e) => setDriverAutoAccept(e.target.checked)}
                        className="w-4 h-4 accent-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    {/* Setting 3: Sound Alerts */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">تنبيه صوتي للطلبات الجديدة</div>
                        <div className="text-[10px] text-slate-500">تشغيل نغمة عند استقبال مزايدة أو عرض مشوار جديد</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={driverSoundAlerts}
                        onChange={(e) => setDriverSoundAlerts(e.target.checked)}
                        className="w-4 h-4 accent-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: VEHICLE */}
              {drawerSection === 'vehicle' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">بيانات المركبة المسجلة</span>
                    <div className="text-xs text-slate-700 space-y-2 pt-1">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">الموديل:</span>
                        <span className="font-bold">{driver.vehicle.nameAr} ({driver.vehicle.year})</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">رقم اللوحة:</span>
                        <span className="font-mono text-slate-900 font-bold">{driver.vehicle.plateNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">اللون:</span>
                        <span className="font-bold">{driver.vehicle.color}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">الفئة:</span>
                        <span className="font-bold">{driver.vehicle.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
