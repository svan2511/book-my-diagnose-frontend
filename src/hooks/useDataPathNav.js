import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const pathMap = {
  'home': '/',
  'tests-and-packages': '/tests',
  'home-collection': '/book',
  'how-it-works': '/',
  'track-booking': '/tracking',
  'download-report': '/tracking',
  'dashboard': '/admin',
  'bookings-and-dispatch': '/admin',
  'sample-collections-and-phlebotomists': '/admin',
  'laboratory-and-reports': '/admin',
  'diagnostic-tests-catalog': '/tests',
  'customers-and-patients': '/admin',
  'contact-enquiries': '/admin',
  'analytics-and-revenue': '/admin',
  'system-settings': '/admin',
  'login': '/admin/login',
};

export function useDataPathNav() {
  const navigate = useNavigate();
  useEffect(() => {
    function onClick(e) {
      const pathEl = e.target.closest('[data-path]');
      if (pathEl) {
        const key = pathEl.getAttribute('data-path');
        const to = pathMap[key];
        if (to) {
          e.preventDefault();
          navigate(to);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      const gotoEl = e.target.closest('[data-goto]');
      if (gotoEl) {
        e.preventDefault();
        navigate(gotoEl.getAttribute('data-goto'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const a = e.target.closest('a[href^="/"]');
      if (a) {
        const href = a.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          e.preventDefault();
          navigate(href);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);
  return pathMap;
}

export function gotoPath(navigate, key) {
  const to = pathMap[key] || '/';
  navigate(to);
}
