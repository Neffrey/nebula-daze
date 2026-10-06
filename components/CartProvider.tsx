"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export type CartItem = {
  productId: Id<"products">;
  variantId: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  options: string;
};

export type CartLine = CartItem & { key: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function cartKey(item: { productId: string; variantId: number }) {
  return `${item.productId}:${item.variantId}`;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add(item) {
        const key = cartKey(item);
        setLines((current) => {
          const existing = current.find((line) => line.key === key);
          if (!existing) {
            return [...current, { ...item, key, quantity: 1 }];
          }
          return current.map((line) =>
            line.key === key ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line,
          );
        });
      },
      remove(key) {
        setLines((current) => current.filter((line) => line.key !== key));
      },
      replace(next) {
        setLines(next);
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart must be used within CartProvider");
  }
  return cart;
}
