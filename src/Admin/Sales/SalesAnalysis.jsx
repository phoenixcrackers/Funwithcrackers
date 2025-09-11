import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      console.error('ErrorBoundary caught:', this.state.error);
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg text-center shadow-md">
          An error occurred: {this.state.error?.message || 'Unknown error'}. Please try again or contact support.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SalesAnalysis() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const chartsRef = useRef({});

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sales-analysis/detailed`);
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid response format');
        }
        const expectedFields = ['products', 'cities', 'trends', 'profitability', 'quotations', 'customer_types', 'cancellations'];
        if (!expectedFields.every(field => field in response.data)) {
          console.warn('Missing fields in response:', response.data);
          throw new Error('Incomplete data received from server');
        }
        setSalesData(response.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to fetch sales data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  useEffect(() => {
    if (salesData) {
      console.log('Fetched salesData:', salesData);
      // Destroy existing charts
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());

      // Sales Trends Over Time (Line Chart)
      const salesCtx = document.getElementById('salesTrendChart')?.getContext('2d');
      if (salesCtx) {
        if (!salesData.trends?.length) {
          console.warn('No trends data available for salesTrendChart');
        } else {
          chartsRef.current.salesTrendChart = new Chart(salesCtx, {
            type: 'line',
            data: {
              labels: salesData.trends.map(t => t.month),
              datasets: [
                {
                  label: 'Total Amount (Rs)',
                  data: salesData.trends.map(t => t.total_amount),
                  borderColor: 'rgba(75, 192, 192, 1)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  fill: false,
                  tension: 0.4
                },
                {
                  label: 'Amount Paid (Rs)',
                  data: salesData.trends.map(t => t.amount_paid),
                  borderColor: 'rgba(255, 99, 132, 1)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  fill: false,
                  tension: 0.4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: value => '₹' + value.toLocaleString('en-IN')
                  }
                }
              },
              plugins: { legend: { position: 'bottom' } }
            }
          });
        }
      } else {
        console.warn('Canvas #salesTrendChart not found');
      }

      // Customer Type Analysis (Bar Chart)
      const customerCtx = document.getElementById('customerTypeChart')?.getContext('2d');
      if (customerCtx) {
        if (!salesData.customer_types?.length) {
          console.warn('No customer_types data available for customerTypeChart');
        } else {
          chartsRef.current.customerTypeChart = new Chart(customerCtx, {
            type: 'bar',
            data: {
              labels: salesData.customer_types.map(ct => ct.customer_type),
              datasets: [{
                label: 'Total Amount (Rs)',
                data: salesData.customer_types.map(ct => ct.total_amount),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: value => '₹' + value.toLocaleString('en-IN')
                  }
                }
              },
              plugins: { legend: { position: 'bottom' } }
            }
          });
        }
      } else {
        console.warn('Canvas #customerTypeChart not found');
      }

      // Quotation Conversion Rates (Pie Chart)
      const quotationCtx = document.getElementById('quotationChart')?.getContext('2d');
      if (quotationCtx) {
        chartsRef.current.quotationChart = new Chart(quotationCtx, {
          type: 'pie',
          data: {
            labels: ['Pending', 'Booked', 'Canceled'],
            datasets: [{
              data: [
                salesData.quotations?.pending?.count || 0,
                salesData.quotations?.booked?.count || 0,
                salesData.quotations?.canceled?.count || 0
              ],
              backgroundColor: [
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 99, 132, 0.6)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      } else {
        console.warn('Canvas #quotationChart not found');
      }

      // Regional Demand (Bar Chart)
      const regionalCtx = document.getElementById('regionalDemandChart')?.getContext('2d');
      if (regionalCtx && salesData.cities?.length) {
        chartsRef.current.regionalDemandChart = new Chart(regionalCtx, {
          type: 'bar',
          data: {
            labels: salesData.cities.map(c => c.district),
            datasets: [{
              label: 'Total Amount (Rs)',
              data: salesData.cities.map(c => c.total_amount),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: value => '₹' + value.toLocaleString('en-IN') }
              }
            },
            plugins: { legend: { position: 'bottom' } }
          }
        });
      } else {
        console.warn('Canvas #regionalDemandChart not found or no data');
      }
    }
  }, [salesData]);

  const formatValue = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.warn('Invalid value for formatting:', value);
      return '0.00';
    }
    return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return '0.00%';
    return ((value / total) * 100).toFixed(2) + '%';
  };

  // Pagination for Product Performance
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = Array.isArray(salesData?.products)
    ? salesData.products.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil((Array.isArray(salesData?.products) ? salesData.products.length : 0) / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen dark:bg-gray-800 bg-gray-50 mobile:flex-col">
        <Sidebar />
        <Logout />
        <div className="flex-1 p-6 pt-16 mobile:p-2">
          <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 mobile:text-2xl dark:text-gray-100">Market Analysis Report</h1>
            {loading && <div className="text-center text-gray-500">Loading...</div>}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-4 mobile:py-2">
                {error}
              </div>
            )}
            {salesData && (
              <div className="space-y-8">
                {/* Sales Trends Over Time */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Sales Trends Over Time</h2>
                  <div className="h-64">
                    <canvas id="salesTrendChart" className="w-full h-full"></canvas>
                  </div>
                  {!salesData.trends?.length && !loading && (
                    <div className="text-center text-gray-500">No trends data available</div>
                  )}
                  <table className="w-full border-collapse mt-4">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Month</th>
                        <th className="border p-2 text-right dark:text-gray-100">Sales Volume</th>
                        <th className="border p-2 text-right dark:text-gray-100">Total Amount (Rs)</th>
                        <th className="border p-2 text-right dark:text-gray-100">Amount Paid (Rs)</th>
                        <th className="border p-2 text-right dark:text-gray-100">Unpaid Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.trends.length > 0 ? (
                        salesData.trends.map((t, index) => (
                          <tr key={index}>
                            <td className="border p-2 dark:text-gray-100">{t.month}</td>
                            <td className="border p-2 text-right dark:text-gray-100">{t.volume}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(t.total_amount)}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(t.amount_paid)}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(t.unpaid_amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="border p-2 text-center dark:text-gray-100">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Product Performance */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Product Performance</h2>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Product</th>
                        <th className="border p-2 text-right dark:text-gray-100">Units Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.length > 0 ? (
                        currentProducts.map((p, index) => (
                          <tr key={index}>
                            <td className="border p-2 dark:text-gray-100">{p.productname}</td>
                            <td className="border p-2 text-right dark:text-gray-100">{p.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="border p-2 text-center dark:text-gray-100">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
                          className={`px-4 py-2 rounded ${
                            currentPage === i + 1
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Regional Demand */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Regional Demand</h2>
                  <div className="h-64">
                    <canvas id="regionalDemandChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">District</th>
                        <th className="border p-2 text-right dark:text-gray-100">Bookings</th>
                        <th className="border p-2 text-right dark:text-gray-100">Total Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.cities.length > 0 ? (
                        salesData.cities.map((c, index) => (
                          <tr key={index}>
                            <td className="border p-2 dark:text-gray-100">{c.district}</td>
                            <td className="border p-2 text-right dark:text-gray-100">{c.count}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(c.total_amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="border p-2 text-center dark:text-gray-100">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Profitability Analysis */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Profitability Analysis</h2>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Metric</th>
                        <th className="border p-2 text-right dark:text-gray-100">Value (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 dark:text-gray-100">Total Amount (from Total Column)</td>
                        <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(salesData.profitability.total_amount)}</td>
                      </tr>
                      <tr>
                        <td className="border p-2 dark:text-gray-100">Amount Paid (from Amount Paid Column)</td>
                        <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(salesData.profitability.amount_paid)}</td>
                      </tr>
                      <tr>
                        <td className="border p-2 dark:text-gray-100">Unpaid Amount (Total - Paid)</td>
                        <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(salesData.profitability.unpaid_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Quotation Conversion Rates */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Quotation Conversion Rates</h2>
                  <div className="h-64">
                    <canvas id="quotationChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Status</th>
                        <th className="border p-2 text-right dark:text-gray-100">Count</th>
                        <th className="border p-2 text-right dark:text-gray-100">Percentage</th>
                        <th className="border p-2 text-right dark:text-gray-100">Total Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['pending', 'booked', 'canceled'].map(status => {
                        const total = (salesData.quotations.pending?.count || 0) + (salesData.quotations.booked?.count || 0) + (salesData.quotations.canceled?.count || 0);
                        return (
                          <tr key={status}>
                            <td className="border p-2 dark:text-gray-100">{status.charAt(0).toUpperCase() + status.slice(1)}</td>
                            <td className="border p-2 text-right dark:text-gray-100">{salesData.quotations[status]?.count || 0}</td>
                            <td className="border p-2 text-right dark:text-gray-100">{calculatePercentage(salesData.quotations[status]?.count || 0, total)}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(salesData.quotations[status]?.total_amount || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Customer Type Analysis */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Customer Type Analysis</h2>
                  <div className="h-64">
                    <canvas id="customerTypeChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Customer Type</th>
                        <th className="border p-2 text-right dark:text-gray-100">Bookings</th>
                        <th className="border p-2 text-right dark:text-gray-100">Total Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.customer_types.length > 0 ? (
                        salesData.customer_types.map((ct, index) => (
                          <tr key={index}>
                            <td className="border p-2 dark:text-gray-100">{ct.customer_type}</td>
                            <td className="border p-2 text-right dark:text-gray-100">{ct.count}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(ct.total_amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="border p-2 text-center dark:text-gray-100">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cancellation Report */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Cancellations</h2>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Type</th>
                        <th className="border p-2 text-left dark:text-gray-100">ID</th>
                        <th className="border p-2 text-right dark:text-gray-100">Total (Rs)</th>
                        <th className="border p-2 text-left dark:text-gray-100">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.cancellations.length > 0 ? (
                        salesData.cancellations.map((c, index) => (
                          <tr key={index}>
                            <td className="border p-2 dark:text-gray-100">{c.type}</td>
                            <td className="border p-2 dark:text-gray-100">{c.order_id}</td>
                            <td className="border p-2 text-right dark:text-gray-100">₹{formatValue(c.total)}</td>
                            <td className="border p-2 dark:text-gray-100">{new Date(c.created_at).toLocaleDateString('en-GB')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="border p-2 text-center dark:text-gray-100">No cancellations</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}