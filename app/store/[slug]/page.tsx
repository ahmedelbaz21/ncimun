'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Product, PRODUCT_SELECT, ProductImage, STORE_STYLES, egp, productImageUrl, useCart } from '../shared';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [photo, setPhoto] = useState(0);
  const { add, count } = useCart();

  useEffect(() => {
    supabase
      .from('store_products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .single()
      .then(({ data }: { data: Product | null }) => {
        if (data) {
          data.store_variants.sort((a, b) => a.sort_order - b.sort_order);
          setProduct(data);
        }
        setLoading(false);
      });
  }, [slug]);

  const variant = product?.store_variants.find(v => v.id === variantId) ?? null;
  const maxQty = Math.min(10, variant?.stock ?? 10);

  const handleAdd = () => {
    if (!product || !variant) return;
    add({
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      size: variant.size,
      price: product.price,
      imagePath: product.image_path,
      quantity,
    });
    setAdded(true);
    setQuantity(1);
  };

  return (
    <main>
      <div className="st-bar">
        <div className="st-bar-inner">
          <span className="st-crumbs"><Link href="/store">Store</Link> / {product?.name ?? '…'}</span>
          <Link href="/store/checkout" className="st-cart-btn">
            🛍 Cart <span className="st-cart-count">{count}</span>
          </Link>
        </div>
      </div>

      <div className="st-container">
        {loading ? (
          <p className="st-status">Loading…</p>
        ) : !product ? (
          <p className="st-status">We couldn&apos;t find that product. <Link href="/store" className="pd-link">Back to the store</Link></p>
        ) : (
          <div className="pd-layout">
            <div className="pd-gallery">
              <div className="pd-media">
                {photo === 0 || !product.gallery_paths[photo - 1] ? (
                  <ProductImage product={product} className="pd-photo" />
                ) : (
                  <img src={productImageUrl(product.gallery_paths[photo - 1])} alt={product.name} className="pd-photo" />
                )}
              </div>
              {product.image_path && product.gallery_paths.length > 0 && (
                <div className="pd-thumbs">
                  {[product.image_path, ...product.gallery_paths].map((path, i) => (
                    <button key={path} type="button" className={`pd-thumb ${photo === i ? 'pd-thumb--active' : ''}`} onClick={() => setPhoto(i)} aria-label={i === 0 ? 'Front' : 'Back'}>
                      <img src={productImageUrl(path)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pd-info">
              <h1 className="pd-name">{product.name}</h1>
              <div className="st-price pd-price">
                <span className="st-price-now">{egp(product.price)}</span>
                {product.compare_at_price && (
                  <>
                    <span className="st-price-was">{egp(product.compare_at_price)}</span>
                    <span className="st-badge">Save {egp(product.compare_at_price - product.price)}</span>
                  </>
                )}
              </div>
              {product.description && <p className="pd-desc">{product.description}</p>}

              <div className="pd-field">
                <span className="pd-label">Size{variant ? `: ${variant.size}` : ''}</span>
                <div className="pd-sizes">
                  {product.store_variants.map(v => {
                    const soldOut = v.stock !== null && v.stock <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`pd-size ${variantId === v.id ? 'pd-size--active' : ''}`}
                        disabled={soldOut}
                        onClick={() => { setVariantId(v.id); setQuantity(1); setAdded(false); }}
                        title={soldOut ? 'Sold out' : undefined}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
                {variant?.stock !== null && variant && variant.stock <= 5 && (
                  <span className="pd-stock">Only {variant.stock} left in {variant.size}</span>
                )}
              </div>

              <div className="pd-field">
                <span className="pd-label">Quantity</span>
                <div className="pd-qty">
                  <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} aria-label="Increase quantity">+</button>
                </div>
              </div>

              <button className="st-btn st-btn--block" disabled={!variant} onClick={handleAdd}>
                {variant ? `Add to cart · ${egp(product.price * quantity)}` : 'Choose a size'}
              </button>

              {added && (
                <div className="pd-added">
                  ✓ Added to your cart.
                  <Link href="/store/checkout" className="pd-link">Go to checkout →</Link>
                </div>
              )}

              <ul className="pd-notes">
                <li>🚚 Delivery in Cairo &amp; Giza — {egp(70)}</li>
                <li>📍 Free pickup at Volume 7 Part 2 (Nov 22–28)</li>
                <li>💳 Pay by Instapay or Telda when you check out</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{STORE_STYLES + `
        .pd-link { color: var(--blue); font-weight: 700; }
        .pd-layout { display: grid; grid-template-columns: 1.1fr 1fr; gap: 3rem; align-items: start; }
        .pd-gallery { position: sticky; top: 88px; display: flex; flex-direction: column; gap: .75rem; }
        .pd-thumbs { display: flex; gap: .625rem; }
        .pd-thumb { width: 76px; aspect-ratio: 4 / 5; padding: 0; border: 2px solid transparent; border-radius: 10px; overflow: hidden; background: var(--gray-100); cursor: pointer; }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pd-thumb--active { border-color: var(--black); }
        .pd-media { aspect-ratio: 4 / 5; border-radius: 16px; overflow: hidden; background: var(--gray-100); }
        .pd-photo { width: 100%; height: 100%; object-fit: cover; display: flex; }
        .pd-info { display: flex; flex-direction: column; gap: 1.25rem; }
        .pd-name { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 900; letter-spacing: -.02em; line-height: 1.15; }
        .pd-price { font-size: 1.25rem; }
        .pd-price .st-badge { font-size: .6875rem; }
        .pd-desc { color: var(--gray-600); line-height: 1.7; }
        .pd-field { display: flex; flex-direction: column; gap: .5rem; }
        .pd-label { font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--gray-600); }
        .pd-sizes { display: flex; gap: .5rem; flex-wrap: wrap; }
        .pd-size { min-width: 56px; padding: .65rem 1rem; border: 1.5px solid var(--gray-200); border-radius: 8px; background: var(--white); font-family: var(--font); font-size: .9375rem; font-weight: 700; color: var(--black); cursor: pointer; transition: border-color .15s, background .15s; }
        .pd-size:hover:not(:disabled) { border-color: var(--black); }
        .pd-size--active { background: var(--black); border-color: var(--black); color: var(--white); }
        .pd-size:disabled { color: var(--gray-400); text-decoration: line-through; cursor: not-allowed; background: var(--gray-50); }
        .pd-stock { font-size: .8125rem; font-weight: 700; color: var(--red); }
        .pd-qty { display: inline-flex; align-items: center; border: 1.5px solid var(--gray-200); border-radius: 8px; width: fit-content; }
        .pd-qty button { width: 42px; height: 42px; border: none; background: none; font-size: 1.125rem; cursor: pointer; color: var(--black); }
        .pd-qty span { min-width: 32px; text-align: center; font-weight: 800; }
        .pd-added { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; background: rgba(45,155,111,.08); border: 1px solid rgba(45,155,111,.25); color: var(--green); font-weight: 700; font-size: .875rem; padding: .75rem 1rem; border-radius: 10px; }
        .pd-notes { list-style: none; display: flex; flex-direction: column; gap: .5rem; padding-top: 1.25rem; border-top: 1px solid var(--gray-200); font-size: .875rem; color: var(--gray-600); font-weight: 600; }

        @media (max-width: 800px) {
          .pd-layout { grid-template-columns: 1fr; gap: 1.5rem; }
          .pd-gallery { position: static; }
        }
      `}</style>
    </main>
  );
}
