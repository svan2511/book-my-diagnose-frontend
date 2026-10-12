import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Tests from './pages/Tests';
import Booking from './pages/Booking';
import Tracking from './pages/Tracking';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Bookings from './pages/admin/Bookings';
import BookingDetail from './pages/admin/BookingDetail';
import AdminTests from './pages/admin/Tests';
import Collections from './pages/admin/Collections';
import Staff from './pages/admin/Staff';
import Reports from './pages/admin/Reports';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Queries from './pages/admin/Queries';
import NavigationLoader from './components/NavigationLoader';
import { AdminAuthProvider } from './auth/AdminAuth';
import RequireAdmin from './auth/RequireAdmin';
import { PageReady } from './hooks/usePageReady';

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
      <NavigationLoader />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<><PageReady /><Home /></>} />
          <Route path="/about" element={<><PageReady /><About /></>} />
          <Route path="/contact" element={<><PageReady /><Contact /></>} />
          <Route path="/tests" element={<><PageReady /><Tests /></>} />
          <Route path="/book" element={<><PageReady /><Booking /></>} />
          <Route path="/tracking" element={<><PageReady /><Tracking /></>} />
        </Route>
        <Route path="/admin/login" element={<><PageReady /><AdminLogin /></>} />
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/bookings" element={<Bookings />} />
          <Route path="/admin/bookings/:id" element={<BookingDetail />} />
          <Route path="/admin/collections" element={<Collections />} />
          <Route path="/admin/staff" element={<Staff />} />
          <Route path="/admin/tests" element={<AdminTests />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/customers/:id" element={<CustomerDetail />} />
          <Route path="/admin/queries" element={<Queries />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
