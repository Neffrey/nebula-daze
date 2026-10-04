"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { siteUrlForHostname } from "@/lib/siteUrl";

export default function ProfileSecurity({ onSignOut }: { onSignOut: () => void }) {
  const profile = useQuery(api.users.profile);

  if (profile === undefined) {
    return <p className="mt-8 text-sm text-[#6f675e]">Loading</p>;
  }
  if (profile === null) {
    return null;
  }

  const passwordLinked = profile.linkedAccounts.some((account) => account.provider === "password");
  const googleLinked = profile.linkedAccounts.some((account) => account.provider === "google");

  return (
    <div className="mt-8 max-w-lg">
      <DisplayNameSetting value={profile.displayName ?? ""} />
      <NameSetting value={profile.name ?? ""} />
      <ImageSetting image={profile.image} />
      <EmailSetting value={profile.email ?? ""} />
      <PhoneSetting value={profile.phone ?? ""} />
      <Addresses addresses={profile.addresses} />
      <LinkedAccounts passwordLinked={passwordLinked} googleLinked={googleLinked} />
      <GoogleLinkNotice googleLinked={googleLinked} />
      <button
        type="button"
        className="mt-4 w-fit border border-[#141210]/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase"
        onClick={onSignOut}
      >
        Sign out
      </button>
    </div>
  );
}

function DisplayNameSetting({ value }: { value: string }) {
  const save = useMutation(api.users.updateDisplayName);
  return (
    <TextSetting
      title="Display name"
      value={value}
      autoComplete="nickname"
      save={(next) => save({ displayName: next })}
    />
  );
}

function NameSetting({ value }: { value: string }) {
  const save = useMutation(api.users.updateName);
  return (
    <TextSetting
      title="Name"
      value={value}
      autoComplete="name"
      save={(next) => save({ name: next })}
    />
  );
}

function EmailSetting({ value }: { value: string }) {
  const save = useMutation(api.users.updateEmail);
  return (
    <TextSetting
      title="Email"
      value={value}
      type="email"
      autoComplete="email"
      save={(next) => save({ email: next })}
    />
  );
}

function PhoneSetting({ value }: { value: string }) {
  const save = useMutation(api.users.updatePhone);
  return (
    <TextSetting
      title="Phone"
      value={value}
      type="tel"
      autoComplete="tel"
      save={(next) => save({ phone: next })}
    />
  );
}

function TextSetting({
  title,
  value,
  type = "text",
  autoComplete,
  save,
}: {
  title: string;
  value: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  save: (value: string) => Promise<null>;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <Setting title={title}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          void save(draft)
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
          type={type}
          autoComplete={autoComplete}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
        <SaveButton saving={saving} />
        {error ? <ErrorText>{error}</ErrorText> : null}
      </form>
    </Setting>
  );
}

function ImageSetting({ image }: { image: string | null }) {
  const generateUploadUrl = useMutation(api.users.generateImageUploadUrl);
  const saveImage = useMutation(api.users.saveImage);
  const removeImage = useMutation(api.users.removeImage);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("image");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose an image");
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
    void generateUploadUrl()
      .then(async (uploadUrl) => {
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) {
          throw new Error("Unable to upload the image");
        }
        const body: unknown = await response.json();
        if (!isStorageUpload(body)) {
          throw new Error("Unable to upload the image");
        }
        await saveImage({ storageId: body.storageId });
      })
      .catch((uploadError: unknown) => {
        setError(errorMessage(uploadError));
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <Setting title="User image">
      {image ? (
        // Profile photos can come from Google or from Convex storage.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="mb-4 size-16 object-cover" />
      ) : (
        <p className="mb-4 text-sm text-[#6f675e]">No image</p>
      )}
      <form onSubmit={upload}>
        <input
          className="text-sm"
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
        />
        <SaveButton saving={saving} label="Upload" />
        {error ? <ErrorText>{error}</ErrorText> : null}
      </form>
      {image ? (
        <button
          type="button"
          className="mt-3 text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
          onClick={() => {
            setError(null);
            void removeImage().catch((removeError: unknown) => {
              setError(errorMessage(removeError));
            });
          }}
        >
          Remove image
        </button>
      ) : null}
    </Setting>
  );
}

function Addresses({
  addresses,
}: {
  addresses: Array<{
    _id: Id<"addresses">;
    label: string;
    addressLine: string;
    city: string;
    postalCode: string;
  }>;
}) {
  const [addKey, setAddKey] = useState(0);

  return (
    <Setting title="Saved addresses">
      {addresses.length === 0 ? (
        <p className="mb-4 text-sm text-[#6f675e]">No saved addresses.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-8">
          {addresses.map((address) => (
            <AddressForm key={address._id} address={address} />
          ))}
        </div>
      )}
      <p className="text-[11px] tracking-[0.16em] text-[#6f675e] uppercase">Add an address</p>
      <AddressForm key={addKey} onSaved={() => setAddKey((key) => key + 1)} />
    </Setting>
  );
}

function AddressForm({
  address,
  onSaved,
}: {
  address?: {
    _id: Id<"addresses">;
    label: string;
    addressLine: string;
    city: string;
    postalCode: string;
  };
  onSaved?: () => void;
}) {
  const saveAddress = useMutation(api.users.saveAddress);
  const deleteAddress = useMutation(api.users.deleteAddress);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    void saveAddress({
      addressId: address?._id,
      label: String(form.get("label") ?? ""),
      addressLine: String(form.get("addressLine") ?? ""),
      city: String(form.get("city") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
    })
      .then(() => {
        onSaved?.();
      })
      .catch((saveError: unknown) => {
        setError(errorMessage(saveError));
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={save}>
      <input className={inputClass} name="label" placeholder="Label" defaultValue={address?.label ?? ""} />
      <input
        className={inputClass}
        name="addressLine"
        autoComplete="address-line1"
        placeholder="Address"
        defaultValue={address?.addressLine ?? ""}
      />
      <input
        className={inputClass}
        name="city"
        autoComplete="address-level2"
        placeholder="City"
        defaultValue={address?.city ?? ""}
      />
      <input
        className={inputClass}
        name="postalCode"
        autoComplete="postal-code"
        placeholder="Postal code"
        defaultValue={address?.postalCode ?? ""}
      />
      <div className="flex items-center gap-4">
        <SaveButton saving={saving} />
        {address ? (
          <button
            type="button"
            className="text-[11px] tracking-[0.16em] uppercase underline underline-offset-4"
            onClick={() => {
              setError(null);
              void deleteAddress({ addressId: address._id }).catch((deleteError: unknown) => {
                setError(errorMessage(deleteError));
              });
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </form>
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
              className="mt-3 w-fit border border-[#141210]/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
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
    <section className="border-t border-[#141210]/10 py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[11px] tracking-[0.16em] uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SaveButton({ saving, label = "Save" }: { saving: boolean; label?: string }) {
  return (
    <button
      type="submit"
      className="mt-3 w-fit border border-[#141210]/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
      disabled={saving}
    >
      {saving ? "Please wait" : label}
    </button>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="mt-3 text-sm text-rose-800">{children}</p>;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save";
}

function isStorageUpload(body: unknown): body is { storageId: Id<"_storage"> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "storageId" in body &&
    typeof body.storageId === "string"
  );
}

const inputClass =
  "w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm outline-none";
