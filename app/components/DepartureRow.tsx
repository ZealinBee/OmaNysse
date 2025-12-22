"use client";

import { Navigation } from "lucide-react";
import { Departure } from "@/app/lib/types";

interface DepartureRowProps {
  departure: Departure;
  userCoords: { lat: number; lng: number };
}

export default function DepartureRow({ departure, userCoords }: DepartureRowProps) {
  return (
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
            ? "Now"
            : departure.minutesUntil === 1
              ? "1 min"
              : `${departure.minutesUntil} min`}
        </span>
        <span className="text-white/50 text-[10px] sm:text-xs">
          {departure.departureTime}
        </span>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${departure.stopLat},${departure.stopLon}&travelmode=walking`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        title="Get directions to stop"
      >
        <Navigation className="w-4 h-4" />
        <span>Pysäkille</span>
      </a>
    </div>
  );
}
