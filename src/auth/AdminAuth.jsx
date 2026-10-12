import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, clearToken, getToken, setToken } from '../lib/api';

// Seeded backend admin (backend/database/seeders/AdminUserSeeder.php).
// Shown on the login screen so the demo is usable.
export const ADMIN_DEMO_HINT = { email: 'admin@bookmydiagnose.in', password: 'admin123' };

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  // Re-validate any stored token against the real API on load.
  // NOTE: the provider deliberately does NOT touch the nav loader —
  // RequireAdmin (the gate) and each page own the claim/signal protocol,
  // so a "ready" can never fire before the waiting page has claimed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const res = await apiFetch('/admin/me', { token });
        if (!cancelled) setAdmin(res.data.admin);
      } catch {
        clearToken();
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 1: password check → server emails a 6-digit code, no token yet.
  const login = useCallback(async (email, password, remember) => {
    const normEmail = String(email || '').trim();
    if (!normEmail || !password) {
      return { ok: false, error: 'Please enter both email and password.' };
    }
    try {
      const res = await apiFetch('/admin/login', {
        method: 'POST',
        body: { email: normEmail, password },
      });
      if (res.data && res.data.requires_2fa) {
        return {
          ok: false,
          requires2fa: true,
          email: res.data.email || normEmail,
          masked: res.data.email_masked || normEmail,
          expiresIn: res.data.expires_in || 600,
        };
      }
      setToken(res.data.token, remember);
      setAdmin(res.data.admin);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Login failed. Please try again.' };
    }
  }, []);

  // Step 2: verify the emailed code → token issued, session starts.
  const verifyOtp = useCallback(async (email, otp, remember) => {
    try {
      const res = await apiFetch('/admin/verify-otp', {
        method: 'POST',
        body: { email: String(email || '').trim(), otp: String(otp || '').trim() },
      });
      setToken(res.data.token, remember);
      setAdmin(res.data.admin);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Verification failed. Please try again.' };
    }
  }, []);

  const resendOtp = useCallback(async (email) => {
    try {
      const res = await apiFetch('/admin/resend-otp', {
        method: 'POST',
        body: { email: String(email || '').trim() },
      });
      return { ok: true, message: res.message || 'A new code has been sent.' };
    } catch (e) {
      const retryAfter = e.errors && e.errors.retry_after ? Number(e.errors.retry_after) : 0;
      return { ok: false, error: e.message || 'Could not resend. Please try again.', retryAfter };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        await apiFetch('/admin/logout', { method: 'POST', token });
      } catch {
        // token already dead — still clear locally
      }
    }
    clearToken();
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, ready, login, verifyOtp, resendOtp, logout }), [admin, ready, login, verifyOtp, resendOtp, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminAuthProvider>');
  return ctx;
}
