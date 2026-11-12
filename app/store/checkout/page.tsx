'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { DELIVERY_FEE, ProductImage, STORE_STYLES, egp, useCart } from '../shared';

type Profile = { id: string; delegate_id: string; first_name: string; last_name: string; phone: string | null };

export default function CheckoutPage() {
  const { items, setQuantity, clear, refresh, subtotal } = useCart();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [fulfilment, setFulfilment] = useState<'pickup' | 'delivery'>('pickup');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState<'Cairo' | 'Giza'>('Cairo');
  const [address, setAddress] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'telda' | ''>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<{ id: number; total: number; fulfilment: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('delegate_profiles')
          .select('id, delegate_id, first_name, last_name, phone')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setProfile(data);
          setName(`${data.first_name} ${data.last_name}`);
          setPhone(data.phone ?? '');
        }
      }
      setAuthChecked(true);
    };
    load();
  }, []);

  const variantKey = items.map(i => i.variantId).sort().join(',');
  useEffect(() => {
    if (!variantKey) return;
    supabase
      .from('store_variants')
      .select('id, store_products(slug, name, price, image_path)')
      .in('id', variantKey.split(',').map(Number))
      .then(({ data }) => {
        if (!data) return;
        const rows = data as unknown as { id: number; store_products: { slug: string; name: string; price: number; image_path: string | null } }[];
        refresh(new Map(rows.map(v => [v.id, {
          productSlug: v.store_products.slug,
          name: v.store_products.name,
          price: v.store_products.price,
          imagePath: v.store_products.image_path,
        }])));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantKey]);

  const deliveryFee = fulfilment === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const deliveryValid = fulfilment === 'pickup' || (name.trim() && phone.trim() && address.trim());
  const canSubmit = profile && items.length > 0 && deliveryValid && paymentMethod && screenshot && !submitting;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setScreenshot(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !profile || !screenshot) return;
    setSubmitting(true);
    setError('');

    try {
      const ext = screenshot.name.split('.').pop() || 'jpg';
      const { data: upload, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(`store/${profile.delegate_id}_${paymentMethod}_${Date.now()}.${ext}`, screenshot, {
          contentType: screenshot.type,
          upsert: false,
        });
      if (uploadError) throw new Error('Screenshot upload failed. Please try again.');

      // Prices, stock and the delivery fee are checked again by the database
      const { data: orderId, error: orderError } = await supabase.rpc('place_store_order', {
        p_items: items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
        p_fulfilment: fulfilment,
        p_recipient_name: name,
        p_phone: phone,
        p_governorate: fulfilment === 'delivery' ? governorate : null,
        p_address: address,
        p_payment_method: paymentMethod,
        p_payment_screenshot: upload.path,
      });
      if (orderError) throw new Error(orderError.message);

      setPlacedOrder({ id: orderId, total, fulfilment });
      clear();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <main>
        <div className="st-container">
          <div className="co-done">
            <div className="co-done-icon">✓</div>
            <h1 className="co-done-title">Order placed!</h1>
            <p className="co-done-text">
              Order <strong>#{placedOrder.id}</strong> · {egp(placedOrder.total)} paid.
              {placedOrder.fulfilment === 'pickup'
                ? ' Collect it at the merch desk during Volume 7 Part 2 (Nov 22–28).'
                : ' We’ll ship it to you with Bosta and message you when it’s on the way.'}
            </p>
            <div className="co-done-actions">
              <Link href="/profile" className="st-btn">View my orders</Link>
              <Link href="/store" className="co-link">Back to the store</Link>
            </div>
          </div>
        </div>
        <style>{STORE_STYLES + CHECKOUT_STYLES}</style>
      </main>
    );
  }

  return (
    <main>
      <div className="st-bar">
        <div className="st-bar-inner">
          <span className="st-crumbs"><Link href="/store">Store</Link> / Checkout</span>
        </div>
      </div>

      <div className="st-container">
        <h1 className="co-title">Checkout</h1>

        {items.length === 0 ? (
          <div className="co-empty">
            <p>Your cart is empty.</p>
            <Link href="/store" className="st-btn">Browse the store</Link>
          </div>
        ) : (
          <form className="co-layout" onSubmit={handleSubmit}>
            <div className="co-main">
              {/* Cart */}
              <section className="co-card">
                <h2 className="co-card-title">Your cart</h2>
                {items.map(i => (
                  <div key={i.variantId} className="co-item">
                    <div className="co-item-img">
                      <ProductImage product={{ name: i.name, image_path: i.imagePath, slug: i.productSlug }} className="co-item-photo" />
                    </div>
                    <div className="co-item-info">
                      <span className="co-item-name">{i.name}</span>
                      <span className="co-item-meta">Size {i.size} · {egp(i.price)}</span>
                      <div className="co-qty">
                        <button type="button" onClick={() => setQuantity(i.variantId, i.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span>{i.quantity}</span>
                        <button type="button" onClick={() => setQuantity(i.variantId, i.quantity + 1)} aria-label="Increase quantity">+</button>
                        <button type="button" className="co-remove" onClick={() => setQuantity(i.variantId, 0)}>Remove</button>
                      </div>
                    </div>
                    <span className="co-item-total">{egp(i.price * i.quantity)}</span>
                  </div>
                ))}
              </section>

              {!authChecked ? null : !profile ? (
                <section className="co-card co-login">
                  <h2 className="co-card-title">Log in to order</h2>
                  <p className="co-muted">The store is for NCIMUN delegates. Log in with your delegate account to check out — your cart will still be here.</p>
                  <div className="co-login-actions">
                    <Link href="/login?next=/store/checkout" className="st-btn">Log in</Link>
                    <Link href="/register" className="co-link">Create an account</Link>
                  </div>
                </section>
              ) : (
                <>
                  {/* Fulfilment */}
                  <section className="co-card">
                    <h2 className="co-card-title">How do you want it?</h2>
                    <div className="co-options">
                      <button type="button" className={`co-option ${fulfilment === 'pickup' ? 'co-option--active' : ''}`} onClick={() => setFulfilment('pickup')}>
                        <span className="co-option-title">📍 Pick up · Free</span>
                        <span className="co-option-desc">At the venue during Volume 7 Part 2 (Nov 22–28)</span>
                      </button>
                      <button type="button" className={`co-option ${fulfilment === 'delivery' ? 'co-option--active' : ''}`} onClick={() => setFulfilment('delivery')}>
                        <span className="co-option-title">🚚 Delivery · {egp(DELIVERY_FEE)}</span>
                        <span className="co-option-desc">Shipped with Bosta to Cairo &amp; Giza</span>
                      </button>
                    </div>

                    {fulfilment === 'delivery' && (
                      <div className="co-fields">
                        <label className="co-field">
                          <span className="co-label">Recipient name</span>
                          <input className="co-input" value={name} onChange={e => setName(e.target.value)} required />
                        </label>
                        <label className="co-field">
                          <span className="co-label">Phone</span>
                          <input className="co-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </label>
                        <label className="co-field">
                          <span className="co-label">Governorate</span>
                          <select className="co-input" value={governorate} onChange={e => setGovernorate(e.target.value as 'Cairo' | 'Giza')}>
                            <option value="Cairo">Cairo</option>
                            <option value="Giza">Giza</option>
                          </select>
                        </label>
                        <label className="co-field co-field--full">
                          <span className="co-label">Full address</span>
                          <textarea className="co-input" rows={3} value={address} onChange={e => setAddress(e.target.value)} placeholder="Area, street, building, floor, apartment" required />
                        </label>
                      </div>
                    )}
                  </section>

                  {/* Payment */}
                  <section className="co-card">
                    <h2 className="co-card-title">Payment</h2>
                    <p className="co-muted">Send <strong>{egp(total)}</strong> using one of these, then upload a screenshot of the receipt.</p>
                    <div className="co-pay-methods">
                      <div className="co-pay-method">
                        <span>📱 Instapay</span>
                        <a href="https://ipn.eg/S/ncimun/instapay/06DDhz" target="_blank" rel="noopener noreferrer" className="co-link">Pay via Instapay →</a>
                      </div>
                      <div className="co-pay-method">
                        <span>💳 Telda</span>
                        <span className="co-pay-handle">ahmedelbaz21</span>
                      </div>
                    </div>

                    <span className="co-label">Method used</span>
                    <div className="co-options co-options--tight">
                      <button type="button" className={`co-option ${paymentMethod === 'instapay' ? 'co-option--active' : ''}`} onClick={() => setPaymentMethod('instapay')}>📱 Instapay</button>
                      <button type="button" className={`co-option ${paymentMethod === 'telda' ? 'co-option--active' : ''}`} onClick={() => setPaymentMethod('telda')}>💳 Telda</button>
                    </div>

                    <span className="co-label">Payment screenshot</span>
                    <label className="co-upload">
                      <input type="file" accept="image/*" onChange={handleFile} />
                      {preview ? <img src={preview} alt="Payment screenshot" /> : <span>📷 Click to upload the receipt screenshot</span>}
                    </label>
                  </section>
                </>
              )}
            </div>

            {/* Summary */}
            <aside className="co-summary">
              <h2 className="co-card-title">Order summary</h2>
              <div className="co-row"><span>Subtotal</span><span>{egp(subtotal)}</span></div>
              <div className="co-row"><span>{fulfilment === 'delivery' ? `Delivery (${governorate})` : 'Pickup'}</span><span>{deliveryFee ? egp(deliveryFee) : 'Free'}</span></div>
              <div className="co-row co-row--total"><span>Total</span><span>{egp(total)}</span></div>
              {error && <div className="co-error">{error}</div>}
              <button type="submit" className="st-btn st-btn--block" disabled={!canSubmit}>
                {submitting ? 'Placing order…' : `Place order · ${egp(total)}`}
              </button>
              {profile && !canSubmit && !submitting && (
                <p className="co-hint">
                  {!deliveryValid ? 'Fill in your delivery details.' : !paymentMethod ? 'Choose the payment method you used.' : !screenshot ? 'Upload your payment screenshot.' : ''}
                </p>
              )}
            </aside>
          </form>
        )}
      </div>

      <style>{STORE_STYLES + CHECKOUT_STYLES}</style>
    </main>
  );
}

const CHECKOUT_STYLES = `
  .co-title { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 900; letter-spacing: -.02em; margin-bottom: 1.5rem; }
  .co-link { color: var(--blue); font-weight: 700; font-size: .875rem; }
  .co-muted { color: var(--gray-600); font-size: .875rem; line-height: 1.6; }
  .co-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 1rem; color: var(--gray-600); border: 1.5px dashed var(--gray-200); border-radius: 14px; }

  .co-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }
  .co-main { display: flex; flex-direction: column; gap: 1.25rem; }
  .co-card { border: 1.5px solid var(--gray-200); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .co-card-title { font-size: 1rem; font-weight: 800; }

  .co-item { display: grid; grid-template-columns: 72px 1fr auto; gap: 1rem; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--gray-100); }
  .co-item:last-child { border-bottom: none; padding-bottom: 0; }
  .co-item-img { width: 72px; height: 88px; border-radius: 10px; overflow: hidden; background: var(--gray-100); }
  .co-item-photo { width: 100%; height: 100%; object-fit: cover; display: flex; }
  .co-item-info { display: flex; flex-direction: column; gap: .3rem; }
  .co-item-name { font-weight: 800; }
  .co-item-meta { font-size: .8125rem; color: var(--gray-600); font-weight: 600; }
  .co-item-total { font-weight: 800; }
  .co-qty { display: flex; align-items: center; gap: .25rem; }
  .co-qty button { width: 28px; height: 28px; border: 1.5px solid var(--gray-200); border-radius: 6px; background: var(--white); cursor: pointer; font-size: .9375rem; color: var(--black); }
  .co-qty span { min-width: 24px; text-align: center; font-weight: 800; font-size: .875rem; }
  .co-qty .co-remove { width: auto; border: none; color: var(--gray-400); font-size: .75rem; font-weight: 700; padding: 0 .5rem; font-family: var(--font); }
  .co-qty .co-remove:hover { color: var(--red); }

  .co-login-actions { display: flex; align-items: center; gap: 1rem; }

  .co-options { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .co-options--tight { margin-bottom: .5rem; }
  .co-option { display: flex; flex-direction: column; gap: .25rem; text-align: left; padding: .875rem 1rem; border: 1.5px solid var(--gray-200); border-radius: 10px; background: var(--white); cursor: pointer; font-family: var(--font); font-size: .875rem; font-weight: 700; color: var(--black); transition: border-color .15s; }
  .co-option:hover { border-color: var(--gray-400); }
  .co-option--active { border-color: var(--black); box-shadow: inset 0 0 0 1px var(--black); }
  .co-option-title { font-weight: 800; }
  .co-option-desc { font-size: .75rem; color: var(--gray-600); font-weight: 600; }

  .co-fields { display: grid; grid-template-columns: 1fr 1fr; gap: .875rem; }
  .co-field { display: flex; flex-direction: column; gap: .35rem; }
  .co-field--full { grid-column: 1 / -1; }
  .co-label { font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--gray-600); }
  .co-input { width: 100%; padding: .65rem .875rem; border: 1.5px solid var(--gray-200); border-radius: 8px; font-family: var(--font); font-size: .9375rem; color: var(--black); background: var(--white); outline: none; resize: vertical; }
  .co-input:focus { border-color: var(--blue); }

  .co-pay-methods { display: flex; flex-direction: column; gap: .5rem; background: var(--gray-50); border-radius: 10px; padding: .875rem 1rem; }
  .co-pay-method { display: flex; justify-content: space-between; align-items: center; font-size: .875rem; font-weight: 700; }
  .co-pay-handle { font-family: ui-monospace, monospace; color: var(--blue); }
  .co-upload { display: flex; align-items: center; justify-content: center; min-height: 110px; border: 1.5px dashed var(--gray-400); border-radius: 10px; cursor: pointer; color: var(--gray-600); font-size: .875rem; font-weight: 600; overflow: hidden; }
  .co-upload input { display: none; }
  .co-upload img { max-height: 220px; max-width: 100%; display: block; }

  .co-summary { position: sticky; top: 88px; border: 1.5px solid var(--gray-200); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: .875rem; background: var(--gray-50); }
  .co-row { display: flex; justify-content: space-between; font-size: .9375rem; font-weight: 600; }
  .co-row--total { padding-top: .875rem; border-top: 1px solid var(--gray-200); font-size: 1.125rem; font-weight: 900; }
  .co-error { background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.3); color: var(--red); font-size: .8125rem; font-weight: 700; padding: .65rem .875rem; border-radius: 8px; }
  .co-hint { font-size: .75rem; color: var(--gray-600); text-align: center; }

  .co-done { max-width: 520px; margin: 2rem auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .co-done-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(45,155,111,.12); color: var(--green); font-size: 1.75rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
  .co-done-title { font-size: 2rem; font-weight: 900; }
  .co-done-text { color: var(--gray-600); line-height: 1.7; }
  .co-done-actions { display: flex; align-items: center; gap: 1.25rem; margin-top: .5rem; }

  @media (max-width: 860px) {
    .co-layout { grid-template-columns: 1fr; }
    .co-summary { position: static; }
  }
  @media (max-width: 560px) {
    .co-options, .co-fields { grid-template-columns: 1fr; }
    .co-card { padding: 1.125rem; }
  }
`;
