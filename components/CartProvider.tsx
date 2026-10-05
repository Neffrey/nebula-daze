"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";

export type CartLine = Product & { quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (product: Product) => void;
  remove: (name: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add(product) {
        setLines((current) => {
          const existing = current.find((line) => line.name === product.name);
          if (!existing) {
            return [...current, { ...product, quantity: 1 }];
          }
          return current.map((line) =>
            line.name === product.name
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          );
        });
      },
      remove(name) {
        setLines((current) => current.filter((line) => line.name !== name));
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
