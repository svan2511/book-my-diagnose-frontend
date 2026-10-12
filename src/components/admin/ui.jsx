import { useEffect } from 'react';

// ---------- formatters ----------
export const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

export const fmtDate = (iso, withTime = true) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

export const fmtPhone = (p) => (p ? `+91 ${String(p).slice(-10)}` : '—');

// ---------- status badge (design-prd §4 semantics) ----------
const TONES = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_TONE = {
  pending: 'amber', new: 'amber',
  confirmed: 'blue', assigned: 'blue', collection_assigned: 'blue',
  on_the_way: 'orange', in_progress: 'orange', testing_in_progress: 'orange', collection_in_progress: 'orange',
  sample_collected: 'teal', collected: 'teal',
  report_ready: 'purple', ready: 'purple',
  completed: 'green', delivered: 'green', resolved: 'green', closed: 'green', active: 'green',
  cancelled: 'red', failed: 'red', inactive: 'red',
};

export function StatusBadge({ value }) {
  const tone = TONES[STATUS_TONE[String(value || '').toLowerCase()] || 'slate'];
  const label = String(value || '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-label-sm text-label-sm font-semibold whitespace-nowrap ${tone}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ---------- page header ----------
export function PageHeader({ title, sub, actions, titleClassName, inlineSub }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className={`${titleClassName || 'font-headline-lg text-headline-lg'} text-primary tracking-tight`}>
          {title}
          {inlineSub && sub && <span className="font-body-sm text-body-sm text-secondary font-normal ml-2 whitespace-nowrap">{sub}</span>}
        </h1>
        {!inlineSub && sub && <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------- stat card ----------
export function Stat({ icon, label, value, sub, grad = 'from-secondary to-sky-400' }) {
  return (
    <div className="group rounded-2xl bg-surface-container-lowest p-space-md shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all border border-outline-variant/40 flex items-center gap-space-md min-w-0">
      <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
        <span className="material-symbols-outlined text-[24px] text-white">{icon}</span>
      </span>
      <div className="flex flex-col min-w-0">
        <span className="font-currency-display text-currency-display text-primary tracking-tight tabular-nums truncate">{value}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider truncate">{label}</span>
        {sub && <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{sub}</span>}
      </div>
    </div>
  );
}

// ---------- table shell ----------
export function TableShell({ head, children }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="bg-surface-container-low">
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 font-body-md text-body-md text-on-surface align-top ${className}`}>{children}</td>;
}

// ---------- pagination ----------
export function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const pages = [];
  for (let p = 1; p <= meta.last_page; p++) {
    if (p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        Showing <strong className="text-primary">{meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)}</strong> of <strong className="text-primary">{meta.total}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)} className="px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm font-label-md text-label-md text-primary disabled:opacity-40">‹ Prev</button>
        {pages.map((p, i) => (p === '…' ? <span key={`e${i}`} className="px-1 text-outline">…</span> : (
          <button key={p} type="button" onClick={() => onPage(p)} className={`w-8 h-8 rounded-lg font-label-sm text-label-sm ${p === meta.current_page ? 'bg-secondary text-on-secondary' : 'text-primary hover:bg-surface-container-low'}`}>{p}</button>
        )))}
        <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)} className="px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm font-label-md text-label-md text-primary disabled:opacity-40">Next ›</button>
      </div>
    </div>
  );
}

// ---------- empty / loading / error ----------
export function EmptyState({ icon = 'search_off', title, sub, action }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-10 flex flex-col items-center text-center gap-3">
      <span className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-secondary">{icon}</span>
      </span>
      <h3 className="font-headline-sm text-headline-sm text-primary">{title}</h3>
      {sub && <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">{sub}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ lines = 5 }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest shadow-sm p-4 flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-surface-container-low animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl bg-error-container text-on-error-container px-4 py-3 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 font-body-md text-body-md">
        <span className="material-symbols-outlined text-[20px]">error</span>{message}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 px-3 py-1.5 rounded-lg bg-surface-container-lowest font-label-md text-label-md text-primary">Retry</button>
      )}
    </div>
  );
}

// ---------- form controls ----------
export function Field({ label, icon, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-lg text-label-lg text-primary">{label}</span>
      <span className="flex items-center px-3 py-2.5 rounded-lg bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-secondary transition-all">
        {icon && <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">{icon}</span>}
        {children}
      </span>
      {hint && <span className="font-body-sm text-body-sm text-on-surface-variant">{hint}</span>}
    </label>
  );
}

export const inputCls = 'bg-transparent border-0 outline-none w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline disabled:opacity-60';

// ---------- modal ----------
export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose ]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-primary/60 backdrop-blur-sm cursor-default" />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest shadow-2xl p-6 flex flex-col gap-4`}>
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary" aria-label="Close dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- primary / secondary buttons ----------
export function PrimaryBtn({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold shadow-sm hover:bg-on-secondary-container transition-all active:scale-[0.98] disabled:opacity-60 ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-60 ${props.className || ''}`}
    >
      {children}
    </button>
  );
}
