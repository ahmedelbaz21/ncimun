'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }

    // Check account type and redirect accordingly
      const { data: userData } = await supabase
        .from('users')
        .select('account_type')
        .eq('email', email)
        .single();

      if (userData?.account_type === 'team') {
        window.location.href = '/team-portal';
      } else {
        window.location.href = '/conferences';
      }
  };

  return (
    <main className="lp-root">
      <div className="lp-header">
        <Link href="/">
          <img src="/logo.png" alt="NCIMUN" className="lp-logo" />
        </Link>
        <h1 className="lp-title">Welcome back</h1>
        <p className="lp-subtitle">Log in to your delegate account.</p>
      </div>

      <form className="lp-card" onSubmit={handleSubmit}>
        <div className="lp-field">
          <label className="lp-label">Email address</label>
          <input
            className="lp-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoFocus
          />
        </div>

        <div className="lp-field">
          <div className="lp-label-row">
            <label className="lp-label">Password</label>
            <Link href="/forgot-password" className="lp-forgot">Forgot password?</Link>
          </div>
          <div className="lp-input-wrap">
            <input
              className="lp-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
            <button
              type="button"
              className="lp-input-toggle"
              onClick={() => setShowPassword(s => !s)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && <div className="lp-error">{error}</div>}

        <button
          type="submit"
          className={`lp-btn-primary ${loading ? 'lp-btn--disabled' : ''}`}
          disabled={loading || !email || !password}
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="lp-register-hint">
          Don't have an account?{' '}
          <Link href="/register" className="lp-link">Create one</Link>
        </p>
      </form>

      <style>{`
        :root {
          --blue:     #5F96CA;
          --black:    #23272A;
          --white:    #FFFFFF;
          --gray-50:  #F8F9FA;
          --gray-200: #E9ECEF;
          --gray-400: #ADB5BD;
          --gray-600: #6C757D;
          --red:      #E5534B;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        .lp-root {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem 1rem;
        }

        .lp-header { text-align: center; margin-bottom: 2rem; }
        .lp-logo { height: 48px; margin-bottom: 1rem; display: inline-block; }
        .lp-title { font-size: 2rem; font-weight: 900; letter-spacing: -.02em; }
        .lp-subtitle { font-size: .9375rem; color: var(--gray-600); margin-top: .4rem; }

        .lp-card {
          width: 100%; max-width: 440px;
          background: var(--white); border-radius: 16px;
          box-shadow: var(--shadow); padding: 2.5rem;
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        .lp-field { display: flex; flex-direction: column; gap: .4rem; }
        .lp-label-row { display: flex; justify-content: space-between; align-items: center; }
        .lp-label { font-size: .8125rem; font-weight: 700; }
        .lp-forgot { font-size: .8125rem; color: var(--blue); font-weight: 600; }
        .lp-forgot:hover { text-decoration: underline; }

        .lp-input-wrap { position: relative; }
        .lp-input-toggle {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: .75rem; font-weight: 600; color: var(--blue);
          font-family: var(--font);
        }

        .lp-input {
          width: 100%; padding: .65rem .875rem;
          border: 1.5px solid var(--gray-200); border-radius: 10px;
          font-family: var(--font); font-size: .9375rem; color: var(--black);
          background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .lp-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(95,150,202,.15); }

        .lp-error {
          background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.25);
          color: var(--red); border-radius: 8px;
          padding: .75rem 1rem; font-size: .875rem;
        }

        .lp-btn-primary {
          width: 100%; background: var(--blue); color: var(--white);
          padding: .8rem; border-radius: 8px; border: none;
          font-family: var(--font); font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: opacity .15s; margin-top: .25rem;
        }
        .lp-btn-primary:hover { opacity: .88; }
        .lp-btn--disabled { opacity: .45; cursor: not-allowed; }

        .lp-register-hint {
          text-align: center; font-size: .875rem; color: var(--gray-600);
        }
        .lp-link { color: var(--blue); font-weight: 600; }
        .lp-link:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .lp-card { padding: 1.5rem; }
        }
      `}</style>
    </main>
  );
}