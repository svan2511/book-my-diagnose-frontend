import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import { usePageReady } from '../hooks/usePageReady';
import { Pagination } from '../components/admin/ui';

const SORTS = [
  ['-created_at', 'Most Popular'],
  ['price', 'Price: Low to High'],
  ['-price', 'Price: High to Low'],
  ['turnaround_hours', 'Fastest Report'],
  ['name', 'A to Z'],
];

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Request failed.');
  return data;
}

export default function Tests() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const signalReady = usePageReady();

  const [cats, setCats] = useState([]);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const loadReq = useRef(0);

  const q = params.get('q') || '';
  const cat = params.get('cat') || '';
  const sort = params.get('sort') || '-created_at';
  const maxPrice = Number(params.get('max') || 4999);
  const page = Number(params.get('page') || 1);
  const [draft, setDraft] = useState(q);

  useEffect(() => setDraft(q), [q]);

  // Mobile-only: shorter search placeholder so it never clips (desktop keeps full text).
  const FULL_PH = 'Search by test name or code (CBC, TSH, LFT)…';
  const SHORT_PH = 'Search tests by name or code…';
  const [ph, setPh] = useState(FULL_PH);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const upd = () => setPh(mq.matches ? SHORT_PH : FULL_PH);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  // Live search — filter half a second after typing stops.
  useEffect(() => {
    if (draft.trim() === q) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (draft.trim()) next.set('q', draft.trim());
      else next.delete('q');
      next.delete('page');
      setParams(next, { replace: true });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    getJSON('/test-categories').then((d) => setCats(d.data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    // Slider drags fire rapid requests — only the latest reply may paint,
    // otherwise a slow older reply overwrites fresh filtered results.
    const my = ++loadReq.current;
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ per_page: '12', page: String(page), sort });
      if (q) qs.set('search', q);
      if (cat) qs.set('category_slug', cat);
      if (maxPrice < 4999) qs.set('max_price', String(maxPrice));
      const d = await getJSON(`/tests?${qs}`);
      if (loadReq.current !== my) return;
      setRows(d.data);
      setMeta(d.meta);
    } catch (e) {
      if (loadReq.current !== my) return;
      setError(e.message || 'Failed to load tests. Start the backend API and retry.');
    } finally {
      if (loadReq.current !== my) return;
      setLoading(false);
      setFirst(false);
      signalReady();
    }
  }, [q, cat, sort, maxPrice, page, signalReady]);

  useEffect(() => { load(); }, [load]);

  // Entrance motion for hero + cards (same reveal system as Home).
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('main .reveal:not(.revealed)'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        el.classList.add('revealed');
        window.setTimeout(() => { el.style.transitionDelay = ''; }, 850);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rows, first]);

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    const isPageNav = 'page' in patch;
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!isPageNav) next.delete('page');
    setParams(next, { replace: true });
    if (isPageNav) window.scrollTo({ top: 0 });
  };

  const book = (uuid) => {
    navigate(`/book?test=${encodeURIComponent(uuid)}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <main className="w-full pt-20 bg-surface flex-1">
      <div className="sticky top-28 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/40 shadow-[0_10px_28px_-14px_rgba(12,60,76,0.25)]">
        <div className="max-w-7xl mx-auto px-margin py-3 flex flex-col gap-2.5">
          <div className="flex flex-col xl:flex-row gap-2.5">
            <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl pl-4 pr-2 h-12 shadow-sm border border-outline-variant/40 flex-1 max-sm:flex-none max-sm:w-full max-sm:min-w-0 focus-within:border-secondary transition-colors">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">search</span>
              <input
                value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder={ph}
                className="w-full min-w-0 bg-transparent outline-none font-body-md text-body-md max-sm:text-[16px] text-primary placeholder:text-outline"
                aria-label="Search tests"
              />
              {loading && !first
                ? <span className="material-symbols-outlined text-secondary text-[20px] animate-spin mr-2 shrink-0">refresh</span>
                : draft && <button type="button" onClick={() => setDraft('')} className="text-on-surface-variant hover:text-primary mr-2 transition-colors shrink-0" aria-label="Clear"><span className="material-symbols-outlined text-[18px]">close</span></button>}
            </div>
            <div className="tests-filter flex items-center gap-2 bg-surface-container-lowest rounded-xl px-4 h-12 shadow-sm border border-outline-variant/40 max-sm:flex-wrap max-sm:h-auto max-sm:py-3 max-sm:mt-1">
              <label className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap" htmlFor="maxPrice">Max {inr(maxPrice)}</label>
              <input id="maxPrice" type="range" min={299} max={4999} step={100} value={maxPrice} onChange={(e) => setParam({ max: e.target.value === '4999' ? '' : e.target.value })} className="accent-secondary w-28 sm:w-36 max-sm:flex-1 max-sm:min-w-[110px] max-sm:w-auto" />
              <select value={sort} onChange={(e) => setParam({ sort: e.target.value })} className="px-3 py-2 rounded-lg bg-surface-container-low font-label-md text-label-md text-primary outline-none max-sm:w-full max-sm:mt-2" aria-label="Sort tests">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            <button type="button" onClick={() => setParam({ cat: '' })} className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all ${!cat ? 'bg-primary text-on-primary shadow' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:border-secondary hover:text-primary'}`}>All Tests</button>
            {cats.map((c) => (
              <button key={c.slug} type="button" onClick={() => setParam({ cat: c.slug })} className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all ${cat === c.slug ? 'bg-primary text-on-primary shadow' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:border-secondary hover:text-primary'}`}>
                {c.name} {c.tests_count != null && <span className="opacity-70">({c.tests_count})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-margin pt-space-xl mt-space-md pb-16 w-full flex flex-col gap-space-lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[20px]">biotech</span></span>
            {meta ? `${meta.total} test${meta.total === 1 ? '' : 's'}` : 'Tests'}
          </h2>
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-error-container text-on-error-container px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-body-md text-body-md">{error}</span>
            <button type="button" onClick={load} className="shrink-0 px-3 py-1.5 rounded-lg bg-surface-container-lowest font-label-md text-label-md text-primary">Retry</button>
          </div>
        )}

        {first && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl skeleton-shimmer" />)}
          </div>
        ) : !rows.length ? (
          <div className="rounded-2xl bg-surface-container-lowest p-10 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[36px] text-secondary">science_off</span>
            <h3 className="font-headline-sm text-headline-sm text-primary">No tests found</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Try a different search or clear filters.</p>
            <button type="button" onClick={() => { setDraft(''); setParams({}, { replace: true }); }} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md">Clear all</button>
          </div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-surface/60">
                <span className="material-symbols-outlined text-[22px] text-secondary animate-spin">refresh</span>
                <span className="font-label-md text-label-md text-primary">Searching…</span>
              </div>
            )}
            <div className={`transition-opacity ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
                {rows.map((t, i) => (
                  <article key={t.id} style={{ transitionDelay: `${Math.min(i * 60, 300)}ms` }} className="reveal group relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-secondary/40 transition-all duration-300 flex flex-col justify-between border border-outline-variant/40">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-secondary-container to-tertiary-fixed opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-secondary font-semibold font-mono">{t.code}</span>
                        <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-surface-container-low px-2 py-0.5 rounded-full whitespace-nowrap">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>{t.turnaround_hours}h report
                        </span>
                      </div>
                      <h3 title={t.name} className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors truncate">{t.name.length > 45 ? `${t.name.slice(0, 45)}…` : t.name}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">{t.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm"><span className="material-symbols-outlined text-[13px]">biotech</span>{t.parameter_count} params</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm"><span className="material-symbols-outlined text-[13px]">water_drop</span>{t.sample_type}</span>
                        {t.category && <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">{t.category.name}</span>}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-container">
                      <div className="flex items-baseline justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-currency-display text-currency-display text-primary">{inr(t.price)}</span>
                          {t.mrp && <span className="font-body-sm text-body-sm text-outline line-through">{inr(t.mrp)}</span>}
                        </div>
                        {t.discount_percent ? <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">{t.discount_percent}% OFF</span> : null}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setDetail(t)} className="px-2 py-2 rounded-lg bg-surface-container-low text-secondary font-label-md text-label-md hover:bg-surface-container transition-colors">Details</button>
                        <button type="button" onClick={() => book(t.id)} className="px-2 py-2 rounded-lg bg-gradient-to-r from-secondary to-sky-500 text-white font-label-md text-label-md font-semibold shadow-md shadow-secondary/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[15px]">home_health</span>Book</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-6">
                <Pagination meta={meta} onPage={(p) => setParam({ page: String(p) })} />
              </div>
            </div>
          </div>
        )}
      </section>

      {detail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={detail.name}>
          <button type="button" aria-label="Close" onClick={() => setDetail(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm cursor-default" />
          <div className="modal-pop relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest shadow-2xl p-6 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-label-sm text-label-sm text-secondary">{detail.code}</p>
                <h3 className="font-headline-md text-headline-md text-primary">{detail.name}</h3>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center" aria-label="Close"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">{detail.description}</p>
            {detail.preparation_instructions && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="font-label-md text-label-md text-amber-800 font-semibold mb-1">Preparation</p>
                <p className="font-body-md text-body-md text-amber-900">{detail.preparation_instructions}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 font-body-md text-body-md">
              <p><strong>Sample:</strong> {detail.sample_type}</p>
              <p><strong>Report in:</strong> {detail.turnaround_hours} hours</p>
              <p><strong>Parameters:</strong> {detail.parameter_count}</p>
              <p><strong>Home collection:</strong> {detail.home_collection_available ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-currency-display text-currency-display text-primary">{inr(detail.price)}</span>
              <button type="button" onClick={() => book(detail.id)} className="px-6 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg hover:bg-on-secondary-container">Book This Test</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
