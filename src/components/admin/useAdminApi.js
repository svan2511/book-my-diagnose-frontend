import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getToken } from '../../lib/api';
import { useAdmin } from '../../auth/AdminAuth';

// Authenticated admin fetcher: injects the Sanctum token, and on 401
// clears the session and bounces to the login screen.
export function useAdminApi() {
  const navigate = useNavigate();
  const { logout } = useAdmin();
  return useCallback(
    async (path, opts = {}) => {
      try {
        return await apiFetch(path, { ...opts, token: getToken() });
      } catch (e) {
        if (e.status === 401) {
          await logout();
          navigate('/admin/login', { replace: true, state: { from: '/admin' } });
        }
        throw e;
      }
    },
    [logout, navigate],
  );
}
