import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE, getToken } from '../../lib/api';
import { useAdminApi } from '../../components/admin/useAdminApi';
import { usePageReady } from '../../hooks/usePageReady';
import { ErrorBox, PageHeader, Skeleton, StatusBadge, fmtDate, fmtINR, fmtPhone } from '../../components/admin/ui';

// One linear pipeline, plain words — the ONLY place that moves a booking.
// (step: [stage number, plain instruction])
const STAGE = {
  pending: [1, 'New order just came in. Check details, then confirm it.'],
  confirmed: [2, 'Booking is confirmed. Assign a collector to dispatch.'],
  collection_assigned: [3, 'Collector assigned. Track pickup, then mark collected.'],
  sample_collected: [4, 'Sample is in. Send it for lab testing.'],
  testing_in_progress: [5, 'Lab is testing. Upload the PDF report when ready.'],
  report_ready: [6, 'Report is ready. Send it on WhatsApp — that unlocks the patient download.'],
  completed: [7, 'Done — report delivered to the patient.'],
  cancelled: [0, 'This booking was cancelled. Nothing left to do.'],
};

export default function BookingDetail() {
  const { id } = useParams();
  const api = useAdminApi();
  const signalReady = usePageReady(id);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [upProg, setUpProg] = useState(null); // null | 0-100 — live upload %
  const [upName, setUpName] = useState('');
  const [busyStatus, setBusyStatus] = useState(null);
  const [staffQuery, setStaffQuery] = useState('');
  const [staffResults, setStaffResults] = useState([]);
  const [staffSearching, setStaffSearching] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [waBusy, setWaBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const staffReq = useRef(0);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const myId = id;
    setLoading(true);
    setError('');
    try {
      const res = await api(`/admin/bookings/${myId}`);
      setBooking(res.data);
    } catch (e) {
      setError(e.message || 'Failed to load booking.');
    } finally {
      setLoading(false);
      signalReady(myId);
    }
  }, [api, id]);

  useEffect(() => { load(); }, [load]);

  // Live staff search (name or phone) for the dispatch card.
  useEffect(() => {
    const q = staffQuery.trim();
    if (!q) {
      setStaffResults([]);
      setStaffSearching(false);
      return;
    }
    const my = ++staffReq.current;
    setStaffSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await api(`/admin/staff?search=${encodeURIComponent(q)}&status=active&per_page=6`);
        if (staffReq.current === my) setStaffResults(res.data);
      } catch {
        if (staffReq.current === my) setStaffResults([]);
      } finally {
        if (staffReq.current === my) setStaffSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [staffQuery, api]);

  const changeStatus = async (status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this booking? The patient will need to be informed.')) return;
    setBusyStatus(status);
    setActionMsg('');
    try {
      const res = await api(`/admin/bookings/${id}/status`, { method: 'PATCH', body: { status } });
      setBooking(res.data);
      setActionMsg(`Done — moved to ${status.replace(/_/g, ' ')}.`);
    } catch (e) {
      setActionMsg(e.message || 'Status update failed.');
    } finally {
      setBusyStatus(null);
    }
  };

  const runCollection = async (action, to) => {
    const uuid = booking?.collection?.id;
    if (!uuid) {
      setActionMsg('No collection job found for this booking.');
      return;
    }
    setBusyStatus(action);
    setActionMsg('');
    try {
      await api(`/admin/collections/${uuid}/status`, { method: 'PATCH', body: { status: to } });
      await load();
      setActionMsg(action === 'on_the_way' ? 'Done — collector is on the way.' : 'Done.');
    } catch (e) {
      setActionMsg(e.message || 'Update failed.');
    } finally {
      setBusyStatus(null);
    }
  };

  const assignAndDispatch = async () => {
    const uuid = booking?.collection?.id;
    if (!selectedStaff) {
      setActionMsg('Search and select a collector first.');
      return;
    }
    if (!uuid) {
      setActionMsg('No collection job found for this booking.');
      return;
    }
    const picked = selectedStaff;
    setBusyStatus('assign');
    setActionMsg('');
    try {
      await api(`/admin/collections/${uuid}/assign`, { method: 'POST', body: { staff_id: picked.id } });
      const res2 = await api(`/admin/bookings/${id}/status`, { method: 'PATCH', body: { status: 'collection_assigned' } });
      setBooking(res2.data);
      setSelectedStaff(null);
      setStaffQuery('');
      setStaffResults([]);
      setActionMsg(`Done — ${picked.name} dispatched. Send them the pickup location from the Collector card.`);
    } catch (e) {
      setActionMsg(e.message || 'Assign failed.');
    } finally {
      setBusyStatus(null);
    }
  };

  const shareLocation = async () => {
    const uuid = booking?.collection?.id;
    if (!uuid) {
      setActionMsg('No collection job found for this booking.');
      return;
    }
    setWaBusy(true);
    setActionMsg('');
    try {
      const res = await api(`/admin/collections/${uuid}/share-whatsapp`, { method: 'POST' });
      window.open(res.data.url, '_blank', 'noopener');
      setActionMsg(`WhatsApp location opened for ${res.data.phone}.`);
    } catch (e) {
      setActionMsg(e.message || 'WhatsApp share failed.');
    } finally {
      setWaBusy(false);
    }
  };

  const shareStatus = async () => {
    setStatusBusy(true);
    setActionMsg('');
    try {
      const res = await api(`/admin/bookings/${id}/share-status`, { method: 'POST' });
      window.open(res.data.url, '_blank', 'noopener');
      setActionMsg(`Status update opened on WhatsApp for ${res.data.phone}.`);
    } catch (e) {
      setActionMsg(e.message || 'Status share failed.');
    } finally {
      setStatusBusy(false);
    }
  };

  const uploadReport = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setActionMsg('Only PDF reports are accepted.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    // XHR (not fetch) so we can show a live upload % bar.
    setBusy(true);
    setUpProg(0);
    setUpName(file.name);
    setActionMsg('');
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/admin/bookings/${id}/report`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUpProg(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = async () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        setUpProg(100);
        await load();
        setActionMsg('Report uploaded successfully.');
      } else {
        const errs = data?.errors ? Object.values(data.errors).flat().join(' ') : '';
        setActionMsg(`${data?.message || 'Upload failed.'}${errs ? ` ${errs}` : ''}`);
        setUpProg(null);
      }
      setBusy(false);
    };
    xhr.onerror = () => {
      setActionMsg('Upload failed. Check connection and retry.');
      setBusy(false);
      setUpProg(null);
    };
    xhr.send(fd);
    if (fileRef.current) fileRef.current.value = '';
  };

  const shareWhatsApp = async (reportId) => {
    setBusy(true);
    setBusyStatus('whatsapp');
    setActionMsg('');
    try {
      const res = await api(`/admin/reports/${reportId}/share-whatsapp`, { method: 'POST' });
      window.open(res.data.url, '_blank', 'noopener');
      await load();
      setActionMsg(`WhatsApp message prepared for ${res.data.phone}.`);
    } catch (e) {
      setActionMsg(e.message || 'WhatsApp share failed.');
    } finally {
      setBusy(false);
      setBusyStatus(null);
    }
  };

  if (loading) {
    return (
      <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
        <PageHeader title="Booking" sub="Loading…" />
        <Skeleton lines={6} />
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
        <PageHeader title="Booking" sub="Not found" actions={<Link to="/admin/bookings" className="font-label-md text-label-md text-secondary font-semibold">← All bookings</Link>} />
        <ErrorBox message={error || 'Booking not found.'} onRetry={load} />
      </main>
    );
  }

  const loc = booking.location || {};
  const col = booking.collection || {};
  const reports = booking.reports || [];
  // Report upload unlocks only after lab testing starts (backend enforces too).
  const canUpload = ['testing_in_progress', 'report_ready'].includes(booking.status);
  const [stageNo, stageHint] = STAGE[booking.status] || [0, ''];
  const working = busyStatus !== null;
  // API sends newest-first; journey reads oldest-first.
  const events = [...(booking.timeline || [])].reverse();

  return (
    <main className="px-4 lg:px-space-lg py-space-lg flex flex-col gap-space-md">
      <PageHeader
        title={booking.booking_number}
        sub={`Booked ${fmtDate(booking.created_at)} • ${fmtINR(booking.total)}`}
        actions={<Link to="/admin/bookings" className="font-label-md text-label-md text-secondary font-semibold hover:underline">← All bookings</Link>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={booking.status} />
        {booking.collection && <span className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">Collection: <StatusBadge value={booking.collection.status} /></span>}
      </div>
      <ErrorBox message={error} onRetry={load} />
      {actionMsg && <p role="status" className="rounded-xl bg-surface-container px-4 py-3 font-body-md text-body-md text-primary">{actionMsg}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-md">
        <div className="xl:col-span-2 flex flex-col gap-space-md">
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[18px]">science</span></span>
              Tests ({(booking.tests || []).length})
            </h2>
            {(booking.tests || []).map((t) => (
              <div key={t.code} className="flex items-center justify-between gap-2 py-2 border-b border-surface-container last:border-0">
                <div><p className="font-label-md text-label-md text-primary">{t.name}</p><p className="font-mono font-body-sm text-body-sm text-on-surface-variant">{t.code}</p></div>
                <span className="font-semibold">{fmtINR(t.price)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-label-lg text-label-lg text-primary"><span>Total payable</span><span>{fmtINR(booking.total)}</span></div>
          </section>

          <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[18px]">location_on</span></span>
              Collection Address
            </h2>
            <p className="font-body-md text-body-md">{[loc.address, loc.area, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}</p>
            <p className="font-body-md text-body-md flex items-center gap-1.5"><span className="material-symbols-outlined text-secondary text-[18px]">flag</span><strong>Landmark:</strong> {loc.landmark}</p>
            {booking.scheduled_at && <p className="font-body-md text-body-md">Scheduled: {fmtDate(booking.scheduled_at)}</p>}
            {loc.latitude && loc.longitude ? (
              <div className="flex flex-col gap-2 pt-1">
                <div className="rounded-xl overflow-hidden border border-outline-variant/60 shadow-sm">
                  <iframe
                    title={`Map — ${booking.booking_number}`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(loc.longitude) - 0.012}%2C${Number(loc.latitude) - 0.008}%2C${Number(loc.longitude) + 0.012}%2C${Number(loc.latitude) + 0.008}&layer=mapnik&marker=${loc.latitude}%2C${loc.longitude}`}
                    className="w-full h-56 border-0"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg">
                    {Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}
                  </span>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude}%2C${loc.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-[16px]">map</span>Open Map
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude}%2C${loc.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-on-secondary-container">
                    <span className="material-symbols-outlined text-[16px]">navigation</span>Navigate
                  </a>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Collector ke liye: landmark + Navigate button — seedha patient ke darwaze tak.</p>
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No GPS coordinates on this booking (booked before location became mandatory).</p>
            )}
          </section>

          <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[18px]">description</span></span>
                Reports ({(booking.reports || []).length})
              </h2>
              {canUpload ? (
                <label className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-label-md font-semibold ${busy ? 'bg-surface-container-low text-on-surface-variant cursor-wait' : 'bg-surface-container text-primary hover:bg-surface-container-high cursor-pointer'}`}>
                  <span className={`material-symbols-outlined text-[18px] ${busy ? 'animate-spin' : ''}`}>{busy ? 'progress_activity' : 'upload'}</span>{busy ? 'Uploading…' : 'Upload PDF'}
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" disabled={busy} onChange={(e) => uploadReport(e.target.files?.[0])} />
                </label>
              ) : (
                <span title="Report upload unlocks after testing starts" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md font-semibold opacity-60 cursor-not-allowed">
                  <span className="material-symbols-outlined text-[18px]">lock</span>Upload PDF
                </span>
              )}
            </div>
            {!canUpload && !['cancelled', 'completed'].includes(booking.status) && (
              <p className="font-body-sm text-body-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Report upload unlocks once testing starts. Current status: {booking.status.replace(/_/g, ' ')}.</p>
            )}
            {upProg !== null && (
              <div className="rounded-xl bg-surface-container-low p-3 flex flex-col gap-2" role="status" aria-label="Upload progress">
                <div className="flex items-center justify-between gap-2 font-body-md text-body-md">
                  <span className="truncate text-primary">{upName || 'Report.pdf'}</span>
                  <span className="font-label-md text-label-md text-secondary font-bold tabular-nums shrink-0">{upProg}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-secondary to-sky-500 transition-all duration-200" style={{ width: `${upProg}%` }} />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{upProg < 100 ? 'Uploading — please wait, do not close.' : 'Processing…'}</p>
              </div>
            )}
            {!(booking.reports || []).length && <p className="font-body-md text-body-md text-on-surface-variant">No report uploaded yet.</p>}
            {(booking.reports || []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-surface-container last:border-0">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-primary truncate">{r.file_name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Uploaded {fmtDate(r.uploaded_at)} • <StatusBadge value={r.status} /></p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={r.access_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-high"><span className="material-symbols-outlined text-[16px]">visibility</span>View</a>
                  <button type="button" disabled={busy} onClick={() => shareWhatsApp(r.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-label-md text-label-md font-semibold shadow-md shadow-emerald-600/25 hover:shadow-lg hover:-translate-y-px active:scale-[0.98] transition-all disabled:opacity-60"><span className="material-symbols-outlined text-[16px]">share</span>Share Report</button>
                </div>
              </div>
            ))}
          </section>

          {/* Timeline lives full-width below the grid. */}
        </div>

        <div className="flex flex-col gap-space-md">
          <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[18px]">person</span></span>
              Patient
            </h2>
            <p className="font-label-lg text-label-lg text-primary">{booking.patient?.name}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{booking.patient?.age} yrs • {booking.patient?.gender}</p>
            <p className="font-body-md text-body-md font-mono">{fmtPhone(booking.patient?.phone)}</p>
            {booking.patient?.email && <p className="font-body-md text-body-md">{booking.patient.email}</p>}
            <button
              type="button" onClick={shareStatus} disabled={statusBusy}
              className="mt-2 self-start inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-label-md text-label-md font-bold shadow-md shadow-emerald-600/25 hover:shadow-lg hover:-translate-y-px active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {statusBusy
                ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Opening…</>
                : <><span className="material-symbols-outlined text-[18px]">share</span>Share Status</>}
            </button>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Sends the live tracking link on patient WhatsApp. Share again after every status change.</p>
          </section>

          {col.staff?.name && (
            <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-primary">Collector</h2>
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </span>
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg text-primary truncate">{col.staff.name}</p>
                  <p className="font-body-md text-body-md font-mono text-on-surface-variant">+91 {String(col.staff.phone).slice(-10)}</p>
                </div>
              </div>
              <button
                type="button" onClick={shareLocation} disabled={waBusy || working}
                className="self-start inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-label-md text-label-md font-bold shadow-md shadow-emerald-600/25 hover:shadow-lg hover:-translate-y-px active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {waBusy
                  ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Opening…</>
                  : <><span className="material-symbols-outlined text-[18px]">share</span>Share Location</>}
              </button>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Sends address + landmark + map pin. Anytime, unlimited.</p>
            </section>
          )}

          {/* THE single place that moves the order forward. One card, one action. */}
          <section className="rounded-2xl bg-primary text-on-primary shadow-md p-space-lg flex flex-col gap-space-sm relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary-fixed font-bold">Next step</span>
              {stageNo > 0 && <span className="font-label-sm text-label-sm text-primary-fixed">Stage {stageNo} of 7</span>}
            </div>
            <p className="font-body-lg text-body-lg text-on-primary">{stageHint}</p>

            {booking.status === 'pending' && (
              <StepBtn working={working} busyKey="confirmed" busyStatus={busyStatus} onClick={() => changeStatus('confirmed')} icon="check_circle" label="Confirm Booking" />
            )}

            {(booking.status === 'confirmed' || (booking.status === 'collection_assigned' && !['assigned', 'on_the_way', 'collected'].includes(col.status))) && (
              <div className="flex flex-col gap-2">
                {col.staff?.name && (
                  <p className="font-body-md text-body-md text-primary-fixed">Currently: <strong>{col.staff.name}</strong>{col.staff.phone ? ` • +91 ${String(col.staff.phone).slice(-10)}` : ''}</p>
                )}
                {selectedStaff ? (
                  <div className="flex items-center justify-between gap-2 px-4 h-11 rounded-lg bg-white/10 border border-secondary-fixed/60">
                    <span className="font-label-md text-label-md text-on-primary truncate">{selectedStaff.name} • +91 {String(selectedStaff.phone).slice(-10)}</span>
                    <button type="button" disabled={working} onClick={() => setSelectedStaff(null)} aria-label="Change collector" className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 disabled:opacity-60 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={staffQuery} onChange={(e) => setStaffQuery(e.target.value)} disabled={working}
                      placeholder="Search collector by name or phone…"
                      className="h-11 px-4 rounded-lg bg-white/10 border border-white/25 outline-none focus:border-secondary-fixed font-body-md text-body-md text-on-primary placeholder:text-primary-fixed"
                      aria-label="Search collector"
                    />
                    {staffSearching && <p className="font-body-sm text-body-sm text-primary-fixed">Searching staff…</p>}
                    {!staffSearching && staffQuery.trim() && staffResults.length === 0 && (
                      <p className="font-body-sm text-body-sm text-primary-fixed">No collector found — add them from Admin → Staff.</p>
                    )}
                    {staffResults.map((s) => (
                      <button key={s.id} type="button" disabled={working} onClick={() => { setSelectedStaff(s); setStaffResults([]); }} className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-left disabled:opacity-60 transition-colors">
                        <span className="font-label-md text-label-md text-on-primary truncate">{s.name}</span>
                        <span className="font-body-sm text-body-sm text-primary-fixed font-mono whitespace-nowrap">+91 {String(s.phone).slice(-10)}{s.area ? ` • ${s.area}` : ''}</span>
                      </button>
                    ))}
                  </>
                )}
                <StepBtn working={working} busyKey="assign" busyStatus={busyStatus} onClick={assignAndDispatch} icon="local_shipping" label="Assign & Dispatch" />
              </div>
            )}

            {booking.status === 'collection_assigned' && col.status === 'assigned' && (
              <StepBtn working={working} busyKey="on_the_way" busyStatus={busyStatus} onClick={() => runCollection('on_the_way', 'on_the_way')} icon="moped" label="Collector Is On The Way" />
            )}

            {booking.status === 'collection_assigned' && col.status === 'on_the_way' && (
              <StepBtn working={working} busyKey="sample_collected" busyStatus={busyStatus} onClick={() => changeStatus('sample_collected')} icon="colorize" label="Sample Collected" />
            )}

            {booking.status === 'collection_assigned' && col.status === 'collected' && (
              <StepBtn working={working} busyKey="sample_collected" busyStatus={busyStatus} onClick={() => changeStatus('sample_collected')} icon="colorize" label="Sample Collected" />
            )}

            {booking.status === 'sample_collected' && (
              <StepBtn working={working} busyKey="testing_in_progress" busyStatus={busyStatus} onClick={() => changeStatus('testing_in_progress')} icon="biotech" label="Start Lab Testing" />
            )}

            {booking.status === 'testing_in_progress' && (
              reports.length === 0 ? (
                <p className="rounded-lg bg-white/10 px-4 py-3 font-body-md text-body-md">Upload the PDF report below first — then come back here to mark it ready.</p>
              ) : (
                <StepBtn working={working} busyKey="report_ready" busyStatus={busyStatus} onClick={() => changeStatus('report_ready')} icon="description" label="Mark Report Ready" />
              )
            )}

            {booking.status === 'report_ready' && (
              reports.length === 0 ? (
                <p className="rounded-lg bg-white/10 px-4 py-3 font-body-md text-body-md">No report found — upload the PDF below first.</p>
              ) : (
                <StepBtn working={working} busyKey="whatsapp" busyStatus={busyStatus} onClick={() => shareWhatsApp(reports[0].id)} icon="share" label="Share Report" />
              )
            )}

            {booking.status === 'completed' && (
              <p className="flex items-center gap-2 font-label-lg text-label-lg text-tertiary-fixed"><span className="material-symbols-outlined">verified</span>Completed — report delivered.</p>
            )}

            {!['completed', 'cancelled'].includes(booking.status) && (
              <button type="button" disabled={working} onClick={() => changeStatus('cancelled')} className="self-start font-label-md text-label-md text-primary-fixed/80 hover:text-error hover:underline disabled:opacity-60">
                Cancel this booking
              </button>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-secondary-container to-tertiary-fixed" />
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">timeline</span>
            </span>
            Timeline
          </h2>
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-bold">{events.length} events</span>
        </div>
        {events.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">No events yet — they will appear here as the booking moves.</p>
        )}
        <div className="flex items-stretch gap-0 overflow-x-auto pb-1 -mx-1 px-1">
          {events.map((h, i, arr) => {
            const latest = i === arr.length - 1;
            // Pulse only while work is still pending — a delivered or
            // cancelled booking is closed, nothing blinks there.
            const live = latest && !['completed', 'cancelled'].includes(booking.status);
            return (
              <div key={i} className="flex items-center shrink-0">
                {i > 0 && (
                  <span aria-hidden="true" className="w-5 sm:w-8 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
                )}
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border min-w-0 ${live ? 'bg-surface-container-low border-secondary/30 shadow-sm' : 'bg-surface-container-low/50 border-outline-variant/40'}`}>
                  <span className={`relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${live ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {live && <span className="absolute inset-0 rounded-full bg-secondary/40 animate-ping" />}
                    <span className="material-symbols-outlined text-[16px] relative">{live ? 'radio_button_checked' : 'check'}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="font-label-md text-label-md text-primary font-semibold capitalize whitespace-nowrap">{String(h.to).replace(/_/g, ' ')}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant tabular-nums whitespace-nowrap">{fmtDate(h.at)}</p>
                    {h.notes && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[160px]" title={h.notes}>{h.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function StepBtn({ working, busyKey, busyStatus, onClick, icon, label }) {
  const active = busyStatus === busyKey;
  return (
    <button
      type="button" disabled={working} onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-lg hover:bg-on-secondary-container transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
    >
      <span className={`material-symbols-outlined text-[20px] ${active ? 'animate-spin' : ''}`}>{active ? 'refresh' : icon}</span>
      {active ? 'Working…' : label}
    </button>
  );
}
