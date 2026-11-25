'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  FAQS,
  FREE_SHIPPING_THRESHOLD,
  LOOKBOOK_TABS,
  PRODUCTS,
  RING_SIZES,
  type FinishTone,
  type ProductCategory,
  type RingSizeRow
} from '@/data/catalog';
import type {
  ConciergeApiResponse,
  NewsletterApiResponse,
  OrderRecord
} from '@/types/commerce';
import { BrandMark } from './BrandMark';
import { ProductModal } from './ProductModal';
import { SizeFinderModal } from './SizeFinderModal';
import { BagDrawer, CheckoutModal, WishlistDrawer, type BagEntry } from './BagDrawer';
import { TrackOrderModal } from './TrackOrderModal';

const STORAGE_KEYS = {
  bag: 'zevora_next_bag_v1',
  wishlist: 'zevora_next_wishlist_v1',
  savedSize: 'zevora_next_size_v1',
  lastOrderId: 'zevora_next_last_order_v1'
};

type OverlayType =
  | 'none'
  | 'product'
  | 'size-finder'
  | 'concierge'
  | 'checkout'
  | 'track-order'
  | 'bag'
  | 'wishlist';

function isBagEntryArray(value: unknown): value is BagEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).productId === 'string' &&
        typeof (item as Record<string, unknown>).size === 'string' &&
        typeof (item as Record<string, unknown>).qty === 'number'
    )
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function ZevoraStorefront() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Catalog Filters
  const [category, setCategory] = useState<'all' | ProductCategory>('all');
  const [finishFilter, setFinishFilter] = useState<'all' | FinishTone>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  // Sections State
  const [activeLookbookId, setActiveLookbookId] = useState(LOOKBOOK_TABS[0].id);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Persistent Commerce State
  const [bag, setBag] = useState<BagEntry[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [savedSize, setSavedSize] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  // Bag options & Overlays
  const [promoApplied, setPromoApplied] = useState(false);
  const [giftNoteEnabled, setGiftNoteEnabled] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('none');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Concierge & Newsletter live API state
  const [conciergeName, setConciergeName] = useState('');
  const [conciergeContact, setConciergeContact] = useState('');
  const [conciergeTopic, setConciergeTopic] = useState('Help choosing a meaningful gift');
  const [conciergeMessage, setConciergeMessage] = useState('');
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeError, setConciergeError] = useState('');
  const [conciergeRef, setConciergeRef] = useState<string | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);

  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);

  // Hydrate persisted state cleanly on client
  useEffect(() => {
    try {
      const b = localStorage.getItem(STORAGE_KEYS.bag);
      const w = localStorage.getItem(STORAGE_KEYS.wishlist);
      const s = localStorage.getItem(STORAGE_KEYS.savedSize);
      const last = localStorage.getItem(STORAGE_KEYS.lastOrderId);

      if (b) {
        const parsed: unknown = JSON.parse(b);
        if (isBagEntryArray(parsed)) setBag(parsed);
      }
      if (w) {
        const parsed: unknown = JSON.parse(w);
        if (isStringArray(parsed)) setWishlist(parsed);
      }
      if (s) {
        const parsed: unknown = JSON.parse(s);
        if (typeof parsed === 'string') setSavedSize(parsed);
      }
      if (last) {
        const parsed: unknown = JSON.parse(last);
        if (typeof parsed === 'string') setLastOrderId(parsed);
      }
    } catch {
      // ignore storage failures
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.bag, JSON.stringify(bag));
    } catch {}
  }, [bag, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.savedSize, JSON.stringify(savedSize));
    } catch {}
  }, [savedSize, hydrated]);

  useEffect(() => {
    if (!hydrated || !lastOrderId) return;
    try {
      localStorage.setItem(STORAGE_KEYS.lastOrderId, JSON.stringify(lastOrderId));
    } catch {}
  }, [lastOrderId, hydrated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveOverlay('none');
    };
    window.addEventListener('scroll', onScroll);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', activeOverlay !== 'none');
    return () => document.body.classList.remove('no-scroll');
  }, [activeOverlay]);

  const showToast = (text: string): void => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      const matchFinish = finishFilter === 'all' || p.finish === finishFilter;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.finishLabel.toLowerCase().includes(q) ||
        p.stoneSpec.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchCat && matchFinish && matchQ;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') return [...list].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    return [...list].sort((a, b) => a.featuredRank - b.featuredRank);
  }, [category, finishFilter, sortBy, searchQuery]);

  const bagTotals = useMemo(() => {
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
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6;
    return { subtotal, totalItems, total: subtotal - discount + shipping };
  }, [bag, promoApplied]);

  const addToBag = (productId: string, size: string, openDrawer = false): void => {
    const p = PRODUCTS.find((item) => item.id === productId);
    if (!p) return;
    setBag((prev) => {
      const existing = prev.find((item) => item.productId === productId && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId && item.size === size ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { productId, size, qty: 1 }];
    });
    showToast(`Added ${p.name} (${size}) to your bag`);
    if (openDrawer) setActiveOverlay('bag');
  };

  const updateBagQty = (index: number, delta: number): void => {
    setBag((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeBagItem = (index: number): void => {
    setBag((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleWishlist = (productId: string): void => {
    const p = PRODUCTS.find((item) => item.id === productId);
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (p) {
        showToast(exists ? `Removed ${p.name} from favorites` : `Saved ${p.name} to your favorites`);
      }
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const openProduct = (productId: string): void => {
    setSelectedProductId(productId);
    setActiveOverlay('product');
  };

  const handleSaveSize = (row: RingSizeRow): void => {
    setSavedSize(row.us);
    setActiveOverlay('none');
    showToast(`Saved ${row.us} (${row.eu}) across the boutique`);
  };

  const jumpToCategory = (cat: ProductCategory): void => {
    setCategory(cat);
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetFilters = (): void => {
    setCategory('all');
    setFinishFilter('all');
    setSortBy('featured');
    setSearchQuery('');
  };

  const handleApplyPromo = (rawCode: string): string => {
    if (rawCode.trim().toUpperCase() === 'ZEVORA10') {
      setPromoApplied(true);
      return '✦ Welcome code ZEVORA10 applied — 10% off your order!';
    }
    return 'Try welcome code ZEVORA10 for 10% off your first creation.';
  };

  const handleOrderConfirmed = (order: OrderRecord): void => {
    setLastOrderId(order.orderId);
    setBag([]);
    setPromoApplied(false);
    setGiftNoteEnabled(false);
    setGiftNote('');
    showToast(`Order ${order.orderId} confirmed!`);
  };

  const handleOpenTrackOrder = (orderId?: string): void => {
    if (orderId) setLastOrderId(orderId);
    setActiveOverlay('track-order');
  };

  const handleConciergeSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setConciergeError('');
    setConciergeSending(true);
    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: conciergeName,
          contact: conciergeContact,
          topic: conciergeTopic,
          message: conciergeMessage
        })
      });
      const data = (await res.json()) as ConciergeApiResponse;
      if (!data.ok) {
        setConciergeError(data.error);
        return;
      }
      setConciergeRef(data.inquiryId);
      setConciergeName('');
      setConciergeContact('');
      setConciergeMessage('');
    } catch {
      setConciergeError('Unable to reach our concierge right now. Please try again.');
    } finally {
      setConciergeSending(false);
    }
  };

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setNewsletterSending(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = (await res.json()) as NewsletterApiResponse;
      if (!data.ok) {
        showToast(data.error);
        return;
      }
      setNewsletterEmail('');
      showToast(
        data.alreadySubscribed
          ? `You’re already on our list — enjoy 10% off with ${data.welcomeCode}`
          : `Welcome to ZEVORA Private Salon — use ${data.welcomeCode} for 10% off`
      );
    } catch {
      showToast('Unable to join right now. Please try again.');
    } finally {
      setNewsletterSending(false);
    }
  };

  const selectedProduct = selectedProductId ? PRODUCTS.find((p) => p.id === selectedProductId) || null : null;
  const activeLookbook = LOOKBOOK_TABS.find((t) => t.id === activeLookbookId) || LOOKBOOK_TABS[0];
  const savedSizeObj = savedSize ? RING_SIZES.find((r) => r.us === savedSize) : null;
  const hasFilters = category !== 'all' || finishFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <>
      {/* Friendly Announcement Bar */}
      <div className="announcement-bar" role="region" aria-label="Boutique benefits">
        <div className="container announcement-inner">
          <span>
            316L Stainless Steel &amp; AAA Crystal Craft · Complimentary Delivery Over ${FREE_SHIPPING_THRESHOLD}
          </span>
          <span className="announcement-dot" aria-hidden="true">
            ✦
          </span>
          <button type="button" className="announcement-link" onClick={() => setActiveOverlay('size-finder')}>
            30-Second Ring Size Finder →
          </button>
          <span className="announcement-dot" aria-hidden="true">
            ·
          </span>
          <button type="button" className="announcement-link" onClick={() => handleOpenTrackOrder()}>
            Track Order
          </button>
        </div>
      </div>

      {/* Sticky Header */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <nav className="primary-nav" aria-label="Main navigation">
            <a href="#collection">Collection</a>
            <a href="#lookbook">Styling</a>
            <a href="#vision">Our Vision</a>
            <a href="#unboxing">Packaging</a>
          </nav>

          <BrandMark />

          <div className="header-actions">
            <button
              type="button"
              className="nav-pill-btn desktop-only"
              onClick={() => setActiveOverlay('size-finder')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8" />
                <path d="M8 12h8M12 8v8" strokeOpacity="0.5" />
              </svg>
              <span>Size Finder</span>
            </button>

            <button
              type="button"
              className="icon-btn"
              aria-label="Search jewellery"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20L16.2 16.2" />
              </svg>
            </button>

            <button
              type="button"
              className="icon-btn badge-btn"
              aria-label="Open saved wishlist"
              onClick={() => setActiveOverlay('wishlist')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M12 20.5C12 20.5 4 15.2 4 9.2C4 6.5 6.1 4.5 8.7 4.5C10.2 4.5 11.4 5.3 12 6.4C12.6 5.3 13.8 4.5 15.3 4.5C17.9 4.5 20 6.5 20 9.2C20 15.2 12 20.5 12 20.5Z" />
              </svg>
              {wishlist.length > 0 && <span className="count-badge">{wishlist.length}</span>}
            </button>

            <button
              type="button"
              className="icon-btn badge-btn"
              aria-label="Open shopping bag"
              onClick={() => setActiveOverlay('bag')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M6 8H18L19.4 20H4.6L6 8Z" />
                <path d="M9 8V6.5C9 4.8 10.3 3.5 12 3.5C13.7 3.5 15 4.8 15 6.5V8" />
              </svg>
              {bagTotals.totalItems > 0 && <span className="count-badge">{bagTotals.totalItems}</span>}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="header-search-bar">
            <div className="container header-search-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20L16.2 16.2" />
              </svg>
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 1) {
                    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                }}
                placeholder="Search stainless steel rings (e.g., black crystal, gold-color buckle, baguette, signet)..."
              />
              <button
                type="button"
                className="text-link-btn"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {mobileNavOpen && (
          <div className="mobile-nav">
            <a href="#collection" className="mobile-nav-link" onClick={() => setMobileNavOpen(false)}>
              Shop Collection
            </a>
            <a href="#lookbook" className="mobile-nav-link" onClick={() => setMobileNavOpen(false)}>
              Style &amp; Occasions
            </a>
            <a href="#vision" className="mobile-nav-link" onClick={() => setMobileNavOpen(false)}>
              Our Brand Vision
            </a>
            <a href="#unboxing" className="mobile-nav-link" onClick={() => setMobileNavOpen(false)}>
              Luxury Packaging
            </a>
            <a href="#guidance" className="mobile-nav-link" onClick={() => setMobileNavOpen(false)}>
              Care &amp; FAQ
            </a>
            <div className="mobile-nav-actions">
              <button
                type="button"
                className="btn btn-gold btn-full"
                onClick={() => {
                  setMobileNavOpen(false);
                  setActiveOverlay('size-finder');
                }}
              >
                30-Second Ring Size Finder
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-full"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleOpenTrackOrder();
                }}
              >
                Track Your Order
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-ambient" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-pill">
                <span aria-hidden="true">✦</span>
                <span>316L STAINLESS STEEL · CRYSTAL ATELIER</span>
              </div>
              <h1 className="hero-title">
                Jewellery <em>Beyond</em> Elegance.
              </h1>
              <p className="hero-lead">
                Sculptural silver-tone and gold-color stainless steel rings set with precision-cut black and clear
                crystals—designed for waterproof everyday wear, high-jewellery poise, and honest pricing.
              </p>

              <div className="hero-cta-group">
                <a href="#collection" className="btn btn-gold">
                  <span>Explore Collection</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M5 12H19M13 6L19 12L13 18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={() => setActiveOverlay('size-finder')}
                >
                  Find Your Ring Size
                </button>
              </div>

              <div className="hero-trust-strip">
                <div className="trust-item">
                  <span className="trust-icon" aria-hidden="true">
                    ◈
                  </span>
                  <div>
                    <strong>316L Stainless Steel</strong>
                    <span>Waterproof, hypoallergenic &amp; rust-free</span>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="trust-icon" aria-hidden="true">
                    ♛
                  </span>
                  <div>
                    <strong>Signature Velvet Box</strong>
                    <span>Gift-ready packaging on every order</span>
                  </div>
                </div>
                <div className="trust-item">
                  <span className="trust-icon" aria-hidden="true">
                    ∞
                  </span>
                  <div>
                    <strong>Card, COD &amp; Bank</strong>
                    <span>Flexible checkout &amp; 30-day exchanges</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-frame">
                <img
                  src="/images/products/01_hero_black_crystal_collection.jpg"
                  alt="ZEVORA Stainless Steel & Black Crystal Ring Collection"
                  className="hero-main-img"
                />
                <div className="hero-seal-badge" aria-hidden="true">
                  <img src="/images/brand/zevora-emblem-badge-hd.png" alt="" />
                </div>
                <button
                  type="button"
                  className="hero-spotlight-card"
                  onClick={() => openProduct('noir-bypass-cuff')}
                >
                  <img
                    src="/images/products/01_black_open_bypass_cuff/01_hero_studio.jpg"
                    alt="Noir Architectural Bypass Cuff studio preview"
                    className="spotlight-thumb"
                  />
                  <div className="spotlight-meta">
                    <span className="spotlight-kicker">Signature Creation</span>
                    <strong>Noir Bypass Cuff</strong>
                    <span className="spotlight-price">$34 · 3 Studio Views →</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MOOD STRIP */}
        <section className="mood-strip-section" aria-label="Shop by style">
          <div className="container">
            <div className="mood-grid">
              <button type="button" className="mood-card" onClick={() => jumpToCategory('noir')}>
                <img src="/images/products/01_hero_black_crystal_collection.jpg" alt="Noir Crystal Rings" />
                <div className="mood-card-text">
                  <span className="mood-kicker">01 · Evening Drama</span>
                  <strong>Noir Crystal</strong>
                </div>
              </button>

              <button type="button" className="mood-card" onClick={() => jumpToCategory('gold')}>
                <img
                  src="/images/products/03_macro_gold_sculptural_detail.jpg"
                  alt="Gold-Color Stainless Steel Rings"
                />
                <div className="mood-card-text">
                  <span className="mood-kicker">02 · Everyday Warmth</span>
                  <strong>Gold-Tone Steel</strong>
                </div>
              </button>

              <button type="button" className="mood-card" onClick={() => jumpToCategory('architectural')}>
                <img
                  src="/images/products/02_cd_monogram_baguette_band/03_editorial_luxury.jpg"
                  alt="Architectural Baguette & Bypass Rings"
                />
                <div className="mood-card-text">
                  <span className="mood-kicker">03 · Modern Icon</span>
                  <strong>Architectural</strong>
                </div>
              </button>

              <button type="button" className="mood-card" onClick={() => jumpToCategory('mens')}>
                <img src="/images/products/02_editorial_mens_onyx_signets.jpg" alt="Men's Stainless Steel Signets" />
                <div className="mood-card-text">
                  <span className="mood-kicker">04 · Bold Heritage</span>
                  <strong>Men’s Signets</strong>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* MAIN CATALOG */}
        <section className="catalog-section" id="collection">
          <div className="container">
            <div className="section-header-split">
              <div>
                <span className="section-eyebrow">THE BOUTIQUE</span>
                <h2 className="section-title">Curated Creations</h2>
                <p className="section-subtitle">
                  Tap any ring for multi-angle studio views, transparent stainless steel &amp; crystal specs, and easy
                  sizing.
                </p>
              </div>
              <div className="saved-size-banner">
                <span className="saved-size-dot" aria-hidden="true">
                  ✦
                </span>
                <span>
                  {savedSize ? (
                    <>
                      Your saved fit: <strong>{savedSize}</strong> ({savedSizeObj?.eu}) — pre-selected across the
                      boutique.
                    </>
                  ) : (
                    'Need your fit? Find your ring size in 30 seconds.'
                  )}
                </span>
                <button type="button" className="text-link-gold" onClick={() => setActiveOverlay('size-finder')}>
                  Open Size Finder
                </button>
              </div>
            </div>

            {/* Honest Material Transparency Strip */}
            <div className="material-promise-banner">
              <span>
                <strong>Transparent Craft Promise:</strong> All ZEVORA pieces are crafted from skin-friendly{' '}
                <strong>316L Stainless Steel</strong> (silver-tone &amp; gold-color finishes) with simulated{' '}
                <strong>AAA Cubic Zirconia &amp; Faceted Crystals</strong>—never misleadingly marked up as solid gold,
                platinum, or mined diamonds.
              </span>
              <div className="material-tags">
                <span className="material-tag">316L Stainless Steel</span>
                <span className="material-tag">Gold &amp; Silver Finishes</span>
                <span className="material-tag">Simulated CZ Crystals</span>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="filter-bar">
              <div className="filter-pills" role="tablist" aria-label="Filter by category">
                {(
                  [
                    { id: 'all', label: 'All Pieces' },
                    { id: 'noir', label: 'Noir Crystal' },
                    { id: 'gold', label: 'Gold-Tone Steel' },
                    { id: 'architectural', label: 'Architectural' },
                    { id: 'mens', label: "Men's Signets" }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={category === tab.id}
                    className={`filter-pill ${category === tab.id ? 'active' : ''}`}
                    onClick={() => setCategory(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="filter-controls">
                <label className="select-wrap">
                  <span className="sr-only">Filter by steel finish</span>
                  <select
                    aria-label="Filter by steel finish"
                    value={finishFilter}
                    onChange={(e) => setFinishFilter(e.target.value as 'all' | FinishTone)}
                  >
                    <option value="all">All Steel Finishes</option>
                    <option value="silver-steel">Silver-Tone Steel</option>
                    <option value="gold-steel">Gold-Color Steel</option>
                    <option value="two-tone-steel">Two-Tone Steel</option>
                  </select>
                </label>

                <label className="select-wrap">
                  <span className="sr-only">Sort creations</span>
                  <select
                    aria-label="Sort creations"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'rating')
                    }
                  >
                    <option value="featured">Sort: Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="catalog-meta-row">
              <p className="results-count">
                {filteredProducts.length === 1
                  ? 'Showing 1 signature creation'
                  : `Showing ${filteredProducts.length} signature creations`}
              </p>
              {hasFilters && (
                <button type="button" className="text-link-muted" onClick={resetFilters}>
                  Reset all filters
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-catalog">
                <p className="empty-title">No creations match those exact filters.</p>
                <p className="empty-sub">Try clearing your search or exploring the full ZEVORA collection.</p>
                <button type="button" className="btn btn-dark" onClick={resetFilters}>
                  View All Pieces
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((p) => {
                  const isWishlisted = wishlist.includes(p.id);
                  const hasSecond = p.images.length > 1;
                  const defaultSize =
                    savedSize && p.sizes.includes(savedSize) ? savedSize : p.sizes[2] || p.sizes[0];

                  return (
                    <article className="product-card" key={p.id}>
                      <div
                        className={`product-media ${hasSecond ? 'has-secondary' : ''}`}
                        onClick={() => openProduct(p.id)}
                      >
                        <img src={p.images[0]} alt={p.name} className="img-primary" loading="lazy" />
                        {hasSecond && (
                          <img
                            src={p.images[1]}
                            alt={`${p.name} alternate view`}
                            className="img-secondary"
                            loading="lazy"
                          />
                        )}
                        <span className="product-badge">{p.badge}</span>
                        <button
                          type="button"
                          className={`wishlist-toggle ${isWishlisted ? 'active' : ''}`}
                          aria-label={isWishlisted ? 'Remove from favorites' : 'Save to favorites'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(p.id);
                          }}
                        >
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill={isWishlisted ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20.5C12 20.5 4 15.2 4 9.2C4 6.5 6.1 4.5 8.7 4.5C10.2 4.5 11.4 5.3 12 6.4C12.6 5.3 13.8 4.5 15.3 4.5C17.9 4.5 20 6.5 20 9.2C20 15.2 12 20.5 12 20.5Z" />
                          </svg>
                        </button>
                        {p.images.length > 1 && (
                          <span className="angle-pill">{p.images.length} Studio Angles</span>
                        )}
                      </div>

                      <div className="product-body">
                        <div className="product-meta-top">
                          <span className="metal-chip">
                            <span className={`metal-dot ${p.finish}`} aria-hidden="true" />
                            {p.finishShort}
                          </span>
                          <span className="rating-chip">
                            <span>★</span> {p.rating.toFixed(1)} ({p.reviews})
                          </span>
                        </div>
                        <h3 className="product-title" onClick={() => openProduct(p.id)}>
                          {p.name}
                        </h3>
                        <p className="product-sub">{p.subtitle}</p>
                        <div className="product-card-footer">
                          <span className="product-price">${p.price}</span>
                          <div className="card-btn-group">
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => openProduct(p.id)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() => addToBag(p.id, defaultSize)}
                            >
                              Add · {defaultSize}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* BRAND VISION & 4 PILLARS */}
        <section className="vision-section" id="vision">
          <div className="container">
            <div className="vision-top-grid">
              <div className="vision-crest-card">
                <img
                  src="/images/brand/zevora-logo-full-hd.png"
                  alt="ZEVORA — Jewellery Beyond Elegance official golden logo on dark silk"
                  className="vision-crest-img"
                />
              </div>

              <div className="vision-story">
                <span className="section-eyebrow gold">OUR BRAND IDENTITY &amp; VISION</span>
                <h2 className="section-title light">Everyday Luxury, Honestly Crafted.</h2>
                <p className="vision-paragraph">
                  <strong>ZEVORA</strong> was created around a modern promise: extraordinary elegance shouldn’t require
                  a vault or delicate handling. By pairing precision-finished <strong>316L stainless steel</strong> with
                  luminous <strong>simulated crystals &amp; AAA cubic zirconia</strong>, we craft rings you can wear
                  confidently from morning errands to midnight celebrations.
                </p>
                <p className="vision-paragraph">
                  Rooted in obsidian depth, warm champagne radiance, and enduring gold-tone polish, every ZEVORA piece
                  delivers timeless design with complete honesty and everyday resilience.
                </p>
                <div className="vision-palette">
                  <span className="palette-label">Signature Palette</span>
                  <div className="palette-swatches" aria-label="ZEVORA brand color palette">
                    <span
                      className="swatch-dot"
                      style={{ background: 'linear-gradient(135deg, #f3dfac, #b88e3d)' }}
                      title="Gold-Tone Accent"
                    />
                    <span className="swatch-dot" style={{ background: '#f5ece0' }} title="Warm Champagne Ivory" />
                    <span
                      className="swatch-dot"
                      style={{ background: '#1d1916', borderColor: 'rgba(212,175,99,0.5)' }}
                      title="Velvet Espresso"
                    />
                    <span
                      className="swatch-dot"
                      style={{ background: '#090807', borderColor: 'rgba(212,175,99,0.7)' }}
                      title="Obsidian Black"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pillars-grid">
              <article className="pillar-card">
                <div className="pillar-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.35">
                    <path d="M8 14L13 8H23L28 14L18 29L8 14Z" strokeLinejoin="round" />
                    <path d="M8 14H28M13 8L18 29L23 8M13 8L15 14L18 29L21 14L23 8" strokeOpacity="0.7" />
                  </svg>
                </div>
                <h3>Timeless Elegance</h3>
                <p>Sculptural silhouettes and balanced proportions inspired by haute-joaillerie classics.</p>
              </article>

              <article className="pillar-card">
                <div className="pillar-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.35">
                    <path d="M7 25L9.5 12L15 17L18 10L21 17L26.5 12L29 25H7Z" strokeLinejoin="round" />
                    <line x1="7" y1="28.5" x2="29" y2="28.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3>Premium Quality</h3>
                <p>Surgical-grade 316L stainless steel &amp; crisp AAA cubic zirconia checked before every dispatch.</p>
              </article>

              <article className="pillar-card">
                <div className="pillar-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.35">
                    <path
                      d="M13 13C9.7 13 7 15.2 7 18C7 20.8 9.7 23 13 23C16.8 23 19.2 13 23 13C26.3 13 29 15.2 29 18C29 20.8 26.3 23 23 23C19.2 23 16.8 13 13 13Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Lasting Beauty</h3>
                <p>Waterproof, sweat-resistant steel finishes engineered to resist fading and green skin.</p>
              </article>

              <article className="pillar-card">
                <div className="pillar-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.35">
                    <path
                      d="M18 6C18.9 13.4 22.6 17.1 30 18C22.6 18.9 18.9 22.6 18 30C17.1 22.6 13.4 18.9 6 18C13.4 17.1 17.1 13.4 18 6Z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Made for You</h3>
                <p>Interactive ring sizing, complimentary gift notes, and live order tracking.</p>
              </article>
            </div>
          </div>
        </section>

        {/* INTERACTIVE LOOKBOOK */}
        <section className="lookbook-section" id="lookbook">
          <div className="container">
            <div className="lookbook-header">
              <div>
                <span className="section-eyebrow">CURATED STYLING</span>
                <h2 className="section-title">Styled for Every Moment</h2>
              </div>
              <div className="lookbook-tabs" role="tablist" aria-label="Styling occasions">
                {LOOKBOOK_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={tab.id === activeLookbookId}
                    className={`lookbook-tab ${tab.id === activeLookbookId ? 'active' : ''}`}
                    onClick={() => setActiveLookbookId(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lookbook-stage">
              <div className="lookbook-media">
                <img src={activeLookbook.image} alt={activeLookbook.title} className="lookbook-main-img" />
                <img
                  src={activeLookbook.secondaryImage}
                  alt={`${activeLookbook.label} detail`}
                  className="lookbook-sub-img"
                />
              </div>

              <div className="lookbook-copy">
                <span className="section-eyebrow">{activeLookbook.eyebrow}</span>
                <h3>{activeLookbook.title}</h3>
                <p className="lookbook-desc">{activeLookbook.description}</p>
                <div className="stylist-tip-box">
                  <strong>ZEVORA Stylist Note:</strong> {activeLookbook.stylistTip}
                </div>
                <div className="lookbook-pieces">
                  {activeLookbook.featuredIds.map((id) => {
                    const p = PRODUCTS.find((item) => item.id === id);
                    if (!p) return null;
                    return (
                      <div className="lookbook-piece-row" key={p.id}>
                        <div className="lookbook-piece-left">
                          <img src={p.images[0]} alt={p.name} />
                          <div>
                            <strong>{p.name}</strong>
                            <span>
                              ${p.price} · {p.finishShort}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => openProduct(p.id)}
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PACKAGING SHOWCASE */}
        <section className="unboxing-section" id="unboxing">
          <div className="container">
            <div className="unboxing-header">
              <span className="section-eyebrow gold">THE ZEVORA UNBOXING</span>
              <h2 className="section-title light">Wrapped in Quiet Luxury</h2>
              <p className="section-subtitle light">
                Whether it’s a thoughtful gift or a well-deserved treat for yourself, every ZEVORA order arrives
                presentation-ready—at no extra charge.
              </p>
            </div>

            <div className="packaging-grid">
              <article className="packaging-card">
                <div className="packaging-img-wrap">
                  <img src="/images/brand/packaging-box-hd.jpg" alt="ZEVORA matte black gold-foil velvet ring box" />
                </div>
                <div className="packaging-body">
                  <span className="packaging-num">01</span>
                  <h3>Velvet Keepsake Ring Box</h3>
                  <p>Textured obsidian exterior embossed in brushed gold foil with plush interior cushioning.</p>
                </div>
              </article>

              <article className="packaging-card">
                <div className="packaging-img-wrap">
                  <img
                    src="/images/brand/packaging-bag-hd.jpg"
                    alt="ZEVORA warm champagne boutique shopping bag with gold rope handles"
                  />
                </div>
                <div className="packaging-body">
                  <span className="packaging-num">02</span>
                  <h3>Champagne Boutique Bag</h3>
                  <p>Heavyweight warm-ivory presentation bag finished with braided gold cord handles.</p>
                </div>
              </article>

              <article className="packaging-card">
                <div className="packaging-img-wrap">
                  <img src="/images/brand/packaging-tag-hd.jpg" alt="ZEVORA gold-foil hang tag and care certificate" />
                </div>
                <div className="packaging-body">
                  <span className="packaging-num">03</span>
                  <h3>Gold-Foil Authenticity Seal</h3>
                  <p>Includes our signature embossed medallion tag, care guide, and optional message card.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* GUIDANCE & FAQ */}
        <section className="guidance-section" id="guidance">
          <div className="container guidance-grid">
            <div className="guidance-intro">
              <span className="section-eyebrow">CARE &amp; HONESTY</span>
              <h2 className="section-title">Questions? We’re Right Here.</h2>
              <p className="section-subtitle">
                Clear materials, effortless sizing, and warm human support—shopping for jewellery should feel genuinely
                relaxing.
              </p>

              <div className="concierge-card">
                <div className="concierge-seal">
                  <img src="/images/brand/zevora-emblem-badge-hd.png" alt="ZEVORA official emblem" />
                </div>
                <div className="concierge-copy">
                  <h3>Personal Stylist &amp; Gifting Concierge</h3>
                  <p>
                    Need help pairing silver-tone and gold-color rings, guessing a gift size, or tracking a delivery?
                    Reach out anytime.
                  </p>
                  <div className="concierge-actions">
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => {
                        setConciergeRef(null);
                        setConciergeError('');
                        setActiveOverlay('concierge');
                      }}
                    >
                      Message Stylist
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => handleOpenTrackOrder()}
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="faq-list">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div className={`faq-item ${isOpen ? 'open' : ''}`} key={faq.question}>
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-chevron" aria-hidden="true">
                        +
                      </span>
                    </button>
                    {isOpen && <div className="faq-answer">{faq.answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-newsletter">
            <div>
              <span className="section-eyebrow gold">PRIVATE SALON ACCESS</span>
              <h3>Receive 10% Off Your First ZEVORA Creation</h3>
              <p>
                Use welcome code <strong>ZEVORA10</strong> in your bag, or join for new drop previews.
              </p>
            </div>
            <form className="newsletter-form" onSubmit={(e) => void handleNewsletterSubmit(e)}>
              <label htmlFor="newsletterEmailNext" className="sr-only">
                Email address
              </label>
              <input
                id="newsletterEmailNext"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
              <button type="submit" className="btn btn-gold" disabled={newsletterSending}>
                {newsletterSending ? 'Joining...' : 'Join Salon'}
              </button>
            </form>
          </div>

          <div className="footer-columns">
            <div className="footer-brand-col">
              <div className="footer-seal-row">
                <img
                  src="/images/brand/zevora-emblem-badge-hd.png"
                  alt="ZEVORA official emblem"
                  className="footer-seal-img"
                />
                <img
                  src="/images/brand/zevora-wordmark-hd.png"
                  alt="ZEVORA — Jewellery Beyond Elegance"
                  className="footer-wordmark-img"
                />
              </div>
              <p className="footer-desc">
                Honest 316L stainless steel &amp; AAA crystal jewellery crafted for timeless elegance, lasting shine,
                and everyday comfort.
              </p>
            </div>

            <div className="footer-link-col">
              <h4>Explore</h4>
              <a href="#collection">All Creations</a>
              <a href="#lookbook">Occasion Styling</a>
              <a href="#vision">Our Brand Vision</a>
              <a href="#unboxing">Gift Packaging</a>
            </div>

            <div className="footer-link-col">
              <h4>Client Care</h4>
              <button type="button" className="footer-btn-link" onClick={() => setActiveOverlay('size-finder')}>
                Interactive Size Finder
              </button>
              <button type="button" className="footer-btn-link" onClick={() => handleOpenTrackOrder()}>
                Track Your Order
              </button>
              <button
                type="button"
                className="footer-btn-link"
                onClick={() => {
                  setConciergeRef(null);
                  setConciergeError('');
                  setActiveOverlay('concierge');
                }}
              >
                Personal Stylist
              </button>
              <a href="#guidance">Material Honesty &amp; Care</a>
            </div>

            <div className="footer-link-col">
              <h4>Atelier Contact</h4>
              <a href="mailto:info@zevorastores.com">info@zevorastores.com</a>
              <span>Mon – Sat · 10:00 AM – 8:00 PM</span>
              <span>Card · COD · Bank Transfer</span>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 ZEVORA Jewellery. All rights reserved.</span>
            <span>316L Stainless Steel &amp; Simulated CZ Crystals · Built with Next.js</span>
          </div>
        </div>
      </footer>

      {/* BACKDROP */}
      {activeOverlay !== 'none' && <div className="overlay-backdrop" onClick={() => setActiveOverlay('none')} />}

      {/* MODALS & DRAWERS */}
      <ProductModal
        product={activeOverlay === 'product' ? selectedProduct : null}
        savedSize={savedSize}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        onClose={() => setActiveOverlay('none')}
        onAddToBag={(id, sz) => addToBag(id, sz, true)}
        onToggleWishlist={toggleWishlist}
        onOpenSizeFinder={() => setActiveOverlay('size-finder')}
      />

      <SizeFinderModal
        isOpen={activeOverlay === 'size-finder'}
        onClose={() => setActiveOverlay('none')}
        onSaveSize={handleSaveSize}
      />

      <TrackOrderModal
        isOpen={activeOverlay === 'track-order'}
        initialOrderId={lastOrderId}
        onClose={() => setActiveOverlay('none')}
      />

      {activeOverlay === 'concierge' && (
        <div className="modal concierge-modal" role="dialog" aria-modal="true" aria-labelledby="conciergeTitle">
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setActiveOverlay('none')}
            aria-label="Close concierge"
          >
            ✕
          </button>
          <div className="concierge-modal-body">
            <span className="section-eyebrow">ZEVORA ATELIER CONCIERGE</span>
            <h2 id="conciergeTitle">Ask a Personal Stylist</h2>
            <p className="modal-lead">
              Tell us the occasion, finish preference (silver-tone or gold-color steel), or gifting question—we’ll
              recommend the right fit.
            </p>
            {conciergeRef ? (
              <div className="form-success-box">
                <span className="success-star" aria-hidden="true">
                  ✦
                </span>
                <h3>Thank You — Your Stylist Has Your Note</h3>
                <p>
                  Inquiry Reference <strong>{conciergeRef}</strong> saved. A ZEVORA specialist will reply shortly.
                </p>
                <button type="button" className="btn btn-dark" onClick={() => setActiveOverlay('none')}>
                  Continue Browsing
                </button>
              </div>
            ) : (
              <form className="styled-form" onSubmit={(e) => void handleConciergeSubmit(e)}>
                {conciergeError && <div className="form-error-banner">{conciergeError}</div>}
                <div className="form-row-2">
                  <label className="field-group">
                    <span>Your Name</span>
                    <input
                      type="text"
                      value={conciergeName}
                      onChange={(e) => setConciergeName(e.target.value)}
                      placeholder="e.g., Amina"
                      required
                    />
                  </label>
                  <label className="field-group">
                    <span>Email or WhatsApp</span>
                    <input
                      type="text"
                      value={conciergeContact}
                      onChange={(e) => setConciergeContact(e.target.value)}
                      placeholder="you@email.com or +92..."
                      required
                    />
                  </label>
                </div>
                <label className="field-group">
                  <span>How can we help?</span>
                  <select value={conciergeTopic} onChange={(e) => setConciergeTopic(e.target.value)}>
                    <option value="Help choosing a meaningful gift">Help choosing a meaningful gift</option>
                    <option value="Unsure about ring sizing">Unsure about ring sizing</option>
                    <option value="Mixing silver-tone & gold-color steel">Mixing silver-tone &amp; gold-color steel</option>
                    <option value="Custom 3-ring set inquiry">Custom 3-ring set inquiry</option>
                  </select>
                </label>
                <label className="field-group">
                  <span>Message</span>
                  <textarea
                    rows={3}
                    value={conciergeMessage}
                    onChange={(e) => setConciergeMessage(e.target.value)}
                    placeholder="Share any details (finish preference, occasion, recipient style)..."
                    required
                  />
                </label>
                <button type="submit" className="btn btn-gold btn-full" disabled={conciergeSending}>
                  {conciergeSending ? 'Sending to Stylist...' : 'Send to ZEVORA Stylist'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <BagDrawer
        isOpen={activeOverlay === 'bag'}
        bag={bag}
        promoApplied={promoApplied}
        giftNoteEnabled={giftNoteEnabled}
        giftNote={giftNote}
        onClose={() => setActiveOverlay('none')}
        onUpdateQty={updateBagQty}
        onRemove={removeBagItem}
        onToggleGiftNote={setGiftNoteEnabled}
        onChangeGiftNote={setGiftNote}
        onApplyPromo={handleApplyPromo}
        onProceedCheckout={() => setActiveOverlay('checkout')}
      />

      <WishlistDrawer
        isOpen={activeOverlay === 'wishlist'}
        wishlist={wishlist}
        savedSize={savedSize}
        onClose={() => setActiveOverlay('none')}
        onRemoveWishlist={toggleWishlist}
        onOpenProduct={openProduct}
        onMoveToBag={(id, sz) => addToBag(id, sz, true)}
      />

      <CheckoutModal
        isOpen={activeOverlay === 'checkout'}
        bag={bag}
        promoApplied={promoApplied}
        totalItems={bagTotals.totalItems}
        total={bagTotals.total}
        giftNote={giftNoteEnabled ? giftNote.trim() : ''}
        onClose={() => setActiveOverlay('none')}
        onOrderConfirmed={handleOrderConfirmed}
        onTrackOrder={(orderId) => handleOpenTrackOrder(orderId)}
      />

      {/* TOASTS */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}
