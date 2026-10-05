export const ORDER_NUMBER_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const ORDER_NUMBER_LENGTH = 12;

export function formatOrderNumber(orderNumber: string) {
  if (orderNumber.length !== ORDER_NUMBER_LENGTH) {
    return orderNumber;
  }
  return `${orderNumber.slice(0, 4)}-${orderNumber.slice(4, 8)}-${orderNumber.slice(8, 12)}`;
}
