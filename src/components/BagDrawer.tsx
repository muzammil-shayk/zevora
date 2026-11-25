'use client';

import { useState, type FormEvent } from 'react';
import {
  FREE_SHIPPING_THRESHOLD,
  PAKISTAN_CITIES,
  PRODUCTS,
  STANDARD_SHIPPING_FEE
} from '@/data/catalog';
import { useCodCheckout } from '@/hooks/useCodCheckout';
import { formatPKR } from '@/lib/format';
import type { BagLineInput, OrderRecord } from '@/types/commerce';

export type BagEntry = BagLineInput;

interface BagDrawerProps {
  isOpen: boolean;
  bag: BagEntry[];
  promoApplied: boolean;
  giftNoteEnabled: boolean;
  giftNote: string;
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onToggleGiftNote: (enabled: boolean) => void;
  onChangeGiftNote: (note: string) => void;
  onApplyPromo: (code: string) => string;
  onProceedCheckout: () => void;
}

export function BagDrawer({
  isOpen,
  bag,
  promoApplied,
  giftNoteEnabled,
  giftNote,
  onClose,
  onUpdateQty,
  onRemove,
  onToggleGiftNote,
  onChangeGiftNote,
  onApplyPromo,
  onProceedCheckout
}: BagDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState('');

  if (!isOpen) return null;

  let subtotal = 0;
  let totalItems = 0;
  for (const entry of bag) {
    const p = PRODUCTS.find((item) => item.id === entry.productId);
    if (p) {
      subtotal += p.price * entry.qty;
      totalItems += entry.qty;
    }
  }

  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const afterDiscount = subtotal - discount;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = afterDiscount + shipping;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="drawer-header">
        <div>
          <h3>Your ZEVORA Bag</h3>
          <span className="drawer-sub">
            {totalItems === 1 ? '1 piece selected' : `${totalItems} pieces selected`}
          </span>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close bag">
          ✕
        </button>
      </div>

      <div className="shipping-progress">
        <div className="shipping-progress-text">
          {remaining === 0 && totalItems > 0 ? (
            <>
              ✦ <strong>FREE Nationwide Delivery &amp; Velvet Box unlocked!</strong>
            </>
          ) : (
            <>
              Add <strong>{formatPKR(remaining)}</strong> more for FREE nationwide delivery across Pakistan
            </>
          )}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="drawer-content">
        {bag.length === 0 ? (
          <div className="drawer-empty">
            <strong>Your ZEVORA bag is waiting.</strong>
            <p>
              Explore our silver-tone &amp; gold-color stainless steel rings—every piece arrives gift-ready with Cash
              on Delivery across Pakistan.
            </p>
            <button type="button" className="btn btn-gold" onClick={onClose}>
              Explore Collection
            </button>
          </div>
        ) : (
          bag.map((entry, idx) => {
            const p = PRODUCTS.find((item) => item.id === entry.productId);
            if (!p) return null;
            return (
              <div className="bag-item" key={`${entry.productId}-${entry.size}`}>
                <img src={p.images[0]} alt={p.name} />
                <div>
                  <div className="bag-item-top">
                    <h4>{p.name}</h4>
                    <button type="button" className="text-link-muted" onClick={() => onRemove(idx)}>
                      Remove
                    </button>
                  </div>
                  <div className="bag-item-meta">
                    {entry.size} · {p.finishShort}
                  </div>
                  <div className="bag-item-bottom">
                    <div className="qty-stepper">
                      <button type="button" onClick={() => onUpdateQty(idx, -1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{entry.qty}</span>
                      <button type="button" onClick={() => onUpdateQty(idx, 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                    <strong>{formatPKR(p.price * entry.qty)}</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {bag.length > 0 && (
        <div className="drawer-footer">
          <div className="gift-note-box">
            <label className="gift-note-toggle">
              <input
                type="checkbox"
                checked={giftNoteEnabled}
                onChange={(e) => onToggleGiftNote(e.target.checked)}
              />
              <span>Add a complimentary handwritten ZEVORA gift card</span>
            </label>
            {giftNoteEnabled && (
              <textarea
                className="gift-note-input"
                rows={2}
                value={giftNote}
                onChange={(e) => onChangeGiftNote(e.target.value)}
                placeholder="Write your personal message (printed in gold script on ivory card)..."
              />
            )}
          </div>

          <div className="promo-row">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Promo code (try ZEVORA10)"
              aria-label="Promo code"
            />
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={() => setPromoFeedback(onApplyPromo(promoCode))}
            >
              Apply
            </button>
          </div>
          {promoFeedback && <p className="promo-feedback">{promoFeedback}</p>}

          <div className="bag-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            {promoApplied && (
              <div className="total-row discount-row">
                <span>Welcome Gift (ZEVORA10 · 10%)</span>
                <span>-{formatPKR(discount)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Velvet Box &amp; Courier Delivery</span>
              <span>{shipping === 0 ? 'Complimentary' : formatPKR(shipping)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Cash on Delivery Total</span>
              <strong>{formatPKR(total)}</strong>
            </div>
          </div>

          <button type="button" className="btn btn-gold btn-full" onClick={onProceedCheckout}>
            Proceed to Cash on Delivery Checkout
          </button>
        </div>
      )}
    </aside>
  );
}

interface WishlistDrawerProps {
  isOpen: boolean;
  wishlist: string[];
  savedSize: string | null;
  onClose: () => void;
  onRemoveWishlist: (id: string) => void;
  onOpenProduct: (id: string) => void;
  onMoveToBag: (id: string, size: string) => void;
}

export function WishlistDrawer({
  isOpen,
  wishlist,
  savedSize,
  onClose,
  onRemoveWishlist,
  onOpenProduct,
  onMoveToBag
}: WishlistDrawerProps) {
  if (!isOpen) return null;

  return (
    <aside className="drawer" role="dialog" aria-modal="true" aria-label="Saved wishlist">
      <div className="drawer-header">
        <div>
          <h3>Saved Favorites</h3>
          <span className="drawer-sub">
            {wishlist.length === 0
              ? 'Curate your personal shortlist'
              : `${wishlist.length} saved creation${wishlist.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close wishlist">
          ✕
        </button>
      </div>

      <div className="drawer-content">
        {wishlist.length === 0 ? (
          <div className="drawer-empty">
            <strong>No favorites saved yet.</strong>
            <p>Tap the heart icon on any ZEVORA ring to compare your shortlist anytime.</p>
            <button type="button" className="btn btn-dark" onClick={onClose}>
              Browse Jewellery
            </button>
          </div>
        ) : (
          wishlist.map((id) => {
            const p = PRODUCTS.find((item) => item.id === id);
            if (!p) return null;
            const defaultSize = savedSize && p.sizes.includes(savedSize) ? savedSize : p.sizes[2] || p.sizes[0];
            return (
              <div className="bag-item" key={p.id}>
                <img src={p.images[0]} alt={p.name} />
                <div>
                  <div className="bag-item-top">
                    <h4>{p.name}</h4>
                    <button type="button" className="text-link-muted" onClick={() => onRemoveWishlist(p.id)}>
                      Remove
                    </button>
                  </div>
                  <div className="bag-item-meta">
                    {formatPKR(p.price)} · {p.finishShort}
                  </div>
                  <div className="bag-item-bottom">
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      onClick={() => onOpenProduct(p.id)}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      className="btn btn-gold btn-sm"
                      onClick={() => onMoveToBag(p.id, defaultSize)}
                    >
                      Move to Bag
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

interface CheckoutModalProps {
  isOpen: boolean;
  bag: BagEntry[];
  promoApplied: boolean;
  totalItems: number;
  total: number;
  giftNote: string;
  onClose: () => void;
  onOrderConfirmed: (order: OrderRecord) => void;
  onTrackOrder: (orderId: string) => void;
}

export function CheckoutModal({
  isOpen,
  bag,
  promoApplied,
  totalItems,
  total,
  giftNote,
  onClose,
  onOrderConfirmed,
  onTrackOrder
}: CheckoutModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState<string>(PAKISTAN_CITIES[0]);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const { submitting, error, confirmedOrder, emailNotification, submitCodOrder, resetCheckout } =
    useCodCheckout();

  if (!isOpen) return null;

  const handleClose = (): void => {
    resetCheckout();
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const order = await submitCodOrder({
      items: bag,
      customer: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city,
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined
      },
      promoCode: promoApplied ? 'ZEVORA10' : undefined,
      giftNote: giftNote || undefined
    });

    if (order) {
      onOrderConfirmed(order);
    }
  };

  return (
    <div className="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
      <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="Close checkout">
        ✕
      </button>

      <div className="checkout-modal-body">
        {confirmedOrder ? (
          <div className="form-success-box">
            <span className="success-star" aria-hidden="true">
              ✦
            </span>
            <h2>Order Placed Successfully</h2>
            <p>
              Order Reference <strong>{confirmedOrder.orderId}</strong> · Payable on Delivery:{' '}
              <strong>{formatPKR(confirmedOrder.pricing.total)}</strong>
            </p>
            <div className="receipt-card" style={{ textAlign: 'left', margin: '1rem 0 1.35rem' }}>
              <div className="receipt-header">
                <div>
                  <span className="receipt-label">Delivery To</span>
                  <strong>
                    {confirmedOrder.customer.fullName} · {confirmedOrder.customer.city}
                  </strong>
                </div>
                <span className="payment-status-pill pending_cod">Cash on Delivery</span>
              </div>
              {confirmedOrder.payment.instructions && (
                <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', margin: '0.75rem 0 0' }}>
                  {confirmedOrder.payment.instructions}
                </p>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', margin: '0.6rem 0 0' }}>
                {emailNotification?.merchantNotified
                  ? '✦ Dispatch details sent to ZEVORA Atelier & confirmation emailed to you.'
                  : '✦ Order recorded in ZEVORA dispatch queue. Keep your order reference handy to track status.'}
              </p>
            </div>
            <div className="concierge-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => {
                  const id = confirmedOrder.orderId;
                  resetCheckout();
                  onTrackOrder(id);
                }}
              >
                Track Live Order Status
              </button>
              <button type="button" className="btn btn-outline-dark" onClick={handleClose}>
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="section-eyebrow">ZEVORA PAKISTAN · CASH ON DELIVERY</span>
            <h2 id="checkoutTitle">Delivery Details</h2>
            <p className="modal-lead">
              {totalItems} creation{totalItems === 1 ? '' : 's'} · Total{' '}
              <strong>{formatPKR(total)}</strong> · Pay cash at your doorstep · Signature Velvet Box included.
            </p>

            {giftNote && (
              <div className="size-tips-box">
                <strong>Handwritten Gift Card:</strong> “{giftNote}”
              </div>
            )}

            {error && <div className="form-error-banner">{error}</div>}

            <form className="styled-form" onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-row-2">
                <label className="field-group" htmlFor="checkout-full-name">
                  <span>Full Name</span>
                  <input
                    id="checkout-full-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                  />
                </label>
                <label className="field-group" htmlFor="checkout-phone">
                  <span>Mobile / WhatsApp Number</span>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX XXXXXXX"
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label className="field-group" htmlFor="checkout-email">
                  <span>Email (For Order Receipt)</span>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </label>
                <label className="field-group" htmlFor="checkout-city">
                  <span>City (Pakistan)</span>
                  <select
                    id="checkout-city"
                    name="city"
                    autoComplete="address-level2"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field-group" htmlFor="checkout-address">
                <span>Complete Street / House / Sector Address</span>
                <input
                  id="checkout-address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House no., street, area"
                />
              </label>

              <div className="form-row-2">
                <label className="field-group" htmlFor="checkout-landmark">
                  <span>Nearest Landmark (Optional)</span>
                  <input
                    id="checkout-landmark"
                    name="landmark"
                    type="text"
                    autoComplete="off"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near a well-known place"
                  />
                </label>
                <label className="field-group" htmlFor="checkout-delivery-notes">
                  <span>Courier Note (Optional)</span>
                  <input
                    id="checkout-delivery-notes"
                    name="deliveryNotes"
                    type="text"
                    autoComplete="off"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Any note for the rider"
                  />
                </label>
              </div>

              <div className="cod-active-card">
                <div>
                  <span className="receipt-label">Active Payment Method</span>
                  <strong>Cash on Delivery (COD) — Pay {formatPKR(total)} at Doorstep</strong>
                  <span className="cod-sub">
                    Zero advance payment required · Nationwide 2–4 working day delivery · Online Card &amp; JazzCash
                    coming soon
                  </span>
                </div>
                <span className="payment-status-pill paid">Selected</span>
              </div>

              <button type="submit" className="btn btn-gold btn-full" disabled={submitting}>
                {submitting ? 'Placing Your COD Order...' : `Confirm Cash on Delivery Order — ${formatPKR(total)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
