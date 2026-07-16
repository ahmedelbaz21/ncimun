'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Conference = {
  id: number;
  title: string;
  slug: string;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  price: number | null;
};

type Council = {
  id: number;
  council_id: number;
  councils: { name: string };
};

type TransportRoute = {
  id: number;
  location_name: string;
  pickup_time: string | null;
  price: number | null;
};

const STEPS = ['Council preferences', 'Transportation', 'Confirm & pay'];

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

export default function ConferenceRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;


  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [conference, setConference] = useState<Conference | null>(null);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [user, setUser] = useState<any>(null);

  // Form state
  const [councilPref1, setCouncilPref1] = useState('');
  const [councilPref2, setCouncilPref2] = useState('');
  const [needsTransport, setNeedsTransport] = useState<boolean | null>(null);
  const [transportRouteId, setTransportRouteId] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Auth check
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      // Fetch conference
      const { data: confData } = await supabase
        .from('conferences')
        .select('id, title, slug, venue, start_date, end_date, price')
        .eq('slug', slug)
        .single();

      if (!confData) { router.push('/conferences'); return; }
      setConference(confData);

      // Fetch councils for this conference
      const { data: councilData } = await supabase
        .from('conference_councils')
        .select('id, council_id, councils(name)')
        .eq('conference_id', confData.id);

      if (councilData) setCouncils(councilData as any);

      // Fetch transport routes for this conference
      const { data: routeData } = await supabase
        .from('transport_routes')
        .select('id, location_name, pickup_time, price')
        .eq('conference_id', confData.id)
        .order('location_name');

      if (routeData) setRoutes(routeData);

      setLoading(false);
    };
    load();
  }, [slug]);

  // Validation
  const step0Valid = councilPref1 && councilPref2 && councilPref1 !== councilPref2;
  const step1Valid = needsTransport !== null && (needsTransport === false || transportRouteId !== '');
  const step2Valid = acceptedTerms;
  const canProceed = [step0Valid, step1Valid, step2Valid][step];

  const next = () => { setError(''); if (canProceed) setStep(s => s + 1); };
  const back = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!acceptedTerms || !conference || !user) return;
  setSubmitting(true);
  setError('');

  try {
    const { data: profile } = await supabase
      .from('delegate_profiles')
      .select('id, delegate_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Delegate profile not found. Please contact support.');

    console.log('Inserting registration with:', {
      delegate_id: profile.id,
      conference_id: conference.id,
      council_pref_1: parseInt(councilPref1) || null,
      council_pref_2: parseInt(councilPref2) || null,
    });
    // Insert registration row
    const { error: regError } = await supabase
  .from('registrations')
  .insert({
    delegate_id:        profile.id,
    conference_id:      conference.id,
    council_pref_1:     parseInt(councilPref1) || null,
    council_pref_2:     parseInt(councilPref2) || null,
    needs_transport:    needsTransport || false,
    transport_route_id: transportRouteId ? parseInt(transportRouteId) : null,
    payment_status:     'pending',
  });

console.log('Registration error:', JSON.stringify(regError));
if (regError) throw new Error(regError.message);

    router.push(
      `/payment-instructions?conference=${conference.slug}&delegate=${profile.delegate_id}`
    );

  } catch (err: any) {
    setError(err.message || 'Something went wrong. Please try again.');
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <main className="cr-root">
        <div className="cr-loading">Loading…</div>
      </main>
    );
  }

  if (!conference) return null;

  return (
    <main className="cr-root">
      {/* ── Back link ── */}
      <Link href="/conferences" className="cr-back">← Back to conferences</Link>

      {/* ── Conference summary ── */}
      <div className="cr-summary">
        <div className="cr-summary-info">
          <p className="cr-summary-eyebrow">Registering for</p>
          <h1 className="cr-summary-title">{conference.title}</h1>
          <div className="cr-summary-details">
            <span>📅 {formatDate(conference.start_date, conference.end_date)}</span>
            <span>📍 {conference.venue || 'TBC'}</span>
            {conference.price && <span>🎟 {conference.price.toLocaleString()} EGP</span>}
          </div>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="cr-stepper">
        {STEPS.map((label, i) => (
          <div key={i} className={`cr-step ${i === step ? 'cr-step--active' : ''} ${i < step ? 'cr-step--done' : ''}`}>
            <div className="cr-step-dot">
              {i < step
                ? <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                : i + 1}
            </div>
            <span className="cr-step-label">{label}</span>
            {i < STEPS.length - 1 && (
              <div className={`cr-step-line ${i < step ? 'cr-step-line--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Card ── */}
      <form className="cr-card" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); next(); }}>

        {/* ── Step 0: Council Preferences ── */}
        {step === 0 && (
          <div className="cr-section">
            <h2 className="cr-section-title">Council preferences</h2>
            <p className="cr-section-desc">
              Select your top two council choices. Allocation is based on availability and preference order.
            </p>

            {councils.length === 0 ? (
              <div className="cr-empty">
                No councils have been added for this conference yet. Please check back soon.
              </div>
            ) : (
              <>
                <div className="cr-field">
                  <label className="cr-label">First preference</label>
                  <select
                    className="cr-input"
                    value={councilPref1}
                    onChange={e => setCouncilPref1(e.target.value)}
                    required
                  >
                    <option value="">Choose a council</option>
                    {councils.map(c => (
                      <option
                        key={c.council_id}
                        value={String(c.council_id)}
                        disabled={String(c.council_id) === councilPref2}
                      >
                        {c.councils.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cr-field">
                  <label className="cr-label">Second preference</label>
                  <select
                    className="cr-input"
                    value={councilPref2}
                    onChange={e => setCouncilPref2(e.target.value)}
                    required
                  >
                    <option value="">Choose a council</option>
                    {councils.map(c => (
                      <option
                        key={c.council_id}
                        value={String(c.council_id)}
                        disabled={String(c.council_id) === councilPref1}
                      >
                        {c.councils.name}
                      </option>
                    ))}
                  </select>
                </div>

                {councilPref1 && councilPref2 && councilPref1 === councilPref2 && (
                  <p className="cr-hint cr-hint--error">Please choose two different councils.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 1: Transportation ── */}
        {step === 1 && (
          <div className="cr-section">
            <h2 className="cr-section-title">Transportation</h2>
            <p className="cr-section-desc">Do you need transportation to and from the venue?</p>

            <div className="cr-toggle-group">
              <button
                type="button"
                className={`cr-toggle ${needsTransport === true ? 'cr-toggle--active' : ''}`}
                onClick={() => setNeedsTransport(true)}
              >
                Yes, I need transportation
              </button>
              <button
                type="button"
                className={`cr-toggle ${needsTransport === false ? 'cr-toggle--active' : ''}`}
                onClick={() => { setNeedsTransport(false); setTransportRouteId(''); }}
              >
                No, I have my own transport
              </button>
            </div>

            {needsTransport === true && (
              <div className="cr-field cr-field--mt">
                <label className="cr-label">Pick-up location</label>
                {routes.length === 0 ? (
                  <div className="cr-empty">No transport routes have been added yet.</div>
                ) : (
                  <div className="cr-checklist">
                    {routes.map(route => (
                      <label
                        key={route.id}
                        className={`cr-check-item ${transportRouteId === String(route.id) ? 'cr-check-item--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="transport_route"
                          value={String(route.id)}
                          checked={transportRouteId === String(route.id)}
                          onChange={() => setTransportRouteId(String(route.id))}
                          className="cr-check-radio"
                        />
                        <div className="cr-check-info">
                          <span className="cr-check-name">{route.location_name}</span>
                          <span className="cr-check-meta">
                            {route.pickup_time && `Pickup: ${route.pickup_time}`}
                            {route.pickup_time && route.price && ' · '}
                            {route.price && `${route.price.toLocaleString()} EGP`}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {needsTransport === false && (
              <div className="cr-info-box">
                No problem — you're all set without transport.
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Terms & Confirm ── */}
        {step === 2 && (
          <div className="cr-section">
            <h2 className="cr-section-title">Confirm your registration</h2>

            {/* Summary */}
            <div className="cr-confirm-box">
              <div className="cr-confirm-row">
                <span className="cr-confirm-label">Conference</span>
                <span className="cr-confirm-value">{conference.title}</span>
              </div>
              <div className="cr-confirm-row">
                <span className="cr-confirm-label">Dates</span>
                <span className="cr-confirm-value">{formatDate(conference.start_date, conference.end_date)}</span>
              </div>
              <div className="cr-confirm-row">
                <span className="cr-confirm-label">Council pref. 1</span>
                <span className="cr-confirm-value">
                  {councils.find(c => String(c.council_id) === councilPref1)?.councils.name || '—'}
                </span>
              </div>
              <div className="cr-confirm-row">
                <span className="cr-confirm-label">Council pref. 2</span>
                <span className="cr-confirm-value">
                  {councils.find(c => String(c.council_id) === councilPref2)?.councils.name || '—'}
                </span>
              </div>
              <div className="cr-confirm-row">
                <span className="cr-confirm-label">Transportation</span>
                <span className="cr-confirm-value">
                  {needsTransport
                    ? routes.find(r => String(r.id) === transportRouteId)?.location_name || '—'
                    : 'Own transport'}
                </span>
              </div>
              {conference.price && (
                <div className="cr-confirm-row cr-confirm-row--total">
                  <span className="cr-confirm-label">Total</span>
                  <span className="cr-confirm-value">
                    {(conference.price + (needsTransport
                      ? (routes.find(r => String(r.id) === transportRouteId)?.price || 0)
                      : 0)).toLocaleString()} EGP
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="cr-terms-row">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="cr-checkbox"
                required
              />
              <span>
                I have read and agree to the{' '}
                <span className="cr-terms-link" onClick={() => setShowTerms(true)}>
                  Terms & Conditions
                </span>
              </span>
            </label>

            {error && <div className="cr-error">{error}</div>}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="cr-nav">
          {step > 0 && (
            <button type="button" className="cr-btn-ghost" onClick={back}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button
              type="submit"
              className={`cr-btn-primary ${!canProceed ? 'cr-btn--disabled' : ''}`}
              disabled={!canProceed}
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              className={`cr-btn-primary ${!canProceed || submitting ? 'cr-btn--disabled' : ''}`}
              disabled={!canProceed || submitting}
            >
              {submitting ? 'Processing…' : 'Confirm & proceed to payment →'}
            </button>
          )}
        </div>
      </form>

      {/* ── Terms Modal ── */}
      {showTerms && (
        <div className="cr-modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="cr-modal" onClick={e => e.stopPropagation()}>
            <h2 className="cr-modal-title">Terms & Conditions</h2>
            <div className="cr-modal-body">
              <p>By registering for and attending the Conference, you agree to the following:</p>
              <h3>1. Registration and Payment</h3>
              <p>All delegates must complete registration and pay the applicable fees to attend. By completing registration, you agree to these terms.</p>
              <h3>2. Refund Policy</h3>
              <p>Refunds are available only up to 30% of the registration fee. Exceptions are made for medical reasons upon presentation of valid documentation.</p>
              <h3>3. Prohibited Items</h3>
              <p>Strictly prohibited on campus: nicotine products, sharp objects, energy drinks, and unauthorized audio devices. Confiscated items will not be returned.</p>
              <h3>4. Behaviour and Conduct</h3>
              <p>Delegates must behave respectfully towards staff, other delegates, and the campus. NCIMUN reserves the right to remove any delegate showing unacceptable behaviour without refund.</p>
              <h3>5. Changes to Terms</h3>
              <p>NCIMUN reserves the right to modify these terms at any time via official channels.</p>
            </div>
            <button className="cr-btn-primary" onClick={() => setShowTerms(false)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
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
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --radius: 10px;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        .cr-root { max-width: 640px; margin: 0 auto; padding: 2.5rem 1rem 5rem; }
        .cr-loading { text-align: center; padding: 6rem; color: var(--gray-400); }

        .cr-back {
          display: inline-block; font-size: .875rem; font-weight: 600;
          color: var(--gray-600); margin-bottom: 1.5rem;
          transition: color .15s;
        }
        .cr-back:hover { color: var(--black); }

        /* Conference summary */
        .cr-summary {
          background: var(--black); border-radius: 12px;
          padding: 1.5rem; margin-bottom: 2rem;
        }
        .cr-summary-eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: var(--aqua); margin-bottom: .4rem;
        }
        .cr-summary-title { font-size: 1.25rem; font-weight: 900; color: var(--white); margin-bottom: .75rem; }
        .cr-summary-details {
          display: flex; flex-wrap: wrap; gap: 1rem;
          font-size: .8125rem; color: rgba(255,255,255,.6);
        }

        /* Stepper */
        .cr-stepper {
          display: flex; align-items: center;
          margin-bottom: 2rem; width: 100%;
        }
        .cr-step { display: flex; align-items: center; flex: 1; }
        .cr-step:last-child { flex: 0; }
        .cr-step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: .8125rem; font-weight: 700; flex-shrink: 0;
          border: 2px solid var(--gray-200);
          background: var(--white); color: var(--gray-400);
          transition: all .2s; z-index: 1;
        }
        .cr-step--active .cr-step-dot { border-color: var(--blue); color: var(--blue); background: rgba(95,150,202,.08); }
        .cr-step--done .cr-step-dot { border-color: var(--blue); background: var(--blue); color: var(--white); }
        .cr-step-label {
          font-size: .75rem; font-weight: 600; color: var(--gray-400);
          white-space: nowrap; margin-left: .5rem; transition: color .2s;
        }
        .cr-step--active .cr-step-label,
        .cr-step--done .cr-step-label { color: var(--black); }
        .cr-step-line { flex: 1; height: 2px; background: var(--gray-200); margin: 0 .5rem; transition: background .2s; }
        .cr-step-line--done { background: var(--blue); }

        /* Card */
        .cr-card {
          background: var(--white); border-radius: 16px;
          box-shadow: var(--shadow); padding: 2.5rem;
          display: flex; flex-direction: column;
        }

        /* Section */
        .cr-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .cr-section-title { font-size: 1.125rem; font-weight: 800; }
        .cr-section-desc { font-size: .875rem; color: var(--gray-600); line-height: 1.6; margin-top: -.75rem; }

        /* Fields */
        .cr-field { display: flex; flex-direction: column; gap: .4rem; }
        .cr-field--mt { margin-top: .25rem; }
        .cr-label { font-size: .8125rem; font-weight: 700; }
        .cr-input {
          width: 100%; padding: .65rem .875rem;
          border: 1.5px solid var(--gray-200); border-radius: var(--radius);
          font-family: var(--font); font-size: .9375rem; color: var(--black);
          background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s;
          appearance: none;
        }
        .cr-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(95,150,202,.15); }

        .cr-hint { font-size: .75rem; color: var(--gray-600); }
        .cr-hint--error { color: var(--red); }

        .cr-empty {
          background: var(--gray-100); border-radius: 8px;
          padding: 1rem 1.25rem; font-size: .875rem; color: var(--gray-600);
          text-align: center;
        }

        /* Transport toggle */
        .cr-toggle-group { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        .cr-toggle {
          padding: .875rem 1rem; border-radius: var(--radius);
          border: 1.5px solid var(--gray-200);
          font-family: var(--font); font-size: .875rem; font-weight: 600;
          color: var(--gray-600); background: var(--white); cursor: pointer;
          transition: all .15s; text-align: center;
        }
        .cr-toggle:hover { border-color: var(--blue); color: var(--blue); }
        .cr-toggle--active { border-color: var(--blue); background: rgba(95,150,202,.08); color: var(--blue); }

        /* Checklist */
        .cr-checklist { display: flex; flex-direction: column; gap: .5rem; }
        .cr-check-item {
          display: flex; align-items: center; gap: .75rem;
          padding: .75rem 1rem; border-radius: 8px;
          border: 1.5px solid var(--gray-200);
          cursor: pointer; transition: all .15s;
        }
        .cr-check-item:hover { border-color: var(--blue); }
        .cr-check-item--selected { border-color: var(--blue); background: rgba(95,150,202,.07); }
        .cr-check-radio { accent-color: var(--blue); flex-shrink: 0; }
        .cr-check-info { display: flex; flex-direction: column; gap: .15rem; }
        .cr-check-name { font-size: .9rem; font-weight: 600; color: var(--black); }
        .cr-check-meta { font-size: .75rem; color: var(--gray-600); }

        .cr-info-box {
          background: rgba(132,219,213,.1); border: 1px solid rgba(132,219,213,.3);
          border-radius: 8px; padding: .875rem 1rem;
          font-size: .875rem; color: var(--black);
        }

        /* Confirm box */
        .cr-confirm-box {
          border: 1.5px solid var(--gray-200); border-radius: 10px;
          overflow: hidden;
        }
        .cr-confirm-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: .75rem 1rem; gap: 1rem;
          border-bottom: 1px solid var(--gray-200);
        }
        .cr-confirm-row:last-child { border-bottom: none; }
        .cr-confirm-row--total { background: var(--gray-50); }
        .cr-confirm-label { font-size: .8125rem; color: var(--gray-600); }
        .cr-confirm-value { font-size: .875rem; font-weight: 600; color: var(--black); text-align: right; }
        .cr-confirm-row--total .cr-confirm-value { color: var(--blue); font-size: 1rem; }

        /* Terms */
        .cr-terms-row { display: flex; align-items: flex-start; gap: .625rem; font-size: .875rem; cursor: pointer; }
        .cr-checkbox { accent-color: var(--blue); margin-top: 2px; flex-shrink: 0; }
        .cr-terms-link { color: var(--blue); text-decoration: underline; cursor: pointer; font-weight: 600; }

        .cr-error {
          background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.25);
          color: var(--red); border-radius: 8px;
          padding: .75rem 1rem; font-size: .875rem;
        }

        /* Navigation */
        .cr-nav {
          display: flex; align-items: center;
          margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
        }
        .cr-btn-primary {
          background: var(--blue); color: var(--white);
          padding: .75rem 2rem; border-radius: 8px; border: none;
          font-family: var(--font); font-size: .9375rem; font-weight: 700;
          cursor: pointer; transition: opacity .15s;
        }
        .cr-btn-primary:hover { opacity: .88; }
        .cr-btn--disabled { opacity: .45; cursor: not-allowed; }
        .cr-btn-ghost {
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: .9375rem; font-weight: 600;
          color: var(--gray-600); padding: .75rem .5rem; transition: color .15s;
        }
        .cr-btn-ghost:hover { color: var(--black); }

        /* Modal */
        .cr-modal-overlay {
          position: fixed; inset: 0; background: rgba(35,39,42,.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 1rem;
        }
        .cr-modal {
          background: var(--white); border-radius: 14px;
          padding: 2rem; max-width: 520px; width: 100%;
          max-height: 80vh; display: flex; flex-direction: column; gap: 1rem;
        }
        .cr-modal-title { font-size: 1.25rem; font-weight: 800; }
        .cr-modal-body {
          overflow-y: auto; flex: 1;
          display: flex; flex-direction: column; gap: .75rem;
          font-size: .875rem; line-height: 1.7; color: var(--gray-600);
        }
        .cr-modal-body h3 { font-size: .9375rem; font-weight: 700; color: var(--black); }

        @media (max-width: 600px) {
          .cr-card { padding: 1.5rem; }
          .cr-toggle-group { grid-template-columns: 1fr; }
          .cr-step-label { display: none; }
          .cr-summary-details { flex-direction: column; gap: .4rem; }
        }
      `}</style>
    </main>
  );
}