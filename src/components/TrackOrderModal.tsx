'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { formatPKR } from '@/lib/format';
import type { OrderLookupApiResponse, OrderRecord } from '@/types/commerce';

interface TrackOrderModalProps {
  isOpen: boolean;
  initialOrderId: string;
  onClose: () => void;
}

const ORDER_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'inspecting', label: 'Quality Check' },
  { key: 'packed', label: 'Velvet Box Packed' },
  { key: 'shipped', label: 'Courier Dispatched' }
] as const;

function getPaymentBadgeLabel(status: OrderRecord['payment']['status']): string {
  if (status === 'paid') return 'Paid · Verified';
  if (status === 'pending_cod') return 'Cash on Delivery (COD)';
  if (status === 'awaiting_transfer') return 'Awaiting Bank Transfer';
  return 'Payment Failed';
}

export function TrackOrderModal({ isOpen, initialOrderId, onClose }: TrackOrderModalProps) {
  const [query, setQuery] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);

  const runLookup = async (ref: string): Promise<void> => {
    const trimmed = ref.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders?ref=${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as OrderLookupApiResponse;
      if (!data.ok) {
        setOrder(null);
        setError(data.error);
      } else {
        setOrder(data.order);
      }
    } catch {
      setOrder(null);
      setError('Unable to reach order tracker right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialOrderId) {
      setQuery(initialOrderId);
      void runLookup(initialOrderId);
    }
  }, [isOpen, initialOrderId]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void runLookup(query);
  };

  const activeStepIdx = order
    ? Math.max(
        0,
        ORDER_STEPS.findIndex((s) => s.key === order.status)
      )
    : 0;

  return (
    <div className="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="trackOrderTitle">
      <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close order tracker">
        ✕
      </button>

      <div className="checkout-modal-body">
        <span className="section-eyebrow">LIVE ORDER STATUS</span>
        <h2 id="trackOrderTitle">Track Your ZEVORA Order</h2>
        <p className="modal-lead">
          Enter your order reference (e.g. <strong>ZEV-2026-4821</strong>) to check your Cash on Delivery dispatch
          progress and items.
        </p>

        <form className="promo-row" onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ZEV-2026-XXXX"
            aria-label="ZEVORA order reference"
            required
          />
          <button type="submit" className="btn btn-gold btn-sm" disabled={loading}>
            {loading ? 'Checking...' : 'Track Order'}
          </button>
        </form>

        {error && <div className="form-error-banner">{error}</div>}

        {order && (
          <div className="receipt-card">
            <div className="receipt-header">
              <div>
                <span className="receipt-label">Order Reference</span>
                <strong>{order.orderId}</strong>
              </div>
              <span className={`payment-status-pill ${order.payment.status}`}>
                {getPaymentBadgeLabel(order.payment.status)}
              </span>
            </div>

            <div className="order-timeline">
              {ORDER_STEPS.map((step, idx) => (
                <div className={`timeline-step ${idx <= activeStepIdx ? 'active' : ''}`} key={step.key}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <span>{step.label}</span>
                </div>
              ))}
            </div>

            <div className="receipt-items">
              {order.items.map((item) => (
                <div className="receipt-item-row" key={`${item.productId}-${item.size}`}>
                  <span>
                    {item.qty}× {item.name} ({item.size})
                  </span>
                  <strong>{formatPKR(item.lineTotal)}</strong>
                </div>
              ))}
            </div>

            <div className="receipt-meta-grid">
              <div>
                <span>Recipient</span>
                <strong>{order.customer.fullName}</strong>
              </div>
              <div>
                <span>City</span>
                <strong>{order.customer.city}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{order.customer.phone}</strong>
              </div>
              <div>
                <span>COD Total</span>
                <strong>{formatPKR(order.pricing.total)}</strong>
              </div>
            </div>

            {order.payment.instructions && (
              <div className="size-tips-box" style={{ marginTop: '0.85rem', marginBottom: 0 }}>
                {order.payment.instructions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
