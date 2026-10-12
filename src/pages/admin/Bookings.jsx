import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, PageHeader, Pagination, Skeleton, StatusBadge, TableShell, Td, fmtDate, fmtINR } from '../../components/admin/ui';

const STATUSES = ['', 'pending', 'confirmed', 'collection_assigned', 'sample_collected', 'testing_in_progress', 'report_ready', 'completed', 'cancelled'];

export default function Bookings() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = params.get('search') || '';
  const status = params.get('status') || '';
  const page = Number(params.get('page') || 1);

  const [draft, setDraft] = useState(search);
  const [firstLoad, setFirstLoad] = useState(true);
  const reqId = useRef(0);
  useEffect(() => setDraft(search), [search]);

  // Live search — filter 500ms after the user stops typing.
  useEffect(() => {
    if (draft.trim() === search) return;
    const t = setTimeout(() => set({ search: draft.trim() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    const started = Date.now();
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ per_page: '15', page: String(page) });
      if (search) qs.set('search', search);
      if (status) qs.set('status', status);
      const res = await api(`/admin/bookings?${qs}`);
      if (id !== reqId.current) return; // a newer request is in flight
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e.message || 'Failed to load bookings.');
    } finally {
      if (id !== reqId.current) return;
      // Minimum visible time — local API replies in ms, else the loader
      // would flash invisibly fast.
      await new Promise((r) => setTimeout(r, Math.max(0, 450 - (Date.now() - started))));
      if (id !== reqId.current) return;
      setLoading(false);
      setFirstLoad(false);
      signalReady();
    }
  }, [api, search, status, page]);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (patch.search !== undefined || patch.status !== undefined) next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader title="Bookings" sub={meta ? `${meta.total} total` : 'Manage test bookings end-to-end'} />
      <ErrorBox message={error} onRetry={load} />

      <div className="flex flex-col md:flex-row gap-2">
        <form
          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm"
          onSubmit={(e) => { e.preventDefault(); set({ search: draft.trim() }); }}
        >
          {loading && !firstLoad
            ? <span className="material-symbols-outlined text-secondary text-[20px] animate-spin">refresh</span>
            : <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Booking ID, patient name or phone…"
            className="bg-transparent outline-none w-full font-body-md text-body-md text-on-surface placeholder:text-outline"
            aria-label="Search bookings"
          />
          {draft && <button type="button" onClick={() => { setDraft(''); set({ search: '' }); }} className="text-on-surface-variant hover:text-primary" aria-label="Clear search"><span className="material-symbols-outlined text-[18px]">close</span></button>}
        </form>
        <select value={status} onChange={(e) => set({ status: e.target.value })} className="px-3 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm font-label-md text-label-md text-primary outline-none" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
          ))}
        </select>
      </div>

      {firstLoad && loading ? <Skeleton lines={6} /> : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest/60">
              <span className="material-symbols-outlined text-[22px] text-secondary animate-spin">refresh</span>
              <span className="font-label-md text-label-md text-primary">Searching…</span>
            </div>
          )}
          <div className={`transition-opacity ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
            {!rows.length ? (
              <EmptyState
                icon="receipt_long" title="No bookings found" sub="Try a different search or clear the filters."
                action={(search || status) && <button type="button" onClick={() => { setDraft(''); set({ search: '', status: '' }); }} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md">Clear filters</button>}
              />
            ) : (
              <>
                <TableShell head={['Booking', 'Patient', 'Tests', 'Collection', 'Status', 'Amount', 'Booked']}>
                  {rows.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <Td><Link to={`/admin/bookings/${b.id}`} className="font-mono font-semibold text-secondary hover:underline whitespace-nowrap">{b.booking_number}</Link></Td>
                      <Td>{b.patient?.name}<br /><span className="font-body-sm text-body-sm text-on-surface-variant">{b.patient?.phone}</span></Td>
                      <Td className="max-w-[200px] truncate">{(b.tests || []).map((t) => t.code).join(', ')}</Td>
                      <Td><StatusBadge value={b.collection_status || 'pending'} /></Td>
                      <Td><StatusBadge value={b.status} /></Td>
                      <Td className="font-semibold whitespace-nowrap">{fmtINR(b.total)}</Td>
                      <Td className="whitespace-nowrap">{fmtDate(b.created_at)}</Td>
                    </tr>
                  ))}
                </TableShell>
                <div className="mt-3">
                  <Pagination meta={meta} onPage={(p) => set({ page: String(p) })} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
