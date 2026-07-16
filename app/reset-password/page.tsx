'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <main className="fp-root">
      <div className="fp-header">
        <Link href="/">
          <img src="/logo.png" alt="NCIMUN" className="fp-logo" />
        </Link>
        <h1 className="fp-title">Reset your password</h1>
        <p className="fp-subtitle">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="fp-card">
        {sent ? (
          <div className="fp-success">
            <div className="fp-success-icon">✓</div>
            <h2 className="fp-success-title">Check your email</h2>
            <p className="fp-success-desc">
              We sent a password reset link to <strong>{email}</strong>.
              Check your inbox and follow the instructions.
            </p>
            <Link href="/login" className="fp-btn-primary">Back to login</Link>
          </div>
        ) : (
          <form className="fp-form" onSubmit={handleSubmit}>
            <div className="fp-field">
              <label className="fp-label">Email address</label>
              <input
                className="fp-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            {error && <div className="fp-error">{error}</div>}

            <button
              type="submit"
              className={`fp-btn-primary ${loading ? 'fp-btn--disabled' : ''}`}
              disabled={loading || !email}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <Link href="/login" className="fp-back">← Back to login</Link>
          </form>
        )}
      </div>

      <style>{`
        :root {
          --blue:   #5F96CA;
          --black:  #23272A;
          --white:  #FFFFFF;
          --gray-50:  #F8F9FA;
          --gray-200: #E9ECEF;
          --gray-600: #6C757D;
          --green:  #2D9B6F;
          --red:    #E5534B;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        .fp-root {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 2rem 1rem;
        }

        .fp-header { text-align: center; margin-bottom: 2rem; }
        .fp-logo { height: 48px; margin: 0 auto 1rem; display: block; }
        .fp-title { font-size: 1.75rem; font-weight: 900; letter-spacing: -.02em; }
        .fp-subtitle { font-size: .9375rem; color: var(--gray-600); margin-top: .4rem; max-width: 340px; line-height: 1.6; }

        .fp-card {
          width: 100%; max-width: 420px;
          background: var(--white); border-radius: 16px;
          box-shadow: var(--shadow); padding: 2.5rem;
        }

        .fp-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .fp-field { display: flex; flex-direction: column; gap: .4rem; }
        .fp-label { font-size: .8125rem; font-weight: 700; }
        .fp-input {
          width: 100%; padding: .65rem .875rem;
          border: 1.5px solid var(--gray-200); border-radius: 10px;
          font-family: var(--font); font-size: .9375rem; color: var(--black);
          background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .fp-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(95,150,202,.15); }

        .fp-error {
          background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.25);
          color: var(--red); border-radius: 8px; padding: .75rem 1rem; font-size: .875rem;
        }

        .fp-btn-primary {
          width: 100%; background: var(--blue); color: var(--white);
          padding: .8rem; border-radius: 8px; border: none;
          font-family: var(--font); font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: opacity .15s; text-align: center; display: block;
        }
        .fp-btn-primary:hover { opacity: .88; }
        .fp-btn--disabled { opacity: .45; cursor: not-allowed; }

        .fp-back {
          text-align: center; font-size: .875rem; font-weight: 600;
          color: var(--gray-600); display: block; transition: color .15s;
        }
        .fp-back:hover { color: var(--black); }

        /* Success */
        .fp-success { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
        .fp-success-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(45,155,111,.12); color: var(--green);
          font-size: 1.5rem; display: flex; align-items: center; justify-content: center; font-weight: 900;
        }
        .fp-success-title { font-size: 1.25rem; font-weight: 900; }
        .fp-success-desc { font-size: .9rem; color: var(--gray-600); line-height: 1.6; }

        @media (max-width: 480px) { .fp-card { padding: 1.5rem; } }
      `}</style>
    </main>
  );
}