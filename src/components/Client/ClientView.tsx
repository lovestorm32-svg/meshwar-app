import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Car,
  Bike,
  Plus,
  Minus,
  Star,
  Phone,
  MessageSquare,
  Shield,
  Clock,
  Send,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  Share2,
  Pencil,
} from 'lucide-react';
import { GoogleMapView } from '../Map/GoogleMapView';
import { Client, Driver, NegotiationSettings, Trip, VehicleCategory } from '../../types';
import { meshwarStore } from '../../services/storage';
import { POPULAR_EGYPTIAN_LOCATIONS } from '../../data/mockData';

interface ClientViewProps {
  apiKey: string;
  onOpenDriverMode?: () => void;
  onOpenAdmin?: () => void;
}

export const ClientView: React.FC<ClientViewProps> = ({ apiKey }) => {
  const [client, setClient] = useState<Client>(meshwarStore.getCurrentClient());
  const [drivers, setDrivers] = useState<Driver[]>(meshwarStore.getDrivers());
  const [activeTrip, setActiveTrip] = useState<Trip | null>(meshwarStore.getActiveTrip());
  const [settings, setSettings] = useState<NegotiationSettings>(meshwarStore.getSettings());

  // Form states for requesting a ride (Oriented to Port Said)
  const [pickup, setPickup] = useState<{ name: string; address: string; lat: number; lng: number }>(
    POPULAR_EGYPTIAN_LOCATIONS[0] // ممشى بورسعيد السياحي وقناة السويس
  );
  const [dropoff, setDropoff] = useState<{ name: string; address: string; lat: number; lng: number }>(
    POPULAR_EGYPTIAN_LOCATIONS[1] // شارع طرح البحر - بورسعيد
  );
  const [vehicleCat, setVehicleCat] = useState<VehicleCategory>('sedan');
  const [clientOfferPrice, setClientOfferPrice] = useState<number>(20);
  const [clientNotes, setClientNotes] = useState<string>(''); // ملاحظات وتعليمات من العميل للكابتن
  const [paymentMethod] = useState<'cash'>('cash'); // الطلبات كاش
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'pickup' | 'dropoff' | null>(null);

  // Drawing Manager (أداة رسم المسارات وتحديد الانطلاق والوجهة بالقلم)
  const [isPenModeActive, setIsPenModeActive] = useState<boolean>(false);
  const [drawingTarget, setDrawingTarget] = useState<'pickup' | 'dropoff'>('pickup');
  const [tempPenCoords, setTempPenCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active trip states
  const [chatInput, setChatInput] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('تأخر الكابتن في الوصول');
  const [activeTab, setActiveTab] = useState<'ride' | 'history'>('ride');

  // Sync with store
  useEffect(() => {
    const unsub = meshwarStore.subscribe(() => {
      setClient(meshwarStore.getCurrentClient());
      setDrivers(meshwarStore.getDrivers());
      setSettings(meshwarStore.getSettings());
      const trip = meshwarStore.getActiveTrip();
      setActiveTrip(trip);
      if (trip?.status === 'completed' && !trip.clientRating) {
        setShowRatingModal(true);
      }
    });
    return unsub;
  }, []);

  // Calculate distance & suggested price
  const estimatedDistanceKm = useMemo(() => {
    const latDiff = pickup.lat - dropoff.lat;
    const lngDiff = pickup.lng - dropoff.lng;
    const degDist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    return Math.max(2.5, +(degDist * 111).toFixed(1));
  }, [pickup, dropoff]);

  const estimatedMinutes = useMemo(() => {
    return Math.round(estimatedDistanceKm * 2.2);
  }, [estimatedDistanceKm]);

  // System suggested fare: 8 EGP/km base (drops to 6 EGP/km if > 12 km), min trip fare 20 EGP
  const systemSuggestedFare = useMemo(() => {
    const effectiveKmRate = estimatedDistanceKm > 12 ? 6.0 : (settings.standardPricePerKm || 8.0);
    const minTrip = settings.minTripFare || 20;

    let multiplier = 1.0;
    let base = 20;
    if (vehicleCat === 'economy') {
      multiplier = 0.95;
      base = 18;
    } else if (vehicleCat === 'sedan') {
      multiplier = 1.1;
      base = 22;
    } else if (vehicleCat === 'motorcycle') {
      multiplier = 0.65;
      base = 15;
    }

    const calculated = base + estimatedDistanceKm * (effectiveKmRate * multiplier);
    return Math.max(minTrip, Math.round(calculated));
  }, [estimatedDistanceKm, vehicleCat, settings]);

  // Keep client initial offer aligned when suggested changes
  useEffect(() => {
    setClientOfferPrice(systemSuggestedFare);
  }, [systemSuggestedFare]);

  // Request ride and start negotiation
  const handleRequestRide = () => {
    const trip = meshwarStore.createTripRequest({
      pickup,
      dropoff,
      distanceKm: estimatedDistanceKm,
      estimatedMinutes,
      vehicleCategory: vehicleCat,
      suggestedSystemPrice: systemSuggestedFare,
      clientInitialPrice: clientOfferPrice,
      paymentMethod,
      clientNotes: clientNotes.trim() || undefined,
    });
    setActiveTrip(trip);
  };

  // Accept a driver's bid
  const handleAcceptBid = (bidId: string) => {
    if (!activeTrip) return;
    meshwarStore.acceptBid(activeTrip.id, bidId);
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTrip) return;
    meshwarStore.sendChatMessage(activeTrip.id, client.id, 'client', chatInput.trim());
    setChatInput('');
  };

  // Cancel ride
  const handleCancelTrip = () => {
    if (!activeTrip) return;
    meshwarStore.advanceTripStatus(activeTrip.id, 'cancelled', cancelReason, 'client');
    setShowCancelModal(false);
  };

  // Submit Rating
  const handleSubmitRating = () => {
    if (!activeTrip) return;
    meshwarStore.rateTrip(activeTrip.id, ratingStars, ratingComment);
    setShowRatingModal(false);
    meshwarStore.setActiveTrip(null);
  };

  // Filtered Egyptian places
  const filteredPlaces = useMemo(() => {
    if (!searchQuery) return POPULAR_EGYPTIAN_LOCATIONS;
    return POPULAR_EGYPTIAN_LOCATIONS.filter(
      (p) => p.name.includes(searchQuery) || p.address.includes(searchQuery)
    );
  }, [searchQuery]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-100 text-slate-800 overflow-hidden">
      {/* Left/Sidebar Panel (Mobile first & Desktop layout) - White and Grey theme */}
      <div className="w-full md:w-[440px] lg:w-[480px] h-[55vh] md:h-full flex flex-col bg-white border-b md:border-b-0 md:border-l border-slate-200 z-20 shadow-xl overflow-y-auto">
        {/* Client Top Header */}
        <div className="p-4 border-b border-slate-200 bg-white/95 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={client.avatar}
              alt={client.name}
              className="w-10 h-10 rounded-full border-2 border-slate-300 object-cover shadow-sm"
            />
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{client.name}</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold">
                  {client.rating} ★
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                حساب العميل • الدفع كاش للكابتن
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab(activeTab === 'history' ? 'ride' : 'history')}
              className={`p-2 rounded-xl transition ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="سجل المشاوير"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Past Trips History */}
        {activeTab === 'history' && (
          <div className="p-4 flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">سجل المشاوير السابقة</h3>
              <button
                onClick={() => setActiveTab('ride')}
                className="text-xs text-emerald-600 hover:underline font-bold"
              >
                العودة لطلب مشوار
              </button>
            </div>

            {meshwarStore.getTrips().length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">لا توجد رحلات سابقة</div>
            ) : (
              meshwarStore.getTrips().map((t) => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-500 font-mono">{t.createdAt.slice(0, 16)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {t.status === 'completed' ? 'مشوار مكتمل' : 'ملغي'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    من: {t.pickup.name}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    إلى: {t.dropoff.name}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500">{t.driverName ? `الكابتن: ${t.driverName}` : 'طلب مباشر'}</span>
                    <span className="font-mono font-bold text-slate-800">{t.agreedPrice || t.clientInitialPrice} ج.م</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Active Ride / Ride Booking Form */}
        {activeTab === 'ride' && (
          <div className="p-4 flex-1 flex flex-col justify-between">
            {/* STATE A: NO ACTIVE TRIP -> BOOKING FORM */}
            {!activeTrip && (
              <div className="space-y-4">
                {/* Pickup & Dropoff Selectors */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative shadow-sm">
                  {/* Pickup */}
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>مكان الانطلاق (نقطة الركوب)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTarget('pickup');
                        setSearchQuery('');
                      }}
                      className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 flex items-center justify-between shadow-xs transition"
                    >
                      <span className="truncate">{pickup.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Dropoff */}
                  <div className="relative pt-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <span>الوجهة المراد الوصول إليها</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTarget('dropoff');
                        setSearchQuery('');
                      }}
                      className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 flex items-center justify-between shadow-xs transition"
                    >
                      <span className="truncate">{dropoff.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Distance & ETA info */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" /> {estimatedDistanceKm} كم
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> حوالي {estimatedMinutes} دقيقة
                    </span>
                    {estimatedDistanceKm > 12 && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        تخفيض المشوار الطويل
                      </span>
                    )}
                  </div>

                  {/* Drawing Manager Controls (رسم الانطلاق والوجهة) */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPenModeActive(true);
                          setDrawingTarget('pickup');
                          setTempPenCoords(pickup);
                        }}
                        className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                          isPenModeActive && drawingTarget === 'pickup'
                            ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                        <span>رسم / تحديد الانطلاق</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPenModeActive(true);
                          setDrawingTarget('dropoff');
                          setTempPenCoords(dropoff);
                        }}
                        className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                          isPenModeActive && drawingTarget === 'dropoff'
                            ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600 fill-current" />
                        <span>رسم / تحديد الوجهة</span>
                      </button>
                    </div>

                    {/* Open in Google Maps navigation */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}&travelmode=driving`;
                        window.open(url, '_blank');
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs group"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-45 transition" />
                      <span>فتح خرائط جوجل لتحديد المسار والملاحة المباشرة 🧭</span>
                    </button>
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block">
                    اختر نوع وسيلة المشوار
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVehicleCat('economy')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                        vehicleCat === 'economy'
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Car className="w-5 h-5 mb-1 text-emerald-600" />
                      <div className="text-xs font-bold">اقتصادي</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">توفير وأمان</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVehicleCat('sedan')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                        vehicleCat === 'sedan'
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Car className="w-5 h-5 mb-1 text-teal-600" />
                      <div className="text-xs font-bold">سيدان مريح</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">تكييف ومساحة</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVehicleCat('motorcycle')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                        vehicleCat === 'motorcycle'
                          ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Bike className="w-5 h-5 mb-1 text-amber-600" />
                      <div className="text-xs font-bold">موتوسيكل</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">أسرع للزحمة</div>
                    </button>
                  </div>
                </div>

                {/* Clean Price Selection Box - Rules (8 EGP/km, min 20, max 60% cap, no below suggested) are strictly enforced in code while explanatory banners are completely hidden */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        سعر المشوار المقترح
                      </div>
                      <div className="text-[11px] text-slate-500">
                        يمكنك تعديل العرض قبل إرسال الطلب
                      </div>
                    </div>
                  </div>

                  {/* Price Controls with strict boundaries enforced silently */}
                  {(() => {
                    const minAllowedPrice = settings.preventBiddingBelowSuggested
                      ? systemSuggestedFare
                      : (settings.minTripFare || 20);
                    const maxPercent = settings.maxNegotiationPercent || 60;
                    const maxAllowedPrice = Math.round(systemSuggestedFare * (1 + maxPercent / 100));

                    const canDecrease = clientOfferPrice > minAllowedPrice;
                    const canIncrease = clientOfferPrice < maxAllowedPrice;

                    const preset1 = systemSuggestedFare;
                    const preset2 = Math.min(maxAllowedPrice, systemSuggestedFare + 5);
                    const preset3 = Math.min(maxAllowedPrice, systemSuggestedFare + 10);
                    const preset4 = Math.min(maxAllowedPrice, systemSuggestedFare + 15);

                    return (
                      <>
                        <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            disabled={!canDecrease}
                            onClick={() => setClientOfferPrice((prev) => Math.max(minAllowedPrice, prev - 5))}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition ${
                              canDecrease
                                ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs active:scale-95'
                                : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                            }`}
                            title="تقليل السعر"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <div className="text-center">
                            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                              {clientOfferPrice} <span className="text-xs font-normal text-slate-500">ج.م</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {clientOfferPrice === systemSuggestedFare ? 'السعر المقترح' : 'سعرك المحدد'}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canIncrease}
                            onClick={() => setClientOfferPrice((prev) => Math.min(maxAllowedPrice, prev + 5))}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition ${
                              canIncrease
                                ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs active:scale-95'
                                : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                            }`}
                            title="زيادة السعر"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Clean Preset Buttons */}
                        <div className="flex gap-2">
                          {[
                            { label: 'المقترح', exact: preset1 },
                            { label: '+5 ج.م', exact: preset2 },
                            { label: '+10 ج.م', exact: preset3 },
                            { label: '+15 ج.م', exact: preset4 },
                          ].map((btn, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setClientOfferPrice(btn.exact)}
                              className={`flex-1 py-1.5 px-1 text-[11px] font-bold rounded-lg border transition ${
                                clientOfferPrice === btn.exact
                                  ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()}

                  {/* Payment Method - Cash Only */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-600 font-semibold">طريقة الدفع:</span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                        <span>كاش فقط (تسليم يدوي للكابتن)</span>
                      </span>
                    </div>
                  </div>

                  {/* Client Notes & Instructions to Captain (خانة كتابة ملاحظات وتعليمات من العميل) */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ملاحظات وتعليمات للكابتن (اختياري)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">تظهر للكابتن مع الطلب</span>
                    </label>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="مثال: أنا منتظرك أمام البنك الأهلي، معايا شنطة سفر، برجاء تشغيل التكييف..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white transition resize-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Request Button */}
                <button
                  type="button"
                  onClick={handleRequestRide}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm py-3.5 rounded-2xl shadow-md transition duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>أطلب مشوار ({clientOfferPrice} ج.م كاش)</span>
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STATE B: NEGOTIATING / BIDDING IN PROGRESS */}
            {activeTrip && activeTrip.status === 'negotiating' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-200 animate-ping absolute" />
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                      <Car className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">جارٍ إرسال طلبك للكباتن القريبين...</h3>
                  <p className="text-xs text-slate-600">
                    عرضك المبدئي: <span className="font-bold text-slate-900 font-mono">{activeTrip.clientInitialPrice} ج.م</span>
                  </p>
                  {activeTrip.clientNotes && (
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 text-right">
                      <span className="font-bold text-slate-800 block text-[11px]">ملاحظاتك المرفقة:</span>
                      <span>{activeTrip.clientNotes}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    ستظهر عروض الكباتن أدناه فور تقديمها، يمكنك قبول العرض الأنسب لك.
                  </p>
                </div>

                {/* Incoming Bids List */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>عروض الكباتن المباشرة ({activeTrip.bids.length})</span>
                    <span className="text-[11px] text-emerald-600 font-bold">مباشر الآن 🟢</span>
                  </div>

                  {activeTrip.bids.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 flex flex-col items-center gap-2 shadow-sm">
                      <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                      <span>نبحث عن أقرب كباتن في نطاقك...</span>
                    </div>
                  ) : (
                    activeTrip.bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 transition shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={bid.driverAvatar}
                              alt={bid.driverName}
                              className="w-11 h-11 rounded-full object-cover border border-slate-300"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{bid.driverName}</span>
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded flex items-center gap-0.5 font-bold">
                                  <Star className="w-2.5 h-2.5 fill-current" /> {bid.driverRating}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {bid.vehicleModel} • {bid.vehicleColor} ({bid.plateNumber})
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <div className="text-lg font-black text-slate-900 font-mono">
                              {bid.proposedPrice} <span className="text-xs font-normal">ج.م</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              يبعد {bid.driverDistanceKm} كم (~{bid.estimatedArrivalMinutes} د)
                            </div>
                          </div>
                        </div>

                        {/* Accept Button */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptBid(bid.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>قبول العرض ({bid.proposedPrice} ج.م)</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cancel Request Button */}
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full text-xs text-rose-600 hover:text-rose-700 py-2 border border-rose-200 rounded-xl hover:bg-rose-50 transition font-bold"
                >
                  إلغاء طلب المشوار
                </button>
              </div>
            )}

            {/* STATE C: TRIP CONFIRMED / IN PROGRESS */}
            {activeTrip &&
              activeTrip.status !== 'negotiating' &&
              activeTrip.status !== 'completed' &&
              activeTrip.status !== 'cancelled' && (
                <div className="space-y-4">
                  {/* Driver In-Flight Card */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-md">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeTrip.driverAvatar}
                          alt={activeTrip.driverName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-300"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{activeTrip.driverName}</span>
                            <span className="text-amber-600 text-[10px] font-bold">★ 4.9</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {activeTrip.driverVehicle?.nameAr} - {activeTrip.driverVehicle?.model} ({activeTrip.driverVehicle?.color})
                          </div>
                          <div className="text-[11px] font-mono font-bold text-slate-700 mt-0.5">
                            لوحة: {activeTrip.driverVehicle?.plateNumber}
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="text-xs text-slate-500">السعر المتفق عليه</div>
                        <div className="text-xl font-black text-slate-900 font-mono">
                          {activeTrip.agreedPrice} <span className="text-xs font-normal">ج.م</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          كاش للكابتن
                        </div>
                      </div>
                    </div>

                    {/* Live Trip Status Progress */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">
                          {activeTrip.status === 'driver_arriving'
                            ? 'الكابتن في طريقه إليك'
                            : activeTrip.status === 'arrived_pickup'
                            ? 'وصل الكابتن لنقطة الركوب!'
                            : 'المشوار جارٍ إلى الوجهة'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {activeTrip.status === 'in_trip' ? 'في الطريق' : 'خلال دقائق'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-700"
                          style={{
                            width:
                              activeTrip.status === 'offer_accepted'
                                ? '20%'
                                : activeTrip.status === 'driver_arriving'
                                ? '45%'
                                : activeTrip.status === 'arrived_pickup'
                                ? '70%'
                                : '90%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions: Call & Chat */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${activeTrip.driverPhone || '01012345678'}`}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition"
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>اتصال بالكابتن</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition relative"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                        <span>محادثة فورية</span>
                        {activeTrip.messages.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2" />
                        )}
                      </button>
                    </div>

                    {/* Emergency / Share trip */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <button
                        type="button"
                        onClick={() => alert('تم نسخ رابط مشاركة الرحلة الحية لمشاركته مع العائلة')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        <Share2 className="w-3.5 h-3.5" /> مشاركة مسار المشوار
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        إلغاء الرحلة
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* STATE D: COMPLETED OR CANCELLED */}
            {activeTrip && (activeTrip.status === 'completed' || activeTrip.status === 'cancelled') && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-md">
                <div
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                    activeTrip.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {activeTrip.status === 'completed' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <AlertCircle className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeTrip.status === 'completed'
                      ? 'حمد الله على سلامتك! انتهى المشوار'
                      : 'تم إلغاء الرحلة'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeTrip.status === 'completed'
                      ? `تم تسليم ${activeTrip.agreedPrice} ج.م نقداً للكابتن`
                      : `السبب: ${activeTrip.cancellationReason || 'ملغي من قبل المستخدم'}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => meshwarStore.setActiveTrip(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
                >
                  طلب مشوار جديد
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right/Main Map View */}
      <div className="flex-1 h-[45vh] md:h-full relative overflow-hidden bg-slate-100">
        <GoogleMapView
          apiKey={apiKey}
          pickup={pickup}
          dropoff={dropoff}
          drivers={drivers}
          activeTrip={activeTrip}
          isPenModeActive={isPenModeActive}
          drawingTarget={drawingTarget}
          penLocation={tempPenCoords}
          onSelectDrawingTarget={(target) => {
            setDrawingTarget(target);
            setTempPenCoords(target === 'pickup' ? pickup : dropoff);
          }}
          onMapClick={(coords) => {
            if (isPenModeActive) {
              setTempPenCoords(coords);
              return;
            }
            if (!activeTrip) {
              setDropoff({
                name: 'موقع محدد على الخريطة',
                address: `الإحداثيات: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
                lat: coords.lat,
                lng: coords.lng,
              });
            }
          }}
          onConfirmPenLocation={(coords, target) => {
            const actualTarget = target || drawingTarget;
            const namedLoc = {
              name: actualTarget === 'pickup' ? 'نقطة الانطلاق (رسم خريطة ✍️)' : 'الوجهة (رسم خريطة ✍️)',
              address: `إحداثيات محددة: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
              lat: coords.lat,
              lng: coords.lng,
            };
            if (actualTarget === 'pickup') {
              setPickup(namedLoc);
            } else {
              setDropoff(namedLoc);
            }
            setIsPenModeActive(false);
            setTempPenCoords(null);
          }}
          onCancelPenMode={() => {
            setIsPenModeActive(false);
            setTempPenCoords(null);
          }}
          className="w-full h-full"
        />
      </div>

      {/* Modal: Places Search (Egyptian Autocomplete) */}
      {searchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>
                  {searchTarget === 'pickup' ? 'حدد نقطة الانطلاق والركوب' : 'حدد وجهة الوصول'}
                </span>
              </h3>
              <button
                onClick={() => setSearchTarget(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مكان في بورسعيد..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white"
                autoFocus
              />
            </div>

            {/* Saved Favorites */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {client.favorites.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => {
                    const loc = { name: fav.name, address: fav.address, lat: fav.lat, lng: fav.lng };
                    if (searchTarget === 'pickup') setPickup(loc);
                    else setDropoff(loc);
                    setSearchTarget(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap border border-slate-200 font-medium"
                >
                  <Bookmark className="w-3 h-3 text-amber-500" />
                  <span>{fav.name}</span>
                </button>
              ))}
            </div>

            {/* Places List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPlaces.map((place, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (searchTarget === 'pickup') setPickup(place);
                    else setDropoff(place);
                    setSearchTarget(null);
                  }}
                  className="w-full text-right p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 group-hover:border-slate-300 text-slate-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {place.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{place.address}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 rtl:rotate-180" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: In-Trip Chat */}
      {showChatModal && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md h-[600px] max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeTrip.driverAvatar}
                  alt={activeTrip.driverName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{activeTrip.driverName}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">متصل الآن في الرحلة</div>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets */}
            <div className="p-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[11px]">
              {['أنا في انتظارك أمام الباب', 'وصلت مكان الركوب', 'تمام شكراً يا كابتن'].map(
                (quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      meshwarStore.sendChatMessage(activeTrip.id, client.id, 'client', quick);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap shadow-xs"
                  >
                    {quick}
                  </button>
                )
              )}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {activeTrip.messages.map((msg) => {
                const isMe = msg.senderType === 'client';
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

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب رسالتك للكابتن..."
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

      {/* Modal: Rating & Review */}
      {showRatingModal && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <Star className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">كيف كانت تجربتك مع الكابتن؟</h3>
              <p className="text-xs text-slate-500 mt-1">{activeTrip.driverName} - {activeTrip.driverVehicle?.model}</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="p-1 transition hover:scale-125"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingStars ? 'text-amber-500 fill-current' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="اكتب رأيك بصراحة (الالتزام بالميعاد، نظافة السيارة، الأمان)..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white resize-none"
            />

            <button
              type="button"
              onClick={handleSubmitRating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
            >
              إرسال التقييم وإنهاء المشوار
            </button>
          </div>
        </div>
      )}

      {/* Modal: Cancellation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <span>إلغاء الرحلة</span>
            </h3>
            <p className="text-xs text-slate-600">
              يرجى اختيار سبب الإلغاء لتحسين جودة خدمة مشوار ومراقبة أداء الكباتن:
            </p>

            <div className="space-y-2">
              {[
                'تأخر الكابتن في الوصول لنقطة الركوب',
                'الكابتن طلب زيادة غير متفق عليها',
                'غيرت وجهتي أو لم أعد بحاجة للمشوار',
                'وجدت وسيلة مواصلات أخرى أسرع',
              ].map((reason, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs text-slate-800 hover:border-slate-300 transition"
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-slate-800"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-300 transition"
              >
                تراجع واستمرار الرحلة
              </button>
              <button
                type="button"
                onClick={handleCancelTrip}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
