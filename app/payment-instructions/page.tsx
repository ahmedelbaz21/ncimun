'use client';

import { useState, useEffect, use, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QRCode from 'qrcode';

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ conference?: string; delegate?: string }>;
}) {
  const params = use(searchParams);
  const conferenceSlug = params?.conference ?? '';
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'telda' | ''>('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [councilFull, setCouncilFull] = useState(false);
  const [conference, setConference] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [allocatedCouncil, setAllocatedCouncil] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase
        .from('delegate_profiles')
        .select('id, first_name, last_name, delegate_id')
        .eq('user_id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      if (conferenceSlug) {
        const { data: confData } = await supabase
          .from('conferences')
          .select('id, title, price, start_date, end_date')
          .eq('slug', conferenceSlug)
          .single();

        if (confData) {
          setConference(confData);

          // Check if already paid
          if (profileData) {
            const { data: reg } = await supabase
              .from('registrations')
              .select('id, payment_status, allocated_council_id')
              .eq('delegate_id', profileData.id)
              .eq('conference_id', confData.id)
              .single();

            if (reg) {
              setRegistrationId(reg.id);
              if (reg.payment_status === 'paid') {
                // Already paid — fetch council and generate QR
                await fetchCouncilAndQR(reg.id, profileData, confData, reg.allocated_council_id);
                setDone(true);
              }
            }
          }
        }
      }
    };
    load();
  }, []);

  const fetchCouncilAndQR = async (regId: number, prof: any, conf: any, councilId: number | null) => {
    let councilName = 'Pending allocation';
    if (councilId) {
      const { data: c } = await supabase
        .from('councils')
        .select('name')
        .eq('id', councilId)
        .single();
      if (c) councilName = c.name;
    }
    setAllocatedCouncil(councilName);

    // Generate QR code
    const qrContent = JSON.stringify({
      delegate_id: prof.delegate_id,
      name: `${prof.first_name} ${prof.last_name}`,
      conference: conf.title,
      council: councilName,
      reg_id: regId,
    });

    const url = await QRCode.toDataURL(qrContent, {
      width: 300,
      margin: 2,
      color: { dark: '#23272A', light: '#FFFFFF' },
    });
    setQrDataUrl(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !screenshot || !profile || !conference || !registrationId) return;
    setLoading(true);
    setError('');

    try {
      // 1. Upload screenshot to Supabase Storage
      // Upload directly to Supabase Storage
      const ext = screenshot.name.split('.').pop() || 'jpg';
      const fileName = `${conferenceSlug}/${profile.delegate_id}_${paymentMethod}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot, {
          contentType: screenshot.type,
          upsert: false,
        });

      if (uploadError) throw new Error('Screenshot upload failed. Please try again.');
      const storagePath = uploadData.path;

      // 2. Mark registration as paid
      const { error: regError } = await supabase
        .from('registrations')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          payment_drive_url: storagePath,
        })
        .eq('id', registrationId);

      if (regError) throw new Error(regError.message);

      // 3. Allocate council via DB function
      const { data: allocResult, error: allocError } = await supabase
        .rpc('allocate_council', { registration_id: registrationId });

      if (allocError) throw new Error(allocError.message);

      if (allocResult === 'full') {
        setCouncilFull(true);
        // Still show success but notify about council
        await fetchCouncilAndQR(registrationId, profile, conference, null);
      } else {
        // Fetch the updated registration to get allocated council
        const { data: updatedReg } = await supabase
          .from('registrations')
          .select('allocated_council_id')
          .eq('id', registrationId)
          .single();

        await fetchCouncilAndQR(
          registrationId,
          profile,
          conference,
          updatedReg?.allocated_council_id || null
        );
      }

      setDone(true);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `NCIMUN_ticket_${profile?.delegate_id}.png`;
    a.click();
  };

  // ── Success / Ticket screen ──
  if (done) {
    return (
      <main className="pp-root">
        <div className="pp-ticket-wrap">
          {/* Header */}
          <div className="pp-ticket-header">
            <div className="pp-success-icon">✓</div>
            <h1 className="pp-success-title">
              {councilFull ? 'Payment received!' : 'Registration complete!'}
            </h1>
            <p className="pp-success-desc">
              {councilFull
                ? 'Both your council preferences are full. We\'ll contact you shortly to arrange an alternative.'
                : `Your registration for ${conference?.title} is confirmed.`}
            </p>
          </div>

          {/* Ticket */}
          <div className="pp-ticket">
            <div className="pp-ticket-left">
              <div className="pp-ticket-logo">
                <Image src="/logo.png" alt="NCIMUN" width={48} height={48} />
              </div>
              <div className="pp-ticket-conf">{conference?.title}</div>
              <div className="pp-ticket-divider" />
              <div className="pp-ticket-row">
                <span className="pp-ticket-label">Delegate</span>
                <span className="pp-ticket-value">{profile?.first_name} {profile?.last_name}</span>
              </div>
              <div className="pp-ticket-row">
                <span className="pp-ticket-label">Delegate ID</span>
                <span className="pp-ticket-value pp-ticket-value--id">{profile?.delegate_id}</span>
              </div>
              <div className="pp-ticket-row">
                <span className="pp-ticket-label">Council</span>
                <span className="pp-ticket-value">{allocatedCouncil || 'Pending'}</span>
              </div>
            </div>
            <div className="pp-ticket-right">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="Ticket QR Code" className="pp-qr" />
              )}
              <p className="pp-qr-label">Scan at check-in</p>
            </div>
            <div className="pp-ticket-notch pp-ticket-notch--top" />
            <div className="pp-ticket-notch pp-ticket-notch--bottom" />
          </div>

          {/* Actions */}
          <div className="pp-ticket-actions">
            <button className="pp-btn-primary" onClick={handleDownloadQR}>
              ↓ Download ticket
            </button>
            <Link href="/profile" className="pp-btn-outline">View profile</Link>
            <Link href="/conferences" className="pp-btn-ghost">Back to conferences</Link>
          </div>

          <p className="pp-ticket-note">
            ⚠️ Present this QR code at registration on your first day.
            Keep it saved on your phone or printed.
          </p>
        </div>

        <style>{STYLES}</style>
      </main>
    );
  }

  return (
    <main className="pp-root">
      <div className="pp-header">
        <Link href="/">
          <Image src="/logo.png" alt="NCIMUN" width={80} height={80} />
        </Link>
        <h1 className="pp-title">Complete your payment</h1>
        <p className="pp-subtitle">
          Your spot is reserved. Complete payment to confirm your registration.
        </p>
      </div>

      <div className="pp-layout">
        {/* ── Left: Payment details ── */}
        <div className="pp-details">
          <div className="pp-card">
            <h2 className="pp-card-title">Your registration</h2>
            <div className="pp-info-row">
              <span className="pp-info-label">Delegate ID</span>
              <span className="pp-info-value pp-info-value--highlight">
                {profile?.delegate_id || '—'}
              </span>
            </div>
            <div className="pp-info-row">
              <span className="pp-info-label">Name</span>
              <span className="pp-info-value">
                {profile ? `${profile.first_name} ${profile.last_name}` : '—'}
              </span>
            </div>
            <div className="pp-info-row">
              <span className="pp-info-label">Conference</span>
              <span className="pp-info-value">{conference?.title || '—'}</span>
            </div>
            <div className="pp-info-row pp-info-row--total">
              <span className="pp-info-label">Amount due</span>
              <span className="pp-info-value pp-info-value--price">
                {conference?.price ? `${conference.price.toLocaleString()} EGP` : '—'}
              </span>
            </div>
          </div>

          <div className="pp-card">
            <h2 className="pp-card-title">Payment methods</h2>
            <div className="pp-method-item">
              <span className="pp-method-icon">📱</span>
              <div>
                <span className="pp-method-label">Instapay</span>
                <a href="https://ipn.eg/S/ncimun/instapay/06DDhz" target="_blank" rel="noopener noreferrer" className="pp-method-value pp-method-link">
                  Pay via Instapay
                </a>
              </div>
            </div>
            <div className="pp-method-item">
              <span className="pp-method-icon">💳</span>
              <div>
                <span className="pp-method-label">Telda</span>
                <span className="pp-method-value">ahmedelbaz21</span>
              </div>
            </div>
            <p className="pp-refund-note">
              ⚠️ Refund policy: In case of cancellation, NCIMUN offers a 30% refund
              as 70% is allocated immediately toward conference expenses.
            </p>
          </div>
        </div>

        {/* ── Right: Upload form ── */}
        <form className="pp-form" onSubmit={handleSubmit}>
          <div className="pp-card">
            <h2 className="pp-card-title">Confirm your payment</h2>
            <p className="pp-form-desc">
              After sending the payment, select your method and upload a screenshot of the receipt.
            </p>

            <div className="pp-field">
              <label className="pp-label">Payment method used</label>
              <div className="pp-toggle-group">
                <button
                  type="button"
                  className={`pp-toggle ${paymentMethod === 'instapay' ? 'pp-toggle--active' : ''}`}
                  onClick={() => setPaymentMethod('instapay')}
                >
                  📱 Instapay
                </button>
                <button
                  type="button"
                  className={`pp-toggle ${paymentMethod === 'telda' ? 'pp-toggle--active' : ''}`}
                  onClick={() => setPaymentMethod('telda')}
                >
                  💳 Telda
                </button>
              </div>
            </div>

            <div className="pp-field">
              <label className="pp-label">Payment screenshot</label>
              <label className="pp-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="pp-upload-input"
                  required
                />
                {preview ? (
                  <img src={preview} alt="Payment screenshot" className="pp-preview" />
                ) : (
                  <div className="pp-upload-placeholder">
                    <span className="pp-upload-icon">📷</span>
                    <span className="pp-upload-text">Click to upload screenshot</span>
                    <span className="pp-upload-hint">JPG, PNG supported</span>
                  </div>
                )}
              </label>
              {screenshot && (
                <span className="pp-file-name">✓ {screenshot.name}</span>
              )}
            </div>

            {error && <div className="pp-error">{error}</div>}

            <button
              type="submit"
              className={`pp-btn-primary pp-btn-full ${(!paymentMethod || !screenshot || loading) ? 'pp-btn--disabled' : ''}`}
              disabled={!paymentMethod || !screenshot || loading}
            >
              {loading ? 'Processing…' : 'Confirm payment →'}
            </button>
          </div>
        </form>
      </div>

      <style>{STYLES}</style>
    </main>
  );
}

const STYLES = `
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
    --radius: 12px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
  a { text-decoration: none; color: inherit; }

  .pp-root { max-width: 1000px; margin: 0 auto; padding: 3rem 1.5rem 6rem; }

  .pp-header { text-align: center; margin-bottom: 2.5rem; }
  .pp-title { font-size: 2rem; font-weight: 900; letter-spacing: -.02em; margin-top: 1rem; }
  .pp-subtitle { font-size: .9375rem; color: var(--gray-600); margin-top: .4rem; }

  .pp-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
  .pp-details { display: flex; flex-direction: column; gap: 1.25rem; }

  .pp-card {
    background: var(--white); border-radius: var(--radius);
    box-shadow: var(--shadow); padding: 1.75rem;
    display: flex; flex-direction: column; gap: 1rem;
  }
  .pp-card-title { font-size: 1rem; font-weight: 800; }

  .pp-info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: .6rem 0; border-bottom: 1px solid var(--gray-200); gap: 1rem;
  }
  .pp-info-row:last-of-type { border-bottom: none; }
  .pp-info-row--total { border-top: 2px solid var(--gray-200); margin-top: .25rem; padding-top: .75rem; }
  .pp-info-label { font-size: .8125rem; color: var(--gray-600); }
  .pp-info-value { font-size: .875rem; font-weight: 600; text-align: right; }
  .pp-info-value--highlight { color: var(--blue); font-size: 1rem; font-weight: 800; }
  .pp-info-value--price { color: var(--blue); font-size: 1.125rem; font-weight: 900; }

  .pp-method-item {
    display: flex; align-items: center; gap: .75rem;
    padding: .75rem; background: var(--gray-50); border-radius: 8px;
  }
  .pp-method-icon { font-size: 1.25rem; }
  .pp-method-label { display: block; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--gray-600); }
  .pp-method-value { display: block; font-size: 1rem; font-weight: 800; color: var(--black); }

  .pp-refund-note {
    font-size: .8rem; color: var(--gray-600); line-height: 1.6;
    background: rgba(248,233,141,.2); border: 1px solid rgba(248,233,141,.5);
    border-radius: 8px; padding: .75rem;
  }

  .pp-form-desc { font-size: .875rem; color: var(--gray-600); line-height: 1.6; margin-top: -.25rem; }
  .pp-field { display: flex; flex-direction: column; gap: .5rem; }
  .pp-label { font-size: .8125rem; font-weight: 700; }

  .pp-toggle-group { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  .pp-toggle {
    padding: .75rem; border-radius: 8px;
    border: 1.5px solid var(--gray-200);
    font-family: var(--font); font-size: .875rem; font-weight: 600;
    color: var(--gray-600); background: var(--white); cursor: pointer;
    transition: all .15s; text-align: center;
  }
  .pp-toggle:hover { border-color: var(--blue); color: var(--blue); }
  .pp-toggle--active { border-color: var(--blue); background: rgba(95,150,202,.08); color: var(--blue); }

  .pp-upload-area {
    display: block; border: 2px dashed var(--gray-200); border-radius: 10px;
    cursor: pointer; overflow: hidden; transition: border-color .15s; min-height: 160px;
  }
  .pp-upload-area:hover { border-color: var(--blue); }
  .pp-upload-input { display: none; }
  .pp-upload-placeholder {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: .5rem; padding: 2.5rem; min-height: 160px;
  }
  .pp-upload-icon { font-size: 2rem; }
  .pp-upload-text { font-size: .9rem; font-weight: 600; color: var(--black); }
  .pp-upload-hint { font-size: .75rem; color: var(--gray-400); }
  .pp-preview { width: 100%; max-height: 280px; object-fit: contain; display: block; }
  .pp-file-name { font-size: .75rem; color: var(--green); font-weight: 600; }

  .pp-error {
    background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.25);
    color: var(--red); border-radius: 8px; padding: .75rem 1rem; font-size: .875rem;
  }

  .pp-btn-primary {
    background: var(--blue); color: var(--white);
    padding: .8rem 2rem; border-radius: 8px; border: none;
    font-family: var(--font); font-size: .9375rem; font-weight: 700;
    cursor: pointer; transition: opacity .15s; display: inline-block; text-align: center;
  }
  .pp-btn-primary:hover { opacity: .88; }
  .pp-btn-full { width: 100%; }
  .pp-btn--disabled { opacity: .45; cursor: not-allowed; }
  .pp-btn-outline {
    border: 1.5px solid var(--blue); color: var(--blue);
    padding: .8rem 2rem; border-radius: 8px;
    font-family: var(--font); font-size: .9375rem; font-weight: 700;
    display: inline-block; transition: background .15s; text-align: center;
  }
  .pp-btn-outline:hover { background: var(--blue); color: var(--white); }
  .pp-btn-ghost {
    color: var(--gray-600); font-size: .9375rem; font-weight: 600;
    font-family: var(--font); display: inline-block;
  }
  .pp-btn-ghost:hover { color: var(--black); }

  /* ── Ticket ── */
  .pp-ticket-wrap {
    max-width: 560px; margin: 0 auto;
    display: flex; flex-direction: column; align-items: center; gap: 1.75rem;
  }
  .pp-ticket-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: .75rem; }
  .pp-success-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(45,155,111,.12); color: var(--green);
    font-size: 1.75rem; display: flex; align-items: center; justify-content: center; font-weight: 900;
  }
  .pp-success-title { font-size: 1.75rem; font-weight: 900; }
  .pp-success-desc { font-size: .9375rem; color: var(--gray-600); line-height: 1.6; max-width: 380px; }

  .pp-ticket {
    width: 100%; background: var(--white);
    border-radius: 16px; box-shadow: var(--shadow);
    display: flex; position: relative; overflow: visible;
    border: 1.5px solid var(--gray-200);
  }
  .pp-ticket-left {
    flex: 1; padding: 2rem; display: flex; flex-direction: column; gap: .875rem;
    border-right: 2px dashed var(--gray-200);
  }
  .pp-ticket-right {
    width: 160px; padding: 1.5rem;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem;
  }
  .pp-method-link { color: #5F96CA; text-decoration: underline; font-weight: 800; }
  .pp-ticket-logo { margin-bottom: .25rem; }
  .pp-ticket-conf { font-size: .8125rem; font-weight: 800; color: var(--blue); text-transform: uppercase; letter-spacing: .08em; }
  .pp-ticket-divider { border: none; border-top: 1px solid var(--gray-200); margin: .25rem 0; }
  .pp-ticket-row { display: flex; flex-direction: column; gap: .15rem; }
  .pp-ticket-label { font-size: .6875rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .08em; }
  .pp-ticket-value { font-size: .9375rem; font-weight: 700; color: var(--black); }
  .pp-ticket-value--id { color: var(--blue); font-size: 1rem; }
  .pp-qr { width: 120px; height: 120px; border-radius: 8px; }
  .pp-qr-label { font-size: .6875rem; color: var(--gray-400); font-weight: 600; text-align: center; }

  .pp-ticket-notch {
    position: absolute; width: 24px; height: 24px; border-radius: 50%;
    background: var(--gray-50); border: 1.5px solid var(--gray-200);
    right: 148px;
  }
  .pp-ticket-notch--top { top: -12px; }
  .pp-ticket-notch--bottom { bottom: -12px; }

  .pp-ticket-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: center; }
  .pp-ticket-note {
    font-size: .8125rem; color: var(--gray-600); line-height: 1.6; text-align: center;
    background: rgba(248,233,141,.2); border: 1px solid rgba(248,233,141,.4);
    border-radius: 8px; padding: .875rem 1.25rem; max-width: 420px;
  }

  @media (max-width: 720px) {
    .pp-layout { grid-template-columns: 1fr; }
    .pp-root { padding: 2rem 1rem 4rem; }
    .pp-ticket { flex-direction: column; }
    .pp-ticket-left { border-right: none; border-bottom: 2px dashed var(--gray-200); }
    .pp-ticket-right { width: 100%; }
    .pp-ticket-notch { display: none; }
  }
`;