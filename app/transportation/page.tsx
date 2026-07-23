'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Route = {
  id: number;
  location_name: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  price: number | null;
  current_count: number;
  capacity: number | null;
};

export default function TransportationPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: conf } = await supabase
        .from('conferences')
        .select('id')
        .eq('slug', 'summer-camp-2026')
        .single();

      if (!conf) { setLoading(false); return; }

      const { data } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('conference_id', conf.id)
        .order('pickup_time');

      if (data) setRoutes(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main className="tr-root">
      {/* ── Nav ── */}
      <nav className="tr-nav">
        <div className="tr-nav-inner">
          <Link href="/">
            <img src="/logo.png" alt="NCIMUN" className="tr-nav-logo" />
          </Link>
          <Link href="/" className="tr-nav-back">← Back to homepage</Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="tr-header">
        <div className="tr-header-inner">
          <p className="tr-eyebrow">NCIMUN Summer Camp 2026</p>
          <h1 className="tr-title">Transportation</h1>
          <p className="tr-subtitle">
            We offer bus pickup from several locations across Cairo.
            Select your preferred point when registering.
          </p>
        </div>
      </div>

      {/* ── Notice ── */}
      <div className="tr-container">
        <div className="tr-notice">
          <span className="tr-notice-icon">⚠️</span>
          <p>
            Transportation spots are subject to availability and delegate count.
            Points may be added, removed, or adjusted based on demand.
            Confirm your pickup location during registration — first come, first served.
          </p>
        </div>

        {/* ── Routes ── */}
        {loading ? (
          <div className="tr-loading">Loading routes…</div>
        ) : (
          <div className="tr-grid">
            {routes.map((route, i) => (
              <div key={route.id} className="tr-card">
                <div className="tr-card-number">{String(i + 1).padStart(2, '0')}</div>
                <div className="tr-card-body">
                  <h2 className="tr-card-location">{route.location_name}</h2>
                  <div className="tr-card-details">
                    <div className="tr-detail">
                      <span className="tr-detail-icon">🕐</span>
                      <div>
                        <span className="tr-detail-label">Pickup time</span>
                        <span className="tr-detail-value">
                          {route.pickup_time || 'TBD'} <strong>sharp</strong>
                        </span>
                      </div>
                    </div>
                    <div className="tr-detail">
                      <span className="tr-detail-icon">💰</span>
                      <div>
                        <span className="tr-detail-label">Price</span>
                        <span className="tr-detail-value">
                          {route.price === 0 ? 'Included' : route.price ? `${route.price.toLocaleString()} EGP` : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Important notes ── */}
        <div className="tr-notes">
          <h2 className="tr-notes-title">Important notes</h2>
          <ul className="tr-notes-list">
            <li>Be at your pickup point <strong>5 minutes early</strong> — buses will not wait.</li>
            <li>Transportation must be selected during registration and cannot be changed afterwards without contacting us.</li>
            <li>Pickup points marked as <strong>TBD</strong> will be confirmed before the conference starts.</li>
            {/* <li>Spots per route are limited and allocated on a first-come, first-served basis.</li> */}
            <li>For questions about transportation, contact us at <a href="mailto:ncimun.eg@gmail.com">ncimun.eg@gmail.com</a> or <a href="tel:01031623162">010 3162 3162</a>.</li>
          </ul>
        </div>

        <div className="tr-cta">
          <p className="tr-cta-text">Ready to secure your spot?</p>
          <Link href="/conferences" className="tr-btn-primary">Register for Summer Camp →</Link>
        </div>
      </div>

      <style>{`
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
          --yellow: #F8E98D;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        /* Nav */
        .tr-nav {
          background: var(--white); border-bottom: 1px solid var(--gray-200);
          position: sticky; top: 0; z-index: 100;
        }
        .tr-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .tr-nav-logo { height: 36px; display: block; }
        .tr-nav-back { font-size: .875rem; font-weight: 600; color: var(--gray-600); transition: color .15s; }
        .tr-nav-back:hover { color: var(--black); }

        /* Header */
        .tr-header { background: var(--black); padding: 5rem 2rem; }
        .tr-header-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .tr-eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--aqua); margin-bottom: .75rem; display: block;
        }
        .tr-title {
          font-size: clamp(2.5rem, 8vw, 5rem); font-weight: 900;
          color: var(--white); letter-spacing: -.02em; margin-bottom: 1rem;
        }
        .tr-subtitle {
          font-size: 1rem; color: rgba(255,255,255,.6); line-height: 1.7;
        }

        /* Container */
        .tr-container { max-width: 900px; margin: 0 auto; padding: 3rem 2rem 6rem; display: flex; flex-direction: column; gap: 2.5rem; }
        .tr-loading { text-align: center; padding: 4rem; color: var(--gray-400); }

        /* Notice */
        .tr-notice {
          display: flex; align-items: flex-start; gap: .875rem;
          background: rgba(248,233,141,.15); border: 1.5px solid rgba(248,233,141,.5);
          border-radius: 10px; padding: 1rem 1.25rem;
          font-size: .9rem; color: var(--black); line-height: 1.65;
        }
        .tr-notice-icon { font-size: 1.125rem; flex-shrink: 0; margin-top: .1rem; }

        /* Grid */
        .tr-grid { display: flex; flex-direction: column; gap: .875rem; }
        .tr-card {
          background: var(--white); border: 1.5px solid var(--gray-200);
          border-radius: 12px; padding: 1.5rem;
          display: flex; align-items: flex-start; gap: 1.25rem;
          transition: border-color .15s, box-shadow .15s;
        }
        .tr-card:hover { border-color: var(--blue); box-shadow: 0 4px 16px rgba(95,150,202,.1); }
        .tr-card-number {
          font-size: 1.5rem; font-weight: 900; color: var(--blue);
          opacity: .3; flex-shrink: 0; line-height: 1;
          margin-top: .2rem;
        }
        .tr-card-body { flex: 1; display: flex; flex-direction: column; gap: .875rem; }
        .tr-card-location { font-size: 1.0625rem; font-weight: 800; color: var(--black); }
        .tr-card-details { display: flex; gap: 2rem; flex-wrap: wrap; }
        .tr-detail { display: flex; align-items: flex-start; gap: .625rem; }
        .tr-detail-icon { font-size: 1rem; margin-top: .1rem; flex-shrink: 0; }
        .tr-detail-label { display: block; font-size: .7rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .15rem; }
        .tr-detail-value { display: block; font-size: .9rem; font-weight: 600; color: var(--black); }

        /* Notes */
        .tr-notes {
          background: var(--white); border: 1.5px solid var(--gray-200);
          border-radius: 12px; padding: 1.75rem;
        }
        .tr-notes-title { font-size: 1rem; font-weight: 800; margin-bottom: 1rem; }
        .tr-notes-list {
          display: flex; flex-direction: column; gap: .625rem;
          padding-left: 1.25rem;
        }
        .tr-notes-list li { font-size: .9rem; color: var(--gray-600); line-height: 1.6; }
        .tr-notes-list a { color: var(--blue); font-weight: 600; }
        .tr-notes-list a:hover { text-decoration: underline; }

        /* CTA */
        .tr-cta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap;
          background: var(--black); border-radius: 14px; padding: 2rem 2.5rem;
        }
        .tr-cta-text { font-size: 1.125rem; font-weight: 700; color: var(--white); }
        .tr-btn-primary {
          background: var(--blue); color: var(--white);
          padding: .75rem 1.75rem; border-radius: 8px;
          font-size: .9375rem; font-weight: 700; font-family: var(--font);
          display: inline-block; transition: opacity .15s; white-space: nowrap;
        }
        .tr-btn-primary:hover { opacity: .88; }

        @media (max-width: 600px) {
          .tr-container { padding: 2rem 1rem 5rem; }
          .tr-cta { flex-direction: column; text-align: center; }
          .tr-card-details { flex-direction: column; gap: .75rem; }
        }
      `}</style>
    </main>
  );
}