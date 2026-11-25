'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/data/catalog';
import { formatPKR } from '@/lib/format';

interface ProductModalProps {
  product: Product | null;
  savedSize: string | null;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToBag: (productId: string, size: string) => void;
  onToggleWishlist: (productId: string) => void;
  onOpenSizeFinder: () => void;
}

export function ProductModal({
  product,
  savedSize,
  isWishlisted,
  onClose,
  onAddToBag,
  onToggleWishlist,
  onOpenSizeFinder
}: ProductModalProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('US 7');

  useEffect(() => {
    if (!product) return;
    setActiveImgIdx(0);
    const defaultSize =
      savedSize && product.sizes.includes(savedSize)
        ? savedSize
        : product.sizes[2] || product.sizes[0];
    setSelectedSize(defaultSize);
  }, [product, savedSize]);

  if (!product) return null;

  return (
    <div
      className="modal product-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalProductTitle"
    >
      <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close product details">
        ✕
      </button>

      <div className="product-modal-grid">
        <div className="modal-gallery">
          <div className="modal-gallery-main">
            <img src={product.images[activeImgIdx]} alt={product.name} />
          </div>
          {product.images.length > 1 && (
            <div className="modal-thumbs">
              {product.images.map((src, idx) => (
                <button
                  key={src}
                  type="button"
                  className={`modal-thumb-btn ${idx === activeImgIdx ? 'active' : ''}`}
                  onClick={() => setActiveImgIdx(idx)}
                >
                  <img src={src} alt={product.imageLabels[idx] || `View ${idx + 1}`} />
                  <span className="modal-thumb-label">{product.imageLabels[idx] || `View ${idx + 1}`}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-product-info">
          <span className="section-eyebrow">
            {product.categoryLabel} · {product.badge}
          </span>
          <h2 id="modalProductTitle">{product.name}</h2>

          <div className="modal-price-row">
            <span className="modal-price">{formatPKR(product.price)}</span>
            <span className="rating-chip">
              <span>★</span> {product.rating.toFixed(1)} · {product.reviews} client reviews
            </span>
          </div>

          <div className="modal-material-spec">
            <strong>Honest Craft Spec:</strong> {product.finishLabel} · {product.stoneSpec} · Cash on Delivery
            Nationwide
          </div>

          <p className="modal-description">{product.description}</p>

          <div className="size-picker-header">
            <span>
              Select Ring Size: <strong>{selectedSize}</strong>
            </span>
            <button type="button" className="text-link-gold" onClick={onOpenSizeFinder}>
              Unsure? 30-Second Size Finder
            </button>
          </div>

          <div className="size-options-row">
            {product.sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`size-opt-btn ${sz === selectedSize ? 'active' : ''}`}
                onClick={() => setSelectedSize(sz)}
              >
                {sz}
              </button>
            ))}
          </div>

          <div className="modal-cta-stack">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => onAddToBag(product.id, selectedSize)}
            >
              Add to ZEVORA Bag — {formatPKR(product.price)}
            </button>
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => onToggleWishlist(product.id)}
              aria-label="Save to favorites"
            >
              {isWishlisted ? '♥ Saved' : '♡ Save'}
            </button>
          </div>

          <ul className="modal-highlights">
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
