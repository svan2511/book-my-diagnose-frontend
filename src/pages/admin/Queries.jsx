import { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, Field, Modal, PageHeader, Pagination, PrimaryBtn, Skeleton, StatusBadge, TableShell, Td, fmtDate, inputCls } from '../../components/admin/ui';

const STATUSES = ['', 'new', 'in_progress', 'resolved', 'closed'];

export default function Queries() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: 'new', assigned_to: '', admin_notes: '' });
  const [saveErr, setSaveErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const started = Date.now();
    try {
      const qs = new URLSearchParams({ per_page: '15', page: String(page) });
      if (status) qs.set('status', status);
      const res = await api(`/admin/contact-queries?${qs}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e.message || 'Failed to load queries.');
    } finally {
      // Minimum visible loader (same as Staff/Customers) — shows on every filter.
      const wait = Math.max(0, 450 - (Date.now() - started));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      setLoading(false);
      signalReady();
    }
  }, [api, status, page]);

  useEffect(() => { load(); }, [load]);

  const open = (q) => {
    setSelected(q);
    setSaveErr('');
    setForm({ status: q.status, assigned_to: q.assigned_to || '', admin_notes: q.admin_notes || '' });
  };

  const closeModal = () => {
    setSelected(null);
    setSaveErr('');
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSaveErr('');
    try {
      await api(`/admin/contact-queries/${selected.id}`, { method: 'PATCH', body: { status: form.status, assigned_to: form.assigned_to || null, admin_notes: form.admin_notes || null } });
      setMsg('Query updated.');
      setSelected(null);
      await load();
    } catch (err) {
      // Stay on the modal so the failure is seen, not hidden behind it.
      setSaveErr(err.message || 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader title="Contact Queries" sub={meta ? `${meta.total} total` : 'Website enquiries'} />
      <ErrorBox message={error} onRetry={load} />
      {msg && <p role="status" className="rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-primary">{msg}</p>}

      <div className="flex items-center gap-2">
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="px-3 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm font-label-md text-label-md text-primary outline-none" aria-label="Filter by status">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
        </select>
      </div>

      {loading && rows.length === 0 ? <Skeleton lines={6} /> : !rows.length ? (
        <EmptyState icon="forum" title="No queries" sub="Messages from the Contact Us page will appear here." />
      ) : (
        <>
          <div className={loading ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'} aria-busy={loading}>
          <div className="hidden md:block">
          <TableShell head={['Name', 'Subject', 'Status', 'Received', '']}>
            {rows.map((q) => (
              <tr key={q.id} className="hover:bg-surface-container-low/50">
                <Td>{q.name}<br /><span className="font-body-sm text-body-sm text-on-surface-variant">{q.phone} • {q.email}</span></Td>
                <Td className="max-w-[260px] truncate">{q.subject}</Td>
                <Td><StatusBadge value={q.status} /></Td>
                <Td className="whitespace-nowrap">{fmtDate(q.created_at)}</Td>
                <Td><button type="button" onClick={() => open(q)} className="px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high">View</button></Td>
              </tr>
            ))}
          </TableShell>
          </div>
          {/* Mobile cards — no horizontal scroll */}
          <div className="md:hidden flex flex-col gap-3">
            {rows.map((q) => (
              <article key={q.id} className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-4 flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{q.name}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{q.phone} • {q.email}</p>
                  </div>
                  <span className="shrink-0"><StatusBadge value={q.status} /></span>
                </div>
                <p className="font-body-md text-body-md text-on-surface line-clamp-2">{q.subject}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{fmtDate(q.created_at)}</span>
                  <button type="button" onClick={() => open(q)} className="px-4 py-2 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high">View</button>
                </div>
              </article>
            ))}
          </div>
          </div>
          {loading && rows.length > 0 && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none" role="status" aria-label="Loading queries">
              <span className="w-12 h-12 rounded-full bg-surface-container-lowest shadow-xl border border-outline-variant/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] animate-spin text-secondary">progress_activity</span>
              </span>
            </div>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={closeModal} title={selected?.subject || 'Query'} wide>
        {selected && (
          <div className="flex flex-col gap-3">
            {saveErr && (
              <div role="alert" className="flex items-start gap-2 rounded-lg bg-error-container text-on-error-container px-3 py-2.5 font-body-md text-body-md">
                <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                <span>{saveErr}</span>
              </div>
            )}
            <p className="font-body-md text-body-md text-on-surface"><strong>{selected.name}</strong> • {selected.phone} • {selected.email}</p>
            <p className="rounded-xl bg-surface-container-low p-4 font-body-md text-body-md whitespace-pre-wrap">{selected.message}</p>
            <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${inputCls} cursor-pointer`}>
                  {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
              <Field label="Assign to"><input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={inputCls} placeholder="Staff name" /></Field>
              <div className="sm:col-span-2"><Field label="Internal notes"><textarea value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} className={`${inputCls} resize-y`} rows={3} /></Field></div>
              <div className="sm:col-span-2 flex justify-end"><PrimaryBtn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</PrimaryBtn></div>
            </form>
          </div>
        )}
      </Modal>
    </main>
  );
}
