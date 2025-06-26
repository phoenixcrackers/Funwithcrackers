import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaDownload } from 'react-icons/fa';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';

export default function Dispatch() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const allowedStatuses = ['paid', 'packed', 'dispatched', 'delivered'];
      const statuses = filterStatus ? [filterStatus] : allowedStatuses;
      const response = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, {
        params: { 
          status: statuses.join(',')
        }
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
  }, [filterStatus]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/tracking/fbookings/${id}/status`, { status: newStatus });
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === id ? { ...booking, status: newStatus } : booking
        )
      );
      setError('');
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    const lines = [
      `Order ID: ${booking.order_id || 'N/A'}`,
      `Customer Name: ${booking.customer_name || 'N/A'}`,
      `District: ${booking.district || 'N/A'}`,
      `State: ${booking.state || 'N/A'}`,
      `Address: ${booking.address || 'N/A'}`
    ];
    let yOffset = 40;
    lines.forEach(line => {
      doc.text(line, 20, yOffset);
      yOffset += 10;
    });

    const startY = yOffset + 10;
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

    // Sanitize filename
    const sanitizedCustomerName = (booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_');
    // Download or view
    doc.output('dataurlnewwindow'); // Opens in new window for viewing
    doc.save(`${sanitizedCustomerName}_crackers_order.pdf`); // Downloads the PDF with sanitized customer_name
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex items-top justify-center mobile:flex mobile:overflow-hidden onefifty:ml-[20%] hundred:ml-[15%]">
        <div className="w-full max-w-5xl p-6 mobile:overflow-hidden">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Dispatch Customers</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {error}
            </div>
          )}

          <div className="mb-6 flex justify-center">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-64 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="packed">Packed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-4 text-center text-gray-700 font-semibold">Sl. No</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Order ID</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Customer Name</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">District</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">State</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Status</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Action</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">View</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((booking, index) => (
                    <tr key={booking.id} className="border-b border-gray-300 hover:bg-gray-50">
                      <td className="p-4 text-center text-gray-800">{index + 1}</td>
                      <td className="p-4 text-center text-gray-800">{booking.order_id}</td>
                      <td className="p-4 text-center text-gray-800">{booking.customer_name}</td>
                      <td className="p-4 text-center text-gray-800">{booking.district}</td>
                      <td className="p-4 text-center text-gray-800">{booking.state}</td>
                      <td className="p-4 text-center text-gray-800">{booking.status}</td>
                      <td className="p-4 text-center">
                        <select
                          value={booking.status}
                          onChange={e => updateStatus(booking.id, e.target.value)}
                          className="p-2 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="paid">Paid</option>
                          <option value="packed">Packed</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-center relative">
                        <button
                            onClick={() => generatePDF(booking)}
                            className="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 text-left"
                        >
                            <FaDownload className="mr-2" />
                            Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-600">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}