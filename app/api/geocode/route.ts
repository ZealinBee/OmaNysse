import { NextRequest, NextResponse } from "next/server";

const GEOCODING_API = "https://api.digitransit.fi/geocoding/v1/search";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get("text");
  const size = searchParams.get("size") || "5";

  if (!text || text.trim().length < 2) {
    return NextResponse.json(
      { error: "Search text must be at least 2 characters" },
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
    const url = new URL(GEOCODING_API);
    url.searchParams.set("text", text);
    url.searchParams.set("size", size);
    url.searchParams.set("lang", "fi");

    const response = await fetch(url.toString(), {
      headers: {
        "digitransit-subscription-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Geocoding API error:", errorText);
      return NextResponse.json(
        { error: "Failed to search locations" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding fetch error:", error);
    return NextResponse.json(
      { error: "Failed to search locations" },
      { status: 500 }
    );
  }
}
