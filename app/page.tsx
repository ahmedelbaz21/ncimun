'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    setMenuOpen(false);
  };

  const NAV_LINKS = [
    { href: '/about', label: 'About' },
    { href: '/conferences', label: 'Conferences' },
    { href: '/councils', label: 'Councils' },
    { href: '/transportation', label: 'Transportation' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/store', label: 'Store' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      {/* ─── Navbar ─── */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo-link">
            <img src="/logo.png" alt="NCIMUN" className="nav-logo" />
          </Link>
          <div className="nav-links">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
            ))}
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <Link href="/profile" className="nav-profile" title="My Profile">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </Link>
                <button className="nav-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-login">Log in</Link>
                <Link href="/register" className="nav-register">Register</Link>
              </>
            )}
            <button
              className="nav-burger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span className={menuOpen ? 'burger-top-open' : ''} />
              <span className={menuOpen ? 'burger-mid-open' : ''} />
              <span className={menuOpen ? 'burger-bot-open' : ''} />
            </button>
          </div>
        </div>

        {/* Drawer */}
        <div className={`drawer ${menuOpen ? 'drawer-open' : ''}`}>
          <div className="drawer-inner">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="drawer-link" onClick={() => setMenuOpen(false)}>{l.label}</Link>
            ))}
            <div className="drawer-div" />
            {user ? (
              <>
                <Link href="/profile" className="drawer-link" onClick={() => setMenuOpen(false)}>My profile</Link>
                <button className="drawer-link drawer-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="drawer-link" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/register" className="drawer-link drawer-cta" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <main>
        {/* ─── Hero ─── */}
        <section className="hero">
          {/* Background grid texture */}
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-inner">
            {/* Logo — prominent */}
            <div className="hero-logo-wrap">
              <img src="/logo.png" alt="NCIMUN" className="hero-logo" />
            </div>

            <div className="hero-tag">Summer Camp 2026 — Now open</div>

            <h1 className="hero-headline">
              Where young voices<br />
              <span className="hero-headline-aqua">shape the world.</span>
            </h1>

            <p className="hero-body">
              The New Capital's first international Model UN simulation.
              An unforgettable experience.
            </p>

            <div className="hero-actions">
              <Link href="/register" className="btn-aqua">Register now</Link>
              <Link href="/conferences" className="btn-ghost-light">View Summer Camp →</Link>
            </div>
          </div>

          
          
        </section>

        {/* ─── Councils preview ─── */}
        <section className="sect sect-light">
          <div className="container">
            <div className="sect-head">
              <div>
                <p className="eyebrow">This summer</p>
                <h2 className="sect-title">Five councils. Five debates.</h2>
              </div>
              <Link href="/councils" className="btn-outline-blue">All councils →</Link>
            </div>
            <div className="councils-grid">
              {[
                { abbr: 'ICJ', name: 'International Court of Justice', topic: 'Iron Man vs. Captain America' },
                { abbr: 'UNSC', name: 'Security Council', topic: 'Zombie Apocalypse Crisis' },
                { abbr: 'TFC', name: 'The Football Court', topic: 'Is the World Cup rigged?' },
                { abbr: 'CX', name: 'CrisisX', topic: 'Was it an inside job?' },
                { abbr: 'TGB', name: 'The Golden Billion', topic: 'Should we only keep a billion humans?' },
              ].map((c, i) => (
                <div key={c.abbr} className="council-card">
                  <span className="council-abbr">{c.abbr}</span>
                  <span className="council-name">{c.name}</span>
                  <span className="council-topic">{c.topic}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why NCIMUN ─── */}
        <section className="sect sect-dark">
          <div className="container">
            <p className="eyebrow eyebrow-aqua">Who we are</p>
            <h2 className="sect-title sect-title-light">
              More than a conference.<br />A community.
            </h2>
            <div className="values-grid">
              {[
                { label: 'Playful', desc: 'We keep it engaging, fun, and high-energy — even when the debates get intense.' },
                { label: 'Collaborative', desc: 'Great outcomes come from great teamwork. We build that culture from day one.' },
                { label: 'Dedicated', desc: 'Every detail is obsessed over so that every delegate has the best possible experience.' },
                { label: 'Sophisticated', desc: 'Polished communication and global awareness at every level of the conference.' },
              ].map(v => (
                <div key={v.label} className="value-item">
                  <span className="value-name">{v.label}</span>
                  <span className="value-desc">{v.desc}</span>
                </div>
              ))}
            </div>
            <Link href="/about" className="btn-outline-aqua">About NCIMUN →</Link>
          </div>
        </section>

        {/* ─── Quick links ─── */}
        <section className="sect sect-light">
          <div className="container">
            <h2 className="sect-title">Everything you need</h2>
            <div className="links-grid">
              {[
                { href: '/councils', label: 'Councils', desc: 'Browse this summer\'s five debate topics.' },
                { href: '/transportation', label: 'Transportation', desc: 'Bus routes and pickup points across Cairo.' },
                { href: '/faq', label: 'FAQ', desc: 'Quick answers to common questions.' },
                { href: '/about', label: 'About NCIMUN', desc: 'Who we are and what we stand for.' },
                { href: '/contact', label: 'Contact us', desc: 'Reach the NCIMUN team directly.' },
                { href: '/gallery', label: 'Gallery', desc: 'Photos from past conferences.' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="link-card">
                  <span className="link-label">{l.label}</span>
                  <span className="link-desc">{l.desc}</span>
                  <span className="link-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="cta-sect">
          <div className="container cta-inner">
            <h2 className="cta-title">Spots are filling fast.</h2>
            <p className="cta-sub">Secure your place at NCIMUN Summer Camp 2026 before it sells out.</p>
            <Link href="/register" className="btn-aqua btn-lg">Register now</Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="NCIMUN" className="footer-logo" />
            <p className="footer-tagline">New Capital International Model United Nations</p>
            <a href="https://www.instagram.com/ncimun_tkh" target="_blank" rel="noopener noreferrer" className="footer-ig">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              @ncimun_tkh
            </a>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <span className="footer-col-title">Summer Camp</span>
              <Link href="/conferences">Register</Link>
              <Link href="/councils">Councils</Link>
              <Link href="/transportation">Transportation</Link>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Organisation</span>
              <Link href="/about">About NCIMUN</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Account</span>
              <Link href="/register">Create account</Link>
              <Link href="/login">Log in</Link>
              <Link href="/profile">My profile</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} NCIMUN. All rights reserved.</span>
          <span>ncimun@gmail.com · 010 3162 3162</span>
        </div>
      </footer>

      <style>{`
        :root {
          --blue:   #5F96CA;
          --aqua:   #84DBD5;
          --black:  #23272A;
          --yellow: #F8E98D;
          --purple: #8D94C9;
          --white:  #FFFFFF;
          --off:    #F4F6F8;
          --font:   'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); color: var(--black); background: var(--white); }
        a { text-decoration: none; color: inherit; }
        img { display: block; }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 200;
          background: var(--black);
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 2rem;
          height: 68px; display: flex; align-items: center; gap: 2rem;
        }
        .nav-logo-link { flex-shrink: 0; }
        .nav-logo { height: 38px; }
        .nav-links { display: flex; gap: 1.5rem; flex: 1; }
        .nav-link { font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.6); transition: color .15s; }
        .nav-link:hover { color: var(--white); }
        .nav-actions { display: flex; gap: .75rem; align-items: center; }

        .nav-profile {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(132,219,213,.15); color: var(--aqua);
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .nav-profile:hover { background: rgba(132,219,213,.25); }

        .nav-login {
          font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.65);
          padding: .45rem .875rem; border-radius: 6px; transition: color .15s;
        }
        .nav-login:hover { color: var(--white); }

        .nav-logout {
          font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.65);
          padding: .45rem .875rem; border-radius: 6px; background: none; border: none;
          cursor: pointer; font-family: var(--font); transition: color .15s;
        }
        .nav-logout:hover { color: var(--white); }

        .nav-register {
          font-size: .8125rem; font-weight: 700; color: var(--black);
          background: var(--aqua); padding: .45rem 1.125rem; border-radius: 6px;
          transition: opacity .15s;
        }
        .nav-register:hover { opacity: .88; }

        /* Burger */
        .nav-burger {
          display: none; flex-direction: column; gap: 5px;
          width: 36px; height: 36px; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px;
        }
        .nav-burger span {
          display: block; width: 20px; height: 2px;
          background: rgba(255,255,255,.8); border-radius: 2px;
          transition: transform .25s, opacity .2s; transform-origin: center;
        }
        .burger-top-open { transform: translateY(7px) rotate(45deg) !important; }
        .burger-mid-open { opacity: 0 !important; transform: scaleX(0) !important; }
        .burger-bot-open { transform: translateY(-7px) rotate(-45deg) !important; }

        /* Drawer */
        .drawer {
          position: fixed; top: 68px; right: 0;
          width: 280px; height: calc(100vh - 68px);
          background: var(--black); border-left: 1px solid rgba(255,255,255,.08);
          transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
          z-index: 199; overflow-y: auto;
        }
        .drawer-open { transform: translateX(0); }
        .drawer-inner { display: flex; flex-direction: column; padding: 1rem 0; }
        .drawer-link {
          display: block; padding: .875rem 1.5rem;
          font-size: .9375rem; font-weight: 500; color: rgba(255,255,255,.7);
          transition: color .12s, background .12s;
          background: none; border: none; cursor: pointer; text-align: left;
          font-family: var(--font); width: 100%;
        }
        .drawer-link:hover { color: var(--white); background: rgba(255,255,255,.05); }
        .drawer-div { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: .5rem 0; }
        .drawer-cta {
          margin: .5rem 1rem 0; background: var(--aqua); color: var(--black) !important;
          border-radius: 8px; text-align: center; font-weight: 700; padding: .75rem 1rem;
        }
        .drawer-cta:hover { opacity: .88; background: var(--aqua) !important; }
        .drawer-logout { color: rgba(229,83,75,.8) !important; }
        .drawer-logout:hover { color: #E5534B !important; }
        .backdrop {
          position: fixed; inset: 0; z-index: 198;
          background: rgba(0,0,0,.6);
        }

        /* ── HERO ── */
        .hero {
          background: var(--black); min-height: 100vh;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }

        /* Subtle dot grid background */
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(132,219,213,.12) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
        }

        .hero-inner {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 5rem 2rem 3rem;
          position: relative; z-index: 1;
        }

        .hero-logo-wrap { margin-bottom: 2.5rem; }
        .hero-logo { height: 120px; margin: 0 auto; }

        .hero-tag {
          display: inline-block;
          border: 1px solid rgba(132,219,213,.4); color: var(--aqua);
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; padding: .35rem 1rem; border-radius: 999px;
          margin-bottom: 1.75rem;
        }

        .hero-headline {
          font-size: clamp(2.75rem, 8vw, 5.5rem);
          font-weight: 900; color: var(--white);
          letter-spacing: -.03em; line-height: 1.05;
          margin-bottom: 1.25rem;
        }
        .hero-headline-aqua { color: var(--aqua); }

        .hero-body {
          font-size: 1.0625rem; color: rgba(255,255,255,.55);
          line-height: 1.7; max-width: 480px; margin: 0 auto 2.5rem;
        }

        .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        /* ── DATES STRIP ── */
        .hero-dates {
          background: rgba(255,255,255,.04);
          border-top: 1px solid rgba(255,255,255,.08);
          position: relative; z-index: 1;
        }
        .hero-dates-inner {
          max-width: 900px; margin: 0 auto; padding: 1.5rem 2rem;
          display: flex; align-items: center; gap: 0; flex-wrap: wrap;
        }
        .date-item { flex: 1; min-width: 140px; padding: .5rem 1.5rem; display: flex; flex-direction: column; gap: .2rem; }
        .date-label { font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.35); }
        .date-value { font-size: .9375rem; font-weight: 700; color: var(--white); }
        .date-sep { width: 1px; height: 36px; background: rgba(255,255,255,.1); }

        /* ── BUTTONS ── */
        .btn-aqua {
          background: var(--aqua); color: var(--black);
          padding: .75rem 2rem; border-radius: 8px;
          font-size: .9375rem; font-weight: 800; font-family: var(--font);
          display: inline-block; transition: opacity .15s;
        }
        .btn-aqua:hover { opacity: .88; }
        .btn-aqua.btn-lg { padding: .875rem 2.5rem; font-size: 1.0625rem; }

        .btn-ghost-light {
          color: rgba(255,255,255,.7); font-size: .9375rem; font-weight: 600;
          padding: .75rem 1.25rem; border-radius: 8px;
          border: 1px solid rgba(255,255,255,.15);
          transition: color .15s, border-color .15s; display: inline-block;
        }
        .btn-ghost-light:hover { color: var(--white); border-color: rgba(255,255,255,.35); }

        .btn-outline-blue {
          border: 1.5px solid var(--blue); color: var(--blue);
          padding: .55rem 1.25rem; border-radius: 6px;
          font-size: .875rem; font-weight: 700; font-family: var(--font);
          display: inline-block; transition: background .15s; white-space: nowrap;
        }
        .btn-outline-blue:hover { background: var(--blue); color: var(--white); }

        .btn-outline-aqua {
          border: 1.5px solid var(--aqua); color: var(--aqua);
          padding: .65rem 1.5rem; border-radius: 6px;
          font-size: .875rem; font-weight: 700; font-family: var(--font);
          display: inline-block; margin-top: 2rem; transition: background .15s;
        }
        .btn-outline-aqua:hover { background: var(--aqua); color: var(--black); }

        /* ── SECTIONS ── */
        .sect { padding: 5rem 2rem; }
        .sect-light { background: var(--white); }
        .sect-dark { background: var(--black); }
        .container { max-width: 1100px; margin: 0 auto; }

        .eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: block;
        }
        .eyebrow-aqua { color: var(--aqua); }

        .sect-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 900;
          line-height: 1.15; margin-bottom: 2.5rem;
        }
        .sect-title-light { color: var(--white); }

        .sect-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;
        }
        .sect-head .sect-title { margin-bottom: 0; }

        /* Councils grid */
        .councils-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: .875rem; }
        .council-card {
          border: 1.5px solid rgba(35,39,42,.1); border-radius: 12px;
          padding: 1.25rem; display: flex; flex-direction: column; gap: .5rem;
          transition: border-color .15s, box-shadow .15s;
        }
        .council-card:hover { border-color: var(--blue); box-shadow: 0 4px 20px rgba(95,150,202,.1); }
        .council-abbr {
          font-size: .75rem; font-weight: 800; color: var(--blue);
          letter-spacing: .08em; text-transform: uppercase;
        }
        .council-name { font-size: .875rem; font-weight: 800; color: var(--black); line-height: 1.3; }
        .council-topic { font-size: .75rem; color: rgba(35,39,42,.5); line-height: 1.5; }

        /* Values */
        .values-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: .5rem; }
        .value-item {
          border-left: 3px solid var(--aqua); padding: .875rem 1.25rem;
          display: flex; flex-direction: column; gap: .4rem;
        }
        .value-name { font-size: .8125rem; font-weight: 800; color: var(--aqua); text-transform: uppercase; letter-spacing: .08em; }
        .value-desc { font-size: .875rem; color: rgba(255,255,255,.55); line-height: 1.6; }

        /* Quick links */
        .links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .link-card {
          border: 1px solid rgba(35,39,42,.1); border-radius: 10px;
          padding: 1.5rem; display: flex; flex-direction: column; gap: .35rem;
          transition: border-color .15s, box-shadow .15s;
        }
        .link-card:hover { border-color: var(--blue); box-shadow: 0 4px 20px rgba(95,150,202,.1); }
        .link-label { font-size: .9375rem; font-weight: 800; color: var(--black); }
        .link-desc { font-size: .8125rem; color: rgba(35,39,42,.5); line-height: 1.5; flex: 1; }
        .link-arrow { font-size: .9rem; color: var(--blue); margin-top: .4rem; transition: transform .15s; }
        .link-card:hover .link-arrow { transform: translateX(4px); }

        /* CTA */
        .cta-sect { background: var(--blue); padding: 5rem 2rem; }
        .cta-inner { text-align: center; }
        .cta-title { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 900; color: var(--white); margin-bottom: .75rem; }
        .cta-sub { color: rgba(255,255,255,.75); font-size: 1rem; margin-bottom: 2rem; }
        .cta-sect .btn-aqua { background: var(--white); color: var(--blue); }

        /* ── FOOTER ── */
        .footer { background: var(--black); padding: 4rem 2rem 2rem; }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1.5fr 2fr; gap: 4rem;
          padding-bottom: 3rem; border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .footer-logo { height: 36px; margin-bottom: 1rem; }
        .footer-tagline { font-size: .8125rem; color: rgba(255,255,255,.45); line-height: 1.6; max-width: 220px; margin-bottom: .875rem; }
        .footer-ig {
          display: inline-flex; align-items: center; gap: .5rem;
          font-size: .8125rem; font-weight: 600; color: var(--aqua);
          transition: opacity .15s;
        }
        .footer-ig:hover { opacity: .8; }
        .footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .footer-col { display: flex; flex-direction: column; gap: .6rem; }
        .footer-col-title { font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.35); margin-bottom: .25rem; }
        .footer-col a { font-size: .875rem; color: rgba(255,255,255,.55); transition: color .15s; }
        .footer-col a:hover { color: var(--aqua); }
        .footer-bottom {
          max-width: 1100px; margin: 1.5rem auto 0;
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem;
          font-size: .8125rem; color: rgba(255,255,255,.25);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .councils-grid { grid-template-columns: repeat(2, 1fr); }
          .values-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-actions .nav-login,
          .nav-actions .nav-logout,
          .nav-actions .nav-register { display: none; }
          .nav-burger { display: flex; }
          .hero-logo { height: 90px; }
          .date-sep { display: none; }
          .hero-dates-inner { gap: 0; }
          .date-item { min-width: 50%; }
          .links-grid { grid-template-columns: 1fr 1fr; }
          .footer-inner { grid-template-columns: 1fr; gap: 2.5rem; }
          .footer-cols { grid-template-columns: 1fr 1fr; }
          .footer-bottom { flex-direction: column; }
        }
        @media (max-width: 520px) {
          .councils-grid { grid-template-columns: 1fr; }
          .values-grid { grid-template-columns: 1fr; }
          .links-grid { grid-template-columns: 1fr; }
          .footer-cols { grid-template-columns: 1fr; }
          .hero-actions { flex-direction: column; align-items: center; }
        }
      `}</style>
    </>
  );
}