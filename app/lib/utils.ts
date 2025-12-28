import { REGION_BOUNDS, REGION_COLORS } from "./types";
import { CITIES } from "./cities";

export const STORAGE_KEY = "nysse-saved-location";
export const RADIUS_STORAGE_KEY = "nysse-saved-radius";

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

// Calculate distance between two coordinates using Haversine formula (in km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find the closest city based on coordinates
export function getCityFromCoords(lat: number, lng: number): string | null {
  let closestCity: string | null = null;
  let minDistance = Infinity;

  for (const [slug, config] of Object.entries(CITIES)) {
    const distance = haversineDistance(lat, lng, config.coords.lat, config.coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = slug;
    }
  }

  // Only return city if within 50km of city center
  if (minDistance > 50) {
    return null;
  }

  return closestCity;
}
