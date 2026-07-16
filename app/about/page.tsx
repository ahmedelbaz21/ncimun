import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="ab-root">
      {/* ── Nav ── */}
      <nav className="ab-nav">
        <div className="ab-nav-inner">
          <Link href="/">
            <img src="/logo.png" alt="NCIMUN" className="ab-nav-logo" />
          </Link>
          <Link href="/" className="ab-nav-back">← Back to homepage</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="ab-hero">
        <div className="ab-hero-inner">
          <p className="ab-eyebrow">Who we are</p>
          <h1 className="ab-title">
            Shaping young diplomats in the heart of Egypt's New Capital
          </h1>
          <p className="ab-subtitle">
            NCIMUN is the first international conference simulation in the New Capital region,
            raising political and social awareness among youth through active contribution
            to the resolution of crucial global issues.
          </p>
          <Link href="/register" className="ab-btn-primary">Join us →</Link>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="ab-section">
        <div className="ab-container ab-split">
          <div className="ab-split-item">
            <div className="ab-split-icon">🎯</div>
            <h2 className="ab-split-title">Our mission</h2>
            <p className="ab-split-body">
              To build academic and social skills in the most interactive methods possible.
              We believe that debate, collaboration, and critical thinking are the foundations
              of a better tomorrow — and we create the space for young people to practice them.
            </p>
          </div>
          <div className="ab-split-item">
            <div className="ab-split-icon">🌍</div>
            <h2 className="ab-split-title">Our vision</h2>
            <p className="ab-split-body">
              To be the leading Model United Nations platform for youth in Egypt and the region,
              producing a generation of informed, articulate, and globally conscious leaders
              who are ready to take on the world's most pressing challenges.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="ab-section ab-section--dark">
        <div className="ab-container">
          <p className="ab-eyebrow ab-eyebrow--light">What drives us</p>
          <h2 className="ab-section-title ab-section-title--light">Our values</h2>
          <div className="ab-values-grid">
            {[
              {
                label: 'Playful',
                desc: 'We target the youth, so we keep the experience joyful and engaging. We want every delegate to have fun — even when things get intense in the chamber.',
              },
              {
                label: 'Collaborative',
                desc: 'When we speak, we use "we." Great teamwork is at the heart of NCIMUN, and we believe collective effort always produces the best outcomes.',
              },
              {
                label: 'Dedicated',
                desc: 'Dedication is the secret ingredient that turns dreams into reality. We are ambitious, resilient, and continuously improving everything we do.',
              },
              {
                label: 'Sophisticated',
                desc: 'Polished communication, cultural awareness, and good manners are essential when representing a conference of this caliber.',
              },
            ].map(v => (
              <div key={v.label} className="ab-value-card">
                <h3 className="ab-value-title">{v.label}</h3>
                <p className="ab-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is MUN ── */}
      <section className="ab-section">
        <div className="ab-container ab-mun">
          <div className="ab-mun-text">
            <p className="ab-eyebrow">New to MUN?</p>
            <h2 className="ab-section-title">What is Model United Nations?</h2>
            <p className="ab-mun-body">
              Model United Nations (MUN) is an academic simulation of the United Nations where
              students take on the roles of delegates representing different countries and debate
              real-world issues. Participants research their assigned country's position, write
              policy documents, deliver speeches, and work with other delegates to draft resolutions.
            </p>
            <p className="ab-mun-body">
              MUN develops public speaking, research, writing, critical thinking, and negotiation
              skills — all while building a deep understanding of global affairs and international
              relations. It's one of the most impactful extracurricular experiences a young person can have.
            </p>
          </div>
          <div className="ab-mun-stats">
            <div className="ab-stat">
              <span className="ab-stat-number">7</span>
              <span className="ab-stat-label">Conferences held</span>
            </div>
            <div className="ab-stat">
              <span className="ab-stat-number">500+</span>
              <span className="ab-stat-label">Delegates per conference</span>
            </div>
            <div className="ab-stat">
              <span className="ab-stat-number">TKH</span>
              <span className="ab-stat-label">New Capital, Egypt</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ab-cta">
        <div className="ab-container ab-cta-inner">
          <h2 className="ab-cta-title">Ready to be part of it?</h2>
          <p className="ab-cta-desc">Register for NCIMUN Volume 7 and start your MUN journey.</p>
          <div className="ab-cta-actions">
            <Link href="/register" className="ab-btn-primary">Create an account</Link>
            <Link href="/conferences" className="ab-btn-outline-light">View conferences</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="ab-footer">
        <div className="ab-footer-inner">
          <span>© {new Date().getFullYear()} NCIMUN. All rights reserved.</span>
          <div className="ab-footer-links">
            <Link href="/contact">Contact</Link>
            <Link href="/conferences">Conferences</Link>
            <Link href="/register">Register</Link>
          </div>
        </div>
      </footer>

      <style>{`
        :root {
          --blue:   #5F96CA;
          --aqua:   #84DBD5;
          --black:  #23272A;
          --white:  #FFFFFF;
          --gray-50:  #F8F9FA;
          --gray-200: #E9ECEF;
          --gray-600: #6C757D;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); color: var(--black); background: var(--white); }
        a { text-decoration: none; color: inherit; }

        /* Nav */
        .ab-nav {
          background: var(--white); border-bottom: 1px solid var(--gray-200);
          position: sticky; top: 0; z-index: 100;
        }
        .ab-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .ab-nav-logo { height: 36px; display: block; }
        .ab-nav-back { font-size: .875rem; font-weight: 600; color: var(--gray-600); transition: color .15s; }
        .ab-nav-back:hover { color: var(--black); }

        /* Hero */
        .ab-hero {
          background: var(--black); padding: 7rem 2rem;
          display: flex; align-items: center; justify-content: center;
        }
        .ab-hero-inner { max-width: 720px; text-align: center; }
        .ab-eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--aqua); margin-bottom: .75rem; display: block;
        }
        .ab-eyebrow--light { color: var(--aqua); }
        .ab-title {
          font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 900;
          color: var(--white); letter-spacing: -.02em; line-height: 1.15;
          margin-bottom: 1.25rem;
        }
        .ab-subtitle {
          font-size: 1.0625rem; color: rgba(255,255,255,.6);
          line-height: 1.75; max-width: 580px; margin: 0 auto 2rem;
        }

        /* Sections */
        .ab-section { padding: 5rem 2rem; }
        .ab-section--dark { background: var(--black); }
        .ab-container { max-width: 1100px; margin: 0 auto; }
        .ab-section-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 900;
          margin-bottom: 2.5rem; line-height: 1.15;
        }
        .ab-section-title--light { color: var(--white); }

        /* Split */
        .ab-split { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
        .ab-split-item { display: flex; flex-direction: column; gap: 1rem; }
        .ab-split-icon { font-size: 2rem; }
        .ab-split-title { font-size: 1.25rem; font-weight: 800; }
        .ab-split-body { font-size: .9375rem; color: var(--gray-600); line-height: 1.75; }

        /* Values */
        .ab-values-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .ab-value-card {
          border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
          padding: 1.75rem; display: flex; flex-direction: column; gap: .75rem;
        }
        .ab-value-title {
          font-size: 1rem; font-weight: 800; color: var(--aqua);
          text-transform: uppercase; letter-spacing: .08em;
        }
        .ab-value-desc { font-size: .9rem; color: rgba(255,255,255,.6); line-height: 1.7; }

        /* MUN */
        .ab-mun { display: grid; grid-template-columns: 1.5fr 1fr; gap: 4rem; align-items: center; }
        .ab-mun-text { display: flex; flex-direction: column; gap: 1.25rem; }
        .ab-mun-body { font-size: .9375rem; color: var(--gray-600); line-height: 1.75; }
        .ab-mun-stats { display: flex; flex-direction: column; gap: 1.5rem; }
        .ab-stat { display: flex; flex-direction: column; gap: .25rem; padding: 1.25rem; background: var(--gray-50); border-radius: 12px; }
        .ab-stat-number { font-size: 2rem; font-weight: 900; color: var(--blue); }
        .ab-stat-label { font-size: .8125rem; color: var(--gray-600); font-weight: 600; }

        /* CTA */
        .ab-cta { background: var(--blue); padding: 5rem 2rem; }
        .ab-cta-inner { text-align: center; }
        .ab-cta-title { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 900; color: var(--white); margin-bottom: .75rem; }
        .ab-cta-desc { color: rgba(255,255,255,.75); font-size: 1rem; margin-bottom: 2rem; }
        .ab-cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        /* Buttons */
        .ab-btn-primary {
          background: var(--white); color: var(--blue);
          padding: .75rem 2rem; border-radius: 8px;
          font-size: 1rem; font-weight: 700; font-family: var(--font);
          display: inline-block; transition: opacity .15s;
        }
        .ab-btn-primary:hover { opacity: .9; }
        .ab-hero-inner .ab-btn-primary { background: var(--blue); color: var(--white); }
        .ab-btn-outline-light {
          border: 1.5px solid rgba(255,255,255,.4); color: var(--white);
          padding: .75rem 2rem; border-radius: 8px;
          font-size: 1rem; font-weight: 700; font-family: var(--font);
          display: inline-block; transition: border-color .15s;
        }
        .ab-btn-outline-light:hover { border-color: var(--white); }

        /* Footer */
        .ab-footer { background: var(--black); padding: 2rem; }
        .ab-footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
          font-size: .8125rem; color: rgba(255,255,255,.4); flex-wrap: wrap; gap: 1rem;
        }
        .ab-footer-links { display: flex; gap: 1.5rem; }
        .ab-footer-links a { color: rgba(255,255,255,.4); transition: color .15s; }
        .ab-footer-links a:hover { color: var(--aqua); }

        /* Responsive */
        @media (max-width: 768px) {
          .ab-split { grid-template-columns: 1fr; }
          .ab-values-grid { grid-template-columns: 1fr; }
          .ab-mun { grid-template-columns: 1fr; }
          .ab-hero { padding: 5rem 1.5rem; }
          .ab-section { padding: 4rem 1.5rem; }
        }
      `}</style>
    </main>
  );
}