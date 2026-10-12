import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, PageHeader, Pagination, Skeleton, StatusBadge, TableShell, Td, fmtDate } from '../../components/admin/ui';

export default function Reports() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ per_page: '15', page: String(page) });
      if (search) qs.set('search', search);
      const res = await api(`/admin/reports?${qs}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
      signalReady();
    }
  }, [api, search, page]);

  useEffect(() => { load(); }, [load]);

  const share = async (r) => {
    setBusyId(r.id);
    setMsg('');
    try {
      const res = await api(`/admin/reports/${r.id}/share-whatsapp`, { method: 'POST' });
      window.open(res.data.url, '_blank', 'noopener');
      setMsg(`WhatsApp message prepared for ${res.data.phone}.`);
      await load();
    } catch (e) {
      setMsg(e.message || 'WhatsApp share failed.');
    } finally {
      setBusyId(null);
    }
  };

  const kb = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader title="Reports" sub={meta ? `${meta.total} uploaded` : 'Uploaded lab reports'} />
      <ErrorBox message={error} onRetry={load} />
      {msg && <p role="status" className="rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-primary">{msg}</p>}

      <form className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-lowest shadow-sm max-w-md" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(draft.trim()); }}>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Booking number or file name…" className="bg-transparent outline-none w-full font-body-md text-body-md placeholder:text-outline" aria-label="Search reports" />
      </form>

      {loading ? <Skeleton lines={6} /> : !rows.length ? (
        <EmptyState icon="description" title="No reports yet" sub="Upload a report from any booking detail page." />
      ) : (
        <>
          <TableShell head={['Booking', 'File', 'Status', 'Uploaded', 'Actions']}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-container-low/50">
                <Td className="font-mono font-semibold whitespace-nowrap">{r.booking_number}</Td>
                <Td>{r.file_name}<br /><span className="font-body-sm text-body-sm text-on-surface-variant">{kb(r.file_size)}</span></Td>
                <Td><StatusBadge value={r.status} /></Td>
                <Td className="whitespace-nowrap">{fmtDate(r.uploaded_at)}</Td>
                <Td className="whitespace-nowrap">
                  <a href={r.access_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high mr-1"><span className="material-symbols-outlined text-[15px]">visibility</span>View</a>
                  <button type="button" disabled={busyId === r.id} onClick={() => share(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-label-sm text-label-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"><span className="material-symbols-outlined text-[15px]">chat</span>{busyId === r.id ? '…' : 'WhatsApp'}</button>
                </Td>
              </tr>
            ))}
          </TableShell>
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
      <p className="font-body-sm text-body-sm text-on-surface-variant">Tip: uploads happen from a <Link to="/admin/bookings" className="text-secondary font-semibold hover:underline">booking detail</Link> page.</p>
    </main>
  );
}
