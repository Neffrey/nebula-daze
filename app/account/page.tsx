"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import OrderAddress, { type OrderShippingAddress } from "@/components/OrderAddress";
import ProfileSecurity from "@/components/ProfileSecurity";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice, products } from "@/lib/catalog";
import { formatOrderNumber } from "@/lib/orderNumber";

const sectionByQuery = {
  profile: "Profile & Security",
  orders: "Orders",
  support: "Support",
  tickets: "Tickets",
} as const;

type SectionQuery = keyof typeof sectionByQuery;
type Section = (typeof sectionByQuery)[SectionQuery];
type AccountRole = "user" | "admin" | "banned";

const sections: readonly Section[] = ["Profile & Security", "Orders", "Support"];

function sectionQuery(section: Section): SectionQuery {
  if (section === "Orders") {
    return "orders";
  }
  if (section === "Support") {
    return "support";
  }
  if (section === "Tickets") {
    return "tickets";
  }
  return "profile";
}

function visibleSection(value: string | null, role: AccountRole): SectionQuery {
  if (value === "orders" || value === "support" || value === "profile") {
    return value;
  }
  if (value === "tickets" && role === "admin") {
    return "tickets";
  }
  return "profile";
}

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
          <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading</p>}>
            <SignedIn
              role={viewer.role}
              onSignOut={() => {
                void signOut().then(() => {
                  router.push("/");
                });
              }}
            />
          </Suspense>
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

function SignedIn({
  role,
  onSignOut,
}: {
  role: AccountRole;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("section");
  const query = visibleSection(requested, role);
  const section = sectionByQuery[query];
  const items: readonly Section[] = role === "admin" ? [...sections, "Tickets"] : sections;

  useEffect(() => {
    if (requested === query) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("section", query);
    router.replace(`/account?${params.toString()}`, { scroll: false });
  }, [query, requested, router]);

  return (
    <div className="mt-10 grid items-start gap-10 md:grid-cols-[13rem_1fr] md:gap-16">
      <nav aria-label="Account">
        <ul className="flex flex-col">
          {items.map((item) => {
            const selected = item === section;
            return (
              <li key={item}>
                <Link
                  href={`/account?section=${sectionQuery(item)}`}
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  className={`block w-full border-l px-4 py-3 text-left text-[11px] tracking-[0.16em] uppercase ${
                    selected
                      ? "border-foreground"
                      : "border-transparent text-muted"
                  }`}
                >
                  {item}
                </Link>
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

const supportViews = ["New ticket", "active tickets", "archived tickets"] as const;

type SupportView = (typeof supportViews)[number];

function Support() {
  const [view, setView] = useState<SupportView>("New ticket");

  return (
    <div className="mt-8">
      <nav aria-label="Support">
        <ul className="flex flex-wrap gap-x-6 border-b border-foreground/10">
          {supportViews.map((item) => {
            const selected = item === view;
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  className={`border-b py-3 text-sm ${
                    selected ? "border-foreground" : "border-transparent text-muted"
                  }`}
                  onClick={() => {
                    setView(item);
                  }}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      {view === "New ticket" ? <NewTicket /> : <TicketList archived={view === "archived tickets"} />}
    </div>
  );
}

function NewTicket() {
  const orders = useQuery(api.orders.listMine);
  const createTicket = useMutation(api.tickets.create);
  const [orderId, setOrderId] = useState<Id<"orders"> | "">("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const recent =
    orders === undefined ? undefined : [...orders].sort((left, right) => right.placedAt - left.placedAt);

  return (
    <form
      className="mt-8 max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        if (recent === undefined || saving) {
          return;
        }
        setSaving(true);
        setError(null);
        setSent(false);
        void createTicket({
          message,
          ...(orderId === "" ? {} : { orderId }),
        })
          .then(() => {
            setOrderId("");
            setMessage("");
            setSent(true);
          })
          .catch((submitError: unknown) => {
            setError(ticketError(submitError));
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <label className="block text-sm" htmlFor="ticket-order">
        is this about a recent order
      </label>
      <select
        id="ticket-order"
        className={`${ticketFieldClass} mt-3`}
        value={orderId}
        disabled={recent === undefined || saving}
        onChange={(event) => {
          const match = recent?.find((order) => order._id === event.target.value);
          setSent(false);
          setOrderId(match?._id ?? "");
        }}
      >
        <option value="">no</option>
        {recent?.map((order) => (
          <option key={order._id} value={order._id}>
            {orderChoice(order)}
          </option>
        ))}
      </select>
      <label className="mt-8 block text-sm" htmlFor="ticket-message">
        how can we help you?
      </label>
      <textarea
        id="ticket-message"
        className={`${ticketFieldClass} mt-3 min-h-32`}
        value={message}
        required
        disabled={saving}
        onChange={(event) => {
          setSent(false);
          setMessage(event.target.value);
        }}
      />
      <button
        type="submit"
        className="mt-6 border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
        disabled={saving || recent === undefined}
      >
        {saving ? "Sending" : "Send"}
      </button>
      {error ? <p className="mt-4 text-sm">{error}</p> : null}
      {sent ? <p className="mt-4 text-sm">Ticket sent.</p> : null}
      <p className="mt-8 text-sm leading-6 text-muted">
        Write the house at{" "}
        <a href="mailto:hello@example.com" className="text-foreground underline underline-offset-4">
          hello@example.com
        </a>
        .
      </p>
    </form>
  );
}

function TicketList({ archived }: { archived: boolean }) {
  const tickets = useQuery(api.tickets.listMine);
  if (tickets === undefined) {
    return <p className="mt-8 text-sm text-muted">Loading</p>;
  }

  const shown = tickets.filter((ticket) => ticket.status === (archived ? "archived" : "active"));
  if (shown.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted">
        {archived ? "No archived tickets." : "No active tickets."}
      </p>
    );
  }

  return (
    <ul className="mt-2">
      {shown.map((ticket) => (
        <TicketRow key={ticket._id} ticket={ticket} />
      ))}
    </ul>
  );
}

function TicketRow({
  ticket,
}: {
  ticket: {
    _id: Id<"tickets">;
    createdAt: number;
    orderNumber: string | null;
    preview: string;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-foreground/10">
      <button
        type="button"
        aria-expanded={open}
        className="w-full py-4 text-left"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <p className="text-sm">
          {new Date(ticket.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {ticket.orderNumber === null ? null : (
          <p className="mt-1 text-sm">Order #{formatOrderNumber(ticket.orderNumber)}</p>
        )}
        <p className="mt-2 text-sm text-muted">{ticket.preview}</p>
      </button>
      {open ? <TicketLog ticketId={ticket._id} /> : null}
    </li>
  );
}

function TicketLog({ ticketId }: { ticketId: Id<"tickets"> }) {
  const messages = useQuery(api.tickets.messages, { ticketId });
  if (messages === undefined) {
    return <p className="pb-4 text-sm text-muted">Loading</p>;
  }
  if (messages === null || messages.length === 0) {
    return null;
  }

  return (
    <ol className="mb-4 flex max-h-80 flex-col gap-3 overflow-y-auto bg-background px-3 py-4">
      {messages.map((entry) => {
        const support = entry.from === "support";
        return (
          <li
            key={entry._id}
            className={`flex items-end gap-2 ${support ? "justify-start" : "justify-end"}`}
          >
            {support ? <ChatAvatar image={entry.image} name={entry.name} /> : null}
            <p
              className={`max-w-[75%] rounded-md px-3 py-2 text-sm leading-5 text-[#141210] ${
                support ? "bg-[#7ec8f0]" : "bg-[#ececec]"
              }`}
            >
              <span className="sr-only">{support ? "Support" : "You"}. </span>
              {entry.message}
            </p>
            {support ? null : <ChatAvatar image={entry.image} name={entry.name} />}
          </li>
        );
      })}
    </ol>
  );
}

function ChatAvatar({ image, name }: { image: string | null; name: string | null }) {
  const label = name?.trim() ?? "";
  const letter = label.charAt(0).toLocaleUpperCase();
  return (
    <span className="flex w-14 shrink-0 flex-col items-center gap-1">
      {image !== null ? (
        // Profile photos can come from Google, UploadThing, or Convex storage.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="size-7 rounded-full border border-[#d0d0d0] object-cover"
        />
      ) : (
        <span
          className="flex size-7 items-center justify-center rounded-full border border-[#d0d0d0] bg-white text-xs font-medium text-[#141210]"
          aria-hidden="true"
        >
          {letter}
        </span>
      )}
      {label !== "" ? (
        <span className="max-w-full truncate text-center text-[10px] leading-3 text-foreground">
          {label}
        </span>
      ) : null}
    </span>
  );
}

function orderChoice(order: { orderNumber: string | null; placedAt: number }) {
  const when = new Date(order.placedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const number =
    order.orderNumber === null ? "Order" : `Order #${formatOrderNumber(order.orderNumber)}`;
  return `${number}, ${when}`;
}

function ticketError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to send";
  const uncaught = message.match(/Uncaught Error: (.*?)(?:\s+at\s+|$)/);
  return uncaught?.[1] ?? message;
}

const ticketFieldClass =
  "w-full border border-foreground/20 bg-background px-3 py-3 text-sm outline-none";
