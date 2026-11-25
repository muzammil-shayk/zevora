import { NextResponse } from 'next/server';
import { findOrderById } from '@/lib/store';
import type { OrderLookupApiResponse } from '@/types/commerce';

export async function GET(request: Request): Promise<NextResponse<OrderLookupApiResponse>> {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref')?.trim() ?? '';

  if (!ref) {
    return NextResponse.json(
      { ok: false, error: 'Please enter your ZEVORA order reference (e.g., ZEV-2026-4821).' },
      { status: 400 }
    );
  }

  const order = await findOrderById(ref);
  if (!order) {
    return NextResponse.json(
      { ok: false, error: `No order found matching "${ref}". Check your confirmation reference and try again.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, order });
}
