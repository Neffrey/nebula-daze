"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import SavedAddresses from "@/components/SavedAddresses";
import { api } from "@/convex/_generated/api";
import { siteUrlForHostname } from "@/lib/siteUrl";
import { applyTheme, writeStoredTheme } from "@/lib/theme";
import { uploadFiles } from "@/lib/uploadthing";

export default function ProfileSecurity({ onSignOut }: { onSignOut: () => void }) {
  const profile = useQuery(api.users.profile);

  if (profile === undefined) {
    return <p className="mt-8 text-sm text-muted">Loading</p>;
  }
  if (profile === null) {
    return null;
  }

  const passwordLinked = profile.linkedAccounts.some((account) => account.provider === "password");
  const googleLinked = profile.linkedAccounts.some((account) => account.provider === "google");

  const givenName = profile.displayName && profile.name ? profile.name : null;

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
        <ImageSetting
          image={profile.image}
          initials={profileInitials(profile.displayName, profile.name, profile.email)}
        />
        <div className="min-w-0 flex-1 pb-1">
          <DisplayNameSetting value={profile.displayName ?? ""} />
          {givenName ? <p className="mt-3 text-sm text-muted">{givenName}</p> : null}
          <dl className="mt-5 flex flex-col gap-1 text-sm">
            {profile.email ? (
              <div>
                <dt className="sr-only">Email</dt>
                <dd>{profile.email}</dd>
              </div>
            ) : null}
            {profile.phone ? (
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>{profile.phone}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <Setting title="Default Address">
        <SavedAddresses addresses={profile.addresses} />
      </Setting>
      <LinkedAccounts passwordLinked={passwordLinked} googleLinked={googleLinked} />
      <GoogleLinkNotice googleLinked={googleLinked} />
      <button
        type="button"
        className="mt-4 w-fit border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase"
        onClick={onSignOut}
      >
        Sign out
      </button>
      <DarkModeSwitch theme={profile.theme} />
    </div>
  );
}

function DarkModeSwitch({ theme }: { theme: "light" | "dark" }) {
  const saveTheme = useMutation(api.users.setTheme);
  const [pending, setPending] = useState<"light" | "dark" | null>(null);
  const selected = pending ?? theme;
  const dark = selected === "dark";

  useEffect(() => {
    setPending(null);
  }, [theme]);

  function toggle() {
    const next = dark ? "light" : "dark";
    setPending(next);
    applyTheme(next);
    writeStoredTheme(next);
    void saveTheme({ theme: next }).catch(() => {
      setPending(null);
      applyTheme(theme);
      writeStoredTheme(theme);
    });
  }

  return (
    <div className="mt-10 flex items-center justify-between border-t border-foreground/10 pt-8">
      <p className="text-sm">Light mode</p>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Light mode or darkmode"
        onClick={toggle}
        className={`relative h-6 w-11 border border-foreground/30 ${dark ? "bg-foreground" : "bg-transparent"}`}
      >
        <span
          className={`absolute top-0.5 size-4 ${dark ? "right-0.5 bg-background" : "left-0.5 bg-foreground"}`}
        />
      </button>
      <p className="text-sm">Dark mode</p>
    </div>
  );
}

function DisplayNameSetting({ value }: { value: string }) {
  const save = useMutation(api.users.updateDisplayName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = draft !== value;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  function cancel() {
    setDraft(value);
    setError(null);
    setEditing(false);
  }

  return (
    <form
      className="min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        if (!editing || !dirty || saving) {
          return;
        }
        setSaving(true);
        setError(null);
        void save({ displayName: draft })
          .then(() => {
            setEditing(false);
          })
          .catch((saveError: unknown) => {
            setError(errorMessage(saveError));
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <p className="text-[11px] tracking-[0.22em] text-muted uppercase">Display name</p>
      {editing ? (
        <h1 className="mt-3">
          <input
            ref={inputRef}
            id="profile-display-name"
            size={1}
            className="font-display w-full min-w-0 max-w-full border-b border-foreground/30 bg-transparent text-5xl leading-none outline-none placeholder:text-foreground/25 sm:text-6xl"
            autoComplete="nickname"
            maxLength={40}
            placeholder="Your profile"
            aria-label="Display name"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
        </h1>
      ) : (
        <div className="mt-3 flex min-w-0 items-end gap-4">
          <h1
            className={`font-display min-w-0 text-5xl leading-none sm:text-6xl ${value ? "" : "text-foreground/25"}`}
          >
            {value || "Your profile"}
          </h1>
          <button
            type="button"
            className="mb-1 shrink-0 text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
            onClick={() => {
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      )}
      {editing ? (
        <div className="mt-4 flex items-center gap-4">
          {dirty ? <SaveButton saving={saving} className="" /> : null}
          <button
            type="button"
            className="text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
            onClick={cancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </form>
  );
}

function ImageSetting({ image, initials }: { image: string | null; initials: string }) {
  const saveProfilePhoto = useMutation(api.users.saveProfilePhoto);
  const removeImage = useMutation(api.users.removeImage);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function uploadFile(file: File) {
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
    void uploadFiles("imageUploader", { files: [file] })
      .then(async (uploaded) => {
        const photo = uploaded[0];
        if (photo === undefined) {
          throw new Error("Unable to upload the image");
        }
        await saveProfilePhoto({ url: photo.ufsUrl });
      })
      .catch((uploadError: unknown) => {
        setError(errorMessage(uploadError));
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      uploadFile(file);
    }
  }

  return (
    <div className="w-36 shrink-0">
      {image ? (
        // Profile photos can come from Google or from Convex storage.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-36 object-cover" />
      ) : (
        <div className="flex size-36 items-center justify-center bg-foreground/5 font-display text-4xl">
          {initials}
        </div>
      )}
      <label className="mt-3 block w-fit cursor-pointer text-[11px] tracking-[0.16em] uppercase underline underline-offset-4">
        {saving ? "Please wait" : "Change photo"}
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={saving}
          onChange={chooseFile}
        />
      </label>
      {image ? (
        <button
          type="button"
          className="mt-2 block text-[11px] tracking-[0.16em] text-muted uppercase underline underline-offset-4"
          onClick={() => {
            setError(null);
            void removeImage().catch((removeError: unknown) => {
              setError(errorMessage(removeError));
            });
          }}
        >
          Remove
        </button>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}

function LinkedAccounts({
  passwordLinked,
  googleLinked,
}: {
  passwordLinked: boolean;
  googleLinked: boolean;
}) {
  const { signIn } = useAuthActions();
  const setPassword = useMutation(api.users.setPassword);
  const prepareGoogleLink = useMutation(api.users.prepareGoogleLink);
  const unlinkAccount = useMutation(api.users.unlinkAccount);
  const [password, setPasswordDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const canUnlink = passwordLinked && googleLinked;

  return (
    <Setting title="Linked accounts">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm">{passwordLinked ? "Password is linked" : "Password is not linked"}</p>
          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              setSaving(true);
              setError(null);
              void setPassword({ password })
                .then(() => {
                  setPasswordDraft("");
                })
                .catch((saveError: unknown) => {
                  setError(errorMessage(saveError));
                })
                .finally(() => {
                  setSaving(false);
                });
            }}
          >
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={password}
              placeholder={passwordLinked ? "New password" : "Password"}
              onChange={(event) => {
                setPasswordDraft(event.target.value);
              }}
            />
            <SaveButton saving={saving} label={passwordLinked ? "Update password" : "Link password"} />
          </form>
          {canUnlink ? (
            <UnlinkButton
              label="Unlink password"
              onClick={() => {
                setError(null);
                void unlinkAccount({ provider: "password" }).catch((unlinkError: unknown) => {
                  setError(errorMessage(unlinkError));
                });
              }}
            />
          ) : null}
        </div>
        <div>
          <p className="text-sm">{googleLinked ? "Google is linked" : "Google is not linked"}</p>
          {googleLinked ? null : (
            <button
              type="button"
              className="mt-3 w-fit border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
              disabled={linking}
              onClick={() => {
                setLinking(true);
                setError(null);
                void prepareGoogleLink({})
                  .then(() =>
                    signIn("google", {
                      redirectTo: `${siteUrlForHostname(window.location.hostname)}/account?googleLink=1`,
                    }),
                  )
                  .catch((linkError: unknown) => {
                    setError(errorMessage(linkError));
                    setLinking(false);
                  });
              }}
            >
              {linking ? "Please wait" : "Link Google"}
            </button>
          )}
          {canUnlink ? (
            <UnlinkButton
              label="Unlink Google"
              onClick={() => {
                setError(null);
                void unlinkAccount({ provider: "google" }).catch((unlinkError: unknown) => {
                  setError(errorMessage(unlinkError));
                });
              }}
            />
          ) : null}
        </div>
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </Setting>
  );
}

function GoogleLinkNotice({ googleLinked }: { googleLinked: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("googleLink") !== "1") {
      return;
    }
    if (!googleLinked) {
      setMessage(
        "Google was not linked. If that Google account already belongs to another profile, it was left unchanged.",
      );
    }
    params.delete("googleLink");
    const search = params.toString();
    router.replace(search.length > 0 ? `/account?${search}` : "/account");
  }, [googleLinked, router]);

  if (message === null) {
    return null;
  }
  return <p className="mt-3 text-sm text-rose-800">{message}</p>;
}

function UnlinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="mt-3 text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Setting({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-foreground/10 py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[11px] tracking-[0.16em] uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SaveButton({
  saving,
  label = "Save",
  className = "mt-3",
}: {
  saving: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={`${className} w-fit border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50`}
      disabled={saving}
    >
      {saving ? "Please wait" : label}
    </button>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="mt-3 text-sm text-rose-800">{children}</p>;
}

function profileInitials(
  displayName: string | null,
  name: string | null,
  email: string | null,
) {
  const source = (displayName || name || email || "").trim();
  const parts = source.split(/[\s@]+/).filter((part) => part.length > 0);
  const first = parts[0]?.[0];
  const second = parts[1]?.[0];
  if (!first) {
    return "N";
  }
  return `${first}${second ?? ""}`.toUpperCase();
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save";
}

const inputClass =
  "w-full border border-foreground/20 bg-transparent px-3 py-3 text-sm outline-none";
