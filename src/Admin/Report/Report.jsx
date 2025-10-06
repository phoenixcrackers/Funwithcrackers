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
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    const orderDetails = [
      ['Order ID', booking.order_id || 'N/A', 'Customer Name', booking.customer_name || 'N/A'],
      ['Phone', booking.mobile_number || 'N/A', 'District', booking.district || 'N/A'],
      ['State', booking.state || 'N/A', 'Date', formatDate(booking.created_at)],
      ['Payment Method', booking.payment_method || 'N/A', 'Amount Paid', booking.amount_paid ? `Rs.${booking.amount_paid}` : 'N/A'],
      ['Transaction ID', booking.transaction_id || 'N/A', '', ''],
      ['Promocode', booking.promocode || 'N/A', 'Discount', booking.discount ? `Rs.${booking.discount}` : 'N/A'],
      ['Subtotal', booking.subtotal ? `Rs.${booking.subtotal}` : 'N/A', 'Total', booking.total ? `Rs.${booking.total}` : 'N/A']
    ];
    autoTable(doc, {
      startY: 40,
      body: orderDetails,
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 }, 3: { cellWidth: 50 } },
      styles: { fontSize: 12 }
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: Rs.${booking.total || '0.00'}`, 150, finalY, { align: 'right' });
    const sanitizedCustomerName = (booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${sanitizedCustomerName}_crackers_order.pdf`);
  };

  const exportToExcel = () => {
    // Group bookings by status
    const groupedBookings = bookings.reduce((acc, booking) => {
      const status = booking.status || 'Unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(booking);
      return acc;
    }, {});

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Process each status group
    Object.keys(groupedBookings).forEach(status => {
      // Sort bookings by month ascending within each status
      const sortedBookings = [...groupedBookings[status]].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        const monthA = dateA.getMonth();
        const monthB = dateB.getMonth();
        return monthA - monthB;
      });

      // Map bookings to sheet data
      const data = sortedBookings.map((b, i) => {
        // Calculate total if not provided: subtotal - discount
        const subtotal = b.subtotal || (b.total ? parseFloat(b.total) + (b.discount || 0) : 0);
        const discount = parseFloat(b.discount) || 0;
        const calculatedTotal = subtotal - discount;
        const totalAmount = b.total ? parseFloat(b.total).toFixed(2) : calculatedTotal.toFixed(2);

        return {
          'Sl. No': i + 1,
          'Order ID': b.order_id || '',
          'Customer Name': b.customer_name || '',
          'Mobile Number': b.mobile_number || '',
          'District': b.district || '',
          'State': b.state || '',
          'Status': b.status || '',
          'Date': new Date(b.created_at).toLocaleDateString('en-GB'),
          'Address': b.address || '',
          'Subtotal': subtotal.toFixed(2),
          'Discount': discount.toFixed(2),
          'Promocode': b.promocode || '',
          'Total Amount': `Rs.${totalAmount}`,
          'Payment Method': b.payment_method || '',
          'Amount Paid': b.amount_paid ? `Rs.${b.amount_paid}` : '',
          'Transaction ID': b.transaction_id || ''
        };
      });

      // Create worksheet for this status
      const worksheet = XLSX.utils.json_to_sheet(data);
      // Sanitize sheet name (Excel sheet names can't exceed 31 chars and can't contain some special chars)
      const safeStatus = status.replace(/[*?:/\\[\]]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeStatus || 'Unknown');
    });

    // Write the workbook to file
    XLSX.writeFile(workbook, `Bookings_Report_By_Status.xlsx`);
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = bookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(bookings.length / ordersPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex items-start justify-center onefifty:ml-[0%] hundred:ml-[15%] mobile:ml-[0%]">
        <div className="w-full max-w-5xl p-6 mobile:p-4">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100 mobile:text-2xl">Report</h1>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end mb-4">
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 mobile:text-sm mobile:px-3 mobile:py-1"
              style={{
                background: styles.button.background.replace('2,132,199', '22,163,74').replace('14,165,233', '34,197,94'),
                backgroundDark: styles.button.backgroundDark.replace('59,130,246', '22,163,74').replace('37,99,235', '20,83,45'),
                border: styles.button.border.replace('125,211,252', '134,239,172'),
                borderDark: styles.button.borderDark.replace('147,197,253', '134,239,172'),
                boxShadow: styles.button.boxShadow.replace('2,132,199', '22,163,74'),
                boxShadowDark: styles.button.boxShadowDark.replace('59,130,246', '22,163,74')
              }}
            >
              Export to Excel
            </button>
          </div>
          <div className="grid mobile:grid-cols-1 onefifty:grid-cols-2 hundred:grid-cols-3 gap-6 mobile:gap-4">
            {currentOrders.length > 0 ? (
              currentOrders.map((booking, index) => {
                // Calculate total for display if needed
                const subtotal = booking.subtotal || (booking.total ? parseFloat(booking.total) + (booking.discount || 0) : 0);
                const discount = parseFloat(booking.discount) || 0;
                const calculatedTotal = subtotal - discount;
                const totalAmount = booking.total ? parseFloat(booking.total).toFixed(2) : calculatedTotal.toFixed(2);

                return (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 mobile:p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Booking #{indexOfFirstOrder + index + 1}</h2>
                      <button
                        onClick={() => generatePDF(booking)}
                        className="flex items-center px-3 py-2 text-sm text-white rounded-md hover:bg-indigo-700 dark:hover:bg-blue-600 mobile:text-sm"
                        style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                      >
                        <FaDownload className="mr-2" />
                        Download PDF
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Order ID:</span> {booking.order_id || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Customer Name:</span> {booking.customer_name || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Phone:</span> {booking.mobile_number || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">District:</span> {booking.district || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">State:</span> {booking.state || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Status:</span> {booking.status || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Date:</span> {formatDate(booking.created_at)}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Total Amount:</span> Rs.{booking.total}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Payment Method:</span> {booking.payment_method || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Amount Paid:</span> {booking.amount_paid ? `Rs.${booking.amount_paid}` : 'N/A'}</p>
                      {booking.transaction_id && (
                        <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Transaction ID:</span> {booking.transaction_id}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-600 dark:text-gray-400 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mobile:text-sm">
                No bookings found
              </div>
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
        </div>
      </div>
      <style>{`
        [style*="backgroundDark"] { background: var(--bg, ${styles.button.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.button.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.button.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.button.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}