import { REGION_BOUNDS, REGION_COLORS } from "./types";

export const STORAGE_KEY = "nysse-saved-location";

export function getMinutesUntil(serviceDay: number, departureSeconds: number): number {
  const departureTime = (serviceDay + departureSeconds) * 1000;
  const now = Date.now();
  return Math.round((departureTime - now) / 60000);
}

export function formatDepartureTime(serviceDay: number, departureSeconds: number): string {
  const departureTime = new Date((serviceDay + departureSeconds) * 1000);
  const hours = departureTime.getHours().toString().padStart(2, "0");
  const minutes = departureTime.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function isInBounds(
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

export function getRegion(lat: number, lon: number): "hsl" | "waltti" {
  if (isInBounds(lat, lon, REGION_BOUNDS.uusimaa)) {
    return "hsl";
  }
  return "waltti";
}

export function getRegionColor(lat: number, lon: number): string {
  for (const [region, bounds] of Object.entries(REGION_BOUNDS)) {
    if (isInBounds(lat, lon, bounds)) {
      return REGION_COLORS[region];
    }
  }
  return REGION_COLORS.default;
}
