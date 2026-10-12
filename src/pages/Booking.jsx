import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import { usePageReady } from '../hooks/usePageReady';
import PhoneInput from '../components/PhoneInput';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Request failed.');
  return data;
}

const normPhone = (v) => {
  let d = String(v || '').replace(/\D+/g, '');
  if (d.length > 10) d = d.replace(/^(91|0)/, '');
  return d;
};
const validPhone = (v) => /^[6-9]\d{9}$/.test(normPhone(v));

const STEPS = ['Test', 'Patient', 'Location', 'Review'];

// GPS fix quality bands (metres, as reported by the browser).
const geoTone = (acc) => {
  const a = Number(acc);
  if (!Number.isFinite(a)) return 'rough';
  if (a <= 100) return 'good';
  if (a <= 2000) return 'fair';
  return 'rough';
};
const fmtAcc = (acc) => {
  const a = Number(acc);
  if (!Number.isFinite(a)) return '?';
  return a >= 10000 ? `±${Math.round(a / 1000)} km` : `±${Math.round(a)} m`;
};

// Free, keyless reverse-geocoding: OSM Nominatim first (street-level),
// BigDataCloud as fallback. Never throws — null means "type manually".
async function reverseGeocode(latitude, longitude) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&zoom=18&accept-language=en`);
    if (r.ok) {
      const j = await r.json();
      const a = j.address || {};
      const road = [a.house_number, a.road].filter(Boolean).join(' ');
      const city = a.city || a.town || a.village || a.hamlet || a.county || '';
      let area = a.suburb || a.neighbourhood || a.quarter || '';
      if (area && city && area.toLowerCase() === city.toLowerCase()) area = '';
      const pin = String(a.postcode || '').replace(/\s/g, '');
      const out = {
        address: road || '',
        area,
        city,
        state: a.state || '',
        pincode: /^\d{6}$/.test(pin) ? pin : '',
      };
      if (out.city || out.address) return out;
    }
  } catch { /* fall through to backup source */ }
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
    const g = await r.json();
    const city = g.city || g.locality || '';
    let area = g.locality || '';
    if (area && city && area.toLowerCase() === city.toLowerCase()) area = '';
    return {
      address: '',
      area,
      city,
      state: g.principalSubdivision || '',
      pincode: /^\d{6}$/.test(String(g.postcode || '')) ? g.postcode : '',
    };
  } catch { return null; }
}

const inputCls = 'h-12 px-4 rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary font-body-md text-body-md w-full placeholder:text-outline disabled:opacity-60';
const labelCls = 'font-label-lg text-label-lg text-primary';

function AutoTag({ on }) {
  if (!on) return null;
  return <span className="ml-1.5 px-1.5 py-px rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-label-sm text-[10px] font-semibold align-middle">auto</span>;
}

function Stepper({ step }) {  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className={`flex items-center gap-2 p-3 rounded-xl ${active ? 'bg-secondary text-on-secondary shadow-md' : done ? 'bg-surface-container text-secondary' : 'bg-surface-container-lowest text-on-surface-variant opacity-70'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${active ? 'bg-white/25' : done ? 'bg-secondary text-on-secondary' : 'bg-surface-container'}`}>
              {done ? <span className="material-symbols-outlined text-[18px]">check</span> : n}
            </span>
            <span className="font-label-md text-label-md font-semibold">Step {n} • {label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Booking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signalReady = usePageReady();
  const testParam = params.get('test') || '';

  const [step, setStep] = useState(1);
  const [test, setTest] = useState(null);
  const [testLoading, setTestLoading] = useState(!!testParam);
  const [testError, setTestError] = useState('');

  // Test picker (when landing on /book directly)
  const [pq, setPq] = useState('');
  const [plist, setPlist] = useState([]);
  const [plistLoading, setPlistLoading] = useState(false);

  const [patient, setPatient] = useState({ name: '', age: '', gender: '', phone: '', email: '' });
  const [loc, setLoc] = useState({ address: '', area: '', city: '', state: '', pincode: '', landmark: '', latitude: '', longitude: '', accuracy: '', geo: 'idle', insecure: false, auto: [] });

  // Manual edits clear the "auto-filled" tag for that field.
  const setL = (k, v) => setLoc((l) => ({ ...l, [k]: v, auto: (l.auto || []).filter((f) => f !== k) }));
  const autoOn = (k) => (loc.auto || []).includes(k);
  // Address form stays hidden until location is received, then shows auto-filled.

  // A field is free to auto-fill when empty OR holding an earlier auto value
  // (GPS guess, then pincode correction). User-typed text is never overwritten.
  const canTake = (l, k) => !String(l[k] || '').trim() || (l.auto || []).includes(k);

  // Desktop fix: no GPS there, but everyone knows their pincode.
  // 6 digits complete hote hi official postal data se city/state verify+fill.
  const handlePincode = (digits) => {
    setL('pincode', digits);
    if (digits.length !== 6) return;
    const pin = digits;
    (async () => {
      try {
        const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const j = await r.json();
        const po = j?.[0]?.PostOffice?.[0];
        if (!po || j?.[0]?.Status !== 'Success') return;
        setLoc((l) => {
          if (l.pincode !== pin) return l; // user typed ahead — stale result
          const filled = {};
          if (canTake(l, 'city') && po.District) filled.city = po.District;
          if (canTake(l, 'state') && po.State) filled.state = po.State;
          if (!Object.keys(filled).length) return l;
          return { ...l, ...filled, auto: [...new Set([...(l.auto || []), ...Object.keys(filled)])] };
        });
      } catch { /* manual entry remains */ }
    })();
  };
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(null);

  // Load pre-selected test
  useEffect(() => {
    if (!testParam) {
      setTestLoading(false);
      return;
    }
    let live = true;
    (async () => {
      setTestLoading(true);
      setTestError('');
      try {
        const d = await getJSON(`/tests/${encodeURIComponent(testParam)}`);
        if (live) setTest(d.data);
      } catch (e) {
        if (live) setTestError(e.message || 'Could not load the selected test.');
      } finally {
        if (live) {
          setTestLoading(false);
          signalReady();
        }
      }
    })();
    return () => { live = false; };
  }, [testParam, signalReady]);

  // Picker list
  const loadPicker = useCallback(async (query) => {
    setPlistLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: '8', sort: '-created_at' });
      if (query) qs.set('search', query);
      const d = await getJSON(`/tests?${qs}`);
      setPlist(d.data);
    } catch {
      setPlist([]);
    } finally {
      setPlistLoading(false);
      signalReady();
    }
  }, [signalReady]);

  useEffect(() => {
    if (testParam || test) return;
    const t = setTimeout(() => loadPicker(pq.trim()), pq ? 400 : 0);
    return () => clearTimeout(t);
  }, [pq, testParam, test, loadPicker]);

  const useMyLocation = () => {
    // Plain http (LAN IP) par browser location deta hi nahi — Allow ka popup
    // kabhi aayega hi nahi, isliye retry loop me phasne ke bajaye seedha batao.
    if (!window.isSecureContext || !navigator.geolocation) {
      setLoc((l) => ({ ...l, geo: 'denied', insecure: !window.isSecureContext }));
      return;
    }
    setLoc((l) => ({ ...l, geo: 'locating', insecure: false }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const acc = Math.round(accuracy || 0);
        setLoc((l) => ({ ...l, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6), accuracy: acc, geo: 'ok', insecure: false }));
        // Best-effort reverse geocode to prefill street/area/city/state/pincode.
        // Only empty fields are filled — user typing is never overwritten.
        // TRUST GATE: a rough IP-guess (±2 km se zyada) can name the WRONG
        // city — and wrong city means wrong local collector. So auto-fill
        // runs only on a usable fix; on rough fixes the user types city/state.
        if (acc <= 2000) {
          const g = await reverseGeocode(latitude, longitude);
          if (g) {
            setLoc((l) => {
              const filled = {};
              for (const k of ['address', 'area', 'city', 'state', 'pincode']) {
                if (canTake(l, k) && g[k]) filled[k] = g[k];
              }
              if (!Object.keys(filled).length) return l;
              return { ...l, ...filled, auto: [...new Set([...(l.auto || []), ...Object.keys(filled)])] };
            });
          }
        }
      },
      () => setLoc((l) => ({ ...l, geo: 'denied' })),
      // maximumAge: 0 — kabhi purana cached fix mat uthao, hamesha fresh GPS.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const validatePatient = () => {
    const errs = {};
    if (!patient.name.trim()) errs.name = 'Full name is required.';
    const age = Number(patient.age);
    if (patient.age === '' || !Number.isInteger(age) || age < 0 || age > 120) errs.age = 'Enter a valid age (0–120).';
    if (!['male', 'female', 'other'].includes(patient.gender)) errs.gender = 'Select gender.';
    if (!validPhone(patient.phone)) errs.phone = 'Enter a valid 10-digit mobile number.';
    if (patient.email.trim() && !/^\S+@\S+\.\S+$/.test(patient.email.trim())) errs.email = 'Enter a valid email.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLocation = () => {
    const errs = {};
    // GPS fix is mandatory — we only accept orders we can locate.
    if (loc.geo !== 'ok' || loc.latitude === '' || loc.longitude === '') {
      errs.geo = 'Pehle "Use My Current Location" dabakar location allow karein — bina GPS location ke booking aage nahi badhegi.';
    }
    if (!loc.address.trim()) errs.address = 'Address is required.';
    if (!loc.city.trim()) errs.city = 'City is required.';
    if (!loc.state.trim()) errs.state = 'State is required.';
    if (!/^\d{6}$/.test(loc.pincode.trim())) errs.pincode = 'Pincode must be 6 digits.';
    if (!loc.landmark.trim()) errs.landmark = 'Landmark helps our collector find you.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    setError('');
    if (step === 1 && !test) {
      setError('Please select a test first.');
      return;
    }
    if (step === 2 && !validatePatient()) return;
    if (step === 3 && !validateLocation()) return;
    setFieldErrors({});
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    if (!consent) {
      setError('Please confirm the information is correct.');
      return;
    }
    // Double-guard: never submit without a GPS fix, even if steps were skipped.
    if (loc.geo !== 'ok' || loc.latitude === '' || loc.longitude === '') {
      setError('Location verification is missing. Please go back and share your current location.');
      setStep(3);
      window.scrollTo({ top: 0 });
      return;
    }
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    const phone = normPhone(patient.phone);
    const body = {
      test_ids: [test.id],
      name: patient.name.trim(),
      phone,
      email: patient.email.trim() || null,
      age: Number(patient.age),
      gender: patient.gender,
      patient_name: patient.name.trim(),
      patient_age: Number(patient.age),
      patient_gender: patient.gender,
      patient_phone: phone,
      patient_email: patient.email.trim() || null,
      address: loc.address.trim(),
      area: loc.area.trim() || null,
      city: loc.city.trim(),
      state: loc.state.trim(),
      pincode: loc.pincode.trim(),
      landmark: loc.landmark.trim(),
      latitude: loc.latitude === '' ? null : Number(loc.latitude),
      longitude: loc.longitude === '' ? null : Number(loc.longitude),
      location_accuracy: loc.accuracy === '' ? null : Number(loc.accuracy),
    };
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.errors) {
          // Backend keys (patient_phone, test_ids.0, latitude…) don't match the
          // form's field names — translate them so the message shows up under
          // the right input and the user lands on the right step.
          const fe = {};
          let targetStep = null;
          Object.entries(data.errors).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v[0] : String(v);
            if (k.startsWith('test_ids')) {
              targetStep = 1;
              fe.test = 'The selected test is no longer available. Please choose again.';
            } else if (k.startsWith('patient_') || ['name', 'phone', 'email', 'age', 'gender'].includes(k)) {
              fe[k.replace(/^patient_/, '')] = msg;
              targetStep = targetStep ?? 2;
            } else if (['address', 'area', 'city', 'state', 'pincode', 'landmark'].includes(k)) {
              fe[k] = msg;
              targetStep = targetStep ?? 3;
            } else if (['latitude', 'longitude', 'location_accuracy'].includes(k)) {
              fe.geo = /required/i.test(msg) ? 'Please tap "Use My Current Location" and allow GPS access.' : msg;
              targetStep = targetStep ?? 3;
            } else {
              fe[k] = msg;
            }
          });
          setFieldErrors(fe);
          if (targetStep) {
            setStep(targetStep);
            window.scrollTo({ top: 0 });
          }
          throw new Error(fe.test || 'Please fix the highlighted fields below.');
        }
        throw new Error(data?.message || 'Booking failed. Please try again.');
      }
      setDone(data.data);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const b = done;
    return (
      <main className="w-full pt-20 bg-surface flex-1">
        <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col items-center text-center gap-space-md">
          <span className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-emerald-600">check_circle</span>
          </span>
          <h1 className="font-headline-xl text-headline-xl text-primary">Booking Confirmed!</h1>
          <div className="flex items-center gap-2">
            <span className="font-mono font-headline-md text-headline-md text-secondary bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm">{b.booking_number}</span>
          </div>
          <div className="w-full rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg text-left flex flex-col gap-2 font-body-md text-body-md">
            <p><strong>Test:</strong> {(b.tests || []).map((t) => `${t.name} (${t.code})`).join(', ')}</p>
            <p><strong>Patient:</strong> {b.patient?.name}, {b.patient?.age} yrs • {b.patient?.gender}</p>
            <p><strong>Phone:</strong> <span className="font-mono">+91 {b.patient?.phone}</span></p>
            <p><strong>Collection address:</strong> {[b.location?.address, b.location?.area, b.location?.city, b.location?.state, b.location?.pincode].filter(Boolean).join(', ')}</p>
            <p><strong>Landmark:</strong> {b.location?.landmark}</p>
            <p><strong>Amount:</strong> {inr(b.total)} (pay on collection)</p>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">Our collection staff will contact you and visit the address for sample collection. Track progress anytime below.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={`/tracking?booking=${encodeURIComponent(b.booking_number)}&phone=${encodeURIComponent(b.patient?.phone || '')}`} className="px-6 py-3 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container">Track Booking</Link>
            <Link to="/" className="px-6 py-3 rounded-lg bg-surface-container text-primary font-label-lg text-label-lg hover:bg-surface-container-high">Back to Home</Link>
          </div>
        </div>
      </main>
    );
  }

  const err = (k) => fieldErrors[k] && <span className="font-body-sm text-body-sm text-error">{fieldErrors[k]}</span>;

  return (
    <main className="w-full pt-20 bg-surface flex-1">
      <div className="max-w-5xl mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
        <Stepper step={step} />
        {error && <div role="alert" className="rounded-xl bg-error-container text-on-error-container px-4 py-3 font-body-md text-body-md">{error}</div>}

        {step === 1 && (
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-space-lg flex flex-col gap-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">Select a test</h2>
            {testLoading ? (
              <div className="h-32 rounded-xl bg-surface-container-low animate-pulse" />
            ) : test ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-container-low">
                <div>
                  <p className="font-mono font-label-sm text-label-sm text-secondary">{test.code}</p>
                  <p className="font-headline-sm text-headline-sm text-primary">{test.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{test.sample_type} • Report in {test.turnaround_hours}h</p>
                </div>
                <p className="font-currency-display text-currency-display text-primary">{inr(test.price)}</p>
              </div>
            ) : (
              <>
                {testError && <p role="alert" className="font-body-md text-body-md text-error">{testError} Pick one below.</p>}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary text-[20px]">search</span>
                  <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Search test name or code…" className="bg-transparent outline-none w-full font-body-md text-body-md placeholder:text-outline" aria-label="Search tests" />
                  {plistLoading && <span className="material-symbols-outlined text-secondary text-[20px] animate-spin">refresh</span>}
                </div>
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                  {plist.map((t) => (
                    <button key={t.id} type="button" onClick={() => { setTest(t); setError(''); }} className="text-left p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between gap-2 transition-colors">
                      <span><strong className="font-label-md text-label-md text-primary">{t.name}</strong> <span className="font-mono font-body-sm text-body-sm text-secondary">{t.code}</span><br /><span className="font-body-sm text-body-sm text-on-surface-variant">{t.parameter_count} params • {t.turnaround_hours}h</span></span>
                      <strong className="font-currency-display text-currency-display text-primary whitespace-nowrap">{inr(t.price)}</strong>
                    </button>
                  ))}
                  {!plistLoading && !plist.length && <p className="font-body-md text-body-md text-on-surface-variant text-center py-4">Type to search 350+ tests…</p>}
                </div>
              </>
            )}
            {test && <button type="button" onClick={() => navigate('/tests')} className="self-start font-label-md text-label-md text-secondary font-semibold hover:underline">← Change test</button>}
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-space-lg flex flex-col gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Patient details</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">lock</span>Your personal information is securely protected.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5"><span className={labelCls}>Full Name *</span><input value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} placeholder="e.g. Sunita Sharma" className={inputCls} />{err('name')}</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5"><span className={labelCls}>Age *</span><input value={patient.age} onChange={(e) => setPatient({ ...patient, age: e.target.value.replace(/\D+/g, '').slice(0, 3) })} placeholder="48" inputMode="numeric" className={inputCls} />{err('age')}</label>
                <label className="flex flex-col gap-1.5"><span className={labelCls}>Gender *</span>
                  <select value={patient.gender} onChange={(e) => setPatient({ ...patient, gender: e.target.value })} className={`${inputCls} cursor-pointer`}>
                    <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>{err('gender')}</label>
              </div>
              <label className="flex flex-col gap-1.5"><span className={labelCls}>Phone Number *</span><PhoneInput value={patient.phone} onChange={(v) => setPatient({ ...patient, phone: v })} />{err('phone')}</label>
              <label className="flex flex-col gap-1.5"><span className={labelCls}>Email (optional)</span><input value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} placeholder="you@example.com" type="email" className={inputCls} />{err('email')}</label>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-space-lg flex flex-col gap-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">Where should we collect your sample?</h2>
            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="font-body-md text-body-md text-on-surface-variant">Share GPS so our collector reaches you fast. You can always correct the address below.</p>
              <button type="button" onClick={useMyLocation} disabled={loc.geo === 'locating'} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-on-secondary-container disabled:opacity-60">
                <span className={`material-symbols-outlined text-[18px] ${loc.geo === 'locating' ? 'animate-spin' : ''}`}>{loc.geo === 'locating' ? 'refresh' : 'near_me'}</span>
                {loc.geo === 'locating' ? 'Locating…' : loc.geo === 'ok' ? 'Refresh Location' : loc.geo === 'denied' ? 'Dobara Try Karein' : 'Use My Current Location'}
              </button>
            </div>
            {loc.geo === 'ok' && geoTone(loc.accuracy) === 'good' && <p role="status" className="flex items-center gap-2 font-body-md text-body-md text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5"><span className="material-symbols-outlined text-[18px]">check_circle</span>Accurate location found ({fmtAcc(loc.accuracy)}). Fields below are pre-filled — please verify.</p>}
            {loc.geo === 'ok' && geoTone(loc.accuracy) === 'fair' && <p role="status" className="flex items-center gap-2 font-body-md text-body-md text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5"><span className="material-symbols-outlined text-[18px]">location_searching</span>Approximate location ({fmtAcc(loc.accuracy)}). Please check and correct the address below.</p>}
            {loc.geo === 'ok' && geoTone(loc.accuracy) === 'rough' && <p role="status" className="flex items-center gap-2 font-body-md text-body-md text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5"><span className="material-symbols-outlined text-[18px]">wrong_location</span>Very rough location ({fmtAcc(loc.accuracy)}) — please enter your address, city and landmark manually.</p>}
            {loc.geo === 'denied' && <p role="alert" className="font-body-md text-body-md text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">{loc.insecure ? 'Ye link phone location support nahi karta — https wale link se kholein.' : 'Location nahi mil payi — Location Allow karke Dobara Try Karein dabayein.'}</p>}
            {loc.geo === 'ok' && <p role="status" className="flex items-center gap-2 font-body-md text-body-md text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-4 py-2.5"><span className="material-symbols-outlined text-[18px]">edit_note</span>If the city or state looks wrong, tap the field and correct it manually.</p>}
            {fieldErrors.geo && <p role="alert" className="font-body-md text-body-md text-error bg-error-container rounded-lg px-4 py-2.5">{fieldErrors.geo}</p>}
            {loc.geo === 'locating' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse" aria-hidden="true">
                <div className="h-12 rounded-lg bg-surface-container-low sm:col-span-2" />
                <div className="h-12 rounded-lg bg-surface-container-low sm:col-span-2" />
                <div className="h-12 rounded-lg bg-surface-container-low" />
                <div className="h-12 rounded-lg bg-surface-container-low" />
                <div className="h-12 rounded-lg bg-surface-container-low sm:col-span-2" />
              </div>
            )}
            {loc.geo === 'ok' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={labelCls}>Flat / Building *<AutoTag on={autoOn('address')} /></span><input value={loc.address} onChange={(e) => setL('address', e.target.value)} placeholder="A-402, Sea Breeze Residency" className={inputCls} />{err('address')}</label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={labelCls}>Street / Area<AutoTag on={autoOn('area')} /></span><input value={loc.area} onChange={(e) => setL('area', e.target.value)} placeholder="Linking Road, Bandra West" className={inputCls} /></label>
                  <label className="flex flex-col gap-1.5"><span className={labelCls}>City *<AutoTag on={autoOn('city')} /></span><input value={loc.city} onChange={(e) => setL('city', e.target.value)} placeholder="Mumbai" className={inputCls} />{err('city')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5"><span className={labelCls}>State *<AutoTag on={autoOn('state')} /></span><input value={loc.state} onChange={(e) => setL('state', e.target.value)} placeholder="Maharashtra" className={inputCls} />{err('state')}</label>
                    <label className="flex flex-col gap-1.5"><span className={labelCls}>Pincode *<AutoTag on={autoOn('pincode')} /></span><input value={loc.pincode} onChange={(e) => handlePincode(e.target.value.replace(/\D+/g, '').slice(0, 6))} placeholder="400050" inputMode="numeric" className={inputCls} />{err('pincode')}</label>
                  </div>
                  <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={labelCls}>Nearby Landmark *</span><input value={loc.landmark} onChange={(e) => setL('landmark', e.target.value)} placeholder="e.g. Opposite National College, next to HDFC ATM" className={inputCls} />{err('landmark')}</label>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Address lookup: © OpenStreetMap contributors.</p>
              </>
            )}
          </section>
        )}

        {step === 4 && test && (
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-space-lg flex flex-col gap-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">Review & confirm</h2>
            <div className="rounded-xl bg-surface-container-low p-4 flex items-center justify-between gap-2">
              <div><p className="font-mono font-label-sm text-label-sm text-secondary">{test.code}</p><p className="font-headline-sm text-headline-sm text-primary">{test.name}</p></div>
              <p className="font-currency-display text-currency-display text-primary">{inr(test.price)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body-md text-body-md">
              <p><strong>Patient:</strong> {patient.name}, {patient.age} • {patient.gender}</p>
              <p><strong>Phone:</strong> <span className="font-mono">+91 {normPhone(patient.phone)}</span></p>
              <p className="sm:col-span-2"><strong>Address:</strong> {[loc.address, loc.area, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}</p>
              <p className="sm:col-span-2"><strong>Landmark:</strong> {loc.landmark}</p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer font-body-md text-body-md">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-5 h-5 mt-0.5 accent-secondary" />
              I confirm that my location, pickup address and all the information above are correct to the best of my knowledge. Booking will proceed only after this confirmation.
            </label>
            <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container disabled:opacity-60">
              {submitting ? <><span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>Confirming…</> : <><span className="material-symbols-outlined text-[20px]">check_circle</span>Confirm Booking • {inr(test.price)}</>}
            </button>
          </section>
        )}

        {!done && (
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pb-8">
            <button type="button" onClick={() => (step === 1 ? navigate('/tests') : setStep((s) => s - 1))} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container text-primary font-label-lg text-label-lg hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>{step === 1 ? 'All Tests' : 'Back'}
            </button>
            {step < 4 && <button type="button" onClick={next} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container">Continue<span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>}
          </div>
        )}
      </div>
    </main>
  );
}
