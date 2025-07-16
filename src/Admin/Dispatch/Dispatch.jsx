import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaDownload } from 'react-icons/fa';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

export default function Dispatch() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transportDetails, setTransportDetails] = useState({
    transportName: '',
    lrNumber: '',
    transportContact: ''
  });
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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const allowedStatuses = ['paid', 'packed', 'dispatched', 'delivered'];
        const statuses = filterStatus ? [filterStatus] : allowedStatuses;
        const response = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, {
          params: { status: statuses.join(',') }
        });
        setBookings(response.data);
        setError('');
        setCurrentPage(1);
      } catch {
        setError('Failed to fetch bookings');
      }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'dispatched') {
      setSelectedBookingId(id);
      setIsModalOpen(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  const updateStatus = async (id, newStatus, transportInfo = null) => {
    try {
      const payload = { status: newStatus, ...transportInfo };
      await axios.put(`${API_BASE_URL}/api/tracking/fbookings/${id}/status`, payload);
      setBookings(prev =>
        prev.map(booking =>
          booking.id === id ? { ...booking, status: newStatus, ...transportInfo } : booking
        )
      );
      if (newStatus === 'dispatched' && transportInfo) {
        setSuccessMessage('Transport details added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setError('');
    } catch {
      setError('Failed to update status');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!transportDetails.transportName || !transportDetails.lrNumber) {
      setError('Transport Name and LR Number are required');
      return;
    }
    await updateStatus(selectedBookingId, 'dispatched', transportDetails);
    setIsModalOpen(false);
    setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' });
  };

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    const lines = [
      `Order ID: ${booking.order_id || 'N/A'}`,
      `Customer Name: ${booking.customer_name || 'N/A'}`,
      `Contact Number: ${booking.mobile_number || 'N/A'}`,
      `District: ${booking.district || 'N/A'}`,
      `State: ${booking.state || 'N/A'}`,
      `Address: ${booking.address || 'N/A'}`
    ];
    let yOffset = 40;
    lines.forEach(line => {
      doc.text(line, 20, yOffset);
      yOffset += 10;
    });
    autoTable(doc, {
      startY: yOffset + 10,
      head: [['Sl. No', 'Serial No', 'Product Type', 'Product Name', 'Price', 'Quantity', 'Per']],
      body: (booking.products || []).map((product, index) => [
        index + 1,
        product.serial_number || 'N/A',
        product.product_type || 'N/A',
        product.productname || 'N/A',
        `Rs.${product.price || '0.00'}`,
        product.quantity || 0,
        product.per || 'N/A'
      ])
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: Rs.${booking.total || '0.00'}`, 150, finalY, { align: 'right' });
    const sanitizedCustomerName = (booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_');
    doc.output('dataurlnewwindow');
    doc.save(`${sanitizedCustomerName}_crackers_order.pdf`);
  };

  const filteredBookings = bookings.filter(booking =>
    ['customer_name', 'order_id', 'total'].some(key =>
      booking[key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredBookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);

  const renderInput = (value, onChange, placeholder) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500 mobile:p-2 mobile:text-sm"
      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
    />
  );

  const renderSelect = (value, onChange, options, placeholder) => (
    <select
      value={value}
      onChange={onChange}
      className="w-48 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500 mobile:p-2 mobile:text-sm"
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
      <div className="flex-1 flex items-start justify-center p-6 mobile:overflow-hidden onefifty:ml-[20%] hundred:ml-[15%] mobile:ml-[0%]">
        <div className="w-full max-w-5xl mobile:p-4">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100 mobile:text-2xl">Dispatch Customers</h1>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {successMessage}
            </div>
          )}
          <div className="mb-6 flex justify-center gap-4 flex-wrap mobile:gap-2">
            {renderSelect(filterStatus, e => setFilterStatus(e.target.value), [
              { value: 'paid', label: 'Paid' },
              { value: 'packed', label: 'Packed' },
              { value: 'dispatched', label: 'Dispatched' },
              { value: 'delivered', label: 'Delivered' }
            ], 'All Statuses')}
            {renderInput(searchQuery, e => setSearchQuery(e.target.value), 'Search by Name, Order ID, or Total')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
            {currentOrders.length > 0 ? (
              currentOrders.map((booking, index) => (
                <div key={booking.id} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 mobile:p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">#{indexOfFirstOrder + index + 1}</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{booking.customer_name || 'N/A'}</h3>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Order ID:</strong> {booking.order_id || 'N/A'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>District:</strong> {booking.district || 'N/A'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>State:</strong> {booking.state || 'N/A'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>Status:</strong> {booking.status}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {renderSelect(booking.status, e => handleStatusChange(booking.id, e.target.value), [
                      { value: 'paid', label: 'Paid' },
                      { value: 'packed', label: 'Packed' },
                      { value: 'dispatched', label: 'Dispatched' },
                      { value: 'delivered', label: 'Delivered' }
                    ], 'Update Status')}
                    <button
                      onClick={() => generatePDF(booking)}
                      className="flex items-center justify-center px-4 py-2 text-sm text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:text-sm"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      <FaDownload className="mr-2" /> Download
                    </button>
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
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 mobile:p-5">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Transport Details</h2>
                <form onSubmit={handleModalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport Name *</label>
                    {renderInput(transportDetails.transportName, e => setTransportDetails({ ...transportDetails, transportName: e.target.value }), 'Enter transport name')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LR Number *</label>
                    {renderInput(transportDetails.lrNumber, e => setTransportDetails({ ...transportDetails, lrNumber: e.target.value }), 'Enter LR number')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport Contact (Optional)</label>
                    {renderInput(transportDetails.transportContact, e => setTransportDetails({ ...transportDetails, transportContact: e.target.value }), 'Enter contact number')}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-white hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:px-2 mobile:py-1 mobile:text-sm"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      Submit
                    </button>
                  </div>
                </form>
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