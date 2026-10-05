import { countryName } from "@/lib/countries";

export type OrderShippingAddress = {
  name: string;
  addressLine: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
};

export default function OrderAddress({
  address,
  className = "mt-3 text-sm leading-6",
}: {
  address: OrderShippingAddress;
  className?: string;
}) {
  const locality = [address.city, [address.region, address.postalCode].filter((part) => part.length > 0).join(" ")]
    .filter((part) => part.length > 0)
    .join(", ");
  const country = countryName(address.country);

  return (
    <p className={className}>
      {address.name}
      <br />
      {address.addressLine}
      {address.addressLine2.length > 0 ? (
        <>
          <br />
          {address.addressLine2}
        </>
      ) : null}
      {locality.length > 0 ? (
        <>
          <br />
          {locality}
        </>
      ) : null}
      {country.length > 0 ? (
        <>
          <br />
          {country}
        </>
      ) : null}
      {address.phone.length > 0 ? (
        <>
          <br />
          {address.phone}
        </>
      ) : null}
    </p>
  );
}
