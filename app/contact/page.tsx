'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error('Failed to send message.');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cp-root">
      {/* ── Nav ── */}
      <nav className="cp-nav">
        <div className="cp-nav-inner">
          <Link href="/">
            <img src="/logo.png" alt="NCIMUN" className="cp-nav-logo" />
          </Link>
          <Link href="/" className="cp-nav-back">← Back to homepage</Link>
        </div>
      </nav>

      <div className="cp-layout">
        {/* ── Left: Info ── */}
        <div className="cp-info">
          <p className="cp-eyebrow">Get in touch</p>
          <h1 className="cp-title">Contact us</h1>
          <p className="cp-subtitle">
            Have a question about NCIMUN, the summer camp, or registration? We're here to help.
          </p>

          <div className="cp-contact-items">
            <a href="tel:01031623162" className="cp-contact-item">
              <div className="cp-contact-icon">📞</div>
              <div>
                <span className="cp-contact-label">Phone</span>
                <span className="cp-contact-value">010 3162 3162</span>
              </div>
            </a>

            <a href="mailto:ncimun@gmail.com" className="cp-contact-item">
              <div className="cp-contact-icon">✉️</div>
              <div>
                <span className="cp-contact-label">Email</span>
                <span className="cp-contact-value">ncimun@gmail.com</span>
              </div>
            </a>

            <a href="https://www.instagram.com/ncimun_tkh" target="_blank" rel="noopener noreferrer" className="cp-contact-item">
              <div className="cp-contact-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <div>
                <span className="cp-contact-label">Instagram</span>
                <span className="cp-contact-value">@ncimun_tkh</span>
              </div>
            </a>

            <div className="cp-contact-item cp-contact-item--no-link">
              <div className="cp-contact-icon">📍</div>
              <div>
                <span className="cp-contact-label">Venue</span>
                <span className="cp-contact-value">The Knowledge Hub (TKH)</span>
                <span className="cp-contact-sub">New Administrative Capital, Egypt</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="cp-form-wrap">
          {sent ? (
            <div className="cp-success">
              <div className="cp-success-icon">✓</div>
              <h2 className="cp-success-title">Message sent!</h2>
              <p className="cp-success-desc">
                Thanks for reaching out. We'll get back to you as soon as possible.
              </p>
              <Link href="/" className="cp-btn-primary">Back to homepage</Link>
            </div>
          ) : (
            <form className="cp-form" onSubmit={handleSubmit}>
              <h2 className="cp-form-title">Send us a message</h2>

              <div className="cp-field">
                <label className="cp-label">Your name</label>
                <input
                  className="cp-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="cp-field">
                <label className="cp-label">Email address</label>
                <input
                  className="cp-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="cp-field">
                <label className="cp-label">Message</label>
                <textarea
                  className="cp-input cp-textarea"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  required
                />
              </div>

              {error && <div className="cp-error">{error}</div>}

              <button
                type="submit"
                className={`cp-btn-primary ${loading ? 'cp-btn--disabled' : ''}`}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send message →'}
              </button>
            </form>
          )}
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
          --green:  #2D9B6F;
          --red:    #E5534B;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        /* Nav */
        .cp-nav {
          background: var(--white); border-bottom: 1px solid var(--gray-200);
          position: sticky; top: 0; z-index: 100;
        }
        .cp-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .cp-nav-logo { height: 36px; display: block; }
        .cp-nav-back { font-size: .875rem; font-weight: 600; color: var(--gray-600); transition: color .15s; }
        .cp-nav-back:hover { color: var(--black); }

        /* Layout */
        .cp-layout {
          max-width: 1100px; margin: 0 auto; padding: 5rem 2rem 6rem;
          display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: start;
        }

        /* Info */
        .cp-eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: block;
        }
        .cp-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; letter-spacing: -.02em; margin-bottom: .75rem; }
        .cp-subtitle { font-size: 1rem; color: var(--gray-600); line-height: 1.7; margin-bottom: 2.5rem; }

        .cp-contact-items { display: flex; flex-direction: column; gap: 1rem; }
        .cp-contact-item {
          display: flex; align-items: flex-start; gap: 1rem;
          padding: 1.125rem 1.25rem; background: var(--white);
          border: 1.5px solid var(--gray-200); border-radius: 12px;
          transition: border-color .15s, box-shadow .15s; color: var(--black);
        }
        .cp-contact-item:not(.cp-contact-item--no-link):hover {
          border-color: var(--blue); box-shadow: 0 4px 16px rgba(95,150,202,.1);
        }
        .cp-contact-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(95,150,202,.08); color: var(--blue);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.125rem; flex-shrink: 0;
        }
        .cp-contact-label {
          display: block; font-size: .75rem; font-weight: 700;
          color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em;
          margin-bottom: .2rem;
        }
        .cp-contact-value { display: block; font-size: .9375rem; font-weight: 700; color: var(--black); }
        .cp-contact-sub { display: block; font-size: .8125rem; color: var(--gray-600); margin-top: .15rem; }

        /* Form */
        .cp-form-wrap {
          background: var(--white); border-radius: 16px;
          box-shadow: var(--shadow); padding: 2.5rem;
        }
        .cp-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .cp-form-title { font-size: 1.25rem; font-weight: 800; margin-bottom: .25rem; }
        .cp-field { display: flex; flex-direction: column; gap: .4rem; }
        .cp-label { font-size: .8125rem; font-weight: 700; }
        .cp-input {
          width: 100%; padding: .65rem .875rem;
          border: 1.5px solid var(--gray-200); border-radius: 10px;
          font-family: var(--font); font-size: .9375rem; color: var(--black);
          background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .cp-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(95,150,202,.15); }
        .cp-textarea { resize: vertical; min-height: 140px; }

        .cp-error {
          background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.25);
          color: var(--red); border-radius: 8px; padding: .75rem 1rem; font-size: .875rem;
        }

        .cp-btn-primary {
          width: 100%; background: var(--blue); color: var(--white);
          padding: .8rem; border-radius: 8px; border: none;
          font-family: var(--font); font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: opacity .15s; text-align: center; display: block;
        }
        .cp-btn-primary:hover { opacity: .88; }
        .cp-btn--disabled { opacity: .45; cursor: not-allowed; }

        /* Success */
        .cp-success {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 1rem;
        }
        .cp-success-icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(45,155,111,.12); color: var(--green);
          font-size: 1.75rem; display: flex; align-items: center; justify-content: center;
          font-weight: 900;
        }
        .cp-success-title { font-size: 1.5rem; font-weight: 900; }
        .cp-success-desc { font-size: .9375rem; color: var(--gray-600); line-height: 1.6; }

        @media (max-width: 768px) {
          .cp-layout { grid-template-columns: 1fr; gap: 3rem; padding: 3rem 1rem 5rem; }
          .cp-form-wrap { padding: 1.5rem; }
        }
      `}</style>
    </main>
  );
}