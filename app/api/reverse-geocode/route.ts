import { NextRequest, NextResponse } from "next/server";

const REVERSE_GEOCODING_API = "https://api.digitransit.fi/geocoding/v1/reverse";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon parameters are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NYSSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(REVERSE_GEOCODING_API);
    url.searchParams.set("point.lat", lat);
    url.searchParams.set("point.lon", lon);
    url.searchParams.set("size", "1");
    url.searchParams.set("lang", "fi");

    const response = await fetch(url.toString(), {
      headers: {
        "digitransit-subscription-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Reverse geocoding API error:", errorText);
      return NextResponse.json(
        { error: "Failed to reverse geocode" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length > 0) {
      // Return just the label for simplicity
      return NextResponse.json({
        label: features[0].properties.label,
        name: features[0].properties.name,
      });
    }

    return NextResponse.json({ label: null, name: null });
  } catch (error) {
    console.error("Reverse geocoding fetch error:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode" },
      { status: 500 }
    );
  }
}
