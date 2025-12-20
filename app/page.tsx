"use client";

import { useState, useEffect } from "react";

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

  const fetchNearbyStops = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stops?lat=${lat}&lon=${lng}&radius=500`
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
              key: `${node.stop.gtfsId}-${st.trip.route.shortName}-${st.serviceDay}-${st.scheduledDeparture}-${idx}`,
            });
          }
        });
      });

      // Sort by time
      allDepartures.sort((a, b) => a.minutesUntil - b.minutesUntil);
      setDepartures(allDepartures);
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
            <p className="text-white/80 text-center font-bold text-3xl">
              To show nearby departures, we need your location
            </p>
            <button
              onClick={requestLocation}
              className="rounded-full bg-white px-10 py-5 font-extrabold text-2xl transition-opacity hover:opacity-90"
              style={{ color: "#1b57cf" }}
            >
              Share My Location
            </button>
          </div>
        )}

        {location.status === "requesting" && (
          <p className="py-16 text-white/80 text-center font-bold text-3xl">
            Requesting location...
          </p>
        )}

        {location.status === "denied" && (
          <div className="flex flex-col items-center gap-6 w-full py-12">
            <p className="text-white/80 text-center font-bold text-2xl">
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
                className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-6 py-5 text-white text-2xl placeholder:text-white/50 focus:border-white/50 focus:outline-none font-bold"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-10 py-5 font-extrabold text-2xl transition-opacity hover:opacity-90"
                style={{ color: "#1b57cf" }}
              >
                Use This Location
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="w-full p-6 rounded-xl bg-red-500/20 text-white font-bold text-xl mb-6">
            {error}
          </div>
        )}

        {loading && (
          <p className="py-12 text-white/80 text-center font-bold text-3xl">
            Loading...
          </p>
        )}

        {location.status === "success" &&
          !loading &&
          departures.length === 0 &&
          !error && (
            <p className="py-12 text-white/80 text-center font-bold text-3xl">
              No departures found nearby
            </p>
          )}

        {departures.length > 0 && (
          <div className="flex flex-col">
            {departures.slice(0, displayLimit).map((dep) => (
              <div
                key={dep.key}
                className="flex items-center gap-5 py-5 border-b border-white/20"
              >
                <span
                  className="font-black min-w-[5rem] px-4 py-2 rounded-lg text-center text-white text-2xl"
                  style={{ backgroundColor: dep.color }}
                >
                  {dep.routeNumber}
                </span>
                <span className="flex-1 text-white font-bold text-2xl truncate">
                  {dep.headsign}
                </span>
                <span className="text-white font-extrabold text-3xl whitespace-nowrap">
                  {dep.minutesUntil === 0
                    ? "Now"
                    : dep.minutesUntil === 1
                      ? "1 min"
                      : `${dep.minutesUntil} min`}
                </span>
              </div>
            ))}
            <div className="flex justify-center gap-6 pt-6">
              {displayLimit > 10 && (
                <button
                  onClick={() => setDisplayLimit((prev) => Math.max(10, prev - 10))}
                  className="text-white/70 hover:text-white font-bold transition-colors text-xl"
                >
                  Show Less
                </button>
              )}
              {departures.length > displayLimit && (
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 10)}
                  className="text-white/70 hover:text-white font-bold transition-colors text-xl"
                >
                  Show More ({departures.length - displayLimit} remaining)
                </button>
              )}
            </div>
          </div>
        )}

        {location.status === "success" && (
          <div className="mt-8 flex gap-6 justify-center">
            <button
              onClick={() =>
                fetchNearbyStops(location.coords.lat, location.coords.lng)
              }
              className="text-white/70 hover:text-white font-bold transition-colors text-xl"
            >
              Refresh
            </button>
            <button
              onClick={requestLocation}
              className="text-white/70 hover:text-white font-bold transition-colors text-xl"
            >
              Update Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
