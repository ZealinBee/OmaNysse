import { NextRequest, NextResponse } from "next/server";

const API_URLS = {
  waltti: "https://api.digitransit.fi/routing/v2/waltti/gtfs/v1",
  hsl: "https://api.digitransit.fi/routing/v2/hsl/gtfs/v1",
} as const;

type Region = keyof typeof API_URLS;

const NEARBY_STOPS_QUERY = `
  query NearbyStops($lat: Float!, $lon: Float!, $radius: Int!) {
    stopsByRadius(lat: $lat, lon: $lon, radius: $radius) {
      edges {
        node {
          stop {
            gtfsId
            name
            code
            platformCode
            lat
            lon
            stoptimesWithoutPatterns(numberOfDepartures: 5) {
              scheduledDeparture
              realtimeDeparture
              departureDelay
              realtime
              realtimeState
              serviceDay
              headsign
              trip {
                route {
                  shortName
                  mode
                  color
                }
              }
            }
          }
          distance
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = searchParams.get("radius") || "500";
  const region = (searchParams.get("region") || "waltti") as Region;

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing lat or lon parameters" },
      { status: 400 }
    );
  }

  const apiUrl = API_URLS[region] || API_URLS.waltti;

  const apiKey = process.env.NYSSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "digitransit-subscription-key": apiKey,
      },
      body: JSON.stringify({
        query: NEARBY_STOPS_QUERY,
        variables: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          radius: parseInt(radius),
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API error:", text);
      return NextResponse.json(
        { error: "Failed to fetch stops" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stops" },
      { status: 500 }
    );
  }
}
