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
  const [transportDetails, setTransportDetails] = useState({
    transportName: '',
    lrNumber: '',
    transportContact: ''
  });

  const fetchBookings = async () => {
    try {
      const allowedStatuses = ['paid', 'packed', 'dispatched', 'delivered'];
      const statuses = filterStatus ? [filterStatus] : allowedStatuses;
      const response = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, {
        params: { status: statuses.join(',') }
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
      const payload = { status: newStatus };
      if (transportInfo) {
        payload.transportDetails = transportInfo;
      }
      await axios.put(`${API_BASE_URL}/api/tracking/fbookings/${id}/status`, payload);
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === id ? { ...booking, status: newStatus, ...transportInfo } : booking
        )
      );
      if (newStatus === 'dispatched' && transportInfo) {
        setSuccessMessage('Transport details added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setError('');
    } catch (err) {
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
    setTransportDetails({
      transportName: '',
      lrNumber: '',
      transportContact: ''
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTransportDetails({
      transportName: '',
      lrNumber: '',
      transportContact: ''
    });
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
      `Address: ${booking.address || 'N/A'}`,
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

    const sanitizedCustomerName = (booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_');
    doc.output('dataurlnewwindow');
    doc.save(`${sanitizedCustomerName}_crackers_order.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex items-top justify-center mobile:flex mobile:overflow-hidden onefifty:ml-[20%] hundred:ml-[15%]">
        <div className="w-full max-w-5xl p-6 mobile:overflow-hidden">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 mobile:text-2xl">Dispatch Customers</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {successMessage}
            </div>
          )}

    <div className="mb-6 flex justify-center gap-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-48 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="packed">Packed</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
        </select>

        <input
          type="text"
          placeholder="Search by Name, Order ID, or Total"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-96 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="text-center text-gray-700 font-semibold">Sl. No</th>
                  <th className="text-center text-gray-700 font-semibold">Order ID</th>
                  <th className="text-center text-gray-700 font-semibold">Customer Name</th>
                  <th className="text-center text-gray-700 font-semibold">District</th>
                  <th className="text-center text-gray-700 font-semibold">State</th>
                  <th className="text-center text-gray-700 font-semibold">Status</th>
                  <th className="text-center text-gray-700 font-semibold">Action</th>
                  <th className="text-center text-gray-700 font-semibold">View</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter((booking) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      booking.customer_name?.toLowerCase().includes(query) ||
                      booking.order_id?.toLowerCase().includes(query) ||
                      String(booking.total).includes(query)
                    );
                  })
                  .map((booking, index) => (
                    <tr key={booking.id} className="border-b border-gray-300 hover:bg-gray-50">
                      <td className="text-center text-gray-800">{index + 1}</td>
                      <td className="p-2text-center text-gray-800">{booking.order_id}</td>
                      <td className="p-2 text-center text-gray-800">{booking.customer_name}</td>
                      <td className="p-2 text-center text-gray-800">{booking.district}</td>
                      <td className="p-2 text-center text-gray-800">{booking.state}</td>
                      <td className="p-2 text-center text-gray-800">{booking.status}</td>
                      <td className="p-2 text-center">
                        <select
                          value={booking.status}
                          onChange={e => handleStatusChange(booking.id, e.target.value)}
                          className="p-2 border-2 cursor-pointer border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ))}
              </tbody>
            </table>
          </div>

          {/* Modal (unchanged) */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 mobile:p-5">
              <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Transport Details</h2>
                <form onSubmit={handleModalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Name *</label>
                    <input
                      type="text"
                      value={transportDetails.transportName}
                      onChange={(e) => setTransportDetails({ ...transportDetails, transportName: e.target.value })}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LR Number *</label>
                    <input
                      type="text"
                      value={transportDetails.lrNumber}
                      onChange={(e) => setTransportDetails({ ...transportDetails, lrNumber: e.target.value })}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Contact (Optional)</label>
                    <input
                      type="text"
                      value={transportDetails.transportContact}
                      onChange={(e) => setTransportDetails({ ...transportDetails, transportContact: e.target.value })}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 cursor-pointer bg-black/50 text-white rounded-lg hover:bg-gray-800 transition-all"
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
    </div>
  );
}