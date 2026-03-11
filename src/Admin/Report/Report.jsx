import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 9;

  const styles = {
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    },
    greenButton: {
      background: "linear-gradient(135deg, rgba(22,163,74,0.9), rgba(34,197,94,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(22,163,74,0.9), rgba(20,83,45,0.95))",
      border: "1px solid rgba(134,239,172,0.4)",
      boxShadow: "0 15px 35px rgba(22,163,74,0.3)"
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tracking/report-bookings`, {
          params: { status: '' }
        });
        setBookings(response.data);
        setError('');
      } catch {
        setError('Failed to fetch bookings');
      }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'rockets N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'rockets N/A';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`Order ID: ${booking.order_id || 'N/A'}`, doc.internal.pageSize.width / 2, 32, { align: 'center' });

    const orderDetails = [
      ['Customer', booking.customer_name || 'N/A'],
      ['Phone', booking.mobile_number || 'N/A'],
      ['District', booking.district || 'N/A'],
      ['State', booking.state || 'N/A'],
      ['Date', formatDate(booking.created_at)],
      ['Status', booking.status || 'N/A'],
      ['Payment', booking.payment_method || 'N/A'],
      ['Amount Paid', booking.amount_paid ? `₹${booking.amount_paid}` : 'Pending'],
      ['Promocode', booking.promocode || 'None'],
      ['Discount', booking.discount ? `₹${booking.discount}` : '₹0'],
      ['Total', `₹${booking.total || '0.00'}`]
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Details']],
      body: orderDetails,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: [2, 132, 199], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 249, 255] }
    });

    const sanitizedName = (booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${sanitizedName}_${booking.order_id}_invoice.pdf`);
  };

  const exportToExcel = () => {
    const groupedBookings = bookings.reduce((acc, booking) => {
      const status = booking.status || 'Unknown';
      if (!acc[status]) acc[status] = [];
      acc[status].push(booking);
      return acc;
    }, {});

    const workbook = XLSX.utils.book_new();

    Object.keys(groupedBookings).forEach(status => {
      const sortedBookings = [...groupedBookings[status]].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      const data = sortedBookings.map((b, i) => {
        const total = parseFloat(b.total || 0).toFixed(2);
        const discount = parseFloat(b.discount || 0).toFixed(2);

        return {
          'Sl.No': i + 1,
          'Order ID': b.order_id || '',
          'Customer': b.customer_name || '',
          'Phone': b.mobile_number || '',
          'District': b.district || '',
          'State': b.state || '',
          'Status': b.status || '',
          'Date': new Date(b.created_at).toLocaleDateString('en-GB'),
          'Total': `₹${total}`,
          'Discount': `₹${discount}`,
          'Paid': b.amount_paid ? `₹${b.amount_paid}` : '',
          'Method': b.payment_method || '',
          'Txn ID': b.transaction_id || ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const safeStatus = status.replace(/[*?:/\\[\]]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeStatus || 'Bookings');
    });

    XLSX.writeFile(workbook, `Bookings_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = bookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(bookings.length / ordersPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      
      <div className="flex-1 flex flex-col items-center mobile:ml-0 hundred:ml-[15%] onefifty:ml-0">
        <div className="w-full max-w-7xl p-6 mobile:p-3 mobile:pb-20">
          {/* Header */}
          <h1 className="text-4xl mobile:text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
            Bookings Report
          </h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 
                          px-6 py-4 mobile:px-4 mobile:py-3 mobile:text-sm rounded-lg mb-6 text-center shadow-md">
              {error}
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end mb-6 mobile:justify-center">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-6 py-3 mobile:px-4 mobile:py-2 text-white font-medium rounded-lg 
                       hover:scale-105 transition-all shadow-lg mobile:text-sm"
              style={styles.greenButton}
            >
              Export Excel
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid mobile:grid-cols-1 tablet:grid-cols-2 hundred:grid-cols-3 gap-6 mobile:gap-4">
            {currentOrders.length > 0 ? (
              currentOrders.map((booking, index) => (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                           p-6 mobile:p-4 hover:shadow-2xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl mobile:text-lg font-bold text-gray-800 dark:text-gray-100">
                      #{indexOfFirstOrder + index + 1}
                    </h2>
                    <button
                      onClick={() => generatePDF(booking)}
                      className="flex items-center gap-2 px-4 py-2 mobile:px-3 mobile:py-1.5 text-sm text-white rounded-lg 
                               hover:scale-110 transition-all"
                      style={styles.button}
                    >
                      <FaDownload /> PDF
                    </button>
                  </div>

                  <div className="space-y-3 mobile:space-y-2 text-sm mobile:text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Order ID:</span>
                      <span className="text-right font-medium text-black dark:text-white">{booking.order_id || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Customer:</span>
                      <span className="text-right text-black dark:text-white">{booking.customer_name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="text-right text-black dark:text-white">{booking.mobile_number || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="text-right text-black dark:text-white">{booking.district}, {booking.state}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="text-right text-black dark:text-white">{formatDate(booking.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`text-right font-bold ${
                        booking.status === 'paid' ? 'text-green-600' :
                        booking.status === 'dispatched' ? 'text-blue-600' :
                        booking.status === 'canceled' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {booking.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Total:</span>
                      <span className="text-right text-xl font-bold text-green-600">
                        ₹{booking.total || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 mobile:py-12">
                <p className="text-2xl mobile:text-lg text-gray-500 dark:text-gray-400">
                  No bookings found
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 mobile:mt-6 flex justify-center items-center gap-3 flex-wrap">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 mobile:px-4 mobile:py-2 rounded-lg text-white font-medium disabled:opacity-50 
                         disabled:cursor-not-allowed hover:scale-105 transition-all"
                style={styles.button}
              >
                Previous
              </button>

              <div className="flex gap-2 mobile:gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return pageNum <= totalPages ? (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-12 h-12 mobile:w-10 mobile:h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white scale-110'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ) : null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-6 py-3 mobile:px-4 mobile:py-2 rounded-lg text-white font-medium disabled:opacity-50 
                         disabled:cursor-not-allowed hover:scale-105 transition-all"
                style={styles.button}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          [style*="backgroundDark"] { background: var(--bg, ${styles.button.background}); }
          [style*="backgroundDark"][data-dark] { --bg: ${styles.button.backgroundDark}; }
        }
      `}</style>
    </div>
  );
}