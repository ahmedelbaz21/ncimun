'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QRCode from 'qrcode';

type Profile = {
  id: string;
  delegate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school: string;
  grade: number;
  dietary_notes: string | null;
};

type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
};

type Registration = {
  id: number;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  needs_transport: boolean;
  conferences: {
    title: string;
    slug: string;
    start_date: string;
    end_date: string;
    venue: string;
  };
  allocated_council: { name: string } | null;
  transport_routes: { location_name: string } | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (s.getMonth() === e.getMonth()) return `${s.getDate()} – ${e.toLocaleDateString('en-GB', opts)}`;
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', opts)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ec, setEc] = useState<EmergencyContact | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ reg: Registration; qrUrl: string } | null>(null);
  const [generatingQr, setGeneratingQr] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase
        .from('delegate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profileData) { router.push('/register'); return; }
      setProfile(profileData);

      const { data: ecData } = await supabase
        .from('emergency_contacts')
        .select('name, relation, phone')
        .eq('delegate_id', profileData.id)
        .single();

      if (ecData) setEc(ecData);

      const { data: regData } = await supabase
        .from('registrations')
        .select(`
          id, payment_status, payment_method, created_at, needs_transport,
          conferences(title, slug, start_date, end_date, venue),
          allocated_council:councils!registrations_allocated_council_id_fkey(name),
          transport_routes(location_name)
        `)
        .eq('delegate_id', profileData.id)
        .order('created_at', { ascending: false });

      if (regData) setRegistrations(regData as any);
      setLoading(false);
    };
    load();
  }, []);

  const handleViewQR = async (reg: Registration) => {
    if (!profile) return;
    setGeneratingQr(reg.id);

    const qrContent = JSON.stringify({
      delegate_id: profile.delegate_id,
      name: `${profile.first_name} ${profile.last_name}`,
      conference: reg.conferences?.title,
      council: reg.allocated_council?.name || 'Pending',
      reg_id: reg.id,
    });

    const qrUrl = await QRCode.toDataURL(qrContent, {
      width: 280,
      margin: 2,
      color: { dark: '#23272A', light: '#FFFFFF' },
    });

    setQrModal({ reg, qrUrl });
    setGeneratingQr(null);
  };

  const handleDownloadQR = () => {
    if (!qrModal || !profile) return;
    const a = document.createElement('a');
    a.href = qrModal.qrUrl;
    a.download = `NCIMUN_ticket_${profile.delegate_id}.png`;
    a.click();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="pr-root">
        <div className="pr-loading">Loading your profile…</div>
        <style>{BASE_STYLES}</style>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="pr-root">

      {/* ── Top bar ── */}
      <div className="pr-topbar">
        <Link href="/" className="pr-back">← Home</Link>
        <button className="pr-logout" onClick={handleLogout}>Log out</button>
      </div>

      {/* ── Identity header ── */}
      <div className="pr-identity">
        <div className="pr-avatar">
          {profile.first_name[0]}{profile.last_name[0]}
        </div>
        <div className="pr-identity-info">
          <h1 className="pr-name">{profile.first_name} {profile.last_name}</h1>
          <p className="pr-did">{profile.delegate_id}</p>
          <p className="pr-meta">{profile.school} · Grade {profile.grade}</p>
        </div>
      </div>

      {/* ── Tickets ── */}
      <div className="pr-section">
        <div className="pr-section-head">
          <h2 className="pr-section-title">My tickets</h2>
          <Link href="/conferences" className="pr-btn-outline">Browse conferences →</Link>
        </div>

        {registrations.length === 0 ? (
          <div className="pr-empty">
            <p>You haven't registered for any conferences yet.</p>
            <Link href="/conferences" className="pr-btn-primary">Browse conferences</Link>
          </div>
        ) : (
          <div className="pr-tickets">
            {registrations.map(reg => (
              <div key={reg.id} className={`pr-ticket ${reg.payment_status === 'flagged' ? 'pr-ticket--flagged' : ''}`}>
                {/* Left section */}
                <div className="pr-ticket-left">
                  <div className="pr-ticket-conf">{reg.conferences?.title}</div>
                  <div className="pr-ticket-dates">
                    {reg.conferences?.start_date && reg.conferences?.end_date
                      ? formatDateRange(reg.conferences.start_date, reg.conferences.end_date)
                      : 'Dates TBC'}
                  </div>
                  <div className="pr-ticket-venue">📍 {reg.conferences?.venue || 'TBC'}</div>

                  <div className="pr-ticket-details">
                    <div className="pr-ticket-detail">
                      <span className="pr-ticket-detail-label">Council</span>
                      <span className="pr-ticket-detail-value">
                        {reg.allocated_council?.name || 'Pending allocation'}
                      </span>
                    </div>
                    <div className="pr-ticket-detail">
                      <span className="pr-ticket-detail-label">Transport</span>
                      <span className="pr-ticket-detail-value">
                        {reg.needs_transport ? reg.transport_routes?.location_name || '—' : 'Own transport'}
                      </span>
                    </div>
                    <div className="pr-ticket-detail">
                      <span className="pr-ticket-detail-label">Registered</span>
                      <span className="pr-ticket-detail-value">{formatDate(reg.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Right section */}
                <div className="pr-ticket-right">
                  <span className={`pr-status pr-status--${reg.payment_status}`}>
                    {reg.payment_status === 'paid' ? '✓ Paid' :
                     reg.payment_status === 'pending' ? '⏳ Pending' :
                     reg.payment_status === 'flagged' ? '⚠️ Flagged' : reg.payment_status}
                  </span>

                  {reg.payment_status === 'paid' ? (
                    <button
                      className="pr-btn-qr"
                      onClick={() => handleViewQR(reg)}
                      disabled={generatingQr === reg.id}
                    >
                      {generatingQr === reg.id ? 'Generating…' : '🎫 View ticket'}
                    </button>
                  ) : (
                    <Link
                      href={`/payment-instructions?conference=${reg.conferences?.slug}`}
                      className="pr-btn-pay"
                    >
                      💳 Pay now
                    </Link>
                  )}
                </div>

                <div className="pr-ticket-notch pr-ticket-notch--top" />
                <div className="pr-ticket-notch pr-ticket-notch--bottom" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Profile info ── */}
      <div className="pr-section">
        <h2 className="pr-section-title">Profile</h2>
        <div className="pr-info-card">
          <div className="pr-info-grid">
            {[
              { label: 'Email', value: profile.email },
              { label: 'Phone', value: profile.phone },
              { label: 'School', value: profile.school },
              { label: 'Grade', value: `Grade ${profile.grade}` },
              ...(profile.dietary_notes ? [{ label: 'Dietary notes', value: profile.dietary_notes }] : []),
            ].map(item => (
              <div key={item.label} className="pr-info-item">
                <span className="pr-info-label">{item.label}</span>
                <span className="pr-info-value">{item.value}</span>
              </div>
            ))}
          </div>

          {ec && (
            <>
              <div className="pr-info-divider" />
              <p className="pr-info-subtitle">Emergency contact</p>
              <div className="pr-info-grid">
  <div className="pr-info-item">
    <span className="pr-info-label">Name</span>
    <span className="pr-info-value">{ec.name}</span>
  </div>
  <div className="pr-info-item">
    <span className="pr-info-label">Relation</span>
    <span className="pr-info-value">{ec.relation}</span>
  </div>
  <div className="pr-info-item">
    <span className="pr-info-label">Phone</span>
    <span className="pr-info-value">{ec.phone}</span>
  </div>
</div>
            </>
          )}
        </div>
      </div>

      {/* ── QR Modal ── */}
      {qrModal && profile && (
        <div className="pr-modal-overlay" onClick={() => setQrModal(null)}>
          <div className="pr-modal" onClick={e => e.stopPropagation()}>
            <button className="pr-modal-close" onClick={() => setQrModal(null)}>✕</button>

            {/* Ticket card */}
            <div className="pr-modal-ticket">
              <div className="pr-modal-ticket-left">
                <img src="/logo.png" alt="NCIMUN" className="pr-modal-logo" />
                <div className="pr-modal-conf">{qrModal.reg.conferences?.title}</div>
                <div className="pr-modal-dates">
                  {qrModal.reg.conferences?.start_date && qrModal.reg.conferences?.end_date
                    ? formatDateRange(qrModal.reg.conferences.start_date, qrModal.reg.conferences.end_date)
                    : 'Dates TBC'}
                </div>
                <div className="pr-modal-divider" />
                <div className="pr-modal-row">
                  <span className="pr-modal-label">Delegate</span>
                  <span className="pr-modal-val">{profile.first_name} {profile.last_name}</span>
                </div>
                <div className="pr-modal-row">
                  <span className="pr-modal-label">ID</span>
                  <span className="pr-modal-val pr-modal-val--id">{profile.delegate_id}</span>
                </div>
                <div className="pr-modal-row">
                  <span className="pr-modal-label">Council</span>
                  <span className="pr-modal-val">{qrModal.reg.allocated_council?.name || 'Pending'}</span>
                </div>
              </div>
              <div className="pr-modal-ticket-right">
                <img src={qrModal.qrUrl} alt="QR Code" className="pr-modal-qr" />
                <p className="pr-modal-qr-label">Scan at check-in</p>
              </div>
              <div className="pr-modal-notch pr-modal-notch--top" />
              <div className="pr-modal-notch pr-modal-notch--bottom" />
            </div>

            <div className="pr-modal-actions">
              <button className="pr-btn-primary" onClick={handleDownloadQR}>↓ Download ticket</button>
              <button className="pr-btn-ghost-dark" onClick={() => setQrModal(null)}>Close</button>
            </div>

            <p className="pr-modal-note">
              ⚠️ Present this QR code at registration on your first day.
            </p>
          </div>
        </div>
      )}

      <style>{BASE_STYLES}</style>
    </main>
  );
}

const BASE_STYLES = `
  :root {
    --blue:   #5F96CA;
    --aqua:   #84DBD5;
    --black:  #23272A;
    --white:  #FFFFFF;
    --gray-50:  #F8F9FA;
    --gray-100: #F1F3F5;
    --gray-200: #E9ECEF;
    --gray-400: #ADB5BD;
    --gray-600: #6C757D;
    --green:  #2D9B6F;
    --red:    #E5534B;
    --yellow: #F8E98D;
    --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
    --shadow: 0 4px 24px rgba(35,39,42,.08);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
  a { text-decoration: none; color: inherit; }

  .pr-root { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 6rem; display: flex; flex-direction: column; gap: 2rem; }
  .pr-loading { text-align: center; padding: 6rem; color: var(--gray-400); }

  /* Top bar */
  .pr-topbar { display: flex; justify-content: space-between; align-items: center; }
  .pr-back { font-size: .875rem; font-weight: 700; color: var(--gray-600); transition: color .15s; }
  .pr-back:hover { color: var(--black); }
  .pr-logout { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: .875rem; font-weight: 600; color: var(--gray-400); transition: color .15s; }
  .pr-logout:hover { color: var(--red); }

  /* Identity */
  .pr-identity { display: flex; align-items: center; gap: 1.25rem; background: var(--black); border-radius: 16px; padding: 1.75rem 2rem; }
  .pr-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--blue); color: var(--white); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 900; flex-shrink: 0; }
  .pr-name { font-size: 1.375rem; font-weight: 900; color: var(--white); letter-spacing: -.02em; }
  .pr-did { font-size: .875rem; font-weight: 700; color: var(--aqua); margin-top: .2rem; letter-spacing: .06em; }
  .pr-meta { font-size: .8125rem; color: rgba(255,255,255,.45); margin-top: .2rem; }

  /* Sections */
  .pr-section { display: flex; flex-direction: column; gap: 1rem; }
  .pr-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .75rem; }
  .pr-section-title { font-size: 1rem; font-weight: 800; color: var(--black); }

  /* Tickets */
  .pr-tickets { display: flex; flex-direction: column; gap: 1rem; }
  .pr-ticket {
    background: var(--white); border-radius: 14px;
    border: 1.5px solid var(--gray-200);
    display: flex; align-items: stretch;
    position: relative; overflow: visible;
    transition: box-shadow .15s;
  }
  .pr-ticket:hover { box-shadow: var(--shadow); }
  .pr-ticket--flagged { border-color: var(--red); }

  .pr-ticket-left {
    flex: 1; padding: 1.5rem;
    border-right: 2px dashed var(--gray-200);
    display: flex; flex-direction: column; gap: .625rem;
  }
  .pr-ticket-right {
    width: 140px; padding: 1.25rem;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1rem;
    flex-shrink: 0;
  }

  .pr-ticket-conf { font-size: .9375rem; font-weight: 800; color: var(--black); }
  .pr-ticket-dates { font-size: .8125rem; color: var(--gray-600); }
  .pr-ticket-venue { font-size: .8125rem; color: var(--gray-600); }

  .pr-ticket-details { display: flex; flex-direction: column; gap: .35rem; margin-top: .25rem; }
  .pr-ticket-detail { display: flex; gap: .5rem; align-items: baseline; }
  .pr-ticket-detail-label { font-size: .6875rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; min-width: 70px; flex-shrink: 0; }
  .pr-ticket-detail-value { font-size: .8125rem; font-weight: 600; color: var(--black); }

  /* Notches */
  .pr-ticket-notch {
    position: absolute; width: 20px; height: 20px; border-radius: 50%;
    background: var(--gray-50); border: 1.5px solid var(--gray-200);
    right: 129px;
  }
  .pr-ticket-notch--top { top: -10px; }
  .pr-ticket-notch--bottom { bottom: -10px; }

  /* Status */
  .pr-status { font-size: .6875rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: .3rem .75rem; border-radius: 999px; white-space: nowrap; }
  .pr-status--paid { background: rgba(45,155,111,.12); color: var(--green); }
  .pr-status--pending { background: rgba(248,233,141,.3); color: #8a7a00; }
  .pr-status--flagged { background: rgba(229,83,75,.1); color: var(--red); }

  /* Buttons */
  .pr-btn-primary { background: var(--blue); color: var(--white); padding: .65rem 1.5rem; border-radius: 8px; border: none; font-family: var(--font); font-size: .875rem; font-weight: 700; cursor: pointer; transition: opacity .15s; display: inline-block; text-align: center; }
  .pr-btn-primary:hover { opacity: .88; }
  .pr-btn-outline { border: 1.5px solid var(--blue); color: var(--blue); padding: .45rem 1rem; border-radius: 6px; font-size: .8125rem; font-weight: 700; font-family: var(--font); display: inline-block; transition: background .15s; }
  .pr-btn-outline:hover { background: var(--blue); color: var(--white); }
  .pr-btn-qr { background: var(--black); color: var(--white); border: none; border-radius: 8px; padding: .6rem .875rem; font-family: var(--font); font-size: .8rem; font-weight: 700; cursor: pointer; width: 100%; text-align: center; transition: opacity .15s; }
  .pr-btn-qr:hover { opacity: .8; }
  .pr-btn-pay { background: var(--blue); color: var(--white); border-radius: 8px; padding: .6rem .875rem; font-size: .8rem; font-weight: 700; font-family: var(--font); display: block; text-align: center; width: 100%; transition: opacity .15s; }
  .pr-btn-pay:hover { opacity: .88; }
  .pr-btn-ghost-dark { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: .875rem; font-weight: 600; color: var(--gray-600); padding: .65rem 1rem; transition: color .15s; }
  .pr-btn-ghost-dark:hover { color: var(--black); }

  /* Info card */
  .pr-info-card { background: var(--white); border: 1.5px solid var(--gray-200); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .pr-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .pr-info-item { display: flex; flex-direction: column; gap: .2rem; }
  .pr-info-label { font-size: .6875rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; }
  .pr-info-value { font-size: .9rem; font-weight: 600; color: var(--black); }
  .pr-info-divider { border: none; border-top: 1px solid var(--gray-200); }
  .pr-info-subtitle { font-size: .75rem; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: .08em; }

  /* Empty */
  .pr-empty { text-align: center; padding: 3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--gray-600); background: var(--white); border: 1.5px solid var(--gray-200); border-radius: 14px; }

  /* Modal */
  .pr-modal-overlay { position: fixed; inset: 0; background: rgba(35,39,42,.6); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 1rem; }
  .pr-modal { background: var(--gray-50); border-radius: 18px; padding: 1.75rem; max-width: 520px; width: 100%; display: flex; flex-direction: column; gap: 1.25rem; position: relative; }
  .pr-modal-close { position: absolute; top: 1rem; right: 1rem; background: var(--gray-200); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: .75rem; color: var(--gray-600); }
  .pr-modal-close:hover { background: var(--gray-400); color: var(--white); }

  /* Modal ticket */
  .pr-modal-ticket { background: var(--white); border-radius: 14px; border: 1.5px solid var(--gray-200); display: flex; position: relative; overflow: visible; }
  .pr-modal-ticket-left { flex: 1; padding: 1.5rem; border-right: 2px dashed var(--gray-200); display: flex; flex-direction: column; gap: .625rem; }
  .pr-modal-ticket-right { width: 150px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; flex-shrink: 0; }
  .pr-modal-logo { height: 36px; width: auto; object-fit: contain; margin-bottom: .25rem; }
  .pr-modal-conf { font-size: .875rem; font-weight: 800; color: var(--blue); text-transform: uppercase; letter-spacing: .06em; }
  .pr-modal-dates { font-size: .8rem; color: var(--gray-600); }
  .pr-modal-divider { border: none; border-top: 1px solid var(--gray-200); margin: .25rem 0; }
  .pr-modal-row { display: flex; flex-direction: column; gap: .1rem; }
  .pr-modal-label { font-size: .6rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .08em; }
  .pr-modal-val { font-size: .875rem; font-weight: 700; color: var(--black); }
  .pr-modal-val--id { color: var(--blue); }
  .pr-modal-qr { width: 120px; height: 120px; border-radius: 8px; }
  .pr-modal-qr-label { font-size: .6875rem; color: var(--gray-400); font-weight: 600; text-align: center; }
  .pr-modal-notch { position: absolute; width: 20px; height: 20px; border-radius: 50%; background: var(--gray-50); border: 1.5px solid var(--gray-200); right: 139px; }
  .pr-modal-notch--top { top: -10px; }
  .pr-modal-notch--bottom { bottom: -10px; }

  .pr-modal-actions { display: flex; gap: .75rem; align-items: center; justify-content: center; }
  .pr-modal-note { font-size: .8rem; color: var(--gray-600); text-align: center; line-height: 1.6; background: rgba(248,233,141,.2); border: 1px solid rgba(248,233,141,.4); border-radius: 8px; padding: .75rem 1rem; }

  @media (max-width: 560px) {
    .pr-ticket-right { width: 110px; }
    .pr-ticket-notch { right: 99px; }
    .pr-info-grid { grid-template-columns: 1fr; }
    .pr-modal-ticket { flex-direction: column; }
    .pr-modal-ticket-left { border-right: none; border-bottom: 2px dashed var(--gray-200); }
    .pr-modal-ticket-right { width: 100%; }
    .pr-modal-notch { display: none; }
  }
`;