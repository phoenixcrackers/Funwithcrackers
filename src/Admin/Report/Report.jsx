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

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, {
        params: {
          status: '',
        },
      });
      setBookings(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (isNaN(date)) return 'N/A';
      return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    doc.setFontSize(22);
    doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    const orderDetails = [
      ['Order ID', booking.order_id || 'N/A', 'Customer Name', booking.customer_name || 'N/A'],
      ['Phone', booking.mobile_number || 'N/A', 'District', booking.district || 'N/A'],
      ['State', booking.state || 'N/A', 'Date', formatDate(booking.created_at)],
    ];

    autoTable(doc, {
      startY: 40,
      body: orderDetails,
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 }, 3: { cellWidth: 50 } },
      styles: { fontSize: 12 },
    });

    const startY = doc.lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY,
      head: [['Sl. No', 'Serial No', 'Product Type', 'Product Name', 'Price', 'Quantity', 'Per']],
      body: (booking.products || []).map((product, index) => [
        index + 1,
        product.serial_number || 'N/A',
        product.product_type || 'N/A',
        product.productname || 'N/A',
        `Rs.${product.price || '0.00'}`,
        product.quantity || 0,
        product.per || 'N/A',
      ]),
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: Rs.${booking.total || '0.00'}`, 150, finalY, { align: 'right' });

    const sanitizedCustomerName = (booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${sanitizedCustomerName}_crackers_order.pdf`);
  };

  const exportToExcel = () => {
    const data = bookings.map((b, i) => ({
      'Sl. No': i + 1,
      'Order ID': b.order_id || '',
      'Customer Name': b.customer_name || '',
      'Mobile Number': b.mobile_number || '',
      'District': b.district || '',
      'State': b.state || '',
      'Status': b.status || '',
      'Date': new Date(b.created_at).toLocaleDateString('en-GB'),
      'Address': b.address || '',
      'Total Amount': b.total || '',
      'Products': (b.products || []).map(p =>
        `${p.productname} (x${p.quantity}) - Rs.${p.price} [${p.product_type}]`
      ).join('\n'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    XLSX.writeFile(workbook, 'Bookings_Report.xlsx');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex items-top justify-center onefifty:ml-[20%] hundred:ml-[15%]">
        <div className="w-full max-w-5xl p-6">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 mobile:text-2xl">Report</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {error}
            </div>
          )}

          <div className="flex justify-end mb-4">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              Export to Excel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Booking #{index + 1}</h2>
                    <button
                      onClick={() => generatePDF(booking)}
                      className="flex items-center px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      <FaDownload className="mr-2" />
                      Download PDF
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-700">Order ID:</span> {booking.order_id || 'N/A'}</p>
                    <p><span className="font-medium text-gray-700">Customer Name:</span> {booking.customer_name || 'N/A'}</p>
                    <p><span className="font-medium text-gray-700">Phone:</span> {booking.mobile_number || 'N/A'}</p>
                    <p><span className="font-medium text-gray-700">District:</span> {booking.district || 'N/A'}</p>
                    <p><span className="font-medium text-gray-700">State:</span> {booking.state || 'N/A'}</p>
                    <p><span className="font-medium text-gray-700">Status:</span> {booking.status || 'N/A'}</p>
                    <p><span className="font-medium text-gray-700">Date:</span> {formatDate(booking.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-600 p-4 bg-white rounded-lg shadow-md">
                No bookings found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}