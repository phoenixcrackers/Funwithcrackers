import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

const Spinner = ({ size = 'sm', color = 'text-white' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" color="text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading bookings…</p>
    </div>
  </div>
);

const inputCls = "w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
const selectCls = "w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";

const STATUS_COLORS = {
  paid:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  packed:     'bg-blue-50 text-blue-700 border-blue-200',
  dispatched: 'bg-violet-50 text-violet-700 border-violet-200',
  delivered:  'bg-gray-100 text-gray-600 border-gray-200',
};
const STATUS_DOTS = { paid: 'bg-emerald-400', packed: 'bg-blue-400', dispatched: 'bg-violet-400', delivered: 'bg-gray-400' };

export default function Dispatch() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transportDetails, setTransportDetails] = useState({ transportName: '', lrNumber: '', transportContact: '' });
  const [pageLoading, setPageLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const ordersPerPage = 9;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const allowed = ['paid', 'packed', 'dispatched', 'delivered'];
        const statuses = filterStatus ? [filterStatus] : allowed;
        const res = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, { params: { status: statuses.join(',') } });
        setBookings(res.data); setError(''); setCurrentPage(1);
      } catch { setError('Failed to fetch bookings'); }
      finally { setPageLoading(false); }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'dispatched') { setSelectedBookingId(id); setIsModalOpen(true); }
    else updateStatus(id, newStatus);
  };

  const updateStatus = async (id, newStatus, transportInfo = null) => {
    try {
      setUpdatingStatusId(id);
      const payload = { status: newStatus };
      if (transportInfo) payload.transportDetails = transportInfo;
      await axios.put(`${API_BASE_URL}/api/tracking/fbookings/${id}/status`, payload);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, ...transportInfo } : b));
      if (newStatus === 'dispatched' && transportInfo) { setSuccessMessage('Transport details saved'); setTimeout(() => setSuccessMessage(''), 3000); }
      setError('');
    } catch { setError('Failed to update status'); }
    finally { setUpdatingStatusId(null); }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!transportDetails.transportName || !transportDetails.lrNumber) { setError('Transport Name and LR Number are required'); return; }
    setModalSubmitting(true);
    await updateStatus(selectedBookingId, 'dispatched', transportDetails);
    setIsModalOpen(false); setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' });
    setModalSubmitting(false);
  };

  const generatePDF = async (booking) => {
    try {
      setDownloadingId(booking.id);
      const res = await fetch(`${API_BASE_URL}/api/direct/invoice/${booking.order_id}`);
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}-${booking.order_id}.pdf`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
      toast.success('Downloaded invoice', { position: 'top-center', autoClose: 4000 });
    } catch (err) { toast.error('Failed to download PDF', { position: 'top-center', autoClose: 4000 }); }
    finally { setDownloadingId(null); }
  };

  const filtered = bookings.filter(b => ['customer_name', 'order_id', 'total'].some(k => b[k]?.toString().toLowerCase().includes(searchQuery.toLowerCase())));
  const totalPages = Math.ceil(filtered.length / ordersPerPage);
  const current = filtered.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
  const getPages = () => { const max = 3, start = Math.max(1, Math.min(currentPage - 1, totalPages - max + 1)), end = Math.min(totalPages, start + max - 1); return Array.from({ length: end - start + 1 }, (_, i) => start + i); };

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 flex-1 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-end justify-between pb-2 border-b border-gray-200">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Logistics</p>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">Dispatch Customers</h1>
            </div>
            <p className="text-xs text-gray-400 mb-0.5">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700"><span className="font-bold text-red-400 mt-0.5">⚠</span>{error}</div>}
          {successMessage && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 font-medium"><span>✓</span>{successMessage}</div>}

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className={`${selectCls} w-44`}>
                  <option value="">All Statuses</option>
                  {['paid','packed','dispatched','delivered'].map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Search by name, order ID or total…" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className={`${inputCls} pl-9`} />
                </div>
              </div>

              {/* Cards */}
              {current.length > 0 ? (
                <div className="grid hundred:grid-cols-3 mobile:grid-cols-1 gap-4">
                  {current.map((booking, i) => (
                    <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">#{(currentPage-1)*ordersPerPage+i+1}</p>
                          <h3 className="text-sm font-bold text-gray-800 leading-tight">{booking.customer_name || 'N/A'}</h3>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md border ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[booking.status] || 'bg-gray-400'}`} />
                          {booking.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        {[['Contact', <a href={`tel:${booking.mobile_number}`} className="text-blue-600 hover:underline">{booking.mobile_number}</a>], ['Order ID', booking.order_id || 'N/A'], ['District', booking.district || 'N/A'], ['State', booking.state || 'N/A']].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-2">
                            <span className="text-gray-400 font-semibold">{label}</span>
                            <span className="text-gray-700 font-medium text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <div className="relative">
                          {updatingStatusId === booking.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-10">
                              <Spinner color="text-blue-500" />
                            </div>
                          )}
                          <select
                            value={booking.status}
                            onChange={e => handleStatusChange(booking.id, e.target.value)}
                            disabled={updatingStatusId === booking.id}
                            className={selectCls}
                          >
                            {['paid','packed','dispatched','delivered'].map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                          </select>
                        </div>
                        <button
                          onClick={() => generatePDF(booking)}
                          disabled={downloadingId === booking.id}
                          className={`w-full flex items-center justify-center gap-2 h-8 rounded-lg border text-xs font-semibold transition-all duration-150
                            ${downloadingId === booking.id
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                        >
                          {downloadingId === booking.id ? <><Spinner color="text-gray-400" />Downloading…</> : <><FaDownload className="text-[10px]" /> Download Invoice</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 text-center">
                  <div className="text-3xl mb-3 opacity-30">📦</div>
                  <p className="text-sm text-gray-400 font-medium">No bookings found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-1.5">
                  {[{ label: '«', action: () => setCurrentPage(1), disabled: currentPage === 1 },
                    { label: '‹', action: () => setCurrentPage(p => Math.max(p-1,1)), disabled: currentPage === 1 }].map(({label,action,disabled}) => (
                    <button key={label} onClick={action} disabled={disabled} className={`min-w-[32px] h-8 rounded-md border text-xs font-bold transition-all ${disabled ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>{label}</button>
                  ))}
                  {getPages().map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`min-w-[32px] h-8 rounded-md border text-xs font-bold transition-all ${currentPage === page ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>{page}</button>
                  ))}
                  {[{ label: '›', action: () => setCurrentPage(p => Math.min(p+1,totalPages)), disabled: currentPage === totalPages },
                    { label: '»', action: () => setCurrentPage(totalPages), disabled: currentPage === totalPages }].map(({label,action,disabled}) => (
                    <button key={label} onClick={action} disabled={disabled} className={`min-w-[32px] h-8 rounded-md border text-xs font-bold transition-all ${disabled ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>{label}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Transport modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Transport Details</h2>
              <button onClick={() => { setIsModalOpen(false); setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' }); }} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {[
                { label: 'Transport Name', key: 'transportName', required: true, placeholder: 'Enter transport company' },
                { label: 'LR Number', key: 'lrNumber', required: true, placeholder: 'Enter LR number' },
                { label: 'Transport Contact (Optional)', key: 'transportContact', required: false, placeholder: 'Enter contact number' },
              ].map(({ label, key, required, placeholder }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
                  <input type="text" value={transportDetails[key]} onChange={e => setTransportDetails({ ...transportDetails, [key]: e.target.value })} placeholder={placeholder} required={required} className={inputCls} />
                </div>
              ))}
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setIsModalOpen(false); setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' }); }} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={modalSubmitting} className={`px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-colors flex items-center gap-2 ${modalSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {modalSubmitting ? <><Spinner />Saving…</> : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}