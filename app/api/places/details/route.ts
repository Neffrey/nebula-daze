import { NextResponse } from "next/server";
import { env } from "@/env";
import { addressFrom, emptyAddress, readPlaceId, readSessionToken, sameOrigin } from "@/lib/places";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(emptyAddress, { status: 403 });
  }
  const key = env.GOOGLE_PLACES_API_KEY;
  if (key === undefined) {
    return NextResponse.json(emptyAddress, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(emptyAddress, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(emptyAddress, { status: 400 });
  }
  const placeId = readPlaceId("placeId" in body ? body.placeId : undefined);
  const sessionToken = readSessionToken("sessionToken" in body ? body.sessionToken : undefined);
  if (placeId === null || sessionToken === null) {
    return NextResponse.json(emptyAddress, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("sessionToken", sessionToken);
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "addressComponents,formattedAddress",
    },
  });
  if (!response.ok) {
    console.error("Places details failed", response.status);
    return NextResponse.json(emptyAddress, { status: 502 });
  }

  return NextResponse.json(addressFrom(await response.json()));
}
