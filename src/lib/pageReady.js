// Global page-readiness signal for the navigation loader.
//
// Data pages reset the flag when they mount and mark it ready when their
// FIRST load finishes. Static pages never touch it (stays ready), so the
// loader behaves for them exactly like before.
let ready = true;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(ready);
    } catch {
      // a listener must never break navigation
    }
  });
}

export function resetPageReady() {
  ready = false;
  notify();
}

export function markPageReady() {
  ready = true;
  notify();
}

export function isPageReady() {
  return ready;
}

export function subscribePageReady(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
