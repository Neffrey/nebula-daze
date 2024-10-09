// TYPES
import type { OrderAddressTo } from "~/server/db/schema";

export type OrderSubmissionLineItems = {
  sku: string;
  quantity: number;
};

export type OrderSubmissionParams = {
  id: string;
  line_items: OrderSubmissionLineItems[];
  address_to: OrderAddressTo;
  shipping_method: 1 | 2 | 3 | 4;
};

export const orderSubmission = ({
  id,
  line_items,
  shipping_method,
  address_to,
}: OrderSubmissionParams) => {
  return {
    external_id: id,
    line_items,
    address_to,
    shipping_method,
  };
};
