import { NextRequest, NextResponse } from "next/server";

// ITS Factory API for Waltti regions (Tampere, etc.)
const ITS_FACTORY_URL = "http://data.itsfactory.fi/journeys/api/1/vehicle-activity";

// HSL uses MQTT which is more complex, so for now we'll focus on Waltti
// HSL GTFS-RT feed could be added later

export interface VehiclePosition {
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
  vehicleRef?: string;
  delay?: number;
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
          positions.push({
            lat: monitored.vehicleLocation.latitude,
            lon: monitored.vehicleLocation.longitude,
            bearing: monitored.bearing,
            speed: monitored.speed,
            timestamp: monitored.vehicleLocation.timestamp || activity.recordedAtTime,
            vehicleRef: monitored.vehicleRef,
            delay: monitored.delay,
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
