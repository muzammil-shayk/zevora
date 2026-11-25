import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { FREE_SHIPPING_THRESHOLD, PRODUCTS } from '@/data/catalog';
import { getPaymentGateway } from '@/lib/payments/gateway';
import { saveOrder } from '@/lib/store';
import {
  isNonEmptyString,
  isPaymentMethod,
  isRecord,
  type BagLineInput,
  type CardInputSummary,
  type CheckoutApiResponse,
  type CustomerDetails,
  type OrderItem,
  type OrderPricing,
  type OrderRecord
} from '@/types/commerce';

function parseBagLines(raw: unknown): BagLineInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const lines: BagLineInput[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return null;
    if (!isNonEmptyString(entry.productId) || !isNonEmptyString(entry.size)) return null;
    if (typeof entry.qty !== 'number' || !Number.isInteger(entry.qty) || entry.qty < 1 || entry.qty > 20) {
      return null;
    }
    lines.push({
      productId: entry.productId.trim(),
      size: entry.size.trim(),
      qty: entry.qty
    });
  }
  return lines;
}

function parseCustomer(raw: unknown): CustomerDetails | null {
  if (!isRecord(raw)) return null;
  if (
    !isNonEmptyString(raw.fullName) ||
    !isNonEmptyString(raw.email) ||
    !isNonEmptyString(raw.phone) ||
    !isNonEmptyString(raw.address) ||
    !isNonEmptyString(raw.city)
  ) {
    return null;
  }
  const email = raw.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return {
    fullName: raw.fullName.trim(),
    email,
    phone: raw.phone.trim(),
    address: raw.address.trim(),
    city: raw.city.trim()
  };
}

function parseCardSummary(raw: unknown): CardInputSummary | undefined {
  if (!isRecord(raw)) return undefined;
  if (
    !isNonEmptyString(raw.cardholderName) ||
    !isNonEmptyString(raw.cardLast4) ||
    !isNonEmptyString(raw.expiry)
  ) {
    return undefined;
  }
  const digits = raw.cardLast4.replace(/\D/g, '').slice(-4);
  if (digits.length !== 4) return undefined;
  return {
    cardholderName: raw.cardholderName.trim(),
    cardLast4: digits,
    expiry: raw.expiry.trim()
  };
}

export async function POST(request: Request): Promise<NextResponse<CheckoutApiResponse>> {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid checkout payload.' }, { status: 400 });
    }

    const lines = parseBagLines(body.items);
    if (!lines) {
      return NextResponse.json({ ok: false, error: 'Your shopping bag is empty or invalid.' }, { status: 400 });
    }

    const customer = parseCustomer(body.customer);
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Please provide valid name, email, phone, address, and city.' },
        { status: 400 }
      );
    }

    if (!isPaymentMethod(body.paymentMethod)) {
      return NextResponse.json({ ok: false, error: 'Please select a valid payment method.' }, { status: 400 });
    }

    const cardSummary = parseCardSummary(body.cardSummary);
    if (body.paymentMethod === 'card' && !cardSummary && (process.env.PAYMENT_GATEWAY_MODE ?? 'sandbox') === 'sandbox') {
      return NextResponse.json(
        { ok: false, error: 'Please complete the cardholder name, card number, and expiry date.' },
        { status: 400 }
      );
    }

    // Authoritative server-side pricing from canonical catalog
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const line of lines) {
      const product = PRODUCTS.find((p) => p.id === line.productId);
      if (!product) {
        return NextResponse.json(
          { ok: false, error: `Unknown product in bag: ${line.productId}` },
          { status: 400 }
        );
      }
      if (!product.sizes.includes(line.size)) {
        return NextResponse.json(
          { ok: false, error: `Size ${line.size} is not available for ${product.name}.` },
          { status: 400 }
        );
      }
      const lineTotal = product.price * line.qty;
      subtotal += lineTotal;
      orderItems.push({
        productId: product.id,
        name: product.name,
        finishShort: product.finishShort,
        size: line.size,
        qty: line.qty,
        unitPrice: product.price,
        lineTotal,
        image: product.images[0]
      });
    }

    const rawPromo = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : '';
    const promoApplied = rawPromo === 'ZEVORA10' ? 'ZEVORA10' : null;
    const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6;
    const total = subtotal - discount + shipping;

    const pricing: OrderPricing = {
      subtotal,
      discount,
      shipping,
      total,
      promoApplied
    };

    const orderId = `ZEV-2026-${crypto.randomInt(1000, 9999)}`;
    const giftNote = typeof body.giftNote === 'string' ? body.giftNote.trim().slice(0, 240) : '';

    const gateway = getPaymentGateway(body.paymentMethod);
    const payment = await gateway.authorize({
      orderId,
      items: orderItems,
      pricing,
      customer,
      cardSummary
    });

    const order: OrderRecord = {
      orderId,
      createdAt: new Date().toISOString(),
      status: payment.status === 'paid' ? 'inspecting' : 'confirmed',
      items: orderItems,
      pricing,
      customer,
      giftNote,
      payment
    };

    await saveOrder(order);
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to process checkout right now.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
