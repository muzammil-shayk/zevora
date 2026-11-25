import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendConciergeEmail } from '@/lib/email/orderMailer';
import { saveConciergeInquiry } from '@/lib/store';
import { isNonEmptyString, isRecord, type ConciergeApiResponse } from '@/types/commerce';

export async function POST(request: Request): Promise<NextResponse<ConciergeApiResponse>> {
  try {
    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      !isNonEmptyString(body.name) ||
      !isNonEmptyString(body.contact) ||
      !isNonEmptyString(body.topic) ||
      !isNonEmptyString(body.message)
    ) {
      return NextResponse.json(
        { ok: false, error: 'Please fill out all fields so our stylist can help you.' },
        { status: 400 }
      );
    }

    const inquiryId = `INQ-${crypto.randomInt(1000, 9999)}`;
    const record = await saveConciergeInquiry({
      inquiryId,
      name: body.name.trim(),
      contact: body.contact.trim(),
      topic: body.topic.trim(),
      message: body.message.trim().slice(0, 1000),
      createdAt: new Date().toISOString()
    });

    await sendConciergeEmail(record);

    return NextResponse.json({ ok: true, inquiryId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to send your stylist message right now.' },
      { status: 500 }
    );
  }
}
