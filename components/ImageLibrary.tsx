"use client";

import { useCallback, useEffect, useState } from "react";
import { maxImageNameLength, type LibraryImage } from "@/lib/imageLibrary";
import { UploadDropzone } from "@/lib/uploadthing";

const buttonClass =
  "border border-foreground/40 px-4 py-2 text-[12px] tracking-[0.16em] uppercase disabled:opacity-40";
const fieldClass = "w-full border border-foreground/40 bg-background px-3 py-2 text-sm outline-none";

export default function ImageLibrary() {
  const [images, setImages] = useState<LibraryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetchImages().then(
        (loaded) => {
          setImages(loaded);
          setError(null);
        },
        (loadError: unknown) => {
          setError(errorMessage(loadError));
        },
      ),
    [],
  );

  useEffect(() => {
    let active = true;
    fetchImages().then(
      (loaded) => {
        if (active) {
          setImages(loaded);
        }
      },
      (loadError: unknown) => {
        if (active) {
          setError(errorMessage(loadError));
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-8">
      <ImageUploader onUploaded={load} />
      <h2 className="mt-12 text-[12px] tracking-[0.16em] uppercase">
        Uploaded images{images === null ? "" : ` · ${images.length}`}
      </h2>
      {error === null ? null : <p className="mt-4 text-sm">{error}</p>}
      {images === null ? (
        error === null ? <p className="mt-6 text-sm text-muted">Loading</p> : null
      ) : images.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No images uploaded yet.</p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <ImageCard key={image.key} image={image} onChanged={load} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ImageUploader({ onUploaded }: { onUploaded: () => Promise<void> }) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section>
      <h2 className="text-[12px] tracking-[0.16em] uppercase">Upload</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Images are stored on UploadThing. Drop up to 10 at a time, 8MB each.
      </p>
      <UploadDropzone
        endpoint="adminImageUploader"
        config={{ mode: "auto" }}
        uploadProgressGranularity="fine"
        appearance={{
          container: ({ isDragActive }) =>
            `mt-4 rounded-none! border-foreground/40! py-12 ${
              isDragActive ? "border-highlight! bg-highlight/10!" : "bg-surface/40"
            }`,
          uploadIcon: "size-10! text-muted!",
          label:
            "w-auto! text-[12px]! font-normal! tracking-[0.16em] text-foreground! uppercase hover:text-highlight! focus-within:ring-highlight! focus-within:ring-offset-background!",
          allowedContent: "mt-1 text-muted!",
          button:
            "w-44! rounded-none! bg-primary! text-[12px]! tracking-[0.18em] text-on-primary! uppercase after:bg-highlight! focus-within:ring-highlight! focus-within:ring-offset-background! data-[state=readying]:opacity-50",
        }}
        content={{
          label: ({ ready }) => (ready ? "Drop images here or click to choose" : "Loading"),
          button: ({ ready, isUploading }) =>
            isUploading ? null : ready ? "Choose images" : "Loading",
        }}
        onUploadBegin={() => {
          setMessage(null);
        }}
        onClientUploadComplete={(uploaded) => {
          setMessage(`Uploaded ${uploaded.length} ${uploaded.length === 1 ? "image" : "images"}.`);
          void onUploaded();
        }}
        onUploadError={(uploadError) => {
          setMessage(uploadError.message);
        }}
      />
      {message === null ? null : <p className="mt-4 text-sm">{message}</p>}
    </section>
  );
}

function ImageCard({ image, onChanged }: { image: LibraryImage; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(image.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(kind: "save" | "delete", task: () => Promise<unknown>) {
    setBusy(kind);
    setError(null);
    void task()
      .then(async () => {
        setEditing(false);
        setConfirmDelete(false);
        await onChanged();
      })
      .catch((taskError: unknown) => {
        setError(errorMessage(taskError));
      })
      .finally(() => {
        setBusy(null);
      });
  }

  return (
    <li className="flex min-w-0 flex-col border border-foreground/15">
      <a href={image.url} target="_blank" rel="noopener noreferrer" className="block bg-surface">
        {/* Library images are UploadThing URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={image.name} loading="lazy" className="aspect-square w-full object-contain" />
      </a>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run("save", () =>
                requestJson("/api/images", {
                  method: "PATCH",
                  body: JSON.stringify({ key: image.key, name }),
                }),
              );
            }}
          >
            <label className="text-xs text-muted" htmlFor={`image-name-${image.key}`}>
              Name
            </label>
            <input
              id={`image-name-${image.key}`}
              className={`${fieldClass} mt-1`}
              value={name}
              maxLength={maxImageNameLength}
              required
              disabled={busy !== null}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
            <div className="mt-3 flex gap-2">
              <button type="submit" className={buttonClass} disabled={busy !== null}>
                {busy === "save" ? "Saving" : "Save"}
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy !== null}
                onClick={() => {
                  setName(image.name);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="truncate text-sm" title={image.name}>
            {image.name}
          </p>
        )}
        <p className="text-xs text-muted">
          {formatBytes(image.size)} ·{" "}
          {new Date(image.uploadedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={image.url}
            aria-label={`URL for ${image.name}`}
            className={`${fieldClass} min-w-0 text-xs`}
            onFocus={(event) => {
              event.target.select();
            }}
          />
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              void navigator.clipboard.writeText(image.url).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {confirmDelete ? (
            <>
              <button
                type="button"
                className={buttonClass}
                disabled={busy !== null}
                onClick={() => {
                  run("delete", () =>
                    requestJson("/api/images", {
                      method: "DELETE",
                      body: JSON.stringify({ key: image.key }),
                    }),
                  );
                }}
              >
                {busy === "delete" ? "Deleting" : "Confirm delete"}
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy !== null}
                onClick={() => setConfirmDelete(false)}
              >
                Keep
              </button>
            </>
          ) : (
            <>
              {editing ? null : (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy !== null}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                className={buttonClass}
                disabled={busy !== null}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            </>
          )}
        </div>
        {confirmDelete ? (
          <p className="text-xs text-muted">
            Anything still using this URL (products, tickets, profile photos) will show a broken image.
          </p>
        ) : null}
        {error === null ? null : <p className="text-sm">{error}</p>}
      </div>
    </li>
  );
}

async function fetchImages() {
  const data = await requestJson<{ images: LibraryImage[] }>("/api/images", { method: "GET" });
  return data.images;
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
