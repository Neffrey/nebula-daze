"use client";

import { useMutation } from "convex/react";
import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { countryName } from "@/lib/countries";

export type SavedAddress = {
  _id: Id<"addresses">;
  label: string;
  addressLine: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export default function SavedAddresses({
  addresses,
  checkout = false,
  shippingAddressId = null,
  onShippingAddressChange,
}: {
  addresses: Array<SavedAddress>;
  checkout?: boolean;
  shippingAddressId?: Id<"addresses"> | null;
  onShippingAddressChange?: (addressId: Id<"addresses">) => void;
}) {
  const [popup, setPopup] = useState<"add" | "edit" | null>(null);
  const defaultAddress = addresses.find((address) => address.isDefault) ?? null;
  const shownAddress =
    addresses.find((address) => address._id === shippingAddressId) ?? defaultAddress;

  function useForShipping(addressId: Id<"addresses">) {
    onShippingAddressChange?.(addressId);
    setPopup(null);
  }

  return (
    <section>
      {shownAddress ? (
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase">{shownAddress.label}</p>
          <AddressLines address={shownAddress} />
        </div>
      ) : (
        <p className="text-sm text-muted">No default address.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {checkout ? null : (
          <button type="button" className={outlineButtonClass} onClick={() => setPopup("add")}>
            Add address
          </button>
        )}
        <button type="button" className={outlineButtonClass} onClick={() => setPopup("edit")}>
          {checkout ? "Change address" : "Edit addresses"}
        </button>
      </div>
      {popup === "add" ? (
        <Popup title="Add address" onClose={() => setPopup(null)}>
          <AddressForm onSaved={() => setPopup(null)} />
        </Popup>
      ) : null}
      {popup === "edit" ? (
        <Popup title={checkout ? "Change address" : "Edit addresses"} onClose={() => setPopup(null)}>
          <EditAddresses
            addresses={addresses}
            newAddress={checkout}
            shippingAddressId={checkout ? shownAddress?._id ?? null : null}
            onUse={checkout ? useForShipping : undefined}
            onNewAddressSaved={checkout ? useForShipping : undefined}
          />
        </Popup>
      ) : null}
    </section>
  );
}

function EditAddresses({
  addresses,
  newAddress = false,
  shippingAddressId = null,
  onUse,
  onNewAddressSaved,
}: {
  addresses: Array<SavedAddress>;
  newAddress?: boolean;
  shippingAddressId?: Id<"addresses"> | null;
  onUse?: (addressId: Id<"addresses">) => void;
  onNewAddressSaved?: (addressId: Id<"addresses">) => void;
}) {
  const [editingId, setEditingId] = useState<Id<"addresses"> | null>(null);

  return (
    <div className="mt-6 flex flex-col gap-8">
      {addresses.length === 0 ? (
        <p className="text-sm text-muted">No saved addresses.</p>
      ) : (
        addresses.map((address) =>
          editingId === address._id ? (
            <AddressForm
              key={address._id}
              address={address}
              onSaved={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <SavedAddressView
              key={address._id}
              address={address}
              checkout={onUse !== undefined}
              shipping={address._id === shippingAddressId}
              onUse={onUse === undefined ? undefined : () => onUse(address._id)}
              onEdit={() => setEditingId(address._id)}
            />
          ),
        )
      )}
      {newAddress ? (
        <div className="border-t border-foreground/10 pt-8">
          <p className="text-[11px] tracking-[0.22em] uppercase">New address</p>
          <AddressForm onSaved={onNewAddressSaved} />
        </div>
      ) : null}
    </div>
  );
}

function SavedAddressView({
  address,
  onEdit,
  checkout = false,
  shipping = false,
  onUse,
}: {
  address: SavedAddress;
  onEdit: () => void;
  checkout?: boolean;
  shipping?: boolean;
  onUse?: () => void;
}) {
  const deleteAddress = useMutation(api.users.deleteAddress);
  const setDefaultAddress = useMutation(api.users.setDefaultAddress);
  const [error, setError] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);

  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] uppercase">{address.label}</p>
      <AddressLines address={address} />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {address.isDefault ? <span className="text-[11px] tracking-[0.16em] uppercase">Default</span> : null}
        {checkout ? (
          shipping ? (
            <span className="text-[11px] tracking-[0.16em] uppercase">Shipping</span>
          ) : (
            <button type="button" className={textButtonClass} onClick={onUse}>
              Use this address
            </button>
          )
        ) : address.isDefault ? null : (
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
  onSaved?: (addressId: Id<"addresses">) => void;
  onCancel?: () => void;
}) {
  const saveAddress = useMutation(api.users.saveAddress);
  const [name, setName] = useState(address?.label ?? "");
  const [addressLine, setAddressLine] = useState(address?.addressLine ?? "");
  const [addressLine2, setAddressLine2] = useState(address?.addressLine2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [region, setRegion] = useState(address?.region ?? "");
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  const [country, setCountry] = useState(countryName(address?.country ?? ""));
  const [phone, setPhone] = useState(address?.phone ?? "");
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
      addressLine2,
      city,
      region,
      postalCode,
      country,
      phone,
    })
      .then((addressId) => {
        onSaved?.(addressId);
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
        placeholder="Recipient name"
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
          if (place.addressLine2) {
            setAddressLine2(place.addressLine2);
          }
          if (place.city) {
            setCity(place.city);
          }
          if (place.region) {
            setRegion(place.region);
          }
          if (place.postalCode) {
            setPostalCode(place.postalCode);
          }
          if (place.country) {
            setCountry(countryName(place.country));
          }
        }}
      />
      <input
        className={inputClass}
        name="addressLine2"
        autoComplete="address-line2"
        placeholder="Apartment, suite, or unit"
        value={addressLine2}
        onChange={(event) => {
          setAddressLine2(event.target.value);
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
        name="region"
        autoComplete="address-level1"
        placeholder="State / Province"
        required
        value={region}
        onChange={(event) => {
          setRegion(event.target.value);
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
      <input
        className={inputClass}
        name="country"
        autoComplete="country-name"
        placeholder="Country"
        required
        value={country}
        onChange={(event) => {
          setCountry(event.target.value);
        }}
      />
      <input
        className={inputClass}
        name="phone"
        autoComplete="tel"
        placeholder="Phone"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
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
      <button type="button" aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-dialog-title"
        className="relative max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto bg-background p-6 sm:p-8"
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

function AddressLines({
  address,
}: {
  address: Pick<SavedAddress, "addressLine" | "addressLine2" | "city" | "region" | "postalCode" | "country" | "phone">;
}) {
  const locality = [address.city, address.region].filter((part) => part.length > 0).join(", ");
  const country = countryName(address.country);
  return (
    <>
      <p className="mt-2 text-sm">{address.addressLine}</p>
      {address.addressLine2.length > 0 ? <p className="text-sm">{address.addressLine2}</p> : null}
      <p className="text-sm">
        {locality} {address.postalCode}
      </p>
      {country.length > 0 ? <p className="text-sm">{country}</p> : null}
      {address.phone.length > 0 ? <p className="text-sm">{address.phone}</p> : null}
    </>
  );
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      className="w-fit border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase disabled:opacity-50"
      disabled={saving}
    >
      {saving ? "Please wait" : "Save"}
    </button>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="mt-3 text-sm text-rose-800">{children}</p>;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save";
}

const inputClass = "w-full border border-foreground/20 bg-transparent px-3 py-3 text-sm outline-none";

const outlineButtonClass = "border border-foreground/20 px-6 py-3 text-[11px] tracking-[0.22em] uppercase";

const textButtonClass = "text-[11px] tracking-[0.16em] uppercase underline underline-offset-4";
