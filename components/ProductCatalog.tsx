"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import Select from "@/components/Select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/catalog";

export default function ProductCatalog() {
  const products = useQuery(api.products.manageList);
  const categories = useQuery(api.categories.manageList);

  return (
    <div className="mt-10">
      <PrintifyPanel />
      <h2 className="mt-12 text-[12px] tracking-[0.16em] uppercase">Current products</h2>
      {products === undefined ? (
        <p className="mt-6 text-sm text-muted">Loading</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No products yet. Sync from Printify to import them.</p>
      ) : (
        <ul className="mt-6 divide-y divide-foreground/10 border-t border-foreground/10">
          {products.map((product) => (
            <li key={product._id} className="flex flex-wrap items-center gap-4 py-5">
              {/* Product images come from Printify or older https links. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt="" className="size-20 shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${product.slug}`}
                  className="font-display text-2xl leading-tight underline-offset-4 hover:underline"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {formatPrice(product.price)} · {product.variantCount}{" "}
                  {product.variantCount === 1 ? "variant" : "variants"}
                  {product.printifyId === null ? " · Not from Printify" : ""}
                </p>
              </div>
              <CategoryPicker
                productId={product._id}
                categoryId={product.categoryId}
                categories={categories ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrintifyPanel() {
  const sync = useAction(api.printify.syncProducts);
  const connect = useAction(api.printify.connectWebhooks);
  const [busy, setBusy] = useState<"sync" | "webhooks" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<{ title: string; reason: string }[]>([]);

  function run(kind: "sync" | "webhooks") {
    setBusy(kind);
    setMessage(null);
    setSkipped([]);
    const task =
      kind === "sync"
        ? sync({}).then((result) => {
            setSkipped(result.skipped);
            setMessage(
              `Imported ${result.created} new, updated ${result.updated}, removed ${result.removed}.`,
            );
          })
        : connect({}).then((result) => {
            setMessage(
              result.added.length === 0
                ? "Webhooks were already connected."
                : `Connected ${result.added.length} webhooks.`,
            );
          });
    void task
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Printify request failed");
      })
      .finally(() => setBusy(null));
  }

  return (
    <section>
      <h2 className="text-[12px] tracking-[0.16em] uppercase">Printify</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Products, prices, colors, sizes, and mockups come from your Printify shop. Syncing replaces
        the catalog with what is in Printify. Paid orders are sent to Printify and wait for your
        approval there.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("sync")}
          className="border border-foreground/40 px-6 py-3 text-[12px] tracking-[0.18em] uppercase disabled:opacity-40"
        >
          {busy === "sync" ? "Syncing" : "Sync from Printify"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("webhooks")}
          className="border border-foreground/40 px-6 py-3 text-[12px] tracking-[0.18em] uppercase disabled:opacity-40"
        >
          {busy === "webhooks" ? "Connecting" : "Connect webhooks"}
        </button>
      </div>
      {message === null ? null : <p className="mt-4 text-sm">{message}</p>}
      {skipped.length === 0 ? null : (
        <ul className="mt-2 text-sm text-muted">
          {skipped.map((entry) => (
            <li key={entry.title}>
              Skipped {entry.title}: {entry.reason}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryPicker({
  productId,
  categoryId,
  categories,
}: {
  productId: Id<"products">;
  categoryId: Id<"categories">;
  categories: { _id: Id<"categories">; name: string }[];
}) {
  const setCategory = useMutation(api.products.setCategory);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full sm:w-56">
      <Select
        id={`category-${productId}`}
        compact
        value={categoryId}
        placeholder="Choose a category"
        disabled={categories.length === 0}
        options={categories.map((category) => ({ value: category._id, label: category.name }))}
        onChange={(next) => {
          setError(null);
          void setCategory({ productId, categoryId: next }).catch((saveError: unknown) => {
            setError(saveError instanceof Error ? saveError.message : "Unable to save the category");
          });
        }}
      />
      {error === null ? null : <p className="mt-1 text-xs">{error}</p>}
    </div>
  );
}
