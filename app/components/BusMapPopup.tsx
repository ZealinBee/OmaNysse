"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Bus, Lock } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSubscription } from "@/app/lib/hooks/useSubscription";

const FREE_TRIAL_LIMIT = 4;
const TRIAL_STORAGE_KEY = "seuraavabussi_map_trial_count";

interface OnwardCall {
  stopCode: string;
  expectedArrivalTime?: string;
  expectedDepartureTime?: string;
  order: number;
}

interface VehiclePosition {
  lat: number;
  lon: number;
  bearing?: number;
  vehicleRef?: string;
  onwardCalls?: OnwardCall[];
}

interface BusMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  routeNumber: string;
  headsign: string;
  routeColor: string;
  stopLat: number;
  stopLon: number;
  stopName: string;
  stopCode?: string;
  userLat: number;
  userLon: number;
  region: "hsl" | "waltti";
}

// Helper to calculate distance between two coordinates (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate bearing from point 1 to point 2 (in degrees, 0 = North)
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

// Check if bus is heading towards the stop (within 90 degree tolerance)
function isHeadingTowardsStop(
  busLat: number,
  busLon: number,
  busBearing: number | undefined,
  stopLat: number,
  stopLon: number
): boolean {
  if (busBearing === undefined) return true; // If no bearing, assume it could be heading towards

  const bearingToStop = getBearing(busLat, busLon, stopLat, stopLon);
  let diff = Math.abs(bearingToStop - busBearing);
  if (diff > 180) diff = 360 - diff;

  return diff <= 90; // Within 90 degrees means roughly heading towards
}

// Find the index of the next bus (closest one heading towards the stop)
function findNextBusIndex(
  vehicles: VehiclePosition[],
  stopLat: number,
  stopLon: number
): number {
  let nextBusIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    if (isHeadingTowardsStop(vehicle.lat, vehicle.lon, vehicle.bearing, stopLat, stopLon)) {
      const distance = getDistance(stopLat, stopLon, vehicle.lat, vehicle.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nextBusIndex = i;
      }
    }
  }

  // If no bus is heading towards, fall back to closest
  if (nextBusIndex === -1 && vehicles.length > 0) {
    for (let i = 0; i < vehicles.length; i++) {
      const distance = getDistance(stopLat, stopLon, vehicles[i].lat, vehicles[i].lon);
      if (distance < minDistance) {
        minDistance = distance;
        nextBusIndex = i;
      }
    }
  }

  return nextBusIndex;
}

// Custom hook to fit bounds only on initial load - focuses on next bus, user, and stop
function FitBoundsOnce({
  stopLat,
  stopLon,
  userLat,
  userLon,
  vehiclePositions,
}: {
  stopLat: number;
  stopLon: number;
  userLat: number;
  userLon: number;
  vehiclePositions: VehiclePosition[];
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    // Wait until we have vehicle positions to fit bounds properly
    if (vehiclePositions.length > 0 && !hasFitted.current) {
      // Find the next bus (closest one heading towards the stop)
      const nextBusIndex = findNextBusIndex(vehiclePositions, stopLat, stopLon);
      const nextBus = nextBusIndex >= 0 ? vehiclePositions[nextBusIndex] : vehiclePositions[0];

      // Fit bounds to show: next bus, user location, and bus stop
      const positions: Array<[number, number]> = [
        [stopLat, stopLon],
        [userLat, userLon],
        [nextBus.lat, nextBus.lon],
      ];

      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      hasFitted.current = true;
    }
  }, [map, stopLat, stopLon, userLat, userLon, vehiclePositions]);

  return null;
}

// Create custom icons - bearing: 0 = North, 90 = East, 180 = South, 270 = West
function createBusIcon(color: string, bearing?: number, isNextBus?: boolean) {
  const rotation = bearing ?? 0;
  const counterRotation = -rotation; // Counter-rotate to keep bus upright

  // Next bus gets a pulsing ring around it
  const pulseRing = isNextBus
    ? `<div style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 28px; height: 28px; border-radius: 50%; border: 2px solid ${color}; animation: pulse-ring 1.5s ease-out infinite;"></div>`
    : '';
  const pulseKeyframes = isNextBus
    ? `<style>@keyframes pulse-ring { 0% { transform: translateX(-50%) scale(1); opacity: 1; } 100% { transform: translateX(-50%) scale(1.8); opacity: 0; } }</style>`
    : '';

  return L.divIcon({
    html: `${pulseKeyframes}<div style="position: relative; width: 40px; height: 40px; transform: rotate(${rotation}deg);">
      <!-- Pulsing ring for next bus -->
      ${pulseRing}
      <!-- Direction arrow at top -->
      <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid ${color}; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></div>
      <!-- Bus icon circle - counter-rotated to stay upright -->
      <div style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%) rotate(${counterRotation}deg); background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/>
          <path d="M9 18h5"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
    </div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Bus stop icon - sign post style
const stopIcon = L.divIcon({
  html: `<div style="position: relative; width: 24px; height: 36px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
    <!-- Sign -->
    <div style="position: absolute; top: 0; left: 0; width: 24px; height: 24px; background: #fbbf24; border: 2px solid #a16207; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a16207" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
      </svg>
    </div>
    <!-- Pole -->
    <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 4px; height: 14px; background: #6b7280; border-radius: 0 0 2px 2px;"></div>
  </div>`,
  className: "",
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

// User location icon - Google Maps style blue dot with pulse
const userIcon = L.divIcon({
  html: `<style>@keyframes user-pulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }</style>
  <div style="position: relative; width: 40px; height: 40px;">
    <!-- Pulsing ring -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: user-pulse 2s ease-out infinite;"></div>
    <!-- Outer ring -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 22px; height: 22px; background: white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
    <!-- Inner blue dot -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background: #3b82f6; border-radius: 50%;"></div>
  </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Helper to calculate minutes until arrival from ISO timestamp
function getMinutesUntilArrival(expectedArrivalTime: string | undefined): number | null {
  if (!expectedArrivalTime) return null;
  try {
    const arrivalDate = new Date(expectedArrivalTime);
    const now = new Date();
    const diffMs = arrivalDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    return diffMins >= 0 ? diffMins : null;
  } catch {
    return null;
  }
}

// Find arrival time for a vehicle at a specific stop
function findArrivalAtStop(vehicle: VehiclePosition, stopCode: string | undefined): number | null {
  if (!stopCode || !vehicle.onwardCalls) return null;
  const call = vehicle.onwardCalls.find(c => c.stopCode === stopCode);
  if (!call) return null;
  return getMinutesUntilArrival(call.expectedArrivalTime || call.expectedDepartureTime);
}

export default function BusMapPopup({
  isOpen,
  onClose,
  routeNumber,
  headsign,
  routeColor,
  stopLat,
  stopLon,
  stopName,
  stopCode,
  userLat,
  userLon,
  region,
}: BusMapPopupProps) {
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialCount, setTrialCount] = useState<number | null>(null);
  const hasUsedTrial = useRef(false);

  const { hasPlusAccess, isLoading: subLoading } = useSubscription();

  // Get trial count from localStorage
  const getTrialCount = useCallback(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }, []);

  // Increment trial count
  const incrementTrialCount = useCallback(() => {
    if (typeof window === "undefined") return;
    const current = getTrialCount();
    const newCount = current + 1;
    localStorage.setItem(TRIAL_STORAGE_KEY, newCount.toString());
    setTrialCount(newCount);
  }, [getTrialCount]);

  // Load trial count on mount
  useEffect(() => {
    setTrialCount(getTrialCount());
  }, [getTrialCount]);

  // Track trial usage when map opens (only once per open)
  useEffect(() => {
    if (isOpen && !hasPlusAccess && !subLoading && trialCount !== null && trialCount < FREE_TRIAL_LIMIT && !hasUsedTrial.current) {
      hasUsedTrial.current = true;
      incrementTrialCount();
    }
  }, [isOpen, hasPlusAccess, subLoading, trialCount, incrementTrialCount]);

  // Reset trial tracking when popup closes
  useEffect(() => {
    if (!isOpen) {
      hasUsedTrial.current = false;
    }
  }, [isOpen]);

  const trialLoading = trialCount === null;
  const remainingTrials = trialCount !== null ? Math.max(0, FREE_TRIAL_LIMIT - trialCount) : FREE_TRIAL_LIMIT;
  const hasTrialsLeft = trialCount !== null && trialCount < FREE_TRIAL_LIMIT;
  const isPaywalled = !hasPlusAccess && !subLoading && !trialLoading && !hasTrialsLeft;

  useEffect(() => {
    if (!isOpen || isPaywalled) return;

    const fetchVehiclePositions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/vehicle-position?lineRef=${encodeURIComponent(routeNumber)}&region=${region}`
        );
        const data = await response.json();

        if (data.positions && data.positions.length > 0) {
          setVehiclePositions(data.positions);
        } else if (region === "hsl") {
          setError("HSL-alueella bussin sijainti ei ole saatavilla");
        } else {
          setError("Bussin sijaintia ei löytynyt");
        }
      } catch {
        setError("Bussin sijainnin haku epäonnistui");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehiclePositions();

    // Refresh every 10 seconds
    const interval = setInterval(fetchVehiclePositions, 10000);
    return () => clearInterval(interval);
  }, [isOpen, isPaywalled, routeNumber, region]);

  if (!isOpen) return null;

  // Loading state - show while checking subscription or trial status
  if (subLoading || trialLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" style={{ touchAction: 'none' }}>
        <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden bg-white">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (isPaywalled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" style={{ touchAction: 'none' }}>
        <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
          {/* Glass background layer */}
          <div
            className="absolute inset-0 opacity-80"
            style={{ backgroundColor: routeColor }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />

          {/* Content */}
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="font-black text-white text-xl drop-shadow-sm">{routeNumber}</span>
                <span className="text-white/80 font-medium truncate">{headsign}</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Paywall Content */}
            <div className="h-80 relative flex flex-col items-center justify-center p-6">
              {/* Blurred map preview background */}
              <div className="absolute inset-0 opacity-15 blur-md">
                <MapContainer
                  center={[stopLat, stopLon]}
                  zoom={14}
                  className="h-full w-full"
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </MapContainer>
              </div>

              {/* Paywall overlay */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-5 shadow-lg">
                  <Lock className="w-7 h-7 text-white drop-shadow-sm" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">
                  SeuraavaBussi Plus
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-xs">
                  Olet käyttänyt kaikki {FREE_TRIAL_LIMIT} ilmaista kokeilukertaasi. Hanki SeuraavaBussi Plus nähdäksesi bussien sijainnit kartalla rajattomasti.
                </p>
                <a
                  href="/plus"
                  className="px-6 py-3 bg-white/95 hover:bg-white backdrop-blur-sm rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg border border-white/50 inline-block"
                  style={{ color: routeColor }}
                >
                  Osta SeuraavaBussi Plus
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-black/10">
              <p className="text-center text-white/40 text-xs">
                Plus: Rajaton karttakäyttö ja tulevat ominaisuudet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ touchAction: 'none' }}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: routeColor, touchAction: 'none' }}
        >
          <div className="flex items-center gap-3">
            <span className="font-black text-white text-xl">{routeNumber}</span>
            <span className="text-white/90 font-medium truncate">{headsign}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Map Container */}
        <div className="h-80 relative" style={{ touchAction: 'manipulation' }}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-600 text-sm">Ladataan karttaa...</span>
              </div>
            </div>
          )}

          <MapContainer
            center={[stopLat, stopLon]}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Stop marker */}
            <Marker position={[stopLat, stopLon]} icon={stopIcon}>
              <Popup>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{stopName}</div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${stopLat},${stopLon}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  Pysäkille
                </a>
              </Popup>
            </Marker>

            {/* User location marker */}
            <Marker position={[userLat, userLon]} icon={userIcon}>
              <Popup>
                <div className="font-semibold">Sijaintisi</div>
              </Popup>
            </Marker>

            {/* Bus markers */}
            {(() => {
              // Find the next bus (closest one heading towards the stop)
              const nextBusIndex = findNextBusIndex(vehiclePositions, stopLat, stopLon);

              return vehiclePositions.map((vehicle, index) => {
                const arrivalMins = findArrivalAtStop(vehicle, stopCode);
                const isNextBus = index === nextBusIndex;

                return (
                  <Marker
                    key={vehicle.vehicleRef || index}
                    position={[vehicle.lat, vehicle.lon]}
                    icon={createBusIcon(routeColor, vehicle.bearing, isNextBus)}
                  >
                    <Popup>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {routeNumber} {headsign}
                      </div>
                      {arrivalMins !== null ? (
                        <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
                          Saapuu {arrivalMins === 0 ? 'nyt' : arrivalMins === 1 ? '1 min' : `${arrivalMins} min`}
                        </div>
                      ) : isNextBus ? (
                        <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
                          Seuraava bussi
                        </div>
                      ) : null}
                    </Popup>
                  </Marker>
                );
              });
            })()}

            <FitBoundsOnce
              stopLat={stopLat}
              stopLon={stopLon}
              userLat={userLat}
              userLon={userLon}
              vehiclePositions={vehiclePositions}
            />
          </MapContainer>
        </div>

        {/* Trial Banner - show when using free trial */}
        {!hasPlusAccess && hasTrialsLeft && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200" style={{ touchAction: 'none' }}>
            <div className="flex items-center justify-between">
              <p className="text-amber-800 text-xs">
                Ilmainen kokeilu: {remainingTrials} {remainingTrials === 1 ? "kerta" : "kertaa"} jäljellä
              </p>
              <a
                href="/plus"
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
              >
                Hanki Plus
              </a>
            </div>
          </div>
        )}

        {/* Legend / Info */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200" style={{ touchAction: 'none' }}>
          {error ? (
            <div className="text-center text-gray-600 text-sm">{error}</div>
          ) : (
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: routeColor }}
                >
                  <Bus className="w-2.5 h-2.5 text-white" />
                </div>
                <span>Bussi ({vehiclePositions.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-5 relative">
                  <div className="absolute inset-x-0 top-0 h-4 bg-amber-400 border border-amber-600 rounded-sm flex items-center justify-center">
                    <Bus className="w-2.5 h-2.5 text-amber-700" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-gray-500 rounded-b-sm"></div>
                </div>
                <span>Pysäkki</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 relative">
                  <div className="absolute inset-0 bg-white rounded-full border-2 border-blue-500"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span>Sinä</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
