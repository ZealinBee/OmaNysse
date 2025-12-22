export interface StopTime {
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

export interface Stop {
  gtfsId: string;
  name: string;
  code?: string;
  platformCode?: string;
  lat: number;
  lon: number;
  stoptimesWithoutPatterns: StopTime[];
}

export interface StopNode {
  stop: Stop;
  distance: number;
}

export interface Departure {
  routeNumber: string;
  color: string;
  headsign: string;
  minutesUntil: number;
  departureTime: string;
  distance: number;
  stopLat: number;
  stopLon: number;
  key: string;
}

export type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "success"; coords: { lat: number; lng: number } }
  | { status: "denied" };

export interface GeocodedLocation {
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

// Region bounding boxes for transit authorities
export const REGION_BOUNDS = {
  uusimaa: { minLat: 59.9, maxLat: 60.7, minLon: 23.5, maxLon: 26.0 }, // HSL area
  tampere: { minLat: 61.3, maxLat: 61.7, minLon: 23.3, maxLon: 24.2 }, // Pirkanmaa/Nysse
  jyvaskyla: { minLat: 62.1, maxLat: 62.4, minLon: 25.5, maxLon: 26.0 }, // Linkki
  turku: { minLat: 60.3, maxLat: 60.6, minLon: 22.0, maxLon: 22.8 }, // Föli
  oulu: { minLat: 64.8, maxLat: 65.2, minLon: 25.2, maxLon: 25.9 }, // Oulu
};

export const REGION_COLORS: Record<string, string> = {
  uusimaa: "#007AC9", // HSL blue
  tampere: "#1b57cf", // Nysse blue
  jyvaskyla: "#009640", // Linkki green
  turku: "#00A651", // Föli green
  oulu: "#E4032E", // Oulu red
  default: "#1b57cf", // Fallback to Nysse blue
};
