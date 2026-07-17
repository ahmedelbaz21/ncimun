'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import jsQR from 'jsqr';

type Delegate = {
  id: string;
  delegate_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  school: string;
  grade: number;
  council_name: string | null;
  emergency_contact: { name: string; relation: string; phone: string } | null;
  registration_id: number | null;
  payment_status: string | null;
  needs_transport: boolean;
  transport_location: string | null;
};

export default function TeamPortalPage() {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'attendance' | 'meal' | 'info'>('home');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'warning'; delegate?: Delegate; message?: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [todayMeals, setTodayMeals] = useState(0);
  const [totalDelegates, setTotalDelegates] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: userData } = await supabase.from('users').select('account_type').eq('id', user.id).single();
      if (userData?.account_type !== 'team') { router.push('/'); return; }
      setAuthorized(true);
      await loadStats();
      setLoading(false);
    };
    check();
    return () => stopCamera();
  }, []);

  const loadStats = async () => {
    const { count: total } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid');
    setTotalDelegates(total || 0);
    const { count: att } = await supabase.from('delegate_attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('type', 'attendance');
    setTodayAttendance(att || 0);
    const { count: meals } = await supabase.from('delegate_attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('type', 'meal');
    setTodayMeals(meals || 0);
  };

  const fetchDelegate = async (delegateId: string): Promise<Delegate | null> => {
    let cleanId = delegateId.trim().toUpperCase();
    if (!cleanId.startsWith('D-')) cleanId = 'D-' + cleanId;
    const { data: profile } = await supabase
      .from('delegate_profiles')
      .select('id, delegate_id, first_name, last_name, phone, school, grade, emergency_contacts(name, relation, phone)')
      .eq('delegate_id', cleanId)
      .single();
    if (!profile) return null;
    const { data: reg } = await supabase
      .from('registrations')
      .select('id, payment_status, needs_transport, allocated_council:councils!registrations_allocated_council_id_fkey(name), transport_routes(location_name)')
      .eq('delegate_id', profile.id)
      .single();
    return {
      id: profile.id,
      delegate_id: profile.delegate_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      school: profile.school,
      grade: profile.grade,
      council_name: (reg as any)?.allocated_council?.name || null,
      emergency_contact: (profile as any).emergency_contacts?.[0] || null,
      registration_id: reg?.id || null,
      payment_status: reg?.payment_status || null,
      needs_transport: reg?.needs_transport || false,
      transport_location: (reg as any)?.transport_routes?.location_name || null,
    };
  };

  const handleScan = async (delegateId: string, actionType: 'attendance' | 'meal' | 'info') => {
    if (!delegateId.trim()) return;
    setProcessing(true);
    setResult(null);
    stopCamera();

    try {
      const delegate = await fetchDelegate(delegateId);
      if (!delegate) { setResult({ type: 'error', message: 'Delegate not found.' }); setProcessing(false); return; }

      if (actionType === 'info') {
        setResult({ type: 'success', delegate });
        setProcessing(false);
        return;
      }

      if (delegate.payment_status !== 'paid') {
        setResult({ type: 'warning', delegate, message: 'Payment not confirmed.' });
        setProcessing(false);
        return;
      }

      const { data: existing } = await supabase.from('delegate_attendance').select('id, created_at').eq('delegate_profile_id', delegate.id).eq('date', today).eq('type', actionType).single();
      if (existing) {
        const time = new Date(existing.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        setResult({ type: 'warning', delegate, message: `Already marked ${actionType} today at ${time}.` });
        setProcessing(false);
        return;
      }

      const { error } = await supabase.from('delegate_attendance').insert({ delegate_profile_id: delegate.id, date: today, type: actionType });
      if (error) throw new Error(error.message);
      setResult({ type: 'success', delegate, message: actionType === 'attendance' ? 'Attendance marked ✓' : 'Meal recorded ✓' });
      await loadStats();
      setManualId('');
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Something went wrong.' });
    }
    setProcessing(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setScanning(true);
      scanFrame();
    } catch { alert('Camera access denied. Use manual ID entry.'); }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          let delegateId = code.data;
          try { const parsed = JSON.parse(code.data); delegateId = parsed.delegate_id || code.data; } catch {}
          const actionType = view === 'attendance' ? 'attendance' : view === 'meal' ? 'meal' : 'info';
          handleScan(delegateId, actionType);
          return;
        }
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  };

  const resetView = () => { setView('home'); setResult(null); setManualId(''); stopCamera(); };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  if (loading) return <main className="tp-root"><div className="tp-loading">Loading…</div><style>{STYLES}</style></main>;
  if (!authorized) return null;

  const actionType = view === 'attendance' ? 'attendance' : view === 'meal' ? 'meal' : 'info';

  return (
    <main className="tp-root">
      <div className="tp-header">
        <div className="tp-header-left">
          <img src="/logo.png" alt="NCIMUN" className="tp-logo" />
          <div>
            <h1 className="tp-title">Team Portal</h1>
            <p className="tp-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <button className="tp-logout" onClick={handleLogout}>Log out</button>
      </div>

      {view === 'home' && (
        <>
          <div className="tp-stats">
            <div className="tp-stat">
              <span className="tp-stat-number">{todayAttendance}</span>
              <span className="tp-stat-label">Checked in</span>
            </div>
            <div className="tp-stat tp-stat--green">
              <span className="tp-stat-number">{todayMeals}</span>
              <span className="tp-stat-label">Meals</span>
            </div>
            <div className="tp-stat tp-stat--blue">
              <span className="tp-stat-number">{totalDelegates}</span>
              <span className="tp-stat-label">Total</span>
            </div>
          </div>

          <div className="tp-actions">
            <button className="tp-action-btn tp-action-btn--attendance" onClick={() => { setView('attendance'); setResult(null); }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="tp-action-label">Mark attendance</span>
            </button>
            <button className="tp-action-btn tp-action-btn--meal" onClick={() => { setView('meal'); setResult(null); }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              <span className="tp-action-label">Mark meal</span>
            </button>
            <button className="tp-action-btn tp-action-btn--info" onClick={() => { setView('info'); setResult(null); }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <span className="tp-action-label">Delegate info</span>
            </button>
          </div>
        </>
      )}

      {(view === 'attendance' || view === 'meal' || view === 'info') && (
        <div className="tp-scanner-view">
          <div className="tp-scanner-header">
            <button className="tp-back" onClick={resetView}>← Back</button>
            <h2 className="tp-scanner-title">
              {view === 'attendance' ? '✓ Mark attendance' : view === 'meal' ? '🍽 Mark meal' : '👤 Delegate info'}
            </h2>
          </div>

          {result && (
            <div className={`tp-result tp-result--${result.type}`}>
              <div className="tp-result-icon">
                {result.type === 'success' ? '✓' : result.type === 'warning' ? '⚠' : '✗'}
              </div>
              {result.delegate && (
                <div className="tp-result-info">
                  <span className="tp-result-name">{result.delegate.first_name} {result.delegate.last_name}</span>
                  <span className="tp-result-did">{result.delegate.delegate_id}</span>
                  <span className="tp-result-council">{result.delegate.council_name || 'Council TBC'}</span>
                </div>
              )}
              {result.message && <p className="tp-result-msg">{result.message}</p>}

              {/* Full info for info view */}
              {view === 'info' && result.delegate && (
                <div className="tp-info-card">
                  <div className="tp-info-grid">
                    <div className="tp-info-item"><span className="tp-info-label">Phone</span><span className="tp-info-value">{result.delegate.phone}</span></div>
                    <div className="tp-info-item"><span className="tp-info-label">School</span><span className="tp-info-value">{result.delegate.school}</span></div>
                    <div className="tp-info-item"><span className="tp-info-label">Grade</span><span className="tp-info-value">Grade {result.delegate.grade}</span></div>
                    <div className="tp-info-item"><span className="tp-info-label">Council</span><span className="tp-info-value">{result.delegate.council_name || 'TBC'}</span></div>
                    <div className="tp-info-item"><span className="tp-info-label">Transport</span><span className="tp-info-value">{result.delegate.needs_transport ? result.delegate.transport_location || '—' : 'Own'}</span></div>
                    <div className="tp-info-item"><span className="tp-info-label">Payment</span><span className="tp-info-value">{result.delegate.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}</span></div>
                  </div>
                  {result.delegate.emergency_contact && (
                    <div className="tp-info-ec">
                      <span className="tp-info-ec-title">🚨 Emergency contact</span>
                      <span className="tp-info-ec-name">{result.delegate.emergency_contact.name} · {result.delegate.emergency_contact.relation}</span>
                      <a href={`tel:${result.delegate.emergency_contact.phone}`} className="tp-info-ec-phone">📞 {result.delegate.emergency_contact.phone}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {scanning ? (
            <div className="tp-camera-wrap">
              <video ref={videoRef} className="tp-camera" playsInline muted />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="tp-camera-overlay">
                <div className="tp-camera-frame" />
                <p className="tp-camera-hint">Point at QR code</p>
              </div>
              <button className="tp-btn-stop" onClick={stopCamera}>✕ Stop camera</button>
            </div>
          ) : (
            <button className="tp-btn-camera" onClick={startCamera}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'.5rem'}}><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><line x1="21" y1="21" x2="21" y2="21"/></svg>
              Scan QR code
            </button>
          )}

          <div className="tp-manual">
            <p className="tp-manual-label">Or enter delegate ID:</p>
            <div className="tp-manual-row">
              <input
                className="tp-manual-input"
                type="text"
                value={manualId}
                onChange={e => setManualId(e.target.value.toUpperCase())}
                placeholder="D-26001"
                onKeyDown={e => e.key === 'Enter' && handleScan(manualId, actionType)}
              />
              <button className="tp-btn-submit" onClick={() => handleScan(manualId, actionType)} disabled={!manualId || processing}>
                {processing ? '…' : 'Go'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{STYLES}</style>
    </main>
  );
}

const STYLES = `
  :root {
    --blue:#5F96CA; --aqua:#84DBD5; --black:#23272A; --white:#FFFFFF;
    --gray-50:#F8F9FA; --gray-200:#E9ECEF; --gray-400:#ADB5BD; --gray-600:#6C757D;
    --green:#2D9B6F; --red:#E5534B; --yellow:#F8E98D;
    --font:'Avenir','Avenir Next','Century Gothic',sans-serif;
    --shadow:0 4px 24px rgba(35,39,42,.08);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:var(--font);background:var(--gray-50);color:var(--black);}
  a{text-decoration:none;color:inherit;}

  .tp-root{max-width:480px;margin:0 auto;padding:1.5rem 1rem 4rem;display:flex;flex-direction:column;gap:1.5rem;}
  .tp-loading{text-align:center;padding:6rem;color:var(--gray-400);}

  .tp-header{display:flex;justify-content:space-between;align-items:center;}
  .tp-header-left{display:flex;align-items:center;gap:.875rem;}
  .tp-logo{height:36px;}
  .tp-title{font-size:1.125rem;font-weight:900;}
  .tp-date{font-size:.75rem;color:var(--gray-600);margin-top:.1rem;}
  .tp-logout{background:none;border:none;cursor:pointer;font-family:var(--font);font-size:.8125rem;font-weight:600;color:var(--gray-400);transition:color .15s;}
  .tp-logout:hover{color:var(--red);}

  .tp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;}
  .tp-stat{background:var(--white);border:1.5px solid var(--gray-200);border-radius:12px;padding:1rem;text-align:center;}
  .tp-stat-number{display:block;font-size:2rem;font-weight:900;color:var(--black);}
  .tp-stat--green .tp-stat-number{color:var(--green);}
  .tp-stat--blue .tp-stat-number{color:var(--blue);}
  .tp-stat-label{display:block;font-size:.6875rem;font-weight:600;color:var(--gray-600);margin-top:.2rem;text-transform:uppercase;letter-spacing:.04em;}

  /* Square action buttons */
  .tp-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:.875rem;}
  .tp-action-btn{
    aspect-ratio:1; display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;
    border-radius:16px;border:none;cursor:pointer;transition:transform .1s,box-shadow .15s;
    font-family:var(--font); padding:1rem;
  }
  .tp-action-btn:hover{transform:translateY(-2px);box-shadow:var(--shadow);}
  .tp-action-btn--attendance{background:var(--green);color:var(--white);}
  .tp-action-btn--meal{background:var(--blue);color:var(--white);}
  .tp-action-btn--info{background:var(--white);color:var(--black);border:1.5px solid var(--gray-200);}
  .tp-action-label{font-size:.8125rem;font-weight:800;text-align:center;line-height:1.2;}

  .tp-scanner-view{display:flex;flex-direction:column;gap:1.25rem;}
  .tp-scanner-header{display:flex;align-items:center;gap:1rem;}
  .tp-back{background:none;border:none;cursor:pointer;font-family:var(--font);font-size:.875rem;font-weight:700;color:var(--gray-600);padding:0;transition:color .15s;}
  .tp-back:hover{color:var(--black);}
  .tp-scanner-title{font-size:1.125rem;font-weight:800;}

  .tp-result{border-radius:14px;padding:1.25rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.75rem;text-align:center;}
  .tp-result--success{background:rgba(45,155,111,.1);border:2px solid var(--green);}
  .tp-result--error{background:rgba(229,83,75,.08);border:2px solid var(--red);}
  .tp-result--warning{background:rgba(248,233,141,.2);border:2px solid #d4b800;}
  .tp-result-icon{font-size:2.5rem;font-weight:900;}
  .tp-result--success .tp-result-icon{color:var(--green);}
  .tp-result--error .tp-result-icon{color:var(--red);}
  .tp-result--warning .tp-result-icon{color:#8a7a00;}
  .tp-result-info{display:flex;flex-direction:column;gap:.2rem;}
  .tp-result-name{font-size:1.125rem;font-weight:800;color:var(--black);}
  .tp-result-did{font-size:.875rem;font-weight:700;color:var(--blue);}
  .tp-result-council{font-size:.8125rem;color:var(--gray-600);}
  .tp-result-msg{font-size:.875rem;color:var(--gray-600);line-height:1.5;}

  .tp-info-card{width:100%;background:var(--white);border:1.5px solid var(--gray-200);border-radius:12px;overflow:hidden;margin-top:.25rem;}
  .tp-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
  .tp-info-item{padding:.75rem 1rem;border-bottom:1px solid var(--gray-200);border-right:1px solid var(--gray-200);}
  .tp-info-item:nth-child(even){border-right:none;}
  .tp-info-label{display:block;font-size:.6rem;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.2rem;}
  .tp-info-value{display:block;font-size:.875rem;font-weight:600;color:var(--black);}
  .tp-info-ec{padding:.875rem 1rem;display:flex;flex-direction:column;gap:.25rem;background:rgba(229,83,75,.04);}
  .tp-info-ec-title{font-size:.7rem;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:.06em;}
  .tp-info-ec-name{font-size:.875rem;font-weight:600;color:var(--black);}
  .tp-info-ec-phone{font-size:1rem;font-weight:800;color:var(--blue);margin-top:.1rem;}
  .tp-info-ec-phone:hover{text-decoration:underline;}

  .tp-btn-camera{width:100%;padding:1rem;border-radius:12px;background:var(--black);color:var(--white);border:none;font-family:var(--font);font-size:.9375rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity .15s;}
  .tp-btn-camera:hover{opacity:.85;}
  .tp-camera-wrap{position:relative;border-radius:12px;overflow:hidden;}
  .tp-camera{width:100%;border-radius:12px;display:block;}
  .tp-camera-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;}
  .tp-camera-frame{width:200px;height:200px;border:3px solid var(--aqua);border-radius:12px;box-shadow:0 0 0 9999px rgba(35,39,42,.5);}
  .tp-camera-hint{color:var(--white);font-size:.875rem;font-weight:600;}
  .tp-btn-stop{width:100%;padding:.75rem;background:var(--red);color:var(--white);border:none;border-radius:8px;font-family:var(--font);font-size:.875rem;font-weight:700;cursor:pointer;margin-top:.5rem;}

  .tp-manual{display:flex;flex-direction:column;gap:.5rem;}
  .tp-manual-label{font-size:.8125rem;font-weight:700;color:var(--gray-600);text-align:center;}
  .tp-manual-row{display:flex;gap:.5rem;}
  .tp-manual-input{flex:1;padding:.75rem 1rem;border:1.5px solid var(--gray-200);border-radius:10px;font-family:var(--font);font-size:1rem;font-weight:700;color:var(--black);outline:none;text-transform:uppercase;transition:border-color .15s;}
  .tp-manual-input:focus{border-color:var(--blue);}
  .tp-btn-submit{padding:.75rem 1.25rem;background:var(--blue);color:var(--white);border:none;border-radius:10px;font-family:var(--font);font-size:1rem;font-weight:700;cursor:pointer;transition:opacity .15s;flex-shrink:0;}
  .tp-btn-submit:disabled{opacity:.45;cursor:not-allowed;}
  .tp-btn-submit:hover:not(:disabled){opacity:.88;}
`;