export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export type AddressParts = {
  addressLine: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export const emptyAddress: AddressParts = {
  addressLine: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
};

const sessionTokenPattern = /^[A-Za-z0-9_-]{8,36}$/;
const placeIdPattern = /^[A-Za-z0-9_-]{8,200}$/;

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin === null || host === null) {
    return false;
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function readSearchInput(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const input = value.trim();
  if (input.length < 3 || input.length > 120) {
    return null;
  }
  return input;
}

export function readSessionToken(value: unknown) {
  if (typeof value !== "string" || !sessionTokenPattern.test(value)) {
    return null;
  }
  return value;
}

export function readPlaceId(value: unknown) {
  if (typeof value !== "string" || !placeIdPattern.test(value)) {
    return null;
  }
  return value;
}

export function suggestionsFrom(body: unknown): PlaceSuggestion[] {
  if (!isRecord(body) || !Array.isArray(body.suggestions)) {
    return [];
  }
  const suggestions: PlaceSuggestion[] = [];
  for (const item of body.suggestions) {
    if (!isRecord(item) || !isRecord(item.placePrediction)) {
      continue;
    }
    const prediction = item.placePrediction;
    const placeId = readPlaceId(prediction.placeId);
    if (placeId === null) {
      continue;
    }
    const structured = isRecord(prediction.structuredFormat) ? prediction.structuredFormat : null;
    const mainText = textOf(structured?.mainText) || textOf(prediction.text);
    if (mainText.length === 0) {
      continue;
    }
    suggestions.push({
      placeId,
      mainText,
      secondaryText: textOf(structured?.secondaryText),
    });
    if (suggestions.length === 5) {
      break;
    }
  }
  return suggestions;
}

export function addressFrom(body: unknown): AddressParts {
  const components = isRecord(body) && Array.isArray(body.addressComponents) ? body.addressComponents : [];
  const streetNumber = componentText(components, "street_number");
  const route = componentText(components, "route");
  const joinedLine = [streetNumber, route].filter((part) => part.length > 0).join(" ");
  const formatted = isRecord(body) && typeof body.formattedAddress === "string" ? body.formattedAddress : "";
  const addressLine = joinedLine || formatted.split(",")[0]?.trim() || "";
  const city =
    componentText(components, "locality") ||
    componentText(components, "postal_town") ||
    componentText(components, "sublocality") ||
    componentText(components, "administrative_area_level_2");
  return {
    addressLine,
    addressLine2: componentText(components, "subpremise"),
    city,
    region: componentText(components, "administrative_area_level_1", "shortText"),
    postalCode: componentText(components, "postal_code"),
    country: componentText(components, "country", "shortText"),
  };
}

function componentText(components: unknown[], type: string, field: "longText" | "shortText" = "longText") {
  for (const component of components) {
    if (!isRecord(component) || !Array.isArray(component.types) || !component.types.includes(type)) {
      continue;
    }
    const value = component[field];
    if (typeof value !== "string") {
      continue;
    }
    return value;
  }
  return "";
}

function textOf(value: unknown) {
  if (!isRecord(value) || typeof value.text !== "string") {
    return "";
  }
  return value.text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
