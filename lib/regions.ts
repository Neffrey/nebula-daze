const REGIONS: Record<string, Record<string, string>> = {
  US: {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    AS: "American Samoa",
    GU: "Guam",
    MP: "Northern Mariana Islands",
    PR: "Puerto Rico",
    VI: "U.S. Virgin Islands",
    UM: "U.S. Minor Outlying Islands",
    AA: "Armed Forces Americas",
    AE: "Armed Forces Europe",
    AP: "Armed Forces Pacific",
  },
  CA: {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon",
  },
};

const aliases: Record<string, Record<string, string>> = {
  US: { "washington dc": "DC", "washington, dc": "DC", "us virgin islands": "VI" },
  CA: { "québec": "QC", "newfoundland": "NL", "yukon territory": "YT" },
};

const lookups = new Map<string, Map<string, string>>(
  Object.entries(REGIONS).map(([country, regions]) => [
    country,
    new Map([
      ...Object.entries(regions).map(([code, name]) => [fold(name), code] as const),
      ...Object.entries(aliases[country] ?? {}),
    ]),
  ]),
);

export function regionCode(value: string, country: string) {
  const regions = REGIONS[country];
  const trimmed = value.trim();
  if (regions === undefined) {
    return trimmed;
  }
  const upper = trimmed.toUpperCase().replaceAll(".", "");
  if (upper in regions) {
    return upper;
  }
  return lookups.get(country)?.get(fold(trimmed)) ?? null;
}

export function requireRegion(value: string, country: string) {
  const code = regionCode(value, country);
  if (code === null || code.length === 0) {
    throw new Error(country === "CA" ? "Enter a valid province" : "Enter a valid state");
  }
  if (code.length > 80) {
    throw new Error("State / Province must be 80 characters or fewer");
  }
  return code;
}

function fold(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replaceAll(".", "").replace(/\s+/g, " ");
}
