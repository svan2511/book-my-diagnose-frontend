// Tiny fetch wrapper for the Laravel API (dev-prd §7 envelope).
// Base URL override: VITE_API_URL (default: local backend on :8000).

export const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

const TOKEN_KEY = 'bmd_admin_token';

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token, remember) {
  clearToken();
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable — session still works in memory for this tab
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

export async function apiFetch(path, { method = 'GET', body, token, signal } = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    const err = new Error('Backend unreachable. Start the API server first.');
    err.code = 'NETWORK';
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response (shouldn't happen — API always returns the envelope)
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status}).`);
    err.status = res.status;
    err.errors = data?.errors;
    throw err;
  }
  return data;
}
