import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, PageHeader, Pagination, Skeleton, StatusBadge, TableShell, Td, fmtDate, fmtPhone } from '../../components/admin/ui';

const STATUSES = ['', 'pending', 'assigned', 'on_the_way', 'collected', 'failed', 'cancelled'];

// Read-only dispatch board. Status moves ONLY from the booking detail
// page (single pipeline) — this screen answers "who is going where".
export default function Collections() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState('');
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    const started = Date.now();
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ per_page: '15', page: String(page) });
      if (status) qs.set('status', status);
      const res = await api(`/admin/collections?${qs}`);
      if (id !== reqId.current) return;
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e.message || 'Failed to load collections.');
    } finally {
      if (id !== reqId.current) return;
      await new Promise((r) => setTimeout(r, Math.max(0, 450 - (Date.now() - started))));
      if (id !== reqId.current) return;
      setLoading(false);
      setFirstLoad(false);
      signalReady();
    }
  }, [api, status, page, signalReady]);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader title="Sample Collections" sub={meta ? `${meta.total} jobs` : 'Who is going where — dispatch board'} />
      <ErrorBox message={error} onRetry={load} />

      <div className="flex items-center gap-2">
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="px-3 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm font-label-md text-label-md text-primary outline-none" aria-label="Filter by status">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
        </select>
      </div>

      {firstLoad && loading ? <Skeleton lines={6} /> : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest/60">
              <span className="material-symbols-outlined text-[22px] text-secondary animate-spin">refresh</span>
              <span className="font-label-md text-label-md text-primary">Loading…</span>
            </div>
          )}
          <div className={`transition-opacity ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
            {!rows.length ? (
              <EmptyState icon="local_shipping" title="No collection jobs" sub="A collection job is created automatically with every booking." />
            ) : (
              <>
                <TableShell head={['Booking', 'Patient & Location', 'Collector', 'Status', '']}>
                  {rows.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-low/50">
                      <Td>
                        {c.booking ? <Link to={`/admin/bookings/${c.booking.id}`} className="font-mono font-semibold text-secondary hover:underline whitespace-nowrap">{c.booking.booking_number}</Link> : '—'}
                        <br /><span className="font-body-sm text-body-sm text-on-surface-variant">{c.booking ? fmtDate(c.booking.created_at) : ''}</span>
                      </Td>
                      <Td>
                        {c.booking?.patient?.name}<br />
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{c.booking?.city} • {c.booking?.patient?.phone}</span>
                        {c.booking?.latitude && c.booking?.longitude && (
                          <>
                            <br />
                            <a href={`https://www.google.com/maps/search/?api=1&query=${c.booking.latitude}%2C${c.booking.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-label-sm text-label-sm text-secondary font-bold hover:underline mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>Open Map
                            </a>
                          </>
                        )}
                      </Td>
                      <Td>{c.staff?.name || c.assigned_to || <span className="text-on-surface-variant">Unassigned</span>}{c.staff?.phone && <><br /><span className="font-mono font-body-sm text-body-sm text-on-surface-variant">{fmtPhone(c.staff.phone)}</span></>}</Td>
                      <Td><StatusBadge value={c.status} /></Td>
                      <Td>
                        {c.booking && <Link to={`/admin/bookings/${c.booking.id}`} className="px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high whitespace-nowrap">Open Order →</Link>}
                      </Td>
                    </tr>
                  ))}
                </TableShell>
                <div className="mt-3">
                  <Pagination meta={meta} onPage={setPage} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <p className="font-body-sm text-body-sm text-on-surface-variant">To move an order forward, open it and use the Next Step card — everything happens in one place.</p>
    </main>
  );
}
