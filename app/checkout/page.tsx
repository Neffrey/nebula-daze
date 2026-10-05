"use client";

import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import OrderAddress from "@/components/OrderAddress";
import SavedAddresses from "@/components/SavedAddresses";
import SiteHeader from "@/components/SiteHeader";
import { useCart, type CartLine } from "@/components/CartProvider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice, products } from "@/lib/catalog";
import { formatOrderNumber } from "@/lib/orderNumber";
import { countryName } from "@/lib/countries";

const CHECKOUT_BAG_KEY = "narel-checkout-bag";

export default function CheckoutPage() {
  const { lines, replace, clear } = useCart();
  const profile = useQuery(api.users.profile);
  const pay = useAction(api.checkout.pay);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [ready, setReady] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<Id<"orders"> | null>(null);
  const [addressLine, setAddressLine] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddressId, setShippingAddressId] = useState<Id<"addresses"> | null>(null);
  const restored = useRef(false);
  const clearedPayment = useRef(false);
  const payment = useQuery(
    api.orders.status,
    returnOrderId ? { orderId: returnOrderId } : "skip",
  );

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const defaultAddress =
    profile === undefined || profile === null
      ? null
      : (profile.addresses.find((address) => address.isDefault) ?? null);
  const shippingAddress =
    profile === undefined || profile === null
      ? null
      : (profile.addresses.find((address) => address._id === shippingAddressId) ?? defaultAddress);

  useEffect(() => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    const orderId = new URLSearchParams(window.location.search).get("order");
    if (orderId) {
      setReturnOrderId(orderId as Id<"orders">);
      setReady(true);
      return;
    }
    const saved = readSavedCheckout();
    if (saved) {
      if (lines.length === 0) {
        replace(saved.lines);
      }
      if (saved.shippingAddressId) {
        setShippingAddressId(saved.shippingAddressId);
      }
    }
    setReady(true);
  }, [lines.length, replace]);

  useEffect(() => {
    if (!payment?.paid || clearedPayment.current) {
      return;
    }
    clearedPayment.current = true;
    clear();
    sessionStorage.removeItem(CHECKOUT_BAG_KEY);
  }, [payment?.paid, clear]);

  function startCardPayment(shipping: {
    shipName: string;
    addressLine: string;
    addressLine2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
  }) {
    setPlacing(true);
    setError(null);
    rememberCheckout(lines, shippingAddressId);
    void pay({
      items: lines.map((line) => ({ name: line.name, quantity: line.quantity })),
      origin: window.location.origin,
      ...shipping,
    })
      .then((session) => {
        window.location.assign(session.url);
      })
      .catch((payError: unknown) => {
        setError(payErrorMessage(payError));
        setPlacing(false);
      });
  }

  function placeSaved() {
    if (shippingAddress === null) {
      return;
    }
    startCardPayment({
      shipName: shippingAddress.label,
      addressLine: shippingAddress.addressLine,
      addressLine2: shippingAddress.addressLine2 ?? "",
      city: shippingAddress.city,
      region: shippingAddress.region ?? "",
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country ?? "",
      phone: shippingAddress.phone ?? "",
    });
  }

  function place(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startCardPayment({
      shipName: String(formData.get("shipName") ?? ""),
      addressLine,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      phone,
    });
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col px-6 py-16">
        <p className="text-[11px] tracking-[0.22em] uppercase">Checkout</p>
        {!ready || (returnOrderId !== null && payment === undefined) ? (
          <p className="mt-8 text-sm text-[#6f675e]">Loading</p>
        ) : payment?.paid ? (
          <Placed
            total={payment.total}
            orderNumber={payment.orderNumber}
            shippingAddress={payment.shippingAddress}
          />
        ) : returnOrderId !== null && payment !== undefined && payment !== null && !payment.paid ? (
          <Confirming />
        ) : returnOrderId !== null && payment === null ? (
          <MissingPayment />
        ) : lines.length === 0 ? (
          <EmptyBag />
        ) : profile === undefined ? (
          <p className="mt-8 text-sm text-[#6f675e]">Loading</p>
        ) : profile === null ? (
          <SignInPrompt />
        ) : (
          <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-5xl leading-none">Ship to</h1>
              <p className="text-sm text-[#6f675e]">{profile.email ?? "Signed in"}</p>
              {defaultAddress ? (
                <>
                  <SavedAddresses
                    addresses={profile.addresses}
                    checkout
                    shippingAddressId={shippingAddress?._id ?? null}
                    onShippingAddressChange={setShippingAddressId}
                  />
                  <button
                    type="button"
                    className="mt-2 bg-[#141210] py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase disabled:opacity-50"
                    disabled={placing}
                    onClick={placeSaved}
                  >
                    {placing ? "Please wait" : "Pay with card"}
                  </button>
                  {error && <p className="text-sm text-rose-800">{error}</p>}
                </>
              ) : (
            <form className="flex flex-col gap-4" onSubmit={place}>
              <Field label="Recipient name" name="shipName" autoComplete="name" defaultValue={profile.name ?? ""} />
              <label className="text-[11px] tracking-[0.16em] uppercase">
                Address
                <AddressAutocomplete
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  value={addressLine}
                  required
                  onChange={setAddressLine}
                  onPlace={(place) => {
                    if (place.addressLine) {
                      setAddressLine(place.addressLine);
                    }
                    if (place.addressLine2) {
                      setAddressLine2(place.addressLine2);
                    }
                    if (place.city) {
                      setCity(place.city);
                    }
                    if (place.region) {
                      setRegion(place.region);
                    }
                    if (place.postalCode) {
                      setPostalCode(place.postalCode);
                    }
                    if (place.country) {
                      setCountry(countryName(place.country));
                    }
                  }}
                />
              </label>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                Apartment, suite, or unit
                <input
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  name="addressLine2"
                  autoComplete="address-line2"
                  value={addressLine2}
                  onChange={(event) => {
                    setAddressLine2(event.target.value);
                  }}
                />
              </label>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                City
                <input
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  name="city"
                  autoComplete="address-level2"
                  required
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                  }}
                />
              </label>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                State / Province
                <input
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  name="region"
                  autoComplete="address-level1"
                  required
                  value={region}
                  onChange={(event) => {
                    setRegion(event.target.value);
                  }}
                />
              </label>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                Postal code
                <input
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  name="postalCode"
                  autoComplete="postal-code"
                  required
                  value={postalCode}
                  onChange={(event) => {
                    setPostalCode(event.target.value);
                  }}
                />
              </label>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                Country
                <input
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  name="country"
                  autoComplete="country-name"
                  required
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
                  }}
                />
              </label>
              <label className="text-[11px] tracking-[0.16em] uppercase">
                Phone
                <input
                  className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
                  name="phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                  }}
                />
              </label>
              <button
                type="submit"
                className="mt-2 bg-[#141210] py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase disabled:opacity-50"
                disabled={placing}
              >
                {placing ? "Please wait" : "Pay with card"}
              </button>
              {error && <p className="text-sm text-rose-800">{error}</p>}
            </form>
              )}
            </div>
            <Summary lines={lines} subtotal={subtotal} />
          </div>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  name,
  autoComplete,
  defaultValue,
}: {
  label: string;
  name: string;
  autoComplete: string;
  defaultValue?: string;
}) {
  return (
    <label className="text-[11px] tracking-[0.16em] uppercase">
      {label}
      <input
        className="mt-2 w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm tracking-normal normal-case outline-none"
        name={name}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
      />
    </label>
  );
}

function Summary({
  lines,
  subtotal,
}: {
  lines: { name: string; quantity: number; price: number }[];
  subtotal: number;
}) {
  return (
    <aside>
      <h2 className="text-[11px] tracking-[0.22em] uppercase">Your bag</h2>
      <ul className="mt-6 flex flex-col gap-4">
        {lines.map((line) => (
          <li key={line.name} className="flex justify-between gap-4 text-sm">
            <span>
              {line.name}
              <span className="text-[#6f675e]"> × {line.quantity}</span>
            </span>
            <span>{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex justify-between border-t border-[#141210]/10 pt-4 text-sm">
        <span>Total</span>
        <span>{formatPrice(subtotal)}</span>
      </p>
      <p className="mt-3 text-sm text-[#6f675e]">
        Complimentary shipping on orders over $200. Your card is entered on Stripe, and the order is placed after the payment is confirmed.
      </p>
    </aside>
  );
}

function payErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const uncaught = message.match(/Uncaught Error: (.*?)(?:\s+at\s+|$)/);
  if (uncaught?.[1]) {
    return uncaught[1];
  }
  if (message.length > 0 && !message.includes("[CONVEX")) {
    return message;
  }
  return "Card checkout could not be started";
}

function rememberCheckout(lines: CartLine[], shippingAddressId: Id<"addresses"> | null) {
  sessionStorage.setItem(
    CHECKOUT_BAG_KEY,
    JSON.stringify({
      lines: lines.map((line) => ({ name: line.name, quantity: line.quantity })),
      shippingAddressId,
    }),
  );
}

function readSavedCheckout(): { lines: CartLine[]; shippingAddressId: Id<"addresses"> | null } | null {
  const raw = sessionStorage.getItem(CHECKOUT_BAG_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || !("lines" in parsed) || !Array.isArray(parsed.lines)) {
    return null;
  }

  const lines: CartLine[] = [];
  for (const entry of parsed.lines) {
    if (typeof entry !== "object" || entry === null || !("name" in entry) || !("quantity" in entry)) {
      continue;
    }
    if (typeof entry.name !== "string" || typeof entry.quantity !== "number") {
      continue;
    }
    if (!Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 10) {
      continue;
    }
    const product = products.find((item) => item.name === entry.name);
    if (!product) {
      continue;
    }
    lines.push({ ...product, quantity: entry.quantity });
  }
  if (lines.length === 0) {
    return null;
  }

  const shippingAddressId =
    "shippingAddressId" in parsed && typeof parsed.shippingAddressId === "string"
      ? (parsed.shippingAddressId as Id<"addresses">)
      : null;
  return { lines, shippingAddressId };
}

function EmptyBag() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Your bag is empty.</h1>
      <Link
        href="/"
        className="mt-8 inline-block text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
      >
        Continue shopping
      </Link>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Sign in to check out</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        Orders are kept on your account.
      </p>
      <Link
        href="/signin?next=/checkout"
        className="mt-8 inline-block bg-[#141210] px-6 py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase"
      >
        Sign in
      </Link>
    </div>
  );
}

function Confirming() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Confirming payment</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        Stripe accepted the return from checkout. This page updates when the payment is confirmed.
      </p>
    </div>
  );
}

function MissingPayment() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Payment not found</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        That payment is not on this account.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
      >
        Continue shopping
      </Link>
    </div>
  );
}

function Placed({
  total,
  orderNumber,
  shippingAddress,
}: {
  total: number;
  orderNumber: string | null;
  shippingAddress: {
    name: string;
    addressLine: string;
    addressLine2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}) {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Order placed</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        {orderNumber === null ? "Your order" : `Order #${formatOrderNumber(orderNumber)}`} for {formatPrice(total)} is confirmed. It is
        waiting on your account.
      </p>
      <OrderAddress address={shippingAddress} />
      <Link
        href="/account"
        className="mt-8 inline-block bg-[#141210] px-6 py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase"
      >
        View account
      </Link>
    </div>
  );
}
