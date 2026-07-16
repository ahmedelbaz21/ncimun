'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Conference = {
  id: number;
  title: string;
  slug: string;
  type: string;
  status: string;
  part: number | null;
  description: string | null;
  theme: string | null;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  price: number | null;
  capacity: number | null;
};

function formatDate(start: string | null, end: string | null) {
  if (!start || !end) return 'Dates TBC';
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} – ${e.toLocaleDateString('en-GB', opts)}`;
  }
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', opts)}`;
}

export default function ConferencesPage() {
  const router = useRouter();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: confData } = await supabase
        .from('conferences')
        .select('*')
        .order('start_date', { ascending: true });

      if (confData) setConferences(confData);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch registered conference IDs for this user
      if (authUser) {
        const { data: profile } = await supabase
          .from('delegate_profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (profile) {
          const { data: regs } = await supabase
            .from('registrations')
            .select('conference_id')
            .eq('delegate_id', profile.id);

          if (regs) setRegisteredIds(regs.map(r => r.conference_id));
        }
      }

      setLoading(false);
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetTickets = async (conf: Conference) => {
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase
      .from('delegate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) { router.push('/login'); return; }

    router.push(`/conferences/${conf.slug}/register`);
  };

  const summerCamps = conferences.filter(c => c.type === 'summer_camp');
  const confVolumes = conferences.filter(c => c.type === 'conference');

  if (loading) {
    return (
      <main className="cp-root">
        <div className="cp-loading">Loading conferences…</div>
      </main>
    );
  }

  return (
    <main className="cp-root">
      <div className="cp-header">
        <div className="cp-header-top">
          <p className="cp-eyebrow">NCIMUN</p>
          <Link href="/" className="cp-back">← Home</Link>
        </div>
        <h1 className="cp-title">Conferences</h1>
        <p className="cp-subtitle">
          Choose a conference below to secure your spot. Active registrations are open now.
        </p>
        {!user && (
          <div className="cp-auth-banner">
            <span>You need an account to register for a conference.</span>
            <div className="cp-auth-actions">
              <Link href="/register" className="cp-btn-primary">Create account</Link>
              <Link href="/login" className="cp-btn-ghost">Log in</Link>
            </div>
          </div>
        )}
      </div>

      {summerCamps.length > 0 && (
        <section className="cp-section">
          <h2 className="cp-section-title">Summer Camp</h2>
          <div className="cp-grid">
            {summerCamps.map(conf => (
              <ConferenceCard key={conf.id} conf={conf} isRegistered={registeredIds.includes(conf.id)} isLoggedIn={!!user} onGetTickets={() => handleGetTickets(conf)} />
            ))}
          </div>
        </section>
      )}

      {confVolumes.length > 0 && (
        <section className="cp-section">
          <h2 className="cp-section-title">Volume 7</h2>
          <div className="cp-grid">
            {confVolumes.map(conf => (
              <ConferenceCard key={conf.id} conf={conf} isRegistered={registeredIds.includes(conf.id)} isLoggedIn={!!user} onGetTickets={() => handleGetTickets(conf)} />
            ))}
          </div>
        </section>
      )}

      <style>{`
        :root {
          --blue:#5F96CA; --aqua:#84DBD5; --black:#23272A; --yellow:#F8E98D;
          --white:#FFFFFF; --gray-50:#F8F9FA; --gray-200:#E9ECEF;
          --gray-400:#ADB5BD; --gray-600:#6C757D; --green:#2D9B6F;
          --font:'Avenir','Avenir Next','Century Gothic',sans-serif;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:var(--font);background:var(--gray-50);color:var(--black);}
        a{text-decoration:none;color:inherit;}
        .cp-root{max-width:1100px;margin:0 auto;padding:4rem 2rem 6rem;}
        .cp-loading{text-align:center;padding:6rem;color:var(--gray-400);font-size:1rem;}
        .cp-header{margin-bottom:3rem;}
        .cp-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;}
        .cp-eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);}
        .cp-back{font-size:.875rem;font-weight:700;color:var(--gray-600);transition:color .15s;}
        .cp-back:hover{color:var(--black);}
        .cp-title{font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-.02em;margin-bottom:.75rem;}
        .cp-subtitle{font-size:1rem;color:var(--gray-600);line-height:1.6;max-width:520px;}
        .cp-auth-banner{margin-top:1.5rem;background:rgba(95,150,202,.08);border:1.5px solid rgba(95,150,202,.2);border-radius:10px;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;font-size:.9rem;}
        .cp-auth-actions{display:flex;gap:.75rem;align-items:center;}
        .cp-btn-primary{background:var(--blue);color:var(--white);padding:.5rem 1.25rem;border-radius:6px;font-size:.875rem;font-weight:700;font-family:var(--font);display:inline-block;transition:opacity .15s;}
        .cp-btn-primary:hover{opacity:.88;}
        .cp-btn-ghost{color:var(--blue);font-size:.875rem;font-weight:600;}
        .cp-btn-ghost:hover{text-decoration:underline;}
        .cp-section{margin-bottom:3.5rem;}
        .cp-section-title{font-size:1.125rem;font-weight:800;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:2px solid var(--gray-200);}
        .cp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;}
        @media(max-width:900px){.cp-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:580px){.cp-grid{grid-template-columns:1fr;}.cp-root{padding:2rem 1rem 4rem;}}
      `}</style>
    </main>
  );
}

function ConferenceCard({ conf, isRegistered, isLoggedIn, onGetTickets }: {
  conf: Conference;
  isRegistered: boolean;
  isLoggedIn: boolean;
  onGetTickets: () => void;
}) {
  const isActive = conf.status === 'active';
  const isComingSoon = conf.status === 'coming_soon';
  const isSummerCamp = conf.type === 'summer_camp';

  return (
    <div className={`cc-card ${isActive ? 'cc-card--active' : ''} ${isComingSoon ? 'cc-card--soon' : ''}`}>

      {/* ── Mattel-style scalloped badge ── */}
      {isSummerCamp && isActive && !isRegistered && (
        <div className="cc-sticker">
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="cc-sticker-bg">
            <circle cx="60" cy="60" r="54" fill="#F8E98D"/>
            <circle cx="60" cy="6" r="6" fill="#F8E98D"/>
            <circle cx="60" cy="114" r="6" fill="#F8E98D"/>
            <circle cx="6" cy="60" r="6" fill="#F8E98D"/>
            <circle cx="114" cy="60" r="6" fill="#F8E98D"/>
            <circle cx="22" cy="22" r="6" fill="#F8E98D"/>
            <circle cx="98" cy="22" r="6" fill="#F8E98D"/>
            <circle cx="22" cy="98" r="6" fill="#F8E98D"/>
            <circle cx="98" cy="98" r="6" fill="#F8E98D"/>
            <circle cx="11" cy="40" r="6" fill="#F8E98D"/>
            <circle cx="11" cy="80" r="6" fill="#F8E98D"/>
            <circle cx="109" cy="40" r="6" fill="#F8E98D"/>
            <circle cx="109" cy="80" r="6" fill="#F8E98D"/>
            <circle cx="40" cy="11" r="6" fill="#F8E98D"/>
            <circle cx="80" cy="11" r="6" fill="#F8E98D"/>
            <circle cx="40" cy="109" r="6" fill="#F8E98D"/>
            <circle cx="80" cy="109" r="6" fill="#F8E98D"/>
          </svg>
          <div className="cc-sticker-text">
            <span className="cc-sticker-line1">Early</span>
            <span className="cc-sticker-line2">Bird!</span>
          </div>
        </div>
      )}

      <div className="cc-top">
        {isRegistered && <span className="cc-badge cc-badge--registered">✓ Registered</span>}
        {isActive && !isRegistered && <span className="cc-badge cc-badge--open">Open</span>}
        {isComingSoon && <span className="cc-badge cc-badge--soon">Coming soon</span>}
        {conf.status === 'closed' && <span className="cc-badge cc-badge--closed">Closed</span>}
      </div>

      <div className="cc-body">
        {conf.part && <span className="cc-part">Part {conf.part}</span>}
        <h3 className="cc-title">{conf.title}</h3>

        <div className="cc-details">
          <div className="cc-detail">
            <span className="cc-icon">📅</span>
            <span>{formatDate(conf.start_date, conf.end_date)}</span>
          </div>
          <div className="cc-detail">
            <span className="cc-icon">📍</span>
            <span>{conf.venue || 'TBC'}</span>
          </div>
          {isSummerCamp ? (
            <div className="cc-detail">
              <span className="cc-icon">🎟</span>
              <span className="cc-price-old">3,000 EGP</span>
              <span className="cc-price-new">2,750 EGP</span>
            </div>
          ) : conf.price ? (
            <div className="cc-detail">
              <span className="cc-icon">🎟</span>
              <span>{conf.price.toLocaleString()} EGP</span>
            </div>
          ) : null}
        </div>

        {conf.theme && <p className="cc-theme">Theme: <em>{conf.theme}</em></p>}
      </div>

      <div className="cc-footer">
        {isRegistered ? (
          <Link href="/profile" className="cc-btn cc-btn--has-ticket">
            🎫 View your ticket →
          </Link>
        ) : isActive ? (
          <button className="cc-btn cc-btn--primary" onClick={onGetTickets}>
            {isLoggedIn ? 'Get tickets →' : 'Log in to register →'}
          </button>
        ) : (
          <button className="cc-btn cc-btn--soon" disabled>Coming soon</button>
        )}
      </div>

      <style>{`
        .cc-card {
          background:#fff; border-radius:14px; border:1.5px solid #E9ECEF;
          display:flex; flex-direction:column;
          transition:box-shadow .15s,border-color .15s;
          overflow:visible; position:relative;
        }
        .cc-card:hover{box-shadow:0 4px 24px rgba(35,39,42,.08);}
        .cc-card--active{border-color:#5F96CA;}
        .cc-card--soon{opacity:.75;}

        .cc-sticker {
          position:absolute; top:-20px; right:-20px;
          width:88px; height:88px;
          display:flex; align-items:center; justify-content:center;
          z-index:10;
          filter:drop-shadow(0 3px 8px rgba(35,39,42,.3));
          animation:cc-wobble 4s ease-in-out infinite;
        }
        @keyframes cc-wobble {
          0%,100%{transform:rotate(-6deg) scale(1);}
          25%{transform:rotate(0deg) scale(1.05);}
          50%{transform:rotate(6deg) scale(1);}
          75%{transform:rotate(0deg) scale(1.05);}
        }
        .cc-sticker-bg{position:absolute;inset:0;width:100%;height:100%;}
        .cc-sticker-text{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;line-height:1.15;}
        .cc-sticker-line1{font-size:.6rem;font-weight:900;color:#23272A;text-transform:uppercase;letter-spacing:.08em;}
        .cc-sticker-line2{font-size:1rem;font-weight:900;color:#23272A;text-transform:uppercase;letter-spacing:.04em;}

        .cc-top{padding:1rem 1.25rem .5rem;min-height:36px;}
        .cc-badge{display:inline-block;font-size:.6875rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.25rem .75rem;border-radius:999px;}
        .cc-badge--open{background:rgba(95,150,202,.12);color:#5F96CA;}
        .cc-badge--registered{background:rgba(45,155,111,.12);color:#2D9B6F;}
        .cc-badge--soon{background:rgba(35,39,42,.07);color:#6C757D;}
        .cc-badge--closed{background:rgba(229,83,75,.1);color:#E5534B;}

        .cc-body{padding:.5rem 1.25rem 1rem;flex:1;display:flex;flex-direction:column;gap:.75rem;}
        .cc-part{font-size:.75rem;font-weight:700;color:#5F96CA;letter-spacing:.08em;text-transform:uppercase;}
        .cc-title{font-size:1rem;font-weight:800;line-height:1.3;color:#23272A;}
        .cc-details{display:flex;flex-direction:column;gap:.4rem;}
        .cc-detail{display:flex;align-items:center;gap:.5rem;font-size:.8125rem;color:#6C757D;line-height:1.4;}
        .cc-icon{flex-shrink:0;}
        .cc-price-old{text-decoration:line-through;color:#ADB5BD;font-size:.8125rem;}
        .cc-price-new{font-weight:800;color:#2D9B6F;font-size:.9375rem;}
        .cc-theme{font-size:.8125rem;color:#6C757D;}

        .cc-footer{padding:1rem 1.25rem;border-top:1px solid #E9ECEF;}
        .cc-btn{width:100%;padding:.65rem 1rem;border-radius:8px;border:none;font-family:'Avenir','Avenir Next','Century Gothic',sans-serif;font-size:.875rem;font-weight:700;cursor:pointer;transition:opacity .15s;text-align:center;display:block;}
        .cc-btn--primary{background:#5F96CA;color:#fff;}
        .cc-btn--primary:hover{opacity:.88;}
        .cc-btn--has-ticket{background:rgba(45,155,111,.1);color:#2D9B6F;border:1.5px solid rgba(45,155,111,.2);}
        .cc-btn--has-ticket:hover{background:rgba(45,155,111,.18);}
        .cc-btn--soon{background:#F1F3F5;color:#ADB5BD;cursor:default;}
      `}</style>
    </div>
  );
}