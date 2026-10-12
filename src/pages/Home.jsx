import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDataPathNav } from '../hooks/useDataPathNav';
import { API_BASE } from '../lib/api';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

export default function Home() {
  const navigate = useNavigate();
  useDataPathNav();
  const [q, setQ] = useState('Lipid Profile');

  // Popular tests — real data from Laravel API, no dummy cards.
  const [popular, setPopular] = useState([]);
  const [popLoading, setPopLoading] = useState(true);
  const [popError, setPopError] = useState('');
  // Real test categories for the filter pills.
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      setPopLoading(true);
      setPopError('');
      try {
        const res = await fetch(`${API_BASE}/tests?per_page=9&sort=-created_at`, { headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || 'Failed to load tests.');
        if (live) setPopular(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (live) setPopError(e.message || 'Failed to load tests.');
      } finally {
        if (live) setPopLoading(false);
      }
    })();
    fetch(`${API_BASE}/test-categories`, { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((d) => { if (live && Array.isArray(d?.data)) setCats(d.data); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const goCat = (slug) => {
    navigate(slug ? (`/tests?cat=${encodeURIComponent(slug)}`) : '/tests');
    window.scrollTo({ top: 0 });
  };

  // Scroll-reveal for Home sections/cards (entrance only; hover stays instant).
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal:not(.revealed)'));
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
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [popLoading, cats]);

  const bookTest = (t) => {
    navigate(`/book?test=${encodeURIComponent(t.id || t.code)}`);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const input = document.getElementById('diagnostic-search-input');
    if (input) {
      const onInput = (e) => setQ(e.target.value);
      input.addEventListener('input', onInput);
      return () => input.removeEventListener('input', onInput);
    }
  }, []);

  const goTests = (query) => {
    const v = typeof query === 'string' ? query : q;
    navigate(v ? ('/tests?q=' + encodeURIComponent(v)) : '/tests');
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    function onClick(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      const txt = (btn.textContent || '').trim();
      if (txt === 'Find Labs' || txt.includes('Find Labs')) {
        e.preventDefault();
        goTests();
      }
      if (txt.includes('Explore 350+ Tests') || txt.includes('Explore')) {
        // in-page anchor already, let it scroll; no nav
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  });

  // trending tags -> tests
  useEffect(() => {
    function onTag(e) {
      const b = e.target.closest('button');
      if (!b) return;
      const t = (b.textContent || '').trim();
      const trending = ['Complete Blood Count (CBC)','Diabetes Panel (HbA1c + Fasting)','Lipid Profile Comprehensive','Vitamin D & B12 Combo','Full Body Comprehensive (68 Params)'];
      if (trending.some(x => t.includes(x.slice(0,10)))) {
        goTests(b.textContent.trim());
      }
    }
    document.addEventListener('click', onTag);
    return () => document.removeEventListener('click', onTag);
  });

  return (
    <>
      <main className="w-full pt-20 bg-surface flex-1 home-polish"><div className="flex flex-col w-full">

<section className="hidden md:block w-full bg-primary text-on-primary py-space-sm px-margin">
<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-md text-label-md">
<div className="flex flex-wrap items-center gap-space-sm">
<span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary-fixed animate-ping"></span>
<span className="text-tertiary-fixed font-semibold tracking-wide uppercase text-[11px]">Rapid Phlebotomy Dispatch Active:</span>
<span className="text-primary-fixed">Slots open across Mumbai, Bengaluru, Delhi NCR, and 42+ metros</span>
</div>
<div className="flex flex-wrap items-center gap-space-sm sm:gap-space-lg text-primary-fixed-dim">
<span className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[16px] text-tertiary-fixed">thermostat</span>
          Vaccine &amp; Cold-Chain Sealed (2°C - 8°C)
        </span>
<span className="hidden sm:inline text-primary-container">/</span>
<span className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[16px] text-tertiary-fixed">lock_clock</span>
          Free Reschedule Anytime
        </span>
</div>
</div>
</section>

<section className="relative w-full overflow-hidden bg-surface py-space-xl lg:py-24">

<div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none"></div>
<div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-surface-variant/40 blur-3xl pointer-events-none"></div>
<div className="max-w-7xl mx-auto px-margin relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">

<div className="lg:col-span-7 flex flex-col gap-space-lg reveal">

<div className="flex flex-wrap items-center gap-space-xs max-sm:flex-col max-sm:items-stretch max-sm:gap-space-sm">
<span className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm shadow-sm max-sm:w-full max-sm:max-w-[280px] max-sm:justify-start max-sm:py-2">
<span className="material-symbols-outlined text-[15px] text-on-tertiary-container">verified</span>
              NABL &amp; ICMR Certified Labs
            </span>
<span className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm shadow-sm max-sm:w-full max-sm:max-w-[280px] max-sm:justify-start max-sm:py-2">
<span className="material-symbols-outlined text-[15px] text-secondary">qr_code_scanner</span>
              Barcoded Sample Security
            </span>
<span className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm shadow-sm max-sm:w-full max-sm:max-w-[280px] max-sm:justify-start max-sm:py-2">
<span className="material-symbols-outlined text-[15px] text-on-tertiary-container">person_check</span>
              Phlebotomists with 5+ Yrs Exp
            </span>
</div>

<div className="flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Doorstep Diagnostic Intelligence</span>
<h1 className="font-display-lg text-display-lg text-primary tracking-tight">
              Trusted Diagnostics.<br /><span className="font-accent-serif text-secondary">Convenient home collection.</span>
            </h1>
</div>

<p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Certified NABL diagnostic testing at your doorstep in under 60 minutes. Accurate, clinician-reviewed reports delivered digitally and straight to your WhatsApp.
          </p>

<div className="flex flex-wrap items-center gap-space-md pt-space-xs max-sm:flex-col max-sm:items-stretch">
<a className="inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg shadow-secondary/20 hover:bg-on-secondary-container transition-all active:scale-[0.99] max-sm:w-full" href="#quick-catalog">
<span className="material-symbols-outlined text-[20px]">vaccines</span>
<span>Book a Home Test</span>
</a>
<a className="inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md rounded-lg bg-surface-container text-primary font-label-lg text-label-lg hover:bg-surface-container-high transition-colors max-sm:w-full" href="#search-anchor">
<span className="material-symbols-outlined text-[20px]">smb_share</span>
<span>Explore 350+ Tests</span>
</a>
<div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container">bolt</span>
<span>Free Phlebotomist Visit on Packages</span>
</div>
</div>

<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md pt-space-md">
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<span className="font-headline-md text-headline-md text-primary font-bold">1.8M+</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Samples Tested</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<span className="font-headline-md text-headline-md text-on-tertiary-container font-bold">99.8%</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Accuracy Rate</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<span className="font-headline-md text-headline-md text-secondary font-bold">12-24h</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Turnaround Time</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<span className="font-headline-md text-headline-md text-primary font-bold">100%</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Sealed Vials</span>
</div>
</div>
</div>

<div className="lg:col-span-5 relative reveal">
<div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest">
<img className="w-full h-[460px] object-cover img-kenburns" data-alt="High precision diagnostic pathology laboratory with certified clinical technologist in protective attire examining blood plasma tubes under cold clinical lighting with sterile robotic diagnostic equipment in navy and cyan tones." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWsk1zyYN72JEGBgzzs89q9bSEpTBMEW9Khf1T5edUhecmY1k5lClvKVttxcvdxVeMTc2pImoFmhlN9ER31f42uH0NDHd3fqeqf_Bsb11UhFJIS-0qBBYZh17n6tZDEsykS6GrYaY67ccL5DYEhiaKcQecdLZuS1MKaQgj75IG0abMkOwFuE3Nfcd2mgKMYim5H2X84AhzUwMdXglpTnAK1oHRvc21Q5NwUPHKbyE"/>
<div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent"></div>

<div className="absolute bottom-space-md left-space-md right-space-md p-space-md rounded-xl bg-surface-container-lowest/95 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-space-md animate-floaty">
<div className="flex items-center gap-space-md">
<div className="relative">
<img className="w-12 h-12 rounded-full object-cover shadow-sm" data-alt="Professional medical phlebotomist smiling in clean blue surgical uniform with stethoscope and credential badge against a soft blurred medical laboratory background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRKGyaWwKvB7c40G9MUJpPFs2rAUsO_4Oreauotr7Ah694-aouEzEZD25qomNpF2EVbDDpySZ-cjrCkURfxct8wr0mdel040W16002zUGv5YhCfbisXC0l8DHWgpukLs9Nm9ApW0ckW_atMDtHdikBNBbnAQlgv8usa_vwF2lNqFF54HHJrJf19IpZR6zmQUXVE_GlbjylXv9vyTDZtlagyeoeFqmQvIEDkRlvCMM"/>
<span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-on-tertiary-container flex items-center justify-center text-on-tertiary">
<span className="material-symbols-outlined text-[10px]">check</span>
</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-primary text-[15px]">Rajesh Sharma</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-secondary text-[10px]">Sr. Phlebotomist</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-tertiary-container">shield_with_heart</span>
                    Double Vaccinated • 6,400+ Collections
                  </span>
</div>
</div>
<div className="text-right shrink-0">
<span className="font-label-sm text-label-sm px-space-sm py-1 rounded-full bg-surface-container-high text-on-tertiary-container font-semibold">Ready Nearby</span>
</div>
</div>

<div className="absolute top-space-md left-space-md px-space-lg py-3 rounded-full bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-label-sm flex items-center gap-space-xs">
<span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
<span>Next Slot: Today, Within 45 Mins</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-low py-space-xl px-margin" id="search-anchor">
<div className="max-w-4xl mx-auto flex flex-col gap-space-lg">
<div className="text-center flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Fast Pathology Discovery</span>
<h2 className="font-headline-xl text-headline-xl text-primary">Find Your Prescribed Diagnostic Test</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Instant pricing, fasting prerequisites, and slot check for over 350+ individual tests and health checkup profiles.</p>
</div>

<div className="relative bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-xl flex flex-col gap-space-md reveal">

<div className="relative flex items-center rounded-xl bg-surface-container px-space-lg py-space-md shadow-inner">
<span className="material-symbols-outlined text-secondary text-[26px] mr-space-md shrink-0">search</span>
<input className="w-full min-w-0 bg-transparent border-0 outline-none font-body-lg text-body-lg text-primary placeholder:text-outline" id="diagnostic-search-input" placeholder="Search by test name or test code (e.g., CBC001, Thyroid Profile, HbA1c)..." type="text" defaultValue="Lipid Profile"/>
<button className="shrink-0 px-space-lg py-space-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-on-secondary-container transition-all" type="button">
            Find Labs
          </button>
</div>

<div className="flex flex-wrap items-center gap-space-xs pt-space-xs max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1 max-sm:-mx-1 max-sm:px-1">
<span className="font-label-sm text-label-sm text-on-surface-variant font-semibold mr-space-xs max-sm:shrink-0">Trending:</span>
<button className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors max-sm:px-space-lg max-sm:py-2 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">
            Complete Blood Count (CBC)
          </button>
<button className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors max-sm:px-space-lg max-sm:py-2 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">
            Diabetes Panel (HbA1c + Fasting)
          </button>
<button className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors max-sm:px-space-lg max-sm:py-2 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">
            Lipid Profile Comprehensive
          </button>
<button className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors max-sm:px-space-lg max-sm:py-2 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">
            Vitamin D &amp; B12 Combo
          </button>
<button className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors max-sm:px-space-lg max-sm:py-2 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">
            Full Body Comprehensive (68 Params)
          </button>
</div>

</div>
</div>
</section>

<section className="w-full bg-surface py-space-xl lg:py-24 px-margin" id="quick-catalog">
<div className="max-w-7xl mx-auto flex flex-col gap-space-xl">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md reveal">
<div className="flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Standardized Diagnostic Profiles</span>
<h2 className="font-headline-xl text-headline-xl text-primary">Popular &amp; Essential Tests</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Validated clinical tests with doorstep phlebotomy and accredited digital delivery.</p>
</div>
<div className="flex items-center gap-space-xs flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1 max-sm:-mx-1 max-sm:px-1">
<button onClick={() => goCat('')} className="px-space-md py-space-xs rounded-full bg-primary text-on-primary font-label-md text-label-md max-sm:py-3 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">All</button>
{cats.slice(0, 4).map((c) => (
<button key={c.slug} onClick={() => goCat(c.slug)} className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors max-sm:py-3 max-sm:shrink-0 max-sm:whitespace-nowrap" type="button">{c.name}</button>
))}
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
{popLoading && Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-surface-container-low animate-pulse" />)}
{!popLoading && popError && (
<div className="col-span-full rounded-2xl bg-surface-container-lowest p-8 text-center flex flex-col items-center gap-3">
<span className="material-symbols-outlined text-[36px] text-secondary">science_off</span>
<p className="font-body-md text-body-md text-on-surface-variant">{popError} Backend API chalu karo aur retry dabao.</p>
<button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md">Retry</button>
</div>
)}
{!popLoading && !popError && popular.map((t, i) => (
<div key={t.id} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="reveal rounded-2xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-secondary/30 transition-all duration-300 flex flex-col group border border-transparent">
<div className="flex items-center justify-between gap-2">
<span className="font-mono font-label-sm text-label-sm text-on-surface-variant tracking-wide truncate">{t.code}</span>
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary whitespace-nowrap shrink-0">
<span className="material-symbols-outlined text-[13px]">schedule</span>{t.turnaround_hours}h report
</span>
</div>
<h3 title={t.name} className="pop-name text-primary group-hover:text-secondary transition-colors truncate mt-2">{t.name.length > 45 ? `${t.name.slice(0, 45)}…` : t.name}</h3>
<p className="mt-1 font-body-sm text-body-sm text-on-surface-variant truncate">{t.parameter_count} params • {t.sample_type}{t.home_collection_available ? ' • Home visit' : ''}</p>
<div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between gap-2">
<div className="flex items-center gap-1.5 min-w-0 flex-wrap">
<span className="pop-price font-currency-display text-currency-display text-primary">{inr(t.price)}</span>
{t.mrp && <span className="font-body-sm text-body-sm text-outline line-through">{inr(t.mrp)}</span>}
{t.discount_percent ? <span className="font-label-sm text-label-sm text-emerald-700 bg-emerald-50 px-1.5 py-px rounded font-bold">{t.discount_percent}% OFF</span> : null}
</div>
<button onClick={() => bookTest(t)} className="shrink-0 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-on-secondary-container transition-all shadow-sm flex items-center gap-1" type="button">
<span>Book</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</button>
</div>
</div>
))}
</div>
<div className="flex items-center justify-center pt-space-md">
<button type="button" onClick={() => { navigate('/tests'); window.scrollTo({ top: 0 }); }} className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg shadow-secondary/20 hover:bg-on-secondary-container transition-all active:scale-[0.99]">
<span>View All Tests</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
</section>

<section className="w-full bg-surface-container-low py-space-xl lg:py-24 px-margin">
<div className="max-w-7xl mx-auto flex flex-col gap-space-xl">

<div className="text-center flex flex-col gap-space-xs max-w-2xl mx-auto">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Zero Hassle Experience</span>
<h2 className="font-headline-xl text-headline-xl text-primary">How Doorstep Diagnostics Works</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Simple 4-step workflow connecting medical science directly to your home comfort.</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg relative reveal">

<div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm relative group hover:shadow-lg transition-all">
<div className="flex items-center justify-between mb-space-md">
<span className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline-sm text-headline-sm flex items-center justify-center font-bold">1</span>
<span className="material-symbols-outlined text-secondary text-[28px]">search</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Select Test &amp; Package</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-md">Search your prescribed test, choose a full body wellness package, or upload your doctor’s handwritten prescription slip.</p>
<div className="mt-auto pt-space-sm">
<span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
<span>Prescription scan supported</span>
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
</div>
</div>

<div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm relative group hover:shadow-lg transition-all">
<div className="flex items-center justify-between mb-space-md">
<span className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline-sm text-headline-sm flex items-center justify-center font-bold">2</span>
<span className="material-symbols-outlined text-secondary text-[28px]">pin_drop</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Set Address &amp; Time Slot</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-md">Pick early morning fasting slots (6:00 AM – 10:00 AM) or any convenient 60-minute doorstep window. Auto-pin coordinates with ease.</p>
<div className="mt-auto pt-space-sm">
<span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
<span>60-min express arrival</span>
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
</div>
</div>

<div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm relative group hover:shadow-lg transition-all">
<div className="flex items-center justify-between mb-space-md">
<span className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline-sm text-headline-sm flex items-center justify-center font-bold">3</span>
<span className="material-symbols-outlined text-secondary text-[28px]">vaccines</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Doorstep Phlebotomy</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-md">Trained phlebotomist collects blood with vacuum-sealed sterile BD Vacutainer® tubes. Immediate cold-chain transit box lock.</p>
<div className="mt-auto pt-space-sm">
<span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
<span>Zero sample tampering</span>
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
</div>
</div>

<div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm relative group hover:shadow-lg transition-all">
<div className="flex items-center justify-between mb-space-md">
<span className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm text-headline-sm flex items-center justify-center font-bold">4</span>
<span className="material-symbols-outlined text-on-tertiary-container text-[28px]">chat</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Digital Report &amp; WhatsApp</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-md">Accredited digital report arrives with QR authenticity code within 12-24 hours directly on WhatsApp, Email, and your secure portal.</p>
<div className="mt-auto pt-space-sm">
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1">
<span>Doctor-verified PDF</span>
<span className="material-symbols-outlined text-[14px]">check</span>
</span>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface py-space-xl lg:py-24 px-margin">
<div className="max-w-7xl mx-auto flex flex-col gap-space-xl">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
<div className="flex flex-col gap-space-xs max-w-xl">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Uncompromising Quality</span>
<h2 className="font-headline-xl text-headline-xl text-primary">Why Clinicians &amp; Patients Trust Us</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Diagnostics is not just testing—it is the foundation for 70% of medical decisions. We enforce zero-defect clinical protocols.</p>
</div>
<div className="flex items-center gap-space-sm">
<span className="inline-flex items-center gap-space-xs px-space-lg py-3 rounded-full bg-surface-container text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container">verified_user</span>
            ISO 15189:2022 Certified
          </span>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">

<div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-space-md hover:bg-surface-container transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[28px]">ac_unit</span>
</div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">Strict Temperature-Controlled Cold-Chain</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Every sample travels in calibrated cool boxes maintaining 2°C to 8°C. Real-time temperature logger sensors prevent enzyme deterioration.</p>
</div>
<div className="pt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Active data logging • Nil hemolysis guarantee</div>
</div>

<div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-space-md hover:bg-surface-container transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[28px]">biotech</span>
</div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">Fully Automated NABL &amp; ICMR Testing</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Analyses run on high-throughput robotic platforms (Roche, Abbott, Sysmex) eliminating human manual pipetting errors.</p>
</div>
<div className="pt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Dual-calibrated daily controls (Bio-Rad QC)</div>
</div>

<div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-space-md hover:bg-surface-container transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[28px]">qr_code_2</span>
</div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">100% Barcoded &amp; Sealed Vacutainers</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Blood tubes are barcoded right in front of the patient before collection. Automated laser scanning ensures zero sample swap incidents.</p>
</div>
<div className="pt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Live SMS barcode confirmation upon draw</div>
</div>

<div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-space-md hover:bg-surface-container transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[28px]">speed</span>
</div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">Rapid 12-Hour Reporting Pipeline</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Standard biochemical and hematological reports are validated within 12 hours. Express emergency TAT available for cardiac and critical markers.</p>
</div>
<div className="pt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Instant push to WhatsApp &amp; Patient Vault</div>
</div>

<div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-space-md hover:bg-surface-container transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[28px]">lock</span>
</div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">NABH &amp; HIPAA Compliant Privacy</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Your sensitive health analytics are encrypted at rest with 256-bit AES standards and linked directly to your ABDM Ayushman Bharat health account.</p>
</div>
<div className="pt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Strict data sovereignty • No marketing resales</div>
</div>

<div className="p-space-lg rounded-2xl bg-surface-container-low shadow-sm flex flex-col gap-space-md hover:bg-surface-container transition-colors">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[28px]">clinical_notes</span>
</div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">Free Pathologist Interpretation Notes</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Every report contains color-coded reference ranges, abnormal value flagging, and concise physician notes to help you understand your trends.</p>
</div>
<div className="pt-space-xs font-label-sm text-label-sm text-secondary font-semibold">Tele-consultation add-on ready on request</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-primary text-on-primary py-space-xl lg:py-20 px-margin relative overflow-hidden">

<div className="absolute inset-0 opacity-5 pointer-events-none">
<svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
<pattern height="40" id="grid-pattern" patternunits="userSpaceOnUse" width="40">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1"></path>
</pattern>
<rect fill="url(#grid-pattern)" height="100%" width="100%"></rect>
</svg>
</div>
<div className="max-w-7xl mx-auto flex flex-col gap-space-xl relative z-10">
<div className="grid grid-cols-2 md:grid-cols-4 gap-space-lg text-center reveal">

<div className="flex flex-col items-center gap-space-xs">
<div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-tertiary-fixed mb-space-xs">
<span className="material-symbols-outlined text-[24px]">location_city</span>
</div>
<span className="font-display-lg text-display-lg font-bold text-on-primary">45+</span>
<span className="font-headline-sm text-headline-sm text-primary-fixed">Cities Covered</span>
<span className="font-body-sm text-body-sm text-primary-fixed-dim">Tier-1 &amp; Tier-2 Logistics Grid</span>
</div>

<div className="flex flex-col items-center gap-space-xs">
<div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-secondary-fixed mb-space-xs">
<span className="material-symbols-outlined text-[24px]">description</span>
</div>
<span className="font-display-lg text-display-lg font-bold text-on-primary">1.8M+</span>
<span className="font-headline-sm text-headline-sm text-primary-fixed">Reports Delivered</span>
<span className="font-body-sm text-body-sm text-primary-fixed-dim">100% Digital QR Authenticated</span>
</div>

<div className="flex flex-col items-center gap-space-xs">
<div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-tertiary-fixed mb-space-xs">
<span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
</div>
<span className="font-display-lg text-display-lg font-bold text-tertiary-fixed">99.8%</span>
<span className="font-headline-sm text-headline-sm text-primary-fixed">Test Precision</span>
<span className="font-body-sm text-body-sm text-primary-fixed-dim">Internal &amp; External Quality Audit</span>
</div>

<div className="flex flex-col items-center gap-space-xs">
<div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-secondary-fixed mb-space-xs">
<span className="material-symbols-outlined text-[24px]">star</span>
</div>
<div className="flex items-center gap-1">
<span className="font-display-lg text-display-lg font-bold text-on-primary">4.9</span>
<span className="font-headline-md text-headline-md text-tertiary-fixed">/5</span>
</div>
<span className="font-headline-sm text-headline-sm text-primary-fixed">Patient Rating</span>
<span className="font-body-sm text-body-sm text-primary-fixed-dim">Over 64,000+ Verified Reviews</span>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-space-xl px-margin">
<div className="max-w-7xl mx-auto rounded-3xl bg-surface-container-low p-space-lg md:p-space-xl shadow-xl flex flex-col lg:flex-row items-center justify-between gap-space-xl reveal">
<div className="flex flex-col gap-space-md max-w-xl">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Have a Doctor's Prescription?</span>
<h2 className="font-headline-xl text-headline-xl text-primary">Upload Doctor's Slip. We Select the Exact Tests For You.</h2>
<p className="font-body-md text-body-md text-on-surface-variant">Don't waste time deciphering complex medical shorthand. Our qualified medical team will review your doctor's slip, organize the exact test panel, apply max discounts, and arrange your preferred home collection slot.</p>
<div className="flex items-center gap-space-lg text-on-surface-variant font-label-md text-label-md pt-space-xs">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-on-tertiary-container">done_all</span>Reviewed in 15 mins</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-on-tertiary-container">lock</span>Secure Medical Vault</span>
</div>
</div>
<div className="w-full lg:w-96 rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md text-center">
<div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col items-center justify-center gap-space-xs cursor-pointer hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-secondary text-[36px]">cloud_upload</span>
<span className="font-headline-sm text-headline-sm text-primary text-[16px]">Drop Prescription Here</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Supports PDF, JPG, or PNG (up to 15MB)</span>
<span className="mt-space-xs px-space-md py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm shadow-sm max-sm:px-space-lg max-sm:py-2 max-sm:font-label-md max-sm:text-label-md">Browse Files</span>
</div>
<div className="flex items-center justify-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
<span>Or send directly via WhatsApp:</span>
<a className="inline-flex items-center gap-1 text-on-tertiary-container font-semibold hover:underline" href="#">
<span className="material-symbols-outlined text-[16px]">chat</span>
<span>+91 98200 DIAGN</span>
</a>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-high py-space-xl lg:py-24 px-margin">
<div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-space-lg reveal">
<div className="inline-flex items-center gap-space-xs px-space-lg py-2 rounded-full bg-surface-container-lowest text-secondary font-label-sm text-label-sm shadow-sm max-sm:px-space-xl max-sm:py-3">
<span className="material-symbols-outlined text-[16px]">health_and_safety</span>
<span>Preventive Health Starts with Accurate Markers</span>
</div>
<h2 className="font-headline-xl text-headline-xl sm:font-display-lg sm:text-display-lg text-primary max-w-3xl">
        Your Health Shouldn't Wait. Book Your Home Sample Collection in 2 Minutes.
      </h2>
<p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">
        Zero waiting room queues. Sterile, certified phlebotomists. Precise digital records sent straight to you and your treating physician.
      </p>
<div className="flex flex-wrap items-center justify-center gap-space-md pt-space-xs max-sm:flex-col max-sm:items-stretch">
<a className="inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-xl shadow-secondary/25 hover:bg-on-secondary-container transition-all active:scale-[0.99] max-sm:w-full" href="#quick-catalog">
<span className="material-symbols-outlined text-[20px]">calendar_month</span>
<span>Book Instant Home Slot</span>
</a>
<a className="inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-colors max-sm:w-full" href="tel:18002093424">
<span className="material-symbols-outlined text-[20px] text-secondary">support_agent</span>
<span>Elderly Helpline (Call Support)</span>
</a>
</div>

<div className="flex flex-wrap items-center justify-center gap-space-lg pt-space-md text-on-surface-variant font-body-sm text-body-sm">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container">credit_card</span>
          Pay online or cash after home sample collection
        </span>
<span>•</span>
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container">verified</span>
          Authenticity QR on every generated pathology report
        </span>
</div>
</div>
</section>
</div>
</main>
    </>
  );
}
