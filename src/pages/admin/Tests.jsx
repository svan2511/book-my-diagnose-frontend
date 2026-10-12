import { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { EmptyState, ErrorBox, Field, GhostBtn, Modal, PageHeader, Pagination, PrimaryBtn, Skeleton, Stat, StatusBadge, TableShell, Td, fmtINR, inputCls } from '../../components/admin/ui';

const EMPTY_FORM = {
  name: '', code: '', category_id: '', description: '', preparation_instructions: '',
  sample_type: 'Blood', price: '', mrp: '', turnaround_hours: 24, parameter_count: 1,
  home_collection_available: true, status: 'active', is_nabl: false, is_outsourced: false,
};

const fmtTAT = (h) => {
  const n = Number(h || 0);
  if (n >= 168 && n % 168 === 0) return `${n / 168} wk`;
  if (n >= 24 && n % 24 === 0) return `${n / 24} day${n === 24 ? '' : 's'}`;
  return `${n}h`;
};

export default function Tests() {
  const api = useAdminApi();
  const signalReady = usePageReady();
  const [tab, setTab] = useState('tests');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null); // null | {mode:'create'} | {mode:'edit', test}
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catModal, setCatModal] = useState(null); // null | {mode:'edit', cat}
  const [catForm, setCatForm] = useState({ name: '', description: '', status: 'active' });
  const [catErr, setCatErr] = useState('');
  const [catBusy, setCatBusy] = useState(false);
  const [catCreating, setCatCreating] = useState(false);
  const [catDeletingId, setCatDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [testDeletingId, setTestDeletingId] = useState(null);
  const [confirm, setConfirm] = useState(null); // null | {kind:'cat'|'test', id, title, lines[]}
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [catPage, setCatPage] = useState(1);
  const CATS_PER_PAGE = 8;
  const [catsLoading, setCatsLoading] = useState(false); // list refresh indicator

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const started = Date.now();
    try {
      const qs = new URLSearchParams({ per_page: '10', page: String(page) });
      if (search) qs.set('search', search);
      if (statusFilter) qs.set('status', statusFilter);
      if (catFilter) qs.set('category_id', catFilter);
      const [t, c] = await Promise.all([
        api(`/admin/tests?${qs}`),
        api('/admin/test-categories'),
      ]);
      setRows(t.data);
      setMeta(t.meta);
      setCats(c.data);
    } catch (e) {
      setError(e.message || 'Failed to load tests.');
    } finally {
      // Guarantee a perceptible loader — local API answers too fast to notice.
      const wait = Math.max(0, 600 - (Date.now() - started));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      setLoading(false);
      signalReady();
    }
  }, [api, search, page, statusFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  // Live search: typing auto-applies after a short pause (Enter works too).
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setSearch(draft.trim()); }, 450);
    return () => clearTimeout(t);
  }, [draft]);

  const clearAllFilters = () => {
    setDraft('');
    setPage(1);
    setSearch('');
    setStatusFilter('');
    setCatFilter('');
  };
  const hasFilters = search !== '' || statusFilter !== '' || catFilter !== '';

  const reloadCats = async () => {
    setCatsLoading(true);
    try {
      await load();
    } finally {
      setCatsLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, category_id: cats[0]?.id || '' });
    setFormErr('');
    setModal({ mode: 'create' });
  };

  const openEdit = (t) => {
    setForm({
      name: t.name, code: t.code, category_id: t.category?.id || cats.find((c) => c.name === t.category?.name)?.id || '',
      description: t.description || '', preparation_instructions: t.preparation_instructions || '',
      sample_type: t.sample_type || 'Blood', price: t.price, mrp: t.mrp || '',
      turnaround_hours: t.turnaround_hours, parameter_count: t.parameter_count,
      home_collection_available: t.home_collection_available, status: t.status || 'active',
      is_nabl: !!t.is_nabl, is_outsourced: !!t.is_outsourced,
    });
    setFormErr('');
    setModal({ mode: 'edit', test: t });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormErr('');
    setBusy(true);
    try {
      if (modal.mode === 'create') {
        const payload = {
          ...form,
          price: Number(form.price),
          mrp: form.mrp === '' ? null : Number(form.mrp),
          turnaround_hours: Number(form.turnaround_hours) || 24,
          parameter_count: Number(form.parameter_count) || 1,
          code: String(form.code).toUpperCase(),
        };
        await api('/admin/tests', { method: 'POST', body: payload });
        setMsg('Test created successfully.');
      } else {
        // Partial update: send only fields the admin actually changed.
        const orig = modal.test;
        const numOrNull = (v) => (v === '' || v == null ? null : Number(v));
        const norm = {
          name: String(form.name || ''),
          code: String(form.code || '').toUpperCase(),
          category_id: form.category_id || '',
          description: form.description || '',
          preparation_instructions: form.preparation_instructions || '',
          sample_type: form.sample_type || '',
          price: Number(form.price),
          mrp: numOrNull(form.mrp),
          turnaround_hours: Number(form.turnaround_hours) || 24,
          parameter_count: Number(form.parameter_count) || 1,
          home_collection_available: !!form.home_collection_available,
          status: form.status || 'active',
          is_nabl: !!form.is_nabl,
          is_outsourced: !!form.is_outsourced,
        };
        const base = {
          name: orig.name || '',
          code: orig.code || '',
          category_id: orig.category?.id || cats.find((c) => c.name === orig.category?.name)?.id || '',
          description: orig.description || '',
          preparation_instructions: orig.preparation_instructions || '',
          sample_type: orig.sample_type || '',
          price: Number(orig.price),
          mrp: numOrNull(orig.mrp),
          turnaround_hours: Number(orig.turnaround_hours) || 24,
          parameter_count: Number(orig.parameter_count) || 1,
          home_collection_available: !!orig.home_collection_available,
          status: orig.status || 'active',
          is_nabl: !!orig.is_nabl,
          is_outsourced: !!orig.is_outsourced,
        };
        const payload = {};
        for (const k of Object.keys(norm)) {
          if (norm[k] !== base[k]) payload[k] = norm[k];
        }
        if (Object.keys(payload).length === 0) {
          setModal(null);
          setMsg('No changes to save.');
          return;
        }
        await api(`/admin/tests/${orig.id}`, { method: 'PATCH', body: payload });
        setMsg('Test updated successfully.');
      }
      setModal(null);
      await load();
    } catch (err) {
      const errs = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setFormErr(`${err.message}${errs ? ` ${errs}` : ''}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (t) => {
    if (togglingId) return;
    const to = t.status === 'inactive' ? 'active' : 'inactive';
    setTogglingId(t.id);
    try {
      await api(`/admin/tests/${t.id}/status`, { method: 'PATCH' });
      setMsg(`Test ${t.code} ${to === 'active' ? 'activated' : 'deactivated'}.`);
      await load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const remove = (t) => {
    setConfirm({
      kind: 'test', id: t.id, title: `Delete ${t.code}?`,
      lines: [`"${t.name}"`, 'Tests with bookings get deactivated instead of deleted.'],
    });
  };

  const createCat = async (e) => {
    e.preventDefault();
    if (!catName.trim() || catCreating) return;
    setCatCreating(true);
    try {
      await api('/admin/test-categories', { method: 'POST', body: { name: catName.trim(), description: catDesc.trim() || null } });
      setCatName('');
      setCatDesc('');
      setMsg('Category created.');
      setCatPage(1);
      await reloadCats();
    } catch (err) {
      setMsg(friendlyErr(err));
    } finally {
      setCatCreating(false);
    }
  };

  const openCatEdit = (c) => {
    setCatForm({ name: c.name || '', description: c.description || '', status: c.status || 'active' });
    setCatErr('');
    setCatModal({ mode: 'edit', cat: c });
  };

  const submitCatEdit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      setCatErr('Category name is required.');
      return;
    }
    setCatErr('');
    setCatBusy(true);
    try {
      await api(`/admin/test-categories/${catModal.cat.id}`, {
        method: 'PATCH',
        body: { name: catForm.name.trim(), description: catForm.description.trim() || null, status: catForm.status },
      });
      setCatModal(null);
      setMsg(`Category "${catForm.name.trim()}" updated.`);
      await reloadCats();
    } catch (err) {
      if (err?.status >= 500) {
        setCatErr('Something went wrong. Please try again.');
      } else {
        const errs = err.errors ? Object.values(err.errors).flat().join(' ') : '';
        setCatErr(`${err.message}${errs ? ` ${errs}` : ''}`);
      }
    } finally {
      setCatBusy(false);
    }
  };

  const deleteCat = (c) => {
    setConfirm({
      kind: 'cat', id: c.id, title: `Delete "${c.name}"?`,
      lines: ['This action cannot be undone.'],
    });
  };

  const confirmDelete = async () => {
    if (!confirm || confirmBusy) return;
    setConfirmBusy(true);
    if (confirm.kind === 'cat') setCatDeletingId(confirm.id);
    else setTestDeletingId(confirm.id);
    try {
      const res = await api(
        confirm.kind === 'cat' ? `/admin/test-categories/${confirm.id}` : `/admin/tests/${confirm.id}`,
        { method: 'DELETE' },
      );
      setMsg(res.message || 'Deleted successfully.');
      setConfirm(null);
      await reloadCats();
    } catch (e) {
      setMsg(friendlyErr(e));
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
      setCatDeletingId(null);
      setTestDeletingId(null);
    }
  };

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Never show raw server errors (SQL etc.) — 5xx always gets a friendly line.
  const friendlyErr = (err) => (err?.status >= 500 ? 'Something went wrong. Please try again.' : err?.message || 'Something went wrong.');

  const catTotalPages = Math.max(1, Math.ceil(cats.length / CATS_PER_PAGE));
  const safeCatPage = Math.min(catPage, catTotalPages);
  const catVisible = cats.slice((safeCatPage - 1) * CATS_PER_PAGE, safeCatPage * CATS_PER_PAGE);
  const catMeta = { current_page: safeCatPage, per_page: CATS_PER_PAGE, total: cats.length, last_page: catTotalPages };

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader
        title="Tests"
        actions={tab === 'tests' ? <PrimaryBtn onClick={openCreate}><span className="material-symbols-outlined text-[18px]">add</span>New Test</PrimaryBtn> : null}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <Stat icon="science" label="Total Tests" value={meta?.total ?? cats.reduce((n, c) => n + (c.tests_count ?? 0), 0) ?? '—'} grad="from-secondary to-sky-400" />
        <Stat icon="category" label="Categories" value={cats.length || '—'} grad="from-teal-500 to-emerald-400" />
        <Stat icon="package_2" label="Packages & Profiles" value={cats.find((c) => c.slug === 'health-packages-profiles')?.tests_count ?? '—'} grad="from-violet-500 to-purple-400" />
        <Stat icon="pending_actions" label="Unclassified" value={cats.find((c) => c.slug === 'rate-list-2022')?.tests_count ?? '—'} sub="Rate List 2022 bucket" grad="from-amber-500 to-orange-400" />
      </div>
      <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl shadow-sm w-fit">
        {[['tests', 'Tests'], ['categories', 'Categories']].map(([v, label]) => (
          <button key={v} type="button" onClick={() => setTab(v)} className={`px-4 py-2 rounded-lg font-label-md text-label-md ${tab === v ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant'}`}>{label}</button>
        ))}
      </div>
      <ErrorBox message={error} onRetry={load} />
      {msg && <p role="status" className="rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-primary">{msg}</p>}

      {tab === 'tests' && (
        <>
          <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-3 flex flex-col xl:flex-row xl:items-center gap-2">
            <form className="flex items-center gap-2.5 pl-4 pr-2 h-12 rounded-2xl bg-surface-container-low border border-transparent focus-within:border-secondary/50 focus-within:shadow-lg focus-within:bg-surface-container-lowest transition-all flex-1 min-w-0" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(draft.trim()); }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search by test name or code…" className="bg-transparent outline-none w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline" aria-label="Search tests" />
              {draft && (
                <button type="button" onClick={clearAllFilters} aria-label="Clear search" className="w-7 h-7 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
              <button type="submit" aria-label="Search" className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-sky-400 flex items-center justify-center shrink-0 shadow-sm hover:opacity-90 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-on-secondary text-[20px]">search</span>
              </button>
            </form>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface outline-none cursor-pointer" aria-label="Filter by category">
                <option value="">All Categories</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.tests_count ?? 0})</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface outline-none cursor-pointer" aria-label="Filter by status">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {hasFilters && (
                <button type="button" onClick={clearAllFilters} className="px-3 py-2.5 rounded-xl bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high whitespace-nowrap">Clear ✕</button>
              )}
            </div>
          </div>
          {(search || statusFilter || catFilter) && !loading && meta && (
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-1">
              <strong className="text-primary">{meta.total}</strong> result{meta.total === 1 ? '' : 's'}
              {search && <> for <strong className="text-primary">“{search}”</strong></>}
            </p>
          )}
          {loading && rows.length === 0 ? <Skeleton lines={6} /> : !rows.length ? (
            <EmptyState
              icon="search_off"
              title={hasFilters ? 'No matching tests' : 'No tests found'}
              sub={hasFilters ? 'Try a different name, code or clear the filters.' : 'Create your first test to start taking bookings.'}
              action={hasFilters ? <GhostBtn onClick={clearAllFilters}>Clear filters</GhostBtn> : <PrimaryBtn onClick={openCreate}>New Test</PrimaryBtn>}
            />
          ) : (
            <>
              <div className={loading ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'} aria-busy={loading}>
                <TableShell head={['Code', 'Test', 'Category', 'Price', 'TAT', 'Home', 'Status', 'Actions']}>
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <Td className="whitespace-nowrap"><span className="inline-block px-2 py-0.5 rounded-md bg-surface-container-low font-mono font-semibold">{t.code}</span></Td>
                    <Td>
                      <span className="font-semibold text-primary line-clamp-2" title={t.name}>{t.name}</span>
                      {(t.is_nabl || t.is_outsourced) && (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {t.is_nabl && <span className="px-1.5 py-px rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-label-sm text-[10px] font-semibold">NABL</span>}
                          {t.is_outsourced && <span className="px-1.5 py-px rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-label-sm text-[10px] font-semibold">Outsourced</span>}
                        </span>
                      )}
                    </Td>
                    <Td><span className="inline-block px-2 py-0.5 rounded-full bg-surface-container font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">{t.category?.name || '—'}</span></Td>
                    <Td className="whitespace-nowrap"><span className="font-semibold text-primary">{fmtINR(t.price)}</span>{t.mrp && Number(t.mrp) > Number(t.price) ? <><br /><span className="font-body-sm text-body-sm text-outline line-through">{fmtINR(t.mrp)}</span></> : null}</Td>
                    <Td className="whitespace-nowrap"><span className="inline-flex items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined text-[16px]">schedule</span>{fmtTAT(t.turnaround_hours)}</span></Td>
                    <Td>{t.home_collection_available
                      ? <span className="inline-flex items-center gap-1 text-teal-700 font-semibold"><span className="material-symbols-outlined text-[18px]">check_circle</span>Yes</span>
                      : <span className="inline-flex items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">cancel</span>No</span>}</Td>
                    <Td><StatusBadge value={t.status || 'active'} /></Td>
                    <Td className="whitespace-nowrap">
                      <button type="button" onClick={() => openEdit(t)} className="px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high mr-1">Edit</button>
                      <button type="button" onClick={() => toggleStatus(t)} disabled={togglingId === t.id} title={t.status === 'inactive' ? 'Make this test bookable again' : 'Hide this test from booking (keeps history)'} className="px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high mr-1 disabled:opacity-60">{togglingId === t.id ? (<span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>…</span>) : (t.status === 'inactive' ? 'Activate' : 'Deactivate')}</button>
                      <button type="button" onClick={() => remove(t)} disabled={testDeletingId === t.id} className="px-2.5 py-1.5 rounded-lg bg-error-container text-error font-label-sm text-label-sm font-semibold hover:opacity-90 disabled:opacity-60">{testDeletingId === t.id ? 'Deleting…' : 'Delete'}</button>
                    </Td>
                  </tr>
                ))}
                </TableShell>
              </div>
              {loading && rows.length > 0 && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none" role="status" aria-label="Loading tests">
                  <span className="w-12 h-12 rounded-full bg-surface-container-lowest shadow-xl border border-outline-variant/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px] animate-spin text-secondary">progress_activity</span>
                  </span>
                </div>
              )}
              <Pagination meta={meta} onPage={setPage} />
            </>
          )}
        </>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
          <form onSubmit={createCat} className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm h-fit">
            <h2 className="font-headline-sm text-headline-sm text-primary">New Category</h2>
            <Field label="Name"><input value={catName} onChange={(e) => setCatName(e.target.value)} className={inputCls} placeholder="e.g. Allergy Panels" required /></Field>
            <Field label="Description"><input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className={inputCls} placeholder="Optional" /></Field>
            <PrimaryBtn type="submit" disabled={catCreating}>
              {catCreating && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              {catCreating ? 'Creating…' : 'Create Category'}
            </PrimaryBtn>
          </form>
          <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-primary">All Categories ({cats.length})</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Rename or deactivate anytime. A category with tests can't be deleted — reassign its tests (Tests tab → Edit) or deactivate it first.</p>
            <div className="relative" aria-busy={catsLoading}>
              <div className={catsLoading ? 'flex flex-col gap-space-sm opacity-40 pointer-events-none' : 'flex flex-col gap-space-sm'}>
              {loading && cats.length === 0 ? <Skeleton lines={4} /> : catVisible.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-surface-container last:border-0">
                <div><p className="font-label-md text-label-md text-primary">{c.name}</p><p className="font-mono font-body-sm text-body-sm text-on-surface-variant">{c.slug} • {c.tests_count ?? ''} tests</p></div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusBadge value={c.status || 'active'} />
                  <button type="button" onClick={() => openCatEdit(c)} className="px-2.5 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high">Edit</button>
                  <span title={(c.tests_count ?? 0) > 0 ? 'Cannot delete — this category has tests. Reassign them first or deactivate instead.' : 'Delete category'}>
                    <button type="button" onClick={() => deleteCat(c)} disabled={catDeletingId === c.id || (c.tests_count ?? 0) > 0} className="px-2.5 py-1.5 rounded-lg bg-error-container text-error font-label-sm text-label-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">{catDeletingId === c.id ? 'Deleting…' : 'Delete'}</button>
                  </span>
                </div>
              </div>
              ))}
              </div>
              {catsLoading && (
                <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading categories">
                  <span className="w-11 h-11 rounded-full bg-surface-container-lowest shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px] animate-spin text-secondary">progress_activity</span>
                  </span>
                </div>
              )}
            </div>
            <Pagination meta={catMeta} onPage={setCatPage} />
          </div>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'New Test' : `Edit ${modal?.test?.code}`} wide>
        {formErr && <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-md text-body-md">{formErr}</div>}
        <form onSubmit={submitForm} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Test name" icon="science"><input value={form.name} onChange={(e) => setF('name', e.target.value)} className={inputCls} required /></Field>
          <Field label="Test code" hint="Unique, uppercase letters/numbers"><input value={form.code} onChange={(e) => setF('code', e.target.value.toUpperCase())} className={`${inputCls} font-mono`} required /></Field>
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => setF('category_id', e.target.value)} className={`${inputCls} cursor-pointer`} required>
              <option value="">Select…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Sample type"><input value={form.sample_type} onChange={(e) => setF('sample_type', e.target.value)} className={inputCls} /></Field>
          <Field label="Price (₹)"><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setF('price', e.target.value)} className={inputCls} required /></Field>
          <Field label="MRP (₹, optional)"><input type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => setF('mrp', e.target.value)} className={inputCls} /></Field>
          <Field label="Turnaround (hours)"><input type="number" min="1" value={form.turnaround_hours} onChange={(e) => setF('turnaround_hours', e.target.value)} className={inputCls} /></Field>
          <Field label="Parameters"><input type="number" min="1" value={form.parameter_count} onChange={(e) => setF('parameter_count', e.target.value)} className={inputCls} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setF('status', e.target.value)} className={`${inputCls} cursor-pointer`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea value={form.description} onChange={(e) => setF('description', e.target.value)} className={`${inputCls} resize-y`} rows={2} /></Field></div>
          <div className="sm:col-span-2"><Field label="Preparation instructions"><textarea value={form.preparation_instructions} onChange={(e) => setF('preparation_instructions', e.target.value)} className={`${inputCls} resize-y`} rows={2} /></Field></div>
          <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface cursor-pointer">
            <input type="checkbox" checked={!!form.home_collection_available} onChange={(e) => setF('home_collection_available', e.target.checked)} className="w-4 h-4 accent-secondary" />Home collection available
          </label>
          <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface cursor-pointer" title="Covered under the lab's NABL accreditation scope (* in rate list)">
            <input type="checkbox" checked={!!form.is_nabl} onChange={(e) => setF('is_nabl', e.target.checked)} className="w-4 h-4 accent-secondary" />NABL accredited
          </label>
          <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface cursor-pointer" title="Sample is sent to an outside lab for testing (# in rate list)">
            <input type="checkbox" checked={!!form.is_outsourced} onChange={(e) => setF('is_outsourced', e.target.checked)} className="w-4 h-4 accent-secondary" />Outsourced test
          </label>
          <div className="flex justify-end gap-2 sm:col-span-1">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" disabled={busy}>{busy ? 'Saving…' : modal?.mode === 'create' ? 'Create' : 'Save'}</PrimaryBtn>
          </div>
        </form>
      </Modal>

      <Modal open={!!catModal} onClose={() => setCatModal(null)} title={`Edit ${catModal?.cat?.name || 'Category'}`}>
        {catErr && <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-md text-body-md">{catErr}</div>}
        <form onSubmit={submitCatEdit} className="grid grid-cols-1 gap-3">
          <Field label="Category name"><input value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} required /></Field>
          <Field label="Description"><input value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Optional" /></Field>
          <Field label="Status">
            <select value={catForm.status} onChange={(e) => setCatForm((f) => ({ ...f, status: e.target.value }))} className={`${inputCls} cursor-pointer`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setCatModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" disabled={catBusy}>
              {catBusy && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              {catBusy ? 'Saving…' : 'Save'}
            </PrimaryBtn>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => !confirmBusy && setConfirm(null)} title={confirm?.title || 'Confirm delete'}>
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
          <button
            type="button"
            onClick={confirmDelete}
            disabled={confirmBusy}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-error-container text-error font-label-md text-label-md font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {confirmBusy && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            {confirmBusy ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </Modal>
    </main>
  );
}
