"use client";

import { useMutation, useQuery } from "convex/react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/catalog";
import { uploadFiles } from "@/lib/uploadthing";

const categories = ["Tailoring", "Evening", "Knitwear", "Accessories"] as const;

type Category = (typeof categories)[number];

type ProductDraft = {
  name: string;
  price: string;
  category: Category;
  image: string;
};

const emptyDraft: ProductDraft = {
  name: "",
  price: "",
  category: "Tailoring",
  image: "",
};

export default function ProductCatalog() {
  const products = useQuery(api.products.manageList);
  const create = useMutation(api.products.create);
  const [editingId, setEditingId] = useState<Id<"products"> | null>(null);

  if (products === undefined) {
    return <p className="mt-8 text-sm text-muted">Loading</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-[11px] tracking-[0.16em] uppercase">Add a product</h2>
      <ProductForm
        idPrefix="new-product"
        initial={emptyDraft}
        submitLabel="Add product"
        onSubmit={async (draft) => {
          await create(draft);
        }}
      />
      <h2 className="mt-12 text-[11px] tracking-[0.16em] uppercase">Current products</h2>
      {products.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No products yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-foreground/10 border-t border-foreground/10">
          {products.map((product) => (
            <li key={product._id} className="py-6">
              {editingId === product._id ? (
                <ProductForm
                  idPrefix={`edit-${product._id}`}
                  initial={{
                    name: product.name,
                    price: String(product.price),
                    category: product.category,
                    image: product.image,
                  }}
                  submitLabel="Save product"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async () => {
                    setEditingId(null);
                  }}
                  productId={product._id}
                />
              ) : (
                <div className="flex items-start gap-4">
                  {/* Product images may come from any https host. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt="" className="size-20 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-2xl leading-tight">{product.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {product.category} · {formatPrice(product.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingId(product._id)}
                    className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase"
                  >
                    Edit
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  idPrefix,
  initial,
  submitLabel,
  productId,
  onCancel,
  onSubmit,
}: {
  idPrefix: string;
  initial: ProductDraft;
  submitLabel: string;
  productId?: Id<"products">;
  onCancel?: () => void;
  onSubmit: (draft: { name: string; price: number; category: Category; image: string }) => Promise<void>;
}) {
  const update = useMutation(api.products.update);
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined || saving) {
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
    try {
      const uploaded = await uploadFiles("imageUploader", { files: [file] });
      const photo = uploaded[0];
      if (photo === undefined) {
        throw new Error("Unable to upload the image");
      }
      setDraft((current) => ({ ...current, image: photo.ufsUrl }));
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the image");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }
    const price = Number(draft.price);
    setSaving(true);
    setError(null);
    void (async () => {
      if (productId === undefined) {
        await onSubmit({
          name: draft.name,
          price,
          category: draft.category,
          image: draft.image,
        });
        setDraft(emptyDraft);
        return;
      }
      await update({
        productId,
        name: draft.name,
        price,
        category: draft.category,
        image: draft.image,
      });
      await onSubmit({
        name: draft.name,
        price,
        category: draft.category,
        image: draft.image,
      });
    })().catch((submitError: unknown) => {
      setError(submitError instanceof Error ? submitError.message : "Unable to save the product");
    }).finally(() => {
      setSaving(false);
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-name`}>
        Name
        <input
          id={`${idPrefix}-name`}
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          className="mt-2 block w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal normal-case"
        />
      </label>
      <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-price`}>
        Price
        <input
          id={`${idPrefix}-price`}
          inputMode="numeric"
          value={draft.price}
          onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
          className="mt-2 block w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal"
        />
      </label>
      <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-category`}>
        Category
        <select
          id={`${idPrefix}-category`}
          value={draft.category}
          onChange={(event) =>
            setDraft((current) => ({ ...current, category: event.target.value as Category }))
          }
          className="mt-2 block w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal normal-case"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-image`}>
        Image
        <input
          id={`${idPrefix}-image`}
          value={draft.image}
          onChange={(event) => setDraft((current) => ({ ...current, image: event.target.value }))}
          className="mt-2 block w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal normal-case"
        />
      </label>
      <div>
        <button
          type="button"
          disabled={saving}
          onClick={() => fileInput.current?.click()}
          className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase disabled:opacity-40"
        >
          Upload image
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            void chooseImage(event);
          }}
        />
      </div>
      {draft.image !== "" ? (
        // The preview follows whatever https image was pasted or uploaded.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.image} alt="" className="size-24 object-cover" />
      ) : null}
      {error !== null ? <p className="text-sm">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.18em] uppercase disabled:opacity-40"
        >
          {saving ? "Saving" : submitLabel}
        </button>
        {onCancel !== undefined ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
