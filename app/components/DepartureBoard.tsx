"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, RefreshCw, MapPin } from "lucide-react";
import {
  Departure,
  StopNode,
  LocationState,
  GeocodedLocation,
  REGION_COLORS,
  HSL_MODE_COLORS,
} from "@/app/lib/types";
import {
  STORAGE_KEY,
  RADIUS_STORAGE_KEY,
  getMinutesUntil,
  formatDepartureTime,
  getRegion,
  getRegionColor,
} from "@/app/lib/utils";
import SearchInput from "./SearchInput";
import DepartureRow, { DepartureRowSkeleton } from "./DepartureRow";

// Dynamic import to avoid SSR issues with Leaflet
const BusMapPopup = dynamic(() => import("./BusMapPopup"), {
  ssr: false,
  loading: () => null,
});

// Data needed to show the bus map popup
interface PopupData {
  routeNumber: string;
  headsign: string;
  routeColor: string;
  stopLat: number;
  stopLon: number;
}

const MAX_DEPARTURES = 20;

interface DepartureBoardProps {
  onThemeColorChange?: (color: string) => void;
}

export default function DepartureBoard({ onThemeColorChange }: DepartureBoardProps) {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RADIUS_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 100 && parsed <= 2000) {
          return parsed;
        }
      }
    }
    return 500;
  });
  const [debouncedRadius, setDebouncedRadius] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RADIUS_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 100 && parsed <= 2000) {
          return parsed;
        }
      }
    }
    return 500;
  });
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [searchedLocationName, setSearchedLocationName] = useState<string | null>(null);
  const [gpsLocationName, setGpsLocationName] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<PopupData | null>(null);

  // Handler for opening the bus map popup - stores data so popup persists even if bus disappears
  const handleOpenMap = useCallback((data: PopupData) => {
    setPopupData(data);
  }, []);

  const handleCloseMap = useCallback(() => {
    setPopupData(null);
  }, []);

  // Get the theme color based on current location
  const themeColor =
    location.status === "success"
      ? getRegionColor(location.coords.lat, location.coords.lng)
      : REGION_COLORS.default;

  // Notify parent of theme color changes
  useEffect(() => {
    onThemeColorChange?.(themeColor);
  }, [themeColor, onThemeColorChange]);

  // Fetch reverse geocode to get location name from coordinates
  const fetchLocationName = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          setGpsLocationName(data.name);
        } else if (data.label) {
          // Use first part of label if name not available
          setGpsLocationName(data.label.split(",")[0]);
        }
      }
    } catch {
      // Silently fail - showing coordinates is fine as fallback
    }
  }, []);

  const fetchNearbyStops = useCallback(
    async (lat: number, lng: number, searchRadius: number = radius) => {
      setError(null);
      setIsLoadingDepartures(true);
      const region = getRegion(lat, lng);
      let response: Response;
      try {
        response = await fetch(
          `/api/stops?lat=${lat}&lon=${lng}&radius=${searchRadius}&region=${region}`
        );
      } catch {
        // Network error - fetch itself failed (no internet, DNS failure, etc.)
        setError("Pysäkkien haku epäonnistui. Tarkista verkkoyhteytesi.");
        setIsLoadingDepartures(false);
        return;
      }

      try {
        if (!response.ok) {
          // Check if it's a network error (503 from our API)
          if (response.status === 503) {
            setError("Pysäkkien haku epäonnistui. Tarkista verkkoyhteytesi.");
          } else {
            setError("Pysäkkien haku epäonnistui. Yritä myöhemmin uudelleen.");
          }
          setIsLoadingDepartures(false);
          return;
        }
        const data = await response.json();
        const stopNodes: StopNode[] =
          data.data?.stopsByRadius?.edges?.map(
            (edge: { node: StopNode }) => edge.node
          ) || [];

        // Flatten all departures into a single list
        const allDepartures: Departure[] = [];
        stopNodes.forEach((node) => {
          node.stop.stoptimesWithoutPatterns.forEach((st, idx) => {
            const minutes = getMinutesUntil(st.serviceDay, st.realtimeDeparture);
            if (minutes >= 0 && minutes <= 120) {
              // Determine route color: use route color if available, otherwise use mode-based colors for HSL
              const routeColor = st.trip.route.color
                ? `#${st.trip.route.color}`
                : region === "hsl"
                  ? HSL_MODE_COLORS[st.trip.route.mode] || HSL_MODE_COLORS.BUS
                  : "#1e40af";
              allDepartures.push({
                routeNumber: st.trip.route.shortName,
                color: routeColor,
                headsign: st.headsign,
                minutesUntil: minutes,
                departureTime: formatDepartureTime(st.serviceDay, st.realtimeDeparture),
                distance: node.distance,
                stopLat: node.stop.lat,
                stopLon: node.stop.lon,
                stopName: node.stop.name,
                key: `${node.stop.gtfsId}-${st.trip.route.shortName}-${st.serviceDay}-${st.scheduledDeparture}-${idx}`,
              });
            }
          });
        });

        // Deduplicate: for each route+headsign, find the closest stop
        const closestStopDistance = new Map<string, number>();
        allDepartures.forEach((dep) => {
          const routeKey = `${dep.routeNumber}-${dep.headsign}`;
          const existing = closestStopDistance.get(routeKey);
          if (existing === undefined || dep.distance < existing) {
            closestStopDistance.set(routeKey, dep.distance);
          }
        });

        // Keep all departures from the closest stop for each route+headsign
        const dedupedDepartures = allDepartures.filter((dep) => {
          const routeKey = `${dep.routeNumber}-${dep.headsign}`;
          return dep.distance === closestStopDistance.get(routeKey);
        });

        // Sort by time
        dedupedDepartures.sort((a, b) => a.minutesUntil - b.minutesUntil);
        setDepartures(dedupedDepartures);
        setIsLoadingDepartures(false);
      } catch {
        setError("Pysäkkien haku epäonnistui. Yritä myöhemmin uudelleen.");
        setIsLoadingDepartures(false);
      }
    },
    [radius]
  );

  // Load location on mount - try fresh GPS if permission granted, otherwise use saved
  useEffect(() => {
    const loadLocation = async () => {
      // Check if geolocation permission is already granted
      if (navigator.permissions && navigator.geolocation) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });

          if (permission.state === 'granted') {
            // Permission already granted - get fresh location
            setLocation({ status: "requesting" });
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
                setLocation({ status: "success", coords });
                setSearchedLocationName(null);
                fetchNearbyStops(coords.lat, coords.lng);
                fetchLocationName(coords.lat, coords.lng);
              },
              () => {
                // GPS failed, fall back to saved location
                loadSavedLocation();
              }
            );
            return;
          }
        } catch {
          // Permissions API not supported, fall back to saved
        }
      }

      // Fall back to saved location
      loadSavedLocation();
    };

    const loadSavedLocation = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const coords = JSON.parse(saved) as { lat: number; lng: number };
          setLocation({ status: "success", coords });
          fetchNearbyStops(coords.lat, coords.lng);
          fetchLocationName(coords.lat, coords.lng);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    loadLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocation({ status: "denied" });
      return;
    }

    setLocation({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        setLocation({ status: "success", coords });
        setSearchedLocationName(null);
        fetchNearbyStops(coords.lat, coords.lng);
        fetchLocationName(coords.lat, coords.lng);
      },
      () => {
        setLocation({ status: "denied" });
      }
    );
  };

  const handleLocationSelect = (geocodedLocation: GeocodedLocation) => {
    const [lon, lat] = geocodedLocation.geometry.coordinates;
    const coords = { lat, lng: lon };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
    setLocation({ status: "success", coords });
    setSearchedLocationName(geocodedLocation.properties.label);
    setGpsLocationName(null);
    fetchNearbyStops(lat, lon);
  };

  // Debounced radius - delays server calls by 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(radius);
      // Save radius to localStorage when debounced
      localStorage.setItem(RADIUS_STORAGE_KEY, radius.toString());
    }, 1000);

    return () => clearTimeout(timer);
  }, [radius]);

  // Fetch when debounced radius changes
  useEffect(() => {
    if (location.status !== "success") return;
    fetchNearbyStops(location.coords.lat, location.coords.lng, debouncedRadius);
    setRefreshCountdown(30);
  }, [debouncedRadius, location, fetchNearbyStops]);

  // Auto-refresh departures every 30 seconds
  useEffect(() => {
    if (location.status !== "success") return;

    const interval = setInterval(() => {
      fetchNearbyStops(location.coords.lat, location.coords.lng, debouncedRadius);
      setRefreshCountdown(30);
    }, 30000);

    return () => clearInterval(interval);
  }, [location, debouncedRadius, fetchNearbyStops]);

  // Countdown timer
  useEffect(() => {
    if (location.status !== "success") return;

    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [location]);

  return (
    <>
      {location.status === "success" && (
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 h-6 sm:h-8 flex items-center text-white/60 text-xs sm:text-sm font-medium">
          Päivittyy {refreshCountdown} s kuluttua
        </div>
      )}

      {location.status === "idle" && (
        <div className="flex flex-col items-center gap-6 py-12">
          <p className="text-white/80 text-center font-bold text-xl sm:text-2xl">
            Näytä lähistön bussit ja ratikat
          </p>

          {/* Search - primary option */}
          <div className="w-full max-w-md">
            <SearchInput onLocationSelect={handleLocationSelect} />
          </div>

          <div className="flex items-center gap-4 text-white/50 text-sm">
            <span className="h-px w-12 bg-white/30" />
            <span>tai</span>
            <span className="h-px w-12 bg-white/30" />
          </div>

          {/* Location - secondary option */}
          <button
            onClick={requestLocation}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 font-bold text-base text-white transition-all hover:bg-white/30"
          >
            <LocateFixed className="w-4 h-4" />
            Käytä sijaintia
          </button>

          <a
            href="/tietosuoja"
            className="text-white/50 text-xs underline hover:text-white/70 transition-colors mt-4"
          >
            Tietosuojaseloste
          </a>
        </div>
      )}

      {location.status === "requesting" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="relative">
            <LocateFixed className="w-8 h-8 text-white/80 animate-pulse" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
          </div>
          <p className="text-white/60 text-center font-medium text-base">
            Haetaan sijaintia...
          </p>
        </div>
      )}

      {location.status === "denied" && (
        <div className="flex flex-col items-center gap-8 py-16">
          <p className="text-white/80 text-center font-bold text-2xl sm:text-3xl">
            Hae lähtöjä paikan nimellä
          </p>
          <div className="w-full max-w-md">
            <SearchInput onLocationSelect={handleLocationSelect} />
          </div>
          <div className="flex items-center gap-4 text-white/50 text-sm">
            <span className="h-px w-12 bg-white/30" />
            <span>tai</span>
            <span className="h-px w-12 bg-white/30" />
          </div>
          <button
            onClick={requestLocation}
            className="rounded-full bg-white/20 px-8 py-4 font-bold text-lg text-white transition-all hover:bg-white/30"
          >
            Käytä sijaintia
          </button>
        </div>
      )}

      {error && (
        <div className="w-full p-6 rounded-xl bg-black/80 text-white font-bold text-base sm:text-xl mb-6">
          {error}
        </div>
      )}

      {/* Skeleton loading state */}
      {location.status === "success" && isLoadingDepartures && departures.length === 0 && !error && (
        <div className="flex flex-col">
          <div className="flex justify-end mb-4">
            <div className="h-8 w-40 bg-white/10 rounded-full animate-pulse" />
          </div>
          {[...Array(12)].map((_, i) => (
            <DepartureRowSkeleton key={i} />
          ))}
        </div>
      )}

      {location.status === "success" && departures.length === 0 && !error && !isLoadingDepartures && (
        <p className="py-12 text-white/80 text-center font-bold text-2xl sm:text-3xl">
          Lähistöltä ei löytynyt lähtöjä
        </p>
      )}

      {departures.length > 0 && location.status === "success" && (
        <div className="flex flex-col">
          <div className="flex justify-end mb-4 gap-2">
            {searchedLocationName ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-white/70">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium truncate max-w-[180px]">
                    {searchedLocationName.split(",")[0]}
                  </span>
                </div>
                <button
                  onClick={requestLocation}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full text-white/80 hover:text-white transition-all cursor-pointer"
                  title="Käytä sijaintiasi"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Käytä sijaintia</span>
                </button>
              </>
            ) : (
              <button
                onClick={requestLocation}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/70 hover:text-white transition-all cursor-pointer"
                title="Päivitä sijainti"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span className="text-xs font-medium truncate max-w-[180px]">
                  {gpsLocationName || "Sijaintisi"}
                </span>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {departures.slice(0, MAX_DEPARTURES).map((dep) => (
            <DepartureRow
              key={dep.key}
              departure={dep}
              userCoords={location.coords}
              region={getRegion(location.coords.lat, location.coords.lng)}
              onOpenMap={handleOpenMap}
            />
          ))}
        </div>
      )}

      {/* Controls Section */}
      {location.status === "success" && (
        <div className="mt-10 pt-8 border-t border-white/10">
          {/* Radius Slider */}
          <div className="flex flex-col items-center gap-2 w-full max-w-xs mx-auto mb-8">
            <label className="text-white/60 text-sm">
              Hakusäde: <span className="font-bold text-white/80">{radius} m</span>
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between w-full text-white/40 text-xs">
              <span>100m</span>
              <span>2000m</span>
            </div>
          </div>

          {/* Search Another Place */}
          <div className="w-full max-w-sm mx-auto">
            <p className="text-white/60 text-sm text-center mb-2">Hae toinen paikka</p>
            <SearchInput onLocationSelect={handleLocationSelect} />
          </div>
        </div>
      )}

      {/* Footer Section */}
      {location.status === "success" && (
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center gap-8">
          {/* For Companies */}
          <a
            href="/for-companies"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-bold text-base transition-all shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Hallintapaneeli yrityksille
          </a>

          {/* Support */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/50 text-sm">
              Tue sovellusta
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.buymeacoffee.com/zhiyuanliu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FFDD00", color: "#000000" }}
              >
                <img
                  src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                  alt="Buy Me a Coffee"
                  className="h-4 w-4"
                />
                Buy me a Coffee
              </a>
              <a
                href="https://qr.mobilepay.fi/box/446331ce-7196-49a7-8850-c0234677a0d2/pay-in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#5A78FF" }}
              >
                <img
                  src="/mobilepayicon.jpeg"
                  alt="MobilePay"
                  className="h-6 rounded"
                />
                Tue MobilePaylla
              </a>
            </div>
          </div>

          {/* Privacy Policy */}
          <a
            href="/tietosuoja"
            className="text-white/50 text-sm hover:text-white/70 transition-colors"
          >
            Tietosuojaseloste
          </a>
        </div>
      )}

      {/* Bus Map Popup - rendered at board level so it persists when bus disappears */}
      {location.status === "success" && popupData && (
        <BusMapPopup
          isOpen={true}
          onClose={handleCloseMap}
          routeNumber={popupData.routeNumber}
          headsign={popupData.headsign}
          routeColor={popupData.routeColor}
          stopLat={popupData.stopLat}
          stopLon={popupData.stopLon}
          userLat={location.coords.lat}
          userLon={location.coords.lng}
          region={getRegion(location.coords.lat, location.coords.lng)}
        />
      )}
    </>
  );
}
