import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { ErrorBox, Field, PageHeader, PrimaryBtn, Skeleton, StatusBadge, TableShell, Td, fmtDate, fmtINR, fmtPhone, inputCls } from '../../components/admin/ui';

export default function CustomerDetail() {
  const { id } = useParams();
  const api = useAdminApi();
  const signalReady = usePageReady(id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', gender: '', age: '' });

  const load = useCallback(async () => {
    const myId = id;
    setLoading(true);
    setError('');
    try {
      const res = await api(`/admin/customers/${myId}`);
      setData(res.data);
      const c = res.data.customer;
      setForm({ name: c.name || '', email: c.email || '', gender: c.gender || '', age: c.age || '' });
    } catch (e) {
      setError(e.message || 'Failed to load customer.');
    } finally {
      setLoading(false);
      signalReady(myId);
    }
  }, [api, id]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api(`/admin/customers/${id}`, { method: 'PATCH', body: { name: form.name, email: form.email || null, gender: form.gender || null, age: form.age === '' ? null : Number(form.age) } });
      setMsg('Customer updated.');
      setEditing(false);
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading) {
    return (
      <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
        <PageHeader title="Customer" sub="Loading…" />
        <Skeleton lines={5} />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
        <PageHeader title="Customer" sub="Not found" actions={<Link to="/admin/customers" className="font-label-md text-label-md text-secondary font-semibold">← All customers</Link>} />
        <ErrorBox message={error || 'Customer not found.'} onRetry={load} />
      </main>
    );
  }

  const c = data.customer;

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader title={c.name} sub={`${fmtPhone(c.phone)} • ${c.total_bookings ?? 0} bookings`} actions={<Link to="/admin/customers" className="font-label-md text-label-md text-secondary font-semibold hover:underline">← All customers</Link>} />
      {msg && <p role="status" className="rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-primary">{msg}</p>}

      <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline-sm text-headline-sm text-primary">Profile</h2>
          <button type="button" onClick={() => setEditing((v) => !v)} className="font-label-md text-label-md text-secondary font-semibold hover:underline">{editing ? 'Cancel' : 'Edit'}</button>
        </div>
        {editing ? (
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`${inputCls} cursor-pointer`}>
                <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="Age"><input type="number" min="0" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputCls} /></Field>
            <div className="sm:col-span-2"><PrimaryBtn type="submit">Save changes</PrimaryBtn></div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body-md text-body-md">
            <p><strong>Email:</strong> {c.email || '—'}</p>
            <p><strong>Gender:</strong> {c.gender || '—'}</p>
            <p><strong>Age:</strong> {c.age || '—'}</p>
            <p><strong>Customer since:</strong> {fmtDate(c.created_at, false)}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">Booking History ({(data.bookings || []).length})</h2>
        <TableShell head={['Booking', 'Tests', 'Status', 'Amount', 'Booked']}>
          {(data.bookings || []).map((b) => (
            <tr key={b.id} className="hover:bg-surface-container-low/50">
              <Td><Link to={`/admin/bookings/${b.id}`} className="font-mono font-semibold text-secondary hover:underline">{b.booking_number}</Link></Td>
              <Td className="max-w-[220px] truncate">{(b.tests || []).map((t) => t.code).join(', ')}</Td>
              <Td><StatusBadge value={b.status} /></Td>
              <Td className="font-semibold">{fmtINR(b.total)}</Td>
              <Td className="whitespace-nowrap">{fmtDate(b.created_at)}</Td>
            </tr>
          ))}
        </TableShell>
      </section>
    </main>
  );
}
