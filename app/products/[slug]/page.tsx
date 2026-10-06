"use client";

import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCart } from "@/components/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/catalog";
import { uploadFiles } from "@/lib/uploadthing";

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
          <ReviewEditProvider>
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
                <ProductRating productId={product._id} />
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
            <ProductReviews productId={product._id} />
          </ReviewEditProvider>
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

function useProductReviews(productId: Id<"products">) {
  return useQuery(api.reviews.listByProduct, { productId });
}

function averageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) {
    return null;
  }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

function reviewCountLabel(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

const ReviewEditContext = createContext<{
  editingId: Id<"reviews"> | null;
  requestEdit: (reviewId: Id<"reviews">) => void;
  stopEditing: () => void;
}>({
  editingId: null,
  requestEdit: () => undefined,
  stopEditing: () => undefined,
});

function ReviewEditProvider({ children }: { children: ReactNode }) {
  const [editingId, setEditingId] = useState<Id<"reviews"> | null>(null);
  return (
    <ReviewEditContext.Provider
      value={{
        editingId,
        requestEdit: setEditingId,
        stopEditing: () => setEditingId(null),
      }}
    >
      {children}
    </ReviewEditContext.Provider>
  );
}

function ProductRating({ productId }: { productId: Id<"products"> }) {
  const reviews = useProductReviews(productId);
  const { requestEdit } = useContext(ReviewEditContext);
  const [open, setOpen] = useState(false);
  if (reviews === undefined) {
    return null;
  }
  const mine = reviews.find((review) => review.mine);
  const average = averageRating(reviews);
  const label =
    average === null
      ? "No reviews yet"
      : `${average.toFixed(1)} out of 5 stars. ${reviewCountLabel(reviews.length)}`;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 text-sm"
        >
          <StarRow value={average ?? 0} />
          <span>
            {average === null ? "No reviews" : `${average.toFixed(1)} (${reviews.length})`}
          </span>
        </button>
        {mine === undefined ? (
          <a
            href="#reviews"
            className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase"
          >
            Write a review
          </a>
        ) : (
          <button
            type="button"
            onClick={() => requestEdit(mine._id)}
            className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase"
          >
            Edit review
          </button>
        )}
      </div>
      {open ? (
        <div className="mt-4 max-w-sm border border-foreground/15 p-4">
          <RatingBars
            reviews={reviews}
            selected={null}
            onSelect={() => {
              document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <a
            href="#reviews"
            className="mt-4 inline-block text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
          >
            Read {reviewCountLabel(reviews.length)}
          </a>
        </div>
      ) : null}
    </div>
  );
}

function ProductReviews({ productId }: { productId: Id<"products"> }) {
  const reviews = useProductReviews(productId);
  const { editingId } = useContext(ReviewEditContext);
  const [stars, setStars] = useState<number | null>(null);
  const shown =
    reviews === undefined || stars === null
      ? reviews
      : reviews.filter((review) => review.rating === stars);

  useEffect(() => {
    if (editingId !== null) {
      setStars(null);
    }
  }, [editingId]);

  return (
    <section id="reviews" className="mt-20 border-t border-foreground/10 pt-12">
      <h2 className="text-[11px] tracking-[0.22em] uppercase">Reviews</h2>
      {reviews === undefined || shown === undefined ? (
        <p className="mt-8 text-sm text-muted">Loading</p>
      ) : (
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <p className="font-display text-6xl leading-none">
              {averageRating(reviews)?.toFixed(1) ?? "–"}
            </p>
            <div className="mt-3">
              <StarRow value={averageRating(reviews) ?? 0} />
            </div>
            <p className="mt-2 text-sm text-muted">{reviewCountLabel(reviews.length)}</p>
            <div className="mt-6">
              <RatingBars
                reviews={reviews}
                selected={stars}
                onSelect={(star) => setStars((current) => (current === star ? null : star))}
              />
            </div>
          </div>
          <div className="min-w-0">
            {reviews.some((review) => review.mine) ? null : (
              <ReviewForm productId={productId} />
            )}
            {shown.length === 0 ? (
              <p className="mt-8 text-sm text-muted">
                {reviews.length === 0 ? "No reviews yet." : "No reviews with that rating."}
              </p>
            ) : (
              <ul className="mt-8 divide-y divide-foreground/10 border-t border-foreground/10">
                {shown.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RatingBars({
  reviews,
  selected,
  onSelect,
}: {
  reviews: { rating: number }[];
  selected: number | null;
  onSelect: (star: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((review) => review.rating === star).length;
        const width = reviews.length === 0 ? 0 : (count / reviews.length) * 100;
        return (
          <li key={star}>
            <button
              type="button"
              aria-pressed={selected === star}
              onClick={() => onSelect(star)}
              className={`grid w-full grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-left text-xs ${
                selected === star ? "text-foreground" : "text-muted"
              }`}
            >
              <span>
                {star} {star === 1 ? "star" : "stars"}
              </span>
              <span className="h-1.5 bg-foreground/10">
                <span className="block h-full bg-foreground" style={{ width: `${width}%` }} />
              </span>
              <span className="text-right text-foreground">{count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type StarRating = 1 | 2 | 3 | 4 | 5;

type ListedReview = {
  _id: Id<"reviews">;
  rating: StarRating;
  text: string;
  images: string[];
  createdAt: number;
  authorName: string | null;
  authorImage: string | null;
  mine: boolean;
};

function ReviewCard({ review }: { review: ListedReview }) {
  const update = useMutation(api.reviews.update);
  const remove = useMutation(api.reviews.remove);
  const { editingId, requestEdit, stopEditing } = useContext(ReviewEditContext);
  const editing = editingId === review._id;
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      return;
    }
    document.getElementById(`review-${review._id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [editing, review._id]);

  return (
    <li id={`review-${review._id}`} className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Reviewer name={review.authorName} image={review.authorImage} />
        <div className="flex flex-wrap items-center gap-3">
          <ReviewDate createdAt={review.createdAt} />
          {review.mine && !editing ? (
            confirming ? (
              <>
                <span className="text-xs">Delete this review?</span>
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => {
                    setRemoving(true);
                    setError(null);
                    void remove({ reviewId: review._id })
                      .catch((removeError: unknown) => {
                        setError(
                          removeError instanceof Error
                            ? removeError.message
                            : "Unable to delete the review",
                        );
                        setRemoving(false);
                      });
                  }}
                  className="border border-foreground/20 px-2 py-1 text-[10px] tracking-[0.12em] uppercase"
                >
                  {removing ? "Deleting" : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-[10px] tracking-[0.12em] uppercase underline underline-offset-4"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    requestEdit(review._id);
                  }}
                  className="border border-foreground/20 px-2 py-1 text-[10px] tracking-[0.12em] uppercase"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="border border-foreground/20 px-2 py-1 text-[10px] tracking-[0.12em] uppercase"
                >
                  Delete
                </button>
              </>
            )
          ) : null}
        </div>
      </div>
      {editing ? (
        <div className="mt-4">
          <ReviewEditor
            id={`edit-${review._id}`}
            legend="Your rating"
            submitLabel="Save review"
            initialRating={review.rating}
            initialText={review.text}
            initialImages={review.images}
            onCancel={stopEditing}
            onSubmit={async ({ rating, text, images }) => {
              await update({ reviewId: review._id, rating, text, images });
              stopEditing();
            }}
          />
        </div>
      ) : (
        <>
          <div className="mt-3">
            <StarRow value={review.rating} />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6">{review.text}</p>
          {review.images.length > 0 ? <ReviewPhotos images={review.images} /> : null}
        </>
      )}
      {error !== null ? <p className="mt-3 text-sm">{error}</p> : null}
    </li>
  );
}

function ReviewForm({ productId }: { productId: Id<"products"> }) {
  const viewer = useQuery(api.users.viewer);
  const create = useMutation(api.reviews.create);
  const [formKey, setFormKey] = useState(0);

  if (viewer === undefined) {
    return null;
  }
  if (viewer === null) {
    return (
      <p className="text-sm">
        <Link href="/signin" className="underline underline-offset-4">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  return (
    <ReviewEditor
      key={formKey}
      id="review-text"
      legend="Your rating"
      submitLabel="Submit review"
      initialRating={null}
      initialText=""
      initialImages={[]}
      onSubmit={async ({ rating, text, images }) => {
        await create({
          productId,
          text,
          rating,
          ...(images.length === 0 ? {} : { images }),
        });
        setFormKey((current) => current + 1);
      }}
    />
  );
}

function ReviewEditor({
  id,
  legend,
  submitLabel,
  initialRating,
  initialText,
  initialImages,
  onCancel,
  onSubmit,
}: {
  id: string;
  legend: string;
  submitLabel: string;
  initialRating: StarRating | null;
  initialText: string;
  initialImages: string[];
  onCancel?: () => void;
  onSubmit: (value: { rating: StarRating; text: string; images: string[] }) => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState<StarRating | null>(initialRating);
  const [text, setText] = useState(initialText);
  const [kept, setKept] = useState(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoCount = kept.length + files.length;

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = [...(event.target.files ?? [])];
    event.target.value = "";
    const next: File[] = [];
    for (const file of selected) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Use a PNG, JPG, or WebP image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }
      next.push(file);
    }
    setError(null);
    setFiles((current) => [...current, ...next].slice(0, Math.max(0, 4 - kept.length)));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || rating === null) {
      return;
    }
    const chosen = rating;
    setSaving(true);
    setError(null);
    void (async () => {
      const uploaded = files.length === 0 ? [] : await uploadFiles("imageUploader", { files });
      await onSubmit({
        rating: chosen,
        text,
        images: [...kept, ...uploaded.map((file) => file.ufsUrl)],
      });
    })()
      .catch((submitError: unknown) => {
        setError(submitError instanceof Error ? submitError.message : "Unable to save the review");
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend className="text-[11px] tracking-[0.16em] uppercase">{legend}</legend>
        <div className="mt-2 flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((star) => (
            <button
              key={star}
              type="button"
              aria-pressed={rating === star}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              onClick={() => setRating(star)}
              className="p-0.5"
            >
              <StarIcon
                className={`size-6 ${
                  rating !== null && star <= rating ? "fill-foreground" : "fill-foreground/20"
                }`}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-5 block text-[11px] tracking-[0.16em] uppercase" htmlFor={id}>
        Your review
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        maxLength={2000}
        className="mt-2 w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={photoCount >= 4}
          onClick={() => fileInput.current?.click()}
          className="border border-foreground/20 px-3 py-2 text-[10px] tracking-[0.12em] uppercase disabled:opacity-40"
        >
          Add photos
        </button>
        <span className="text-xs text-muted">{photoCount} of 4</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={addImages}
        />
      </div>
      {kept.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {kept.map((src) => (
            <li key={src} className="relative">
              {/* Review photos are uploaded to UploadThing. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-20 object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setKept((current) => current.filter((image) => image !== src))}
                className="absolute top-1 right-1 bg-background px-1 text-[10px]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {files.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {files.map((file) => (
            <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 text-xs text-muted">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() =>
                  setFiles((current) =>
                    current.filter(
                      (item) => item.name !== file.name || item.lastModified !== file.lastModified,
                    ),
                  )
                }
                className="underline underline-offset-4"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error !== null ? <p className="mt-3 text-sm">{error}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || rating === null || text.trim().length === 0}
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

function ReviewPhotos({ images }: { images: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {images.map((src) => (
        <li key={src}>
          {/* Review photos are uploaded to UploadThing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="size-20 object-cover" />
        </li>
      ))}
    </ul>
  );
}

function ReviewDate({ createdAt }: { createdAt: number }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(
      new Date(createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, [createdAt]);

  return (
    <time dateTime={new Date(createdAt).toISOString()} className="text-xs text-muted">
      {label}
    </time>
  );
}

function Reviewer({ name, image }: { name: string | null; image: string | null }) {
  const label = name?.trim() || "Customer";
  const letter = label.charAt(0).toLocaleUpperCase();
  return (
    <span className="flex items-center gap-2">
      {image !== null ? (
        // Profile photos can come from Google, UploadThing, or Convex storage.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <span
          className="flex size-8 items-center justify-center rounded-full border border-foreground/20 text-xs"
          aria-hidden="true"
        >
          {letter}
        </span>
      )}
      <span className="text-sm">{label}</span>
    </span>
  );
}

function StarRow({ value }: { value: number }) {
  const width = `${(Math.max(0, Math.min(5, value)) / 5) * 100}%`;
  return (
    <span className="relative inline-flex" aria-hidden="true">
      <span className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon key={index} className="size-4 fill-foreground/20" />
        ))}
      </span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden" style={{ width }}>
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon key={index} className="size-4 shrink-0 fill-foreground" />
        ))}
      </span>
    </span>
  );
}

function StarIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className}>
      <path d="M10 1.6 12.2 6.9l5.8.5-4.4 3.8 1.4 5.6L10 14.2 5 16.8l1.4-5.6L2 7.4l5.8-.5L10 1.6Z" />
    </svg>
  );
}
