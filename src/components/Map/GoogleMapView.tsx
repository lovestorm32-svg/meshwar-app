import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  MapPin,
  Car,
  LocateFixed,
  Compass,
  ShieldCheck,
  Pencil,
  Check,
  X,
  Crosshair,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Driver, Trip } from '../../types';
import { FreeLeafletMap } from './FreeLeafletMap';

interface GoogleMapViewProps {
  apiKey: string;
  pickup?: { lat: number; lng: number; name?: string } | null;
  dropoff?: { lat: number; lng: number; name?: string } | null;
  drivers?: Driver[];
  activeTrip?: Trip | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  interactive?: boolean;
  className?: string;
  isPenModeActive?: boolean;
  drawingTarget?: 'pickup' | 'dropoff';
  penLocation?: { lat: number; lng: number; name?: string } | null;
  onConfirmPenLocation?: (coords: { lat: number; lng: number }, target?: 'pickup' | 'dropoff') => void;
  onCancelPenMode?: () => void;
  onSelectDrawingTarget?: (target: 'pickup' | 'dropoff') => void;
}

declare const google: any;

// Inner component that handles Google Maps route polyline & camera adjustments
function MapRouteRenderer({
  pickup,
  dropoff,
  activeTrip,
  activeDriverLocation,
}: {
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  activeTrip?: Trip | null;
  activeDriverLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (pickup && dropoff) {
      const path = [
        { lat: pickup.lat, lng: pickup.lng },
        {
          lat: (pickup.lat + dropoff.lat) / 2 + 0.003,
          lng: (pickup.lng + dropoff.lng) / 2 - 0.002,
        },
        { lat: dropoff.lat, lng: dropoff.lng },
      ];

      const polyline = new mapsLib.Polyline({
        path,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });

      polylineRef.current = polyline;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickup);
      bounds.extend(dropoff);
      if (activeDriverLocation) {
        bounds.extend(activeDriverLocation);
      }
      map.fitBounds(bounds, 70);
    } else if (pickup) {
      map.panTo(pickup);
      map.setZoom(15);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, mapsLib, pickup, dropoff, activeDriverLocation]);

  return null;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  apiKey,
  pickup,
  dropoff,
  drivers = [],
  activeTrip,
  onMapClick,
  interactive = true,
  className = '',
  isPenModeActive = false,
  drawingTarget = 'pickup',
  penLocation,
  onConfirmPenLocation,
  onCancelPenMode,
  onSelectDrawingTarget,
}) => {
  // Map Provider: 'free_osm' (خرائط مجانية) or 'google_maps' (خرائط جوجل)
  const [mapProvider, setMapProvider] = useState<'free_osm' | 'google_maps'>('free_osm');
  const [mapError, setMapError] = useState<boolean>(false);
  const [activeDriverPos, setActiveDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  const defaultCenter = useMemo(() => ({ lat: 31.2653, lng: 32.3019 }), []);

  // Simulate smooth driver car movement when trip is active
  useEffect(() => {
    if (!activeTrip || !activeTrip.driverId) {
      setActiveDriverPos(null);
      return;
    }

    const startPos = activeTrip.pickup;
    const endPos = activeTrip.dropoff;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress > 1) progress = 0.1;

      if (activeTrip.status === 'driver_arriving') {
        const initialOffset = { lat: startPos.lat + 0.008, lng: startPos.lng + 0.008 };
        setActiveDriverPos({
          lat: initialOffset.lat + (startPos.lat - initialOffset.lat) * Math.min(1, progress * 1.5),
          lng: initialOffset.lng + (startPos.lng - initialOffset.lng) * Math.min(1, progress * 1.5),
        });
      } else if (activeTrip.status === 'in_trip') {
        setActiveDriverPos({
          lat: startPos.lat + (endPos.lat - startPos.lat) * progress,
          lng: startPos.lng + (endPos.lng - startPos.lng) * progress,
        });
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeTrip]);

  // Open Google Maps navigation to determine the route (فتح خرائط جوجل لتحديد المسار)
  const handleOpenGoogleMapsNavigation = () => {
    let url = 'https://www.google.com/maps';
    if (pickup && dropoff) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dropoff.lat},${dropoff.lng}&travelmode=driving&dir_action=navigate`;
    } else if (dropoff) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${dropoff.lat},${dropoff.lng}&travelmode=driving&dir_action=navigate`;
    } else if (pickup) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${pickup.lat},${pickup.lng}&travelmode=driving&dir_action=navigate`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=31.2653,32.3019`; // Port Said
    }
    window.open(url, '_blank');
  };

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl ${className}`}>
      {/* Top Floating Controls: Map Provider Switcher & Open in Google Maps Navigation */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Button to Open Google Maps for Live Route Navigation (فتح خرائط جوجل لتحديد المسار) */}
        <button
          type="button"
          onClick={handleOpenGoogleMapsNavigation}
          className="pointer-events-auto bg-white/95 hover:bg-white text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold transition flex items-center gap-1.5 active:scale-95 backdrop-blur-md group"
          title="فتح خرائط جوجل لتحديد المسار والملاحة الحية"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-45 transition" />
          <span className="hidden sm:inline">فتح خرائط جوجل لتحديد المسار</span>
          <span className="sm:hidden">ملاحة جوجل</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>

        {/* Right: Map Engine Switcher (خرائط مجانية مفتوحة المصدر / خرائط جوجل) */}
        <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => setMapProvider('free_osm')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              mapProvider === 'free_osm'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🗺️ خرائط مجانية (OSM)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMapError(false);
              setMapProvider('google_maps');
            }}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              mapProvider === 'google_maps'
                ? 'bg-slate-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌐 خرائط جوجل</span>
          </button>
        </div>
      </div>

      {/* RENDER MAP: Either Free OpenStreetMap OR Google Maps */}
      {mapProvider === 'free_osm' || mapError || !apiKey ? (
        <FreeLeafletMap
          pickup={pickup}
          dropoff={dropoff}
          drivers={drivers}
          activeTrip={activeTrip}
          onMapClick={onMapClick}
          interactive={interactive}
          className="w-full h-full"
          isPenModeActive={isPenModeActive}
          drawingTarget={drawingTarget}
          penLocation={penLocation}
          onConfirmPenLocation={onConfirmPenLocation}
        />
      ) : (
        <APIProvider
          apiKey={apiKey}
          language="ar"
          region="EG"
          onLoad={() => setMapError(false)}
        >
          <div className="w-full h-full relative" style={{ minHeight: '360px' }}>
            <GoogleMap
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              mapId="DEMO_MAP_ID"
              defaultCenter={pickup || defaultCenter}
              defaultZoom={14}
              gestureHandling={interactive ? 'greedy' : 'none'}
              disableDefaultUI={false}
              streetViewControl={false}
              mapTypeControl={false}
              onClick={(e) => {
                if (interactive && onMapClick && e.detail.latLng) {
                  onMapClick({
                    lat: e.detail.latLng.lat,
                    lng: e.detail.latLng.lng,
                  });
                }
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <MapRouteRenderer
                pickup={pickup}
                dropoff={dropoff}
                activeTrip={activeTrip}
                activeDriverLocation={activeDriverPos}
              />

              {/* Pickup Marker */}
              {pickup && (
                <AdvancedMarker position={{ lat: pickup.lat, lng: pickup.lng }} title={pickup.name || 'نقطة الانطلاق'}>
                  <div className="flex flex-col items-center">
                    <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg ring-4 ring-emerald-400/30 flex items-center justify-center animate-bounce">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="bg-white/95 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded shadow mt-1 border border-slate-200">
                      {pickup.name || 'موقع الركوب'}
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Dropoff Marker */}
              {dropoff && (
                <AdvancedMarker position={{ lat: dropoff.lat, lng: dropoff.lng }} title={dropoff.name || 'الوجهة'}>
                  <div className="flex flex-col items-center">
                    <div className="bg-rose-600 text-white p-2 rounded-full shadow-lg ring-4 ring-rose-400/30 flex items-center justify-center">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div className="bg-white/95 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded shadow mt-1 border border-slate-200">
                      {dropoff.name || 'وجهة الوصول'}
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Live moving driver vehicle */}
              {activeDriverPos && (
                <AdvancedMarker position={activeDriverPos} title="سيارة الكابتن">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 animate-ping absolute" />
                    <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-2xl">
                      <Car className="w-5 h-5" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Nearby Available Drivers in Port Said */}
              {!activeTrip &&
                drivers
                  .filter((d) => d.isOnline)
                  .map((drv) => (
                    <AdvancedMarker
                      key={drv.id}
                      position={drv.currentLocation}
                      title={`${drv.name} - ${drv.vehicle.nameAr}`}
                    >
                      <div className="flex flex-col items-center group cursor-pointer">
                        <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-lg transform transition group-hover:scale-125">
                          <Car className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] bg-slate-900/90 text-white px-1.5 py-0.2 rounded font-mono mt-0.5 shadow">
                          {drv.vehicle.plateNumber}
                        </span>
                      </div>
                    </AdvancedMarker>
                  ))}
            </GoogleMap>
          </div>
        </APIProvider>
      )}

      {/* Drawing Manager / Pen Top Mode Banner */}
      {isPenModeActive && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border-2 border-amber-400 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
              drawingTarget === 'pickup' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'
            }`}>
              <Pencil className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                أداة الرسم بالقلم ({drawingTarget === 'pickup' ? 'نقطة الانطلاق 🟢' : 'الوجهة 🟡'})
              </div>
              <div className="text-[10px] text-slate-300">انقر على أي موقع لتثبيته بدقة على الخريطة</div>
            </div>
          </div>

          {onSelectDrawingTarget && (
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => onSelectDrawingTarget('pickup')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  drawingTarget === 'pickup'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                نقطة الانطلاق
              </button>
              <button
                type="button"
                onClick={() => onSelectDrawingTarget('dropoff')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  drawingTarget === 'dropoff'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الوجهة
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pen Mode Bottom Confirmation Controls */}
      {isPenModeActive && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const targetCoords = penLocation || (drawingTarget === 'pickup' ? pickup : dropoff) || defaultCenter;
              if (onConfirmPenLocation) {
                onConfirmPenLocation(targetCoords, drawingTarget);
              }
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-2xl shadow-emerald-500/40 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد {drawingTarget === 'pickup' ? 'الانطلاق' : 'الوجهة'} هنا ✍️</span>
          </button>
          <button
            type="button"
            onClick={onCancelPenMode}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 px-3.5 py-2.5 rounded-2xl text-xs font-bold border border-slate-700 transition"
          >
            إلغاء
          </button>
        </div>
      )}

      {/* GPS Recenter Floating Button */}
      <button
        type="button"
        onClick={() => {
          if (navigator.geolocation && onMapClick) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                onMapClick({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              },
              () => {
                onMapClick({ lat: 31.2653, lng: 32.3019 });
              }
            );
          }
        }}
        className="absolute bottom-4 left-4 z-20 bg-white/95 hover:bg-white text-slate-800 border border-slate-300 p-2.5 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center backdrop-blur-md"
        title="تحديد موقعي الحالي GPS"
      >
        <LocateFixed className="w-5 h-5 text-emerald-600" />
      </button>
    </div>
  );
};
