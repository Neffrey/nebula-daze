"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart, type CartItem } from "@/components/CartProvider";

export default function AddToCartButton({
  item,
  compact = false,
  unavailableLabel = "Select options",
}: {
  item: CartItem | null;
  compact?: boolean;
  unavailableLabel?: string;
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
      disabled={item === null}
      className={`border text-center uppercase disabled:cursor-not-allowed disabled:opacity-50 ${
        compact
          ? "px-2 py-2 text-[11px] tracking-[0.12em]"
          : "w-full px-6 py-4 text-[12px] tracking-[0.22em]"
      } ${added ? "border-primary bg-primary text-on-primary" : "border-foreground/40"}`}
      onClick={() => {
        if (item === null) {
          return;
        }
        add(item);
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
      {item === null ? unavailableLabel : added ? "Added" : "Add to cart"}
    </button>
  );
}

export function QuickAdd({
  product,
}: {
  product: {
    _id: CartItem["productId"];
    name: string;
    slug: string;
    image: string;
    price: number;
    singleVariantId: number | null;
  };
}) {
  if (product.singleVariantId === null) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="border border-foreground/40 px-2 py-2 text-center text-[11px] tracking-[0.12em] uppercase"
      >
        Choose options
      </Link>
    );
  }
  return (
    <AddToCartButton
      compact
      item={{
        productId: product._id,
        variantId: product.singleVariantId,
        name: product.name,
        slug: product.slug,
        image: product.image,
        price: product.price,
        options: "",
      }}
    />
  );
}
