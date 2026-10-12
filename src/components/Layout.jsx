import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDataPathNav } from '../hooks/useDataPathNav';

function TopHeader() {
  const navigate = useNavigate();
  useDataPathNav();
  const [mobileOpen, setMobileOpen] = useState(false);
  const go = (to) => { setMobileOpen(false); navigate(to); window.scrollTo({ top: 0 }); };
  useEffect(() => {
    function handler(e) {
      const btn = e.target.closest('button');
      if (btn && btn.textContent && btn.textContent.includes('Book a Test') && !btn.closest('[data-mobile-menu]')) {
        // header desktop Book button (has no data-path) -> go to /book
        if (!btn.getAttribute('data-wired')) {
          // let hook handle via direct navigate here
        }
        e.preventDefault();
        navigate('/book');
        window.scrollTo({ top: 0 });
      }
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [navigate]);
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="bg-primary text-on-primary py-space-xs px-margin"><div className="max-w-7xl mx-auto flex items-center justify-between gap-space-sm font-label-sm text-label-sm"><div className="flex items-center gap-space-sm min-w-0 flex-1"><span className="flex items-center gap-space-xs text-secondary-fixed truncate"><span className="material-symbols-outlined text-[15px]">verified</span>NABL &amp; ICMR Accredited Labs • 45+ Cities</span><span className="hidden lg:inline text-on-primary-container/40">|</span><span className="hidden lg:flex items-center gap-space-xs"><span className="material-symbols-outlined text-[15px]">support_agent</span>Helpline: 1800-209-DIAG (24x7)</span></div><div className="hidden md:flex items-center gap-space-lg"><a className="flex items-center gap-space-xs hover:text-secondary-fixed transition-colors" href="#"><span className="material-symbols-outlined text-[15px]">chat</span>Download Reports via WhatsApp</a><span className="text-on-primary-container/40">|</span><div className="flex items-center gap-space-xs text-on-primary cursor-pointer hover:text-secondary-fixed transition-colors"><span className="material-symbols-outlined text-[15px]">location_on</span><span>Mumbai / Delhi NCR / Bangalore</span><span className="material-symbols-outlined text-[14px]">expand_more</span></div></div></div></div><div className="header-main h-20 max-sm:h-16 max-w-7xl mx-auto px-margin flex items-center justify-between gap-space-md max-sm:gap-2"><div className="header-logo flex items-center gap-space-lg shrink-0"><a className="flex items-center gap-space-sm" data-path="home" href="#"><picture className="flex items-center"><source srcSet="/logo.webp" type="image/webp" /><img alt="Book My Diagnose Brand Logo" className="h-10 sm:h-14 max-sm:h-9 w-auto max-w-full object-contain" src="/logo.png" width="512" height="328" fetchPriority="high" decoding="async" /></picture></a></div><nav className="hidden lg:flex items-center gap-space-md xl:gap-space-lg font-label-lg text-label-lg">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link nav-active transition-colors py-space-xs text-secondary font-semibold" : "nav-link text-on-surface-variant hover:text-on-surface transition-colors py-space-xs")}>Home</NavLink>
            <NavLink to="/tests" className={({ isActive }) => (isActive ? "nav-link nav-active transition-colors py-space-xs text-secondary font-semibold" : "nav-link text-on-surface-variant hover:text-on-surface transition-colors py-space-xs")}>Tests</NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? "nav-link nav-active transition-colors py-space-xs text-secondary font-semibold" : "nav-link text-on-surface-variant hover:text-on-surface transition-colors py-space-xs")}>About Us</NavLink>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? "nav-link nav-active transition-colors py-space-xs text-secondary font-semibold" : "nav-link text-on-surface-variant hover:text-on-surface transition-colors py-space-xs")}>Contact Us</NavLink>
            <NavLink to="/tracking" className={({ isActive }) => (isActive ? "nav-link nav-active transition-colors py-space-xs text-secondary font-semibold" : "nav-link text-on-surface-variant hover:text-on-surface transition-colors py-space-xs")}>Track Booking</NavLink>
          </nav><div className="header-actions flex items-center gap-space-sm sm:gap-space-md max-sm:gap-2 shrink-0"><button className="hidden md:flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-secondary font-label-md text-label-md hover:bg-surface-container-high transition-colors" type="button"><span className="material-symbols-outlined text-[16px]">call</span><span>Call Phlebotomist</span></button><button className="flex items-center gap-space-xs px-space-md max-sm:px-3 sm:px-space-lg py-space-xs max-sm:py-2 sm:py-space-sm rounded-lg bg-secondary text-on-secondary font-label-md sm:font-label-lg text-label-md sm:text-label-lg shadow-[0_4px_16px_rgba(0,101,145,0.25)] hover:bg-on-secondary-container transition-all active:scale-[0.98] whitespace-nowrap max-sm:shrink-0" type="button"><span className="material-symbols-outlined text-[18px]">biotech</span><span className="max-sm:hidden">Book a Test</span></button><button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden w-10 h-10 max-sm:w-10 max-sm:h-10 rounded-full bg-primary text-white flex max-sm:flex items-center justify-center shadow-lg shrink-0 max-sm:shrink-0" aria-label="Menu" type="button"><span className="material-symbols-outlined text-[20px]">{mobileOpen ? 'close' : 'menu'}</span></button><div className="relative hidden sm:flex items-center pl-space-xs"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEnL05giJVAdE1XRic0AGVrm8L6-Kzs3YzcqvxVqjA6xq3FohR8EYDiKx4_xz8dIlM-vKbmUedGlTFIsdWhgJ57LBOKt3Wvrp5l_smoS4hzYFwHTVGCnF_0OZyOeexz07pNylcNlO3pqyGE4dcUYOwqgPRHyhB9CH1hDe_gzHCOYUKs2ITwakWnZUznuyM7eMIrZJJd7nRiahDyB1-F2qyTA04dBoLvdoXFT-9J5c"/><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-on-tertiary-container ring-2 ring-surface-container-lowest"></span></div></div></div></header>
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-[54]" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav data-mobile-menu className="lg:hidden fixed inset-x-4 top-28 z-[55] rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant/40 p-2 flex flex-col">
            {[
              ['/', 'Home', true],
              ['/tests', 'Tests'],
              ['/about', 'About Us'],
              ['/contact', 'Contact Us'],
              ['/tracking', 'Track Booking'],
            ].map(([to, label, end]) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => (isActive ? 'nav-link nav-active px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors font-label-lg text-label-lg text-secondary font-semibold' : 'nav-link px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface')}>{label}</NavLink>
            ))}
          </nav>
        </>
      )}
    </>
  );
}

function SiteFooter() {
  return (
    <>
      <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_12px_rgba(0,0,0,0.03)]"><div className="max-w-7xl mx-auto px-margin py-space-xl"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl mb-space-xl"><div className="lg:col-span-2 flex flex-col gap-space-md pr-space-lg"><div className="flex items-center gap-space-sm"><picture className="flex items-center"><source srcSet="/logo.webp" type="image/webp" /><img alt="Book My Diagnose Brand Logo" className="h-14 w-auto object-contain" src="/logo.png" width="512" height="328" loading="lazy" decoding="async" /></picture><span className="font-headline-sm text-headline-sm text-primary">Book My Diagnose</span></div><p className="font-body-md text-body-md text-on-surface-variant max-w-sm">India's trusted pathology and doorstep diagnostic network. Delivering precision blood testing, cold-chain phlebotomy, and validated reports within 12 hours.</p><div className="flex flex-wrap items-center gap-space-sm pt-space-xs"><span className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container font-label-sm text-label-sm text-primary"><span className="material-symbols-outlined text-[14px]">verified</span>ISO 15189 Certified</span><span className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container font-label-sm text-label-sm text-primary"><span className="material-symbols-outlined text-[14px]">shield</span>NABL Accredited</span><span className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container font-label-sm text-label-sm text-primary"><span className="material-symbols-outlined text-[14px]">task_alt</span>CAP Compliant</span></div></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-primary text-[15px]">Quick Links</h3><ul className="flex flex-col gap-space-xs font-body-md text-body-md text-on-surface-variant"><li><a className="hover:text-secondary transition-colors" data-path="tests-and-packages" href="#">Diagnostic Tests</a></li><li><a className="hover:text-secondary transition-colors" data-path="tests-and-packages" href="#">Full Body Packages</a></li><li><a className="hover:text-secondary transition-colors" data-path="home-collection" href="#">Home Collection FAQ</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Corporate Wellness</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Sample Handling Protocol</a></li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-primary text-[15px]">Support &amp; Tracking</h3><ul className="flex flex-col gap-space-xs font-body-md text-body-md text-on-surface-variant"><li><a className="hover:text-secondary transition-colors" data-path="track-booking" href="#">Track Sample Transit</a></li><li><a className="hover:text-secondary transition-colors" data-path="download-report" href="#">WhatsApp Report Delivery</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Phlebotomist Verification</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Help Desk (24x7 Support)</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Fasting Guidelines</a></li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-primary text-[15px]">Legal &amp; Security</h3><ul className="flex flex-col gap-space-xs font-body-md text-body-md text-on-surface-variant"><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">HIPAA &amp; NABH Privacy</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Terms of Service</a></li><li><a className="hover:text-secondary transition-colors" data-path="download-report" href="#">Report Authenticity QR</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Refund &amp; Reschedule Policy</a></li><li><a className="hover:text-secondary transition-colors" data-path="how-it-works" href="#">Grievance Redressal</a></li></ul></div></div><div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-on-surface-variant/80 max-sm:items-start"><p>© 2026 Book My Diagnose Healthcare Technologies Pvt Ltd. All rights reserved.</p><div className="flex items-center gap-space-md max-sm:flex-col max-sm:items-start max-sm:gap-space-xs max-sm:text-left"><span className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[15px] text-on-tertiary-container">lock</span>256-Bit SSL Encrypted Health Vault</span><span className="max-sm:hidden">•</span><span>Government of India Digital Health Mission (ABDM) Partner</span></div></div></div></footer>
    </>
  );
}

export default function Layout() {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <TopHeader />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <SiteFooter />
      {/* Sticky mobile booking bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant px-4 py-3 flex items-center gap-3">
        <a href="tel:18002093424" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface-container text-primary font-label-lg text-label-lg">
          <span className="material-symbols-outlined text-[18px]">call</span> Call
        </a>
        <button data-goto="/book" className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary text-white font-label-lg text-label-lg shadow-lg" type="button">
          <span className="material-symbols-outlined text-[18px]">biotech</span> Book Home Visit
        </button>
      </div>
      <div className="lg:hidden h-[72px]" />
    </div>
  );
}
