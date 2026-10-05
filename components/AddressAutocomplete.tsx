"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import type { AddressParts, PlaceSuggestion } from "@/lib/places";

export default function AddressAutocomplete({
  value,
  onChange,
  onPlace,
  className,
  placeholder = "Address",
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onPlace: (place: AddressParts) => void;
  className: string;
  placeholder?: string;
  required?: boolean;
}) {
  const listId = useId();
  const sessionToken = useRef(newSessionToken());
  const skipSearch = useRef(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const input = value.trim();
    if (input.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, sessionToken: sessionToken.current }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            return [];
          }
          const body: unknown = await response.json();
          return suggestionsFrom(body);
        })
        .then((next) => {
          setSuggestions(next);
          setActiveIndex(0);
          setOpen(next.length > 0);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setSuggestions([]);
          setOpen(false);
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  function choose(suggestion: PlaceSuggestion) {
    setOpen(false);
    setSuggestions([]);
    skipSearch.current = true;
    const token = sessionToken.current;
    sessionToken.current = newSessionToken();
    void fetch("/api/places/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: suggestion.placeId, sessionToken: token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return addressFrom(await response.json());
      })
      .then((place) => {
        if (place === null) {
          if (suggestion.mainText === value) {
            skipSearch.current = false;
          }
          onChange(suggestion.mainText);
          return;
        }
        if (place.addressLine.length === 0 || place.addressLine === value) {
          skipSearch.current = false;
        }
        onPlace(place);
      })
      .catch(() => {
        onChange(suggestion.mainText);
      });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion !== undefined) {
        choose(suggestion);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div>
      <input
        className={className}
        name="addressLine"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          setOpen(false);
        }}
      />
      {open ? (
        <ul id={listId} role="listbox" className="border border-t-0 border-[#141210]/20 bg-[#f4f1eb]">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.placeId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`block w-full px-3 py-3 text-left text-sm ${index === activeIndex ? "bg-[#141210]/5" : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  choose(suggestion);
                }}
              >
                <span>{suggestion.mainText}</span>
                {suggestion.secondaryText ? (
                  <span className="mt-1 block text-[#6f675e]">{suggestion.secondaryText}</span>
                ) : null}
              </button>
            </li>
          ))}
          <li className="flex justify-end px-3 py-2">
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              width={120}
              height={14}
            />
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function suggestionsFrom(body: unknown): PlaceSuggestion[] {
  if (typeof body !== "object" || body === null || !("suggestions" in body) || !Array.isArray(body.suggestions)) {
    return [];
  }
  const suggestions: PlaceSuggestion[] = [];
  for (const item of body.suggestions) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("placeId" in item) ||
      typeof item.placeId !== "string" ||
      !("mainText" in item) ||
      typeof item.mainText !== "string"
    ) {
      continue;
    }
    suggestions.push({
      placeId: item.placeId,
      mainText: item.mainText,
      secondaryText: "secondaryText" in item && typeof item.secondaryText === "string" ? item.secondaryText : "",
    });
  }
  return suggestions;
}

function addressFrom(body: unknown): AddressParts | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("addressLine" in body) ||
    typeof body.addressLine !== "string" ||
    !("addressLine2" in body) ||
    typeof body.addressLine2 !== "string" ||
    !("city" in body) ||
    typeof body.city !== "string" ||
    !("region" in body) ||
    typeof body.region !== "string" ||
    !("postalCode" in body) ||
    typeof body.postalCode !== "string" ||
    !("country" in body) ||
    typeof body.country !== "string"
  ) {
    return null;
  }
  return {
    addressLine: body.addressLine,
    addressLine2: body.addressLine2,
    city: body.city,
    region: body.region,
    postalCode: body.postalCode,
    country: body.country,
  };
}

function newSessionToken() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 32);
}
