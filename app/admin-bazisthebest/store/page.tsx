'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Order = {
  order_id: number;
  created_at: string;
  status: string;
  delegate_id: string;
  delegate_name: string;
  delegate_phone: string | null;
  items: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  receipt_url: string | null;
  fulfilment: 'pickup' | 'delivery';
  recipient_name: string | null;
  delivery_phone: string | null;
  governorate: string | null;
  address: string | null;
};

type StockRow = { product: string; size: string; remaining: number | null; sold: number };

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  ready: 'Ready',
  delivered: 'Delivered',
  flagged: 'Flagged',
  cancelled: 'Cancelled',
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); // BOM so Excel reads Arabic correctly
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function AdminStorePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterFulfilment, setFilterFulfilment] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin-store', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) setError(json.error || 'Could not load orders.');
    else {
      setOrders(json.orders);
      setStock(json.stock);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (orderId: number, body: { action: string; status?: string }) => {
    setBusy(orderId);
    const res = await fetch('/api/admin-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...body }),
    });
    if (!res.ok) alert((await res.json()).error || 'Action failed.');
    await load();
    setBusy(null);
  };

  const handleCancel = (o: Order) => {
    if (confirm(`Cancel order #${o.order_id} for ${o.delegate_name}? The items go back into stock.`)) {
      act(o.order_id, { action: 'cancel' });
    }
  };

  const live = orders.filter(o => o.status !== 'cancelled');
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const toFulfil = live.filter(o => o.status === 'paid').length;

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || [o.delegate_name, o.delegate_id, String(o.order_id), o.delegate_phone, o.delivery_phone]
      .some(v => v?.toLowerCase().includes(q));
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? o.status !== 'cancelled' : o.status === filterStatus);
    const matchFulfilment = filterFulfilment === 'all' || o.fulfilment === filterFulfilment;
    return matchSearch && matchStatus && matchFulfilment;
  });

  const exportDelivery = () => downloadCsv(`ncimun-store-delivery-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Order', 'Recipient', 'Phone', 'Governorate', 'Address', 'Items', 'Total paid (EGP)', 'Status'],
    ...live.filter(o => o.fulfilment === 'delivery').map(o => [o.order_id, o.recipient_name, o.delivery_phone, o.governorate, o.address, o.items, o.total, STATUS_LABELS[o.status]]),
  ]);

  const exportPickup = () => downloadCsv(`ncimun-store-pickup-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Order', 'Delegate ID', 'Name', 'Phone', 'Items', 'Status'],
    ...live.filter(o => o.fulfilment === 'pickup')
      .sort((a, b) => a.delegate_name.localeCompare(b.delegate_name))
      .map(o => [o.order_id, o.delegate_id, o.delegate_name, o.delegate_phone, o.items, STATUS_LABELS[o.status]]),
  ]);

  if (loading && orders.length === 0) {
    return <main className="ad-root"><div className="ad-loading">Loading store orders…</div><style>{STYLES}</style></main>;
  }

  return (
    <main className="ad-root">
      <header className="ad-header">
        <div className="ad-header-left">
          <img src="/logo.png" alt="NCIMUN" className="ad-logo" />
          <div>
            <h1 className="ad-title">Store Dashboard</h1>
            <p className="ad-subtitle"><Link href="/admin-bazisthebest">Admin</Link> / Store orders</p>
          </div>
        </div>
        <button className="ad-refresh" onClick={load}>↻ Refresh</button>
      </header>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-stats">
        <div className="ad-stat">
          <span className="ad-stat-number">{live.length}</span>
          <span className="ad-stat-label">Orders</span>
        </div>
        <div className="ad-stat ad-stat--green">
          <span className="ad-stat-number">{revenue.toLocaleString()}</span>
          <span className="ad-stat-label">Revenue (EGP)</span>
        </div>
        <div className="ad-stat ad-stat--yellow">
          <span className="ad-stat-number">{toFulfil}</span>
          <span className="ad-stat-label">To prepare</span>
        </div>
        <div className="ad-stat">
          <span className="ad-stat-number">{live.filter(o => o.fulfilment === 'delivery').length}</span>
          <span className="ad-stat-label">Deliveries</span>
        </div>
      </div>

      <div className="ad-card">
        <h2 className="ad-card-title">Stock</h2>
        <div className="ad-stock">
          {stock.map(s => (
            <div key={`${s.product}-${s.size}`} className={`ad-stock-item ${s.remaining !== null && s.remaining <= 5 ? 'ad-stock-item--low' : ''}`}>
              <span className="ad-stock-name">{s.product.replace('NCIMUN ', '')} · {s.size}</span>
              <span className="ad-stock-left">{s.remaining ?? '∞'} left</span>
              <span className="ad-stock-sold">{s.sold} sold</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-table-header">
          <h2 className="ad-card-title ad-card-title--flush">Orders</h2>
          <div className="ad-table-controls">
            <input className="ad-search" placeholder="Search name, ID, phone or order #" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="ad-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="active">All except cancelled</option>
              <option value="all">All</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="ad-filter" value={filterFulfilment} onChange={e => setFilterFulfilment(e.target.value)}>
              <option value="all">Pickup & delivery</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
            <button className="ad-export" onClick={exportDelivery}>⬇ Delivery list (Bosta)</button>
            <button className="ad-export" onClick={exportPickup}>⬇ Pickup list</button>
          </div>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Delegate</th>
                <th>Items</th>
                <th>Total</th>
                <th>Receipt</th>
                <th>Fulfilment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="ad-empty-row">{orders.length === 0 ? 'No orders yet.' : 'No orders match these filters.'}</td></tr>
              ) : filtered.map(o => (
                <tr key={o.order_id} className={`ad-row ${o.status === 'flagged' ? 'ad-row--flagged' : ''} ${o.status === 'cancelled' ? 'ad-row--cancelled' : ''}`}>
                  <td>
                    <span className="ad-cell-id">#{o.order_id}</span>
                    <span className="ad-cell-sub">{formatDateTime(o.created_at)}</span>
                  </td>
                  <td>
                    <span className="ad-cell-main">{o.delegate_name}</span>
                    <span className="ad-cell-sub">{o.delegate_id} · {o.delegate_phone}</span>
                  </td>
                  <td className="ad-cell-items">{o.items}</td>
                  <td>
                    <span className="ad-cell-main">{o.total.toLocaleString()} EGP</span>
                    <span className="ad-cell-sub">{o.payment_method === 'instapay' ? 'Instapay' : 'Telda'}{o.delivery_fee ? ` · incl. ${o.delivery_fee} delivery` : ''}</span>
                  </td>
                  <td>{o.receipt_url ? <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="ad-link">View</a> : '—'}</td>
                  <td>
                    {o.fulfilment === 'pickup' ? (
                      <span className="ad-cell-main">📍 Pickup</span>
                    ) : (
                      <>
                        <span className="ad-cell-main">🚚 {o.governorate}</span>
                        <span className="ad-cell-sub">{o.recipient_name} · {o.delivery_phone}</span>
                        <span className="ad-cell-sub ad-cell-address">{o.address}</span>
                      </>
                    )}
                  </td>
                  <td>
                    {o.status === 'cancelled' ? (
                      <span className="ad-badge ad-badge--cancelled">Cancelled</span>
                    ) : (
                      <select
                        className={`ad-status ad-status--${o.status}`}
                        value={o.status}
                        disabled={busy === o.order_id}
                        onChange={e => act(o.order_id, { action: 'status', status: e.target.value })}
                      >
                        {['paid', 'ready', 'delivered', 'flagged'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    )}
                  </td>
                  <td>
                    {o.status !== 'cancelled' && (
                      <button className="ad-cancel-btn" disabled={busy === o.order_id} onClick={() => handleCancel(o)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{STYLES}</style>
    </main>
  );
}

const STYLES = `
  :root {
    --blue:   #5F96CA;
    --black:  #23272A;
    --white:  #FFFFFF;
    --gray-50:  #F8F9FA;
    --gray-200: #E9ECEF;
    --gray-400: #ADB5BD;
    --gray-600: #6C757D;
    --green:  #2D9B6F;
    --red:    #E5534B;
    --yellow: #8a7a00;
    --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
  a { text-decoration: none; color: inherit; }

  .ad-root { max-width: 1400px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .ad-loading { text-align: center; padding: 6rem; color: var(--gray-400); }
  .ad-error { background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.3); color: var(--red); font-weight: 700; font-size: .875rem; padding: .75rem 1rem; border-radius: 10px; }

  .ad-header { display: flex; align-items: center; justify-content: space-between; background: var(--black); border-radius: 14px; padding: 1.5rem 2rem; }
  .ad-header-left { display: flex; align-items: center; gap: 1rem; }
  .ad-logo { height: 40px; }
  .ad-title { font-size: 1.25rem; font-weight: 900; color: var(--white); }
  .ad-subtitle { font-size: .8125rem; color: rgba(255,255,255,.5); margin-top: .1rem; }
  .ad-subtitle a:hover { color: var(--white); }
  .ad-refresh { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.15); border-radius: 8px; padding: .5rem 1rem; font-family: var(--font); font-size: .875rem; cursor: pointer; }
  .ad-refresh:hover { background: rgba(255,255,255,.15); }

  .ad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .ad-stat { background: var(--white); border-radius: 12px; padding: 1.5rem; border: 1.5px solid var(--gray-200); text-align: center; }
  .ad-stat-number { display: block; font-size: 2.25rem; font-weight: 900; color: var(--blue); }
  .ad-stat--green .ad-stat-number { color: var(--green); }
  .ad-stat--yellow .ad-stat-number { color: var(--yellow); }
  .ad-stat-label { display: block; font-size: .75rem; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: .08em; margin-top: .25rem; }

  .ad-card { background: var(--white); border-radius: 14px; border: 1.5px solid var(--gray-200); padding: 1.5rem; }
  .ad-card-title { font-size: .9375rem; font-weight: 800; margin-bottom: 1.25rem; }
  .ad-card-title--flush { margin-bottom: 0; }

  .ad-stock { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: .75rem; }
  .ad-stock-item { display: flex; flex-direction: column; gap: .15rem; padding: .875rem 1rem; background: var(--gray-50); border-radius: 10px; border: 1.5px solid transparent; }
  .ad-stock-item--low { border-color: rgba(229,83,75,.4); background: rgba(229,83,75,.05); }
  .ad-stock-name { font-size: .8125rem; font-weight: 800; }
  .ad-stock-left { font-size: 1.25rem; font-weight: 900; color: var(--blue); }
  .ad-stock-item--low .ad-stock-left { color: var(--red); }
  .ad-stock-sold { font-size: .75rem; font-weight: 600; color: var(--gray-600); }

  .ad-table-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; }
  .ad-table-controls { display: flex; gap: .75rem; flex-wrap: wrap; }
  .ad-search, .ad-filter { padding: .5rem .875rem; border: 1.5px solid var(--gray-200); border-radius: 8px; font-family: var(--font); font-size: .875rem; color: var(--black); background: var(--white); outline: none; }
  .ad-search { min-width: 260px; }
  .ad-search:focus, .ad-filter:focus { border-color: var(--blue); }
  .ad-export { padding: .5rem .875rem; border: 1.5px solid var(--black); border-radius: 8px; background: var(--white); font-family: var(--font); font-size: .8125rem; font-weight: 700; cursor: pointer; }
  .ad-export:hover { background: var(--black); color: var(--white); }

  .ad-table-wrap { overflow-x: auto; }
  .ad-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
  .ad-table th { text-align: left; padding: .625rem .875rem; font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--gray-600); border-bottom: 2px solid var(--gray-200); white-space: nowrap; }
  .ad-table td { padding: .75rem .875rem; border-bottom: 1px solid var(--gray-200); vertical-align: top; }
  .ad-row:hover td { background: var(--gray-50); }
  .ad-row--flagged td { background: rgba(229,83,75,.04); }
  .ad-row--cancelled td { opacity: .5; }
  .ad-empty-row { text-align: center; color: var(--gray-400); padding: 2rem; }
  .ad-cell-id { display: block; font-weight: 800; color: var(--blue); }
  .ad-cell-main { display: block; font-weight: 700; }
  .ad-cell-sub { display: block; font-size: .75rem; color: var(--gray-600); margin-top: .1rem; }
  .ad-cell-address { max-width: 240px; white-space: normal; }
  .ad-cell-items { min-width: 180px; font-weight: 600; }
  .ad-link { color: var(--blue); font-weight: 700; }
  .ad-link:hover { text-decoration: underline; }

  .ad-badge { font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: .25rem .625rem; border-radius: 999px; display: inline-block; }
  .ad-badge--cancelled { background: var(--gray-200); color: var(--gray-600); }
  .ad-status { padding: .3rem .5rem; border-radius: 6px; border: 1.5px solid var(--gray-200); font-family: var(--font); font-size: .75rem; font-weight: 700; cursor: pointer; background: var(--white); }
  .ad-status--paid { color: var(--yellow); border-color: rgba(138,122,0,.3); }
  .ad-status--ready { color: var(--blue); border-color: rgba(95,150,202,.4); }
  .ad-status--delivered { color: var(--green); border-color: rgba(45,155,111,.4); }
  .ad-status--flagged { color: var(--red); border-color: rgba(229,83,75,.4); }
  .ad-cancel-btn { background: none; border: 1px solid rgba(229,83,75,.25); color: var(--red); border-radius: 6px; padding: .3rem .75rem; font-family: var(--font); font-size: .75rem; font-weight: 700; cursor: pointer; }
  .ad-cancel-btn:hover { background: rgba(229,83,75,.08); }

  @media (max-width: 900px) { .ad-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .ad-root { padding: 1rem; } .ad-search { min-width: 0; width: 100%; } }
`;
