import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

export default function Tracking() {
  const [bookings, setBookings] = useState([]);
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
        params: {
          status: filterStatus || undefined,
          customerType: filterCustomerType || undefined
        }
      });
      setBookings(response.data);
      setError('');
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [filterStatus, filterCustomerType]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/tracking/bookings/${id}/status`, { status: newStatus });
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

  // 🔍 Filter bookings with search term
  const filteredBookings = bookings.filter(booking => {
    const search = searchTerm.toLowerCase();
    return (
      booking.customer_name.toLowerCase().includes(search) ||
      booking.order_id.toLowerCase().includes(search) ||
      booking.total.toString().includes(search) ||
      booking.customer_type.toLowerCase().includes(search)
    );
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredBookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex items-top justify-center mobile:flex mobile:overflow-hidden onefifty:ml-[20%] hundred:ml-[15%]">
        <div className="w-full max-w-5xl p-6 mobile:overflow-hidden">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 mobile:text-2xl">Tracking</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {error}
            </div>
          )}

          <div className="mb-6 flex justify-center flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-64 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="paid">Paid</option>
              <option value="packed">Packed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>

            <select
              value={filterCustomerType}
              onChange={e => setFilterCustomerType(e.target.value)}
              className="w-64 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Customer Types</option>
              <option value="Customer">Customer</option>
              <option value="Agent">Agent</option>
              <option value="Customer of Selected Agent">Customer of Selected Agent</option>
              <option value="User">User</option>
            </select>

            <input
              type="text"
              placeholder="Search name, order ID, total, type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-96 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-4 text-center text-gray-700 font-semibold">Sl. No</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Order ID</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Customer Name</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Customer Type</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">District</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">State</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Status</th>
                  <th className="p-4 text-center text-gray-700 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length > 0 ? (
                  currentOrders.map((booking, index) => (
                    <tr key={booking.id} className="border-b border-gray-300 hover:bg-gray-50">
                      <td className="p-4 text-center text-gray-800">{indexOfFirstOrder + index + 1}</td>
                      <td className="p-4 text-center text-gray-800">{booking.order_id}</td>
                      <td className="p-4 text-center text-gray-800">{booking.customer_name}</td>
                      <td className="p-4 text-center text-gray-800">{booking.customer_type}</td>
                      <td className="p-4 text-center text-gray-800">{booking.district}</td>
                      <td className="p-4 text-center text-gray-800">{booking.state}</td>
                      <td className="p-4 text-center text-gray-800">{booking.status}</td>
                      <td className="p-4 text-center">
                        <select
                          value={booking.status}
                          onChange={e => updateStatus(booking.id, e.target.value)}
                          className="p-2 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="booked">Booked</option>
                          <option value="paid">Paid</option>
                          <option value="packed">Packed</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                        </select>
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

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 cursor-pointer py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-4 py-2 rounded-lg cursor-pointer ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}