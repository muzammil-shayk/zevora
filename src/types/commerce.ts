export type PaymentMethod = 'cod' | 'card' | 'bank_transfer';

export type PaymentStatus = 'paid' | 'pending_cod' | 'awaiting_transfer' | 'failed';

export type OrderStatus = 'confirmed' | 'inspecting' | 'packed' | 'shipped' | 'delivered';

export interface BagLineInput {
  productId: string;
  size: string;
  qty: number;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  landmark?: string;
  deliveryNotes?: string;
}

export interface CardInputSummary {
  cardholderName: string;
  cardLast4: string;
  expiry: string;
}

export interface CheckoutRequest {
  items: BagLineInput[];
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  giftNote?: string;
  cardSummary?: CardInputSummary;
}

export interface OrderItem {
  productId: string;
  name: string;
  finishShort: string;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
}

export interface OrderPricing {
  currency: 'PKR';
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoApplied: string | null;
}

export interface PaymentReceipt {
  provider: 'stripe_live' | 'zevora_card_sandbox' | 'zevora_cod' | 'zevora_bank_transfer';
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  cardLast4?: string;
  bankReference?: string;
  instructions?: string;
  checkoutUrl?: string;
}

export interface OrderEmailDispatchResult {
  merchantNotified: boolean;
  customerNotified: boolean;
  transport: 'smtp' | 'resend' | 'unconfigured';
  errorMessage?: string;
}

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  customer: CustomerDetails;
  giftNote: string;
  payment: PaymentReceipt;
}

export interface CheckoutSuccessResponse {
  ok: true;
  order: OrderRecord;
  emailNotification: OrderEmailDispatchResult;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
}

export type CheckoutApiResponse = CheckoutSuccessResponse | ApiErrorResponse;

export interface OrderLookupSuccessResponse {
  ok: true;
  order: OrderRecord;
}

export type OrderLookupApiResponse = OrderLookupSuccessResponse | ApiErrorResponse;

export interface ConciergeInquiryInput {
  name: string;
  contact: string;
  topic: string;
  message: string;
}

export interface ConciergeInquiryRecord extends ConciergeInquiryInput {
  inquiryId: string;
  createdAt: string;
}

export interface ConciergeSuccessResponse {
  ok: true;
  inquiryId: string;
}

export type ConciergeApiResponse = ConciergeSuccessResponse | ApiErrorResponse;

export interface NewsletterRecord {
  email: string;
  subscribedAt: string;
}

export interface NewsletterSuccessResponse {
  ok: true;
  alreadySubscribed: boolean;
  welcomeCode: string;
}

export type NewsletterApiResponse = NewsletterSuccessResponse | ApiErrorResponse;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'cod' || value === 'card' || value === 'bank_transfer';
}
