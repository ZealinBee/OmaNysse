"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, Bus, Lock } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSubscription } from "@/app/lib/hooks/useSubscription";

// Custom styles for compact Leaflet popups and tooltips
const customMapStyles = `
  .compact-popup .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .compact-popup .leaflet-popup-content {
    margin: 8px 10px;
    line-height: 1.3;
  }
  .compact-popup .leaflet-popup-tip {
    box-shadow: none;
  }
  .minimal-tooltip {
    background: rgba(17, 24, 39, 0.9) !important;
    border: none !important;
    border-radius: 4px !important;
    color: white !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    padding: 4px 8px !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
    white-space: nowrap !important;
  }
  .minimal-tooltip::before {
    border-top-color: rgba(17, 24, 39, 0.9) !important;
  }
`;

const FREE_TRIAL_LIMIT = 3;
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
  destinationName?: string;
  directionRef?: string;
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
  expectedArrivalMins?: number; // Minutes until the selected bus arrives at the stop
  tripId?: string;
  userLat: number;
  userLon: number;
  region: "hsl" | "waltti";
  city?: string; // City slug for vehicle position API routing
}

interface RouteGeometry {
  lat: number;
  lon: number;
}

interface RouteStop {
  gtfsId: string;
  name: string;
  lat: number;
  lon: number;
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

// Close popups when user starts dragging the map
function ClosePopupOnDrag() {
  const map = useMap();

  useEffect(() => {
    const handleDragStart = () => {
      map.closePopup();
    };

    map.on('dragstart', handleDragStart);
    return () => {
      map.off('dragstart', handleDragStart);
    };
  }, [map]);

  return null;
}

// Custom hook to fit bounds only on initial load - focuses on selected bus, user, and stop
function FitBoundsOnce({
  stopLat,
  stopLon,
  stopCode,
  expectedArrivalMins,
  userLat,
  userLon,
  vehiclePositions,
}: {
  stopLat: number;
  stopLon: number;
  stopCode?: string;
  expectedArrivalMins?: number;
  userLat: number;
  userLon: number;
  vehiclePositions: VehiclePosition[];
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    // Wait until we have vehicle positions to fit bounds properly
    if (vehiclePositions.length > 0 && !hasFitted.current) {
      // Find the selected bus (matches arrival time) or fall back to next bus
      const selectedBusIndex = findSelectedBusIndex(vehiclePositions, stopCode, expectedArrivalMins, stopLat, stopLon);
      const selectedBus = selectedBusIndex >= 0 ? vehiclePositions[selectedBusIndex] : vehiclePositions[0];

      // Fit bounds to show: selected bus, user location, and bus stop
      const positions: Array<[number, number]> = [
        [stopLat, stopLon],
        [userLat, userLon],
        [selectedBus.lat, selectedBus.lon],
      ];

      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      hasFitted.current = true;
    }
  }, [map, stopLat, stopLon, stopCode, expectedArrivalMins, userLat, userLon, vehiclePositions]);

  return null;
}

// Create custom icons - bearing: 0 = North, 90 = East, 180 = South, 270 = West
function createBusIcon(color: string, bearing?: number, isNextBus?: boolean) {
  const rotation = bearing ?? 0;
  const counterRotation = -rotation; // Counter-rotate to keep bus upright

  // Selected bus: larger, prominent shadow, full color
  // Other buses: slightly smaller, subtle, but still clearly visible
  const iconSize = isNextBus ? 32 : 26;
  const svgSize = isNextBus ? 16 : 13;

  // Selected gets white border + strong shadow, others get slightly lighter treatment
  const borderStyle = isNextBus
    ? 'border: 3px solid white; box-shadow: 0 3px 12px rgba(0,0,0,0.4);'
    : 'border: 2px solid rgba(255,255,255,0.85); box-shadow: 0 2px 4px rgba(0,0,0,0.25);';

  // Circle opacity - others slightly faded
  const circleOpacity = isNextBus ? 1 : 0.8;

  // Next bus gets a pulsing ring around it
  const pulseRing = isNextBus
    ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; border: 3px solid ${color}; animation: pulse-ring 1.5s ease-out infinite;"></div>`
    : '';
  const pulseKeyframes = isNextBus
    ? `<style>@keyframes pulse-ring { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; } }</style>`
    : '';

  return L.divIcon({
    html: `${pulseKeyframes}<div style="position: relative; width: 44px; height: 44px;">
      <!-- Pulsing ring for next bus -->
      ${pulseRing}
      <!-- Bus icon circle -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: ${color}; width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: ${circleOpacity}; ${borderStyle}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
    iconSize: [44, 44],
    iconAnchor: [22, 22],
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

// Find the index of the bus that matches the selected arrival time
function findSelectedBusIndex(
  vehicles: VehiclePosition[],
  stopCode: string | undefined,
  expectedArrivalMins: number | undefined,
  stopLat: number,
  stopLon: number
): number {
  // If we have an expected arrival time, find the bus that matches it
  if (expectedArrivalMins !== undefined && stopCode) {
    let bestMatchIndex = -1;
    let bestMatchDiff = Infinity;

    for (let i = 0; i < vehicles.length; i++) {
      const arrivalMins = findArrivalAtStop(vehicles[i], stopCode);
      if (arrivalMins !== null) {
        const diff = Math.abs(arrivalMins - expectedArrivalMins);
        // Allow up to 2 minutes tolerance for timing differences
        if (diff <= 2 && diff < bestMatchDiff) {
          bestMatchDiff = diff;
          bestMatchIndex = i;
        }
      }
    }

    if (bestMatchIndex >= 0) {
      return bestMatchIndex;
    }
  }

  // Fall back to next bus logic if no match found
  return findNextBusIndex(vehicles, stopLat, stopLon);
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
  expectedArrivalMins,
  tripId,
  userLat,
  userLon,
  region,
  city,
}: BusMapPopupProps) {
  const t = useTranslations("busMap");
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialCount, setTrialCount] = useState<number | null>(null);
  const hasUsedTrial = useRef(false);
  const hasAutoOpenedPopup = useRef(false);

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

  // Reset tracking when popup closes
  useEffect(() => {
    if (!isOpen) {
      hasUsedTrial.current = false;
      hasAutoOpenedPopup.current = false;
    }
  }, [isOpen]);

  const trialLoading = trialCount === null;
  const remainingTrials = trialCount !== null ? Math.max(0, FREE_TRIAL_LIMIT - trialCount) : FREE_TRIAL_LIMIT;
  const hasTrialsLeft = trialCount !== null && trialCount < FREE_TRIAL_LIMIT;
  const isPaywalled = !hasPlusAccess && !subLoading && !trialLoading && !hasTrialsLeft && !hasUsedTrial.current;

  useEffect(() => {
    if (!isOpen) return;

    const fetchVehiclePositions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/vehicle-position?lineRef=${encodeURIComponent(routeNumber)}&region=${region}${city ? `&city=${city}` : ""}`
        );
        const data = await response.json();

        if (data.positions && data.positions.length > 0) {
          setVehiclePositions(data.positions);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError(t("busLocationNotFound"));
        }
      } catch {
        setError(t("busLocationFetchFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehiclePositions();

    // Refresh every 10 seconds
    const interval = setInterval(fetchVehiclePositions, 10000);
    return () => clearInterval(interval);
  }, [isOpen, routeNumber, region, city, t]);

  // Fetch route geometry and stops when popup opens
  useEffect(() => {
    if (!isOpen || isPaywalled || !tripId) {
      setRouteGeometry([]);
      setRouteStops([]);
      return;
    }

    const fetchRouteGeometry = async () => {
      try {
        const response = await fetch(
          `/api/trip-pattern?tripId=${encodeURIComponent(tripId)}&region=${region}`
        );
        const data = await response.json();

        if (data.geometry && data.geometry.length > 0) {
          setRouteGeometry(data.geometry);
        }
        if (data.stops && data.stops.length > 0) {
          setRouteStops(data.stops);
        }
      } catch {
        // Silently fail - route line is optional
        console.error("Failed to fetch route geometry");
      }
    };

    fetchRouteGeometry();
  }, [isOpen, isPaywalled, tripId, region]);

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
    // Paywall animation styles
    const paywallAnimationStyles = `
      @keyframes paywall-pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
      }
      @keyframes paywall-ring {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" style={{ touchAction: 'none' }}>
        <style dangerouslySetInnerHTML={{ __html: paywallAnimationStyles }} />
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header - same as regular view */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: routeColor }}
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

          {/* Map Preview - visible but blurred with buses */}
          <div className="h-80 relative overflow-hidden">
            {/* Actual map with bus positions */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              <MapContainer
                center={[stopLat, stopLon]}
                zoom={14}
                className="h-full w-full"
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                keyboard={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Show stop marker */}
                <Marker position={[stopLat, stopLon]} icon={stopIcon} />

                {/* Show bus markers with pulse animation */}
                {vehiclePositions.map((vehicle, index) => (
                  <Marker
                    key={vehicle.vehicleRef || index}
                    position={[vehicle.lat, vehicle.lon]}
                    icon={createBusIcon(routeColor, vehicle.bearing, index === 0)}
                  />
                ))}
              </MapContainer>
            </div>

            {/* Blur overlay */}
            <div
              className="absolute inset-0 backdrop-blur-[6px] bg-white/30 pointer-events-none"
              style={{ zIndex: 1000 }}
            />

            {/* Shimmer effect */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ zIndex: 1001 }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ animation: 'shimmer 2.5s ease-in-out infinite' }}
              />
            </div>

            {/* Paywall CTA overlay */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ zIndex: 1002 }}
            >
              <div
                className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center mb-4"
                style={{ boxShadow: `0 4px 20px ${routeColor}40` }}
              >
                <Lock className="w-6 h-6" style={{ color: routeColor }} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">
                {t("paywallTitle")}
              </h3>

              <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">
                {vehiclePositions.length > 0
                  ? t("paywallBusesFound", { count: vehiclePositions.length })
                  : t("paywallDescription", { limit: FREE_TRIAL_LIMIT })}
              </p>

              <a
                href="/plus"
                className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-lg inline-block"
                style={{ backgroundColor: routeColor }}
              >
                {t("unlockMap")}
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t">
            <p className="text-center text-gray-400 text-xs">
              {t("paywallFooter")}
            </p>
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

        {/* Custom styles for Leaflet popups/tooltips */}
        <style dangerouslySetInnerHTML={{ __html: customMapStyles }} />

        {/* Map Container */}
        <div className="h-80 relative" style={{ touchAction: 'manipulation' }}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-600 text-sm">{t("loadingMap")}</span>
              </div>
            </div>
          )}

          <MapContainer
            center={[stopLat, stopLon]}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
            markerZoomAnimation={false}
            preferCanvas={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route polyline - drawn first so it appears behind markers */}
            {routeGeometry.length > 0 && (
              <Polyline
                positions={routeGeometry.map(point => [point.lat, point.lon] as [number, number])}
                pathOptions={{
                  color: routeColor,
                  weight: 4,
                  opacity: 0.7,
                }}
              />
            )}

            {/* Route stop dots */}
            {routeStops.map((stop) => (
              <CircleMarker
                key={stop.gtfsId}
                center={[stop.lat, stop.lon]}
                radius={5}
                pathOptions={{
                  color: routeColor,
                  fillColor: 'white',
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -5]}
                  className="minimal-tooltip"
                >
                  {stop.name}
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Stop marker */}
            <Marker position={[stopLat, stopLon]} icon={stopIcon}>
              <Popup className="compact-popup" closeButton={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>{stopName}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${stopLat},${stopLon}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                    {t("directions")}
                  </a>
                </div>
              </Popup>
            </Marker>

            {/* User location marker */}
            <Marker position={[userLat, userLon]} icon={userIcon}>
              <Tooltip
                direction="top"
                offset={[0, -15]}
                className="minimal-tooltip"
              >
                {t("yourLocation")}
              </Tooltip>
            </Marker>

            {/* Bus markers */}
            {(() => {
              // Find the selected bus (matches arrival time) or fall back to next bus
              const selectedBusIndex = findSelectedBusIndex(vehiclePositions, stopCode, expectedArrivalMins, stopLat, stopLon);

              return vehiclePositions.map((vehicle, index) => {
                const arrivalMins = findArrivalAtStop(vehicle, stopCode);
                const isSelectedBus = index === selectedBusIndex;

                return (
                  <Marker
                    key={vehicle.vehicleRef || index}
                    position={[vehicle.lat, vehicle.lon]}
                    icon={createBusIcon(routeColor, vehicle.bearing, isSelectedBus)}
                    ref={(marker) => {
                      // Auto-open popup for the selected bus (only once when first loaded)
                      if (isSelectedBus && marker && !hasAutoOpenedPopup.current) {
                        hasAutoOpenedPopup.current = true;
                        setTimeout(() => marker.openPopup(), 100);
                      }
                    }}
                  >
                    <Popup className="compact-popup" closeButton={false}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontWeight: 700,
                          color: 'white',
                          fontSize: '12px',
                          backgroundColor: routeColor,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}>{routeNumber}</span>
                        {arrivalMins !== null ? (
                          <span style={{
                            fontSize: '12px',
                            color: '#15803d',
                            fontWeight: 600,
                            backgroundColor: '#dcfce7',
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}>
                            {arrivalMins === 0 ? t("now") : `${arrivalMins} min`}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            fontWeight: 500,
                          }}>
                            {t("onTheWay")}
                          </span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            })()}

            <FitBoundsOnce
              stopLat={stopLat}
              stopLon={stopLon}
              stopCode={stopCode}
              expectedArrivalMins={expectedArrivalMins}
              userLat={userLat}
              userLon={userLon}
              vehiclePositions={vehiclePositions}
            />

            <ClosePopupOnDrag />
          </MapContainer>
        </div>

        {/* Trial Banner - show when using free trial */}
        {!hasPlusAccess && hasTrialsLeft && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200" style={{ touchAction: 'none' }}>
            <div className="flex items-center justify-between">
              <p className="text-amber-800 text-xs">
                {t("freeTrialRemaining", { remaining: remainingTrials })}
              </p>
              <a
                href="/plus"
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
              >
                {t("getPlus")}
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
                <span>{t("bus")} ({vehiclePositions.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-5 relative">
                  <div className="absolute inset-x-0 top-0 h-4 bg-amber-400 border border-amber-600 rounded-sm flex items-center justify-center">
                    <Bus className="w-2.5 h-2.5 text-amber-700" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1.5 bg-gray-500 rounded-b-sm"></div>
                </div>
                <span>{t("stop")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 relative">
                  <div className="absolute inset-0 bg-white rounded-full border-2 border-blue-500"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span>{t("you")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
