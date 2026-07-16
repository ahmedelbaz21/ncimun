'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const STEPS = ['Account', 'Personal info', 'Emergency contact'];

export default function RegisterPage() {
  const router = useRouter();
  

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');

  // Step 3 — Emergency contact
  const [ecName, setEcName] = useState('');
  const [ecRelation, setEcRelation] = useState('');
  const [ecPhone, setEcPhone] = useState('');

  // ── Validation ──
  const passwordsMatch = password === confirmPassword;
  const passwordStrong = password.length >= 8;

  const step0Valid = email && password && confirmPassword && passwordsMatch && passwordStrong;
  const step1Valid = firstName && lastName && phone && school && grade;
  const step2Valid = ecName && ecRelation && ecPhone;
  const canProceed = [step0Valid, step1Valid, step2Valid][step];

  const next = () => { setError(''); if (canProceed) setStep(s => s + 1); };
  const back = () => { setError(''); setStep(s => s - 1); };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2Valid) return;
    setLoading(true);
    setError('');

    try {
      // 1. Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Account creation failed. Please try again.');

      const userId = authData.user.id;

      // 2. Create delegate_profile
      const { error: profileError } = await supabase
        .from('delegate_profiles')
        .insert({
          user_id:       userId,
          first_name:    firstName,
          last_name:     lastName,
          grade:         parseInt(grade),
          school,
          email,
          phone,
          dietary_notes: dietaryNotes || null,
        });

      if (profileError) throw new Error(profileError.message);

      // 3. Get the new profile id to link emergency contact
      const { data: profileData, error: fetchError } = await supabase
        .from('delegate_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError || !profileData) throw new Error('Could not retrieve profile. Please contact support.');

      // 4. Create emergency contact
      const { error: ecError } = await supabase
        .from('emergency_contacts')
        .insert({
          delegate_id: profileData.id,
          name:        ecName,
          relation:    ecRelation,
          phone:       ecPhone,
        });

      if (ecError) throw new Error(ecError.message);

      // 5. Redirect to conferences
      router.push('/conferences');

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="rp-root">
      {/* ── Header ── */}
      <div className="rp-header">
        <Link href="/">
          <img src="/logo.png" alt="NCIMUN" className="rp-logo" />
        </Link>
        <h1 className="rp-title">Create your account</h1>
        <p className="rp-subtitle">
          Set up your delegate profile once — use it for every future conference.
        </p>
      </div>

      {/* ── Stepper ── */}
      <div className="rp-stepper">
        {STEPS.map((label, i) => (
          <div key={i} className={`rp-step ${i === step ? 'rp-step--active' : ''} ${i < step ? 'rp-step--done' : ''}`}>
            <div className="rp-step-dot">
              {i < step
                ? <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                : i + 1}
            </div>
            <span className="rp-step-label">{label}</span>
            {i < STEPS.length - 1 && (
              <div className={`rp-step-line ${i < step ? 'rp-step-line--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Card ── */}
      <form className="rp-card" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); next(); }}>

        {/* ── Step 0: Account ── */}
        {step === 0 && (
          <div className="rp-section">
            <h2 className="rp-section-title">Create your login</h2>
            <p className="rp-section-desc">You'll use this email and password to access your delegate portal.</p>

            <div className="rp-field">
              <label className="rp-label">Email address</label>
              <input
                className="rp-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="rp-field">
              <label className="rp-label">Password</label>
              <div className="rp-input-wrap">
                <input
                  className="rp-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
                <button type="button" className="rp-input-toggle" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password && !passwordStrong && (
                <span className="rp-hint rp-hint--error">Password must be at least 8 characters.</span>
              )}
            </div>

            <div className="rp-field">
              <label className="rp-label">Confirm password</label>
              <input
                className="rp-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
              />
              {confirmPassword && !passwordsMatch && (
                <span className="rp-hint rp-hint--error">Passwords do not match.</span>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <div className="rp-section">
            <h2 className="rp-section-title">Personal information</h2>
            <p className="rp-section-desc">This information will appear on your delegate profile and certificates.</p>

            <div className="rp-row">
              <div className="rp-field">
                <label className="rp-label">First name</label>
                <input
                  className="rp-input"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="rp-field">
                <label className="rp-label">Last name</label>
                <input
                  className="rp-input"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">Phone number</label>
              <input
                className="rp-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20 1XX XXX XXXX"
                required
              />
            </div>

            <div className="rp-row">
              <div className="rp-field">
                <label className="rp-label">School</label>
                <input
                  className="rp-input"
                  type="text"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  placeholder="Your school name"
                  required
                />
              </div>
              <div className="rp-field">
                <label className="rp-label">Grade</label>
                <select className="rp-input" value={grade} onChange={e => setGrade(e.target.value)} required>
                  <option value="">Select grade</option>
                  {[7,8,9,10,11,12].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">
                Dietary restrictions or accommodations
                <span className="rp-optional"> — optional</span>
              </label>
              <textarea
                className="rp-input rp-textarea"
                value={dietaryNotes}
                onChange={e => setDietaryNotes(e.target.value)}
                placeholder="Any allergies, dietary needs, or accommodations we should know about"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Emergency Contact ── */}
        {step === 2 && (
          <div className="rp-section">
            <h2 className="rp-section-title">Emergency contact</h2>
            <p className="rp-section-desc">This person will be contacted in case of an emergency during any conference you attend.</p>

            <div className="rp-field">
              <label className="rp-label">Full name</label>
              <input
                className="rp-input"
                type="text"
                value={ecName}
                onChange={e => setEcName(e.target.value)}
                placeholder="Contact's full name"
                required
              />
            </div>

            <div className="rp-row">
              <div className="rp-field">
                <label className="rp-label">Relation to you</label>
                <select className="rp-input" value={ecRelation} onChange={e => setEcRelation(e.target.value)} required>
                  <option value="">Select relation</option>
                  {['Mother', 'Father', 'Parent', 'Sibling', 'Aunt/Uncle', 'Grandparent', 'Legal guardian', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="rp-field">
                <label className="rp-label">Phone number</label>
                <input
                  className="rp-input"
                  type="tel"
                  value={ecPhone}
                  onChange={e => setEcPhone(e.target.value)}
                  placeholder="+20 1XX XXX XXXX"
                  required
                />
              </div>
            </div>

            {error && <div className="rp-error">{error}</div>}

            <p className="rp-terms-note">
              By creating an account you agree to NCIMUN's{' '}
              <Link href="/terms" className="rp-link">Terms & Conditions</Link>.
            </p>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="rp-nav">
          {step > 0 && (
            <button type="button" className="rp-btn-ghost" onClick={back}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button
              type="submit"
              className={`rp-btn-primary ${!canProceed ? 'rp-btn--disabled' : ''}`}
              disabled={!canProceed}
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              className={`rp-btn-primary ${!canProceed || loading ? 'rp-btn--disabled' : ''}`}
              disabled={!canProceed || loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          )}
        </div>

        {/* ── Login link ── */}
        {step === 0 && (
          <p className="rp-login-hint">
            Already have an account?{' '}
            <Link href="/login" className="rp-link">Log in</Link>
          </p>
        )}
      </form>

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
          --red:    #E5534B;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --radius: 10px;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        .rp-root {
          min-height: 100vh;
          padding: 3rem 1rem 5rem;
          display: flex; flex-direction: column; align-items: center;
        }

        /* Header */
        .rp-header { text-align: center; margin-bottom: 2rem; }
        .rp-logo { height: 48px; margin-bottom: 1rem; display: inline-block; }
        .rp-title { font-size: 2rem; font-weight: 900; letter-spacing: -.02em; }
        .rp-subtitle { font-size: .9375rem; color: var(--gray-600); margin-top: .4rem; max-width: 400px; line-height: 1.6; }

        /* Stepper */
        .rp-stepper {
          display: flex; align-items: center;
          margin-bottom: 2rem; width: 100%; max-width: 520px;
        }
        .rp-step { display: flex; align-items: center; flex: 1; }
        .rp-step:last-child { flex: 0; }
        .rp-step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: .8125rem; font-weight: 700; flex-shrink: 0;
          border: 2px solid var(--gray-200);
          background: var(--white); color: var(--gray-400);
          transition: all .2s; z-index: 1;
        }
        .rp-step--active .rp-step-dot { border-color: var(--blue); color: var(--blue); background: rgba(95,150,202,.08); }
        .rp-step--done .rp-step-dot { border-color: var(--blue); background: var(--blue); color: var(--white); }
        .rp-step-label {
          font-size: .75rem; font-weight: 600; color: var(--gray-400);
          white-space: nowrap; margin-left: .5rem; transition: color .2s;
        }
        .rp-step--active .rp-step-label,
        .rp-step--done .rp-step-label { color: var(--black); }
        .rp-step-line { flex: 1; height: 2px; background: var(--gray-200); margin: 0 .5rem; transition: background .2s; }
        .rp-step-line--done { background: var(--blue); }

        /* Card */
        .rp-card {
          width: 100%; max-width: 580px;
          background: var(--white); border-radius: 16px;
          box-shadow: var(--shadow); padding: 2.5rem;
          display: flex; flex-direction: column; gap: 0;
        }

        /* Section */
        .rp-section { display: flex; flex-direction: column; gap: 1.25rem; }
        .rp-section-title { font-size: 1.125rem; font-weight: 800; }
        .rp-section-desc { font-size: .875rem; color: var(--gray-600); line-height: 1.6; margin-top: -.75rem; }

        /* Fields */
        .rp-field { display: flex; flex-direction: column; gap: .4rem; }
        .rp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .rp-label { font-size: .8125rem; font-weight: 700; }
        .rp-optional { font-weight: 400; color: var(--gray-400); }

        .rp-input-wrap { position: relative; }
        .rp-input-toggle {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: .75rem; font-weight: 600; color: var(--blue);
          font-family: var(--font);
        }

        .rp-input {
          width: 100%; padding: .65rem .875rem;
          border: 1.5px solid var(--gray-200); border-radius: var(--radius);
          font-family: var(--font); font-size: .9375rem; color: var(--black);
          background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s;
          appearance: none;
        }
        .rp-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(95,150,202,.15); }
        .rp-textarea { resize: vertical; min-height: 90px; }

        .rp-hint { font-size: .75rem; color: var(--gray-600); }
        .rp-hint--error { color: var(--red); }

        .rp-error {
          background: rgba(229,83,75,.08); border: 1px solid rgba(229,83,75,.25);
          color: var(--red); border-radius: 8px;
          padding: .75rem 1rem; font-size: .875rem;
        }

        .rp-terms-note { font-size: .8125rem; color: var(--gray-600); line-height: 1.6; margin-top: -.25rem; }
        .rp-link { color: var(--blue); font-weight: 600; }
        .rp-link:hover { text-decoration: underline; }

        /* Navigation */
        .rp-nav {
          display: flex; align-items: center;
          margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
        }
        .rp-btn-primary {
          background: var(--blue); color: var(--white);
          padding: .75rem 2rem; border-radius: 8px; border: none;
          font-family: var(--font); font-size: .9375rem; font-weight: 700;
          cursor: pointer; transition: opacity .15s;
        }
        .rp-btn-primary:hover { opacity: .88; }
        .rp-btn--disabled { opacity: .45; cursor: not-allowed; }
        .rp-btn-ghost {
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: .9375rem; font-weight: 600;
          color: var(--gray-600); padding: .75rem .5rem; transition: color .15s;
        }
        .rp-btn-ghost:hover { color: var(--black); }

        .rp-login-hint {
          text-align: center; font-size: .875rem;
          color: var(--gray-600); margin-top: 1.25rem;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .rp-card { padding: 1.5rem; }
          .rp-row { grid-template-columns: 1fr; }
          .rp-step-label { display: none; }
        }
      `}</style>
    </main>
  );
}