import { useCallback, useEffect, useRef } from 'react';
import { markPageReady, resetPageReady } from '../lib/pageReady';

// Data pages: keeps the navigation logo-loader visible until the page's
// first load finishes (success or error). One-shot per mount/key — later
// refetches (filters, pagination) use their own inline loaders instead.
//
// Pass a key (e.g. route id) when the same component instance stays mounted
// across navigations (booking 1 → booking 2): the loader must wait again.
export function usePageReady(key) {
  const init = useRef(false);
  const claimedKey = useRef(undefined);
  const mounted = useRef(true);
  const done = useRef(false);

  // Claim during render (runs before effects): guarantees the loader sees
  // "not ready" even on instant navigations. Idempotent and React-state
  // free, so repeated renders are harmless.
  if (!init.current || claimedKey.current !== key) {
    init.current = true;
    claimedKey.current = key;
    done.current = false;
    resetPageReady();
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback((expectedKey) => {
    if (!mounted.current || done.current) return;
    // Ignore stale fetches from a previous key (e.g. booking 1 resolving
    // after the user already moved to booking 2).
    if (expectedKey !== undefined && expectedKey !== claimedKey.current) return;
    done.current = true;
    markPageReady();
  }, []);
}

// Static pages (no data fetch): claim and instantly signal on mount so a
// navigation arriving from a still-loading data page can't leave the
// loader stuck behind with nobody left to signal.
export function PageReady() {
  const signalReady = usePageReady('static');
  useEffect(() => {
    signalReady('static');
  }, [signalReady]);
  return null;
}
