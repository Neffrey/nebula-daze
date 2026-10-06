"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";
import { CategoryManager, ColorManager, SizeManager } from "@/components/CatalogOptions";
import OrderAddress, { type OrderShippingAddress } from "@/components/OrderAddress";
import ProductCatalog from "@/components/ProductCatalog";
import ProfileSecurity from "@/components/ProfileSecurity";
import Select from "@/components/Select";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice, products } from "@/lib/catalog";
import { formatOrderNumber } from "@/lib/orderNumber";
import { hasAbility, type AccountRole } from "@/lib/roles";
import { uploadFiles } from "@/lib/uploadthing";
import { FaCircleExclamation } from "react-icons/fa6";

const sectionByQuery = {
  profile: "Profile & Security",
  orders: "Orders",
  support: "Support",
  tickets: "Tickets",
  products: "Products",
} as const;

type SectionQuery = keyof typeof sectionByQuery;
type Section = (typeof sectionByQuery)[SectionQuery];

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
  if (section === "Products") {
    return "products";
  }
  return "profile";
}

function visibleSection(value: string | null, role: AccountRole): SectionQuery {
  if (value === "orders" || value === "support" || value === "profile") {
    return value;
  }
  if (value === "tickets" && hasAbility(role, "support")) {
    return "tickets";
  }
  if (value === "products" && hasAbility(role, "admin")) {
    return "products";
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
  const items: readonly Section[] = [
    ...sections,
    ...(hasAbility(role, "support") ? (["Tickets"] as const) : []),
    ...(hasAbility(role, "admin") ? (["Products"] as const) : []),
  ];

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
        {section === "Tickets" ? <TicketQueue /> : null}
        {section === "Products" ? <ProductAdmin /> : null}
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

const supportViews = ["New ticket", "active tickets", "closed tickets"] as const;

type SupportView = (typeof supportViews)[number];

function Support() {
  const [view, setView] = useState<SupportView>("New ticket");
  const [query, setQuery] = useState("");

  return (
    <div className="mt-8">
      <SectionTabs label="Support" items={supportViews} view={view} onView={setView} />
      {view === "New ticket" ? (
        <NewTicket />
      ) : (
        <>
          <TicketSearch id="support-ticket-search" value={query} onChange={setQuery} />
          <TicketList closed={view === "closed tickets"} query={query} />
        </>
      )}
    </div>
  );
}

const ticketViews = ["active tickets", "closed tickets"] as const;

type TicketView = (typeof ticketViews)[number];

function TicketQueue() {
  const [view, setView] = useState<TicketView>("active tickets");
  const [query, setQuery] = useState("");

  return (
    <div className="mt-8">
      <SectionTabs label="Tickets" items={ticketViews} view={view} onView={setView} />
      <TicketSearch id="tickets-search" value={query} onChange={setQuery} />
      <TicketList closed={view === "closed tickets"} everyone query={query} />
    </div>
  );
}

const productViews = ["Products", "Categories", "Colors", "Sizes"] as const;

type ProductView = (typeof productViews)[number];

function ProductAdmin() {
  const [view, setView] = useState<ProductView>("Products");

  return (
    <div className="mt-8">
      <SectionTabs label="Products" items={productViews} view={view} onView={setView} />
      {view === "Products" ? <ProductCatalog /> : null}
      {view === "Categories" ? <CategoryManager /> : null}
      {view === "Colors" ? <ColorManager /> : null}
      {view === "Sizes" ? <SizeManager /> : null}
    </div>
  );
}

function TicketSearch({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative mt-6">
      <input
        id={id}
        type="search"
        value={value}
        aria-label="Search tickets"
        placeholder="Search"
        className={`${ticketFieldClass} pr-10 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none`}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <svg
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.2 10.2L13.5 13.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SectionTabs<T extends string>({
  label,
  items,
  view,
  onView,
}: {
  label: string;
  items: readonly T[];
  view: T;
  onView: (item: T) => void;
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-x-6 border-b border-foreground/10">
        {items.map((item) => {
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
                  onView(item);
                }}
              >
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
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
      <Select<Id<"orders"> | "none">
        id="ticket-order"
        className="mt-3"
        value={orderId === "" ? "none" : orderId}
        disabled={recent === undefined || saving}
        options={[
          { value: "none", label: "no" },
          ...(recent ?? []).map((order) => ({ value: order._id, label: orderChoice(order) })),
        ]}
        onChange={(choice) => {
          setSent(false);
          setOrderId(choice === "none" ? "" : choice);
        }}
      />
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

function TicketList({
  closed,
  everyone = false,
  query,
}: {
  closed: boolean;
  everyone?: boolean;
  query: string;
}) {
  const status = closed ? "closed" : "active";
  const mine = useQuery(api.tickets.listMine, everyone ? "skip" : {});
  const queue = useQuery(api.tickets.listAll, everyone ? { status } : "skip");
  const tickets = everyone ? queue : mine;
  if (tickets === undefined) {
    return <p className="mt-8 text-sm text-muted">Loading</p>;
  }

  const inView = everyone ? tickets : tickets.filter((ticket) => ticket.status === status);
  const shown = inView.filter((ticket) => ticketMatches(ticket, query));
  if (shown.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted">
        {query.trim().length > 0
          ? "No matching tickets."
          : closed
            ? "No closed tickets."
            : "No active tickets."}
      </p>
    );
  }

  return (
    <ul className="mt-2">
      {shown.map((ticket) => (
        <TicketRow key={ticket._id} ticket={ticket} showCreator={everyone} />
      ))}
    </ul>
  );
}

function TicketRow({
  ticket,
  showCreator,
}: {
  ticket: {
    _id: Id<"tickets">;
    createdAt: number;
    orderNumber: string | null;
    preview: string;
    creatorName: string | null;
    creatorImage: string | null;
    lastFromOther: boolean;
    lastFromCreator: boolean;
    lastUpdatedAt: number;
    lastAuthorName: string | null;
    status: "active" | "closed";
  };
  showCreator: boolean;
}) {
  const [open, setOpen] = useState(false);
  const waiting = showCreator ? ticket.lastFromCreator : ticket.lastFromOther;

  return (
    <li className="border-b border-foreground/10">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-start gap-4 py-4 text-left"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-4 text-sm">
            <span>
              {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {ticket.orderNumber === null ? null : (
              <span>Order #{formatOrderNumber(ticket.orderNumber)}</span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted">{ticket.preview}</p>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="flex items-start gap-2">
            <span className="text-right text-xs leading-4 whitespace-nowrap text-muted" suppressHydrationWarning>
              {lastUpdatedLabel(ticket.lastUpdatedAt, ticket.lastAuthorName)}
            </span>
            {waiting ? (
              <FaCircleExclamation
                className="size-4 shrink-0 text-red-600"
                aria-label="New reply"
              />
            ) : null}
          </span>
          <ChatAvatar image={ticket.creatorImage} name={ticket.creatorName} />
        </span>
      </button>
      {open ? (
        <TicketLog ticketId={ticket._id} notes={showCreator} status={ticket.status} />
      ) : null}
    </li>
  );
}

function TicketLog({
  ticketId,
  notes,
  status,
}: {
  ticketId: Id<"tickets">;
  notes: boolean;
  status: "active" | "closed";
}) {
  const messages = useQuery(api.tickets.messages, { ticketId });
  const [preview, setPreview] = useState<string | null>(null);
  if (messages === undefined) {
    return <p className="pb-4 text-sm text-muted">Loading</p>;
  }
  if (messages === null || messages.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <ol className="flex max-h-80 flex-col gap-3 overflow-y-auto bg-background px-3 py-4">
        {messages.map((entry) => {
          const support = entry.from === "support";
          return (
            <li
              key={entry._id}
              className={`flex items-end gap-2 ${support ? "justify-start" : "justify-end"}`}
            >
              {support ? <ChatAvatar image={entry.image} name={entry.name} /> : null}
              <div
                className={`max-w-[75%] rounded-md px-3 py-2 text-sm leading-5 text-[#141210] ${
                  support ? "bg-[#7ec8f0]" : "bg-[#ececec]"
                }`}
              >
                <span className="sr-only">{support ? "Support" : "You"}. </span>
                {entry.imageUrl === null ? null : (
                  <button
                    type="button"
                    className={`block w-full ${entry.message === "" ? "" : "mb-2"}`}
                    onClick={() => {
                      setPreview(entry.imageUrl);
                    }}
                  >
                    {/* Attachments are UploadThing image URLs. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.imageUrl}
                      alt={entry.message === "" ? "Attachment" : ""}
                      className="max-h-48 w-full cursor-zoom-in object-cover"
                    />
                  </button>
                )}
                {entry.message}
              </div>
              {support ? null : <ChatAvatar image={entry.image} name={entry.name} />}
            </li>
          );
        })}
      </ol>
      <TicketReply ticketId={ticketId} notes={notes} status={status} />
      {preview === null ? null : <ChatImagePopup src={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ChatImagePopup({ src, onClose }: { src: string; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <button type="button" aria-label="Close attachment" className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Attachment" className="relative">
        <button
          type="button"
          className="absolute -top-8 right-0 text-[11px] tracking-[0.18em] text-white uppercase"
          onClick={onClose}
        >
          Close
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Attachment" className="max-h-[min(85vh,56rem)] max-w-[min(92vw,72rem)] object-contain" />
      </div>
    </div>
  );
}

function TicketReply({
  ticketId,
  notes,
  status,
}: {
  ticketId: Id<"tickets">;
  notes: boolean;
  status: "active" | "closed";
}) {
  const reply = useMutation(api.tickets.reply);
  const closeTicket = useMutation(api.tickets.close);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const busy = saving || closing;

  function sendAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || saving) {
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a PNG, JPG, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setSaving(true);
    setError(null);
    void uploadFiles("imageUploader", { files: [file] })
      .then(async (uploaded) => {
        const photo = uploaded[0];
        if (photo === undefined) {
          throw new Error("Unable to upload the image");
        }
        await reply({ ticketId, message: "", imageUrl: photo.ufsUrl });
      })
      .catch((uploadError: unknown) => {
        setError(ticketError(uploadError));
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <>
    <form
      className="mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (saving) {
          return;
        }
        setSaving(true);
        setError(null);
        void reply({ ticketId, message })
          .then(() => {
            setMessage("");
          })
          .catch((submitError: unknown) => {
            setError(ticketError(submitError));
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <label className="sr-only" htmlFor={`ticket-reply-${ticketId}`}>
        Write a message
      </label>
      <textarea
        id={`ticket-reply-${ticketId}`}
        className={`${ticketFieldClass} min-h-20`}
        value={message}
        required
        disabled={busy}
        placeholder="Write a message"
        onChange={(event) => {
          setError(null);
          setMessage(event.target.value);
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
          disabled={busy}
        >
          {saving ? "Sending" : "Send"}
        </button>
        <button
          type="button"
          className="border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            fileInput.current?.click();
          }}
        >
          Send attachment
        </button>
        {notes ? (
          <button
            type="button"
            className="border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              setNotesOpen(true);
            }}
          >
            Internal notes
          </button>
        ) : null}
        {notes && status === "active" ? (
          <button
            type="button"
            className="border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
            disabled={busy}
            onClick={() => {
              if (busy) {
                return;
              }
              setClosing(true);
              setError(null);
              void closeTicket({ ticketId })
                .catch((closeError: unknown) => {
                  setError(ticketError(closeError));
                })
                .finally(() => {
                  setClosing(false);
                });
            }}
          >
            {closing ? "Closing" : "Close ticket"}
          </button>
        ) : null}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label="Send attachment"
        onChange={sendAttachment}
      />
      {error ? <p className="mt-3 text-sm">{error}</p> : null}
    </form>
    {notesOpen ? <InternalNotes ticketId={ticketId} onClose={() => setNotesOpen(false)} /> : null}
    </>
  );
}

function InternalNotes({ ticketId, onClose }: { ticketId: Id<"tickets">; onClose: () => void }) {
  const notes = useQuery(api.tickets.notes, { ticketId });
  const addNote = useMutation(api.tickets.addNote);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close internal notes"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="internal-notes-title"
        className="relative max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto bg-background p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="internal-notes-title" className="text-[11px] tracking-[0.22em] uppercase">
            Internal notes
          </h2>
          <button type="button" className="text-[11px] tracking-[0.18em] uppercase" onClick={onClose}>
            Close
          </button>
        </div>
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (saving) {
              return;
            }
            setSaving(true);
            setError(null);
            void addNote({ ticketId, note })
              .then(() => {
                setNote("");
              })
              .catch((submitError: unknown) => {
                setError(ticketError(submitError));
              })
              .finally(() => {
                setSaving(false);
              });
          }}
        >
          <label className="sr-only" htmlFor={`ticket-note-${ticketId}`}>
            Internal note
          </label>
          <textarea
            id={`ticket-note-${ticketId}`}
            className={`${ticketFieldClass} min-h-24`}
            value={note}
            required
            disabled={saving}
            placeholder="Write a note"
            onChange={(event) => {
              setError(null);
              setNote(event.target.value);
            }}
          />
          <button
            type="submit"
            className="mt-3 border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving" : "Add note"}
          </button>
          {error ? <p className="mt-3 text-sm">{error}</p> : null}
        </form>
        {notes === undefined ? (
          <p className="mt-6 text-sm text-muted">Loading</p>
        ) : notes.length === 0 ? null : (
          <ol className="mt-6 flex flex-col gap-3">
            {notes.map((entry) => (
              <li
                key={entry._id}
                className={`flex items-end gap-2 ${entry.mine ? "justify-end" : "justify-start"}`}
              >
                {entry.mine ? null : <ChatAvatar image={entry.image} name={entry.name} />}
                <p
                  className={`max-w-[75%] rounded-md px-3 py-2 text-sm leading-5 text-[#141210] ${
                    entry.mine ? "bg-[#ececec]" : "bg-[#7ec8f0]"
                  }`}
                >
                  <span className="sr-only">{entry.mine ? "You" : "Support"}. </span>
                  {entry.note}
                </p>
                {entry.mine ? <ChatAvatar image={entry.image} name={entry.name} /> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
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

function lastUpdatedLabel(at: number, name: string | null) {
  const elapsed = Math.max(0, Date.now() - at);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const year = 365 * day;
  let count: number;
  let unit: "minute" | "hour" | "day" | "year";
  if (elapsed >= year) {
    count = Math.floor(elapsed / year);
    unit = "year";
  } else if (elapsed >= day) {
    count = Math.floor(elapsed / day);
    unit = "day";
  } else if (elapsed >= hour) {
    count = Math.floor(elapsed / hour);
    unit = "hour";
  } else {
    count = Math.max(1, Math.floor(elapsed / minute));
    unit = "minute";
  }
  const who = name === null || name.trim() === "" ? "" : ` by ${name.trim()}`;
  return `last updated${who} ${count} ${count === 1 ? unit : `${unit}s`} ago`;
}

function ticketMatches(
  ticket: {
    createdAt: number;
    orderNumber: string | null;
    creatorName: string | null;
    messagesText: string;
  },
  query: string,
) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return true;
  }
  const date = new Date(ticket.createdAt);
  const longDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const numericDate = date.toLocaleDateString("en-US");
  const order = ticket.orderNumber ?? "";
  const formatted = order.length === 0 ? "" : formatOrderNumber(order);
  const haystack = [ticket.creatorName ?? "", longDate, numericDate, order, formatted, ticket.messagesText]
    .join("\n")
    .toLowerCase();
  if (haystack.includes(needle)) {
    return true;
  }
  const compactNeedle = needle.replace(/[-\s]/g, "");
  if (compactNeedle.length === 0) {
    return false;
  }
  return haystack.replace(/[-\s]/g, "").includes(compactNeedle);
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
