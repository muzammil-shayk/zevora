export type ProductCategory = 'noir' | 'gold' | 'architectural' | 'mens';
export type FinishTone = 'silver-steel' | 'gold-steel' | 'two-tone-steel';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  categoryLabel: string;
  finish: FinishTone;
  finishLabel: string;
  finishShort: string;
  stoneSpec: string;
  price: number;
  badge: string;
  featuredRank: number;
  rating: number;
  reviews: number;
  sizes: string[];
  images: string[];
  imageLabels: string[];
  description: string;
  highlights: string[];
}

export interface LookbookTab {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  secondaryImage: string;
  featuredIds: string[];
  stylistTip: string;
}

export interface RingSizeRow {
  us: string;
  eu: string;
  diameterMm: number;
  circumferenceMm: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const FREE_SHIPPING_THRESHOLD = 60;

export const PRODUCTS: Product[] = [
  {
    id: 'noir-bypass-cuff',
    name: 'Noir Architectural Bypass Cuff',
    subtitle: 'Silver-Tone Stainless Steel · Black Faceted Crystals',
    category: 'architectural',
    categoryLabel: 'Architectural Rings',
    finish: 'silver-steel',
    finishLabel: 'Polished Silver-Tone Stainless Steel',
    finishShort: 'Silver-Tone Steel',
    stoneSpec: 'Faceted Black Cubic Zirconia (Simulated)',
    price: 34,
    badge: 'Signature',
    featuredRank: 1,
    rating: 4.9,
    reviews: 42,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'],
    images: [
      '/images/products/01_black_open_bypass_cuff/01_hero_studio.jpg',
      '/images/products/01_black_open_bypass_cuff/02_macro_detail.jpg',
      '/images/products/01_black_open_bypass_cuff/03_editorial_luxury.jpg'
    ],
    imageLabels: ['Studio Portrait', 'Macro Detail', 'Editorial Light'],
    description:
      'Architectural tension, perfected for everyday wear. Crafted in mirror-polished silver-tone stainless steel, this open-gap cuff pairs a square-cut black crystal in a raised prong basket opposite three stacked black baguette crystals.',
    highlights: [
      'Solid 316L stainless steel in mirror silver-tone — waterproof & rust-free',
      'Precision-cut black cubic zirconia crystals (simulated, non-diamond stones)',
      'Open bypass comfort fit adapts gracefully to finger movement',
      'Presented in our ZEVORA velvet keepsake box & care pouch'
    ]
  },
  {
    id: 'celeste-baguette-band',
    name: 'Celeste Baguette Signature Band',
    subtitle: 'Silver-Tone Stainless Steel · Clear Baguette Crystals',
    category: 'architectural',
    categoryLabel: 'Architectural Rings',
    finish: 'silver-steel',
    finishLabel: 'Polished Silver-Tone Stainless Steel',
    finishShort: 'Silver-Tone Steel',
    stoneSpec: 'Channel-Set Clear Cubic Zirconia (Simulated)',
    price: 32,
    badge: 'Bestseller',
    featuredRank: 2,
    rating: 5.0,
    reviews: 68,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'],
    images: [
      '/images/products/02_cd_monogram_baguette_band/01_hero_studio.jpg',
      '/images/products/02_cd_monogram_baguette_band/02_macro_detail.jpg',
      '/images/products/02_cd_monogram_baguette_band/03_editorial_luxury.jpg'
    ],
    imageLabels: ['Obsidian Studio', 'Macro Craft', 'Champagne Editorial'],
    description:
      'Minimalist polish with brilliant clarity. High-clarity clear baguette cubic zirconia crystals sit flush along a smooth silver-tone stainless steel band—luminous enough for evening outings, tough enough for daily wear.',
    highlights: [
      'Durable mirror-polished 316L stainless steel (not platinum or sterling)',
      'AAA clear baguette cubic zirconia crystals for crisp light reflection',
      'Snag-free flush channel setting with comfort-beveled inner band',
      'Skin-friendly, hypoallergenic & tarnish-resistant finish'
    ]
  },
  {
    id: 'vendome-art-deco-band',
    name: 'Vendôme Art Deco Noir Band',
    subtitle: 'Silver-Tone Stainless Steel · Black & Clear CZ Crystals',
    category: 'noir',
    categoryLabel: 'Noir Crystal',
    finish: 'silver-steel',
    finishLabel: 'Polished Silver-Tone Stainless Steel',
    finishShort: 'Silver-Tone Steel',
    stoneSpec: 'Round Black & Clear Baguette Cubic Zirconia',
    price: 34,
    badge: 'New Arrival',
    featuredRank: 3,
    rating: 4.9,
    reviews: 31,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'],
    images: [
      '/images/products/03_art_deco_black_round_baguette_band/01_hero_studio.jpg',
      '/images/products/01_hero_black_crystal_collection.jpg'
    ],
    imageLabels: ['Architectural Hero', 'Noir Collection'],
    description:
      'Inspired by classic Art Deco geometry. Three deep round black crystals sit in crisp four-prong settings framed by twin rails of clear baguette cubic zirconia—all set in enduring silver-tone stainless steel.',
    highlights: [
      'Tarnish-resistant 316L stainless steel with hand-checked stone settings',
      'High-contrast black & clear simulated CZ crystals (not real diamonds)',
      'Balanced architectural width that pairs easily with slim bands',
      'Delivered gift-ready in ZEVORA matte black gold-foil box'
    ]
  },
  {
    id: 'velvet-eclipse-halo',
    name: 'Velvet Eclipse Crystal Halo Ring',
    subtitle: 'Silver-Tone Stainless Steel · Oval Black Crystal & CZ Halo',
    category: 'noir',
    categoryLabel: 'Noir Crystal',
    finish: 'silver-steel',
    finishLabel: 'Polished Silver-Tone Stainless Steel',
    finishShort: 'Silver-Tone Steel',
    stoneSpec: 'Oval Black Faceted Crystal & Clear Pavé CZ',
    price: 36,
    badge: 'Bestseller',
    featuredRank: 4,
    rating: 5.0,
    reviews: 54,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'],
    images: [
      '/images/products/01_hero_black_crystal_collection.jpg',
      '/images/products/04_lifestyle_curated_flatlay.jpg'
    ],
    imageLabels: ['Dark Plinth Hero', 'Boutique Tray'],
    description:
      'Dramatic evening elegance without the fine-jewellery markup. A faceted oval black crystal centerpiece is framed by a bright halo of clear micro-pavé cubic zirconia on a sleek silver-tone stainless steel band.',
    highlights: [
      'Mirror-polished silver-tone stainless steel — resists fading & green fingers',
      'Simulated oval black crystal surrounded by sparkling clear CZ stones',
      'Smooth tapered inner shank designed for comfortable hours of wear',
      'A favorite for parties, dinners, and thoughtful everyday gifting'
    ]
  },
  {
    id: 'aurelia-gold-buckle',
    name: 'Aurelia Gold-Tone Buckle Ring',
    subtitle: 'Gold-Color Stainless Steel · Clear Solitaire Crystal',
    category: 'gold',
    categoryLabel: 'Gold-Tone Steel',
    finish: 'gold-steel',
    finishLabel: 'Gold-Color Stainless Steel',
    finishShort: 'Gold-Color Steel',
    stoneSpec: 'Flush-Set Clear Cubic Zirconia Accent',
    price: 28,
    badge: 'Signature',
    featuredRank: 5,
    rating: 4.9,
    reviews: 49,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'],
    images: [
      '/images/products/03_macro_gold_sculptural_detail.jpg',
      '/images/products/01_hero_black_crystal_collection.jpg',
      '/images/products/04_lifestyle_curated_flatlay.jpg'
    ],
    imageLabels: ['Champagne Silk', 'Noir Contrast', 'Daylight Flatlay'],
    description:
      'Rich golden warmth shaped into a sculptural buckle silhouette, accented by a flush-set clear crystal glint. Crafted from gold-colored 316L stainless steel for lasting shine without worry.',
    highlights: [
      'Gold-color finished 316L stainless steel (not solid gold) — waterproof & sweat-proof',
      'Flush-set clear simulated CZ accent for subtle golden-hour sparkle',
      'Smooth domed interior edge for effortless slip-on comfort',
      'Hypoallergenic & nickel-free for sensitive skin'
    ]
  },
  {
    id: 'etreinte-embrace-ring',
    name: 'Étreinte Sculpted Embrace Ring',
    subtitle: 'Gold-Color Stainless Steel · Open Hugging-Hands Motif',
    category: 'gold',
    categoryLabel: 'Gold-Tone Steel',
    finish: 'gold-steel',
    finishLabel: 'Gold-Color Stainless Steel',
    finishShort: 'Gold-Color Steel',
    stoneSpec: 'Sculpted All-Metal Gold-Color Steel',
    price: 24,
    badge: 'Gift Favorite',
    featuredRank: 6,
    rating: 4.8,
    reviews: 63,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'],
    images: [
      '/images/products/03b_etreinte_embrace_focus.jpg',
      '/images/products/03_macro_gold_sculptural_detail.jpg',
      '/images/products/04_lifestyle_curated_flatlay.jpg'
    ],
    imageLabels: ['Sculpted Close-Up', 'Golden Hour Silk', 'Atelier Tray'],
    description:
      'A poetic, wearable sculpture symbolizing warmth and closeness. Smooth gold-colored stainless steel contours wrap gently around the finger with rich mirror luster.',
    highlights: [
      'Rich gold-color stainless steel finish — resists everyday tarnishing',
      'Gently adjustable open-fit design makes gifting stress-free',
      'Lightweight sculpted detailing comfortable for daily stacking',
      'Includes complimentary handwritten ZEVORA gift card'
    ]
  },
  {
    id: 'sovereign-onyx-signet',
    name: 'Sovereign Two-Tone Onyx-Style Signet',
    subtitle: 'Two-Tone Stainless Steel · Carved Shoulders & Black Stone',
    category: 'mens',
    categoryLabel: "Men's Signets",
    finish: 'two-tone-steel',
    finishLabel: 'Two-Tone Silver & Gold-Color Stainless Steel',
    finishShort: 'Two-Tone Steel',
    stoneSpec: 'Polished Flat Black Onyx-Style Stone',
    price: 38,
    badge: "Men's Edition",
    featuredRank: 7,
    rating: 5.0,
    reviews: 37,
    sizes: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
    images: [
      '/images/products/02_editorial_mens_onyx_signets.jpg',
      '/images/products/04_lifestyle_curated_flatlay.jpg'
    ],
    imageLabels: ['Basalt Editorial', 'Curated Tray'],
    description:
      'Bold heritage styling crafted in weighty stainless steel. A mirror-flat rectangular black stone sits inside a warm gold-colored bezel above deeply detailed antiqued silver-tone shoulders.',
    highlights: [
      'Heavyweight 316L stainless steel in antiqued silver & gold-color two-tone',
      'Glossy rectangular black onyx-style face framed in warm gold-tone trim',
      'Scratch-tolerant, water-safe construction built for everyday wear',
      'Presented in ZEVORA matte black presentation box'
    ]
  },
  {
    id: 'obsidian-cuban-signet',
    name: 'Obsidian Cuban Link Signet',
    subtitle: 'Two-Tone Stainless Steel · Braided Chain Shank',
    category: 'mens',
    categoryLabel: "Men's Signets",
    finish: 'two-tone-steel',
    finishLabel: 'Two-Tone Silver & Gold-Color Stainless Steel',
    finishShort: 'Two-Tone Steel',
    stoneSpec: 'Polished Square Black Onyx-Style Stone',
    price: 36,
    badge: "Men's Edition",
    featuredRank: 8,
    rating: 4.9,
    reviews: 29,
    sizes: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
    images: [
      '/images/products/02b_cuban_signet_focus.jpg',
      '/images/products/02_editorial_mens_onyx_signets.jpg',
      '/images/products/04_lifestyle_curated_flatlay.jpg'
    ],
    imageLabels: ['Cuban Link Detail', 'Smoked Basalt', 'Boutique Flatlay'],
    description:
      'Clean architectural lines meet bold Cuban chain-link shoulders. Built entirely from tough two-tone stainless steel so it pairs effortlessly with both silver and gold-colored watches.',
    highlights: [
      'Marine-grade 316L stainless steel core with gold-colored bezel trim',
      'Smooth polished square black stone with beveled steel framing',
      'Sweat-proof, waterproof & zero skin discoloration',
      'Delivered inside our signature black gold-foil ring box'
    ]
  },
  {
    id: 'atelier-collectors-vault',
    name: "ZEVORA Collector's 3-Ring Vault",
    subtitle: 'Mixed Stainless Steel Trio · Velvet Display Box Included',
    category: 'noir',
    categoryLabel: 'Curated Sets',
    finish: 'two-tone-steel',
    finishLabel: 'Silver & Gold-Color Stainless Steel Set',
    finishShort: 'Mixed Steel Trio',
    stoneSpec: 'Assorted Black & Clear AAA Cubic Zirconia',
    price: 79,
    badge: 'Save $19',
    featuredRank: 9,
    rating: 5.0,
    reviews: 24,
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9', 'US 10'],
    images: [
      '/images/products/04_lifestyle_curated_flatlay.jpg',
      '/images/products/01_hero_black_crystal_collection.jpg',
      '/images/products/03_macro_gold_sculptural_detail.jpg'
    ],
    imageLabels: ['Curated Suede Tray', 'Noir Trio', 'Gold-Tone Sculptural'],
    description:
      'Build an instant wardrobe of effortless everyday elegance. Combine three signature stainless steel ZEVORA rings—mixing silver-tone crystal and gold-color sculptural styles—inside our charcoal suede presentation tray.',
    highlights: [
      'Includes complimentary charcoal suede multi-ring presentation tray',
      'All pieces crafted in durable 316L stainless steel & precision CZ crystals',
      'Mix ring sizes across fingers (just add a note at checkout)',
      'Automatically unlocks complimentary insured express delivery'
    ]
  }
];

export const LOOKBOOK_TABS: LookbookTab[] = [
  {
    id: 'evening-noir',
    label: 'Evening Noir',
    eyebrow: 'AFTER-DARK BRILLIANCE',
    title: 'Black Crystal Drama, Effortless Wear',
    description:
      'High-contrast black cubic zirconia and mirror silver-tone stainless steel silhouettes made for evening wear, monochrome tailoring, and bold statements—without ever worrying about fragile fine stones.',
    image: '/images/products/01_hero_black_crystal_collection.jpg',
    secondaryImage: '/images/products/01_black_open_bypass_cuff/02_macro_detail.jpg',
    featuredIds: ['velvet-eclipse-halo', 'noir-bypass-cuff', 'vendome-art-deco-band'],
    stylistTip:
      'Anchor your look with the Velvet Eclipse Halo on the middle finger and pair it with the sleek Noir Bypass Cuff on the opposite hand.'
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    eyebrow: 'GOLD-COLOR STAINLESS STEEL',
    title: 'Warm Golden Shine Built for Real Life',
    description:
      'Sculptural gold-colored stainless steel bands that glow warmly against skin and neutral fabrics. Waterproof and tarnish-resistant so you can wear them from morning coffee through dinner.',
    image: '/images/products/03_macro_gold_sculptural_detail.jpg',
    secondaryImage: '/images/products/02_cd_monogram_baguette_band/03_editorial_luxury.jpg',
    featuredIds: ['aurelia-gold-buckle', 'etreinte-embrace-ring', 'celeste-baguette-band'],
    stylistTip:
      'Pair the Aurelia Gold-Tone Buckle with the adjustable Étreinte Embrace Ring—warm gold-color steel mixes beautifully with crisp silver CZ bands.'
  },
  {
    id: 'modern-signet',
    label: 'Modern Signet',
    eyebrow: 'TWO-TONE HERITAGE STEEL',
    title: 'Carved Steel, Gold Trim & Bold Black Stones',
    description:
      'Substantial, weighty stainless steel signet rings with vintage-inspired engravings and two-tone gold-colored bezels—engineered for everyday durability and effortless style.',
    image: '/images/products/02_editorial_mens_onyx_signets.jpg',
    secondaryImage: '/images/products/01_black_open_bypass_cuff/03_editorial_luxury.jpg',
    featuredIds: ['sovereign-onyx-signet', 'obsidian-cuban-signet', 'noir-bypass-cuff'],
    stylistTip:
      'Give a signet breathing room—wear it solo on the ring or pinky finger to let the carved steel shoulders and flat black stone stand out.'
  },
  {
    id: 'curated-gifting',
    label: 'The Gift Vault',
    eyebrow: 'MADE FOR YOU',
    title: 'Luxury Unboxing at Honest Everyday Prices',
    description:
      'Every ZEVORA stainless steel creation arrives nestled inside our signature matte black gold-foil box and champagne rope-handle bag—ready to gift the moment it reaches your door.',
    image: '/images/products/04_lifestyle_curated_flatlay.jpg',
    secondaryImage: '/images/brand/packaging-box-hd.jpg',
    featuredIds: ['atelier-collectors-vault', 'celeste-baguette-band', 'etreinte-embrace-ring'],
    stylistTip:
      'Gifting without knowing their exact size? Choose our open-fit Étreinte Embrace Ring or Noir Bypass Cuff for forgiving adjustability.'
  }
];

export const RING_SIZES: RingSizeRow[] = [
  { us: 'US 5', eu: 'Size 16', diameterMm: 15.7, circumferenceMm: 49.3 },
  { us: 'US 6', eu: 'Size 17', diameterMm: 16.5, circumferenceMm: 51.9 },
  { us: 'US 7', eu: 'Size 18', diameterMm: 17.3, circumferenceMm: 54.4 },
  { us: 'US 8', eu: 'Size 19', diameterMm: 18.1, circumferenceMm: 57.0 },
  { us: 'US 9', eu: 'Size 20', diameterMm: 18.9, circumferenceMm: 59.5 },
  { us: 'US 10', eu: 'Size 21', diameterMm: 19.8, circumferenceMm: 62.1 },
  { us: 'US 11', eu: 'Size 22', diameterMm: 20.6, circumferenceMm: 64.6 },
  { us: 'US 12', eu: 'Size 23', diameterMm: 21.4, circumferenceMm: 67.2 }
];

export const FAQS: FaqItem[] = [
  {
    question: 'Are ZEVORA rings made of real gold, platinum, or natural diamonds?',
    answer:
      'No—and we believe in complete honesty. Every ZEVORA ring is crafted from durable, skin-friendly 316L stainless steel (in polished silver-tone or rich gold-color finish) and set with precision-cut AAA cubic zirconia & black faceted crystals (simulated stones, not natural diamonds). This lets us offer luxury aesthetic craft, impressive weight, and water-resistant shine at honest everyday prices.'
  },
  {
    question: 'Will the gold-color or silver-tone stainless steel tarnish or turn skin green?',
    answer:
      'No. Unlike cheap brass or alloy costume jewellery, 316L surgical-grade stainless steel is naturally hypoallergenic, rust-free, and highly resistant to water, sweat, and everyday tarnishing—keeping its Lasting Beauty through daily wear.'
  },
  {
    question: 'What if I choose the wrong ring size?',
    answer:
      'Never worry—we offer complimentary, hassle-free size exchanges within 30 days of delivery. You can also use our 30-Second Interactive Ring Size Finder right here on the site to match an existing ring or finger measurement with confidence.'
  },
  {
    question: 'Does every order come in ZEVORA luxury packaging?',
    answer:
      'Yes, always at zero extra cost. Every piece arrives nestled inside our matte black gold-foil velvet ring box, accompanied by our champagne rope-handle boutique bag, care card, and optional handwritten gift message.'
  },
  {
    question: 'How quickly do orders ship?',
    answer:
      'In-stock pieces are individually inspected for finish and stone security and dispatched within 24 hours. Insured express delivery arrives in 2–4 business days and is complimentary on all orders over $60.'
  }
];
