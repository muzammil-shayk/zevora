# ZEVORA — Jewellery Beyond Elegance

Official Next.js (App Router + Strict TypeScript) storefront for **ZEVORA** ([zevorastores.com](https://zevorastores.com)).

## Highlights
- **Honest Everyday Luxury**: 316L stainless steel rings (silver-tone, gold-color, and two-tone finishes) with precision-cut simulated AAA cubic zirconia & black faceted crystals.
- **Unified HD Brand Assets**: Extracted transparent HD ZEVORA monogram & wordmark, obsidian silk master crest, medallion icon, and HD luxury packaging imagery.
- **Interactive Shopping Experience**: Category & finish filters, live search, multi-angle Quick-View gallery, 30-Second Interactive Ring Size Finder (`US 5–12` / `Size 16–23`), persistent Bag & Wishlist drawers, welcome promo `ZEVORA10`, and Personal Stylist Concierge.
- **Full-Stack Payment & Order APIs**: Server-authoritative `/api/checkout` with pluggable payment gateway adapters (Stripe / Sandbox Card, Cash on Delivery, Bank/IBAN Transfer), live `/api/orders` tracking, `/api/concierge`, `/api/newsletter`, and signed `/api/webhooks/stripe`.
- **Zero `any` TypeScript**: Strict mode enabled with runtime type guards across all client and server code.

## Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Production Deployment (Vercel + Hostinger)
1. Import this repository in [Vercel](https://vercel.com) (Next.js is detected automatically).
2. Configure environment variables from `.env.example` (set `NEXT_PUBLIC_SITE_URL=https://zevorastores.com`, and optionally connect **Upstash Redis** from Vercel Storage for permanent cloud order persistence).
3. Add `zevorastores.com` under **Vercel → Settings → Domains** and enter Vercel’s `A` (`@`) and `CNAME` (`www`) records in Hostinger’s **DNS / Nameservers** panel while keeping Hostinger nameservers active for `info@zevorastores.com`.

## Contact
- Email: `info@zevorastores.com`
- Domain: [https://zevorastores.com](https://zevorastores.com)
