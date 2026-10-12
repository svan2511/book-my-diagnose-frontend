import { useNavigate } from 'react-router-dom';
import { useDataPathNav } from '../hooks/useDataPathNav';

export default function About() {
  const navigate = useNavigate();
  useDataPathNav();
  const go = (to) => { navigate(to); window.scrollTo({ top: 0 }); };

  return (
    <main className="w-full pt-20 bg-surface flex-1 home-polish">
      <div className="flex flex-col w-full">
        {/* Premium Hero */}
        <section className="relative w-full overflow-hidden bg-primary text-on-primary px-margin pt-space-xl pb-space-xl lg:pt-20 lg:pb-24">
          {/* mesh glows + dot texture */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(620px 320px at 10% 6%, rgba(57,184,253,0.25), transparent 60%), radial-gradient(560px 340px at 90% 18%, rgba(45,212,191,0.20), transparent 60%), radial-gradient(720px 420px at 50% 115%, rgba(57,184,253,0.14), transparent 60%)' }}></div>
          <div className="absolute inset-0 opacity-[0.13] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)', backgroundSize: '22px 22px' }}></div>
          <div className="absolute -bottom-32 left-1/3 w-[560px] h-[280px] bg-secondary/20 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
            {/* Left copy */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <nav className="flex items-center gap-2 font-label-sm text-label-sm text-primary-fixed-dim">
                <button onClick={() => go('/')} className="hover:text-on-primary transition-colors" type="button">Home</button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-primary font-semibold">About Us</span>
              </nav>
              <span className="inline-flex w-fit items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur font-label-sm text-label-sm text-on-primary">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[10px] tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed animate-pulse"></span> Since 2021
                </span>
                NABL &amp; ICMR Accredited Network
              </span>
              <h1 className="font-display-lg text-display-lg tracking-tight leading-[1.08]">
                Diagnostics you can <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed via-secondary-container to-tertiary-fixed">trust</span>, delivered to your doorstep.
              </h1>
              <p className="font-body-lg text-body-lg text-primary-fixed max-w-xl leading-relaxed">
                Book My Diagnose brings certified labs, cold-chain phlebotomy and clinician-reviewed
                reports to 45+ cities — accurate results on WhatsApp within 12–24 hours.
              </p>
              <div className="flex flex-wrap gap-space-sm pt-space-xs max-sm:flex-col max-sm:items-stretch">
                <button onClick={() => go('/book')} className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg shadow-[0_8px_28px_rgba(14,165,233,0.4)] hover:bg-on-secondary-container hover:-translate-y-0.5 transition-all max-sm:w-full max-sm:justify-center" type="button">
                  <span className="material-symbols-outlined text-[20px]">biotech</span> Book a Home Test
                </button>
                <button onClick={() => go('/contact')} className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-xl border border-white/25 bg-white/5 backdrop-blur text-on-primary font-label-lg text-label-lg hover:bg-white/15 transition-colors max-sm:w-full max-sm:justify-center" type="button">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span> Contact Us
                </button>
              </div>
              {/* trust row */}
              <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                <div className="flex -space-x-2.5">
                  {[
                    ['RK', 'from-sky-400 to-blue-600'],
                    ['PS', 'from-teal-400 to-emerald-600'],
                    ['AM', 'from-indigo-400 to-violet-600'],
                    ['2L', 'from-amber-400 to-orange-600'],
                  ].map(([init, grad]) => (
                    <span key={init} className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} ring-2 ring-primary flex items-center justify-center font-label-sm text-label-sm text-white font-bold`}>{init}</span>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-amber-300">
                    {['star', 'star', 'star', 'star', 'star_half'].map((ic, i) => (
                      <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ic}</span>
                    ))}
                    <span className="font-label-md text-label-md text-on-primary ml-1">4.9/5</span>
                  </span>
                  <span className="font-body-sm text-body-sm text-primary-fixed">Loved by 2,40,000+ patients &amp; families</span>
                </div>
              </div>
            </div>

            {/* Right visual */}
            <div className="lg:col-span-5 relative hidden md:block">
              <div className="relative mx-auto max-w-sm">
                <div className="absolute -inset-6 bg-gradient-to-tr from-secondary/30 via-transparent to-tertiary-fixed/20 blur-2xl rounded-[2rem] pointer-events-none"></div>
                {/* main report card */}
                <div className="animate-floaty relative rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-2xl p-space-lg flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/20 border border-tertiary-fixed/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-tertiary-fixed">verified</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-primary">Report Ready</span>
                        <span className="font-body-sm text-body-sm text-primary-fixed">Lipid Profile • #BK-2026-008492</span>
                      </div>
                    </div>
                    <span className="px-space-sm py-1 rounded-full bg-tertiary-fixed/20 border border-tertiary-fixed/30 text-tertiary-fixed font-label-sm text-label-sm">Normal</span>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    {[
                      ['Total Cholesterol', '178 mg/dL', 'w-[72%] from-emerald-400 to-teal-500'],
                      ['HDL Good', '58 mg/dL', 'w-[64%] from-sky-400 to-cyan-500'],
                      ['LDL Bad', '96 mg/dL', 'w-[48%] from-sky-400 to-blue-600'],
                    ].map(([label, val, bar]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between font-body-sm text-body-sm">
                          <span className="text-primary-fixed">{label}</span>
                          <span className="text-on-primary font-semibold">{val}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${bar}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 font-body-sm text-body-sm text-primary-fixed">
                      <span className="material-symbols-outlined text-[16px]">qr_code_2</span> Authenticity QR verified
                    </span>
                    <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-tertiary-fixed">
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
                    </span>
                  </div>
                </div>
                {/* floating cold-chain chip */}
                <div className="animate-floaty-delayed absolute -left-10 top-8 rounded-xl bg-white/[0.1] border border-white/15 backdrop-blur-xl px-space-md py-space-sm shadow-xl flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-secondary-fixed">ac_unit</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-primary">Cold-chain live</span>
                    <span className="font-body-sm text-body-sm text-tertiary-fixed font-semibold">4.2°C • Sealed</span>
                  </div>
                </div>
                {/* floating dispatch chip */}
                <div className="animate-floaty-delayed absolute -right-6 -bottom-6 rounded-xl bg-secondary text-on-secondary px-space-md py-space-sm shadow-[0_12px_32px_rgba(14,165,233,0.45)] flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm">Phlebotomist nearby</span>
                    <span className="font-label-md text-label-md font-bold">Arriving in 25 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-7xl mx-auto px-margin py-space-xl w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
            {[
              ['1.8M+', 'Samples Tested'],
              ['99.8%', 'Accuracy Rate'],
              ['45+', 'Cities Served'],
              ['12–24h', 'Report Turnaround'],
            ].map(([v, l]) => (
              <div key={l} className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40">
                <span className="font-headline-md text-headline-md text-primary font-bold">{v}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{l}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mission + values */}
        <section className="max-w-7xl mx-auto px-margin pb-space-xl w-full grid grid-cols-1 lg:grid-cols-2 gap-space-xl">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-sm border border-outline-variant/40 flex flex-col gap-space-md">
            <span className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm w-fit">
              <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">verified</span> Our Mission
            </span>
            <h2 className="font-headline-xl text-headline-xl text-primary">Accurate diagnostics, without the clinic visit.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              We bring certified sample collection to your doorstep — barcoded vials, 2°C–8°C cold-chain
              transit and double-verified phlebotomists — so every report your doctor sees is one you can trust.
            </p>
            <ul className="flex flex-col gap-space-sm pt-space-xs">
              {[
                'NABL & ICMR certified laboratory network',
                'Barcoded, tamper-sealed sample kits',
                'Double-vaccinated, background-verified collectors',
                'Digital reports on WhatsApp + authenticity QR',
              ].map((x) => (
                <li key={x} className="flex items-start gap-space-sm font-body-md text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-on-tertiary-container shrink-0">task_alt</span> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-space-lg">
            <div className="bg-primary text-on-primary rounded-2xl p-space-xl shadow-md flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs text-secondary-fixed">
                <span className="material-symbols-outlined text-[20px]">ac_unit</span>
                <span className="font-headline-sm text-headline-sm text-[15px]">Smart Cold-Chain Promise</span>
              </div>
              <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
                Every home visit kit travels in an IoT-monitored 2°C–8°C container from your doorstep to the
                central analyzer — sample integrity, guaranteed.
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-sm border border-outline-variant/40 flex flex-col gap-space-md">
              <h3 className="font-headline-lg text-headline-lg text-primary">Why families choose us</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {[
                  ['bolt', '60-min dispatch', 'Phlebotomist at home within the hour in live zones.'],
                  ['shield_with_heart', 'Hygiene first', 'Single-use sterile kits opened in front of you.'],
                  ['lock', 'Private by design', '256-bit encrypted health vault, ABDM ready.'],
                  ['currency_rupee', 'Honest pricing', 'Upfront MRP vs offer price on every test.'],
                ].map(([icon, h, p]) => (
                  <div key={h} className="flex flex-col gap-1">
                    <span className="material-symbols-outlined text-[24px] text-secondary">{icon}</span>
                    <span className="font-label-lg text-label-lg text-primary">{h}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our story timeline */}
        <section className="w-full bg-surface-container-low py-space-xl px-margin">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Our Journey</span>
              <h2 className="font-headline-xl text-headline-xl text-primary">From one Mumbai lab to 45+ cities.</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                What started as a single accredited lab is today one of India&apos;s most trusted doorstep
                diagnostic networks — built on accuracy, hygiene and honest pricing.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {[
                ['2021', 'The first lab', 'Bandra Central Lab opens with NABL accreditation and 40 in-house tests.'],
                ['2023', '1 million samples', 'Doorstep collection launches across Mumbai, Delhi NCR and Bengaluru.'],
                ['2025', '45+ cities live', 'IoT cold-chain fleet + WhatsApp reports roll out nationally.'],
                ['2026', 'ABDM partner', 'GOI Digital Health Mission partner with encrypted health vault.'],
              ].map(([yr, h, p]) => (
                <div key={yr} className="relative bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/40 flex flex-col gap-space-xs overflow-hidden">
                  <span className="font-currency-display text-currency-display text-secondary">{yr}</span>
                  <span className="font-label-lg text-label-lg text-primary">{h}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="max-w-7xl mx-auto px-margin py-space-xl w-full">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl shadow-sm border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Accredited & Audited</span>
              <h2 className="font-headline-xl text-headline-xl text-primary">Certifications that actually mean something.</h2>
            </div>
            <div className="flex flex-wrap gap-space-sm">
              {[
                ['verified', 'NABL Accredited'],
                ['science', 'ICMR Approved'],
                ['shield', 'ISO 15189 Certified'],
                ['task_alt', 'CAP Compliant'],
                ['lock', 'NABH & HIPAA Privacy'],
                ['hub', 'ABDM Partner'],
              ].map(([icon, label]) => (
                <span key={label} className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-full bg-surface-container text-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span> {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="max-w-7xl mx-auto px-margin pb-space-xl w-full flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Medical Leadership</span>
            <h2 className="font-headline-xl text-headline-xl text-primary">Doctors run the lab. Not marketers.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Every report is reviewed by a qualified pathologist before it reaches you or your doctor.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[
              ['AM', 'Dr. Arvind Mehta', 'Chief Pathologist • MD Pathology, 18 yrs', 'Signs off every critical-value report personally.'],
              ['SP', 'Dr. Sunita Patil', 'Head of Quality • NABL Assessor', 'Owns calibration, controls and lab audits across hubs.'],
              ['RK', 'Rahul Khanna', 'Head of Home Collection', 'Trains 400+ phlebotomists on hygiene & cold-chain SOP.'],
            ].map(([init, name, role, bio]) => (
              <div key={name} className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/40 flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0">{init}</div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-primary">{name}</span>
                    <span className="font-body-sm text-body-sm text-secondary">{role}</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">{bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Patient stories — premium */}
        <section className="relative w-full overflow-hidden px-margin py-space-xl lg:py-24 text-on-primary" style={{ background: 'linear-gradient(135deg, #002532 0%, #0c3c4c 55%, #003f38 100%)' }}>
          {/* ambient decor */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(560px 300px at 85% 10%, rgba(45,212,191,0.18), transparent 60%), radial-gradient(640px 340px at 8% 95%, rgba(57,184,253,0.16), transparent 60%)' }}></div>
          <div className="absolute inset-0 opacity-[0.10] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <span className="material-symbols-outlined absolute -top-6 right-6 text-[220px] leading-none text-white/[0.05] pointer-events-none select-none" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>

          <div className="max-w-7xl mx-auto flex flex-col gap-space-xl relative z-10">
            {/* header + rating badge */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs max-w-2xl">
                <span className="inline-flex w-fit items-center gap-2 px-space-md py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur font-label-sm text-label-sm text-tertiary-fixed font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span> Patient Stories
                </span>
                <h2 className="font-headline-xl text-headline-xl text-on-primary">Loved by families managing <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-fixed to-tertiary-fixed">real health</span>.</h2>
                <p className="font-body-md text-body-md text-primary-fixed max-w-xl">Unfiltered words from homes we visit every morning — seniors, new parents and busy professionals.</p>
              </div>
              <div className="flex items-center gap-space-md rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl px-space-lg py-space-md shadow-xl w-fit">
                <span className="font-display-lg text-display-lg text-on-primary font-extrabold leading-none">4.9</span>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-0.5 text-amber-300">
                    {['star', 'star', 'star', 'star', 'star'].map((ic, i) => (
                      <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ic}</span>
                    ))}
                  </span>
                  <span className="font-body-sm text-body-sm text-primary-fixed">12,400+ verified reviews</span>
                </div>
              </div>
            </div>

            {/* cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md lg:gap-space-lg">
              {[
                ['MK', 'Meera K.', 'Mumbai • Full Body Package', 'from-sky-400 to-blue-600', 'My father is 78 and diabetic. The collector came at 7 AM sharp, fasting sample done in 10 minutes, report on WhatsApp by evening.', false],
                ['SR', 'Suresh R.', 'Bengaluru • Thyroid Care', 'from-teal-400 to-emerald-600', 'Thyroid + lipid every 3 months for my mother. Same phlebotomist each time, sealed kit opened in front of us. Full trust.', true],
                ['AD', 'Ananya D.', 'Delhi NCR • Diabetes HbA1c', 'from-indigo-400 to-violet-600', 'Booked a full-body package for both parents. Video-verified collector, cold-chain box, doctor called to explain the report.', false],
              ].map(([init, name, meta, grad, quote, featured], ci) => (
                <figure key={name} style={{ animationDelay: `${ci * 0.5}s` }} className={`relative rounded-2xl p-space-lg flex flex-col gap-space-md t-card bounce-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 ${featured ? 'bg-white/[0.11] border border-tertiary-fixed/40 shadow-[0_20px_50px_rgba(45,212,191,0.18)] lg:-translate-y-2' : 'bg-white/[0.07] border border-white/15 shadow-xl hover:shadow-2xl'}`}>
                  {featured && (
                    <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider text-[10px]">Most loved</span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="t-stars items-center gap-0.5 text-amber-300">
                      {['star', 'star', 'star', 'star', 'star'].map((ic, i) => (
                        <span key={i} className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ic}</span>
                      ))}
                    </span>
                    <span className="material-symbols-outlined text-[26px] text-white/20">format_quote</span>
                  </div>
                  <blockquote className="font-body-md text-body-md text-on-primary leading-relaxed flex-1">{quote}</blockquote>
                  <figcaption className="flex items-center gap-space-sm pt-space-sm border-t border-white/10">
                    <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-label-sm text-label-sm text-white font-bold shrink-0`}>{init}</span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-primary flex items-center gap-1.5">{name}
                        <span className="inline-flex items-center gap-0.5 text-tertiary-fixed font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[13px]">verified</span> Verified
                        </span>
                      </span>
                      <span className="font-body-sm text-body-sm text-primary-fixed">{meta}</span>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* mini stats */}
            <div className="grid grid-cols-3 gap-space-sm rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur px-space-lg py-space-md">
              {[
                ['2.4L+', 'Happy patients'],
                ['92%', 'Repeat bookings'],
                ['60 min', 'Avg. dispatch'],
              ].map(([v, l]) => (
                <div key={l} className="flex flex-col items-center text-center gap-0.5">
                  <span className="font-headline-md text-headline-md text-on-primary font-bold">{v}</span>
                  <span className="font-body-sm text-body-sm text-primary-fixed">{l}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-space-sm max-sm:flex-col max-sm:items-stretch">
              <button onClick={() => go('/book')} className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg shadow-[0_8px_28px_rgba(14,165,233,0.4)] hover:bg-on-secondary-container hover:-translate-y-0.5 transition-all max-sm:w-full max-sm:justify-center" type="button">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span> Book Instant Home Slot
              </button>
              <button onClick={() => go('/contact')} className="inline-flex items-center gap-space-sm px-space-xl py-space-md rounded-xl border border-white/25 bg-white/5 backdrop-blur text-on-primary font-label-lg text-label-lg hover:bg-white/15 transition-colors max-sm:w-full max-sm:justify-center" type="button">
                <span className="material-symbols-outlined text-[20px]">support_agent</span> Talk to Care Desk
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
