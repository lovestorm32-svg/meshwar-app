import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Driver, Trip } from '../../types';

interface FreeLeafletMapProps {
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
}

// Create custom SVG HTML icons for Leaflet without relying on external image assets
function createPickupIcon(name?: string) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center group -translate-x-1/2 -translate-y-full">
        <div class="px-2.5 py-1 bg-white text-emerald-900 border border-emerald-500 rounded-lg text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
          📍 ${name || 'نقطة الانطلاق'}
        </div>
        <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-lg relative">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping"></span>
        </div>
        <div class="w-1.5 h-2.5 bg-emerald-700"></div>
      </div>
    `,
    iconSize: [32, 52],
    iconAnchor: [16, 52],
  });
}

function createDropoffIcon(name?: string) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center group -translate-x-1/2 -translate-y-full">
        <div class="px-2.5 py-1 bg-white text-rose-900 border border-rose-500 rounded-lg text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
          🏁 ${name || 'الوجهة'}
        </div>
        <div class="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center border-2 border-white shadow-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
          </svg>
        </div>
        <div class="w-1.5 h-2.5 bg-rose-700"></div>
      </div>
    `,
    iconSize: [32, 52],
    iconAnchor: [16, 52],
  });
}

function createDriverIcon(driverName: string, plateNumber?: string) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
        <div class="w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-lg transform transition hover:scale-125">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
          </svg>
        </div>
        <div class="mt-0.5 px-1.5 py-0.2 bg-slate-900/90 text-white text-[9px] font-mono rounded shadow">
          ${plateNumber || driverName.slice(0, 8)}
        </div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 23],
  });
}

function createPenIcon(target?: string) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
        <div class="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500 animate-spin absolute inset-0"></div>
        <div class="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-base shadow-xl border-2 border-white">
          ✍️
        </div>
        <span class="mt-1 px-2 py-0.5 bg-slate-900 text-emerald-400 text-[10px] font-bold rounded-full shadow">
          ${target === 'dropoff' ? 'الوجهة' : 'نقطة الانطلاق'}
        </span>
      </div>
    `,
    iconSize: [48, 64],
    iconAnchor: [24, 32],
  });
}

export const FreeLeafletMap: React.FC<FreeLeafletMapProps> = ({
  pickup,
  dropoff,
  drivers = [],
  activeTrip,
  onMapClick,
  interactive = true,
  className = 'w-full h-full',
  isPenModeActive = false,
  drawingTarget = 'pickup',
  penLocation,
  onConfirmPenLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Default coordinates: Port Said, Egypt
  const DEFAULT_CENTER: [number, number] = [31.2653, 32.3019];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet instance
    const map = L.map(mapContainerRef.current, {
      center: pickup ? [pickup.lat, pickup.lng] : DEFAULT_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Free OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer group for all dynamic markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Handle map resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
      if (isPenModeActive && onConfirmPenLocation) {
        onConfirmPenLocation({ lat: e.latlng.lat, lng: e.latlng.lng }, drawingTarget);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick, isPenModeActive, onConfirmPenLocation, drawingTarget]);

  // Update Markers & Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const boundsPoints: L.LatLngExpression[] = [];

    // 1. Pickup Marker
    if (pickup) {
      const pickupLatLng: [number, number] = [pickup.lat, pickup.lng];
      const pickupMarker = L.marker(pickupLatLng, {
        icon: createPickupIcon(pickup.name),
      });
      markersLayer.addLayer(pickupMarker);
      boundsPoints.push(pickupLatLng);
    }

    // 2. Dropoff Marker
    if (dropoff) {
      const dropoffLatLng: [number, number] = [dropoff.lat, dropoff.lng];
      const dropoffMarker = L.marker(dropoffLatLng, {
        icon: createDropoffIcon(dropoff.name),
      });
      markersLayer.addLayer(dropoffMarker);
      boundsPoints.push(dropoffLatLng);
    }

    // 3. Pen Location Marker
    if (isPenModeActive && penLocation) {
      const penLatLng: [number, number] = [penLocation.lat, penLocation.lng];
      const penMarker = L.marker(penLatLng, {
        icon: createPenIcon(drawingTarget),
        zIndexOffset: 1000,
      });
      markersLayer.addLayer(penMarker);
    }

    // 4. Live Drivers Markers
    drivers.forEach((drv) => {
      if (drv.currentLocation) {
        const drvLatLng: [number, number] = [drv.currentLocation.lat, drv.currentLocation.lng];
        const drvMarker = L.marker(drvLatLng, {
          icon: createDriverIcon(drv.name, drv.vehicle?.plateNumber),
        });
        markersLayer.addLayer(drvMarker);
      }
    });

    // 5. Route Polyline between Pickup & Dropoff
    if (pickup && dropoff) {
      const midLat = (pickup.lat + dropoff.lat) / 2 + 0.002;
      const midLng = (pickup.lng + dropoff.lng) / 2 - 0.001;
      const path: [number, number][] = [
        [pickup.lat, pickup.lng],
        [midLat, midLng],
        [dropoff.lat, dropoff.lng],
      ];

      const polyline = L.polyline(path, {
        color: '#10b981', // emerald-500
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map);

      polylineRef.current = polyline;

      // Fit bounds to show entire route with padding
      if (boundsPoints.length >= 2) {
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 15);
    }
  }, [pickup, dropoff, drivers, isPenModeActive, penLocation, drawingTarget]);

  return (
    <div className={`relative ${className}`}>
      {/* Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Crosshair indicator when Pen Mode is active */}
      {isPenModeActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-500/70 animate-spin"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg"></div>
          </div>
        </div>
      )}

      {/* Free Map Branding Badge */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none bg-white/95 text-slate-800 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200 text-[10px] font-bold shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>خريطة مجانية بدون قيود (OpenStreetMap)</span>
      </div>
    </div>
  );
};
