# ZEVORA — Jewellery Beyond Elegance (Pakistan · PKR)

Official Next.js (App Router + Strict TypeScript) storefront for **ZEVORA** ([zevorastores.com](https://zevorastores.com)), optimized for the **Pakistan (PKR)** market with **Cash on Delivery (COD)** and automated **Email Shipping Dispatch** to `info@zevorastores.com`.

## Features
- **Pakistan (PKR) Pricing & Delivery**: Honest 316L stainless steel & simulated AAA crystal jewellery (`Rs. 1,650 – Rs. 2,750`, Collector's 3-Ring Vault `Rs. 5,450`), nationwide courier fee `Rs. 250`, FREE delivery over `Rs. 3,500`, welcome promo `ZEVORA10` (10% off).
- **Cash on Delivery (COD) Checkout Hook (`useCodCheckout`)**: Streamlined COD checkout with Pakistan city dropdown, mobile/WhatsApp validation, nearest landmark, rider notes, and optional handwritten gift card.
- **Automated Shipping Email Dispatch (`orderMailer.ts`)**: Every new COD order automatically emails a complete packing slip + courier shipping label + 1-tap WhatsApp confirmation link directly to `info@zevorastores.com` (using Hostinger SMTP or Resend) AND sends a branded confirmation receipt to the customer.
- **Live Order Tracking**: Customers can track their `ZEV-2026-XXXX` order live anytime via `/api/orders`.
- **Zero `any` TypeScript**: Strict mode enabled with runtime type guards across all client and server modules.

## Vercel Environment Variables (To Receive Live Order Emails)
Add these in **Vercel → Project Settings → Environment Variables**:
```env
NEXT_PUBLIC_SITE_URL=https://zevorastores.com
ORDER_NOTIFICATION_EMAIL=info@zevorastores.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@zevorastores.com
SMTP_PASS=<your_hostinger_mailbox_password>
SMTP_FROM=info@zevorastores.com
```
*(Optional: Connect **Upstash Redis** in Vercel → Storage for permanent cloud order storage across serverless requests.)*
