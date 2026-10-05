const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "XK",
  "YE", "YT",
  "ZA", "ZM", "ZW",
] as const;

const countryCodes = new Set<string>(COUNTRY_CODES);
const aliases: Record<string, string> = {
  uk: "GB",
  usa: "US",
  uae: "AE",
};

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const namesToCodes = new Map<string, string>();

for (const code of COUNTRY_CODES) {
  const name = displayNames.of(code);
  if (name !== undefined) {
    namesToCodes.set(fold(name), code);
  }
}

export function countryName(value: string) {
  const code = value.trim().toUpperCase();
  if (!countryCodes.has(code)) {
    return value.trim();
  }
  return displayNames.of(code) ?? code;
}

export function countryCode(value: string) {
  const folded = fold(value);
  if (folded.length === 0) {
    return null;
  }
  const alias = aliases[folded];
  if (alias !== undefined) {
    return alias;
  }
  const upper = folded.toUpperCase();
  if (countryCodes.has(upper)) {
    return upper;
  }
  return namesToCodes.get(folded) ?? null;
}

export function requireCountryCode(value: string) {
  const code = countryCode(value);
  if (code === null) {
    throw new Error("Enter a valid country");
  }
  return code;
}

function fold(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replaceAll(".", "").replace(/\s+/g, " ");
}
