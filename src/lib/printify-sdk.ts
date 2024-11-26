// LIBS
import Printify from "printify-sdk-js";

// ENV
import { env } from "~/env";
import { type PrettyType } from "./type-utils";

export const printify = new Printify({
  shopId: env.PRINTIFY_SHOP_ID,
  accessToken: env.PRINTIFY_KEY,
});

type testType = PrettyType<null>;

// 1. Shops
// 2. Catalog
// 3. Products
// 4. Orders
// 5. Uploads
// 6. Webhooks

// Shops
export type DeleteShopFunc = (shopId?: string) => Promise<void>;

export type ListShopsFunc = () => Promise<Shop[]>;
export interface Shop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface ShopsMethods {
  deleteOne: DeleteShopFunc;
  list: ListShopsFunc;
}

// Catalog
export interface CatalogMethods {
  listBlueprints: ListBlueprintsFunc;
  getBlueprint: GetBlueprintFunc;
  getBlueprintProviders: GetBlueprintProvidersFunc;
  getBlueprintVariants: GetBlueprintVariantsFunc;
  getVariantShipping: GetVariantShippingFunc;
  listProviders: ListProvidersFunc;
  getProvider: GetProviderFunc;
}

export type ListBlueprintsFunc = () => Promise<ListBlueprint[]>;
export interface Blueprint {
  id: number;
  title: string;
  brand: string;
  model: string;
  images: string[];
}
export interface ListBlueprint extends Blueprint {
  description: string;
}

export type GetBlueprintFunc = (
  blueprintId: string,
) => Promise<GetBlueprintResponse>;
export interface GetBlueprintResponse {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export type GetBlueprintProvidersFunc = (
  blueprintId: string,
) => Promise<PrintProvider[]>;
export interface PrintProvider {
  id: number;
  title: string;
}

export type GetBlueprintVariantsFunc = (
  blueprintId: string,
  printProviderId: string,
) => Promise<BlueprintVariants>;
export interface BlueprintVariants {
  id: number;
  title: string;
  variants: BlueprintVariant[];
}
export interface BlueprintVariant {
  id: number;
  title: string;
  options: {
    color: string;
    size: string;
  };
  placeholders: BlueprintVariantPlaceholder[];
}
export interface BlueprintVariantPlaceholder {
  position: string;
  height: number;
  width: number;
}

export type GetVariantShippingFunc = (
  blueprintId: string,
  printProviderId: string,
) => Promise<VariantShipping>;
export interface VariantShipping {
  handling_time: {
    value: number;
    unit: string;
  };
  profiles: ShippingProfile[];
}
export interface ShippingProfile {
  variant_ids: number[];
  first_item: {
    cost: number;
    currency: string;
  };
  additional_items: {
    cost: number;
    currency: string;
  };
  countries: string[];
}

export type ListProvidersFunc = () => Promise<Provider[]>;
export interface Provider {
  id: number;
  title: string;
  location: ProviderLocation;
}
export interface ProviderLocation {
  address1: string;
  address2: string | null;
  city: string;
  country: string;
  region: string;
  zip: string;
}

export type GetProviderFunc = (
  printProviderId: string,
) => Promise<GetProviderResponse>;
export interface GetProviderResponse {
  id: number;
  title: string;
  location: ProviderLocation;
  blueprints: Blueprint[];
}

// Products
export interface ProductsMethods {
  create: CreateProductFunc;
  deleteOne: DeleteProductFunc;
  getOne: GetProductFunc;
  list: ListProductsFunc;
  notifyUnpublished: NotifyUnpublishedFunc;
  publishOne: PublishProductFunc;
  setPublishFailed: SetPublishFailedFunc;
  setPublishSucceeded: SetPublishSucceededFunc;
  updateOne: UpdateProductFunc;
}

export type CreateProductFunc = (
  data: createProductInput,
) => Promise<ProductCreate>;

export interface createProductInput {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: CreateProductVariant[];
  print_areas: CreateProductPrintArea[];
  images: CreateProductImage[];
}
export interface Product extends createProductInput {
  id: string;
  tags: string[];
  options: CreateProductOption[];
  images: CreateProductImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  user_id: number;
  shop_id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
  sales_channel_properties: any[];
}
export interface CreateProductOption {
  name: string;
  type: string;
  values: {
    id: number;
    title: string;
  }[];
}
export interface CreateProductImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

export interface CreateProductVariant {
  id: number;
  sku: string;
  cost: number;
  price: number;
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  is_printify_express_eligible: boolean;
  options: number[];
}
export interface CreateProductPrintArea {
  variant_ids: number[];
  placeholders: {
    position: string;
    images: PrintAreaImage[];
  }[];
  background?: string;
}
export interface PrintAreaImage {
  id: string;
  x: number;
  y: number;
  scale: number;
  angle: number;
  name?: string;
  type?: string;
  height?: number;
  width?: number;
}

export interface ProductCreate {
  tags: string[];
  options: {
    name: string;
    type: string;
    values: {
      id: number;
      title: string;
    }[];
  }[];
  variants: {
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    is_printify_express_eligible: boolean;
    options: number[];
  }[];
  images: {
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  user_id: number;
  shop_id: number;
  print_areas: CreateProductPrintArea[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
  sales_channel_properties?: any[];
}

export type DeleteProductFunc = (productId: string) => Promise<void>;

export type GetProductFunc = (productId: string) => Promise<ProductGet>;
export interface NewProductGet {
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: Array<{
      id: number;
      title: string;
    }>;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    is_printify_express_eligible: boolean;
    options: number[];
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: {
      position: string;
      images: PrintAreaImage[];
    }[];
    background: string;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
  sales_channel_properties: any[];
}
export interface ProductGet {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: Array<{
      id: number;
      title: string;
    }>;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    is_printify_express_eligible: boolean;
    options: number[];
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        name: string;
        type: string;
        height: number;
        width: number;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
    background: string;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
  sales_channel_properties: any[];
}

export type UpdateProductFunc = (
  productId: string,
  data: UpdateData$1,
) => Promise<ProductUpdate>;
export interface ProductUpdate {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: Array<{
      id: number;
      title: string;
    }>;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    is_printify_express_eligible: boolean;
    options: number[];
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        name: string;
        type: string;
        height: number;
        width: number;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
    background: string;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
  sales_channel_properties: any[];
}

export interface ListProductData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: Array<{
      id: number;
      title: string;
    }>;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    is_printify_express_eligible: boolean;
    options: number[];
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_printify_express_eligible: boolean;
  is_printify_express_enabled: boolean;
  is_economy_shipping_eligible: boolean;
  is_economy_shipping_enabled: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        name: string;
        type: string;
        height: number;
        width: number;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
    background: string;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
  sales_channel_properties: any[];
}
export interface ListProductsResponse {
  current_page: number;
  data: ListProductData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
export type ListProductsFunc = (options?: {
  page?: number;
  limit?: number;
}) => Promise<ListProductsResponse>;

// Orders
export interface OrdersMethods {
  list: ListOrdersFunc;
  getOne: GetOrderFunc;
  submit: SubmitOrderFunc;
  submitExpress: SubmitExpressFunc;
  sendToProduction: SendToProductionFunc;
  calculateShipping: CalculateShippingFunc;
  cancelUnpaid: CancelUnpaidFunc;
}

// Uploads
// Webhooks

// TODO

export interface OrderAddress {
  first_name: string;
  last_name: string;
  region: string;
  address1: string;
  city: string;
  zip: string;
  email: string;
  phone: string;
  country: string;
  company: string;
}
export interface OrderItemMetadata {
  title: string;
  price: number;
  variant_label: string;
  sku: string;
  country: string;
}
export interface OrderItem {
  product_id: string;
  quantity: number;
  variant_id: number;
  print_provider_id: number;
  cost: number;
  shipping_cost: number;
  status: string;
  metadata: OrderItemMetadata;
  sent_to_production_at: string;
  fulfilled_at: string;
}
export interface OrderShipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at: string;
}
export interface Order {
  id: string;
  address_to: OrderAddress;
  line_items: OrderItem[];
  metadata: {
    order_type: string;
    shop_order_id: number;
    shop_order_label: string;
    shop_fulfilled_at: string;
  };
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  shipments: OrderShipment[];
  created_at: string;
  sent_to_production_at: string;
  fulfilled_at: string;
  printify_connect: {
    url: string;
    id: string;
  };
}
export interface ListOrdersResponse {
  current_page: number;
  data: Order[];
}
export type ListOrdersFunc = (options?: {
  page?: number;
  limit?: number;
  status?: string;
  sku?: string;
}) => Promise<ListOrdersResponse>;

export interface Address$5 {
  first_name: string;
  last_name: string;
  region: string;
  address1: string;
  city: string;
  zip: string;
  email: string;
  phone: string;
  country: string;
  company: string;
}
export interface LineItemMetadata {
  title: string;
  price: number;
  variant_label: string;
  sku: string;
  country: string;
}
export interface LineItem$5 {
  product_id: string;
  quantity: number;
  variant_id: number;
  print_provider_id: number;
  cost: number;
  shipping_cost: number;
  status: string;
  metadata: LineItemMetadata;
  sent_to_production_at: string;
  fulfilled_at: string;
}
export interface Metadata$2 {
  order_type: string;
  shop_order_id: number;
  shop_order_label: string;
  shop_fulfilled_at: string;
}
export interface Shipment {
  carrier: string;
  number: string;
  url: string;
  delivered_at: string;
}
export interface PrintifyConnect {
  url: string;
  id: string;
}
export interface GetOneResponse {
  id: string;
  address_to: Address$5;
  line_items: LineItem$5[];
  metadata: Metadata$2;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  shipments: Shipment[];
  created_at: string;
  sent_to_production_at: string;
  fulfilled_at: string;
  printify_connect: PrintifyConnect;
}
export type GetOrderFunc = (orderId: string) => Promise<GetOneResponse>;

export interface Address$4 {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}
export interface PrintArea$1 {
  front?:
    | string
    | {
        src: string;
        scale: number;
        x: number;
        y: number;
        angle: number;
      }[];
  back?:
    | string
    | {
        src: string;
        scale: number;
        x: number;
        y: number;
        angle: number;
      }[];
}
export interface PrintDetails {
  print_on_side?: string;
}
export interface LineItem$4 {
  product_id?: string;
  print_provider_id?: number;
  blueprint_id?: number;
  variant_id?: number;
  print_areas?: PrintArea$1;
  print_details?: PrintDetails;
  sku?: string;
  quantity: number;
}
export interface SubmitOrderData {
  external_id: string;
  label: string;
  line_items: LineItem$4[];
  shipping_method: number;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  send_shipping_notification: boolean;
  address_to: Address$4;
}
export interface SubmitOrderResponse {
  id: string;
}
export type SubmitOrderFunc = (
  data: SubmitOrderData,
) => Promise<SubmitOrderResponse>;

export interface LineItem$3 {
  product_id: string;
  variant_id: number;
  quantity: number;
}
export interface Address$3 {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
}
export interface SubmitExpressData {
  external_id: string;
  label: string;
  line_items: LineItem$3[];
  shipping_method: number;
  send_shipping_notification: boolean;
  address_to: Address$3;
}
export interface LineItemResponse {
  product_id: string;
  quantity: number;
  variant_id: number;
  print_provider_id: number;
  cost: number;
  shipping_cost: number;
  status: string;
  metadata: {
    title: string;
    price: number;
    variant_label: string;
    sku: string;
    country: string;
  };
  sent_to_production_at: string;
  fulfilled_at: string | null;
}
export interface OrderResponse {
  type: string;
  id: string;
  attributes: {
    fulfilment_type: string;
    line_items: LineItemResponse[];
  };
}
export interface SubmitExpressResponse {
  data: OrderResponse[];
}
export type SubmitExpressFunc = (
  data: SubmitExpressData,
) => Promise<SubmitExpressResponse>;

export interface Address$2 {
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  city: string;
  zip: string;
}
export interface LineItem$2 {
  quantity: number;
  product_id: string;
  variant_id: number;
  print_provider_id: number;
  shipping_cost: number;
  cost: number;
  status: string;
  metadata: {
    title: string;
    price: number;
    variant_label: string;
    sku: string;
    country: string;
  };
}
export interface Metadata$1 {
  order_type: string;
  shop_fulfilled_at: string;
}
export interface SendToProductionResponse {
  id: string;
  address_to: Address$2;
  line_items: LineItem$2[];
  metadata: Metadata$1;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  created_at: string;
}
export type SendToProductionFunc = (
  orderId: string,
) => Promise<SendToProductionResponse>;

export interface LineItem$1 {
  product_id?: string;
  variant_id?: number;
  quantity: number;
  print_provider_id?: number;
  blueprint_id?: number;
  sku?: string;
}
export interface Address$1 {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
}
export interface ShippingData {
  line_items: LineItem$1[];
  address_to: Address$1;
}
export interface ShippingResponse {
  standard: number;
  express: number;
  priority: number;
  printify_express: number;
  economy: number;
}
export type CalculateShippingFunc = (
  data: ShippingData,
) => Promise<ShippingResponse>;

export interface Address {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  region: string;
  address1: string;
  city: string;
  zip: string;
}
export interface LineItem {
  quantity: number;
  product_id: string;
  variant_id: number;
  print_provider_id: number;
  shipping_cost: number;
  cost: number;
  status: string;
  metadata: {
    title: string;
    variant_label: string;
    sku: string;
    country: string;
  };
}
export interface Metadata {
  order_type: string;
  shop_order_id: string;
  shop_order_label: string;
  shop_fulfilled_at: string;
}
export interface CancelUnpaidResponse {
  id: string;
  address_to: Address;
  line_items: LineItem[];
  metadata: Metadata;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  is_printify_express: boolean;
  is_economy_shipping: boolean;
  created_at: string;
}
export type CancelUnpaidFunc = (
  orderId: string,
) => Promise<CancelUnpaidResponse>;

export interface Variant {
  id: number;
  price: number;
  is_enabled: boolean;
}

export type NotifyUnpublishedFunc = (productId: string) => Promise<void>;

export interface PublishData {
  title: boolean;
  description: boolean;
  images: boolean;
  variants: boolean;
  tags: boolean;
  keyFeatures: boolean;
  shipping_template: boolean;
}
export type PublishProductFunc = (
  productId: string,
  data: PublishData,
) => Promise<Response>;

export interface PublishFailedData {
  reason: string;
}
export type SetPublishFailedFunc = (
  productId: string,
  data: PublishFailedData,
) => Promise<void>;

export interface ExternalData {
  id: string;
  handle: string;
}
export interface PublishSucceededData {
  external: ExternalData;
}
export type SetPublishSucceededFunc = (
  productId: string,
  data: PublishSucceededData,
) => Promise<void>;

export interface UpdateData$1 {
  title?: string;
  description?: string;
  images?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- variants is an array of any
  variants?: any[];
  tags?: string[];
  keyFeatures?: string[];
  shipping_template?: string;
}

export type ArchiveUploadFunc = (imageId: string) => Promise<void>;

export interface GetUploadByIdResponse {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}
export type GetUploadByIdFunc = (
  imageId: string,
) => Promise<GetUploadByIdResponse>;

export interface Upload {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}
export interface ListUploadsResponse {
  current_page: number;
  data: Upload[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
export type ListUploadsFunc = (
  page?: number,
  limit?: number,
) => Promise<ListUploadsResponse>;

export interface UploadImageDataUrl {
  file_name: string;
  url: string;
}
export interface UploadImageDataBase64 {
  file_name: string;
  contents: string;
}
export interface UploadImageResponse {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}
export type UploadImageFunc = (
  data: UploadImageDataUrl | UploadImageDataBase64,
) => Promise<UploadImageResponse>;

export interface UploadsMethods {
  archive: ArchiveUploadFunc;
  getById: GetUploadByIdFunc;
  list: ListUploadsFunc;
  uploadImage: UploadImageFunc;
}

export interface Webhook {
  topic: string;
  url: string;
  shop_id: string;
  id: string;
}
export type ListWebhooksFunc = () => Promise<Webhook[]>;

export interface Data {
  topic: string;
  url: string;
}
export interface CreateWebhookResponse {
  topic: string;
  url: string;
  shop_id: string;
  id: string;
}
export type CreateWebhookFunc = (data: Data) => Promise<CreateWebhookResponse>;

export interface UpdateData {
  url: string;
}
export interface UpdateWebhookResponse {
  topic: string;
  url: string;
  shop_id: string;
  id: string;
}
export type UpdateWebhookFunc = (
  webhookId: string,
  data: UpdateData,
) => Promise<UpdateWebhookResponse>;

export interface DeleteWebhookResponse {
  id: string;
}
export type DeleteWebhookFunc = (
  webhookId: string,
) => Promise<DeleteWebhookResponse>;

export interface WebhookMethods {
  list: ListWebhooksFunc;
  create: CreateWebhookFunc;
  updateOne: UpdateWebhookFunc;
  deleteOne: DeleteWebhookFunc;
}

// Rawr
// export type ListBlueprintsFunc = () => Promise<Blueprint$1[]>;
// export interface Blueprint$1 {
//   id: number;
//   title: string;
//   description: string;
//   brand: string;
//   model: string;
//   images: string[];
// }

// export interface GetBlueprintResponse {
//   id: number;
//   title: string;
//   description: string;
//   brand: string;
//   model: string;
//   images: string[];
// }
// export type GetBlueprintFunc = (
//   blueprintId: string,
// ) => Promise<GetBlueprintResponse>;

// export interface PrintProvider {
//   id: number;
//   title: string;
// }
// export type GetBlueprintProvidersFunc = (
//   blueprintId: string,
// ) => Promise<PrintProvider[]>;

// export interface Placeholder {
//   position: string;
//   height: number;
//   width: number;
// }
// export interface Variant$1 {
//   id: number;
//   title: string;
//   options: {
//     color: string;
//     size: string;
//   };
//   placeholders: Placeholder[];
// }
// export interface BlueprintVariants {
//   id: number;
//   title: string;
//   variants: Variant$1[];
// }
// export type GetBlueprintVariantsFunc = (
//   blueprintId: string,
//   printProviderId: string,
// ) => Promise<BlueprintVariants>;

// export interface ShippingProfile {
//   variant_ids: number[];
//   first_item: {
//     cost: number;
//     currency: string;
//   };
//   additional_items: {
//     cost: number;
//     currency: string;
//   };
//   countries: string[];
// }
// export interface VariantShipping {
//   handling_time: {
//     value: number;
//     unit: string;
//   };
//   profiles: ShippingProfile[];
// }
// export type GetVariantShippingFunc = (
//   blueprintId: string,
//   printProviderId: string,
// ) => Promise<VariantShipping>;

// export interface Location$1 {
//   address1: string;
//   address2: string | null;
//   city: string;
//   country: string;
//   region: string;
//   zip: string;
// }
// export interface Provider {
//   id: number;
//   title: string;
//   location: Location$1;
// }
// export type ListProvidersFunc = () => Promise<Provider[]>;

// export interface Location {
//   address1: string;
//   address2: string | null;
//   city: string;
//   country: string;
//   region: string;
//   zip: string;
// }
// export interface Blueprint {
//   id: number;
//   title: string;
//   brand: string;
//   model: string;
//   images: string[];
// }
// export interface GetProviderResponse {
//   id: number;
//   title: string;
//   location: Location;
//   blueprints: Blueprint[];
// }
// export type GetProviderFunc = (
//   printProviderId: string,
// ) => Promise<GetProviderResponse>;

// export interface CatalogMethods {
//   listBlueprints: ListBlueprintsFunc;
//   getBlueprint: GetBlueprintFunc;
//   getBlueprintProviders: GetBlueprintProvidersFunc;
//   getBlueprintVariants: GetBlueprintVariantsFunc;
//   getVariantShipping: GetVariantShippingFunc;
//   listProviders: ListProvidersFunc;
//   getProvider: GetProviderFunc;
// }

// export interface OrderAddress {
//   first_name: string;
//   last_name: string;
//   region: string;
//   address1: string;
//   city: string;
//   zip: string;
//   email: string;
//   phone: string;
//   country: string;
//   company: string;
// }
// export interface OrderItemMetadata {
//   title: string;
//   price: number;
//   variant_label: string;
//   sku: string;
//   country: string;
// }
// export interface OrderItem {
//   product_id: string;
//   quantity: number;
//   variant_id: number;
//   print_provider_id: number;
//   cost: number;
//   shipping_cost: number;
//   status: string;
//   metadata: OrderItemMetadata;
//   sent_to_production_at: string;
//   fulfilled_at: string;
// }
// export interface OrderShipment {
//   carrier: string;
//   number: string;
//   url: string;
//   delivered_at: string;
// }
// export interface Order {
//   id: string;
//   address_to: OrderAddress;
//   line_items: OrderItem[];
//   metadata: {
//     order_type: string;
//     shop_order_id: number;
//     shop_order_label: string;
//     shop_fulfilled_at: string;
//   };
//   total_price: number;
//   total_shipping: number;
//   total_tax: number;
//   status: string;
//   shipping_method: number;
//   is_printify_express: boolean;
//   is_economy_shipping: boolean;
//   shipments: OrderShipment[];
//   created_at: string;
//   sent_to_production_at: string;
//   fulfilled_at: string;
//   printify_connect: {
//     url: string;
//     id: string;
//   };
// }
// export interface ListOrdersResponse {
//   current_page: number;
//   data: Order[];
// }
// export type ListOrdersFunc = (options?: {
//   page?: number;
//   limit?: number;
//   status?: string;
//   sku?: string;
// }) => Promise<ListOrdersResponse>;

// export interface Address$5 {
//   first_name: string;
//   last_name: string;
//   region: string;
//   address1: string;
//   city: string;
//   zip: string;
//   email: string;
//   phone: string;
//   country: string;
//   company: string;
// }
// export interface LineItemMetadata {
//   title: string;
//   price: number;
//   variant_label: string;
//   sku: string;
//   country: string;
// }
// export interface LineItem$5 {
//   product_id: string;
//   quantity: number;
//   variant_id: number;
//   print_provider_id: number;
//   cost: number;
//   shipping_cost: number;
//   status: string;
//   metadata: LineItemMetadata;
//   sent_to_production_at: string;
//   fulfilled_at: string;
// }
// export interface Metadata$2 {
//   order_type: string;
//   shop_order_id: number;
//   shop_order_label: string;
//   shop_fulfilled_at: string;
// }
// export interface Shipment {
//   carrier: string;
//   number: string;
//   url: string;
//   delivered_at: string;
// }
// export interface PrintifyConnect {
//   url: string;
//   id: string;
// }
// export interface GetOneResponse {
//   id: string;
//   address_to: Address$5;
//   line_items: LineItem$5[];
//   metadata: Metadata$2;
//   total_price: number;
//   total_shipping: number;
//   total_tax: number;
//   status: string;
//   shipping_method: number;
//   is_printify_express: boolean;
//   is_economy_shipping: boolean;
//   shipments: Shipment[];
//   created_at: string;
//   sent_to_production_at: string;
//   fulfilled_at: string;
//   printify_connect: PrintifyConnect;
// }
// export type GetOrderFunc = (orderId: string) => Promise<GetOneResponse>;

// export interface Address$4 {
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string;
//   country: string;
//   region: string;
//   address1: string;
//   address2?: string;
//   city: string;
//   zip: string;
// }
// export interface PrintArea$1 {
//   front?:
//     | string
//     | {
//         src: string;
//         scale: number;
//         x: number;
//         y: number;
//         angle: number;
//       }[];
//   back?:
//     | string
//     | {
//         src: string;
//         scale: number;
//         x: number;
//         y: number;
//         angle: number;
//       }[];
// }
// export interface PrintDetails {
//   print_on_side?: string;
// }
// export interface LineItem$4 {
//   product_id?: string;
//   print_provider_id?: number;
//   blueprint_id?: number;
//   variant_id?: number;
//   print_areas?: PrintArea$1;
//   print_details?: PrintDetails;
//   sku?: string;
//   quantity: number;
// }
// export interface SubmitOrderData {
//   external_id: string;
//   label: string;
//   line_items: LineItem$4[];
//   shipping_method: number;
//   is_printify_express: boolean;
//   is_economy_shipping: boolean;
//   send_shipping_notification: boolean;
//   address_to: Address$4;
// }
// export interface SubmitOrderResponse {
//   id: string;
// }
// export type SubmitOrderFunc = (
//   data: SubmitOrderData,
// ) => Promise<SubmitOrderResponse>;

// export interface LineItem$3 {
//   product_id: string;
//   variant_id: number;
//   quantity: number;
// }
// export interface Address$3 {
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string;
//   country: string;
//   region: string;
//   address1: string;
//   address2: string;
//   city: string;
//   zip: string;
// }
// export interface SubmitExpressData {
//   external_id: string;
//   label: string;
//   line_items: LineItem$3[];
//   shipping_method: number;
//   send_shipping_notification: boolean;
//   address_to: Address$3;
// }
// export interface LineItemResponse {
//   product_id: string;
//   quantity: number;
//   variant_id: number;
//   print_provider_id: number;
//   cost: number;
//   shipping_cost: number;
//   status: string;
//   metadata: {
//     title: string;
//     price: number;
//     variant_label: string;
//     sku: string;
//     country: string;
//   };
//   sent_to_production_at: string;
//   fulfilled_at: string | null;
// }
// export interface OrderResponse {
//   type: string;
//   id: string;
//   attributes: {
//     fulfilment_type: string;
//     line_items: LineItemResponse[];
//   };
// }
// export interface SubmitExpressResponse {
//   data: OrderResponse[];
// }
// export type SubmitExpressFunc = (
//   data: SubmitExpressData,
// ) => Promise<SubmitExpressResponse>;

// export interface Address$2 {
//   first_name: string;
//   last_name: string;
//   phone: string;
//   country: string;
//   region: string;
//   address1: string;
//   city: string;
//   zip: string;
// }
// export interface LineItem$2 {
//   quantity: number;
//   product_id: string;
//   variant_id: number;
//   print_provider_id: number;
//   shipping_cost: number;
//   cost: number;
//   status: string;
//   metadata: {
//     title: string;
//     price: number;
//     variant_label: string;
//     sku: string;
//     country: string;
//   };
// }
// export interface Metadata$1 {
//   order_type: string;
//   shop_fulfilled_at: string;
// }
// export interface SendToProductionResponse {
//   id: string;
//   address_to: Address$2;
//   line_items: LineItem$2[];
//   metadata: Metadata$1;
//   total_price: number;
//   total_shipping: number;
//   total_tax: number;
//   status: string;
//   shipping_method: number;
//   is_printify_express: boolean;
//   is_economy_shipping: boolean;
//   created_at: string;
// }
// export type SendToProductionFunc = (
//   orderId: string,
// ) => Promise<SendToProductionResponse>;

// export interface LineItem$1 {
//   product_id?: string;
//   variant_id?: number;
//   quantity: number;
//   print_provider_id?: number;
//   blueprint_id?: number;
//   sku?: string;
// }
// export interface Address$1 {
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone: string;
//   country: string;
//   region: string;
//   address1: string;
//   address2: string;
//   city: string;
//   zip: string;
// }
// export interface ShippingData {
//   line_items: LineItem$1[];
//   address_to: Address$1;
// }
// export interface ShippingResponse {
//   standard: number;
//   express: number;
//   priority: number;
//   printify_express: number;
//   economy: number;
// }
// export type CalculateShippingFunc = (
//   data: ShippingData,
// ) => Promise<ShippingResponse>;

// export interface Address {
//   first_name: string;
//   last_name: string;
//   email: string;
//   country: string;
//   region: string;
//   address1: string;
//   city: string;
//   zip: string;
// }
// export interface LineItem {
//   quantity: number;
//   product_id: string;
//   variant_id: number;
//   print_provider_id: number;
//   shipping_cost: number;
//   cost: number;
//   status: string;
//   metadata: {
//     title: string;
//     variant_label: string;
//     sku: string;
//     country: string;
//   };
// }
// export interface Metadata {
//   order_type: string;
//   shop_order_id: string;
//   shop_order_label: string;
//   shop_fulfilled_at: string;
// }
// export interface CancelUnpaidResponse {
//   id: string;
//   address_to: Address;
//   line_items: LineItem[];
//   metadata: Metadata;
//   total_price: number;
//   total_shipping: number;
//   total_tax: number;
//   status: string;
//   shipping_method: number;
//   is_printify_express: boolean;
//   is_economy_shipping: boolean;
//   created_at: string;
// }
// export type CancelUnpaidFunc = (
//   orderId: string,
// ) => Promise<CancelUnpaidResponse>;

// export interface OrdersMethods {
//   list: ListOrdersFunc;
//   getOne: GetOrderFunc;
//   submit: SubmitOrderFunc;
//   submitExpress: SubmitExpressFunc;
//   sendToProduction: SendToProductionFunc;
//   calculateShipping: CalculateShippingFunc;
//   cancelUnpaid: CancelUnpaidFunc;
// }

// export interface Variant {
//   id: number;
//   price: number;
//   is_enabled: boolean;
// }
// export interface PrintArea {
//   variant_ids: number[];
//   placeholders: {
//     position: string;
//     images: {
//       id: string;
//       x: number;
//       y: number;
//       scale: number;
//       angle: number;
//     }[];
//   }[];
// }
// export interface CreateProductData {
//   title: string;
//   description: string;
//   blueprint_id: number;
//   print_provider_id: number;
//   variants: Variant[];
//   print_areas: PrintArea[];
// }

// export interface Product {
//   id: string;
//   title: string;
//   description: string;
//   tags: string[];
//   options: Array<{
//     name: string;
//     type: string;
//     values: Array<{
//       id: number;
//       title: string;
//     }>;
//   }>;
//   variants: Array<{
//     id: number;
//     sku: string;
//     cost: number;
//     price: number;
//     title: string;
//     grams: number;
//     is_enabled: boolean;
//     is_default: boolean;
//     is_available: boolean;
//     is_printify_express_eligible: boolean;
//     options: number[];
//   }>;
//   images: Array<{
//     src: string;
//     variant_ids: number[];
//     position: string;
//     is_default: boolean;
//   }>;
//   created_at: string;
//   updated_at: string;
//   visible: boolean;
//   is_locked: boolean;
//   is_printify_express_eligible: boolean;
//   is_printify_express_enabled: boolean;
//   is_economy_shipping_eligible: boolean;
//   is_economy_shipping_enabled: boolean;
//   blueprint_id: number;
//   user_id: number;
//   shop_id: number;
//   print_provider_id: number;
//   print_areas: Array<{
//     variant_ids: number[];
//     placeholders: Array<{
//       position: string;
//       images: Array<{
//         id: string;
//         name: string;
//         type: string;
//         height: number;
//         width: number;
//         x: number;
//         y: number;
//         scale: number;
//         angle: number;
//       }>;
//     }>;
//     background: string;
//   }>;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
//   sales_channel_properties: any[];
// }

// export interface Product$3 {
//   id: string;
//   title: string;
//   description: string;
//   tags: string[];
//   options: Array<{
//     name: string;
//     type: string;
//     values: Array<{
//       id: number;
//       title: string;
//     }>;
//   }>;
//   variants: Array<{
//     id: number;
//     sku: string;
//     cost: number;
//     price: number;
//     title: string;
//     grams: number;
//     is_enabled: boolean;
//     is_default: boolean;
//     is_available: boolean;
//     is_printify_express_eligible: boolean;
//     options: number[];
//   }>;
//   images: Array<{
//     src: string;
//     variant_ids: number[];
//     position: string;
//     is_default: boolean;
//   }>;
//   created_at: string;
//   updated_at: string;
//   visible: boolean;
//   is_locked: boolean;
//   is_printify_express_eligible: boolean;
//   is_printify_express_enabled: boolean;
//   is_economy_shipping_eligible: boolean;
//   is_economy_shipping_enabled: boolean;
//   blueprint_id: number;
//   user_id: number;
//   shop_id: number;
//   print_provider_id: number;
//   print_areas: Array<{
//     variant_ids: number[];
//     placeholders: Array<{
//       position: string;
//       images: Array<{
//         id: string;
//         name: string;
//         type: string;
//         height: number;
//         width: number;
//         x: number;
//         y: number;
//         scale: number;
//         angle: number;
//       }>;
//     }>;
//     background: string;
//   }>;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
//   sales_channel_properties: any[];
// }
// export type CreateProductFunc = (data: CreateProductData) => Promise<Product$3>;

// export type DeleteProductFunc = (productId: string) => Promise<void>;

// export interface Product$2 {
//   id: string;
//   title: string;
//   description: string;
//   tags: string[];
//   options: Array<{
//     name: string;
//     type: string;
//     values: Array<{
//       id: number;
//       title: string;
//     }>;
//   }>;
//   variants: Array<{
//     id: number;
//     sku: string;
//     cost: number;
//     price: number;
//     title: string;
//     grams: number;
//     is_enabled: boolean;
//     is_default: boolean;
//     is_available: boolean;
//     is_printify_express_eligible: boolean;
//     options: number[];
//   }>;
//   images: Array<{
//     src: string;
//     variant_ids: number[];
//     position: string;
//     is_default: boolean;
//   }>;
//   created_at: string;
//   updated_at: string;
//   visible: boolean;
//   is_locked: boolean;
//   is_printify_express_eligible: boolean;
//   is_printify_express_enabled: boolean;
//   is_economy_shipping_eligible: boolean;
//   is_economy_shipping_enabled: boolean;
//   blueprint_id: number;
//   user_id: number;
//   shop_id: number;
//   print_provider_id: number;
//   print_areas: Array<{
//     variant_ids: number[];
//     placeholders: Array<{
//       position: string;
//       images: Array<{
//         id: string;
//         name: string;
//         type: string;
//         height: number;
//         width: number;
//         x: number;
//         y: number;
//         scale: number;
//         angle: number;
//       }>;
//     }>;
//     background: string;
//   }>;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
//   sales_channel_properties: any[];
// }
// export type GetProductFunc = (productId: string) => Promise<Product$2>;

// export interface Product$1 {
//   id: string;
//   title: string;
//   description: string;
//   tags: string[];
//   options: Array<{
//     name: string;
//     type: string;
//     values: Array<{
//       id: number;
//       title: string;
//     }>;
//   }>;
//   variants: Array<{
//     id: number;
//     sku: string;
//     cost: number;
//     price: number;
//     title: string;
//     grams: number;
//     is_enabled: boolean;
//     is_default: boolean;
//     is_available: boolean;
//     is_printify_express_eligible: boolean;
//     options: number[];
//   }>;
//   images: Array<{
//     src: string;
//     variant_ids: number[];
//     position: string;
//     is_default: boolean;
//   }>;
//   created_at: string;
//   updated_at: string;
//   visible: boolean;
//   is_locked: boolean;
//   is_printify_express_eligible: boolean;
//   is_printify_express_enabled: boolean;
//   is_economy_shipping_eligible: boolean;
//   is_economy_shipping_enabled: boolean;
//   blueprint_id: number;
//   user_id: number;
//   shop_id: number;
//   print_provider_id: number;
//   print_areas: Array<{
//     variant_ids: number[];
//     placeholders: Array<{
//       position: string;
//       images: Array<{
//         id: string;
//         name: string;
//         type: string;
//         height: number;
//         width: number;
//         x: number;
//         y: number;
//         scale: number;
//         angle: number;
//       }>;
//     }>;
//     background: string;
//   }>;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sales_channel_properties is an array of any
//   sales_channel_properties: any[];
// }
// export interface ListProductsResponse {
//   current_page: number;
//   data: Product$1[];
//   first_page_url: string;
//   from: number;
//   last_page: number;
//   last_page_url: string;
//   next_page_url: string | null;
//   path: string;
//   per_page: number;
//   prev_page_url: string | null;
//   to: number;
//   total: number;
// }
// export type ListProductsFunc = (options?: {
//   page?: number;
//   limit?: number;
// }) => Promise<ListProductsResponse>;

// export type NotifyUnpublishedFunc = (productId: string) => Promise<void>;

// export interface PublishData {
//   title: boolean;
//   description: boolean;
//   images: boolean;
//   variants: boolean;
//   tags: boolean;
//   keyFeatures: boolean;
//   shipping_template: boolean;
// }
// export type PublishProductFunc = (
//   productId: string,
//   data: PublishData,
// ) => Promise<Response>;

// export interface PublishFailedData {
//   reason: string;
// }
// export type SetPublishFailedFunc = (
//   productId: string,
//   data: PublishFailedData,
// ) => Promise<void>;

// export interface ExternalData {
//   id: string;
//   handle: string;
// }
// export interface PublishSucceededData {
//   external: ExternalData;
// }
// export type SetPublishSucceededFunc = (
//   productId: string,
//   data: PublishSucceededData,
// ) => Promise<void>;

// export interface UpdateData$1 {
//   title?: string;
//   description?: string;
//   images?: string[];
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- variants is an array of any
//   variants?: any[];
//   tags?: string[];
//   keyFeatures?: string[];
//   shipping_template?: string;
// }
// export type UpdateProductFunc = (
//   productId: string,
//   data: UpdateData$1,
// ) => Promise<Product>;

// export interface ProductsMethods {
//   create: CreateProductFunc;
//   deleteOne: DeleteProductFunc;
//   getOne: GetProductFunc;
//   list: ListProductsFunc;
//   notifyUnpublished: NotifyUnpublishedFunc;
//   publishOne: PublishProductFunc;
//   setPublishFailed: SetPublishFailedFunc;
//   setPublishSucceeded: SetPublishSucceededFunc;
//   updateOne: UpdateProductFunc;
// }

// export type DeleteShopFunc = (shopId?: string) => Promise<void>;

// export interface Shop {
//   id: number;
//   title: string;
//   sales_channel: string;
// }
// export type ListShopsFunc = () => Promise<Shop[]>;

// export interface ShopsMethods {
//   deleteOne: DeleteShopFunc;
//   list: ListShopsFunc;
// }

// export type ArchiveUploadFunc = (imageId: string) => Promise<void>;

// export interface GetUploadByIdResponse {
//   id: string;
//   file_name: string;
//   height: number;
//   width: number;
//   size: number;
//   mime_type: string;
//   preview_url: string;
//   upload_time: string;
// }
// export type GetUploadByIdFunc = (
//   imageId: string,
// ) => Promise<GetUploadByIdResponse>;

// export interface Upload {
//   id: string;
//   file_name: string;
//   height: number;
//   width: number;
//   size: number;
//   mime_type: string;
//   preview_url: string;
//   upload_time: string;
// }
// export interface ListUploadsResponse {
//   current_page: number;
//   data: Upload[];
//   first_page_url: string;
//   from: number;
//   last_page: number;
//   last_page_url: string;
//   next_page_url: string | null;
//   path: string;
//   per_page: number;
//   prev_page_url: string | null;
//   to: number;
//   total: number;
// }
// export type ListUploadsFunc = (
//   page?: number,
//   limit?: number,
// ) => Promise<ListUploadsResponse>;

// export interface UploadImageDataUrl {
//   file_name: string;
//   url: string;
// }
// export interface UploadImageDataBase64 {
//   file_name: string;
//   contents: string;
// }
// export interface UploadImageResponse {
//   id: string;
//   file_name: string;
//   height: number;
//   width: number;
//   size: number;
//   mime_type: string;
//   preview_url: string;
//   upload_time: string;
// }
// export type UploadImageFunc = (
//   data: UploadImageDataUrl | UploadImageDataBase64,
// ) => Promise<UploadImageResponse>;

// export interface UploadsMethods {
//   archive: ArchiveUploadFunc;
//   getById: GetUploadByIdFunc;
//   list: ListUploadsFunc;
//   uploadImage: UploadImageFunc;
// }

// export interface Webhook {
//   topic: string;
//   url: string;
//   shop_id: string;
//   id: string;
// }
// export type ListWebhooksFunc = () => Promise<Webhook[]>;

// export interface Data {
//   topic: string;
//   url: string;
// }
// export interface CreateWebhookResponse {
//   topic: string;
//   url: string;
//   shop_id: string;
//   id: string;
// }
// export type CreateWebhookFunc = (data: Data) => Promise<CreateWebhookResponse>;

// export interface UpdateData {
//   url: string;
// }
// export interface UpdateWebhookResponse {
//   topic: string;
//   url: string;
//   shop_id: string;
//   id: string;
// }
// export type UpdateWebhookFunc = (
//   webhookId: string,
//   data: UpdateData,
// ) => Promise<UpdateWebhookResponse>;

// export interface DeleteWebhookResponse {
//   id: string;
// }
// export type DeleteWebhookFunc = (
//   webhookId: string,
// ) => Promise<DeleteWebhookResponse>;

// export interface WebhookMethods {
//   list: ListWebhooksFunc;
//   create: CreateWebhookFunc;
//   updateOne: UpdateWebhookFunc;
//   deleteOne: DeleteWebhookFunc;
// }
