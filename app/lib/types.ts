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
  turku: "#00A19C", // Föli teal
  oulu: "#E30A69", // OSL pink
  jyvaskyla: "#109D2C", // Linkki green
  lahti: "#1570B8", // LSL blue
  kuopio: "#554096", // Vilkku purple
  lappeenranta: "#DD3189", // Jouko pink
  hameenlinna: "#C3291E", // HML red
  pori: "#00ADEF", // Pori blue
  default: "#1b57cf", // Fallback to Nysse blue
};

// HSL official transportation mode colors
export const HSL_MODE_COLORS: Record<string, string> = {
  TRAM: "#00985F", // HSL tram green
  SUBWAY: "#FF6319", // HSL metro orange
  RAIL: "#8C4799", // HSL commuter train purple
  BUS: "#007AC9", // HSL bus blue
  FERRY: "#00B9E4", // HSL ferry light blue
};
