"use client";

import { useState, useEffect } from "react";
import { Navigation } from "lucide-react";

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

function getMinutesUntil(serviceDay: number, departureSeconds: number): number {
  const departureTime = (serviceDay + departureSeconds) * 1000;
  const now = Date.now();
  return Math.round((departureTime - now) / 60000);
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
        fetchNearbyStops(coords.lat, coords.lng);
      },
      () => {
        setLocation({ status: "denied" });
      }
    );
  };

  // Auto-refresh departures every 30 seconds
  useEffect(() => {
    if (location.status !== "success") return;

    const interval = setInterval(() => {
      fetchNearbyStops(location.coords.lat, location.coords.lng, radius);
    }, 30000);

    return () => clearInterval(interval);
  }, [location, radius]);

  return (
    <main
      className="min-h-screen p-6 sm:p-10 transition-colors duration-500"
      style={{ backgroundColor: themeColor }}
    >
      <div className="max-w-2xl mx-auto">

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
              This app needs your location to show nearby departures
            </p>
            <p className="text-white/60 text-center text-base sm:text-lg max-w-md">
              Please allow location access when prompted, or check your browser settings if you previously blocked it
            </p>
            <button
              onClick={requestLocation}
              className="rounded-full bg-white px-10 py-5 font-extrabold text-xl sm:text-2xl transition-all hover:opacity-90"
              style={{ color: themeColor }}
            >
              Try Again
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
                <span className="text-white font-extrabold text-base sm:text-3xl whitespace-nowrap">
                  {dep.minutesUntil === 0
                    ? "Now"
                    : dep.minutesUntil === 1
                      ? "1 min"
                      : `${dep.minutesUntil} min`}
                </span>
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
                onClick={() =>
                  fetchNearbyStops(location.coords.lat, location.coords.lng)
                }
                className="text-white/70 hover:text-white font-bold transition-colors text-base sm:text-xl"
              >
                Refresh
              </button>
              <button
                onClick={requestLocation}
                className="text-white/70 hover:text-white font-bold transition-colors text-base sm:text-xl"
              >
                Update Location
              </button>
            </div>
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <label className="text-white/70 font-bold text-sm sm:text-base">
                Search Radius: {radius}m
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={radius}
                onChange={(e) => {
                  const newRadius = parseInt(e.target.value);
                  setRadius(newRadius);
                  fetchNearbyStops(location.coords.lat, location.coords.lng, newRadius);
                }}
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
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-white/70 font-bold text-base sm:text-lg">
              Buy me a coffee or a bus ticket if you like this app
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
                Coffee
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
                Bus Ticket
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
