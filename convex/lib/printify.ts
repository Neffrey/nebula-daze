import { env } from "../_generated/server";

const API_BASE = "https://api.printify.com/v1";

export type PrintifyCredentials = { token: string; shopId: string };

export async function printifyCredentials(): Promise<PrintifyCredentials> {
  const token = env.PRINTIFY_API_TOKEN;
  if (!token) {
    throw new Error("Printify is not configured yet. Set PRINTIFY_API_TOKEN.");
  }
  const configured = env.PRINTIFY_SHOP_ID;
  if (configured) {
    return { token, shopId: configured };
  }
  const response = await fetch(`${API_BASE}/shops.json`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "Nebula Daze" },
  });
  if (!response.ok) {
    throw new Error(`Printify ${response.status}: could not list shops`);
  }
  const shops = (await response.json()) as { id: number; title: string }[];
  const [only] = shops;
  if (shops.length !== 1 || only === undefined) {
    const names = shops.map((shop) => `${shop.title} (${shop.id})`).join(", ");
    throw new Error(
      shops.length === 0
        ? "This Printify account has no shops"
        : `Set PRINTIFY_SHOP_ID to one of: ${names}`,
    );
  }
  return { token, shopId: String(only.id) };
}

export async function printifyRequest(
  credentials: PrintifyCredentials,
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {},
): Promise<unknown> {
  const response = await fetch(`${API_BASE}/shops/${credentials.shopId}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "Nebula Daze",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Printify ${response.status}: ${text.slice(0, 300)}`);
  }
  return text.length === 0 ? null : (JSON.parse(text) as unknown);
}

type PrintifyOptionValue = { id: number; title: string; colors?: string[] };

type PrintifyOption = { name: string; type: string; values: PrintifyOptionValue[] };

type PrintifyVariant = {
  id: number;
  sku?: string;
  price: number;
  is_enabled?: boolean;
  is_available?: boolean;
  options: number[];
};

type PrintifyImage = { src: string; variant_ids?: number[]; is_default?: boolean };

export type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  options?: PrintifyOption[];
  variants?: PrintifyVariant[];
  images?: PrintifyImage[];
};

export type PrintifyProductPage = { data: PrintifyProduct[]; last_page?: number };

export type NormalizedProduct = {
  printifyId: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  colors: { key: number; name: string; hex: string; hex2?: string; images: string[] }[];
  sizes: { key: number; name: string }[];
  variants: { id: number; price: number; sku?: string; colorKey?: number; sizeKey?: number }[];
};

const maxImages = 12;

export function normalizeProduct(
  product: PrintifyProduct,
): { ok: true; product: NormalizedProduct } | { ok: false; reason: string } {
  const options = product.options ?? [];
  const colorOption = options.find((option) => option.type === "color");
  const otherOptions = options.filter((option) => option !== colorOption);
  if (otherOptions.length > 1) {
    return { ok: false, reason: "has more than a color and one other option" };
  }
  const sizeOption = otherOptions[0];
  const colorKeys = new Set((colorOption?.values ?? []).map((value) => value.id));
  const sizeKeys = new Set((sizeOption?.values ?? []).map((value) => value.id));

  const variants = (product.variants ?? [])
    .filter((variant) => variant.is_enabled !== false && variant.is_available !== false)
    .map((variant) => {
      const colorKey = variant.options.find((id) => colorKeys.has(id));
      const sizeKey = variant.options.find((id) => sizeKeys.has(id));
      return {
        id: variant.id,
        price: Math.round(variant.price),
        ...(variant.sku ? { sku: variant.sku } : {}),
        ...(colorKey === undefined ? {} : { colorKey }),
        ...(sizeKey === undefined ? {} : { sizeKey }),
      };
    });
  if (variants.length === 0) {
    return { ok: false, reason: "has no enabled variants in stock" };
  }

  const sortedImages = [...(product.images ?? [])]
    .filter((image) => isHttpsUrl(image.src))
    .sort((a, b) => Number(b.is_default === true) - Number(a.is_default === true));
  const images = [...new Set(sortedImages.map((image) => image.src))].slice(0, maxImages);

  const usedColors = new Set(variants.map((variant) => variant.colorKey));
  const usedSizes = new Set(variants.map((variant) => variant.sizeKey));
  const colors = (colorOption?.values ?? [])
    .filter((value) => usedColors.has(value.id))
    .map((value) => {
      const [hex, hex2] = (value.colors ?? []).map(normalizeHex);
      const variantIds = new Set(
        (product.variants ?? [])
          .filter((variant) => variant.options.includes(value.id))
          .map((variant) => variant.id),
      );
      const colorImages = sortedImages
        .filter((image) => (image.variant_ids ?? []).some((id) => variantIds.has(id)))
        .map((image) => image.src);
      return {
        key: value.id,
        name: value.title.trim().slice(0, 40),
        hex: hex ?? "#cccccc",
        ...(hex2 === undefined || hex2 === hex ? {} : { hex2 }),
        images: [...new Set(colorImages)].slice(0, maxImages),
      };
    });
  const sizes = (sizeOption?.values ?? [])
    .filter((value) => usedSizes.has(value.id))
    .map((value) => ({ key: value.id, name: value.title.trim().slice(0, 40) }));
  if (images.length === 0) {
    return { ok: false, reason: "has no mockup images" };
  }

  return {
    ok: true,
    product: {
      printifyId: product.id,
      title: product.title.trim().slice(0, 80) || "Untitled",
      description: plainText(product.description ?? "").slice(0, 5000),
      tags: (product.tags ?? []).slice(0, 30),
      images,
      colors,
      sizes,
      variants,
    },
  };
}

function normalizeHex(value: string) {
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) {
    return hex;
  }
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${[...hex.slice(1)].map((char) => char + char).join("")}`;
  }
  return undefined;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function plainText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#\d+|[a-z]+);/gi, (match, code: string) => {
      if (code.startsWith("#")) {
        return String.fromCharCode(Number(code.slice(1)));
      }
      return entities[code.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

export async function verifySignature(secret: string, body: string, header: string | null) {
  if (header === null || !header.startsWith("sha256=")) {
    return false;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  const expected = `sha256=${[...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  if (expected.length !== header.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ header.charCodeAt(index);
  }
  return difference === 0;
}
