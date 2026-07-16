'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

type Registration = {
  id: number;
  payment_status: string;
  payment_method: string | null;
  payment_drive_url: string | null;
  created_at: string;
  needs_transport: boolean;
  delegate_profiles: {
    delegate_id: string;
    first_name: string;
    last_name: string;
    email: string;
    school: string;
    grade: number;
  };
  conferences: { title: string; slug: string };
  allocated_council: { name: string } | null;
  transport_routes: { location_name: string } | null;
};

type CouncilStat = {
  id: number;
  current_count: number;
  capacity: number;
  councils: { name: string; abbreviation: string };
};

type TransportStat = {
  id: number;
  location_name: string;
  current_count: number;
  capacity: number | null;
};

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [councilStats, setCouncilStats] = useState<CouncilStat[]>([]);
  const [transportStats, setTransportStats] = useState<TransportStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagging, setFlagging] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    // Get summer camp id
    const { data: conf } = await supabase
      .from('conferences')
      .select('id')
      .eq('slug', 'summer-camp-2026')
      .single();

    if (!conf) { setLoading(false); return; }

    // Registrations
    const { data: regs } = await supabase
      .from('registrations')
      .select(`
        id, payment_status, payment_method, payment_drive_url, created_at, needs_transport,
        delegate_profiles(delegate_id, first_name, last_name, email, school, grade),
        conferences(title, slug),
        allocated_council:councils!registrations_allocated_council_id_fkey(name),
        transport_routes(location_name)
      `)
      .eq('conference_id', conf.id)
      .order('created_at', { ascending: false });

    if (regs) setRegistrations(regs as any);

    // Council stats
    const { data: cc } = await supabase
      .from('conference_councils')
      .select('id, current_count, capacity, councils(name, abbreviation)')
      .eq('conference_id', conf.id)
      .order('id');

    if (cc) setCouncilStats(cc as any);

    // Transport stats
    const { data: tr } = await supabase
      .from('transport_routes')
      .select('id, location_name, current_count, capacity')
      .eq('conference_id', conf.id)
      .order('pickup_time');

    if (tr) setTransportStats(tr);

    setLoading(false);
  };

  const handleFlag = async (id: number, currentStatus: string) => {
    setFlagging(id);
    const newStatus = currentStatus === 'flagged' ? 'paid' : 'flagged';
    await supabase
      .from('registrations')
      .update({ payment_status: newStatus })
      .eq('id', id);
    await load();
    setFlagging(null);
  };

  const totalRegistered = registrations.length;
  const totalPaid = registrations.filter(r => r.payment_status === 'paid').length;
  const totalPending = registrations.filter(r => r.payment_status === 'pending').length;
  const totalFlagged = registrations.filter(r => r.payment_status === 'flagged').length;

  const filtered = registrations.filter(r => {
    const matchSearch = search === '' ||
      r.delegate_profiles?.delegate_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.delegate_profiles?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.delegate_profiles?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.delegate_profiles?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.payment_status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <main className="ad-root">
        <div className="ad-loading">Loading dashboard…</div>
      </main>
    );
  }

  return (
    <main className="ad-root">
      {/* ── Header ── */}
      <header className="ad-header">
        <div className="ad-header-left">
          <img src="/logo.png" alt="NCIMUN" className="ad-logo" />
          <div>
            <h1 className="ad-title">Admin Dashboard</h1>
            <p className="ad-subtitle">NCIMUN Summer Camp 2026</p>
          </div>
        </div>
        <button className="ad-refresh" onClick={load}>↻ Refresh</button>
      </header>

      {/* ── Stats ── */}
      <div className="ad-stats">
        <div className="ad-stat">
          <span className="ad-stat-number">{totalRegistered}</span>
          <span className="ad-stat-label">Registered</span>
        </div>
        <div className="ad-stat ad-stat--green">
          <span className="ad-stat-number">{totalPaid}</span>
          <span className="ad-stat-label">Paid</span>
        </div>
        <div className="ad-stat ad-stat--yellow">
          <span className="ad-stat-number">{totalPending}</span>
          <span className="ad-stat-label">Pending</span>
        </div>
        <div className="ad-stat ad-stat--red">
          <span className="ad-stat-number">{totalFlagged}</span>
          <span className="ad-stat-label">Flagged</span>
        </div>
      </div>

      {/* ── Council + Transport ── */}
      <div className="ad-overview">
        {/* Council capacity */}
        <div className="ad-card">
          <h2 className="ad-card-title">Council capacity</h2>
          <div className="ad-council-list">
            {councilStats.map(c => {
              const pct = Math.round((c.current_count / c.capacity) * 100);
              return (
                <div key={c.id} className="ad-council-row">
                  <div className="ad-council-info">
                    <span className="ad-council-abbr">{c.councils?.abbreviation}</span>
                    <span className="ad-council-name">{c.councils?.name}</span>
                  </div>
                  <div className="ad-council-bar-wrap">
                    <div className="ad-council-bar">
                      <div
                        className={`ad-council-fill ${pct >= 100 ? 'ad-council-fill--full' : pct >= 75 ? 'ad-council-fill--high' : ''}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="ad-council-count">{c.current_count}/{c.capacity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transport overview */}
        <div className="ad-card">
          <h2 className="ad-card-title">Transport points</h2>
          <div className="ad-transport-list">
            {transportStats.map(t => (
              <div key={t.id} className="ad-transport-row">
                <span className="ad-transport-name">{t.location_name}</span>
                <span className="ad-transport-count">{t.current_count} delegates</span>
              </div>
            ))}
            {transportStats.length === 0 && (
              <p className="ad-empty">No transport data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Registrations table ── */}
      <div className="ad-card ad-card--full">
        <div className="ad-table-header">
          <h2 className="ad-card-title">Registrations</h2>
          <div className="ad-table-controls">
            <input
              className="ad-search"
              type="text"
              placeholder="Search by name, ID, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="ad-filter"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Delegate ID</th>
                <th>Name</th>
                <th>School</th>
                <th>Grade</th>
                <th>Council</th>
                <th>Transport</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Screenshot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="ad-empty-row">No registrations found.</td>
                </tr>
              ) : filtered.map(reg => (
                <tr key={reg.id} className={`ad-row ad-row--${reg.payment_status}`}>
                  <td className="ad-cell-id">{reg.delegate_profiles?.delegate_id}</td>
                  <td>{reg.delegate_profiles?.first_name} {reg.delegate_profiles?.last_name}</td>
                  <td>{reg.delegate_profiles?.school}</td>
                  <td>{reg.delegate_profiles?.grade}</td>
                  <td>{reg.allocated_council?.name || '—'}</td>
                  <td>{reg.needs_transport ? reg.transport_routes?.location_name || '—' : 'Own'}</td>
                  <td>{reg.payment_method || '—'}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${reg.payment_status}`}>
                      {reg.payment_status}
                    </span>
                  </td>
                  <td>
                    {reg.payment_drive_url ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment-screenshots/${reg.payment_drive_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ad-link"
                      >
                        View
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <button
                      className={`ad-flag-btn ${reg.payment_status === 'flagged' ? 'ad-flag-btn--unflag' : ''}`}
                      onClick={() => handleFlag(reg.id, reg.payment_status)}
                      disabled={flagging === reg.id}
                    >
                      {flagging === reg.id ? '…' : reg.payment_status === 'flagged' ? 'Unflag' : 'Flag'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
          --yellow: #8a7a00;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
          --shadow: 0 4px 24px rgba(35,39,42,.08);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        .ad-root { max-width: 1400px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .ad-loading { text-align: center; padding: 6rem; color: var(--gray-400); }

        /* Header */
        .ad-header {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--black); border-radius: 14px; padding: 1.5rem 2rem;
        }
        .ad-header-left { display: flex; align-items: center; gap: 1rem; }
        .ad-logo { height: 40px; }
        .ad-title { font-size: 1.25rem; font-weight: 900; color: var(--white); }
        .ad-subtitle { font-size: .8125rem; color: rgba(255,255,255,.5); margin-top: .1rem; }
        .ad-refresh {
          background: rgba(255,255,255,.08); color: rgba(255,255,255,.7);
          border: 1px solid rgba(255,255,255,.15); border-radius: 8px;
          padding: .5rem 1rem; font-family: var(--font); font-size: .875rem;
          cursor: pointer; transition: background .15s;
        }
        .ad-refresh:hover { background: rgba(255,255,255,.15); }

        /* Stats */
        .ad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .ad-stat {
          background: var(--white); border-radius: 12px; padding: 1.5rem;
          border: 1.5px solid var(--gray-200); text-align: center;
        }
        .ad-stat-number { display: block; font-size: 2.5rem; font-weight: 900; color: var(--blue); }
        .ad-stat--green .ad-stat-number { color: var(--green); }
        .ad-stat--yellow .ad-stat-number { color: var(--yellow); }
        .ad-stat--red .ad-stat-number { color: var(--red); }
        .ad-stat-label { display: block; font-size: .75rem; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: .08em; margin-top: .25rem; }

        /* Overview */
        .ad-overview { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        /* Cards */
        .ad-card {
          background: var(--white); border-radius: 14px;
          border: 1.5px solid var(--gray-200); padding: 1.5rem;
        }
        .ad-card--full { grid-column: 1 / -1; }
        .ad-card-title { font-size: .9375rem; font-weight: 800; margin-bottom: 1.25rem; }

        /* Council list */
        .ad-council-list { display: flex; flex-direction: column; gap: .875rem; }
        .ad-council-row { display: flex; flex-direction: column; gap: .4rem; }
        .ad-council-info { display: flex; align-items: center; gap: .625rem; }
        .ad-council-abbr {
          font-size: .7rem; font-weight: 800; color: var(--blue);
          background: rgba(95,150,202,.1); padding: .2rem .5rem;
          border-radius: 4px; letter-spacing: .06em;
        }
        .ad-council-name { font-size: .875rem; font-weight: 600; color: var(--black); }
        .ad-council-bar-wrap { display: flex; align-items: center; gap: .75rem; }
        .ad-council-bar { flex: 1; height: 6px; background: var(--gray-200); border-radius: 999px; overflow: hidden; }
        .ad-council-fill { height: 100%; background: var(--blue); border-radius: 999px; transition: width .3s; }
        .ad-council-fill--high { background: #F8A84B; }
        .ad-council-fill--full { background: var(--red); }
        .ad-council-count { font-size: .8125rem; font-weight: 700; color: var(--gray-600); white-space: nowrap; }

        /* Transport */
        .ad-transport-list { display: flex; flex-direction: column; gap: .625rem; }
        .ad-transport-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: .75rem 1rem; background: var(--gray-50); border-radius: 8px;
        }
        .ad-transport-name { font-size: .875rem; font-weight: 600; }
        .ad-transport-count { font-size: .8125rem; color: var(--gray-600); font-weight: 600; }
        .ad-empty { font-size: .875rem; color: var(--gray-400); }

        /* Table */
        .ad-table-header {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;
        }
        .ad-table-controls { display: flex; gap: .75rem; flex-wrap: wrap; }
        .ad-search, .ad-filter {
          padding: .5rem .875rem; border: 1.5px solid var(--gray-200);
          border-radius: 8px; font-family: var(--font); font-size: .875rem;
          color: var(--black); background: var(--white); outline: none;
        }
        .ad-search { min-width: 260px; }
        .ad-search:focus, .ad-filter:focus { border-color: var(--blue); }

        .ad-table-wrap { overflow-x: auto; }
        .ad-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
        .ad-table th {
          text-align: left; padding: .625rem .875rem;
          font-size: .7rem; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; color: var(--gray-600);
          border-bottom: 2px solid var(--gray-200); white-space: nowrap;
        }
        .ad-table td { padding: .75rem .875rem; border-bottom: 1px solid var(--gray-200); vertical-align: middle; }
        .ad-row:hover td { background: var(--gray-50); }
        .ad-row--flagged td { background: rgba(229,83,75,.04); }
        .ad-cell-id { font-weight: 700; color: var(--blue); }
        .ad-empty-row { text-align: center; color: var(--gray-400); padding: 2rem; }

        /* Badges */
        .ad-badge {
          font-size: .7rem; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; padding: .25rem .625rem; border-radius: 999px;
          display: inline-block;
        }
        .ad-badge--paid { background: rgba(45,155,111,.12); color: var(--green); }
        .ad-badge--pending { background: rgba(248,233,141,.3); color: var(--yellow); }
        .ad-badge--flagged { background: rgba(229,83,75,.1); color: var(--red); }

        .ad-link { color: var(--blue); font-weight: 600; font-size: .8125rem; }
        .ad-link:hover { text-decoration: underline; }

        .ad-flag-btn {
          background: rgba(229,83,75,.08); color: var(--red);
          border: 1px solid rgba(229,83,75,.2); border-radius: 6px;
          padding: .3rem .75rem; font-family: var(--font); font-size: .75rem;
          font-weight: 700; cursor: pointer; transition: background .15s;
        }
        .ad-flag-btn:hover { background: rgba(229,83,75,.15); }
        .ad-flag-btn--unflag { background: rgba(45,155,111,.08); color: var(--green); border-color: rgba(45,155,111,.2); }
        .ad-flag-btn--unflag:hover { background: rgba(45,155,111,.15); }

        @media (max-width: 900px) {
          .ad-stats { grid-template-columns: repeat(2, 1fr); }
          .ad-overview { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .ad-root { padding: 1rem; }
          .ad-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}