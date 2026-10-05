"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { categories, formatPrice, products } from "@/lib/catalog";

export default function Collection() {
  const { add } = useCart();
  const [active, setActive] = useState<(typeof categories)[number]>("New");
  const visible =
    active === "New"
      ? products
      : products.filter((product) => product.category === active);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.22em] uppercase">New arrivals</p>
          <h2 className="font-display mt-2 text-4xl sm:text-5xl">
            The evening edit
          </h2>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {categories.map((category) => (
            <button
              key={category}
              id={category.toLowerCase()}
              type="button"
              className={`text-[11px] tracking-[0.18em] uppercase ${
                active === category
                  ? "underline underline-offset-4"
                  : "text-muted"
              }`}
              onClick={() => setActive(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
        {visible.map((product) => (
          <li key={product.name}>
            <article>
              <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl leading-tight">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[11px] tracking-[0.16em] text-muted uppercase">
                    {product.category}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-sm">{formatPrice(product.price)}</p>
                  <button
                    type="button"
                    className="border border-foreground/20 px-3 py-2 text-[11px] tracking-[0.14em] uppercase"
                    onClick={() => add(product)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
