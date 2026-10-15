'use client';

import Link from 'next/link';

export default function AdminLanding() {
  return (
    <main className="al-root">
      <div className="al-inner">
        <img src="/logo.png" alt="NCIMUN" className="al-logo" />
        <h1 className="al-title">Admin Dashboard</h1>
        <p className="al-sub">NCIMUN Volume 7 — Select a conference week</p>

        <div className="al-grid">
          <Link href="/admin-bazisthebest/week1" className="al-card">
            <span className="al-week">Week 1</span>
            <span className="al-label">Part 1 Dashboard</span>
            <span className="al-arrow">→</span>
          </Link>
          <Link href="/admin-bazisthebest/week2" className="al-card">
            <span className="al-week">Week 2</span>
            <span className="al-label">Part 2 Dashboard</span>
            <span className="al-arrow">→</span>
          </Link>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif; background: #23272A; }

        .al-root {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 2rem;
        }
        .al-inner { text-align: center; }
        .al-logo { height: 44px; margin-bottom: 2rem; }
        .al-title {
          font-size: 2.25rem; font-weight: 900; color: #fff;
          letter-spacing: -.02em; margin-bottom: .5rem;
        }
        .al-sub { font-size: .9375rem; color: rgba(255,255,255,.45); margin-bottom: 2.5rem; }

        .al-grid { display: flex; gap: 1.25rem; justify-content: center; flex-wrap: wrap; }

        .al-card {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: .5rem; padding: 2rem 2.5rem;
          background: rgba(255,255,255,.05);
          border: 1.5px solid rgba(255,255,255,.1);
          border-radius: 16px; width: 220px;
          text-decoration: none;
          transition: background .15s, border-color .15s, transform .15s;
        }
        .al-card:hover {
          background: rgba(95,150,202,.12);
          border-color: #5F96CA;
          transform: translateY(-2px);
        }
        .al-week {
          font-size: 1.75rem; font-weight: 900; color: #fff; line-height: 1;
        }
        .al-label { font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.5); }
        .al-arrow { font-size: 1.25rem; color: #5F96CA; margin-top: .5rem; }
      `}</style>
    </main>
  );
}