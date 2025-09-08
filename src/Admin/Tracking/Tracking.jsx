import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function Tracking() {
  const [bookings, setBookings] = useState([]);
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const ordersPerPage = 9;

  const styles = {
    input: { 
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", 
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", 
      border: "1px solid rgba(2,132,199,0.3)", 
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  const fetchBookings = async (resetPage = false) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
        params: { status: filterStatus || undefined, customerType: filterCustomerType || undefined }
      });
      const sortedBookings = response.data.sort((a, b) => b.id - a.id);
      setBookings(sortedBookings);
      setError('');
      if (resetPage) {
        setCurrentPage(1);
      }
    } catch {
      setError('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings(true);
    const interval = setInterval(() => fetchBookings(false), 100000);
    return () => clearInterval(interval);
  }, [filterStatus, filterCustomerType]);

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'paid') {
      setSelectedBookingId(id);
      setShowPaidModal(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  const updateStatus = async (id, newStatus, paymentDetails = null) => {
    try {
      const payload = { 
        status: newStatus, 
        payment_method: paymentDetails?.paymentMethod || null, 
        transaction_id: paymentDetails?.transactionId || null, 
        amount_paid: paymentDetails?.amountPaid || null 
      };
      console.log('Request Payload:', payload);
      await axios.put(`${API_BASE_URL}/api/tracking/bookings/${id}/status`, payload);
      setBookings(prev =>
        prev.map(booking =>
          booking.id === id ? { 
            ...booking, 
            status: newStatus, 
            payment_method: paymentDetails?.paymentMethod || null, 
            transaction_id: paymentDetails?.transactionId || null,
            amount_paid: paymentDetails?.amountPaid || null 
          } : booking
        ).sort((a, b) => b.id - a.id)
      );
      setError('');
      setShowPaidModal(false);
      setShowDetailsModal(false);
      setPaymentMethod('cash');
      setTransactionId('');
      setAmountPaid('');
    } catch (err) {
      console.error('Error Response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleProceed = () => {
    setShowPaidModal(false);
    setShowDetailsModal(true);
  };

  const handleFillDetails = () => {
    setShowPaidModal(false);
    setShowDetailsModal(true);
  };

  const handleDetailsSubmit = () => {
    if (!amountPaid.trim() || isNaN(amountPaid) || Number(amountPaid) <= 0) {
      setError('Please enter a valid amount paid');
      return;
    }
    if (paymentMethod === 'bank' && !transactionId.trim()) {
      setError('Transaction ID is required for bank transactions');
      return;
    }
    updateStatus(selectedBookingId, 'paid', { 
      paymentMethod, 
      transactionId, 
      amountPaid: Number(amountPaid)
    });
  };

  const generatePDF = async (booking) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/direct/invoice/${booking.order_id}`, {
          responseType: 'blob'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch PDF');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeCustomerName = (booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        link.setAttribute('download', `${safeCustomerName}-${booking.order_id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
  
        toast.success("Downloaded estimate bill, check downloads", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } catch (err) {
        console.error("PDF download error:", err);
        toast.error("Failed to download PDF. Please try again.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    };

  const filteredBookings = bookings.filter(booking =>
    ['customer_name', 'order_id', 'total', 'customer_type'].some(key =>
      booking[key].toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredBookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);

  const renderSelect = (value, onChange, options, placeholder) => (
    <select
      value={value}
      onChange={onChange}
      className="w-64 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500"
      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex items-start justify-center p-6 mobile:overflow-hidden onefifty:ml-[0%] hundred:ml-[15%] mobile:ml-[0%]">
        <div className="w-full max-w-5xl mobile:p-4">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100 mobile:text-2xl">Tracking</h1>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {error}
            </div>
          )}
          <div className="mb-6 flex justify-center flex-wrap gap-4 mobile:gap-2">
            {renderSelect(filterStatus, e => setFilterStatus(e.target.value), [
              { value: 'booked', label: 'Booked' },
              { value: 'paid', label: 'Paid' },
              { value: 'packed', label: 'Packed' },
              { value: 'dispatched', label: 'Dispatched' },
              { value: 'delivered', label: 'Delivered' }
            ], 'All Statuses')}
            {renderSelect(filterCustomerType, e => setFilterCustomerType(e.target.value), [
              { value: 'Customer', label: 'Customer' },
              { value: 'Agent', label: 'Agent' },
              { value: 'Customer of Selected Agent', label: 'Customer of Selected Agent' },
              { value: 'User', label: 'User' }
            ], 'All Customer Types')}
            <input
              type="text"
              placeholder="Search name, order ID, total, type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-96 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500 mobile:w-full mobile:p-2 mobile:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
          <div className="grid mobile:grid-cols-1 onefifty:grid-cols-2 hundred:grid-cols-3 gap-6 mobile:gap-4">
            {currentOrders.length > 0 ? (
              currentOrders.map((booking, index) => (
                <div key={booking.id} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 mobile:p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">#{indexOfFirstOrder + index + 1}</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{booking.customer_name}</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Contact:</strong>{" "}
                    <a href={`tel:${booking.mobile_number}`} className="text-blue-600 hover:underline">
                      {booking.mobile_number}
                    </a>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Order ID:</strong> {booking.order_id}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Type:</strong> {booking.customer_type}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>District:</strong> {booking.district}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>State:</strong> {booking.state}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Status:</strong> {booking.status}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Amount Paid:</strong> {booking.amount_paid ? `Rs.${booking.amount_paid}` : 'N/A'}</p>
                  {booking.payment_method && (
                    <p className="text-gray-700 dark:text-gray-300"><strong>Payment Method:</strong> {booking.payment_method}</p>
                  )}
                  {booking.transaction_id && (
                    <p className="text-gray-700 dark:text-gray-300"><strong>Transaction ID:</strong> {booking.transaction_id}</p>
                  )}
                  <button
                    onClick={() => generatePDF(booking)}
                    className="flex items-center justify-center px-4 py-2 text-sm text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:text-sm"
                    style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                  >
                    <FaDownload className="mr-2" /> Download Booking
                  </button>
                  <div className="mt-4">
                    {renderSelect(booking.status, e => handleStatusChange(booking.id, e.target.value), [
                      { value: 'booked', label: 'Booked' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'packed', label: 'Packed' },
                      { value: 'dispatched', label: 'Dispatched' },
                      { value: 'delivered', label: 'Delivered' }
                    ], 'Update Status')}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-600 dark:text-gray-400 p-4 mobile:text-sm">No bookings found</div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2 mobile:space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-white disabled:bg-gray-400 dark:disabled:bg-gray-700 hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${currentPage === page ? 'bg-indigo-600 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'} mobile:px-2 mobile:py-1 mobile:text-sm`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-white disabled:bg-gray-400 dark:disabled:bg-gray-700 hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
              >
                Next
              </button>
            </div>
          )}
          {showPaidModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-96 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Update Status to Paid</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Please fill in the payment details.</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleFillDetails}
                    className="px-4 py-2 rounded-lg text-white hover:bg-green-700 dark:hover:bg-green-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                    style={{ background: styles.button.background.replace('2,132,199', '22,163,74').replace('14,165,233', '34,197,94'), backgroundDark: styles.button.backgroundDark.replace('59,130,246', '22,163,74').replace('37,99,235', '20,83,45'), border: styles.button.border.replace('125,211,252', '134,239,172'), borderDark: styles.button.borderDark.replace('147,197,253', '134,239,172'), boxShadow: styles.button.boxShadow.replace('2,132,199', '22,163,74'), boxShadowDark: styles.button.boxShadowDark.replace('59,130,246', '22,163,74') }}
                  >
                    Fill Details
                  </button>
                  <button
                    onClick={() => setShowPaidModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {showDetailsModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-96 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Payment Details</h2>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                  {renderSelect(paymentMethod, e => setPaymentMethod(e.target.value), [
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank', label: 'Bank Transaction' }
                  ], 'Select Payment Method')}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Amount Paid</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder="Enter amount paid"
                    className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500 mobile:text-sm"
                    style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                  />
                </div>
                {paymentMethod === 'bank' && (
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="Enter transaction ID"
                      className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500 mobile:text-sm"
                      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleDetailsSubmit}
                    className="px-4 py-2 rounded-lg text-white hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                    style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}