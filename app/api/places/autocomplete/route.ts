import { NextResponse } from "next/server";
import { env } from "@/env";
import { readSearchInput, readSessionToken, sameOrigin, suggestionsFrom } from "@/lib/places";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ suggestions: [] }, { status: 403 });
  }
  const key = env.GOOGLE_PLACES_API_KEY;
  if (key === undefined) {
    return NextResponse.json({ suggestions: [] }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }
  const input = readSearchInput("input" in body ? body.input : undefined);
  const sessionToken = readSessionToken("sessionToken" in body ? body.sessionToken : undefined);
  if (input === null || sessionToken === null) {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text",
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ["street_address", "premise", "subpremise"],
      languageCode: "en",
      sessionToken,
    }),
  });
  if (!response.ok) {
    console.error("Places autocomplete failed", response.status);
    return NextResponse.json({ suggestions: [] }, { status: 502 });
  }

  return NextResponse.json({ suggestions: suggestionsFrom(await response.json()) });
}
