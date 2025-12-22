"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, LocateFixed } from "lucide-react";
import {
  Departure,
  StopNode,
  LocationState,
  GeocodedLocation,
  REGION_COLORS,
} from "@/app/lib/types";
import {
  STORAGE_KEY,
  getMinutesUntil,
  formatDepartureTime,
  getRegion,
  getRegionColor,
} from "@/app/lib/utils";
import SearchInput from "./SearchInput";
import DepartureRow from "./DepartureRow";

const MAX_DEPARTURES = 20;

interface DepartureBoardProps {
  onThemeColorChange?: (color: string) => void;
}

export default function DepartureBoard({ onThemeColorChange }: DepartureBoardProps) {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [debouncedRadius, setDebouncedRadius] = useState(500);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [searchedLocationName, setSearchedLocationName] = useState<string | null>(null);

  // Get the theme color based on current location
  const themeColor =
    location.status === "success"
      ? getRegionColor(location.coords.lat, location.coords.lng)
      : REGION_COLORS.default;

  // Notify parent of theme color changes
  useEffect(() => {
    onThemeColorChange?.(themeColor);
  }, [themeColor, onThemeColorChange]);

  const fetchNearbyStops = useCallback(
    async (lat: number, lng: number, searchRadius: number = radius) => {
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
    },
    [radius]
  );

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

  const handleLocationSelect = (geocodedLocation: GeocodedLocation) => {
    const [lon, lat] = geocodedLocation.geometry.coordinates;
    const coords = { lat, lng: lon };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
    setLocation({ status: "success", coords });
    setSearchedLocationName(geocodedLocation.properties.label);
    fetchNearbyStops(lat, lon);
  };

  // Debounced radius - delays server calls by 1 second
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
            <p className="text-white/60 text-center text-sm mb-3">
              tai hae paikan nimellä
            </p>
            <SearchInput onLocationSelect={handleLocationSelect} />
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
        <div className="w-full p-6 rounded-xl bg-red-500/20 text-white font-bold text-base sm:text-xl mb-6">
          {error}
        </div>
      )}

      {location.status === "success" && departures.length === 0 && !error && (
        <p className="py-12 text-white/80 text-center font-bold text-2xl sm:text-3xl">
          No departures found nearby
        </p>
      )}

      {departures.length > 0 && location.status === "success" && (
        <div className="flex flex-col">
          {departures.slice(0, MAX_DEPARTURES).map((dep) => (
            <DepartureRow
              key={dep.key}
              departure={dep}
              userCoords={location.coords}
            />
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
              Näytetään lähdöt lähellä:{" "}
              <span className="font-semibold text-white/80">
                {searchedLocationName}
              </span>
            </p>
          )}
          <p className="text-white/70 font-bold text-sm">Hae toinen paikka</p>
          <SearchInput onLocationSelect={handleLocationSelect} />
        </div>
      )}

      {location.status === "success" && (
        <div className="mt-10 flex flex-col items-center">
          <a
            href="/for-companies"
            className="text-white/70 hover:text-white font-bold text-sm sm:text-base transition-colors underline underline-offset-2"
          >
            Hallintapaneeli yrityksille
          </a>
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
    </>
  );
}
