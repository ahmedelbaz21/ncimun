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
  conference_id: number;
  transport_route_id: number | null;
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

type TransportRoute = {
  id: number;
  conference_id: number;
  location_name: string;
};

type TransportSelection = {
  conference_id: number;
  day_type: string;
  pickup_route_id: number | null;
  dropoff_route_id: number | null;
};

type TransportChoice = { pickup: string; dropoff: string };

const REGULAR_DAY_TYPES = [
  { key: 'weekday', label: 'Sun – Thu (Weekday)' },
  { key: 'weekend', label: 'Fri – Sat (Weekend)' },
];

const CONTI_DAY_TYPES = [
  { key: 'sun_mon', label: 'Sun – Mon' },
  { key: 'tue_thu', label: 'Tue – Thu' },
  { key: 'fri_sat', label: 'Fri – Sat (Weekend)' },
];

// Transport updates close at the end of Wednesday 28 Oct, Cairo time
const TRANSPORT_DEADLINE = new Date('2026-10-28T23:59:59+03:00');

// Display order and labels for saved selections on the ticket
const DAY_TYPE_LABELS: Record<string, string> = {
  weekday: 'Sun–Thu (Weekday)',
  sun_mon: 'Sun–Mon',
  tue_thu: 'Tue–Thu',
  fri_sat: 'Fri–Sat (Weekend)',
  weekend: 'Fri–Sat (Weekend)',
};
const DAY_TYPE_ORDER = Object.keys(DAY_TYPE_LABELS);

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
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [transportSelections, setTransportSelections] = useState<TransportSelection[]>([]);
  // Registration id whose transport panel is open (a delegate can have several tickets)
  const [showTransport, setShowTransport] = useState<number | null>(null);
  const [transportForm, setTransportForm] = useState<Record<string, TransportChoice>>({});
  const [savingTransport, setSavingTransport] = useState(false);
  const [transportSaved, setTransportSaved] = useState<number | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);

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
          conference_id, transport_route_id,
          conferences(title, slug, start_date, end_date, venue),
          allocated_council:councils!registrations_allocated_council_id_fkey(name),
          transport_routes(location_name)
        `)
        .eq('delegate_id', profileData.id)
        .order('created_at', { ascending: false });

      if (regData) {
        setRegistrations(regData as any);

        const conferenceIds = [...new Set((regData as unknown as Registration[]).map(r => r.conference_id))];
        if (conferenceIds.length > 0) {
          const { data: routeData } = await supabase
            .from('transport_routes')
            .select('id, conference_id, location_name')
            .in('conference_id', conferenceIds)
            .order('location_name');

          if (routeData) setTransportRoutes(routeData);
        }

        const { data: selectionData } = await supabase
          .from('transport_selections')
          .select('conference_id, day_type, pickup_route_id, dropoff_route_id')
          .eq('delegate_id', profileData.id);

        if (selectionData) setTransportSelections(selectionData);
      }
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

  const isConti = /conti/i.test(profile?.school ?? '');
  const dayTypes = isConti ? CONTI_DAY_TYPES : REGULAR_DAY_TYPES;

  const routeName = (id: number | null) =>
    id ? transportRoutes.find(r => r.id === id)?.location_name ?? '—' : 'No transport';

  const savedSelectionsFor = (conferenceId: number) =>
    transportSelections
      .filter(s => s.conference_id === conferenceId)
      .sort((a, b) => DAY_TYPE_ORDER.indexOf(a.day_type) - DAY_TYPE_ORDER.indexOf(b.day_type));

  const toggleTransport = (reg: Registration) => {
    if (showTransport === reg.id) { setShowTransport(null); return; }

    // Prefill with anything already saved, otherwise the route they picked at registration
    const original = reg.transport_route_id ? String(reg.transport_route_id) : '';
    const form: Record<string, TransportChoice> = {};
    for (const { key } of dayTypes) {
      const saved = transportSelections.find(s => s.conference_id === reg.conference_id && s.day_type === key);
      form[key] = saved
        ? { pickup: saved.pickup_route_id ? String(saved.pickup_route_id) : '', dropoff: saved.dropoff_route_id ? String(saved.dropoff_route_id) : '' }
        : { pickup: original, dropoff: original };
    }

    setTransportForm(form);
    setTransportSaved(null);
    setTransportError(null);
    setShowTransport(reg.id);
  };

  const handleSaveTransport = async (e: React.FormEvent, reg: Registration) => {
    e.preventDefault();
    // Pending delegates can save too; the admin counts only paid ones
    if (!profile || reg.payment_status === 'flagged' || Date.now() > TRANSPORT_DEADLINE.getTime()) return;
    setSavingTransport(true);
    setTransportError(null);

    const now = new Date().toISOString();
    const rows = dayTypes.map(({ key }) => ({
      delegate_id: profile.id,
      conference_id: reg.conference_id,
      day_type: key,
      pickup_route_id: transportForm[key]?.pickup ? parseInt(transportForm[key].pickup) : null,
      dropoff_route_id: transportForm[key]?.dropoff ? parseInt(transportForm[key].dropoff) : null,
      updated_at: now,
    }));

    const { error } = await supabase
      .from('transport_selections')
      .upsert(rows, { onConflict: 'delegate_id,conference_id,day_type' });

    setSavingTransport(false);
    if (error) { setTransportError('Could not save your transport. Please try again.'); return; }

    setTransportSelections(prev => [
      ...prev.filter(s => s.conference_id !== reg.conference_id),
      ...rows.map(({ conference_id, day_type, pickup_route_id, dropoff_route_id }) => ({ conference_id, day_type, pickup_route_id, dropoff_route_id })),
    ]);
    setShowTransport(null);
    setTransportSaved(reg.id);
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
            {registrations.map(reg => {
              const savedSelections = savedSelectionsFor(reg.conference_id);
              const hasSaved = savedSelections.length > 0;
              return (
              <div key={reg.id} className="pr-ticket-group">
              <div className={`pr-ticket ${reg.payment_status === 'flagged' ? 'pr-ticket--flagged' : ''}`}>
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
                    {!hasSaved && (
                      <div className="pr-ticket-detail">
                        <span className="pr-ticket-detail-label">Transport</span>
                        <span className="pr-ticket-detail-value">
                          {reg.needs_transport ? reg.transport_routes?.location_name || '—' : 'Own transport'}
                        </span>
                      </div>
                    )}
                    <div className="pr-ticket-detail">
                      <span className="pr-ticket-detail-label">Registered</span>
                      <span className="pr-ticket-detail-value">{formatDate(reg.created_at)}</span>
                    </div>
                  </div>

                  {hasSaved && (
                    <div className="pr-ticket-saved">
                      <span className="pr-ticket-detail-label">Saved transport</span>
                      {savedSelections.map(sel => (
                        <div key={sel.day_type} className="pr-ticket-saved-row">
                          <span className="pr-ticket-saved-day">{DAY_TYPE_LABELS[sel.day_type] ?? sel.day_type}</span>
                          <span className="pr-ticket-saved-routes">
                            Pickup: {routeName(sel.pickup_route_id)}  ·  Dropoff: {routeName(sel.dropoff_route_id)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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

              {/* Transport update */}
              <div className="pr-transport">
                {hasSaved ? (
                  <p className="pr-transport-locked">🔒 Transport selection locked</p>
                ) : Date.now() > TRANSPORT_DEADLINE.getTime() ? (
                  <p className="pr-transport-locked">🔒 Transport updates closed</p>
                ) : reg.payment_status !== 'flagged' && (
                  <button type="button" className="pr-btn-outline pr-transport-toggle" onClick={() => toggleTransport(reg)}>
                    {showTransport === reg.id ? '✕ Close' : '🚌 Update transport'}
                  </button>
                )}

                {transportSaved === reg.id && showTransport !== reg.id && (
                  <p className="pr-transport-success">✓ Transport updated successfully</p>
                )}

                {showTransport === reg.id && reg.payment_status !== 'flagged' && Date.now() <= TRANSPORT_DEADLINE.getTime() && (
                  <form className="pr-transport-panel" onSubmit={e => handleSaveTransport(e, reg)}>
                    <div className="pr-transport-head">
                      <h3 className="pr-transport-title">Update transport</h3>
                      <span className="pr-transport-deadline">Deadline: Wednesday, Oct 28 — one-time update</span>
                    </div>

                    {dayTypes.map(({ key, label }) => (
                      <div key={key} className="pr-transport-day">
                        <p className="pr-transport-day-label">{label}</p>
                        <div className="pr-transport-grid">
                          {(['pickup', 'dropoff'] as const).map(field => (
                            <label key={field} className="pr-transport-field">
                              <span className="pr-transport-field-label">{field === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
                              <select
                                className="pr-transport-select"
                                value={transportForm[key]?.[field] ?? ''}
                                onChange={e => setTransportForm(prev => ({ ...prev, [key]: { ...prev[key], [field]: e.target.value } }))}
                              >
                                <option value="">No transport needed</option>
                                {transportRoutes
                                  .filter(r => r.conference_id === reg.conference_id)
                                  .map(r => (
                                    <option key={r.id} value={r.id}>{r.location_name}</option>
                                  ))}
                              </select>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {transportError && <p className="pr-transport-error">{transportError}</p>}

                    <button type="submit" className="pr-btn-primary" disabled={savingTransport}>
                      {savingTransport ? 'Saving…' : 'Save transport'}
                    </button>
                  </form>
                )}
              </div>
              </div>
              );
            })}
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

  /* Transport update */
  .pr-ticket-group { display: flex; flex-direction: column; gap: .75rem; }
  .pr-transport { display: flex; flex-direction: column; gap: .75rem; align-items: flex-start; }
  .pr-transport-toggle { background: none; cursor: pointer; }
  .pr-transport-locked { font-size: .8125rem; font-weight: 700; color: var(--gray-600); }
  .pr-ticket-saved { display: flex; flex-direction: column; gap: .35rem; margin-top: .25rem; padding-top: .625rem; border-top: 1px solid var(--gray-200); }
  .pr-ticket-saved-row { display: flex; flex-wrap: wrap; gap: .25rem .75rem; align-items: baseline; }
  .pr-ticket-saved-day { font-size: .75rem; font-weight: 800; color: var(--blue); min-width: 120px; }
  .pr-ticket-saved-routes { font-size: .8125rem; font-weight: 600; color: var(--black); white-space: pre-wrap; }
  .pr-transport-success { font-size: .8125rem; font-weight: 700; color: var(--green); }
  .pr-transport-panel { width: 100%; background: var(--black); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
  .pr-transport-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .5rem; }
  .pr-transport-title { font-size: .9375rem; font-weight: 800; color: var(--white); }
  .pr-transport-deadline { font-size: .75rem; font-weight: 700; color: var(--yellow); background: rgba(248,233,141,.1); border: 1px solid rgba(248,233,141,.3); border-radius: 999px; padding: .3rem .75rem; }
  .pr-transport-day { display: flex; flex-direction: column; gap: .5rem; }
  .pr-transport-day-label { font-size: .75rem; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: .08em; }
  .pr-transport-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .pr-transport-field { display: flex; flex-direction: column; gap: .3rem; }
  .pr-transport-field-label { font-size: .6875rem; font-weight: 700; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .06em; }
  .pr-transport-select { width: 100%; background: rgba(255,255,255,.06); color: var(--white); border: 1.5px solid rgba(255,255,255,.15); border-radius: 8px; padding: .6rem .75rem; font-family: var(--font); font-size: .875rem; font-weight: 600; cursor: pointer; transition: border-color .15s; }
  .pr-transport-select:focus { outline: none; border-color: var(--blue); }
  .pr-transport-select option { background: var(--black); color: var(--white); }
  .pr-transport-error { font-size: .8125rem; font-weight: 600; color: var(--red); }
  .pr-transport-panel .pr-btn-primary { align-self: flex-start; }
  .pr-transport-panel .pr-btn-primary:disabled { opacity: .6; cursor: default; }

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