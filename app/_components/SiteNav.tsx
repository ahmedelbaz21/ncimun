'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/conferences', label: 'Conferences' },
  { href: '/councils', label: 'Councils' },
  { href: '/transportation', label: 'Transportation' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/store', label: 'Store' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

// Internal/admin pages keep their own headers
const HIDDEN_ON = ['/admin-bazisthebest', '/team-portal', '/continental-dashboard', '/Delegate-info', '/bazwshorbatop', '/trial'];

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: unknown, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close the drawer when navigating
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (HIDDEN_ON.some(p => pathname?.startsWith(p))) return null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <nav className="sn-nav">
        <div className="sn-inner">
          <Link href="/" className="sn-logo-link">
            <img src="/logo.png" alt="NCIMUN" className="sn-logo" />
          </Link>
          <div className="sn-links">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className={`sn-link ${isActive(l.href) ? 'sn-link--active' : ''}`}>{l.label}</Link>
            ))}
          </div>
          <div className="sn-actions">
            {user ? (
              <>
                <Link href="/profile" className={`sn-profile ${isActive('/profile') ? 'sn-profile--active' : ''}`} title="My Profile">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </Link>
                <button className="sn-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="sn-login">Log in</Link>
                <Link href="/register" className="sn-register">Register</Link>
              </>
            )}
            <button className="sn-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
              <span className={menuOpen ? 'sn-burger-top-open' : ''} />
              <span className={menuOpen ? 'sn-burger-mid-open' : ''} />
              <span className={menuOpen ? 'sn-burger-bot-open' : ''} />
            </button>
          </div>
        </div>

        {/* Drawer */}
        <div className={`sn-drawer ${menuOpen ? 'sn-drawer-open' : ''}`}>
          <div className="sn-drawer-inner">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className={`sn-drawer-link ${isActive(l.href) ? 'sn-drawer-link--active' : ''}`}>{l.label}</Link>
            ))}
            <div className="sn-drawer-div" />
            {user ? (
              <>
                <Link href="/profile" className="sn-drawer-link">My profile</Link>
                <button className="sn-drawer-link sn-drawer-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="sn-drawer-link">Log in</Link>
                <Link href="/register" className="sn-drawer-link sn-drawer-cta">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {menuOpen && <div className="sn-backdrop" onClick={() => setMenuOpen(false)} />}

      <style>{`
        .sn-nav {
          position: sticky; top: 0; z-index: 200;
          background: #23272A;
          border-bottom: 1px solid rgba(255,255,255,.08);
          font-family: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
        }
        .sn-nav a { text-decoration: none; }
        .sn-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 2rem;
          height: 68px; display: flex; align-items: center; gap: 2rem;
        }
        .sn-logo-link { flex-shrink: 0; }
        .sn-logo { height: 38px; display: block; }
        .sn-links { display: flex; gap: 1.5rem; flex: 1; }
        .sn-link { font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.6); transition: color .15s; }
        .sn-link:hover, .sn-link--active { color: #FFFFFF; }
        .sn-link--active { box-shadow: 0 2px 0 #84DBD5; padding-bottom: 2px; }
        .sn-actions { display: flex; gap: .75rem; align-items: center; }

        .sn-profile {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(132,219,213,.15); color: #84DBD5;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .sn-profile:hover, .sn-profile--active { background: rgba(132,219,213,.25); }

        .sn-login {
          font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.65);
          padding: .45rem .875rem; border-radius: 6px; transition: color .15s;
        }
        .sn-login:hover { color: #FFFFFF; }

        .sn-logout {
          font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.65);
          padding: .45rem .875rem; border-radius: 6px; background: none; border: none;
          cursor: pointer; font-family: inherit; transition: color .15s;
        }
        .sn-logout:hover { color: #FFFFFF; }

        .sn-register {
          font-size: .8125rem; font-weight: 700; color: #23272A;
          background: #84DBD5; padding: .45rem 1.125rem; border-radius: 6px;
          transition: opacity .15s;
        }
        .sn-register:hover { opacity: .88; }

        /* Burger */
        .sn-burger {
          display: none; flex-direction: column; gap: 5px;
          width: 36px; height: 36px; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px;
        }
        .sn-burger span {
          display: block; width: 20px; height: 2px;
          background: rgba(255,255,255,.8); border-radius: 2px;
          transition: transform .25s, opacity .2s; transform-origin: center;
        }
        .sn-burger-top-open { transform: translateY(7px) rotate(45deg) !important; }
        .sn-burger-mid-open { opacity: 0 !important; transform: scaleX(0) !important; }
        .sn-burger-bot-open { transform: translateY(-7px) rotate(-45deg) !important; }

        /* Drawer */
        .sn-drawer {
          position: fixed; top: 68px; right: 0;
          width: 280px; height: calc(100vh - 68px);
          background: #23272A; border-left: 1px solid rgba(255,255,255,.08);
          transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
          z-index: 199; overflow-y: auto;
        }
        .sn-drawer-open { transform: translateX(0); }
        .sn-drawer-inner { display: flex; flex-direction: column; padding: 1rem 0; }
        .sn-drawer-link {
          display: block; padding: .875rem 1.5rem;
          font-size: .9375rem; font-weight: 500; color: rgba(255,255,255,.7);
          transition: color .12s, background .12s;
          background: none; border: none; cursor: pointer; text-align: left;
          font-family: inherit; width: 100%;
        }
        .sn-drawer-link:hover { color: #FFFFFF; background: rgba(255,255,255,.05); }
        .sn-drawer-link--active { color: #84DBD5; }
        .sn-drawer-div { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: .5rem 0; }
        .sn-drawer-cta {
          margin: .5rem 1rem 0; background: #84DBD5; color: #23272A !important;
          border-radius: 8px; text-align: center; font-weight: 700; padding: .75rem 1rem;
          width: auto;
        }
        .sn-drawer-cta:hover { opacity: .88; background: #84DBD5 !important; }
        .sn-drawer-logout { color: rgba(229,83,75,.8) !important; }
        .sn-drawer-logout:hover { color: #E5534B !important; }
        .sn-backdrop { position: fixed; inset: 0; z-index: 198; background: rgba(0,0,0,.6); }

        @media (max-width: 768px) {
          .sn-inner { padding: 0 1rem; }
          .sn-links { display: none; }
          .sn-actions { margin-left: auto; }
          .sn-actions .sn-login,
          .sn-actions .sn-logout,
          .sn-actions .sn-register { display: none; }
          .sn-burger { display: flex; }
        }
      `}</style>
    </>
  );
}
