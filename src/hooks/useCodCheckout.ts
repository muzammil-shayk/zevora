'use client';

import { useState, useCallback } from 'react';
import type {
  BagLineInput,
  CheckoutApiResponse,
  CheckoutRequest,
  CustomerDetails,
  OrderEmailDispatchResult,
  OrderRecord
} from '@/types/commerce';

export interface SubmitCodOrderParams {
  items: BagLineInput[];
  customer: CustomerDetails;
  promoCode?: string;
  giftNote?: string;
}

export interface UseCodCheckoutResult {
  submitting: boolean;
  error: string;
  confirmedOrder: OrderRecord | null;
  emailNotification: OrderEmailDispatchResult | null;
  submitCodOrder: (params: SubmitCodOrderParams) => Promise<OrderRecord | null>;
  resetCheckout: () => void;
}

export function useCodCheckout(): UseCodCheckoutResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [emailNotification, setEmailNotification] = useState<OrderEmailDispatchResult | null>(null);

  const resetCheckout = useCallback(() => {
    setError('');
    setConfirmedOrder(null);
    setEmailNotification(null);
  }, []);

  const submitCodOrder = useCallback(async (params: SubmitCodOrderParams): Promise<OrderRecord | null> => {
    setError('');
    setSubmitting(true);

    try {
      const payload: CheckoutRequest = {
        items: params.items,
        customer: params.customer,
        paymentMethod: 'cod',
        promoCode: params.promoCode,
        giftNote: params.giftNote
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as CheckoutApiResponse;
      if (!data.ok) {
        setError(data.error);
        return null;
      }

      setConfirmedOrder(data.order);
      setEmailNotification(data.emailNotification);
      return data.order;
    } catch {
      setError('Network error while placing your Cash on Delivery order. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    error,
    confirmedOrder,
    emailNotification,
    submitCodOrder,
    resetCheckout
  };
}
