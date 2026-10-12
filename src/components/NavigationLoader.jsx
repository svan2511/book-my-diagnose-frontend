import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isPageReady, subscribePageReady } from '../lib/pageReady';

export default function NavigationLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef([]);
  const first = useRef(true);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const minTime = first.current ? 950 : 600;
    const t0 = Date.now();
    let finished = false;
    setLeaving(false);
    setVisible(true);
    setProgress(8);

    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

    const finish = () => {
      if (finished) return;
      finished = true;
      setProgress(100);
      setLeaving(true);
      later(() => {
        setVisible(false);
        setLeaving(false);
        setProgress(0);
      }, 350);
    };

    later(() => setProgress(55), 150);
    // Minimum display time — then hide as soon as the page signals ready.
    // (Data pages claim loading on mount, so this waits for real data.)
    later(() => {
      if (isPageReady()) finish();
    }, minTime);
    // Failsafe — never trap the user behind the overlay.
    later(finish, 9000);
    // Re-check at fire time: the flag may have flipped back to loading
    // after this signal (e.g. auth resolved, then the page claimed).
    const unsub = subscribePageReady((ready) => {
      if (!ready || finished) return;
      later(() => {
        if (!finished && isPageReady()) finish();
      }, Math.max(0, minTime - (Date.now() - t0)));
    });

    first.current = false;
    return () => {
      unsub();
      timers.current.forEach(clearTimeout);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      {/* slim gradient progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-secondary via-secondary-container to-tertiary-fixed shadow-[0_0_12px_rgba(14,165,233,0.8)] transition-all duration-500 ease-out"
          style={{ width: progress + '%' }}
        />
      </div>
      {/* centered brand overlay */}
      <div className={`fixed inset-0 z-[99] flex items-center justify-center bg-surface/70 backdrop-blur-sm transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/85 border border-white shadow-2xl px-10 py-8">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-[3px] border-slate-200"></span>
            <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-secondary border-r-tertiary-fixed animate-spin"></span>
            <picture className="w-10 h-10 flex items-center justify-center"><source srcSet="/logo.webp" type="image/webp" /><img src="/logo.png" alt="Book My Diagnose" width="512" height="328" className="w-10 h-10 object-contain animate-loader-logo" decoding="async" /></picture>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-label-lg text-label-lg text-primary">Book My Diagnose</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant animate-pulse">Loading your care…</span>
          </div>
        </div>
      </div>
    </>
  );
}
