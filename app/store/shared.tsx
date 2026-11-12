'use client';

import { useEffect, useState } from 'react';

export type Variant = { id: number; size: string; stock: number | null; sort_order: number };

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_path: string | null;
  gallery_paths: string[];
  store_variants: Variant[];
};

export type CartItem = {
  variantId: number;
  productSlug: string;
  name: string;
  size: string;
  price: number;
  imagePath: string | null;
  quantity: number;
};

export const DELIVERY_FEE = 70;
export const PRODUCT_SELECT = 'id, slug, name, description, price, compare_at_price, image_path, gallery_paths, store_variants(id, size, stock, sort_order)';

export const productImageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/store/${path}`;

export const egp = (n: number) => `${n.toLocaleString()} EGP`;

export const isSoldOut = (p: Product) =>
  p.store_variants.length > 0 && p.store_variants.every(v => v.stock !== null && v.stock <= 0);

// ── Cart (kept in this browser only) ──
const CART_KEY = 'ncimun-cart';
const CART_EVENT = 'ncimun-cart-change';

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

function writeCart(items: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(CART_EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const add = (item: CartItem) => {
    const cart = readCart();
    const existing = cart.find(i => i.variantId === item.variantId);
    if (existing) existing.quantity = Math.min(10, existing.quantity + item.quantity);
    else cart.push(item);
    writeCart(cart);
  };

  const setQuantity = (variantId: number, quantity: number) =>
    writeCart(readCart()
      .map(i => (i.variantId === variantId ? { ...i, quantity: Math.min(10, quantity) } : i))
      .filter(i => i.quantity > 0));

  const clear = () => writeCart([]);

  // Refresh name, price and photo from the store, since the cart keeps what they were when added
  const refresh = (latest: Map<number, Pick<CartItem, 'name' | 'price' | 'imagePath' | 'productSlug'>>) => {
    const cart = readCart();
    const updated = cart
      .filter(i => latest.has(i.variantId))
      .map(i => ({ ...i, ...latest.get(i.variantId)! }));
    if (JSON.stringify(updated) !== JSON.stringify(cart)) writeCart(updated);
  };

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  return { items, add, setQuantity, clear, refresh, count, subtotal };
}

// Shown until real product photos are uploaded
export function ProductImage({ product, className }: { product: { name: string; image_path: string | null; slug: string }; className?: string }) {
  if (product.image_path) {
    return <img src={productImageUrl(product.image_path)} alt={product.name} className={className} />;
  }
  const isHoodie = product.slug.includes('hoodie');
  return (
    <div className={`st-placeholder ${className ?? ''}`} aria-label={product.name}>
      <svg viewBox="0 0 200 200" width="62%" height="62%" aria-hidden="true">
        {isHoodie ? (
          <path d="M70 30 Q100 10 130 30 L165 50 L185 100 L160 110 L150 85 L150 180 L50 180 L50 85 L40 110 L15 100 L35 50 Z M80 32 Q100 70 120 32" fill="#2E3338" stroke="#84DBD5" strokeWidth="2.5" strokeLinejoin="round" />
        ) : (
          <path d="M72 30 Q100 48 128 30 L170 50 L188 88 L158 100 L150 82 L150 180 L50 180 L50 82 L42 100 L12 88 L30 50 Z" fill="#2E3338" stroke="#84DBD5" strokeWidth="2.5" strokeLinejoin="round" />
        )}
        <text x="100" y="128" textAnchor="middle" fill="#84DBD5" fontSize="17" fontWeight="800" fontFamily="Avenir, sans-serif" letterSpacing="2">NCIMUN</text>
      </svg>
    </div>
  );
}

export const STORE_STYLES = `
  :root {
    --blue:   #5F96CA;
    --aqua:   #84DBD5;
    --black:  #23272A;
    --white:  #FFFFFF;
    --gray-50:  #F8F9FA;
    --gray-100: #F1F3F5;
    --gray-200: #E9ECEF;
    --gray-400: #ADB5BD;
    --gray-600: #6C757D;
    --green:  #2D9B6F;
    --red:    #E5534B;
    --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); color: var(--black); background: var(--white); }
  a { text-decoration: none; color: inherit; }

  .st-bar { border-bottom: 1px solid var(--gray-200); background: var(--white); }
  .st-bar-inner { max-width: 1100px; margin: 0 auto; padding: .875rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .st-crumbs { font-size: .8125rem; font-weight: 600; color: var(--gray-600); }
  .st-crumbs a:hover { color: var(--black); }
  .st-cart-btn { display: inline-flex; align-items: center; gap: .5rem; font-size: .875rem; font-weight: 700; color: var(--black); padding: .45rem .875rem; border: 1.5px solid var(--gray-200); border-radius: 999px; transition: border-color .15s; }
  .st-cart-btn:hover { border-color: var(--black); }
  .st-cart-count { background: var(--black); color: var(--white); font-size: .6875rem; min-width: 20px; height: 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }

  .st-container { max-width: 1100px; margin: 0 auto; padding: 2.5rem 2rem 6rem; }
  .st-status { text-align: center; padding: 4rem 1rem; color: var(--gray-600); }

  .st-placeholder { background: linear-gradient(160deg, #23272A, #343A40); display: flex; align-items: center; justify-content: center; }

  .st-price { display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap; }
  .st-price-now { font-weight: 800; color: var(--black); }
  .st-price-was { color: var(--gray-400); text-decoration: line-through; font-weight: 600; }
  .st-badge { display: inline-block; background: var(--red); color: var(--white); font-size: .6875rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: .25rem .6rem; border-radius: 999px; }
  .st-badge--muted { background: var(--gray-600); }

  .st-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; background: var(--black); color: var(--white); border: none; border-radius: 10px; padding: .9rem 1.5rem; font-family: var(--font); font-size: .9375rem; font-weight: 800; cursor: pointer; transition: opacity .15s; }
  .st-btn:hover { opacity: .88; }
  .st-btn:disabled { opacity: .4; cursor: not-allowed; }
  .st-btn--block { width: 100%; }
  .st-btn--aqua { background: var(--aqua); color: var(--black); }

  @media (max-width: 600px) {
    .st-bar-inner { padding: .75rem 1rem; }
    .st-container { padding: 1.5rem 1rem 4rem; }
  }
`;
