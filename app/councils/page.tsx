'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Council = {
  id: number;
  name: string;
  abbreviation: string | null;
  description: string | null;
};

export default function CouncilsPage() {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Get summer camp conference id
      const { data: conf } = await supabase
        .from('conferences')
        .select('id')
        .eq('slug', 'summer-camp-2026')
        .single();

      if (!conf) { setLoading(false); return; }

      // Get councils linked to summer camp only
      const { data } = await supabase
        .from('conference_councils')
        .select('councils(id, name, abbreviation, description)')
        .eq('conference_id', conf.id)
        .order('id');

      if (data) setCouncils(data.map((d: any) => d.councils).filter(Boolean));
      setLoading(false);
    };
    load();
  }, []);

  const colors = [
    { bg: 'rgba(95,150,202,.08)', border: '#5F96CA', text: '#5F96CA' },
    { bg: 'rgba(132,219,213,.08)', border: '#84DBD5', text: '#2D9B6F' },
    { bg: 'rgba(141,148,201,.08)', border: '#8D94C9', text: '#8D94C9' },
    { bg: 'rgba(248,233,141,.15)', border: '#F8E98D', text: '#8a7a00' },
    { bg: 'rgba(95,150,202,.08)', border: '#5F96CA', text: '#5F96CA' },
  ];

  return (
    <main className="co-root">
      {/* ── Nav ── */}
      <nav className="co-nav">
        <div className="co-nav-inner">
          <Link href="/">
            <img src="/logo.png" alt="NCIMUN" className="co-nav-logo" />
          </Link>
          <Link href="/" className="co-nav-back">← Back to homepage</Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="co-header">
        <div className="co-header-inner">
          <p className="co-eyebrow">NCIMUN Summer Camp 2026</p>
          <h1 className="co-title">Councils</h1>
          <p className="co-subtitle">
            This summer, five unique councils tackle some of the most thought-provoking issues
            ever debated at NCIMUN. From zombie apocalypses to golden billions —
            which side will you represent?
          </p>
        </div>
      </div>

      {/* ── Councils ── */}
      <div className="co-container">
        {loading ? (
          <div className="co-loading">Loading councils…</div>
        ) : (
          <div className="co-grid">
            {councils.map((council, i) => {
              const color = colors[i % colors.length];
              return (
                <div key={council.id} className="co-card" style={{ borderColor: color.border, background: color.bg }}>
                  <div className="co-card-top">
                    {council.abbreviation && (
                      <span className="co-abbr" style={{ color: color.text, borderColor: color.border }}>
                        {council.abbreviation}
                      </span>
                    )}
                    <span className="co-number" style={{ color: color.text }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h2 className="co-card-title">{council.name}</h2>
                  {council.description && (
                    <p className="co-card-desc">{council.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="co-cta">
          <p className="co-cta-text">Ready to represent your position?</p>
          <Link href="/conferences" className="co-btn-primary">Register for a conference →</Link>
        </div>
      </div>

      <style>{`
        :root {
          --blue:   #5F96CA;
          --aqua:   #84DBD5;
          --black:  #23272A;
          --white:  #FFFFFF;
          --gray-50:  #F8F9FA;
          --gray-200: #E9ECEF;
          --gray-400: #ADB5BD;
          --gray-600: #6C757D;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        /* Nav */
        .co-nav {
          background: var(--white); border-bottom: 1px solid var(--gray-200);
          position: sticky; top: 0; z-index: 100;
        }
        .co-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .co-nav-logo { height: 36px; display: block; }
        .co-nav-back { font-size: .875rem; font-weight: 600; color: var(--gray-600); transition: color .15s; }
        .co-nav-back:hover { color: var(--black); }

        /* Header */
        .co-header { background: var(--black); padding: 5rem 2rem; }
        .co-header-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .co-eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--aqua); margin-bottom: .75rem; display: block;
        }
        .co-title {
          font-size: clamp(2.5rem, 8vw, 5rem); font-weight: 900;
          color: var(--white); letter-spacing: -.02em; margin-bottom: 1rem;
        }
        .co-subtitle {
          font-size: 1rem; color: rgba(255,255,255,.6); line-height: 1.7; max-width: 520px; margin: 0 auto;
        }

        /* Container */
        .co-container { max-width: 1100px; margin: 0 auto; padding: 4rem 2rem 6rem; }
        .co-loading { text-align: center; padding: 4rem; color: var(--gray-400); }

        /* Grid */
        .co-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 3rem; }

        .co-card {
          border: 1.5px solid; border-radius: 14px;
          padding: 1.75rem; display: flex; flex-direction: column; gap: 1rem;
          transition: box-shadow .15s, transform .15s;
        }
        .co-card:hover { box-shadow: 0 8px 30px rgba(35,39,42,.1); transform: translateY(-2px); }

        .co-card-top { display: flex; justify-content: space-between; align-items: center; }
        .co-abbr {
          font-size: .75rem; font-weight: 800; letter-spacing: .1em;
          text-transform: uppercase; border: 1.5px solid;
          padding: .25rem .75rem; border-radius: 999px;
        }
        .co-number { font-size: 2rem; font-weight: 900; opacity: .25; }

        .co-card-title { font-size: 1.0625rem; font-weight: 800; color: var(--black); line-height: 1.3; }
        .co-card-desc { font-size: .875rem; color: var(--gray-600); line-height: 1.65; flex: 1; }

        /* CTA */
        .co-cta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap;
          background: var(--black); border-radius: 14px; padding: 2rem 2.5rem;
        }
        .co-cta-text { font-size: 1.125rem; font-weight: 700; color: var(--white); }
        .co-btn-primary {
          background: var(--blue); color: var(--white);
          padding: .75rem 1.75rem; border-radius: 8px;
          font-size: .9375rem; font-weight: 700; font-family: var(--font);
          display: inline-block; transition: opacity .15s; white-space: nowrap;
        }
        .co-btn-primary:hover { opacity: .88; }

        @media (max-width: 900px) { .co-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 580px) {
          .co-grid { grid-template-columns: 1fr; }
          .co-container { padding: 3rem 1rem 5rem; }
          .co-cta { flex-direction: column; text-align: center; }
        }
      `}</style>
    </main>
  );
}