'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Route = { id: number; location_name: string };

type TransportRegistration = {
  delegate_id: string;
  payment_status: string;
  needs_transport: boolean;
  transport_route_id: number | null;
  delegate_profiles: { school: string } | null;
};

type Selection = {
  delegate_id: string;
  day_type: string;
  pickup_route_id: number | null;
  dropoff_route_id: number | null;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
type Day = typeof DAYS[number];

// Which saved day_type covers each day, for regular and Conti delegates
const REGULAR_DAY_TYPE: Record<Day, string> = {
  Sun: 'weekday', Mon: 'weekday', Tue: 'weekday', Wed: 'weekday', Thu: 'weekday',
  Fri: 'weekend', Sat: 'weekend',
};
const CONTI_DAY_TYPE: Record<Day, string> = {
  Sun: 'sun_mon', Mon: 'sun_mon',
  Tue: 'tue_thu', Wed: 'tue_thu', Thu: 'tue_thu',
  Fri: 'fri_sat', Sat: 'fri_sat',
};

export default function TransportCard({
  conferenceId,
  routes,
  registrations,
}: {
  conferenceId: number | null;
  routes: Route[];
  registrations: TransportRegistration[];
}) {
  const [view, setView] = useState<'old' | 'updated'>('old');
  const [day, setDay] = useState<Day>('Sun');
  const [selections, setSelections] = useState<Selection[]>([]);

  useEffect(() => {
    if (!conferenceId) return;
    supabase
      .from('transport_selections')
      .select('delegate_id, day_type, pickup_route_id, dropoff_route_id')
      .eq('conference_id', conferenceId)
      .then(({ data }) => { if (data) setSelections(data); });
  }, [conferenceId, registrations]);

  // Pending delegates can save, but only paid ones count towards buses
  const paid = registrations.filter(r => r.payment_status === 'paid');
  const originalRoute = (r: TransportRegistration) => (r.needs_transport ? r.transport_route_id : null);

  const oldCount = (routeId: number) => paid.filter(r => originalRoute(r) === routeId).length;
  const oldNone = paid.filter(r => originalRoute(r) === null).length;

  // A paid delegate's pickup/dropoff for the chosen day; falls back to their original route if they never updated
  const choiceFor = (r: TransportRegistration) => {
    const own = selections.filter(s => s.delegate_id === r.delegate_id);
    const dayType = (/conti/i.test(r.delegate_profiles?.school ?? '') ? CONTI_DAY_TYPE : REGULAR_DAY_TYPE)[day];
    const sel = own.find(s => s.day_type === dayType);
    if (!sel) return { pickup: originalRoute(r), dropoff: originalRoute(r) };
    return { pickup: sel.pickup_route_id, dropoff: sel.dropoff_route_id };
  };

  const choices = paid.map(choiceFor);
  const updatedCount = (routeId: number | null, field: 'pickup' | 'dropoff') =>
    choices.filter(c => c[field] === routeId).length;
  const updatedDelegates = new Set(selections.map(s => s.delegate_id));
  const paidUpdated = paid.filter(r => updatedDelegates.has(r.delegate_id)).length;

  return (
    <div className="ad-card">
      <div className="tc-head">
        <h2 className="ad-card-title tc-title">Transport points</h2>
        <div className="tc-tabs">
          <button className={`tc-tab ${view === 'old' ? 'tc-tab--active' : ''}`} onClick={() => setView('old')}>
            Old selections
          </button>
          <button className={`tc-tab ${view === 'updated' ? 'tc-tab--active' : ''}`} onClick={() => setView('updated')}>
            Updated selections
          </button>
        </div>
      </div>

      {routes.length === 0 ? (
        <p className="ad-empty">No transport data yet.</p>
      ) : view === 'old' ? (
        <div className="ad-transport-list">
          {routes.map(t => (
            <div key={t.id} className="ad-transport-row">
              <span className="ad-transport-name">{t.location_name}</span>
              <span className="ad-transport-count">{oldCount(t.id)} paid delegates</span>
            </div>
          ))}
          <div className="ad-transport-row">
            <span className="ad-transport-name">Own transport</span>
            <span className="ad-transport-count">{oldNone} paid delegates</span>
          </div>
        </div>
      ) : (
        <>
          <p className="tc-note">
            Paid delegates only. {paidUpdated} of {paid.length} have updated; the rest count on their original route.
          </p>
          <div className="tc-days">
            {DAYS.map(d => (
              <button key={d} className={`tc-day ${day === d ? 'tc-day--active' : ''}`} onClick={() => setDay(d)}>
                {d}
              </button>
            ))}
          </div>
          <table className="tc-table">
            <thead>
              <tr><th>Route</th><th>Pickup</th><th>Dropoff</th></tr>
            </thead>
            <tbody>
              {routes.map(t => (
                <tr key={t.id}>
                  <td>{t.location_name}</td>
                  <td>{updatedCount(t.id, 'pickup')}</td>
                  <td>{updatedCount(t.id, 'dropoff')}</td>
                </tr>
              ))}
              <tr className="tc-row-none">
                <td>No transport</td>
                <td>{updatedCount(null, 'pickup')}</td>
                <td>{updatedCount(null, 'dropoff')}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <style>{`
        .tc-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
        .tc-title { margin-bottom: 0; }
        .tc-tabs { display: flex; background: var(--gray-100); border-radius: 8px; padding: 3px; }
        .tc-tab { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: .75rem; font-weight: 700; color: var(--gray-600); padding: .4rem .75rem; border-radius: 6px; }
        .tc-tab--active { background: var(--black); color: var(--white); }
        .tc-note { font-size: .75rem; color: var(--gray-600); margin-bottom: .75rem; }
        .tc-days { display: flex; gap: .375rem; flex-wrap: wrap; margin-bottom: .75rem; }
        .tc-day { background: var(--white); border: 1.5px solid var(--gray-200); border-radius: 6px; cursor: pointer; font-family: var(--font); font-size: .75rem; font-weight: 700; color: var(--gray-600); padding: .3rem .6rem; }
        .tc-day--active { border-color: var(--blue); background: var(--blue); color: var(--white); }
        .tc-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
        .tc-table th { text-align: left; font-size: .6875rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; padding: .5rem; border-bottom: 1px solid var(--gray-200); }
        .tc-table td { padding: .55rem .5rem; border-bottom: 1px solid var(--gray-100); font-weight: 600; }
        .tc-table th:not(:first-child), .tc-table td:not(:first-child) { text-align: right; width: 70px; }
        .tc-row-none td { color: var(--gray-600); }
      `}</style>
    </div>
  );
}
