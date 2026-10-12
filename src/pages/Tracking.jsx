import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import PhoneInput from '../components/PhoneInput';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

const STAGES = [
  { key: 'pending', label: 'Booking Received', icon: 'receipt_long', next: 'We confirm your order shortly.' },
  { key: 'confirmed', label: 'Confirmed', icon: 'verified', next: 'A collector is being assigned.' },
  { key: 'collection_assigned', label: 'Collector Assigned', icon: 'person_pin_circle', next: 'Your collector will head out for pickup shortly.' },
  { key: 'sample_collected', label: 'Sample Collected', icon: 'colorize', next: 'Your sample reached the lab.' },
  { key: 'testing_in_progress', label: 'Testing in Lab', icon: 'biotech', next: 'Reports usually take a few hours.' },
  { key: 'report_ready', label: 'Report Ready', icon: 'description', next: 'Almost there — delivery next.' },
  { key: 'completed', label: 'Delivered', icon: 'mark_email_read', next: '' },
];

// Extra live node: admin sets it on the collection job ("on the way"),
// so it appears only once it really happened.
const ON_WAY_STAGE = { key: 'on_the_way', label: 'On The Way', icon: 'two_wheeler', next: 'Your collector is heading to your location.' };

const fmtWhen = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');

function JourneyTracker({ booking, timeline }) {
  const cancelled = booking.status === 'cancelled';
  const at = {};
  (timeline || []).forEach((h) => {
    if (h.status && !(h.status in at)) at[h.status] = h.at;
  });
  if (!at.pending && booking.created_at) at.pending = booking.created_at;
  const stages = at.on_the_way
    ? [...STAGES.slice(0, 3), ON_WAY_STAGE, ...STAGES.slice(3)]
    : STAGES;
  let cur = cancelled ? -1 : stages.findIndex((s) => s.key === booking.status);
  // Booking status stays "collection_assigned" while the collector travels —
  // highlight the live On The Way node instead.
  if (!cancelled && at.on_the_way && booking.status === 'collection_assigned') {
    cur = stages.findIndex((s) => s.key === 'on_the_way');
  }
  const pct = cancelled ? 0 : Math.round(((cur + 1) / stages.length) * 100);

  return (
    <section className="rounded-3xl bg-surface-container-lowest shadow-md border border-outline-variant/40 p-space-lg sm:p-space-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-surface-container-low">
        <div className="h-full rounded-r-full bg-gradient-to-r from-secondary via-teal-500 to-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Live Journey</p>
          <h2 className="font-headline-md text-headline-md text-primary">Where&apos;s my sample?</h2>
        </div>
        {!cancelled && <span className="font-label-lg text-label-lg text-secondary font-bold tabular-nums">{pct}%</span>}
      </div>

      {cancelled ? (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
          <span className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px] text-red-600">cancel</span>
          </span>
          <div>
            <p className="font-label-lg text-label-lg text-red-700">This booking was cancelled</p>
            <p className="font-body-sm text-body-sm text-red-600">Please contact us to rebook.</p>
          </div>
        </div>
      ) : (
        <>
        <ol className="flex items-start max-sm:overflow-x-auto max-sm:pb-2 max-sm:-mx-1 max-sm:px-1">
          {stages.map((s, i) => {
            const done = i < cur;
            const current = i === cur;
            const when = at[s.key];
            return (
              <li key={s.key} className="flex-1 flex flex-col items-center text-center relative min-w-0 px-0.5 max-sm:min-w-[62px] max-sm:shrink-0">
                {i > 0 && (
                  <span aria-hidden="true" className={`absolute top-5 left-[calc(-50%+22px)] right-[calc(50%+22px)] h-0.5 rounded-full ${i <= cur ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-surface-container'}`} />
                )}
                <span className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  done ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  : current ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/30'
                  : 'bg-surface-container-low text-outline'
                }`}>
                  {current && <span className="absolute inset-0 rounded-full bg-secondary/40 animate-ping" />}
                  <span className="material-symbols-outlined text-[20px] relative">{done ? 'check' : s.icon}</span>
                </span>
                <p className={`mt-2 font-label-sm text-label-sm leading-tight ${current ? 'text-secondary font-bold' : done ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                  {s.label}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant tabular-nums leading-tight mt-0.5 min-h-[18px]">
                  {when ? fmtWhen(when) : ''}
                </p>
              </li>
            );
          })}
        </ol>
        {(() => {
          const s = stages[cur];
          if (!s) return null;
          return (
            <div className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 shadow-sm flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse mt-2 shrink-0" />
              <div>
                <p className="font-label-lg text-label-lg text-secondary font-bold">Step {cur + 1} of {stages.length} • {s.label}</p>
                {s.next && <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{s.next}</p>}
              </div>
            </div>
          );
        })()}
        </>
      )}
    </section>
  );
}

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  collection_assigned: 'bg-sky-50 text-sky-700 border-sky-200',
  sample_collected: 'bg-teal-50 text-teal-700 border-teal-200',
  testing_in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  report_ready: 'bg-violet-50 text-violet-700 border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function Tracking() {
  const [params] = useSearchParams();
  const [bookingNo, setBookingNo] = useState(params.get('booking') || '');
  const [phone, setPhone] = useState(params.get('phone') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const track = async (bn, ph) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const qs = new URLSearchParams({ booking_number: bn.trim(), phone: ph.trim() });
      const res = await fetch(`${API_BASE}/bookings/track?${qs}`, { headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(res.status === 404 ? 'No booking found for these details. Check the booking ID and phone number.' : (data?.message || 'Tracking failed.'));
      setResult(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bn = params.get('booking');
    const ph = params.get('phone');
    if (bn && ph) track(bn, ph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!bookingNo.trim() || !phone.trim()) {
      setError('Enter both booking ID and phone number.');
      return;
    }
    track(bookingNo, phone);
  };

  const b = result?.booking;

  return (
    <main className="w-full pt-28 bg-surface flex-1">
      <div className="max-w-4xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg relative max-sm:overflow-x-clip">
        <div aria-hidden="true" className="absolute -top-10 -right-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
        <div className="enter text-center flex flex-col gap-2 relative pb-space-sm">
          <span className="inline-flex items-center justify-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold"><span className="w-6 h-px bg-secondary inline-block"></span>Live Status<span className="w-6 h-px bg-secondary inline-block"></span></span>
          <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight text-balance">Track Your Booking</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Enter the booking ID from your confirmation and the phone number used at booking.</p>
        </div>

        <form onSubmit={submit} className="tracking-form enter enter-1 relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl p-space-md sm:p-space-lg flex flex-col sm:flex-row gap-3 max-sm:w-full max-sm:min-w-0">
          <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-secondary-container to-tertiary-fixed"></div>
          <input value={bookingNo} onChange={(e) => setBookingNo(e.target.value.toUpperCase())} placeholder="Booking ID (e.g. BK-20261009-000123)" className="flex-1 max-sm:w-full max-sm:min-w-0 h-12 px-4 rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary font-mono font-body-md text-body-md max-sm:text-[16px] placeholder:text-ellipsis overflow-hidden" aria-label="Booking ID" />
          <PhoneInput value={phone} onChange={setPhone} placeholder="10-digit mobile" label="Phone number" className="flex-1 max-sm:w-full max-sm:min-w-0 max-sm:text-[16px]" />
          <button type="submit" disabled={loading} className="h-12 px-6 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow hover:bg-on-secondary-container disabled:opacity-60 inline-flex items-center justify-center gap-2 max-sm:w-full shrink-0">
            {loading ? <><span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>Tracking…</> : <><span className="material-symbols-outlined text-[20px]">package_search</span>Track</>}
          </button>
        </form>

        {error && <div role="alert" className="rounded-xl bg-error-container text-on-error-container px-4 py-3 font-body-md text-body-md">{error}</div>}

        {b && (
          <div className="flex flex-col gap-space-md">
            <section className="enter enter-2 rounded-2xl bg-primary text-on-primary shadow-xl p-space-lg relative overflow-hidden">
              <div aria-hidden="true" className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-secondary/20 blur-3xl pointer-events-none"></div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative">
                <span className="font-mono font-headline-sm text-headline-sm text-secondary-fixed max-sm:break-all max-sm:min-w-0">{b.booking_number}</span>
                <span className={`px-3 py-1 rounded-full border font-label-md text-label-md font-semibold ${STATUS_STYLE[b.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{String(b.status).replace(/_/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body-md text-body-md text-primary-fixed relative">
                <p><strong className="text-on-primary font-semibold">Patient:</strong> {b.patient?.name}</p>
                <p><strong className="text-on-primary font-semibold">Tests:</strong> {(b.tests || []).map((t) => `${t.name} (${t.code})`).join(', ')}</p>
                <p><strong className="text-on-primary font-semibold">Amount:</strong> {inr(b.total)}</p>
                <p><strong className="text-on-primary font-semibold">Booked:</strong> {b.created_at ? new Date(b.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</p>
              </div>
              {(b.reports || []).length > 0 && b.status === 'completed' && (
                <div className="mt-4 rounded-xl bg-violet-50 border border-violet-200 p-4 flex flex-col gap-2">
                  <p className="font-label-lg text-label-lg text-violet-800 font-semibold flex items-center gap-2"><span className="material-symbols-outlined">description</span>Your report is ready!</p>
                  {b.reports.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-body-md text-body-md text-primary">{r.file_name}</span>
                      <a href={r.access_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-violet-700 text-white font-label-md text-label-md font-semibold hover:bg-violet-800">View / Download</a>
                    </div>
                  ))}
                </div>
              )}
              {b.status === 'report_ready' && (
                <div className="mt-4 rounded-xl bg-violet-50 border border-violet-200 p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-violet-700 shrink-0">schedule_send</span>
                  <div>
                    <p className="font-label-lg text-label-lg text-violet-800 font-semibold">Your report is ready!</p>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">We&apos;re sending it to your WhatsApp shortly — download will unlock here as soon as it&apos;s sent.</p>
                  </div>
                </div>
              )}
            </section>

            <JourneyTracker booking={b} timeline={result.timeline || []} />

            <div className="flex justify-center">
              <Link to="/tests" className="font-label-md text-label-md text-secondary font-semibold hover:underline">Book another test →</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
