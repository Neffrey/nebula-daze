"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/catalog";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  return (
    <>
      <p className="bg-[#141210] px-4 py-2 text-center text-[11px] tracking-[0.22em] text-[#f4f1eb] uppercase">
        Complimentary shipping on orders over $200
      </p>
      <header className="sticky top-0 z-30 border-b border-[#141210]/10 bg-[#f4f1eb]/90 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="text-[11px] tracking-[0.22em] uppercase lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
          <nav className="hidden items-center gap-5 lg:flex">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${category.toLowerCase()}`}
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
            MAREL
          </Link>
          <div className="flex items-center gap-5 text-[11px] tracking-[0.16em] uppercase">
            <Link href="/signin">Account</Link>
            <button type="button" onClick={() => setBagOpen(true)}>
              Bag (0)
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#f4f1eb]">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-display text-2xl tracking-[0.42em]">MAREL</span>
            <button
              type="button"
              className="text-[11px] tracking-[0.18em] uppercase"
              onClick={() => setMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <nav className="flex flex-col gap-6 px-6 pt-10">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${category.toLowerCase()}`}
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
            className="absolute inset-0 bg-[#141210]/40"
            onClick={() => setBagOpen(false)}
          />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-[#f4f1eb] p-6">
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
            <p className="font-display mt-16 text-3xl">Your bag is empty.</p>
            <a
              href="#new"
              className="mt-8 text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
              onClick={() => setBagOpen(false)}
            >
              Continue shopping
            </a>
          </aside>
        </div>
      )}
    </>
  );
}
