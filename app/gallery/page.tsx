import Link from 'next/link';
import Image from 'next/image';

export default function ComingSoonPage() {
  return (
    <main className="cs-root">
      <div className="cs-card">
        <Image src="/logo.png" alt="NCIMUN" width={80} height={80} className="cs-logo" />
        <div className="cs-badge">Coming soon</div>
        <h1 className="cs-title">We're working on it</h1>
        <p className="cs-desc">
          This page is currently under construction. Check back soon — we're building something great.
        </p>
        <Link href="/" className="cs-btn">← Back to homepage</Link>
      </div>

      <style>{`
        :root {
          --blue:  #5F96CA;
          --aqua:  #84DBD5;
          --black: #23272A;
          --white: #FFFFFF;
          --gray-50:  #F8F9FA;
          --gray-200: #E9ECEF;
          --gray-600: #6C757D;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--black); color: var(--white); }
        a { text-decoration: none; }

        .cs-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem;
          background: var(--black);
        }

        .cs-card {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 1.25rem; max-width: 480px;
        }

        .cs-logo { margin-bottom: .5rem; }

        .cs-badge {
          display: inline-block;
          background: var(--aqua); color: var(--black);
          font-size: .75rem; font-weight: 800; letter-spacing: .12em;
          text-transform: uppercase; padding: .35rem 1rem; border-radius: 999px;
        }

        .cs-title {
          font-size: clamp(1.75rem, 5vw, 2.5rem);
          font-weight: 900; color: var(--white);
          letter-spacing: -.02em; line-height: 1.1;
        }

        .cs-desc {
          font-size: 1rem; color: rgba(255,255,255,.55);
          line-height: 1.7; max-width: 360px;
        }

        .cs-btn {
          margin-top: .5rem;
          border: 1.5px solid rgba(255,255,255,.2); color: rgba(255,255,255,.7);
          padding: .65rem 1.5rem; border-radius: 8px;
          font-size: .9rem; font-weight: 600; font-family: var(--font);
          transition: border-color .15s, color .15s;
          display: inline-block;
        }
        .cs-btn:hover { border-color: var(--aqua); color: var(--aqua); }
      `}</style>
    </main>
  );
}