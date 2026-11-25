import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { updateOrderPaymentStatus } from '@/lib/store';
import { isRecord } from '@/types/commerce';

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = header.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't' && value) timestamp = value;
    if (key === 'v1' && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  return signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request): Promise<NextResponse<{ received: boolean; error?: string }>> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get('stripe-signature') ?? '';
  const rawBody = await request.text();

  if (!secret) {
    return NextResponse.json(
      { received: false, error: 'STRIPE_WEBHOOK_SECRET is not configured in environment.' },
      { status: 503 }
    );
  }

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ received: false, error: 'Invalid Stripe webhook signature.' }, { status: 400 });
  }

  try {
    const event: unknown = JSON.parse(rawBody);
    if (!isRecord(event) || typeof event.type !== 'string' || !isRecord(event.data) || !isRecord(event.data.object)) {
      return NextResponse.json({ received: false, error: 'Malformed webhook event.' }, { status: 400 });
    }

    const obj = event.data.object;
    const orderId =
      typeof obj.client_reference_id === 'string'
        ? obj.client_reference_id
        : isRecord(obj.metadata) && typeof obj.metadata.orderId === 'string'
          ? obj.metadata.orderId
          : null;

    if (orderId && (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded')) {
      await updateOrderPaymentStatus(orderId, 'paid');
    } else if (orderId && event.type === 'payment_intent.payment_failed') {
      await updateOrderPaymentStatus(orderId, 'failed');
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: false, error: 'Failed to parse webhook event.' }, { status: 400 });
  }
}
