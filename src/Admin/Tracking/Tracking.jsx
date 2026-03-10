import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaDownload, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

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

export default function Tracking() {
  const [bookings, setBookings] = useState([]);
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [detailsSubmitLoading, setDetailsSubmitLoading] = useState(false);
  const ordersPerPage = 9;

  // ── all original logic/API calls unchanged ────────────────────────────────

  const fetchBookings = async (resetPage = false) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
        params: { status: filterStatus || undefined, customerType: filterCustomerType || undefined }
      });
      const sortedBookings = response.data.sort((a, b) => b.id - a.id);
      setBookings(sortedBookings);
      setError('');
      if (resetPage) setCurrentPage(1);
    } catch {
      setError('Failed to fetch bookings');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(true);
    const interval = setInterval(() => fetchBookings(false), 100000);
    return () => clearInterval(interval);
  }, [filterStatus, filterCustomerType]);

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'paid') { setSelectedBookingId(id); setShowPaidModal(true); }
    else updateStatus(id, newStatus);
  };

  const updateStatus = async (id, newStatus, paymentDetails = null) => {
    try {
      setUpdatingStatusId(id);
      const payload = { status: newStatus };
      if (paymentDetails) {
        payload.payment_method = paymentDetails.paymentMethod;
        payload.transaction_id = paymentDetails.transactionId || null;
        payload.amount_paid = paymentDetails.amountPaid;
      }
      await axios.put(`${API_BASE_URL}/api/tracking/bookings/${id}/status`, payload);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id
            ? { ...booking, status: newStatus, ...(paymentDetails && { payment_method: paymentDetails.paymentMethod || booking.payment_method, transaction_id: paymentDetails.transactionId || booking.transaction_id, amount_paid: paymentDetails.amountPaid || booking.amount_paid }) }
            : booking
        ).sort((a, b) => b.id - a.id)
      );
      setError(''); setShowPaidModal(false); setShowDetailsModal(false);
      setPaymentMethod('cash'); setTransactionId(''); setAmountPaid('');
      toast.success("Status updated successfully", { position: "top-center", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true });
    } catch (err) {
      console.error('Error Response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteBooking = async () => {
    try {
      setDeletingLoading(true);
      await axios.delete(`${API_BASE_URL}/api/tracking/bookings/${selectedOrderId}`);
      setBookings((prev) => prev.filter((booking) => booking.order_id !== selectedOrderId));
      setShowDeleteModal(false); setError('');
      toast.success("Booking deleted successfully", { position: "top-center", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true });
    } catch (err) {
      console.error('Error Response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to delete booking');
      setShowDeleteModal(false);
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleFillDetails = () => { setShowPaidModal(false); setShowDetailsModal(true); };

  const handleDetailsSubmit = async () => {
    if (!amountPaid.trim() || isNaN(amountPaid) || Number(amountPaid) <= 0) { setError('Please enter a valid amount paid'); return; }
    if (paymentMethod === 'bank' && !transactionId.trim()) { setError('Transaction ID is required for bank transactions'); return; }
    setDetailsSubmitLoading(true);
    await updateStatus(selectedBookingId, 'paid', { paymentMethod, transactionId: paymentMethod === 'bank' ? transactionId : null, amountPaid: Number(amountPaid) });
    setDetailsSubmitLoading(false);
  };

  const generatePDF = async (booking) => {
    try {
      setDownloadingId(booking.id);
      const response = await fetch(`${API_BASE_URL}/api/direct/invoice/${booking.order_id}`, { responseType: 'blob' });
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeCustomerName = (booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      link.setAttribute('download', `${safeCustomerName}-${booking.order_id}.pdf`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
      toast.success("Downloaded estimate bill, check downloads", { position: "top-center", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true });
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Failed to download PDF. Please try again.", { position: "top-center", autoClose: 5000 });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredBookings = bookings.filter((booking) =>
    ['customer_name', 'order_id', 'total', 'customer_type'].some((key) =>
      booking[key].toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredBookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);

  const getVisiblePages = () => {
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) startPage = Math.max(1, endPage - maxVisiblePages + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // ── shared UI classes ─────────────────────────────────────────────────────
  const ic = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sc = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";
  const lc = "block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5";
  const btnPrimary = "h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer";
  const btnGhost = "h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-all cursor-pointer";
  const btnRed = "h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer";
  const btnGreen = "h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer";

  const renderSelect = (value, onChange, options, placeholder) => (
    <select value={value} onChange={onChange} className={sc}>
      <option value="">{placeholder}</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );

  const statusBadge = (status) => {
    const map = { paid: 'bg-emerald-100 text-emerald-700', dispatched: 'bg-blue-100 text-blue-700', canceled: 'bg-red-100 text-red-700', booked: 'bg-amber-100 text-amber-700' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status || 'pending'}</span>;
  };

  const modalOverlay = "fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4";
  const modalBox = "bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm";

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="flex-1 onefifty:ml-0 hundred:ml-[15%] mobile:ml-0 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-3 border-b border-gray-200">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Orders</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tracking</h1>
          </div>

          {error && <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="w-52">
                  <label className={lc}>Status</label>
                  {renderSelect(filterStatus, (e) => setFilterStatus(e.target.value), [
                    { value: 'booked', label: 'Booked' }, { value: 'paid', label: 'Paid' }
                  ], 'All Statuses')}
                </div>
                <div className="w-64">
                  <label className={lc}>Customer Type</label>
                  {renderSelect(filterCustomerType, (e) => setFilterCustomerType(e.target.value), [
                    { value: 'Customer', label: 'Customer' }, { value: 'Agent', label: 'Agent' },
                    { value: 'Customer of Selected Agent', label: 'Customer of Selected Agent' }, { value: 'User', label: 'User' }
                  ], 'All Customer Types')}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className={lc}>Search</label>
                  <input type="text" placeholder="Name, order ID, total, type..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} className={ic} />
                </div>
              </div>

              {/* Cards */}
              {currentOrders.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 text-center">
                  <p className="text-sm text-gray-400 font-medium">No bookings found</p>
                </div>
              ) : (
                <div className="grid mobile:grid-cols-1 onefifty:grid-cols-2 hundred:grid-cols-3 gap-5">
                  {currentOrders.map((booking, index) => (
                    <div key={booking.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">#{indexOfFirstOrder + index + 1}</p>
                          <h3 className="text-sm font-bold text-gray-800 mt-0.5">{booking.customer_name}</h3>
                        </div>
                        {statusBadge(booking.status)}
                      </div>

                      <div className="space-y-1.5 text-xs mb-4">
                        {[
                          ['Contact', <a href={`tel:${booking.mobile_number}`} className="text-blue-600 hover:underline">{booking.mobile_number}</a>],
                          ['Order ID', booking.order_id],
                          ['Date', formatDate(booking.created_at)],
                          ['Total', <span className="font-bold text-emerald-600">{booking.total}</span>],
                          ['Type', booking.customer_type],
                          ['District', booking.district],
                          ['State', booking.state],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-2">
                            <span className="text-gray-400 font-semibold">{label}</span>
                            <span className="text-gray-700 font-medium text-right">{value}</span>
                          </div>
                        ))}
                        {booking.amount_paid && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400 font-semibold">Amount Paid</span>
                            <span className="text-gray-700 font-medium">Rs.{booking.amount_paid}</span>
                          </div>
                        )}
                        {booking.payment_method && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400 font-semibold">Payment</span>
                            <span className="text-gray-700 font-medium">{booking.payment_method}</span>
                          </div>
                        )}
                        {booking.transaction_id && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-400 font-semibold">Txn ID</span>
                            <span className="text-gray-700 font-medium truncate max-w-[140px]">{booking.transaction_id}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mb-3">
                        <button onClick={() => generatePDF(booking)} disabled={downloadingId === booking.id}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${downloadingId === booking.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}>
                          {downloadingId === booking.id ? <><Spinner color="text-gray-400" />…</> : <><FaDownload className="h-3 w-3" /> Download</>}
                        </button>
                        <button onClick={() => { setSelectedOrderId(booking.order_id); setShowDeleteModal(true); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors cursor-pointer">
                          <FaTrash className="h-3 w-3" /> Delete
                        </button>
                      </div>

                      <div className="relative">
                        {updatingStatusId === booking.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-10">
                            <Spinner color="text-blue-500" />
                          </div>
                        )}
                        <label className={lc}>Update Status</label>
                        {renderSelect(booking.status, (e) => handleStatusChange(booking.id, e.target.value), [
                          { value: 'booked', label: 'Booked' }, { value: 'paid', label: 'Paid' }
                        ], 'Update Status')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  {[
                    { label: 'First', action: () => setCurrentPage(1), disabled: currentPage === 1 },
                    { label: 'Previous', action: () => setCurrentPage(p => Math.max(p - 1, 1)), disabled: currentPage === 1 },
                  ].map(({ label, action, disabled }) => (
                    <button key={label} onClick={action} disabled={disabled}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold transition-all ${disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                  {getVisiblePages().map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {page}
                    </button>
                  ))}
                  {[
                    { label: 'Next', action: () => setCurrentPage(p => Math.min(p + 1, totalPages)), disabled: currentPage === totalPages },
                    { label: 'Last', action: () => setCurrentPage(totalPages), disabled: currentPage === totalPages },
                  ].map(({ label, action, disabled }) => (
                    <button key={label} onClick={action} disabled={disabled}
                      className={`h-9 px-3 rounded-lg text-sm font-semibold transition-all ${disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Paid Confirm Modal */}
      {showPaidModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className="text-base font-bold text-gray-800 mb-2">Update Status to Paid</h2>
            <p className="text-sm text-gray-500 mb-5">Please fill in the payment details.</p>
            <div className="flex gap-3">
              <button onClick={handleFillDetails} className={`flex-1 ${btnGreen}`}>Fill Details</button>
              <button onClick={() => setShowPaidModal(false)} className={`flex-1 ${btnGhost}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetailsModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h2 className="text-base font-bold text-gray-800 mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div>
                <label className={lc}>Payment Method</label>
                {renderSelect(paymentMethod, (e) => setPaymentMethod(e.target.value), [
                  { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transaction' }
                ], 'Select Payment Method')}
              </div>
              <div>
                <label className={lc}>Amount Paid</label>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount paid" className={ic} />
              </div>
              {paymentMethod === 'bank' && (
                <div>
                  <label className={lc}>Transaction ID</label>
                  <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID" className={ic} />
                </div>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={handleDetailsSubmit} disabled={detailsSubmitLoading}
                  className={`flex-1 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${detailsSubmitLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {detailsSubmitLoading ? <><Spinner />Submitting…</> : 'Submit'}
                </button>
                <button onClick={() => setShowDetailsModal(false)} className={`flex-1 ${btnGhost}`}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-2 text-center">Confirm Delete</h2>
            <p className="text-sm text-gray-500 mb-5 text-center">
              Are you sure you want to delete this booking and its associated quotation (if any)?
            </p>
            <div className="flex gap-3">
              <button onClick={handleDeleteBooking} disabled={deletingLoading}
                className={`flex-1 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${deletingLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>
                {deletingLoading ? <><Spinner />Deleting…</> : 'Delete'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className={`flex-1 ${btnGhost}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}