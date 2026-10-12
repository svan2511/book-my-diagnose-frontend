import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataPathNav } from '../hooks/useDataPathNav';
import { API_BASE } from '../lib/api';
import PhoneInput from '../components/PhoneInput';

export default function Contact() {
  const navigate = useNavigate();
  useDataPathNav();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', msg: '' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.subject.trim() || form.msg.trim().length < 10) {
      setError('Please fill all fields (message min 10 characters).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/contact-queries`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.msg.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.errors) {
          const fe = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            const raw = Array.isArray(v) ? v[0] : String(v);
            const key = k === 'message' ? 'msg' : k;
            // Translate technical backend text into plain user language.
            fe[key] = key === 'phone' && /format is invalid/i.test(raw)
              ? 'Please enter a valid 10-digit mobile number starting with 6-9.'
              : raw;
          });
          setFieldErrors(fe);
          throw new Error('Please fix the highlighted fields below.');
        }
        throw new Error(data?.message || 'Could not send. Please try again.');
      }
      setSent(true);
      setForm({ name: '', phone: '', email: '', subject: '', msg: '' });
      setTimeout(() => setSent(false), 6000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="w-full pt-20 bg-surface flex-1">
      <div className="flex flex-col w-full">
        <section className="w-full bg-surface-container-low py-space-xl px-margin">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">We Reply Within Hours</span>
            <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">Contact Us</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Booking help, report queries or home-visit support — our 24×7 care desk is one tap away.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-margin py-space-xl w-full grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl shadow-sm border border-outline-variant/40">
            <h2 className="font-headline-lg text-headline-lg text-primary">Send us a message</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">We usually respond within 2 working hours.</p>
            <form onSubmit={submit} className="flex flex-col gap-space-md pt-space-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-lg text-label-lg text-primary">Full Name *</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Sharma" className="h-12 px-space-md rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary font-body-md text-body-md" type="text" />
                  {fieldErrors.name && <span className="font-body-sm text-body-sm text-error">{fieldErrors.name}</span>}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-lg text-label-lg text-primary">Mobile Number *</span>
                  <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="98200 12345" />
                  {fieldErrors.phone && <span className="font-body-sm text-body-sm text-error">{fieldErrors.phone}</span>}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-lg text-label-lg text-primary">Email *</span>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-12 px-space-md rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary font-body-md text-body-md" type="email" />
                  {fieldErrors.email && <span className="font-body-sm text-body-sm text-error">{fieldErrors.email}</span>}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-lg text-label-lg text-primary">Subject *</span>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Home collection timing" className="h-12 px-space-md rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary font-body-md text-body-md" type="text" />
                  {fieldErrors.subject && <span className="font-body-sm text-body-sm text-error">{fieldErrors.subject}</span>}
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="font-label-lg text-label-lg text-primary">How can we help? *</span>
                <textarea value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} rows={5} placeholder="Booking ID, test name, preferred slot..." className="px-space-md py-space-sm rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary font-body-md text-body-md resize-y" />
                {fieldErrors.msg && <span className="font-body-sm text-body-sm text-error">{fieldErrors.msg}</span>}
              </label>
              {error && <p role="alert" className="font-body-md text-body-md text-error bg-error-container rounded-lg px-space-md py-space-sm">{error}</p>}
              <button disabled={busy} className="inline-flex items-center justify-center gap-space-sm px-space-xl py-space-md rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container transition-all disabled:opacity-60" type="submit">
                {busy ? <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">send</span>} {busy ? 'Sending…' : sent ? 'Message Sent — Thank You!' : 'Send Message'}
              </button>
              {sent && (
                <p className="flex items-center gap-2 font-body-md text-body-md text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-space-md py-space-sm">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span> Received! Our care desk will call you back shortly.
                </p>
              )}
            </form>
          </div>

          {/* Info cards */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            <div className="bg-primary text-on-primary rounded-2xl p-space-lg shadow-md flex flex-col gap-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary-fixed font-bold">24×7 Helpline</span>
              <a href="tel:18002093424" className="font-headline-lg text-headline-lg hover:text-secondary-fixed transition-colors">1800-209-DIAG</a>
              <span className="font-body-sm text-body-sm text-primary-fixed">Toll-free • Hindi, English, Marathi</span>
              <div className="flex flex-wrap gap-space-sm pt-space-xs">
                <a href="tel:18002093424" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md" type="button">
                  <span className="material-symbols-outlined text-[18px]">call</span> Call Now
                </a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-space-lg py-space-sm rounded-lg bg-surface-container-lowest/10 text-on-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">chat</span> WhatsApp
                </a>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/40 flex flex-col gap-space-md">
              {[
                ['location_on', 'Central Lab Hub', 'Linking Road, Bandra West, Mumbai 400050 • Open all days, 6 AM – 10 PM'],
                ['mail', 'Email us', 'care@bookmydiagnose.in • reports@bookmydiagnose.in'],
                ['schedule', 'Home-visit slots', 'Morning fasting 6–10 AM • Evening 4–8 PM • 45+ cities'],
              ].map(([icon, h, p]) => (
                <div key={h} className="flex items-start gap-space-md">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-primary">{h}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{p}</span>
                  </div>
                </div>
              ))}
              <button onClick={() => { navigate('/book'); window.scrollTo({ top: 0 }); }} className="inline-flex items-center justify-center gap-2 px-space-lg py-space-sm rounded-lg bg-surface-container text-secondary font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" type="button">
                <span className="material-symbols-outlined text-[18px]">biotech</span> Book a Home Test instead
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
