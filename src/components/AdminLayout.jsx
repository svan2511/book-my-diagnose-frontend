import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../auth/AdminAuth';

const NAV = [
  { to: '/admin', end: true, icon: 'space_dashboard', label: 'Dashboard' },
  { to: '/admin/bookings', icon: 'receipt_long', label: 'Bookings' },
  { to: '/admin/collections', icon: 'local_shipping', label: 'Collections' },
  { to: '/admin/staff', icon: 'badge', label: 'Staff' },
  { to: '/admin/tests', icon: 'science', label: 'Tests' },
  { to: '/admin/reports', icon: 'description', label: 'Reports' },
  { to: '/admin/customers', icon: 'group', label: 'Customers' },
  { to: '/admin/queries', icon: 'forum', label: 'Queries' },
];

function Brand() {
  return (
    <div className="flex items-center gap-space-sm">
      <picture className="flex items-center">
        <source srcSet="/logo.webp" type="image/webp" />
        <img alt="Book My Diagnose" className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm" src="/logo.png" width="512" height="328" decoding="async" />
      </picture>
      <div className="flex flex-col min-w-0">
        <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold truncate">Book My Diagnose</span>
        {/* <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Operations Hub</span> */}
      </div>
    </div>
  );
}

function SideNav({ onNav }) {
  return (
    <nav className="flex-1 overflow-y-auto px-space-md py-space-xs flex flex-col gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNav}
          className={({ isActive }) =>
            `flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-colors font-label-lg text-label-lg ${
              isActive
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="font-label-lg text-label-lg">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function UserFooter() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const doLogout = async () => {
    await logout();
    navigate('/admin/login');
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="p-space-md">
      <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container rounded-lg">
        <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-label-md text-label-md text-on-surface font-bold truncate">{admin?.name || 'Admin'}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{admin?.email || ''}</span>
        </div>
        <button
          type="button"
          onClick={doLogout}
          title="Log out"
          aria-label="Log out"
          className="p-space-xs text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/admin/bookings?search=${encodeURIComponent(q.trim())}` : '/admin/bookings');
    setMobileOpen(false);
  };

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-space-lg pb-0">
            <Brand />
          </div>
          <div className="px-space-lg py-space-md">
            <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px]">share_location</span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Jhilmil Industrial Area</span>
                <span className="font-label-md text-label-md text-on-surface truncate">Delhi 110095</span>
              </div>
            </div>
          </div>
          <SideNav />
        </div>
        <UserFooter />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <picture className="flex items-center">
            <source srcSet="/logo.webp" type="image/webp" />
            <img alt="Book My Diagnose" className="w-9 h-9 rounded-xl object-contain bg-white" src="/logo.png" width="512" height="328" decoding="async" />
          </picture>
          <div className="flex flex-col gap-1">
            <span className="font-headline-sm text-headline-sm text-primary text-[15px] font-bold leading-none">Book My Diagnose</span>
            <span className="font-label-sm text-label-sm text-secondary text-[10px] uppercase">Operations Hub</span>
          </div>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center" type="button" aria-label="Admin menu">
          <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-surface-container-low pt-16 flex flex-col">
          <div className="flex-1 overflow-y-auto flex flex-col">
            <SideNav onNav={() => setMobileOpen(false)} />
          </div>
          <UserFooter />
          <div className="px-4 pb-4">
            <button onClick={() => { setMobileOpen(false); navigate('/'); }} className="w-full px-4 py-3 rounded-xl bg-surface-container text-primary font-label-lg" type="button">← Back to Website</button>
          </div>
        </div>
      )}

      <div className="lg:pl-72 pt-14 lg:pt-16">
        {/* Desktop topbar */}
        <div className="hidden lg:block">
          <header className="fixed top-0 left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40">
            <div className="h-16 w-full px-space-lg flex items-center justify-between gap-space-md">
              <form onSubmit={submitSearch} className="relative w-full max-w-lg">
                <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest transition-all"
                  placeholder="Search Booking ID, patient name or phone…"
                  type="search"
                  aria-label="Search bookings"
                />
              </form>
              <div className="flex items-center gap-space-md">
                <button onClick={() => navigate('/')} className="h-9 px-space-md bg-surface-container text-on-surface rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors" type="button">View Website</button>
                <UserChip />
              </div>
            </div>
          </header>
        </div>
        <div className="lg:hidden h-2" />
        <Outlet />
      </div>
    </div>
  );
}

function UserChip() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-space-sm">
      <span className="hidden xl:flex flex-col items-end">
        <span className="font-label-md text-label-md text-primary font-semibold leading-none">{admin?.name || 'Admin'}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{admin?.email || ''}</span>
      </span>
      <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
      </span>
      <button
        type="button"
        title="Log out"
        aria-label="Log out"
        onClick={async () => { await logout(); navigate('/admin/login'); }}
        className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </div>
  );
}
