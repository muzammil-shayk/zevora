import { NextResponse } from 'next/server';
import { saveNewsletterSubscriber } from '@/lib/store';
import { isNonEmptyString, isRecord, type NewsletterApiResponse } from '@/types/commerce';

export async function POST(request: Request): Promise<NextResponse<NewsletterApiResponse>> {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || !isNonEmptyString(body.email)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const { alreadySubscribed } = await saveNewsletterSubscriber(email);
    return NextResponse.json(
      {
        ok: true,
        alreadySubscribed,
        welcomeCode: 'ZEVORA10'
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: 'Unable to save subscription right now.' }, { status: 500 });
  }
}
