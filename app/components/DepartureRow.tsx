"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Navigation, Map } from "lucide-react";
import { Departure } from "@/app/lib/types";

// Dynamic import to avoid SSR issues with Leaflet
const BusMapPopup = dynamic(() => import("./BusMapPopup"), {
  ssr: false,
  loading: () => null,
});

interface DepartureRowProps {
  departure: Departure;
  userCoords: { lat: number; lng: number };
  region: "hsl" | "waltti";
}

export function DepartureRowSkeleton() {
  return (
    <div className="flex items-center gap-2 sm:gap-5 py-3 sm:py-5 border-b-2 border-white/20 animate-pulse">
      <div className="min-w-[2.5rem] sm:min-w-[5rem] h-8 sm:h-12 bg-white/20 rounded-lg" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-5 sm:h-7 bg-white/20 rounded w-3/4" />
        <div className="h-3 sm:h-4 bg-white/10 rounded w-1/3" />
      </div>
      <div className="flex flex-col items-end space-y-1">
        <div className="h-5 sm:h-8 bg-white/20 rounded w-16 sm:w-20" />
        <div className="h-3 sm:h-4 bg-white/10 rounded w-12" />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg" />
        <div className="w-8 h-8 sm:w-20 sm:h-10 bg-white/20 rounded-lg" />
      </div>
    </div>
  );
}

export default function DepartureRow({ departure, userCoords, region }: DepartureRowProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-5 py-3 sm:py-5 border-b-2 border-white/20">
        <span
          className="font-black min-w-[2.5rem] sm:min-w-[5rem] px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-center text-white text-sm sm:text-2xl"
          style={{ backgroundColor: departure.color }}
        >
          {departure.routeNumber}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-white font-bold text-base sm:text-2xl truncate block">
            {departure.headsign}
          </span>
          <span className="text-white/50 text-[10px] sm:text-sm">
            {departure.distance}m päässä
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white font-extrabold text-base sm:text-3xl whitespace-nowrap">
            {departure.minutesUntil === 0
              ? "Nyt"
              : departure.minutesUntil === 1
                ? "1 min"
                : `${departure.minutesUntil} min`}
          </span>
          <span className="text-white/50 text-[10px] sm:text-xs">
            {departure.departureTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {region !== "hsl" && (
            <button
              onClick={() => setIsMapOpen(true)}
              className="flex items-center justify-center p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              title="Näytä bussin sijainti kartalla"
            >
              <Map className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${departure.stopLat},${departure.stopLon}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            title="Get directions to stop"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Pysäkille</span>
          </a>
        </div>
      </div>

      <BusMapPopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        routeNumber={departure.routeNumber}
        headsign={departure.headsign}
        routeColor={departure.color}
        stopLat={departure.stopLat}
        stopLon={departure.stopLon}
        userLat={userCoords.lat}
        userLon={userCoords.lng}
        region={region}
      />
    </>
  );
}
