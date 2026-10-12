import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_DEMO_HINT, useAdmin } from '../auth/AdminAuth';

export default function AdminLogin() {
  const { admin, login, verifyOtp, resendOtp } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || '/admin';

  const [mode, setMode] = useState('login'); // login | otp | forgot | sent
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // OTP step state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMasked, setOtpMasked] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [expiresAt, setExpiresAt] = useState(0);
  const [nowTs, setNowTs] = useState(Date.now());
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (mode !== 'otp') return;
    const t = setInterval(() => {
      setNowTs(Date.now());
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [mode]);

  const otpExpired = expiresAt > 0 && nowTs >= expiresAt;
  const otpSecondsLeft = Math.max(0, Math.ceil((expiresAt - nowTs) / 1000));
  const fmtLeft = `${String(Math.floor(otpSecondsLeft / 60)).padStart(1, '0')}:${String(otpSecondsLeft % 60).padStart(2, '0')}`;

  if (admin) return <Navigate to="/admin" replace />;

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setBusy(true);
    const res = await login(email, password, remember);
    setBusy(false);
    if (res.ok) {
      navigate(from, { replace: true });
      window.scrollTo({ top: 0 });
    } else if (res.requires2fa) {
      // Password correct — code emailed. Never keep the password in memory.
      setPassword('');
      setOtpEmail(res.email);
      setOtpMasked(res.masked);
      setOtp(['', '', '', '', '', '']);
      setExpiresAt(Date.now() + (res.expiresIn || 600) * 1000);
      setCooldown(60);
      setInfo(`Verification code sent to ${res.masked}.`);
      setMode('otp');
      setTimeout(() => otpRefs.current[0] && otpRefs.current[0].focus(), 60);
    } else {
      setError(res.error);
    }
  };

  const setDigit = (i, v) => {
    const d = String(v || '').replace(/\D+/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) otpRefs.current[i + 1] && otpRefs.current[i + 1].focus();
  };

  const onOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1] && otpRefs.current[i - 1].focus();
  };

  const onOtpPaste = (e) => {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D+/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    e.preventDefault();
    setOtp((prev) => prev.map((_, i) => digits[i] || ''));
    const focusAt = Math.min(digits.length, 5);
    otpRefs.current[focusAt] && otpRefs.current[focusAt].focus();
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const code = otp.join('');
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    const res = await verifyOtp(otpEmail, code, remember);
    setBusy(false);
    if (res.ok) {
      navigate(from, { replace: true });
      window.scrollTo({ top: 0 });
    } else {
      setError(res.error);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0] && otpRefs.current[0].focus(), 60);
    }
  };

  const doResend = async () => {
    if (cooldown > 0 || busy) return;
    setError('');
    setInfo('');
    setBusy(true);
    const res = await resendOtp(otpEmail);
    setBusy(false);
    if (res.ok) {
      setOtp(['', '', '', '', '', '']);
      setExpiresAt(Date.now() + 10 * 60 * 1000);
      setCooldown(60);
      setInfo(res.message);
      setTimeout(() => otpRefs.current[0] && otpRefs.current[0].focus(), 60);
    } else {
      if (res.retryAfter) setCooldown(res.retryAfter);
      else setCooldown(60);
      setError(res.error);
    }
  };

  const submitForgot = (e) => {
    e.preventDefault();
    setError('');
    if (!resetEmail.trim() || !/^\S+@\S+\.\S+$/.test(resetEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setMode('sent');
    }, 550);
  };

  return (
    <main className="min-h-screen w-full bg-surface grid lg:grid-cols-2 font-body-md">
      {/* Brand panel */}
      <section className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-primary text-on-primary px-12 py-12">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-tertiary-fixed/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-space-sm">
          <picture className="flex items-center">
            <source srcSet="/logo.webp" type="image/webp" />
            <img alt="Book My Diagnose Brand Logo" className="h-12 w-auto object-contain rounded-lg" src="/logo.png" width="512" height="328" fetchPriority="high" decoding="async" />
          </picture>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight">Book My Diagnose</span>
            {/* <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">Operations Hub</span> */}
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-space-md max-w-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary-fixed font-bold">Restricted Access</span>
          <h1 className="font-display-lg text-display-lg tracking-tight">Lab operations, under your control.</h1>
          <p className="font-body-lg text-body-lg text-primary-fixed">
            Sign in to manage bookings, dispatch phlebotomists, upload reports and track revenue across all hubs.
          </p>
          <ul className="flex flex-col gap-space-sm pt-space-sm">
            {[
              ['space_dashboard', 'Live bookings & dispatch telemetry'],
              ['vaccines', 'Sample collection tracking'],
              ['description', 'Secure report delivery'],
            ].map(([icon, text]) => (
              <li key={icon} className="flex items-center gap-space-sm font-body-md text-body-md text-on-primary">
                <span className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">{icon}</span>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 font-body-sm text-body-sm text-primary-fixed-dim">
          NABL &amp; ICMR accredited network • 45+ cities
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md flex flex-col gap-space-lg">
          <div className="lg:hidden flex items-center gap-space-sm">
            <picture className="flex items-center">
              <source srcSet="/logo.webp" type="image/webp" />
              <img alt="Book My Diagnose Brand Logo" className="h-12 w-auto object-contain" src="/logo.png" width="512" height="328" decoding="async" />
            </picture>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">Book My Diagnose</span>
          </div>

          {mode === 'login' && (
            <div className="rounded-2xl bg-surface-container-lowest shadow-xl p-space-lg sm:p-space-xl flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  ADMIN ACCESS
                </span>
                <h2 className="font-headline-xl text-headline-xl text-primary">Welcome back</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Sign in to the operations dashboard.</p>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-space-sm rounded-lg bg-error-container text-on-error-container px-space-md py-space-sm font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submitLogin} className="flex flex-col gap-space-md" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-label-lg text-primary" htmlFor="admin-email">Email</label>
                  <div className="flex items-center px-space-md py-space-sm rounded-lg bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-secondary transition-all">
                    <span className="material-symbols-outlined text-on-surface-variant mr-space-sm text-[20px]">mail</span>
                    <input
                      id="admin-email" type="email" autoComplete="username" required
                      className="bg-transparent border-0 outline-none w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline"
                      placeholder="admin@bookmydiagnose.in"
                      value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-label-lg text-primary" htmlFor="admin-password">Password</label>
                  <div className="flex items-center px-space-md py-space-sm rounded-lg bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-secondary transition-all">
                    <span className="material-symbols-outlined text-on-surface-variant mr-space-sm text-[20px]">lock</span>
                    <input
                      id="admin-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required
                      className="bg-transparent border-0 outline-none w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline"
                      placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy}
                    />
                    <button
                      type="button" onClick={() => setShowPw((v) => !v)} disabled={busy}
                      className="text-on-surface-variant hover:text-primary transition-colors" aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-space-xs cursor-pointer font-body-md text-body-md text-on-surface">
                    <input
                      type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded accent-secondary" disabled={busy}
                    />
                    Remember me
                  </label>
                  <button
                    type="button" onClick={() => { setMode('forgot'); setError(''); setResetEmail(email); }}
                    className="font-label-md text-label-md text-secondary hover:text-on-secondary-container font-semibold transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit" disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-space-sm px-space-xl py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {busy
                    ? (<><span className="material-symbols-outlined text-[20px] animate-spin">refresh</span><span>Signing in…</span></>)
                    : (<><span className="material-symbols-outlined text-[20px]">login</span><span>Sign in to Dashboard</span></>)}
                </button>
              </form>

              <div className="rounded-xl bg-surface-container-low px-space-md py-space-sm flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">info</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  <strong className="font-semibold text-primary">Seeded admin login</strong> (change after first sign-in):{' '}
                  <span className="font-mono">{ADMIN_DEMO_HINT.email}</span>
                  {ADMIN_DEMO_HINT.password && (<> / <span className="font-mono">{ADMIN_DEMO_HINT.password}</span></>)}
                </p>
              </div>

              <Link to="/" className="inline-flex items-center justify-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to website
              </Link>
            </div>
          )}

          {mode === 'otp' && (
            <div className="rounded-2xl bg-surface-container-lowest shadow-xl p-space-lg sm:p-space-xl flex flex-col gap-space-md">
              <div className="flex flex-col items-center text-center gap-space-xs">
                <span className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[36px] text-secondary">mail_lock</span>
                </span>
                <h2 className="font-headline-xl text-headline-xl text-primary">Check your email</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  We sent a 6-digit code to <span className="font-mono text-primary">{otpMasked}</span>.
                  {!otpExpired ? (
                    <> It expires in <strong className="text-primary">{fmtLeft}</strong>.</>
                  ) : (
                    <> The code has <strong className="text-error">expired</strong> — request a new one below.</>
                  )}
                </p>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-space-sm rounded-lg bg-error-container text-on-error-container px-space-md py-space-sm font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <p role="status" className="rounded-lg bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md text-secondary">{info}</p>
              )}

              <form onSubmit={submitOtp} className="flex flex-col gap-space-md" noValidate>
                <div className="flex items-center justify-center gap-2" onPaste={onOtpPaste}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onOtpKey(i, e)}
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${i + 1}`}
                      disabled={busy}
                      className="w-11 h-14 sm:w-12 text-center rounded-xl bg-surface-container-low border-[1.5px] border-outline-variant outline-none focus:border-secondary focus:bg-surface-container-lowest font-headline-md text-headline-md text-primary transition-all disabled:opacity-60"
                    />
                  ))}
                </div>
                <button
                  type="submit" disabled={busy || otpExpired}
                  className="w-full inline-flex items-center justify-center gap-space-sm px-space-xl py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {busy
                    ? (<><span className="material-symbols-outlined text-[20px] animate-spin">refresh</span><span>Verifying…</span></>)
                    : (<><span className="material-symbols-outlined text-[20px]">verified_user</span><span>Verify & Sign In</span></>)}
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button" onClick={doResend} disabled={busy || cooldown > 0}
                    className="font-label-md text-label-md text-secondary hover:text-on-secondary-container font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); setOtp(['', '', '', '', '', '']); }}
                    className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="rounded-2xl bg-surface-container-lowest shadow-xl p-space-lg sm:p-space-xl flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <h2 className="font-headline-xl text-headline-xl text-primary">Reset password</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Enter your admin email and we will send a reset link.</p>
              </div>
              {error && (
                <div role="alert" className="flex items-start gap-space-sm rounded-lg bg-error-container text-on-error-container px-space-md py-space-sm font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={submitForgot} className="flex flex-col gap-space-md" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-lg text-label-lg text-primary" htmlFor="reset-email">Email</label>
                  <div className="flex items-center px-space-md py-space-sm rounded-lg bg-surface-container-low focus-within:ring-2 focus-within:ring-secondary transition-all">
                    <span className="material-symbols-outlined text-on-surface-variant mr-space-sm text-[20px]">mail</span>
                    <input
                      id="reset-email" type="email" autoComplete="email" required
                      className="bg-transparent border-0 outline-none w-full font-body-lg text-body-lg text-on-surface placeholder:text-outline"
                      placeholder="admin@bookmydiagnose.in"
                      value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={busy}
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-space-sm px-space-xl py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-lg hover:bg-on-secondary-container transition-all disabled:opacity-60"
                >
                  {busy
                    ? (<><span className="material-symbols-outlined text-[20px] animate-spin">refresh</span><span>Sending…</span></>)
                    : (<><span className="material-symbols-outlined text-[20px]">send</span><span>Send reset link</span></>)}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">
                  ← Back to sign in
                </button>
              </form>
            </div>
          )}

          {mode === 'sent' && (
            <div className="rounded-2xl bg-surface-container-lowest shadow-xl p-space-lg sm:p-space-xl flex flex-col items-center text-center gap-space-md">
              <span className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[36px] text-secondary">mark_email_read</span>
              </span>
              <h2 className="font-headline-xl text-headline-xl text-primary">Check your inbox</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                If <span className="font-mono text-primary">{resetEmail}</span> is registered, a reset link is on its way.
                (Demo mode — no email is actually sent yet.)
              </p>
              <button
                type="button" onClick={() => { setMode('login'); setError(''); }}
                className="px-space-xl py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg hover:bg-on-secondary-container transition-all"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
