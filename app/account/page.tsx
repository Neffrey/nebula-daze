"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OrderAddress, { type OrderShippingAddress } from "@/components/OrderAddress";
import ProfileSecurity from "@/components/ProfileSecurity";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import { formatPrice, products } from "@/lib/catalog";
import { formatOrderNumber } from "@/lib/orderNumber";

const sections = ["Profile & Security", "Orders", "Support"] as const;

type Section = (typeof sections)[number];

export default function AccountPage() {
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col px-6 py-16">
        <p className="text-[11px] tracking-[0.22em] uppercase">Account</p>
        {viewer === undefined ? (
          <p className="mt-8 text-sm text-muted">Loading</p>
        ) : viewer === null ? (
          <SignedOut />
        ) : (
          <SignedIn
            onSignOut={() => {
              void signOut().then(() => {
                router.push("/");
              });
            }}
          />
        )}
      </main>
    </>
  );
}

function SignedOut() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Sign in to Narel</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted">
        Your orders and client details live here once you are signed in.
      </p>
      <Link
        href="/signin?next=/account"
        className="mt-8 inline-block bg-foreground px-6 py-3 text-[11px] tracking-[0.22em] text-background uppercase"
      >
        Sign in
      </Link>
    </div>
  );
}

function SignedIn({ onSignOut }: { onSignOut: () => void }) {
  const [section, setSection] = useState<Section>("Profile & Security");

  return (
    <div className="mt-10 grid items-start gap-10 md:grid-cols-[13rem_1fr] md:gap-16">
      <nav aria-label="Account">
        <ul className="flex flex-col">
          {sections.map((item) => {
            const selected = item === section;
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  className={`w-full border-l px-4 py-3 text-left text-[11px] tracking-[0.16em] uppercase ${
                    selected
                      ? "border-foreground"
                      : "border-transparent text-muted"
                  }`}
                  onClick={() => {
                    setSection(item);
                  }}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <section className="min-w-0">
        {section === "Profile & Security" ? (
          <ProfileSecurity onSignOut={onSignOut} />
        ) : (
          <h1 className="font-display text-5xl leading-none">{section}</h1>
        )}
        {section === "Orders" ? <Orders /> : null}
        {section === "Support" ? <Support /> : null}
      </section>
    </div>
  );
}

function Orders() {
  const orders = useQuery(api.orders.listMine);

  if (orders === undefined) {
    return <p className="mt-8 text-sm text-muted">Loading</p>;
  }

  if (orders.length === 0) {
    return (
      <>
        <p className="font-display mt-8 text-4xl">No orders yet.</p>
        <Link
          href="/"
          className="mt-6 inline-block text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </>
    );
  }

  return (
    <ul className="mt-8 flex flex-col gap-6">
      {orders.map((order) => (
        <li key={order._id} className="min-w-0 border border-foreground/15">
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4 bg-surface px-4 py-4">
            <OrderFact label="Order Placed">
              {new Date(order.placedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </OrderFact>
            <OrderFact label="Total">{formatPrice(order.total)}</OrderFact>
            <ShipTo address={order.shippingAddress} />
            <p className="text-sm sm:ml-auto">
              {order.orderNumber === null ? "Order" : `Order #${formatOrderNumber(order.orderNumber)}`}
            </p>
          </div>
          <ul className="flex flex-col gap-4 px-4 py-4">
            {order.items.map((item) => {
              const image = products.find((product) => product.name === item.name)?.image;
              return (
                <li key={item.name} className="flex items-center gap-4">
                  <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-surface">
                    {image ? (
                      <Image src={image} alt="" fill sizes="72px" className="object-cover" />
                    ) : null}
                  </div>
                  <p className="min-w-0 flex-1 font-display text-xl leading-tight">
                    {item.name}
                    <span className="mt-1 block font-sans text-sm text-muted">× {item.quantity}</span>
                  </p>
                  <ItemActions trackingUrl={item.trackingUrl} />
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function ItemActions({ trackingUrl }: { trackingUrl: string | null }) {
  const href = trackingLink(trackingUrl);
  const actionClass =
    "border border-foreground/20 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:text-muted";

  return (
    <div className="ml-auto flex shrink-0 flex-col gap-2">
      {href === null ? (
        <button type="button" disabled className={actionClass}>
          tracking unavailable
        </button>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={actionClass}>
          Track package
        </a>
      )}
      <button type="button" disabled className={actionClass}>
        Get product support
      </button>
      <button type="button" disabled className={actionClass}>
        Write a product review
      </button>
    </div>
  );
}

function trackingLink(url: string | null) {
  if (url === null || url.trim().length === 0) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function ShipTo({ address }: { address: OrderShippingAddress }) {
  const [open, setOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
      }
    };
  }, []);

  function clearHide() {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function show() {
    clearHide();
    setFade(false);
    setOpen(true);
  }

  function lingerThenFade() {
    clearHide();
    hideTimer.current = window.setTimeout(() => {
      setFade(true);
      setOpen(false);
    }, 400);
  }

  function closeNow() {
    clearHide();
    setFade(false);
    setOpen(false);
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={lingerThenFade}>
      <p className="text-[11px] tracking-[0.16em] text-muted">Ship to</p>
      <p className="mt-1 text-sm" tabIndex={0} onFocus={show} onBlur={lingerThenFade}>
        {address.name}
      </p>
      <div
        role="tooltip"
        className={`absolute top-full left-0 z-10 mt-2 w-max border border-foreground/15 bg-background px-3 py-2 pr-8 shadow-sm transition-opacity ${
          fade ? "duration-500" : "duration-0"
        } ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute top-2 right-2 text-foreground"
          onClick={closeNow}
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <OrderAddress address={address} className="text-sm leading-6" />
      </div>
    </div>
  );
}

function OrderFact({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}

function Support() {
  return (
    <p className="mt-8 max-w-md text-sm leading-6 text-muted">
      Write the house at{" "}
      <a href="mailto:hello@example.com" className="text-foreground underline underline-offset-4">
        hello@example.com
      </a>
      .
    </p>
  );
}
