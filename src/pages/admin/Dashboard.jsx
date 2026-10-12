import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../auth/AdminAuth';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, PageHeader, Skeleton, Stat, StatusBadge, TableShell, Td, fmtDate, fmtINR } from '../../components/admin/ui';

const PERIODS = [
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
  ['yearly', 'Yearly'],
];

const METRICS = [
  ['bookings', 'Bookings'],
  ['revenue', 'Revenue'],
];

// Round the axis max up to a clean number (1, 2, 2.5, 5 × power of 10).
const niceCeil = (v) => {
  if (!v || v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

const shortDay = (b) => {
  const d = new Date(`${b}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(b) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtBucket = (bucket, period) => {
  const b = String(bucket);
  if (period === 'daily' || period === 'weekly') return shortDay(b);
  if (period === 'monthly') {
    const [y, m] = b.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return Number.isNaN(d.getTime()) ? b : d.toLocaleDateString('en-IN', { month: 'short' }) + ` ’${String(y).slice(2)}`;
  }
  return b;
};

// Weekly buckets are keyed by Monday — show the full Mon–Sun range.
const fmtBucketFull = (bucket, period) => {
  const b = String(bucket);
  if (period === 'daily') {
    const d = new Date(`${b}T00:00:00`);
    return Number.isNaN(d.getTime()) ? b : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (period === 'weekly') {
    const mon = new Date(`${b}T00:00:00`);
    if (Number.isNaN(mon.getTime())) return b;
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    const sameMonth = mon.getMonth() === sun.getMonth();
    const l = mon.toLocaleDateString('en-IN', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
    const r = sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${l} – ${r}`;
  }
  return fmtBucket(b, period);
};

export default function Dashboard() {
  const { admin } = useAdmin();
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [metric, setMetric] = useState('bookings');
  const [range, setRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [rangeErr, setRangeErr] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainDone, setMainDone] = useState(false);
  const [analyticsDone, setAnalyticsDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, r] = await Promise.all([
        api('/admin/dashboard'),
        api('/admin/bookings?per_page=8'),
      ]);
      setSummary(s.data);
      setRecent(r.data);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setMainDone(true);
    }
  }, [api]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const started = Date.now();
    try {
      const qs = new URLSearchParams({ period });
      if (appliedRange.from) qs.set('date_from', appliedRange.from);
      if (appliedRange.to) qs.set('date_to', appliedRange.to);
      const a = await api(`/admin/analytics?${qs}`);
      setAnalytics(a.data);
    } catch {
      // analytics is supplementary — dashboard stays usable without it
    } finally {
      // Minimum visible time so the loader is perceptible on fast networks.
      await new Promise((r) => setTimeout(r, Math.max(0, 400 - (Date.now() - started))));
      setAnalyticsLoading(false);
      setAnalyticsDone(true);
    }
  }, [api, period, appliedRange]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Logo-loader waits for BOTH first loads (summary + chart/analytics).
  useEffect(() => {
    if (mainDone && analyticsDone) signalReady();
  }, [mainDone, analyticsDone, signalReady]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const applyRange = (e) => {
    e?.preventDefault();
    setRangeErr('');
    const { from, to } = range;
    if (!from && !to) {
      setRangeErr('Pick a from or to date first.');
      return;
    }
    if (from && to && from > to) {
      setRangeErr('From date cannot be after To date.');
      return;
    }
    // Auto bucketing for the custom span so the chart stays readable.
    const days = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000);
    setPeriod(days <= 45 ? 'daily' : days <= 270 ? 'weekly' : days <= 1095 ? 'monthly' : 'yearly');
    setAppliedRange({ from, to });
  };

  const clearRange = () => {
    setRange({ from: '', to: '' });
    setAppliedRange({ from: '', to: '' });
    setRangeErr('');
  };

  const isCustom = !!(appliedRange.from || appliedRange.to);

  // Presets and custom range are mutually exclusive — picking a preset
  // clears the custom range so the two can never mix into an empty result.
  const pickPeriod = (v) => {
    setPeriod(v);
    setRange({ from: '', to: '' });
    setAppliedRange({ from: '', to: '' });
    setRangeErr('');
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-lg">
        <PageHeader title="Dashboard" sub="Loading live operations data…" />
        <Skeleton lines={6} />
      </main>
    );
  }

  const series = analytics?.series || [];
  const rawMax = Math.max(0, ...series.map((s) => Number(s[metric])));
  // Small whole-number ranges get exact integer ticks (2,1,0) instead of
  // rounded duplicates (2,2,1,1,0).
  const ticks = metric === 'bookings' && rawMax <= 8
    ? Array.from({ length: Math.max(1, Math.ceil(rawMax)) + 1 }, (_, i) => Math.max(1, Math.ceil(rawMax)) - i)
    : [4, 3, 2, 1, 0].map((i) => (niceCeil(rawMax) * i) / 4);
  const topTick = Math.max(1, ticks[0]);
  const fmtTick = (v) => (metric === 'revenue'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(v)
    : String(Math.round(v)));

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-lg">
      <PageHeader
        title={`${greet}, ${admin?.name?.split(' ')[0] || 'Admin'}`}
        titleClassName="font-headline-md text-headline-md"
        inlineSub
        sub={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={<Link to="/admin/bookings" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold shadow-sm hover:bg-on-secondary-container transition-all"><span className="material-symbols-outlined text-[18px]">receipt_long</span>View Bookings</Link>}
      />
      <ErrorBox message={error} onRetry={load} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <Stat icon="receipt_long" label="Total Bookings" value={summary?.total_bookings ?? 0} sub={`Today: ${summary?.today_bookings ?? 0}`} grad="from-secondary to-sky-400" />
        <Stat icon="group" label="Customers" value={summary?.total_customers ?? 0} sub={`${summary?.total_tests ?? 0} active tests`} grad="from-violet-500 to-purple-400" />
        <Stat icon="vaccines" label="Samples Collected" value={summary?.samples_collected ?? 0} sub={`Pending: ${summary?.pending_collections ?? 0}`} grad="from-teal-500 to-emerald-400" />
        <Stat icon="payments" label="Revenue" value={fmtINR(summary?.total_revenue)} sub={`Reports ready: ${summary?.reports_ready ?? 0}`} grad="from-amber-500 to-orange-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-md">
        <div className="xl:col-span-2 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Performance</p>
              <h2 className="font-headline-sm text-headline-sm text-primary">{metric === 'revenue' ? 'Revenue Trend' : 'Bookings Trend'}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg" role="tablist" aria-label="Metric">
                {METRICS.map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setMetric(v)} className={`px-3 py-1 rounded-md font-label-md text-label-md ${metric === v ? 'bg-surface-container-lowest text-secondary shadow-sm' : 'text-on-surface-variant'}`}>{label}</button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg" role="tablist" aria-label="Period">
                {PERIODS.map(([v, label]) => (
                  <button key={v} type="button" onClick={() => pickPeriod(v)} disabled={isCustom} title={isCustom ? 'Clear custom range to use presets' : undefined} className={`px-3 py-1 rounded-md font-label-md text-label-md disabled:opacity-40 disabled:cursor-not-allowed ${period === v && !isCustom ? 'bg-surface-container-lowest text-secondary shadow-sm' : period === v ? 'text-secondary font-semibold' : 'text-on-surface-variant'}`}>{label}</button>
                ))}
              </div>
            </div>
            <form onSubmit={applyRange} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">date_range</span>
              <span className="font-label-md text-label-md text-on-surface-variant">Custom:</span>
              <input type="date" value={range.from} max={range.to || todayStr} onChange={(e) => setRange({ ...range, from: e.target.value })} className="px-2 py-1.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-primary outline-none" aria-label="From date" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">→</span>
              <input type="date" value={range.to} min={range.from || undefined} max={todayStr} onChange={(e) => setRange({ ...range, to: e.target.value })} className="px-2 py-1.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-primary outline-none" aria-label="To date" />
              <button type="submit" disabled={!range.from || !range.to} title={!range.from || !range.to ? 'Select both dates first' : 'Apply custom range'} className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-on-secondary-container disabled:opacity-40 disabled:cursor-not-allowed">Apply</button>
              {(appliedRange.from || appliedRange.to) && (
                <button type="button" onClick={clearRange} className="px-3 py-1.5 rounded-lg bg-surface-container-lowest font-label-md text-label-md text-on-surface-variant hover:text-primary">Clear</button>
              )}
              {rangeErr && <span role="alert" className="font-body-sm text-body-sm text-error">{rangeErr}</span>}
              {(appliedRange.from || appliedRange.to) && !rangeErr && (
                <span className="font-body-sm text-body-sm text-on-tertiary-container font-semibold">
                  {appliedRange.from || '…'} → {appliedRange.to || 'today'}
                </span>
              )}
            </form>
          </div>
          {!series.length ? (
            <p className="font-body-md text-body-md text-on-surface-variant py-8 text-center">No bookings in this period yet.</p>
          ) : (
            <div className="relative">
              {analyticsLoading && (
                <div className="absolute -inset-1 z-10 flex items-center justify-center gap-2 rounded-xl bg-surface-container-lowest/70">
                  <span className="material-symbols-outlined text-[22px] text-secondary animate-spin">refresh</span>
                  <span className="font-label-md text-label-md text-primary">Updating chart…</span>
                </div>
              )}
              <div className={`transition-opacity ${analyticsLoading ? 'opacity-40' : ''}`}>
              <div className="flex gap-2">
              <div className="flex flex-col justify-between h-48 py-0 shrink-0 w-12 text-right" aria-hidden="true">
                {ticks.map((t, i) => (
                  <span key={i} className="font-body-sm text-body-sm text-on-surface-variant tabular-nums leading-none">{fmtTick(t)}</span>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="relative h-48 border-b border-outline-variant">
                  {ticks.slice(0, -1).map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-t border-dashed border-outline-variant" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }} />
                  ))}
                  <div className="absolute inset-0 flex items-end gap-1 sm:gap-1.5">
                    {series.map((s, i) => (
                      <div key={s.bucket} className="group relative flex-1 flex flex-col justify-end h-full min-w-0">
                        <div className={`absolute bottom-full mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 shadow-xl ${i === 0 ? 'left-0' : i === series.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                          <p className="font-label-sm text-label-sm text-primary-fixed font-bold">{fmtBucketFull(s.bucket, period)}</p>
                          <p className="font-body-sm text-body-sm text-on-primary tabular-nums">{s.bookings} booking{s.bookings === 1 ? '' : 's'} • {fmtINR(s.revenue)}</p>
                        </div>
                        <div
                          className={`w-full rounded-t-lg transition-all cursor-default ${Number(s[metric]) > 0 ? 'bg-gradient-to-t from-secondary to-secondary-container group-hover:brightness-110' : 'bg-surface-container-low'}`}
                          style={{ height: `${Math.max(3, (Number(s[metric]) / topTick) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-1.5 mt-1">
                  {series.map((s) => (
                    <span key={s.bucket} className="flex-1 min-w-0 truncate text-center font-body-sm text-body-sm text-on-surface-variant">{fmtBucket(s.bucket, period)}</span>
                  ))}
                </div>
              </div>
              </div>
            </div>
            </div>
          )}
          {analytics?.series?.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-surface-container">
              <span className="font-body-md text-body-md text-on-surface-variant">Period total: <strong className="text-primary tabular-nums">{analytics.series.reduce((a, s) => a + Number(s.bookings), 0)} bookings</strong></span>
              <span className="font-body-md text-body-md text-on-surface-variant">Revenue: <strong className="text-primary tabular-nums">{fmtINR(analytics.series.reduce((a, s) => a + Number(s.revenue), 0))}</strong></span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {analytics && Object.entries(analytics.by_status || {}).map(([st, count]) => (
              <span key={st} className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-full">
                <StatusBadge value={st} /><strong className="text-primary">{count}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-space-lg flex flex-col gap-space-sm">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Top Tests</p>
            <h2 className="font-headline-sm text-headline-sm text-primary">Popular Tests</h2>
          </div>
          {analyticsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest/70">
              <span className="material-symbols-outlined text-[22px] text-secondary animate-spin">refresh</span>
              <span className="font-label-md text-label-md text-primary">Updating…</span>
            </div>
          )}
          <div className={`flex flex-col gap-space-sm transition-opacity ${analyticsLoading ? 'opacity-40' : ''}`}>
          {!analytics?.popular_tests?.length ? (
            <p className="font-body-md text-body-md text-on-surface-variant">No data yet.</p>
          ) : analytics.popular_tests.map((t, i) => {
            const top = Math.max(1, ...analytics.popular_tests.map((x) => Number(x.bookings)));
            return (
              <div key={t.code} className="flex items-center gap-3 py-2 border-b border-surface-container last:border-0">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-container to-secondary text-white font-label-sm text-label-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-label-md text-label-md text-primary truncate">{t.test}</p>
                    <span className="shrink-0 font-label-md text-label-md text-secondary font-bold tabular-nums whitespace-nowrap">{t.bookings} booking{Number(t.bookings) === 1 ? '' : 's'}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-container" style={{ width: `${Math.max(6, (Number(t.bookings) / top) * 100)}%` }} />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-mono mt-0.5">{t.code}</p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-space-sm">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Latest</p>
            <h2 className="font-headline-sm text-headline-sm text-primary">Recent Bookings</h2>
          </div>
          <Link to="/admin/bookings" className="font-label-md text-label-md text-secondary font-semibold hover:underline">View all →</Link>
        </div>
        {!recent.length ? (
          <EmptyState icon="receipt_long" title="No bookings yet" sub="Bookings made on the website will appear here in real time." />
        ) : (
          <TableShell head={['Booking', 'Patient', 'Tests', 'Status', 'Amount', 'Booked']}>
            {recent.map((b) => (
              <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                <Td><Link to={`/admin/bookings/${b.id}`} className="font-mono font-semibold text-secondary hover:underline">{b.booking_number}</Link></Td>
                <Td>{b.patient?.name}<br /><span className="font-body-sm text-body-sm text-on-surface-variant">{b.patient?.phone}</span></Td>
                <Td className="max-w-[220px] truncate">{(b.tests || []).map((t) => t.code).join(', ')}</Td>
                <Td><StatusBadge value={b.status} /></Td>
                <Td className="font-semibold">{fmtINR(b.total)}</Td>
                <Td className="whitespace-nowrap">{fmtDate(b.created_at)}</Td>
              </tr>
            ))}
          </TableShell>
        )}
      </div>
    </main>
  );
}
