"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { siteUrlForHostname } from "@/lib/siteUrl";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { uploadFiles } from "@/lib/uploadthing";

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
          {givenName ? <p className="mt-3 text-sm text-[#6f675e]">{givenName}</p> : null}
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
      <p className="text-[11px] tracking-[0.22em] text-[#6f675e] uppercase">Display name</p>
      {editing ? (
        <h1 className="mt-3">
          <input
            ref={inputRef}
            id="profile-display-name"
            size={1}
            className="font-display w-full min-w-0 max-w-full border-b border-[#141210]/30 bg-transparent text-5xl leading-none outline-none placeholder:text-[#141210]/25 sm:text-6xl"
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
            className={`font-display min-w-0 text-5xl leading-none sm:text-6xl ${value ? "" : "text-[#141210]/25"}`}
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
        <div className="flex size-36 items-center justify-center bg-[#141210]/5 font-display text-4xl">
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
          className="mt-2 block text-[11px] tracking-[0.16em] text-[#6f675e] uppercase underline underline-offset-4"
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

function Addresses({
  addresses,
}: {
  addresses: Array<SavedAddress>;
}) {
  const [popup, setPopup] = useState<"add" | "edit" | null>(null);
  const defaultAddress = addresses.find((address) => address.isDefault) ?? null;

  return (
    <Setting title="Default Address">
      {defaultAddress ? (
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase">{defaultAddress.label}</p>
          <p className="mt-2 text-sm">{defaultAddress.addressLine}</p>
          <p className="text-sm">
            {defaultAddress.city} {defaultAddress.postalCode}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#6f675e]">No default address.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={outlineButtonClass} onClick={() => setPopup("add")}>
          Add address
        </button>
        <button type="button" className={outlineButtonClass} onClick={() => setPopup("edit")}>
          Edit addresses
        </button>
      </div>
      {popup === "add" ? (
        <Popup title="Add address" onClose={() => setPopup(null)}>
          <AddressForm onSaved={() => setPopup(null)} />
        </Popup>
      ) : null}
      {popup === "edit" ? (
        <Popup title="Edit addresses" onClose={() => setPopup(null)}>
          <EditAddresses addresses={addresses} />
        </Popup>
      ) : null}
    </Setting>
  );
}

function EditAddresses({ addresses }: { addresses: Array<SavedAddress> }) {
  const [editingId, setEditingId] = useState<Id<"addresses"> | null>(null);

  if (addresses.length === 0) {
    return <p className="mt-6 text-sm text-[#6f675e]">No saved addresses.</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {addresses.map((address) =>
        editingId === address._id ? (
          <AddressForm
            key={address._id}
            address={address}
            onSaved={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <SavedAddressView key={address._id} address={address} onEdit={() => setEditingId(address._id)} />
        ),
      )}
    </div>
  );
}

function SavedAddressView({ address, onEdit }: { address: SavedAddress; onEdit: () => void }) {
  const deleteAddress = useMutation(api.users.deleteAddress);
  const setDefaultAddress = useMutation(api.users.setDefaultAddress);
  const [error, setError] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);

  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] uppercase">{address.label}</p>
      <p className="mt-2 text-sm">{address.addressLine}</p>
      <p className="text-sm">
        {address.city} {address.postalCode}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {address.isDefault ? (
          <span className="text-[11px] tracking-[0.16em] uppercase">Default</span>
        ) : (
          <button
            type="button"
            className={`${textButtonClass} disabled:opacity-50`}
            disabled={settingDefault}
            onClick={() => {
              setError(null);
              setSettingDefault(true);
              void setDefaultAddress({ addressId: address._id })
                .catch((defaultError: unknown) => {
                  setError(errorMessage(defaultError));
                })
                .finally(() => {
                  setSettingDefault(false);
                });
            }}
          >
            {settingDefault ? "Please wait" : "Set as default"}
          </button>
        )}
        <button type="button" className={textButtonClass} onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className={textButtonClass}
          onClick={() => {
            setError(null);
            void deleteAddress({ addressId: address._id }).catch((deleteError: unknown) => {
              setError(errorMessage(deleteError));
            });
          }}
        >
          Remove
        </button>
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}

function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: SavedAddress;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const saveAddress = useMutation(api.users.saveAddress);
  const [name, setName] = useState(address?.label ?? "");
  const [addressLine, setAddressLine] = useState(address?.addressLine ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    void saveAddress({
      addressId: address?._id,
      label: name,
      addressLine,
      city,
      postalCode,
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
      <input
        className={inputClass}
        name="label"
        autoComplete="name"
        placeholder="Name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
      />
      <AddressAutocomplete
        className={inputClass}
        value={addressLine}
        onChange={setAddressLine}
        onPlace={(place) => {
          if (place.addressLine) {
            setAddressLine(place.addressLine);
          }
          if (place.city) {
            setCity(place.city);
          }
          if (place.postalCode) {
            setPostalCode(place.postalCode);
          }
        }}
      />
      <input
        className={inputClass}
        name="city"
        autoComplete="address-level2"
        placeholder="City"
        value={city}
        onChange={(event) => {
          setCity(event.target.value);
        }}
      />
      <input
        className={inputClass}
        name="postalCode"
        autoComplete="postal-code"
        placeholder="Postal code"
        value={postalCode}
        onChange={(event) => {
          setPostalCode(event.target.value);
        }}
      />
      <div className="flex items-center gap-4">
        <SaveButton saving={saving} />
        {onCancel ? (
          <button type="button" className={textButtonClass} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </form>
  );
}

function Popup({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[#141210]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-dialog-title"
        className="relative max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto bg-[#f4f1eb] p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="address-dialog-title" className="text-[11px] tracking-[0.22em] uppercase">
            {title}
          </h2>
          <button type="button" className="text-[11px] tracking-[0.18em] uppercase" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
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
      className={`${className} w-fit border border-[#141210]/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50`}
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

type SavedAddress = {
  _id: Id<"addresses">;
  label: string;
  addressLine: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save";
}

const inputClass =
  "w-full border border-[#141210]/20 bg-transparent px-3 py-3 text-sm outline-none";

const outlineButtonClass =
  "border border-[#141210]/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase";

const textButtonClass = "text-[11px] tracking-[0.16em] uppercase underline underline-offset-4";
