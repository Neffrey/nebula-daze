export function optionalLine(value: string, label: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`${label} is too long`);
  }
  return trimmed;
}

export function shippingPhone(value: string) {
  const phone = value.trim();
  if (phone.length === 0) {
    return "";
  }
  const digits = phone.replace(/\D/g, "");
  if (phone.length > 30 || digits.length < 7 || digits.length > 15 || !/^[0-9+().\-\s]+$/.test(phone)) {
    throw new Error("Enter a valid phone number");
  }
  return phone;
}
