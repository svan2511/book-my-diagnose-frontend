import { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, Field, GhostBtn, Modal, PageHeader, Pagination, PrimaryBtn, Skeleton, Stat, StatusBadge, TableShell, Td, fmtPhone, inputCls } from '../../components/admin/ui';

const EMPTY_FORM = { name: '', phone: '', role: 'collector', area: '', status: 'active' };

export default function Staff() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null); // null | {mode:'create'} | {mode:'edit', staff}
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const started = Date.now();
    try {
      const qs = new URLSearchParams({ per_page: '10', page: String(page) });
      if (search) qs.set('search', search);
      if (statusFilter) qs.set('status', statusFilter);
      const res = await api(`/admin/staff?${qs}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e.message || 'Failed to load staff.');
    } finally {
      const wait = Math.max(0, 450 - (Date.now() - started));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      setLoading(false);
      signalReady();
    }
  }, [api, search, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setSearch(draft.trim()); }, 450);
    return () => clearTimeout(t);
  }, [draft]);

  const clearFilters = () => { setDraft(''); setPage(1); setSearch(''); setStatusFilter(''); };
  const hasFilters = search !== '' || statusFilter !== '';
  const friendlyErr = (err) => (err?.status >= 500 ? 'Something went wrong. Please try again.' : err?.message || 'Something went wrong.');

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setFormErr(''); setModal({ mode: 'create' }); };
  const openEdit = (s) => {
    setForm({ name: s.name || '', phone: s.phone || '', role: s.role || 'collector', area: s.area || '', status: s.status || 'active' });
    setFormErr('');
    setModal({ mode: 'edit', staff: s });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.name.trim()) { setFormErr('Name is required.'); return; }
    if (!form.phone.trim()) { setFormErr('Phone number is required.'); return; }
    setBusy(true);
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim(), role: form.role, area: form.area.trim() || null, status: form.status };
      if (modal.mode === 'create') {
        await api('/admin/staff', { method: 'POST', body: payload });
        setMsg(`Collector ${payload.name} added.`);
      } else {
        await api(`/admin/staff/${modal.staff.id}`, { method: 'PATCH', body: payload });
        setMsg(`Collector ${payload.name} updated.`);
      }
      setModal(null);
      await load();
    } catch (err) {
      if (err?.status >= 500) setFormErr('Something went wrong. Please try again.');
      else {
        const errs = err.errors ? Object.values(err.errors).flat().join(' ') : '';
        setFormErr(`${err.message}${errs ? ` ${errs}` : ''}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const askDelete = (s) => {
    setConfirm({ id: s.id, title: `Remove "${s.name}"?`, lines: [`${s.active_assignments ?? 0} active pickups.`, 'Staff with active pickups cannot be removed — reassign first or deactivate instead.', 'This action cannot be undone.'] });
  };

  const confirmDelete = async () => {
    if (!confirm || confirmBusy) return;
    setConfirmBusy(true);
    setDeletingId(confirm.id);
    try {
      const res = await api(`/admin/staff/${confirm.id}`, { method: 'DELETE' });
      setMsg(res.message || 'Staff removed.');
      setConfirm(null);
      await load();
    } catch (e) {
      setMsg(friendlyErr(e));
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
      setDeletingId(null);
    }
  };

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onDuty = rows.filter((r) => (r.active_assignments ?? 0) > 0).length;

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader
        title="Collection Staff"
        actions={<PrimaryBtn onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add</span>New Collector</PrimaryBtn>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <Stat icon="group" label="Total Staff" value={meta?.total ?? '—'} grad="from-secondary to-sky-400" />
        <Stat icon="local_shipping" label="On Duty Now" value={onDuty} sub="Active pickups assigned" grad="from-teal-500 to-emerald-400" />
        <Stat icon="verified" label="Active" value={rows.filter((r) => r.status === 'active').length || '—'} sub="This page" grad="from-violet-500 to-purple-400" />
        <Stat icon="chat" label="Dispatch Mode" value="WhatsApp" sub="Location auto-shared" grad="from-emerald-500 to-teal-400" />
      </div>

      <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-3 flex flex-col xl:flex-row xl:items-center gap-2">
        <form className="flex items-center gap-2.5 pl-4 pr-2 h-12 rounded-2xl bg-surface-container-low border border-transparent focus-within:border-secondary/50 focus-within:shadow-lg focus-within:bg-surface-container-lowest transition-all flex-1 min-w-0" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(draft.trim()); }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search by name or phone…" className="bg-transparent outline-none w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline" aria-label="Search staff" />
          {draft && (
            <button type="button" onClick={clearFilters} aria-label="Clear search" className="w-7 h-7 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button type="submit" aria-label="Search" className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-sky-400 flex items-center justify-center shrink-0 shadow-sm hover:opacity-90 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-on-secondary text-[20px]">search</span>
          </button>
        </form>
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface outline-none cursor-pointer" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="px-3 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high whitespace-nowrap">Clear ✕</button>
          )}
        </div>
      </div>

      <ErrorBox message={error} onRetry={load} />
      {msg && <p role="status" className="rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-primary">{msg}</p>}

      {(search || statusFilter) && !loading && meta && (
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
          <strong className="text-primary">{meta.total}</strong> result{meta.total === 1 ? '' : 's'}
          {search && <> for <strong className="text-primary">“{search}”</strong></>}
        </p>
      )}

      {loading && rows.length === 0 ? <Skeleton lines={5} /> : !rows.length ? (
        <EmptyState
          icon="badge"
          title={hasFilters ? 'No matching staff' : 'No collectors yet'}
          sub={hasFilters ? 'Try a different name or phone.' : 'Add your first pickup collector to start dispatching.'}
          action={hasFilters ? <GhostBtn onClick={clearFilters}>Clear filters</GhostBtn> : <PrimaryBtn onClick={openCreate}>New Collector</PrimaryBtn>}
        />
      ) : (
        <>
          <div className={loading ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            {/* Desktop table — unchanged */}
            <div className="hidden md:block">
            <TableShell head={['Collector', 'Phone', 'Area', 'On Duty', 'Status', 'Actions']}>
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <Td>
                    <span className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </span>
                      <span className="font-semibold text-primary">{s.name}</span>
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap font-mono">{fmtPhone(s.phone)}</Td>
                  <Td>{s.area || '—'}</Td>
                  <Td>{(s.active_assignments ?? 0) > 0
                    ? <span className="inline-flex items-center gap-1 font-semibold text-amber-800"><span className="material-symbols-outlined text-[18px]">local_shipping</span>{s.active_assignments} pickup{(s.active_assignments ?? 0) === 1 ? '' : 's'}</span>
                    : <span className="text-on-surface-variant">Free</span>}</Td>
                  <Td><StatusBadge value={s.status || 'active'} /></Td>
                  <Td className="whitespace-nowrap">
                    <button type="button" onClick={() => openEdit(s)} className="px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high mr-1">Edit</button>
                    <span title={(s.active_assignments ?? 0) > 0 ? 'Cannot remove — active pickups assigned. Reassign first or deactivate instead.' : 'Remove staff'}>
                      <button type="button" onClick={() => askDelete(s)} disabled={deletingId === s.id || (s.active_assignments ?? 0) > 0} className="px-2.5 py-1.5 rounded-lg bg-error-container text-error font-label-sm text-label-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">{deletingId === s.id ? 'Removing…' : 'Remove'}</button>
                    </span>
                  </Td>
                </tr>
              ))}
            </TableShell>
            </div>
            {/* Mobile cards — pickup status always visible, no horizontal scroll */}
            <div className="md:hidden flex flex-col gap-3">
              {rows.map((s) => {
                const pickups = s.active_assignments ?? 0;
                const cantRemove = deletingId === s.id || pickups > 0;
                return (
                  <article key={s.id} className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-4 flex flex-col gap-3 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </span>
                        <span className="font-semibold text-primary truncate">{s.name}</span>
                      </span>
                      <StatusBadge value={s.status || 'active'} />
                    </div>
                    <div className="flex flex-col gap-1 font-body-md text-body-md text-on-surface min-w-0">
                      <p className="truncate"><span className="text-on-surface-variant">Phone: </span><span className="font-mono">{fmtPhone(s.phone)}</span></p>
                      <p className="truncate"><span className="text-on-surface-variant">Area: </span>{s.area || '—'}</p>
                    </div>
                    {pickups > 0
                      ? <p className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 font-label-md text-label-md font-semibold text-amber-800"><span className="material-symbols-outlined text-[18px] shrink-0">local_shipping</span>On Duty • {pickups} pickup{pickups === 1 ? '' : 's'}</p>
                      : <p className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 font-label-md text-label-md font-semibold text-emerald-700"><span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>Free • No active pickup</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => openEdit(s)} className="px-2.5 py-2 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high">Edit</button>
                      <span title={pickups > 0 ? 'Cannot remove — active pickups assigned. Reassign first or deactivate instead.' : 'Remove staff'}>
                        <button type="button" onClick={() => askDelete(s)} disabled={cantRemove} className="w-full px-2.5 py-2 rounded-lg bg-error-container text-error font-label-md text-label-md font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">{deletingId === s.id ? 'Removing…' : 'Remove'}</button>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          {loading && rows.length > 0 && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none" role="status" aria-label="Loading staff">
              <span className="w-12 h-12 rounded-full bg-surface-container-lowest shadow-xl border border-outline-variant/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] animate-spin text-secondary">progress_activity</span>
              </span>
            </div>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'New Collector' : `Edit ${modal?.staff?.name}`}>
        {formErr && <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-md text-body-md">{formErr}</div>}
        <form onSubmit={submitForm} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-secondary/10 to-sky-400/10 border border-secondary/20 px-4 py-3">
            <span className="w-11 h-11 rounded-full bg-gradient-to-br from-secondary to-sky-400 flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[22px] text-white">local_shipping</span>
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">Collectors do home pickups — dispatch sends the patient location to their WhatsApp.</p>
          </div>
          <div className="sm:col-span-2"><Field label="Full name" icon="person"><input value={form.name} onChange={(e) => setF('name', e.target.value)} className={inputCls} placeholder="e.g. Rajesh Sharma" required /></Field></div>
          <Field label="Mobile number" hint="10-digit Indian mobile — WhatsApp goes here" icon="call">
            <span className="flex items-center gap-2 w-full">
              <span className="font-mono font-label-md text-label-md text-secondary font-bold border-r border-outline-variant pr-2 shrink-0">+91</span>
              <input value={form.phone} onChange={(e) => setF('phone', e.target.value.replace(/\D+/g, '').slice(0, 10))} className={`${inputCls} font-mono`} placeholder="98XXXXXXXX" inputMode="numeric" maxLength={10} required />
            </span>
          </Field>
          <Field label="Area / Zone" hint="e.g. South Delhi" icon="location_on"><input value={form.area} onChange={(e) => setF('area', e.target.value)} className={inputCls} placeholder="Optional" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="font-label-lg text-label-lg text-primary">Role</span>
              <div className="flex p-1 rounded-xl bg-surface-container-low gap-1">
                {[['collector', 'Collector'], ['supervisor', 'Supervisor']].map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setF('role', v)} className={`flex-1 px-3 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all ${form.role === v ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-label-lg text-label-lg text-primary">Status</span>
              <div className="flex p-1 rounded-xl bg-surface-container-low gap-1">
                {[['active', 'Active'], ['inactive', 'Inactive']].map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setF('status', v)} className={`flex-1 px-3 py-2 rounded-lg font-label-md text-label-md font-semibold transition-all ${form.status === v ? (v === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-error-container text-error shadow-sm') : 'text-on-surface-variant hover:text-primary'}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" disabled={busy}>
              {busy && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              {busy ? 'Saving…' : modal?.mode === 'create' ? 'Add Collector' : 'Save'}
            </PrimaryBtn>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => !confirmBusy && setConfirm(null)} title={confirm?.title || 'Confirm remove'}>
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <span className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-error">delete</span>
          </span>
          {(confirm?.lines || []).map((l, i) => (
            <p key={i} className={i === 0 ? 'font-label-lg text-label-lg text-primary' : 'font-body-md text-body-md text-on-surface-variant'}>{l}</p>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <GhostBtn onClick={() => setConfirm(null)} disabled={confirmBusy}>Cancel</GhostBtn>
          <button type="button" onClick={confirmDelete} disabled={confirmBusy} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-error-container text-error font-label-md text-label-md font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60">
            {confirmBusy && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            {confirmBusy ? 'Removing…' : 'Yes, Remove'}
          </button>
        </div>
      </Modal>
    </main>
  );
}
