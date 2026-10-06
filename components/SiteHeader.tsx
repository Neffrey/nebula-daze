"use client";

import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/catalog";

export default function SiteHeader() {
  const { lines, count, remove } = useCart();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const topLevel = (useQuery(api.categories.options) ?? []).filter(
    (category) => category.parentId === undefined,
  );
  const categories = ["New", ...topLevel.map((category) => category.name)];
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  return (
    <>
      <p className="bg-foreground px-4 py-2 text-center text-[11px] tracking-[0.22em] text-background uppercase">
        Complimentary shipping on orders over $200
      </p>
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="text-[11px] tracking-[0.22em] uppercase lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
          <nav className="hidden items-center gap-5 lg:flex">
            <Link href="/products" className="text-[11px] tracking-[0.16em] uppercase">
              Shop all
            </Link>
            {categories.map((category) => (
              <a
                key={category}
                href={`/#${category.toLowerCase()}`}
                className="text-[11px] tracking-[0.16em] uppercase"
              >
                {category}
              </a>
            ))}
          </nav>
          <Link
            href="/"
            className="font-display absolute left-1/2 -translate-x-1/2 text-xl tracking-[0.28em] sm:text-2xl sm:tracking-[0.42em]"
          >
            NAREL
          </Link>
          <div className="flex items-center gap-5 text-[11px] tracking-[0.16em] uppercase">
            {isLoading ? null : isAuthenticated ? (
              <Link href="/account">Account</Link>
            ) : (
              <Link href="/signin">Sign in</Link>
            )}
            <button type="button" onClick={() => setBagOpen(true)}>
              Bag ({count})
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-background">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-display text-2xl tracking-[0.42em]">NAREL</span>
            <button
              type="button"
              className="text-[11px] tracking-[0.18em] uppercase"
              onClick={() => setMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <nav className="flex flex-col gap-6 px-6 pt-10">
            <Link href="/products" className="font-display text-4xl" onClick={() => setMenuOpen(false)}>
              Shop all
            </Link>
            {categories.map((category) => (
              <a
                key={category}
                href={`/#${category.toLowerCase()}`}
                className="font-display text-4xl"
                onClick={() => setMenuOpen(false)}
              >
                {category}
              </a>
            ))}
          </nav>
        </div>
      )}

      {bagOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close bag"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setBagOpen(false)}
          />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-background p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] tracking-[0.22em] uppercase">Bag</h2>
              <button
                type="button"
                className="text-[11px] tracking-[0.18em] uppercase"
                onClick={() => setBagOpen(false)}
              >
                Close
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="font-display mt-16 text-3xl">Your bag is empty.</p>
            ) : (
              <ul className="mt-10 flex flex-1 flex-col gap-6 overflow-y-auto">
                {lines.map((line) => (
                  <li key={line.name} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-2xl leading-tight">{line.name}</p>
                      <p className="mt-1 text-sm text-muted">Qty {line.quantity}</p>
                      <button
                        type="button"
                        className="mt-2 text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
                        onClick={() => remove(line.name)}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="shrink-0 text-sm">
                      {formatPrice(line.price * line.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 border-t border-foreground/10 pt-4">
              {lines.length > 0 && (
                <>
                  <p className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </p>
                  <Link
                    href="/checkout"
                    className="mt-6 block bg-foreground py-3 text-center text-[11px] tracking-[0.22em] text-background uppercase"
                    onClick={() => setBagOpen(false)}
                  >
                    Checkout
                  </Link>
                </>
              )}
              <a
                href="#new"
                className="mt-6 inline-block text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
                onClick={() => setBagOpen(false)}
              >
                Continue shopping
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
