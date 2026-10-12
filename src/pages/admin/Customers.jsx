import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, GhostBtn, PageHeader, Pagination, Skeleton, TableShell, Td, fmtDate, fmtPhone } from '../../components/admin/ui';

export default function Customers() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const started = Date.now();
    try {
      const qs = new URLSearchParams({ per_page: '15', page: String(page) });
      if (search) qs.set('search', search);
      const res = await api(`/admin/customers?${qs}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e.message || 'Failed to load customers.');
    } finally {
      // Minimum visible loader (same as Staff page) — fast local responses
      // must not skip the loading state, it must show on every search.
      const wait = Math.max(0, 450 - (Date.now() - started));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      setLoading(false);
      signalReady();
    }
  }, [api, search, page]);

  useEffect(() => { load(); }, [load]);

  // Live search — filter shortly after typing stops (same as Staff page).
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setSearch(draft.trim()); }, 450);
    return () => clearTimeout(t);
  }, [draft]);

  const clearFilters = () => { setDraft(''); setPage(1); setSearch(''); };
  const hasFilters = search !== '';

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader title="Customers" sub={meta ? `${meta.total} total` : 'Patient accounts (auto-created at booking)'} />
      <ErrorBox message={error} onRetry={load} />

      <form className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm max-w-md" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(draft.trim()); }}>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Name, phone or email…" className="bg-transparent outline-none w-full font-body-md text-body-md placeholder:text-outline" aria-label="Search customers" />
        {draft.trim() !== search && (
          <span className="material-symbols-outlined text-secondary text-[20px] animate-spin shrink-0" role="status" aria-label="Typing">progress_activity</span>
        )}
      </form>

      {(search) && !loading && meta && (
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
          <strong className="text-primary">{meta.total}</strong> result{meta.total === 1 ? '' : 's'}
          <> for <strong className="text-primary">“{search}”</strong></>
          <button type="button" onClick={clearFilters} className="ml-2 text-secondary font-semibold hover:underline">Clear</button>
        </p>
      )}

      {loading && rows.length === 0 ? <Skeleton lines={6} /> : !rows.length ? (
        <EmptyState
          icon="group"
          title={hasFilters ? 'No matching customers' : 'No customers yet'}
          sub={hasFilters ? 'Try a different name, phone or email.' : 'Customers are created automatically when a booking is made.'}
          action={hasFilters ? <GhostBtn onClick={clearFilters}>Clear search</GhostBtn> : null}
        />
      ) : (
        <>
          <div className={loading ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'} aria-busy={loading}>
          <div className="hidden md:block">
          <TableShell head={['Customer', 'Phone', 'Bookings', 'Since']}>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container-low/50">
                <Td><Link to={`/admin/customers/${c.id}`} className="font-semibold text-secondary hover:underline">{c.name}</Link><br /><span className="font-body-sm text-body-sm text-on-surface-variant">{c.email || '—'}</span></Td>
                <Td className="font-mono whitespace-nowrap">{fmtPhone(c.phone)}</Td>
                <Td><strong className="text-primary">{c.total_bookings ?? 0}</strong></Td>
                <Td className="whitespace-nowrap">{fmtDate(c.created_at, false)}</Td>
              </tr>
            ))}
          </TableShell>
          </div>
          {/* Mobile cards — no horizontal scroll */}
          <div className="md:hidden flex flex-col gap-3">
            {rows.map((c) => (
              <article key={c.id} className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-4 flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/admin/customers/${c.id}`} className="font-semibold text-secondary truncate">{c.name}</Link>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-bold whitespace-nowrap shrink-0"><span className="material-symbols-outlined text-[14px]">receipt_long</span>{c.total_bookings ?? 0} bookings</span>
                </div>
                <div className="flex flex-col gap-1 font-body-md text-body-md min-w-0">
                  <p className="truncate"><span className="text-on-surface-variant">Phone: </span><span className="font-mono">{fmtPhone(c.phone)}</span></p>
                  <p className="truncate"><span className="text-on-surface-variant">Email: </span>{c.email || '—'}</p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Customer since {fmtDate(c.created_at, false)}</p>
              </article>
            ))}
          </div>
          </div>
          {loading && rows.length > 0 && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none" role="status" aria-label="Loading customers">
              <span className="w-12 h-12 rounded-full bg-surface-container-lowest shadow-xl border border-outline-variant/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] animate-spin text-secondary">progress_activity</span>
              </span>
            </div>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </main>
  );
}
