"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/components/CartProvider";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/catalog";
import { countryName } from "@/lib/countries";

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const viewer = useQuery(api.users.viewer);
  const placeOrder = useMutation(api.orders.place);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedTotal, setPlacedTotal] = useState<number | null>(null);
  const [addressLine, setAddressLine] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function place(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlacing(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    void placeOrder({
      items: lines.map((line) => ({ name: line.name, quantity: line.quantity })),
      shipName: String(formData.get("shipName") ?? ""),
      addressLine,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      phone,
    })
      .then((order) => {
        clear();
        setPlacedTotal(order.total);
      })
      .catch((placeError: unknown) => {
        setError(placeError instanceof Error ? placeError.message : "Unable to place the order");
        setPlacing(false);
      });
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col px-6 py-16">
        <p className="text-[11px] tracking-[0.22em] uppercase">Checkout</p>
        {placedTotal !== null ? (
          <Placed total={placedTotal} />
        ) : lines.length === 0 ? (
          <EmptyBag />
        ) : viewer === undefined ? (
          <p className="mt-8 text-sm text-[#6f675e]">Loading</p>
        ) : viewer === null ? (
          <SignInPrompt />
        ) : (
          <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <form className="flex flex-col gap-4" onSubmit={place}>
              <h1 className="font-display text-5xl leading-none">Ship to</h1>
              <p className="text-sm text-[#6f675e]">{viewer.email ?? "Signed in"}</p>
              <Field label="Recipient name" name="shipName" autoComplete="name" defaultValue={viewer.name ?? ""} />
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
                {placing ? "Please wait" : "Place order"}
              </button>
              {error && <p className="text-sm text-rose-800">{error}</p>}
            </form>
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
        Complimentary shipping on orders over $200.
      </p>
    </aside>
  );
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

function Placed({ total }: { total: number }) {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Order placed</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        We have your order for {formatPrice(total)}. It is waiting on your account.
      </p>
      <Link
        href="/account"
        className="mt-8 inline-block bg-[#141210] px-6 py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase"
      >
        View account
      </Link>
    </div>
  );
}
