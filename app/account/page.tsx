"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProfileSecurity from "@/components/ProfileSecurity";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/catalog";

const sections = [
  "Profile & Security",
  "Orders",
  "Payments",
  "Preferences",
  "Support",
] as const;

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
          <p className="mt-8 text-sm text-[#6f675e]">Loading</p>
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
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        Your orders and client details live here once you are signed in.
      </p>
      <Link
        href="/signin?next=/account"
        className="mt-8 inline-block bg-[#141210] px-6 py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase"
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
                      ? "border-[#141210]"
                      : "border-transparent text-[#6f675e]"
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
      <section>
        <h1 className="font-display text-5xl leading-none">{section}</h1>
        {section === "Profile & Security" ? <ProfileSecurity onSignOut={onSignOut} /> : null}
        {section === "Orders" ? <Orders /> : null}
        {section === "Payments" ? <Payments /> : null}
        {section === "Preferences" ? <Preferences /> : null}
        {section === "Support" ? <Support /> : null}
      </section>
    </div>
  );
}

function Orders() {
  const orders = useQuery(api.orders.listMine);

  if (orders === undefined) {
    return <p className="mt-8 text-sm text-[#6f675e]">Loading</p>;
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
    <ul className="mt-8 flex flex-col gap-8">
      {orders.map((order) => (
        <li key={order._id}>
          <p className="text-[11px] tracking-[0.16em] text-[#6f675e] uppercase">
            {new Date(order.placedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" · "}
            {order.city}
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {order.items.map((item) => (
              <li key={item.name}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">{formatPrice(order.total)}</p>
        </li>
      ))}
    </ul>
  );
}

function Payments() {
  return (
    <p className="mt-8 max-w-md text-sm leading-6 text-[#6f675e]">
      No payment methods saved. Narel does not keep a card on file.
    </p>
  );
}

function Preferences() {
  return (
    <p className="mt-8 max-w-md text-sm leading-6 text-[#6f675e]">
      Nothing set yet. Correspondence goes to the email on your profile.
    </p>
  );
}

function Support() {
  return (
    <p className="mt-8 max-w-md text-sm leading-6 text-[#6f675e]">
      Write the house at{" "}
      <a href="mailto:hello@example.com" className="text-[#141210] underline underline-offset-4">
        hello@example.com
      </a>
      .
    </p>
  );
}
