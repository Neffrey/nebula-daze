"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import OrderAddress from "@/components/OrderAddress";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice, products } from "@/lib/catalog";
import { formatOrderNumber } from "@/lib/orderNumber";

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const viewer = useQuery(api.users.viewer);
  const order = useQuery(
    api.orders.getMine,
    viewer ? { orderId: orderId as Id<"orders"> } : "skip",
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col px-6 py-16">
        <Link href="/account" className="text-[11px] tracking-[0.22em] uppercase">
          Account
        </Link>
        {viewer === undefined || (viewer !== null && order === undefined) ? (
          <p className="mt-8 text-sm text-[#6f675e]">Loading</p>
        ) : viewer === null ? (
          <SignedOut orderId={orderId} />
        ) : order === null || order === undefined ? (
          <Missing />
        ) : (
          <Details order={order} />
        )}
      </main>
    </>
  );
}

function SignedOut({ orderId }: { orderId: string }) {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Sign in to view this order</h1>
      <Link
        href={`/signin?next=${encodeURIComponent(`/orders/${orderId}`)}`}
        className="mt-8 inline-block bg-[#141210] px-6 py-3 text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase"
      >
        Sign in
      </Link>
    </div>
  );
}

function Missing() {
  return (
    <div className="mt-8">
      <h1 className="font-display text-5xl leading-none">Order not found</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#6f675e]">
        This order is not on your account.
      </p>
    </div>
  );
}

function Details({
  order,
}: {
  order: {
    orderNumber: string | null;
    placedAt: number;
    total: number;
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
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
  };
}) {
  return (
    <div className="mt-8 min-w-0">
      <h1 className="font-display text-5xl leading-none">
        {order.orderNumber === null ? "Order" : `Order #${formatOrderNumber(order.orderNumber)}`}
      </h1>
      <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border border-[#141210]/15 bg-[#e7e1d8] px-4 py-4">
        <Fact label="Order Placed">
          {new Date(order.placedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Fact>
        <Fact label="Total">{formatPrice(order.total)}</Fact>
      </div>
      <ul className="mt-8 flex flex-col gap-6">
        {order.items.map((item) => {
          const image = products.find((product) => product.name === item.name)?.image;
          return (
            <li key={item.name} className="flex items-center gap-4">
              <div className="relative h-32 w-24 shrink-0 overflow-hidden bg-[#e7e1d8]">
                {image ? <Image src={image} alt="" fill sizes="96px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-3xl leading-none">{item.name}</p>
                <p className="mt-2 text-sm text-[#6f675e]">× {item.quantity}</p>
              </div>
              <p className="text-sm">{formatPrice(item.unitPrice * item.quantity)}</p>
            </li>
          );
        })}
      </ul>
      <div className="mt-10">
        <p className="text-[11px] tracking-[0.16em] text-[#6f675e]">Ship to</p>
        <OrderAddress address={order.shippingAddress} className="mt-2 text-sm leading-6" />
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] text-[#6f675e]">{label}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}
