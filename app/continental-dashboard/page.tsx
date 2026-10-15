'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const SCHOOL_PATTERN = /conti/i;

type Student = {
  delegate_id: string;
  first_name: string;
  last_name: string;
  grade: number | null;
  school: string | null;
  email: string | null;
  phone: string | null;
  conference_title: string | null;
  council_name: string | null;
  payment_status: string | null;
  transport_location: string | null;
  needs_transport: boolean | null;
};

export default function ContinentalDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      // Guard: only Hanan's account should access this page
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email?.toLowerCase() !== 'hanan.sameer@continental.ms') {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('delegate_profiles')
        .select(`
          delegate_id,
          first_name,
          last_name,
          grade,
          school,
          email,
          phone,
          registrations (
            payment_status,
            needs_transport,
            conferences ( title ),
            councils:allocated_council_id ( name ),
            transport_routes ( location_name )
          )
        `);

      if (error) { setLoading(false); return; }

      const filtered: Student[] = [];

      for (const p of (data ?? [])) {
        if (!p.school || !SCHOOL_PATTERN.test(p.school)) continue;

        const regs: any[] = Array.isArray(p.registrations) ? p.registrations : p.registrations ? [p.registrations] : [];

        if (regs.length === 0) {
          filtered.push({
            delegate_id: p.delegate_id,
            first_name: p.first_name,
            last_name: p.last_name,
            grade: p.grade,
            school: p.school,
            email: p.email,
            phone: p.phone,
            conference_title: null,
            council_name: null,
            payment_status: null,
            transport_location: null,
            needs_transport: null,
          });
        } else {
          for (const r of regs) {
            filtered.push({
              delegate_id: p.delegate_id,
              first_name: p.first_name,
              last_name: p.last_name,
              grade: p.grade,
              school: p.school,
              email: p.email,
              phone: p.phone,
              conference_title: r.conferences?.title ?? null,
              council_name: r.councils?.name ?? null,
              payment_status: r.payment_status ?? null,
              transport_location: r.needs_transport ? (r.transport_routes?.location_name ?? null) : null,
              needs_transport: r.needs_transport ?? null,
            });
          }
        }
      }

      filtered.sort((a, b) => `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`));
      setStudents(filtered);
      setLoading(false);
    };

    fetchStudents();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const displayed = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || (s.delegate_id ?? '').toLowerCase().includes(search.toLowerCase());
    const matchPayment = filterPayment === 'all' || s.payment_status === filterPayment || (filterPayment === 'none' && !s.payment_status);
    return matchSearch && matchPayment;
  });

  const paid = students.filter(s => s.payment_status === 'paid').length;
  const pending = students.filter(s => s.payment_status === 'pending').length;
  const unregistered = students.filter(s => !s.payment_status).length;

  const paymentColor = (status: string | null) => {
    if (status === 'paid') return 'st-badge st-badge--paid';
    if (status === 'pending') return 'st-badge st-badge--pending';
    return 'st-badge st-badge--none';
  };
  const paymentLabel = (status: string | null) => {
    if (status === 'paid') return 'Paid';
    if (status === 'pending') return 'Pending';
    return 'Not registered';
  };

  return (
    <main className="db-root">
      {/* Header */}
      <header className="db-header">
        <div className="db-header-inner">
          <div className="db-header-left">
            <img src="/logo.png" alt="NCIMUN" className="db-logo" />
            <div>
              <p className="db-school">The Continental School Of Cairo</p>
              <p className="db-conf">NCIMUN Volume 7 · Student Dashboard</p>
            </div>
          </div>
          <button className="db-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <div className="db-body">

        {/* Stats row */}
        <div className="db-stats">
          <div className="db-stat">
            <span className="db-stat-num">{students.length}</span>
            <span className="db-stat-label">Total students</span>
          </div>
          <div className="db-stat">
            <span className="db-stat-num db-stat-num--paid">{paid}</span>
            <span className="db-stat-label">Paid</span>
          </div>
          <div className="db-stat">
            <span className="db-stat-num db-stat-num--pending">{pending}</span>
            <span className="db-stat-label">Pending payment</span>
          </div>
          <div className="db-stat">
            <span className="db-stat-num db-stat-num--none">{unregistered}</span>
            <span className="db-stat-label">Not yet registered</span>
          </div>
        </div>

        {/* Filters */}
        <div className="db-filters">
          <input
            className="db-search"
            placeholder="Search by name or delegate ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="db-filter-tabs">
            {[['all', 'All'], ['paid', 'Paid'], ['pending', 'Pending'], ['none', 'Not registered']].map(([val, label]) => (
              <button
                key={val}
                className={`db-tab ${filterPayment === val ? 'db-tab--active' : ''}`}
                onClick={() => setFilterPayment(val)}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="db-loading">Loading students…</div>
        ) : displayed.length === 0 ? (
          <div className="db-empty">No students match your filters.</div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Delegate</th>
                  <th>Grade</th>
                  <th>Conference</th>
                  <th>Council</th>
                  <th>Payment</th>
                  <th>Transport</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <div className="db-name">{s.first_name} {s.last_name}</div>
                      <div className="db-did">{s.delegate_id}</div>
                    </td>
                    <td>{s.grade ? `Grade ${s.grade}` : '—'}</td>
                    <td>{s.conference_title ?? <span className="db-none">—</span>}</td>
                    <td>{s.council_name ?? <span className="db-none">—</span>}</td>
                    <td><span className={paymentColor(s.payment_status)}>{paymentLabel(s.payment_status)}</span></td>
                    <td>
                      {s.needs_transport === null
                        ? <span className="db-none">—</span>
                        : s.needs_transport
                          ? <span className="db-transport">{s.transport_location ?? 'Yes'}</span>
                          : <span className="db-none">Own transport</span>}
                    </td>
                    <td>
                      <div className="db-contact">{s.email ?? '—'}</div>
                      {s.phone && <div className="db-contact db-contact--phone">{s.phone}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="db-footer">
          Showing {displayed.length} of {students.length} students · Continental Modern School · NCIMUN Volume 7
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif; background: #F8F9FA; color: #23272A; }

        /* Header */
        .db-header { background: #23272A; position: sticky; top: 0; z-index: 50; }
        .db-header-inner {
          max-width: 1300px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .db-header-left { display: flex; align-items: center; gap: 1rem; }
        .db-logo { height: 32px; display: block; }
        .db-school { font-size: .9375rem; font-weight: 800; color: #fff; }
        .db-conf { font-size: .75rem; color: rgba(255,255,255,.5); margin-top: .1rem; }
        .db-signout {
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
          color: rgba(255,255,255,.7); border-radius: 6px; padding: .4rem .875rem;
          font-family: inherit; font-size: .8125rem; font-weight: 600; cursor: pointer;
          transition: all .15s;
        }
        .db-signout:hover { background: rgba(255,255,255,.15); color: #fff; }

        /* Body */
        .db-body { max-width: 1300px; margin: 0 auto; padding: 2rem 2rem 4rem; }

        /* Stats */
        .db-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1rem; margin-bottom: 1.75rem;
        }
        .db-stat {
          background: #fff; border-radius: 12px; padding: 1.25rem 1.5rem;
          border: 1.5px solid #E9ECEF;
          display: flex; flex-direction: column; gap: .3rem;
        }
        .db-stat-num {
          font-size: 2rem; font-weight: 900; color: #23272A; line-height: 1;
        }
        .db-stat-num--paid    { color: #2D9B6F; }
        .db-stat-num--pending { color: #E09B20; }
        .db-stat-num--none    { color: #ADB5BD; }
        .db-stat-label { font-size: .8125rem; font-weight: 600; color: #6C757D; }

        /* Filters */
        .db-filters {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 1.25rem; flex-wrap: wrap;
        }
        .db-search {
          flex: 1; min-width: 220px; padding: .6rem 1rem;
          border: 1.5px solid #E9ECEF; border-radius: 8px;
          font-family: inherit; font-size: .9rem; color: #23272A;
          outline: none; background: #fff;
          transition: border-color .15s;
        }
        .db-search:focus { border-color: #5F96CA; }
        .db-filter-tabs { display: flex; gap: .375rem; flex-wrap: wrap; }
        .db-tab {
          padding: .45rem .875rem; border-radius: 6px;
          border: 1.5px solid #E9ECEF; background: #fff;
          font-family: inherit; font-size: .8125rem; font-weight: 600;
          color: #6C757D; cursor: pointer; transition: all .15s;
        }
        .db-tab:hover { border-color: #5F96CA; color: #5F96CA; }
        .db-tab--active { background: #5F96CA; border-color: #5F96CA; color: #fff; }

        /* Table */
        .db-table-wrap {
          background: #fff; border-radius: 14px;
          border: 1.5px solid #E9ECEF; overflow: hidden;
          overflow-x: auto;
        }
        .db-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
        .db-table thead tr { background: #F8F9FA; border-bottom: 2px solid #E9ECEF; }
        .db-table th {
          padding: .875rem 1rem; text-align: left;
          font-size: .75rem; font-weight: 800;
          color: #6C757D; letter-spacing: .04em; white-space: nowrap;
        }
        .db-table td {
          padding: .875rem 1rem; border-bottom: 1px solid #F1F3F5;
          vertical-align: top;
        }
        .db-table tbody tr:last-child td { border-bottom: none; }
        .db-table tbody tr:hover { background: #FAFBFC; }

        .db-name { font-weight: 700; color: #23272A; }
        .db-did { font-size: .75rem; color: #ADB5BD; margin-top: .15rem; }
        .db-none { color: #ADB5BD; }
        .db-contact { font-size: .8125rem; color: #6C757D; }
        .db-contact--phone { margin-top: .15rem; color: #ADB5BD; }
        .db-transport { font-size: .8125rem; color: #23272A; }

        /* Badges */
        .st-badge {
          display: inline-block; font-size: .7rem; font-weight: 800;
          letter-spacing: .05em; padding: .25rem .65rem; border-radius: 999px;
          white-space: nowrap;
        }
        .st-badge--paid    { background: rgba(45,155,111,.12); color: #2D9B6F; }
        .st-badge--pending { background: rgba(224,155,32,.12); color: #E09B20; }
        .st-badge--none    { background: #F1F3F5; color: #ADB5BD; }

        .db-loading, .db-empty {
          text-align: center; padding: 4rem; color: #ADB5BD;
          font-size: .9375rem;
        }

        .db-footer {
          margin-top: 1.25rem; font-size: .75rem; color: #ADB5BD; text-align: right;
        }

        @media (max-width: 900px) {
          .db-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 580px) {
          .db-stats { grid-template-columns: 1fr 1fr; }
          .db-body { padding: 1.25rem 1rem 3rem; }
          .db-header-inner { padding: 0 1rem; }
          .db-conf { display: none; }
        }
      `}</style>
    </main>
  );
}