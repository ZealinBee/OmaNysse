import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

// API URLs for different transit operators
const ITS_FACTORY_URL = "http://data.itsfactory.fi/journeys/api/1/vehicle-activity";
const FOLI_SIRI_VM_URL = "http://data.foli.fi/siri/vm";
const HSL_GTFSRT_URL = "https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl";

export interface OnwardCall {
  stopCode: string;
  expectedArrivalTime?: string;
  expectedDepartureTime?: string;
  order: number;
}

export interface VehiclePosition {
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
  vehicleRef?: string;
  delay?: number;
  onwardCalls?: OnwardCall[];
  destinationName?: string;
  directionRef?: string;
}

// Fetch from ITS Factory API (Tampere/Nysse)
async function fetchFromITSFactory(lineRef: string): Promise<NextResponse> {
  try {
    const response = await fetch(`${ITS_FACTORY_URL}?lineRef=${encodeURIComponent(lineRef)}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("ITS Factory API error:", response.status);
      return NextResponse.json(
        { error: "Bussin sijainnin haku epäonnistui", positions: [] },
        { status: 200 }
      );
    }

    const data = await response.json();
    const positions: VehiclePosition[] = [];

    if (data.body && Array.isArray(data.body)) {
      for (const activity of data.body) {
        const monitored = activity.monitoredVehicleJourney;
        if (monitored && monitored.vehicleLocation) {
          const onwardCalls: OnwardCall[] = [];
          if (monitored.onwardCalls && Array.isArray(monitored.onwardCalls)) {
            for (const call of monitored.onwardCalls) {
              const stopPointRef = call.stopPointRef || "";
              const stopCode = stopPointRef.split("/").pop() || "";
              if (stopCode) {
                onwardCalls.push({
                  stopCode,
                  expectedArrivalTime: call.expectedArrivalTime,
                  expectedDepartureTime: call.expectedDepartureTime,
                  order: parseInt(call.order, 10) || 0,
                });
              }
            }
          }

          positions.push({
            lat: monitored.vehicleLocation.latitude,
            lon: monitored.vehicleLocation.longitude,
            bearing: monitored.bearing,
            speed: monitored.speed,
            timestamp: monitored.vehicleLocation.timestamp || activity.recordedAtTime,
            vehicleRef: monitored.vehicleRef,
            delay: monitored.delay,
            onwardCalls: onwardCalls.length > 0 ? onwardCalls : undefined,
            destinationName: monitored.destinationName || monitored.destinationShortName,
            directionRef: monitored.directionRef,
          });
        }
      }
    }

    return NextResponse.json({ positions });
  } catch (error) {
    console.error("ITS Factory fetch error:", error);
    return NextResponse.json(
      { error: "Verkkovirhe", positions: [] },
      { status: 200 }
    );
  }
}

// Fetch from Föli SIRI VM API (Turku)
async function fetchFromFoli(lineRef: string): Promise<NextResponse> {
  try {
    const response = await fetch(FOLI_SIRI_VM_URL, {
      headers: {
        "Accept-Encoding": "gzip",
      },
    });

    if (!response.ok) {
      console.error("Föli API error:", response.status);
      return NextResponse.json(
        { error: "Bussin sijainnin haku epäonnistui", positions: [] },
        { status: 200 }
      );
    }

    // Föli returns gzipped data
    const buffer = await response.arrayBuffer();
    let jsonText: string;

    try {
      // Try to decompress gzipped data
      const decompressed = gunzipSync(Buffer.from(buffer));
      jsonText = decompressed.toString("utf-8");
    } catch {
      // If decompression fails, assume it's plain JSON
      jsonText = Buffer.from(buffer).toString("utf-8");
    }

    const data = JSON.parse(jsonText);
    const positions: VehiclePosition[] = [];

    // Föli SIRI VM format: { result: { vehicles: { [vehicleId]: {...} } } }
    if (data.result && data.result.vehicles) {
      for (const [vehicleId, vehicle] of Object.entries(data.result.vehicles)) {
        const v = vehicle as {
          lineref?: string;
          latitude?: number;
          longitude?: number;
          bearing?: number;
          speed?: number;
          recordedattime?: string;
          destinationname?: string;
          directionref?: string;
          delay?: number;
        };

        // Filter by line reference
        if (v.lineref === lineRef && v.latitude && v.longitude) {
          positions.push({
            lat: v.latitude,
            lon: v.longitude,
            bearing: v.bearing,
            speed: v.speed,
            timestamp: v.recordedattime || new Date().toISOString(),
            vehicleRef: vehicleId,
            destinationName: v.destinationname,
            directionRef: v.directionref?.toString(),
            delay: v.delay,
          });
        }
      }
    }

    return NextResponse.json({ positions });
  } catch (error) {
    console.error("Föli fetch error:", error);
    return NextResponse.json(
      { error: "Verkkovirhe", positions: [] },
      { status: 200 }
    );
  }
}

// Fetch from HSL GTFS-RT API (Helsinki region)
async function fetchFromHSL(lineRef: string): Promise<NextResponse> {
  try {
    const response = await fetch(HSL_GTFSRT_URL);

    if (!response.ok) {
      console.error("HSL GTFS-RT API error:", response.status);
      return NextResponse.json(
        { error: "Bussin sijainnin haku epäonnistui", positions: [] },
        { status: 200 }
      );
    }

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    const positions: VehiclePosition[] = [];

    // HSL route IDs use formats like:
    // - 1065 for bus line 65 (prefix 10 = Helsinki)
    // - 2065 for bus line 65 (prefix 20 = Espoo)
    // - 1007 for bus line 7
    // - 31M1 for metro M1
    // - 3001K for tram K
    // The last 2-4 characters typically represent the visible line number
    const matchesRoute = (routeId: string | null | undefined): boolean => {
      if (!routeId) return false;

      // Exact match
      if (routeId === lineRef) return true;

      // For numeric routes, check if route ends with zero-padded lineRef
      // e.g., line "65" matches route "1065", line "7" matches "1007"
      const paddedLineRef = lineRef.padStart(3, "0");
      if (routeId.endsWith(paddedLineRef)) return true;

      // Also try matching without padding for 3+ digit lines
      // e.g., line "550" matches route "4550" or "5550"
      if (lineRef.length >= 3 && routeId.endsWith(lineRef)) return true;

      // For trams/metros with letters (M1, M2, K, etc.)
      // Check if the line identifier appears in the route
      if (/[A-Z]/.test(lineRef) && routeId.toUpperCase().includes(lineRef.toUpperCase())) {
        return true;
      }

      return false;
    };

    for (const entity of feed.entity) {
      if (entity.vehicle && entity.vehicle.position && entity.vehicle.trip) {
        const routeId = entity.vehicle.trip.routeId;

        if (matchesRoute(routeId)) {
          const pos = entity.vehicle.position;
          const vehicle = entity.vehicle.vehicle;
          const trip = entity.vehicle.trip;

          positions.push({
            lat: pos.latitude,
            lon: pos.longitude,
            bearing: pos.bearing ?? undefined,
            speed: pos.speed ?? undefined,
            timestamp: entity.vehicle.timestamp
              ? new Date(Number(entity.vehicle.timestamp) * 1000).toISOString()
              : new Date().toISOString(),
            vehicleRef: vehicle?.id || entity.id,
            directionRef: trip.directionId?.toString(),
          });
        }
      }
    }

    return NextResponse.json({ positions });
  } catch (error) {
    console.error("HSL GTFS-RT fetch error:", error);
    return NextResponse.json(
      { error: "Verkkovirhe", positions: [] },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lineRef = searchParams.get("lineRef");
  const region = searchParams.get("region") || "waltti";
  const city = searchParams.get("city");

  if (!lineRef) {
    return NextResponse.json(
      { error: "Missing lineRef parameter" },
      { status: 400 }
    );
  }

  // Route to correct API based on city
  if (city) {
    switch (city) {
      case "tampere":
        return fetchFromITSFactory(lineRef);
      case "turku":
        return fetchFromFoli(lineRef);
      case "helsinki":
        return fetchFromHSL(lineRef);
      case "oulu":
      case "jyvaskyla":
      case "lahti":
      case "kuopio":
      case "lappeenranta":
      case "hameenlinna":
      case "pori":
        return NextResponse.json({
          error: "Bussin sijainti ei ole vielä saatavilla tässä kaupungissa",
          positions: []
        });
      default:
        // Unknown city - return empty
        return NextResponse.json({
          error: "Bussin sijaintia ei löytynyt",
          positions: []
        });
    }
  }

  // Legacy fallback: use region parameter if city not provided
  if (region === "hsl") {
    return fetchFromHSL(lineRef);
  }

  // Default to ITS Factory for backward compatibility
  return fetchFromITSFactory(lineRef);
}
