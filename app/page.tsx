"use client";

import { useState, useEffect } from "react";
import { Navigation, Search, X, MapPin, RefreshCw, LocateFixed } from "lucide-react";

interface StopTime {
  scheduledDeparture: number;
  realtimeDeparture: number;
  departureDelay: number;
  realtime: boolean;
  realtimeState: string;
  serviceDay: number;
  headsign: string;
  trip: {
    route: {
      shortName: string;
      mode: string;
      color?: string;
    };
  };
}

interface Stop {
  gtfsId: string;
  name: string;
  code?: string;
  platformCode?: string;
  lat: number;
  lon: number;
  stoptimesWithoutPatterns: StopTime[];
}

interface StopNode {
  stop: Stop;
  distance: number;
}

interface Departure {
  routeNumber: string;
  color: string;
  headsign: string;
  minutesUntil: number;
  departureTime: string; // Formatted as "HH:MM"
  distance: number;
  stopLat: number;
  stopLon: number;
  key: string;
}

type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "success"; coords: { lat: number; lng: number } }
  | { status: "denied" };

interface GeocodedLocation {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    id: string;
    name: string;
    label: string;
    locality?: string;
    region?: string;
  };
}

function getMinutesUntil(serviceDay: number, departureSeconds: number): number {
  const departureTime = (serviceDay + departureSeconds) * 1000;
  const now = Date.now();
  return Math.round((departureTime - now) / 60000);
}

function formatDepartureTime(serviceDay: number, departureSeconds: number): string {
  const departureTime = new Date((serviceDay + departureSeconds) * 1000);
  const hours = departureTime.getHours().toString().padStart(2, '0');
  const minutes = departureTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

const STORAGE_KEY = "nysse-saved-location";

// Region bounding boxes for transit authorities
const REGION_BOUNDS = {
  uusimaa: { minLat: 59.9, maxLat: 60.7, minLon: 23.5, maxLon: 26.0 }, // HSL area
  tampere: { minLat: 61.3, maxLat: 61.7, minLon: 23.3, maxLon: 24.2 }, // Pirkanmaa/Nysse
  jyvaskyla: { minLat: 62.1, maxLat: 62.4, minLon: 25.5, maxLon: 26.0 }, // Linkki
  turku: { minLat: 60.3, maxLat: 60.6, minLon: 22.0, maxLon: 22.8 }, // Föli
  oulu: { minLat: 64.8, maxLat: 65.2, minLon: 25.2, maxLon: 25.9 }, // Oulu
};

const REGION_COLORS: Record<string, string> = {
  uusimaa: "#007AC9", // HSL blue
  tampere: "#1b57cf", // Nysse blue
  jyvaskyla: "#009640", // Linkki green
  turku: "#00A651", // Föli green
  oulu: "#E4032E", // Oulu red
  default: "#1b57cf", // Fallback to Nysse blue
};

function isInBounds(
  lat: number,
  lon: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): boolean {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
}

function getRegion(lat: number, lon: number): "hsl" | "waltti" {
  if (isInBounds(lat, lon, REGION_BOUNDS.uusimaa)) {
    return "hsl";
  }
  return "waltti";
}

function getRegionColor(lat: number, lon: number): string {
  for (const [region, bounds] of Object.entries(REGION_BOUNDS)) {
    if (isInBounds(lat, lon, bounds)) {
      return REGION_COLORS[region];
    }
  }
  return REGION_COLORS.default;
}

export default function Home() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const MAX_DEPARTURES = 20;
  const [radius, setRadius] = useState(500);
  const [debouncedRadius, setDebouncedRadius] = useState(500);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchedLocationName, setSearchedLocationName] = useState<string | null>(null);

  // Get the theme color based on current location
  const themeColor =
    location.status === "success"
      ? getRegionColor(location.coords.lat, location.coords.lng)
      : REGION_COLORS.default;

  // Load saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const coords = JSON.parse(saved) as { lat: number; lng: number };
        setLocation({ status: "success", coords });
        fetchNearbyStops(coords.lat, coords.lng);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const fetchNearbyStops = async (lat: number, lng: number, searchRadius: number = radius) => {
    setError(null);
    const region = getRegion(lat, lng);
    try {
      const response = await fetch(
        `/api/stops?lat=${lat}&lon=${lng}&radius=${searchRadius}&region=${region}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stops");
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
            allDepartures.push({
              routeNumber: st.trip.route.shortName,
              color: st.trip.route.color ? `#${st.trip.route.color}` : "#1e40af",
              headsign: st.headsign,
              minutesUntil: minutes,
              departureTime: formatDepartureTime(st.serviceDay, st.realtimeDeparture),
              distance: node.distance,
              stopLat: node.stop.lat,
              stopLon: node.stop.lon,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stops");
    }
  };

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
      },
      () => {
        setLocation({ status: "denied" });
      }
    );
  };

  // Search for locations by name
  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?text=${encodeURIComponent(query)}&size=5`);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const features: GeocodedLocation[] = data.features || [];
      setSearchResults(features);
      setShowSearchResults(features.length > 0);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle location selection from search
  const selectSearchedLocation = (location: GeocodedLocation) => {
    const [lon, lat] = location.geometry.coordinates;
    const coords = { lat, lng: lon };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
    setLocation({ status: "success", coords });
    setSearchedLocationName(location.properties.label);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    fetchNearbyStops(lat, lon);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocations(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounced radius - delays server calls by 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(radius);
    }, 1000);

    return () => clearTimeout(timer);
  }, [radius]);

  // Fetch when debounced radius changes
  useEffect(() => {
    if (location.status !== "success") return;
    fetchNearbyStops(location.coords.lat, location.coords.lng, debouncedRadius);
    setRefreshCountdown(30);
  }, [debouncedRadius]);

  // Auto-refresh departures every 30 seconds
  useEffect(() => {
    if (location.status !== "success") return;

    const interval = setInterval(() => {
      fetchNearbyStops(location.coords.lat, location.coords.lng, debouncedRadius);
      setRefreshCountdown(30);
    }, 30000);

    return () => clearInterval(interval);
  }, [location, debouncedRadius]);

  // Countdown timer
  useEffect(() => {
    if (location.status !== "success") return;

    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [location]);

  return (
    <main
      className="min-h-screen p-6 sm:p-10 transition-colors duration-500 relative"
      style={{ backgroundColor: themeColor }}
    >
      {location.status === "success" && (
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 h-6 sm:h-8 flex items-center text-white/60 text-xs sm:text-sm font-medium">
          Päivittyy {refreshCountdown} s kuluttua
        </div>
      )}
      <div className="max-w-2xl mx-auto pt-6">
        {/* Logo */}
        <div className="absolute top-[11px] left-3 sm:top-[23px] sm:left-6 flex items-center gap-2">
          <img
            src="/white%20logo%20bus.png"
            alt="SeuraavaBussi logo"
            className="h-6 sm:h-8"
          />
          <span className="text-white font-bold text-lg sm:text-xl">
            SeuraavaBussi.fi
          </span>
        </div>

        {location.status === "idle" && (
          <div className="flex flex-col items-center gap-8 py-16">
            <p className="text-white/80 text-center font-bold text-2xl sm:text-3xl">
              To show nearby departures, the app need your location
            </p>
            <button
              onClick={requestLocation}
              className="rounded-full bg-white px-10 py-5 font-extrabold text-xl sm:text-2xl transition-all hover:opacity-90"
              style={{ color: themeColor }}
            >
              Share My Location
            </button>
            <div className="w-full max-w-md mt-4">
              <p className="text-white/60 text-center text-sm mb-3">tai hae paikan nimellä</p>
              <div className="relative">
                <div className="flex items-center bg-white/20 rounded-xl px-4 py-3">
                  <Search className="w-5 h-5 text-white/60 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hae paikkaa..."
                    className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                </div>
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
                    {searchResults.map((result) => (
                      <button
                        key={result.properties.id}
                        onClick={() => selectSearchedLocation(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-800 text-sm truncate">
                          {result.properties.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4 text-center text-gray-500 text-sm">
                    Haetaan...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {location.status === "requesting" && (
          <p className="py-16 text-white/80 text-center font-bold text-2xl sm:text-3xl">
            Requesting location...
          </p>
        )}

        {location.status === "denied" && (
          <div className="flex flex-col items-center gap-8 py-16">
            <p className="text-white/80 text-center font-bold text-2xl sm:text-3xl">
              Hae lähtöjä paikan nimellä
            </p>
            <div className="w-full max-w-md">
              <div className="relative">
                <div className="flex items-center bg-white/20 rounded-xl px-4 py-3">
                  <Search className="w-5 h-5 text-white/60 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hae paikkaa..."
                    className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                </div>
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
                    {searchResults.map((result) => (
                      <button
                        key={result.properties.id}
                        onClick={() => selectSearchedLocation(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-800 text-sm truncate">
                          {result.properties.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4 text-center text-gray-500 text-sm">
                    Haetaan...
                  </div>
                )}
              </div>
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
          <div className="w-full p-6 rounded-xl bg-red-500/20 text-white font-bold text-base sm:text-xl mb-6">
            {error}
          </div>
        )}

        {location.status === "success" &&
          departures.length === 0 &&
          !error && (
            <p className="py-12 text-white/80 text-center font-bold text-2xl sm:text-3xl">
              No departures found nearby
            </p>
          )}

        {departures.length > 0 && (
          <div className="flex flex-col">
            {departures.slice(0, MAX_DEPARTURES).map((dep) => (
              <div
                key={dep.key}
                className="flex items-center gap-2 sm:gap-5 py-3 sm:py-5 border-b-2 border-white/20"
              >
                <span
                  className="font-black min-w-[2.5rem] sm:min-w-[5rem] px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-center text-white text-sm sm:text-2xl"
                  style={{ backgroundColor: dep.color }}
                >
                  {dep.routeNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-bold text-base sm:text-2xl truncate block">
                    {dep.headsign}
                  </span>
                  <span className="text-white/50 text-[10px] sm:text-sm">
                    {dep.distance}m päässä
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-white font-extrabold text-base sm:text-3xl whitespace-nowrap">
                    {dep.minutesUntil === 0
                      ? "Now"
                      : dep.minutesUntil === 1
                        ? "1 min"
                        : `${dep.minutesUntil} min`}
                  </span>
                  <span className="text-white/50 text-[10px] sm:text-xs">
                    {dep.departureTime}
                  </span>
                </div>
                {location.status === "success" && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${location.coords.lat},${location.coords.lng}&destination=${dep.stopLat},${dep.stopLon}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    title="Get directions to stop"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Pysäkille</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {location.status === "success" && (
          <div className="mt-8 flex flex-col gap-6 items-center">
            <div className="flex gap-6 justify-center">
              <button
                onClick={() => {
                  fetchNearbyStops(location.coords.lat, location.coords.lng);
                  setRefreshCountdown(30);
                }}
                className="text-white/70 hover:text-white font-bold transition-colors text-base sm:text-xl flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                Päivitä
              </button>
              <button
                onClick={requestLocation}
                className="text-white/70 hover:text-white font-bold transition-colors text-base sm:text-xl flex items-center gap-2"
              >
                <LocateFixed className="w-4 h-4 sm:w-5 sm:h-5" />
                Päivitä sijainti
              </button>
            </div>
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <label className="text-white/70 font-bold text-sm sm:text-base">
                Hakusäde: {radius} m
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between w-full text-white/50 text-xs">
                <span>100m</span>
                <span>2000m</span>
              </div>
            </div>
          </div>
        )}

        {location.status === "success" && (
          <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            {searchedLocationName && (
              <p className="text-white/60 text-sm text-center">
                Näytetään lähdöt lähellä: <span className="font-semibold text-white/80">{searchedLocationName}</span>
              </p>
            )}
            <p className="text-white/70 font-bold text-sm">Hae toinen paikka</p>
            <div className="relative w-full">
              <div className="flex items-center bg-white/20 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-white/60 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hae paikkaa..."
                  className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                )}
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
                  {searchResults.map((result) => (
                    <button
                      key={result.properties.id}
                      onClick={() => selectSearchedLocation(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 border-b border-gray-100 last:border-0"
                    >
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800 text-sm truncate">
                        {result.properties.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4 text-center text-gray-500 text-sm">
                  Haetaan...
                </div>
              )}
            </div>
          </div>
        )}

        {location.status === "success" && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-white/70 font-bold text-base sm:text-lg">
              Tue sovellusta
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.buymeacoffee.com/zhiyuanliu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FFDD00", color: "#000000" }}
              >
                <img
                  src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                  alt="Buy Me a Coffee"
                  className="h-5 w-5"
                />
                Kahvi
              </a>
              <a
                href="https://qr.mobilepay.fi/box/446331ce-7196-49a7-8850-c0234677a0d2/pay-in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-base text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#5A78FF" }}
              >
                <img
                  src="/mobilepayicon.jpeg"
                  alt="MobilePay"
                  className="h-8 rounded"
                />
                Bussilippu
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
