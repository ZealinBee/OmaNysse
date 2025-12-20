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

export default function Home() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [manualInput, setManualInput] = useState("");
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      className="min-h-screen p-4 sm:p-8"
      style={{ backgroundColor: "#1b57cf" }}
    >
      <div className="max-w-md mx-auto">
        {location.status === "idle" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-white/80 text-center font-semibold">
              To show nearby departures, we need your location
            </p>
            <button
              onClick={requestLocation}
              className="rounded-full bg-white px-6 py-3 font-semibold transition-opacity hover:opacity-90"
              style={{ color: "#1b57cf" }}
            >
              Share My Location
            </button>
          </div>
        )}

        {location.status === "requesting" && (
          <p className="py-12 text-white/80 text-center font-semibold">
            Requesting location...
          </p>
        )}

        {location.status === "denied" && (
          <div className="flex flex-col items-center gap-4 w-full py-8">
            <p className="text-white/80 text-center font-semibold">
              Location access denied. Please enter your location:
            </p>
            <form
              onSubmit={handleManualSubmit}
              className="flex flex-col gap-3 w-full"
            >
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter address or city"
                className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none font-semibold"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{ color: "#1b57cf" }}
              >
                Use This Location
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="w-full p-4 rounded-lg bg-red-500/20 text-white font-semibold text-sm mb-4">
            {error}
          </div>
        )}

        {loading && (
          <p className="py-8 text-white/80 text-center font-semibold">
            Loading...
          </p>
        )}

        {location.status === "success" &&
          !loading &&
          departures.length === 0 &&
          !error && (
            <p className="py-8 text-white/80 text-center font-semibold">
              No departures found nearby
            </p>
          )}

        {departures.length > 0 && (
          <div className="flex flex-col">
            {departures.map((dep) => (
              <div
                key={dep.key}
                className="flex items-center gap-3 py-3 border-b border-white/20"
              >
                <span
                  className="font-bold min-w-[3.5rem] px-2 py-1 rounded text-center text-white text-sm"
                  style={{ backgroundColor: dep.color }}
                >
                  {dep.routeNumber}
                </span>
                <span className="flex-1 text-white font-semibold truncate">
                  {dep.headsign}
                </span>
                <span className="text-white font-semibold whitespace-nowrap">
                  {dep.minutesUntil === 0
                    ? "Now"
                    : dep.minutesUntil === 1
                      ? "1 min"
                      : `${dep.minutesUntil} min`}
                </span>
              </div>
            ))}
          </div>
        )}

        {location.status === "success" && (
          <button
            onClick={() =>
              fetchNearbyStops(location.coords.lat, location.coords.lng)
            }
            className="mt-6 w-full text-white/70 hover:text-white font-semibold transition-colors text-center"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
