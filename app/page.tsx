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
  | { status: "denied" }
  | { status: "manual"; address: string };

function getMinutesUntil(serviceDay: number, departureSeconds: number): number {
  const departureTime = (serviceDay + departureSeconds) * 1000;
  const now = Date.now();
  return Math.round((departureTime - now) / 60000);
}

const STORAGE_KEY = "nysse-saved-location";

export default function Home() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [manualInput, setManualInput] = useState("");
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [radius, setRadius] = useState(500);

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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stops?lat=${lat}&lon=${lng}&radius=${searchRadius}`
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
          if (minutes >= 0) {
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

      // Deduplicate: for each route+headsign, only keep the one from the closest stop
      const seen = new Map<string, Departure>();
      allDepartures.forEach((dep) => {
        const routeKey = `${dep.routeNumber}-${dep.headsign}`;
        const existing = seen.get(routeKey);
        if (!existing || dep.distance < existing.distance) {
          seen.set(routeKey, dep);
        }
      });
      const dedupedDepartures = Array.from(seen.values());

      // Sort by time
      dedupedDepartures.sort((a, b) => a.minutesUntil - b.minutesUntil);
      setDepartures(dedupedDepartures);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stops");
    } finally {
      setLoading(false);
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    // For manual input, we'd need geocoding. For now, show a message.
    // In production, integrate with a geocoding API
    setLocation({ status: "manual", address: manualInput.trim() });
    setError(
      "Manual location search requires geocoding. Please allow location access for full functionality."
    );
  };

  // Auto-refresh departures every 30 seconds
  useEffect(() => {
    if (location.status !== "success") return;

    const interval = setInterval(() => {
      fetchNearbyStops(location.coords.lat, location.coords.lng);
    }, 30000);

    return () => clearInterval(interval);
  }, [location]);

  return (
    <div
      className="min-h-screen p-6 sm:p-10"
      style={{ backgroundColor: "#1b57cf" }}
    >
      <div className="max-w-2xl mx-auto">
        {location.status === "idle" && (
          <div className="flex flex-col items-center gap-8 py-16">
            <p className="text-white/80 text-center font-bold text-2xl sm:text-3xl">
              To show nearby departures, we need your location
            </p>
            <button
              onClick={requestLocation}
              className="rounded-full bg-white px-10 py-5 font-extrabold text-xl sm:text-2xl transition-opacity hover:opacity-90"
              style={{ color: "#1b57cf" }}
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
          <div className="flex flex-col items-center gap-6 w-full py-12">
            <p className="text-white/80 text-center font-bold text-xl sm:text-2xl">
              Location access denied. Please enter your location:
            </p>
            <form
              onSubmit={handleManualSubmit}
              className="flex flex-col gap-5 w-full"
            >
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter address or city"
                className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-6 py-5 text-white text-xl sm:text-2xl placeholder:text-white/50 focus:border-white/50 focus:outline-none font-bold"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-10 py-5 font-extrabold text-xl sm:text-2xl transition-opacity hover:opacity-90"
                style={{ color: "#1b57cf" }}
              >
                Use This Location
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="w-full p-6 rounded-xl bg-red-500/20 text-white font-bold text-base sm:text-xl mb-6">
            {error}
          </div>
        )}

        {loading && (
          <p className="py-12 text-white/80 text-center font-bold text-2xl sm:text-3xl">
            Loading...
          </p>
        )}

        {location.status === "success" &&
          !loading &&
          departures.length === 0 &&
          !error && (
            <p className="py-12 text-white/80 text-center font-bold text-2xl sm:text-3xl">
              No departures found nearby
            </p>
          )}

        {departures.length > 0 && (
          <div className="flex flex-col">
            {departures.slice(0, displayLimit).map((dep) => (
              <div
                key={dep.key}
                className="flex items-center gap-3 sm:gap-5 py-4 sm:py-5 border-b border-white/20"
              >
                <span
                  className="font-black min-w-[4rem] sm:min-w-[5rem] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-center text-white text-lg sm:text-2xl"
                  style={{ backgroundColor: dep.color }}
                >
                  {dep.routeNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-bold text-lg sm:text-2xl truncate block">
                    {dep.headsign}
                  </span>
                  <span className="text-white/50 text-xs sm:text-sm">
                    {dep.distance}m away
                  </span>
                </div>
                <span className="text-white font-extrabold text-xl sm:text-3xl whitespace-nowrap">
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
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    title="Get directions to stop"
                  >
                    <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                )}
              </div>
            ))}
            <div className="flex justify-center gap-6 pt-6">
              {displayLimit > 10 && (
                <button
                  onClick={() => setDisplayLimit((prev) => Math.max(10, prev - 10))}
                  className="text-white/70 hover:text-white font-bold transition-colors text-base sm:text-xl"
                >
                  Show Less
                </button>
              )}
              {departures.length > displayLimit && (
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 10)}
                  className="text-white/70 hover:text-white font-bold transition-colors text-base sm:text-xl"
                >
                  Show More ({departures.length - displayLimit} remaining)
                </button>
              )}
            </div>
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
      </div>
    </div>
  );
}
