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
  images: string[];
};

const emptyDraft: ProductDraft = {
  name: "",
  price: "",
  category: "Tailoring",
  images: [],
};

const maxImages = 8;

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
                    images: product.images,
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
                  <img src={product.images[0] ?? product.image} alt="" className="size-20 shrink-0 object-cover" />
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
  onSubmit: (draft: {
    name: string;
    price: number;
    category: Category;
    images: string[];
  }) => Promise<void>;
}) {
  const update = useMutation(api.products.update);
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initial);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function moveImage(from: number, to: number) {
    setDraft((current) => {
      if (from === to || from < 0 || to < 0 || from >= current.images.length || to >= current.images.length) {
        return current;
      }
      const images = [...current.images];
      const [moved] = images.splice(from, 1);
      if (moved === undefined) {
        return current;
      }
      images.splice(to, 0, moved);
      return { ...current, images };
    });
  }

  function addImage(url: string) {
    const image = url.trim();
    if (image.length === 0) {
      return;
    }
    setDraft((current) => {
      if (current.images.length >= maxImages) {
        return current;
      }
      return { ...current, images: [...current.images, image] };
    });
  }

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0 || saving) {
      return;
    }
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Use a PNG, JPG, or WebP image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const uploaded = await uploadFiles("imageUploader", { files });
      setDraft((current) => ({
        ...current,
        images: [...current.images, ...uploaded.map((file) => file.ufsUrl)].slice(0, maxImages),
      }));
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
          images: draft.images,
        });
        setDraft(emptyDraft);
        setImageUrl("");
        return;
      }
      await update({
        productId,
        name: draft.name,
        price,
        category: draft.category,
        images: draft.images,
      });
      await onSubmit({
        name: draft.name,
        price,
        category: draft.category,
        images: draft.images,
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
      <div>
        <label className="text-[11px] tracking-[0.16em] uppercase" htmlFor={`${idPrefix}-image`}>
          Images
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={`${idPrefix}-image`}
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="block min-w-0 flex-1 border border-foreground/20 bg-transparent px-3 py-2 text-sm tracking-normal normal-case"
          />
          <button
            type="button"
            disabled={saving || draft.images.length >= maxImages}
            onClick={() => {
              addImage(imageUrl);
              setImageUrl("");
            }}
            className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
      <div>
        <button
          type="button"
          disabled={saving || draft.images.length >= maxImages}
          onClick={() => fileInput.current?.click()}
          className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase disabled:opacity-40"
        >
          Upload images
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            void chooseImage(event);
          }}
        />
      </div>
      {draft.images.length > 1 ? (
        <p className="text-[10px] tracking-[0.12em] uppercase text-muted">Drag an image to change its order</p>
      ) : null}
      {draft.images.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {draft.images.map((src, imageIndex) => (
            <li
              key={`${src}-${imageIndex}`}
              className={`w-24 ${overIndex === imageIndex && dragIndex !== imageIndex ? "ring-1 ring-foreground" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragIndex !== null) {
                  setOverIndex(imageIndex);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const from = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isNaN(from)) {
                  moveImage(from, imageIndex);
                }
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <button
                type="button"
                draggable={!saving}
                aria-label={`Drag image ${imageIndex + 1}`}
                onDragStart={(event) => {
                  setDragIndex(imageIndex);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(imageIndex));
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`block cursor-grab active:cursor-grabbing ${dragIndex === imageIndex ? "opacity-40" : ""}`}
              >
                {/* Product images may come from any https host. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" draggable={false} className="size-24 object-cover" />
              </button>
              <div className="mt-1 flex justify-between text-[10px] tracking-[0.12em] uppercase">
                <button
                  type="button"
                  aria-label={`Move image ${imageIndex + 1} earlier`}
                  disabled={imageIndex === 0}
                  onClick={() => moveImage(imageIndex, imageIndex - 1)}
                  className="disabled:opacity-30"
                >
                  Earlier
                </button>
                <button
                  type="button"
                  aria-label={`Remove image ${imageIndex + 1}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      images: current.images.filter((_, index) => index !== imageIndex),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
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
