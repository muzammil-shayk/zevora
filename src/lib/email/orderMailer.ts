import nodemailer from 'nodemailer';
import { buildWhatsAppLink, formatPKR } from '@/lib/format';
import type {
  ConciergeInquiryRecord,
  OrderEmailDispatchResult,
  OrderRecord
} from '@/types/commerce';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPktTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Karachi'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function sendViaSmtp(mail: OutgoingEmail): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim() || 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM?.trim() || user || 'info@zevorastores.com';

  if (!user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `ZEVORA Store <${fromEmail}>`,
    to: mail.to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    html: mail.html,
    text: mail.text
  });
  return true;
}

async function sendViaResend(mail: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const fromEmail = process.env.SMTP_FROM?.trim() || 'ZEVORA Store <info@zevorastores.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [mail.to],
      reply_to: mail.replyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text
    })
  });

  if (!res.ok) {
    throw new Error(`Resend HTTP ${res.status}`);
  }
  return true;
}

function resolveTransport(): 'smtp' | 'resend' | 'unconfigured' {
  if (process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()) {
    return 'smtp';
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return 'resend';
  }
  return 'unconfigured';
}

async function deliverEmail(mail: OutgoingEmail, transport: 'smtp' | 'resend'): Promise<boolean> {
  if (transport === 'smtp') {
    return sendViaSmtp(mail);
  }
  return sendViaResend(mail);
}

function buildMerchantOrderEmail(order: OrderRecord): OutgoingEmail {
  const merchantEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || 'info@zevorastores.com';
  const pktTime = formatPktTimestamp(order.createdAt);
  const waConfirmMsg = `Assalam-o-Alaikum ${order.customer.fullName}! Thank you for ordering from ZEVORA (${order.orderId}). Please confirm your Cash on Delivery order of ${formatPKR(order.pricing.total)} to ${order.customer.address}, ${order.customer.city} so we can dispatch your velvet box today.`;
  const waHref = buildWhatsAppLink(order.customer.phone, waConfirmMsg);

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #ece3d5;">
          <strong>${escapeHtml(item.name)}</strong><br/>
          <span style="font-size:12px;color:#6c6157;">${escapeHtml(item.finishShort)} · Size: <strong>${escapeHtml(item.size)}</strong></span>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #ece3d5;text-align:center;">${item.qty}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #ece3d5;text-align:right;">${formatPKR(item.unitPrice)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #ece3d5;text-align:right;"><strong>${formatPKR(item.lineTotal)}</strong></td>
      </tr>`
    )
    .join('');

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.qty}x ${item.name} (${item.size} | ${item.finishShort}) @ ${formatPKR(item.unitPrice)} = ${formatPKR(item.lineTotal)}`
    )
    .join('\n');

  const html = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fbf8f3;color:#171412;border:1px solid #e4d5be;border-radius:14px;overflow:hidden;">
    <div style="background:#0b0a09;color:#f8f3eb;padding:24px 28px;border-bottom:2px solid #c8a153;">
      <div style="font-size:11px;letter-spacing:0.22em;color:#e8cd93;text-transform:uppercase;">ZEVORA · NEW SHIPPING ORDER</div>
      <h1 style="margin:6px 0 4px;font-size:24px;font-weight:500;">Order ${escapeHtml(order.orderId)}</h1>
      <div style="font-size:13px;color:#bfb4a6;">Placed ${escapeHtml(pktTime)} (PKT) · <strong>Cash on Delivery (Collect ${formatPKR(order.pricing.total)})</strong></div>
    </div>

    <div style="padding:24px 28px;">
      <div style="background:#ffffff;border:1px solid #e6d7c3;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9c7630;font-weight:700;margin-bottom:8px;">Courier Shipping Label</div>
        <p style="margin:0 0 6px;font-size:15px;"><strong>${escapeHtml(order.customer.fullName)}</strong></p>
        <p style="margin:0 0 6px;font-size:14px;">Phone / WhatsApp: <a href="tel:${escapeHtml(order.customer.phone)}" style="color:#171412;font-weight:600;">${escapeHtml(order.customer.phone)}</a></p>
        <p style="margin:0 0 6px;font-size:14px;">Email: ${escapeHtml(order.customer.email)}</p>
        <p style="margin:0 0 6px;font-size:14px;">City: <strong>${escapeHtml(order.customer.city)}</strong></p>
        <p style="margin:0 0 6px;font-size:14px;">Address: ${escapeHtml(order.customer.address)}</p>
        ${order.customer.landmark ? `<p style="margin:0 0 6px;font-size:14px;">Nearest Landmark: ${escapeHtml(order.customer.landmark)}</p>` : ''}
        ${order.customer.deliveryNotes ? `<p style="margin:0 0 6px;font-size:13px;color:#6c6157;">Rider Notes: ${escapeHtml(order.customer.deliveryNotes)}</p>` : ''}
        <div style="margin-top:12px;">
          <a href="${escapeHtml(waHref)}" style="display:inline-block;padding:10px 16px;background:#0b0a09;color:#e8cd93;text-decoration:none;border-radius:999px;font-size:13px;font-weight:600;">Confirm Order via WhatsApp →</a>
        </div>
      </div>

      ${
        order.giftNote
          ? `<div style="background:#f4ece1;border-left:4px solid #c8a153;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:14px;">
              <strong>Handwritten Gift Card Requested:</strong><br/>“${escapeHtml(order.giftNote)}”
            </div>`
          : ''
      }

      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9c7630;font-weight:700;margin-bottom:8px;">Packing List</div>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e6d7c3;border-radius:10px;overflow:hidden;font-size:14px;">
        <thead>
          <tr style="background:#f4ece1;color:#3a332d;font-size:12px;text-transform:uppercase;">
            <th style="padding:10px 8px;text-align:left;">Item &amp; Ring Size</th>
            <th style="padding:10px 8px;text-align:center;">Qty</th>
            <th style="padding:10px 8px;text-align:right;">Price</th>
            <th style="padding:10px 8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="margin-top:16px;padding:14px 18px;background:#0b0a09;color:#f8f3eb;border-radius:10px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Subtotal:</span><span>${formatPKR(order.pricing.subtotal)}</span></div>
        ${order.pricing.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#8ee3b3;"><span>Promo (${escapeHtml(order.pricing.promoApplied || 'ZEVORA10')}):</span><span>-${formatPKR(order.pricing.discount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Courier Delivery:</span><span>${order.pricing.shipping === 0 ? 'FREE' : formatPKR(order.pricing.shipping)}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(200,161,83,0.35);font-size:17px;color:#e8cd93;">
          <strong>COD Amount to Collect:</strong>
          <strong>${formatPKR(order.pricing.total)}</strong>
        </div>
      </div>
    </div>
  </div>`;

  const text = [
    `NEW ZEVORA COD ORDER: ${order.orderId}`,
    `Placed: ${pktTime} (PKT)`,
    `Payment: Cash on Delivery — Collect ${formatPKR(order.pricing.total)}`,
    ``,
    `SHIPPING LABEL:`,
    `Name: ${order.customer.fullName}`,
    `Phone / WhatsApp: ${order.customer.phone}`,
    `Email: ${order.customer.email}`,
    `City: ${order.customer.city}`,
    `Address: ${order.customer.address}`,
    order.customer.landmark ? `Landmark: ${order.customer.landmark}` : '',
    order.customer.deliveryNotes ? `Notes: ${order.customer.deliveryNotes}` : '',
    `WhatsApp Confirm Link: ${waHref}`,
    order.giftNote ? `\nGIFT CARD NOTE: "${order.giftNote}"` : '',
    ``,
    `PACKING LIST:`,
    itemsText,
    ``,
    `Subtotal: ${formatPKR(order.pricing.subtotal)}`,
    order.pricing.discount > 0 ? `Discount (${order.pricing.promoApplied || 'ZEVORA10'}): -${formatPKR(order.pricing.discount)}` : '',
    `Delivery: ${order.pricing.shipping === 0 ? 'FREE' : formatPKR(order.pricing.shipping)}`,
    `TOTAL COD TO COLLECT: ${formatPKR(order.pricing.total)}`
  ]
    .filter(Boolean)
    .join('\n');

  return {
    to: merchantEmail,
    replyTo: order.customer.email,
    subject: `[NEW ZEVORA COD] ${order.orderId} · ${formatPKR(order.pricing.total)} · ${order.customer.city}`,
    html,
    text
  };
}

function buildCustomerReceiptEmail(order: OrderRecord): OutgoingEmail {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zevorastores.com';
  const itemsText = order.items
    .map((item) => `- ${item.qty}x ${item.name} (${item.size}) — ${formatPKR(item.lineTotal)}`)
    .join('\n');

  const itemsHtml = order.items
    .map(
      (item) =>
        `<li style="margin-bottom:6px;"><strong>${item.qty}× ${escapeHtml(item.name)}</strong> (${escapeHtml(item.size)}) — ${formatPKR(item.lineTotal)}</li>`
    )
    .join('');

  const html = `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fbf8f3;color:#171412;border:1px solid #e4d5be;border-radius:14px;overflow:hidden;">
    <div style="background:#0b0a09;color:#f8f3eb;padding:24px 28px;text-align:center;border-bottom:2px solid #c8a153;">
      <div style="font-size:22px;letter-spacing:0.24em;color:#e8cd93;font-family:Georgia,serif;">ZEVORA</div>
      <div style="font-size:10px;letter-spacing:0.22em;color:#bfb4a6;margin-top:4px;">JEWELLERY BEYOND ELEGANCE</div>
    </div>
    <div style="padding:26px 28px;">
      <h2 style="margin:0 0 10px;font-family:Georgia,serif;font-weight:500;">Thank you, ${escapeHtml(order.customer.fullName)}!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#3a332d;">
        Your Cash on Delivery order <strong>${escapeHtml(order.orderId)}</strong> is confirmed. Your stainless steel creations are being packed in our signature velvet box for dispatch to <strong>${escapeHtml(order.customer.city)}</strong>.
      </p>
      <div style="background:#ffffff;border:1px solid #e6d7c3;border-radius:10px;padding:16px;margin-bottom:16px;">
        <ul style="margin:0;padding-left:18px;font-size:14px;">${itemsHtml}</ul>
        <p style="margin:12px 0 0;padding-top:10px;border-top:1px solid #ece3d5;font-size:15px;">
          <strong>Cash Payable on Delivery: ${formatPKR(order.pricing.total)}</strong>
        </p>
      </div>
      <p style="margin:0;font-size:13px;color:#6c6157;">
        Delivery Address: ${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.city)}<br/>
        Track your order anytime at <a href="${escapeHtml(siteUrl)}" style="color:#9c7630;">${escapeHtml(siteUrl)}</a> using reference <strong>${escapeHtml(order.orderId)}</strong>.<br/>
        Questions? Reply directly to this email or write to info@zevorastores.com.
      </p>
    </div>
  </div>`;

  const text = [
    `ZEVORA — Jewellery Beyond Elegance`,
    `Thank you, ${order.customer.fullName}!`,
    `Your Cash on Delivery order ${order.orderId} is confirmed.`,
    ``,
    itemsText,
    ``,
    `Cash Payable on Delivery: ${formatPKR(order.pricing.total)}`,
    `Delivery Address: ${order.customer.address}, ${order.customer.city}`,
    `Track anytime at ${siteUrl} using ${order.orderId}.`,
    `Support: info@zevorastores.com`
  ].join('\n');

  return {
    to: order.customer.email,
    replyTo: process.env.ORDER_NOTIFICATION_EMAIL?.trim() || 'info@zevorastores.com',
    subject: `ZEVORA Order Confirmed — ${order.orderId} (${formatPKR(order.pricing.total)} COD)`,
    html,
    text
  };
}

export async function sendOrderEmails(order: OrderRecord): Promise<OrderEmailDispatchResult> {
  const transport = resolveTransport();
  if (transport === 'unconfigured') {
    return {
      merchantNotified: false,
      customerNotified: false,
      transport: 'unconfigured',
      errorMessage: 'Add SMTP_USER and SMTP_PASS in Vercel Environment Variables to activate live email delivery.'
    };
  }

  let merchantNotified = false;
  let customerNotified = false;
  let errorMessage: string | undefined;

  try {
    merchantNotified = await deliverEmail(buildMerchantOrderEmail(order), transport);
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : 'Merchant email failed.';
  }

  try {
    customerNotified = await deliverEmail(buildCustomerReceiptEmail(order), transport);
  } catch (err: unknown) {
    if (!errorMessage) {
      errorMessage = err instanceof Error ? err.message : 'Customer receipt email failed.';
    }
  }

  return {
    merchantNotified,
    customerNotified,
    transport,
    errorMessage
  };
}

export async function sendConciergeEmail(record: ConciergeInquiryRecord): Promise<boolean> {
  const transport = resolveTransport();
  if (transport === 'unconfigured') return false;

  const merchantEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || 'info@zevorastores.com';
  try {
    return await deliverEmail(
      {
        to: merchantEmail,
        subject: `[ZEVORA STYLIST INQUIRY] ${record.inquiryId} · ${record.topic}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;padding:20px;background:#fbf8f3;border:1px solid #e6d7c3;border-radius:12px;">
          <h2 style="margin:0 0 10px;">New Stylist Inquiry (${escapeHtml(record.inquiryId)})</h2>
          <p><strong>Name:</strong> ${escapeHtml(record.name)}</p>
          <p><strong>Contact:</strong> ${escapeHtml(record.contact)}</p>
          <p><strong>Topic:</strong> ${escapeHtml(record.topic)}</p>
          <p><strong>Message:</strong><br/>${escapeHtml(record.message)}</p>
        </div>`,
        text: `New Stylist Inquiry (${record.inquiryId})\nName: ${record.name}\nContact: ${record.contact}\nTopic: ${record.topic}\nMessage: ${record.message}`
      },
      transport
    );
  } catch {
    return false;
  }
}
