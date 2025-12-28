import { NextRequest, NextResponse } from "next/server";

const API_URLS = {
  waltti: "https://api.digitransit.fi/routing/v2/waltti/gtfs/v1",
  hsl: "https://api.digitransit.fi/routing/v2/hsl/gtfs/v1",
} as const;

type Region = keyof typeof API_URLS;

const TRIP_PATTERN_QUERY = `
  query TripPattern($tripId: String!) {
    trip(id: $tripId) {
      pattern {
        geometry {
          lat
          lon
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get("tripId");
  const region = (searchParams.get("region") || "waltti") as Region;

  if (!tripId) {
    return NextResponse.json(
      { error: "Missing tripId parameter" },
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
        query: TRIP_PATTERN_QUERY,
        variables: {
          tripId,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API error:", text);
      return NextResponse.json(
        { error: "Failed to fetch trip pattern" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract geometry from the response
    const geometry = data.data?.trip?.pattern?.geometry;

    if (!geometry || geometry.length === 0) {
      return NextResponse.json(
        { geometry: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({ geometry });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "network_error" },
      { status: 503 }
    );
  }
}
