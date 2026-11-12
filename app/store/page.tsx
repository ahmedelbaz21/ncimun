'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Product, PRODUCT_SELECT, ProductImage, STORE_STYLES, egp, isSoldOut, productImageUrl, useCart } from './shared';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { count } = useCart();

  useEffect(() => {
    supabase
      .from('store_products')
      .select(PRODUCT_SELECT)
      .order('sort_order')
      .then(({ data }: { data: Product[] | null }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      <section className="sp-hero">
        <span className="sp-eyebrow">Official merch</span>
        <h1 className="sp-title">The NCIMUN Store</h1>
        <p className="sp-subtitle">Limited-run hoodies and tees. Pick up at Volume 7 Part 2 or get it delivered in Cairo &amp; Giza.</p>
      </section>

      <div className="st-bar">
        <div className="st-bar-inner">
          <span className="st-crumbs">{products.length} products</span>
          <Link href="/store/checkout" className="st-cart-btn">
            🛍 Cart <span className="st-cart-count">{count}</span>
          </Link>
        </div>
      </div>

      <div className="st-container">
        {loading ? (
          <p className="st-status">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="st-status">Nothing in the store right now — check back soon.</p>
        ) : (
          <div className="sp-grid">
            {products.map(p => {
              const soldOut = isSoldOut(p);
              const off = p.compare_at_price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
              return (
                <Link key={p.id} href={`/store/${p.slug}`} className="sp-card">
                  <div className="sp-card-img">
                    <ProductImage product={p} className="sp-card-photo" />
                    {p.gallery_paths[0] && (
                      <img src={productImageUrl(p.gallery_paths[0])} alt="" className="sp-card-photo sp-card-photo--back" />
                    )}
                    {soldOut ? (
                      <span className="st-badge st-badge--muted sp-card-badge">Sold out</span>
                    ) : off > 0 && (
                      <span className="st-badge sp-card-badge">−{off}%</span>
                    )}
                  </div>
                  <div className="sp-card-info">
                    <h2 className="sp-card-name">{p.name}</h2>
                    <div className="st-price">
                      <span className="st-price-now">{egp(p.price)}</span>
                      {p.compare_at_price && <span className="st-price-was">{egp(p.compare_at_price)}</span>}
                    </div>
                    <p className="sp-card-sizes">
                      Sizes: {[...p.store_variants].sort((a, b) => a.sort_order - b.sort_order).map(v => v.size).join(' · ')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{STORE_STYLES + `
        .sp-hero { background: var(--black); padding: 4.5rem 2rem; text-align: center; }
        .sp-eyebrow { font-size: .75rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--aqua); display: block; margin-bottom: .75rem; }
        .sp-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: var(--white); letter-spacing: -.02em; line-height: 1.15; }
        .sp-subtitle { font-size: 1rem; color: rgba(255,255,255,.6); margin: .75rem auto 0; max-width: 560px; line-height: 1.6; }

        .sp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
        .sp-card { display: block; }
        .sp-card-img { position: relative; aspect-ratio: 4 / 5; border-radius: 14px; overflow: hidden; background: var(--gray-100); }
        .sp-card-photo { width: 100%; height: 100%; object-fit: cover; display: flex; transition: transform .4s; }
        .sp-card:hover .sp-card-photo { transform: scale(1.03); }
        .sp-card-photo--back { position: absolute; inset: 0; opacity: 0; transition: opacity .35s, transform .4s; }
        .sp-card:hover .sp-card-photo--back { opacity: 1; }
        .sp-card-badge { position: absolute; top: .875rem; left: .875rem; }
        .sp-card-info { padding: 1rem .25rem 0; display: flex; flex-direction: column; gap: .35rem; }
        .sp-card-name { font-size: 1.0625rem; font-weight: 800; }
        .sp-card-sizes { font-size: .8125rem; color: var(--gray-600); font-weight: 600; }

        @media (max-width: 600px) {
          .sp-hero { padding: 3rem 1rem; }
          .sp-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .sp-card-name { font-size: .9375rem; }
        }
      `}</style>
    </main>
  );
}
