import { NextRequest, NextResponse } from "next/server";

// ITS Factory API for Waltti regions (Tampere, etc.)
const ITS_FACTORY_URL = "http://data.itsfactory.fi/journeys/api/1/vehicle-activity";

// HSL uses MQTT which is more complex, so for now we'll focus on Waltti
// HSL GTFS-RT feed could be added later

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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lineRef = searchParams.get("lineRef");
  const region = searchParams.get("region") || "waltti";

  if (!lineRef) {
    return NextResponse.json(
      { error: "Missing lineRef parameter" },
      { status: 400 }
    );
  }

  // For HSL region, vehicle positions require MQTT subscription
  // which is not practical for a simple REST API
  if (region === "hsl") {
    return NextResponse.json(
      { error: "Vehicle positions not available for HSL region via REST API", positions: [] },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(`${ITS_FACTORY_URL}?lineRef=${encodeURIComponent(lineRef)}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("ITS Factory API error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch vehicle positions", positions: [] },
        { status: 200 }
      );
    }

    const data = await response.json();

    // Transform the ITS Factory response to our format
    const positions: VehiclePosition[] = [];

    if (data.body && Array.isArray(data.body)) {
      for (const activity of data.body) {
        const monitored = activity.monitoredVehicleJourney;
        if (monitored && monitored.vehicleLocation) {
          // Parse onwardCalls to get expected arrival times at stops
          const onwardCalls: OnwardCall[] = [];
          if (monitored.onwardCalls && Array.isArray(monitored.onwardCalls)) {
            for (const call of monitored.onwardCalls) {
              // Extract stop code from URL like "https://data.itsfactory.fi/journeys/api/1/stop-points/0838"
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
          });
        }
      }
    }

    return NextResponse.json({ positions });
  } catch (error) {
    console.error("Vehicle position fetch error:", error);
    return NextResponse.json(
      { error: "network_error", positions: [] },
      { status: 200 }
    );
  }
}
