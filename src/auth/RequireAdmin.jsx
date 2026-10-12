import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from './AdminAuth';
import { usePageReady } from '../hooks/usePageReady';

// Blocks unauthenticated access to /admin. Remembers where the user wanted
// to go so the login screen can send them back after signing in.
// Claims loader-wait on mount so refresh (where the page mounts only after
// the auth gate resolves) is covered — the page then re-claims itself.
export default function RequireAdmin({ children }) {
  usePageReady('admin-gate');
  const { admin, ready } = useAdmin();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-[32px] text-secondary animate-spin">refresh</span>
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
