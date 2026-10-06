"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/catalog";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const product = useQuery(api.products.getBySlug, slug === "" ? "skip" : { slug });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        {product === undefined ? (
          <p className="text-sm text-muted">Loading</p>
        ) : product === null ? (
          <div>
            <h1 className="font-display text-5xl">This piece is unavailable.</h1>
            <Link
              href="/#new"
              className="mt-8 inline-block text-[11px] tracking-[0.18em] uppercase underline underline-offset-4"
            >
              New arrivals
            </Link>
          </div>
        ) : (
          <>
            <nav aria-label="Breadcrumb" className="text-[11px] tracking-[0.16em] uppercase">
              <Link href="/#new" className="underline underline-offset-4">
                New arrivals
              </Link>
              <span className="px-2 text-muted">|</span>
              <Link
                href={`/#${product.category.toLowerCase()}`}
                className="underline underline-offset-4"
              >
                {product.category}
              </Link>
              <span className="px-2 text-muted">|</span>
              <span>{product.name}</span>
            </nav>
            <article className="mt-6 grid items-start gap-8 sm:grid-cols-[24rem_minmax(0,1fr)] sm:gap-10 md:grid-cols-[30rem_minmax(0,1fr)]">
              <div className="relative aspect-square w-full overflow-hidden bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="480px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">
                  {product.name}
                </h1>
                <h2 className="mt-8 text-sm leading-6 font-medium tracking-[0.08em] uppercase">
                  From the {product.category.toLowerCase()} edit
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted">
                  Cut in a small run. Shoulders sit clean, hems fall long, and the cloth is made
                  to be worn past midnight and again the next morning.
                </p>
                <p className="mt-8 text-sm">{formatPrice(product.price)}</p>
                <div className="mt-6 max-w-sm">
                  <AddToCart product={product} />
                </div>
              </div>
            </article>
            <PairWith currentSlug={product.slug} />
          </>
        )}
      </main>
    </>
  );
}

function PairWith({ currentSlug }: { currentSlug: string }) {
  const products = useQuery(api.products.list);
  if (products === undefined) {
    return null;
  }
  const others = products.filter((product) => product.slug !== currentSlug).slice(0, 3);
  if (others.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-foreground/10 pt-12">
      <h2 className="text-[11px] tracking-[0.22em] uppercase">Pair it with</h2>
      <ul className="mt-8 grid gap-8 sm:grid-cols-3">
        {others.map((product) => (
          <li key={product.slug}>
            <Link href={`/products/${product.slug}`} className="block">
              <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 640px) 30vw, 100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="font-display mt-4 text-2xl leading-tight">{product.name}</h3>
              <p className="mt-2 text-sm text-muted">{formatPrice(product.price)}</p>
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href={`/products/${product.slug}`}
                className="border border-foreground/20 px-2 py-2 text-center text-[10px] tracking-[0.12em] uppercase"
              >
                View item
              </Link>
              <AddToCart product={product} compact />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddToCart({
  product,
  compact = false,
}: {
  product: { name: string; price: number; category: string; image: string };
  compact?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      aria-live="polite"
      className={`border text-center uppercase ${
        compact
          ? "px-2 py-2 text-[10px] tracking-[0.12em]"
          : "w-full px-6 py-4 text-[11px] tracking-[0.22em]"
      } ${
        added ? "border-foreground bg-foreground text-background" : "border-foreground/20"
      }`}
      onClick={() => {
        add({
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.image,
        });
        setAdded(true);
        if (timer.current !== null) {
          window.clearTimeout(timer.current);
        }
        timer.current = window.setTimeout(() => {
          setAdded(false);
          timer.current = null;
        }, 2000);
      }}
    >
      {added ? "Added" : "Add to cart"}
    </button>
  );
}
