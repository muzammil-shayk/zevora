import crypto from 'node:crypto';
import { formatPKR } from '@/lib/format';
import type {
  CardInputSummary,
  CustomerDetails,
  OrderItem,
  OrderPricing,
  PaymentMethod,
  PaymentReceipt
} from '@/types/commerce';
import { isRecord } from '@/types/commerce';

export interface GatewayExecutionContext {
  orderId: string;
  items: OrderItem[];
  pricing: OrderPricing;
  customer: CustomerDetails;
  cardSummary?: CardInputSummary;
}

export interface PaymentGatewayAdapter {
  readonly method: PaymentMethod;
  authorize(context: GatewayExecutionContext): Promise<PaymentReceipt>;
}

function generateReference(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

class CodGatewayAdapter implements PaymentGatewayAdapter {
  readonly method: PaymentMethod = 'cod';

  async authorize(context: GatewayExecutionContext): Promise<PaymentReceipt> {
    return {
      provider: 'zevora_cod',
      method: 'cod',
      status: 'pending_cod',
      transactionId: generateReference('cod_zevora'),
      instructions: `Pay ${formatPKR(context.pricing.total)} in cash at your doorstep in ${context.customer.city}. Our courier rider will call ${context.customer.phone} before delivery.`
    };
  }
}

class StripeLiveGatewayAdapter implements PaymentGatewayAdapter {
  readonly method: PaymentMethod = 'card';

  constructor(private readonly secretKey: string) {}

  async authorize(context: GatewayExecutionContext): Promise<PaymentReceipt> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zevorastores.com';
    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('customer_email', context.customer.email);
    body.set('client_reference_id', context.orderId);
    body.set('success_url', `${siteUrl}/?order=${encodeURIComponent(context.orderId)}&paid=1`);
    body.set('cancel_url', `${siteUrl}/?order=${encodeURIComponent(context.orderId)}&cancelled=1`);
    body.set('metadata[orderId]', context.orderId);

    context.items.forEach((item, idx) => {
      body.set(`line_items[${idx}][price_data][currency]`, 'pkr');
      body.set(`line_items[${idx}][price_data][product_data][name]`, `${item.name} (${item.size})`);
      body.set(`line_items[${idx}][price_data][unit_amount]`, String(Math.round(item.unitPrice * 100)));
      body.set(`line_items[${idx}][quantity]`, String(item.qty));
    });

    if (context.pricing.shipping > 0) {
      const idx = context.items.length;
      body.set(`line_items[${idx}][price_data][currency]`, 'pkr');
      body.set(`line_items[${idx}][price_data][product_data][name]`, 'Nationwide Insured Delivery');
      body.set(`line_items[${idx}][price_data][unit_amount]`, String(Math.round(context.pricing.shipping * 100)));
      body.set(`line_items[${idx}][quantity]`, '1');
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const json: unknown = await res.json();
    if (!res.ok || !isRecord(json) || typeof json.id !== 'string') {
      throw new Error('Stripe session creation failed. Verify STRIPE_SECRET_KEY.');
    }

    const checkoutUrl = typeof json.url === 'string' ? json.url : undefined;
    return {
      provider: 'stripe_live',
      method: 'card',
      status: 'awaiting_transfer',
      transactionId: json.id,
      checkoutUrl,
      instructions: 'Redirecting to secure card checkout.'
    };
  }
}

class SandboxCardGatewayAdapter implements PaymentGatewayAdapter {
  readonly method: PaymentMethod = 'card';

  async authorize(context: GatewayExecutionContext): Promise<PaymentReceipt> {
    const last4 = context.cardSummary?.cardLast4 ?? '4242';
    return {
      provider: 'zevora_card_sandbox',
      method: 'card',
      status: 'paid',
      transactionId: generateReference('pi_zevora_test'),
      cardLast4: last4,
      instructions: `Approved in ZEVORA Payment Sandbox (Card ending in ${last4}).`
    };
  }
}

class BankTransferGatewayAdapter implements PaymentGatewayAdapter {
  readonly method: PaymentMethod = 'bank_transfer';

  async authorize(context: GatewayExecutionContext): Promise<PaymentReceipt> {
    const bankName = process.env.ZEVORA_BANK_NAME || 'ZEVORA Bank';
    const title = process.env.ZEVORA_BANK_ACCOUNT_TITLE || 'ZEVORA Jewellery';
    const iban = process.env.ZEVORA_BANK_IBAN || 'PK00ZEVR0000001234567890';
    const ref = `TRF-${context.orderId}`;

    return {
      provider: 'zevora_bank_transfer',
      method: 'bank_transfer',
      status: 'awaiting_transfer',
      transactionId: generateReference('bnk_zevora'),
      bankReference: ref,
      instructions: `Transfer ${formatPKR(context.pricing.total)} to ${title} (${bankName} · IBAN: ${iban}) with reference ${ref}.`
    };
  }
}

export function getPaymentGateway(method: PaymentMethod): PaymentGatewayAdapter {
  if (method === 'cod') {
    return new CodGatewayAdapter();
  }
  if (method === 'bank_transfer') {
    return new BankTransferGatewayAdapter();
  }

  const mode = process.env.PAYMENT_GATEWAY_MODE ?? 'sandbox';
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (mode === 'stripe' && stripeKey) {
    return new StripeLiveGatewayAdapter(stripeKey);
  }
  return new SandboxCardGatewayAdapter();
}
