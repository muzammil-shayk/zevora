'use client';

import { useState, type FormEvent } from 'react';
import { FREE_SHIPPING_THRESHOLD, PRODUCTS } from '@/data/catalog';
import type {
  BagLineInput,
  CheckoutApiResponse,
  CheckoutRequest,
  OrderRecord,
  PaymentMethod
} from '@/types/commerce';

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
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6;
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
              ✦ <strong>Complimentary Velvet Box &amp; Insured Delivery unlocked!</strong>
            </>
          ) : (
            <>
              Add <strong>${remaining}</strong> more for complimentary insured delivery
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
              Explore our silver-tone &amp; gold-color stainless steel rings—every piece arrives gift-ready in our
              signature box.
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
                    <strong>${p.price * entry.qty}</strong>
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
              <span>${subtotal}</span>
            </div>
            {promoApplied && (
              <div className="total-row discount-row">
                <span>Welcome Gift (ZEVORA10 · 10%)</span>
                <span>-${discount}</span>
              </div>
            )}
            <div className="total-row">
              <span>Velvet Box &amp; Insured Delivery</span>
              <span>{shipping === 0 ? 'Complimentary' : `$${shipping}`}</span>
            </div>
            <div className="total-row grand-total">
              <span>Estimated Total</span>
              <strong>${total}</strong>
            </div>
          </div>

          <button type="button" className="btn btn-gold btn-full" onClick={onProceedCheckout}>
            Proceed to Secure Checkout
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
                    ${p.price} · {p.finishShort}
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

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
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
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Card inputs (only last 4 digits sent in sandbox mode; never persisted raw)
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  const fillTestCard = (): void => {
    setCardholderName(fullName.trim() || 'Shazia Rahman');
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvc('424');
  };

  const handleClose = (): void => {
    setConfirmedOrder(null);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'card') {
      const rawDigits = cardNumber.replace(/\D/g, '');
      if (rawDigits.length < 13) {
        setError('Please enter a valid 16-digit card number (or click "Fill Sandbox Test Card").');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setError('Please enter card expiry in MM/YY format.');
        return;
      }
      if (cvc.replace(/\D/g, '').length < 3) {
        setError('Please enter a valid 3- or 4-digit security code.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: CheckoutRequest = {
        items: bag,
        customer: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim()
        },
        paymentMethod,
        promoCode: promoApplied ? 'ZEVORA10' : undefined,
        giftNote: giftNote || undefined,
        cardSummary:
          paymentMethod === 'card'
            ? {
                cardholderName: cardholderName.trim() || fullName.trim(),
                cardLast4: cardNumber.replace(/\D/g, '').slice(-4),
                expiry
              }
            : undefined
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as CheckoutApiResponse;
      if (!data.ok) {
        setError(data.error);
        return;
      }

      if (data.order.payment.checkoutUrl) {
        window.location.href = data.order.payment.checkoutUrl;
        return;
      }

      setConfirmedOrder(data.order);
      onOrderConfirmed(data.order);
    } catch {
      setError('Network error while connecting to ZEVORA payment gateway. Please try again.');
    } finally {
      setSubmitting(false);
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
            <h2>Order Confirmed</h2>
            <p>
              Reference <strong>{confirmedOrder.orderId}</strong> · Total{' '}
              <strong>${confirmedOrder.pricing.total}</strong>
            </p>
            <div className="receipt-card" style={{ textAlign: 'left', margin: '1rem 0 1.35rem' }}>
              <div className="receipt-header">
                <div>
                  <span className="receipt-label">Transaction ID</span>
                  <strong>{confirmedOrder.payment.transactionId}</strong>
                </div>
                <span className={`payment-status-pill ${confirmedOrder.payment.status}`}>
                  {confirmedOrder.payment.status === 'paid'
                    ? 'Paid · Verified'
                    : confirmedOrder.payment.status === 'pending_cod'
                      ? 'Cash on Delivery'
                      : 'Awaiting Transfer'}
                </span>
              </div>
              {confirmedOrder.payment.instructions && (
                <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', margin: '0.75rem 0 0' }}>
                  {confirmedOrder.payment.instructions}
                </p>
              )}
            </div>
            <div className="concierge-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => {
                  const id = confirmedOrder.orderId;
                  setConfirmedOrder(null);
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
            <span className="section-eyebrow">ZEVORA SECURE CHECKOUT</span>
            <h2 id="checkoutTitle">Delivery &amp; Payment</h2>
            <p className="modal-lead">
              {totalItems} creation{totalItems === 1 ? '' : 's'} · Total <strong>${total}</strong> · Signature Velvet
              Box &amp; 30-Day Free Exchanges included.
            </p>

            {giftNote && (
              <div className="size-tips-box">
                <strong>Handwritten Gift Card:</strong> “{giftNote}”
              </div>
            )}

            {error && <div className="form-error-banner">{error}</div>}

            <form className="styled-form" onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-row-2">
                <label className="field-group">
                  <span>Full Name</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Shazia Rahman"
                  />
                </label>
                <label className="field-group">
                  <span>Email Address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label className="field-group">
                  <span>Phone / WhatsApp</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 0000000"
                  />
                </label>
                <label className="field-group">
                  <span>City</span>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lahore / Dubai / London"
                  />
                </label>
              </div>

              <label className="field-group">
                <span>Delivery Address</span>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, house / apartment"
                />
              </label>

              {/* Payment Gateway Method Selector */}
              <div className="payment-methods-wrap">
                <span className="payment-section-label">Choose Payment Method</span>
                <div className="payment-method-grid" role="radiogroup" aria-label="Payment method">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'card'}
                    className={`payment-method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <strong>Card / Apple Pay</strong>
                    <span>Stripe Gateway (Sandbox Active)</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'cod'}
                    className={`payment-method-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <strong>Cash on Delivery</strong>
                    <span>Pay at your doorstep</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'bank_transfer'}
                    className={`payment-method-card ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank_transfer')}
                  >
                    <strong>Bank / IBAN</strong>
                    <span>Instant transfer reference</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="card-gateway-box">
                  <div className="card-gateway-head">
                    <span>Encrypted Card Details (Sandbox Mode)</span>
                    <button type="button" className="text-link-gold" onClick={fillTestCard}>
                      Fill Sandbox Test Card
                    </button>
                  </div>
                  <label className="field-group">
                    <span>Name on Card</span>
                    <input
                      type="text"
                      required
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="SHAZIA RAHMAN"
                    />
                  </label>
                  <label className="field-group">
                    <span>Card Number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                    />
                  </label>
                  <div className="form-row-2">
                    <label className="field-group">
                      <span>Expiry (MM/YY)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="12/28"
                      />
                    </label>
                    <label className="field-group">
                      <span>Security Code (CVC)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="424"
                      />
                    </label>
                  </div>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="size-tips-box" style={{ marginBottom: 0 }}>
                  <strong>Cash on Delivery:</strong> Pay <strong>${total}</strong> in cash when your ZEVORA velvet box
                  arrives. Zero upfront card needed.
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="size-tips-box" style={{ marginBottom: 0 }}>
                  <strong>Bank Transfer / IBAN:</strong> We’ll generate a unique transfer reference and reserve your
                  selected sizes immediately for 24 hours.
                </div>
              )}

              <button type="submit" className="btn btn-gold btn-full" disabled={submitting}>
                {submitting
                  ? 'Authorizing Payment...'
                  : paymentMethod === 'card'
                    ? `Pay $${total} Securely`
                    : paymentMethod === 'cod'
                      ? `Confirm COD Order — $${total}`
                      : `Reserve & Get Bank Reference — $${total}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
