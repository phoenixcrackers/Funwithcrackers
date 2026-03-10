import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

// Error Boundary Component — unchanged
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      console.error('ErrorBoundary caught:', this.state.error);
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl text-center shadow-sm">
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

  // ── all original logic/API calls/charts unchanged ─────────────────────────

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sales-analysis/detailed`);
        if (!response.data || typeof response.data !== 'object') throw new Error('Invalid response format');
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
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());

      const salesCtx = document.getElementById('salesTrendChart')?.getContext('2d');
      if (salesCtx && salesData.trends?.length) {
        chartsRef.current.salesTrendChart = new Chart(salesCtx, {
          type: 'line',
          data: {
            labels: salesData.trends.map(t => t.month),
            datasets: [
              { label: 'Total Amount (Rs)', data: salesData.trends.map(t => t.total_amount), borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)', fill: false, tension: 0.4 },
              { label: 'Amount Paid (Rs)', data: salesData.trends.map(t => t.amount_paid), borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.2)', fill: false, tension: 0.4 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: value => '₹' + value.toLocaleString('en-IN') } } }, plugins: { legend: { position: 'bottom' } } }
        });
      }

      const customerCtx = document.getElementById('customerTypeChart')?.getContext('2d');
      if (customerCtx && salesData.customer_types?.length) {
        chartsRef.current.customerTypeChart = new Chart(customerCtx, {
          type: 'bar',
          data: {
            labels: salesData.customer_types.map(ct => ct.customer_type),
            datasets: [{ label: 'Total Amount (Rs)', data: salesData.customer_types.map(ct => ct.total_amount), backgroundColor: 'rgba(54,162,235,0.6)', borderColor: 'rgba(54,162,235,1)', borderWidth: 1 }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: value => '₹' + value.toLocaleString('en-IN') } } }, plugins: { legend: { position: 'bottom' } } }
        });
      }

      const quotationCtx = document.getElementById('quotationChart')?.getContext('2d');
      if (quotationCtx) {
        chartsRef.current.quotationChart = new Chart(quotationCtx, {
          type: 'pie',
          data: {
            labels: ['Pending', 'Booked', 'Canceled'],
            datasets: [{ data: [salesData.quotations?.pending?.count || 0, salesData.quotations?.booked?.count || 0, salesData.quotations?.canceled?.count || 0], backgroundColor: ['rgba(255,206,86,0.6)', 'rgba(75,192,192,0.6)', 'rgba(255,99,132,0.6)'] }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
      }

      const regionalCtx = document.getElementById('regionalDemandChart')?.getContext('2d');
      if (regionalCtx && salesData.cities?.length) {
        chartsRef.current.regionalDemandChart = new Chart(regionalCtx, {
          type: 'bar',
          data: {
            labels: salesData.cities.map(c => c.district),
            datasets: [{ label: 'Total Amount (Rs)', data: salesData.cities.map(c => c.total_amount), backgroundColor: 'rgba(153,102,255,0.6)', borderColor: 'rgba(153,102,255,1)', borderWidth: 1 }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: value => '₹' + value.toLocaleString('en-IN') } } }, plugins: { legend: { position: 'bottom' } } }
        });
      }
    }
  }, [salesData]);

  const formatValue = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue)) { console.warn('Invalid value for formatting:', value); return '0.00'; }
    return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return '0.00%';
    return ((value / total) * 100).toFixed(2) + '%';
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = Array.isArray(salesData?.products) ? salesData.products.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil((Array.isArray(salesData?.products) ? salesData.products.length : 0) / itemsPerPage);

  const getVisiblePages = () => {
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) startPage = Math.max(1, endPage - maxVisiblePages + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    return () => { Object.values(chartsRef.current).forEach(chart => chart?.destroy()); };
  }, []);

  // ── shared table style ────────────────────────────────────────────────────
  const thCls = "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100";
  const tdCls = "px-4 py-3 text-sm text-gray-700 border-b border-gray-100";
  const tdRCls = "px-4 py-3 text-sm text-gray-700 border-b border-gray-100 text-right";
  const sectionCard = "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden";
  const sectionHeader = "px-6 py-4 border-b border-gray-100 bg-gray-50/70";

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#f5f6f8]">
        <Sidebar />
        <Logout />
        <div className="flex-1 hundred:px-8 mobile:px-4 pt-8 pb-16">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="pb-3 border-b border-gray-200">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Analytics</p>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Market Analysis Report</h1>
            </div>

            {loading && (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              </div>
            )}

            {error && <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}

            {salesData && (
              <div className="space-y-6">

                {/* Sales Trends */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Sales Trends Over Time</h2></div>
                  <div className="p-5">
                    <div className="h-64 mb-5"><canvas id="salesTrendChart" className="w-full h-full" /></div>
                    {!salesData.trends?.length && !loading && <p className="text-sm text-gray-400 text-center">No trends data available</p>}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead><tr>{["Month", "Sales Volume", "Total Amount", "Amount Paid"].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                        <tbody>
                          {salesData.trends.length > 0 ? salesData.trends.map((t, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{t.month}</td>
                              <td className={tdCls}>{t.volume}</td>
                              <td className={tdRCls}>₹{formatValue(t.total_amount)}</td>
                              <td className={tdRCls}>₹{formatValue(t.amount_paid)}</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Product Performance */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Product Performance</h2></div>
                  <div className="p-5">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead><tr><th className={thCls}>Product</th><th className={`${thCls} text-right`}>Units Sold</th></tr></thead>
                        <tbody>
                          {currentProducts.length > 0 ? currentProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{p.productname}</td>
                              <td className={tdRCls}>{p.quantity}</td>
                            </tr>
                          )) : <tr><td colSpan="2" className="px-4 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-4 flex justify-center gap-2">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                          className={`h-8 px-3 rounded-lg text-sm font-semibold transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          Previous
                        </button>
                        {getVisiblePages().map((page) => (
                          <button key={page} onClick={() => paginate(page)}
                            className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {page}
                          </button>
                        ))}
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                          className={`h-8 px-3 rounded-lg text-sm font-semibold transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regional Demand */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Regional Demand</h2></div>
                  <div className="p-5">
                    <div className="h-64 mb-5"><canvas id="regionalDemandChart" className="w-full h-full" /></div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead><tr><th className={thCls}>District</th><th className={`${thCls} text-right`}>Bookings</th><th className={`${thCls} text-right`}>Total Amount</th></tr></thead>
                        <tbody>
                          {salesData.cities.length > 0 ? salesData.cities.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{c.district}</td>
                              <td className={tdRCls}>{c.count}</td>
                              <td className={tdRCls}>₹{formatValue(c.total_amount)}</td>
                            </tr>
                          )) : <tr><td colSpan="3" className="px-4 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Profitability */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Profitability Analysis</h2></div>
                  <div className="p-5 overflow-x-auto">
                    <table className="min-w-full">
                      <thead><tr><th className={thCls}>Metric</th><th className={`${thCls} text-right`}>Value</th></tr></thead>
                      <tbody>
                        {[
                          ['Total Amount (from Total Column)', salesData.profitability.total_amount],
                          ['Amount Paid (from Amount Paid Column)', salesData.profitability.amount_paid],
                          ['Unpaid Amount (Total - Paid)', salesData.profitability.unpaid_amount],
                        ].map(([label, value]) => (
                          <tr key={label} className="hover:bg-gray-50 transition-colors">
                            <td className={tdCls}>{label}</td>
                            <td className={tdRCls}>₹{formatValue(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quotation Conversion */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Quotation Conversion Rates</h2></div>
                  <div className="p-5">
                    <div className="h-64 mb-5"><canvas id="quotationChart" className="w-full h-full" /></div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead><tr><th className={thCls}>Status</th><th className={`${thCls} text-right`}>Count</th><th className={`${thCls} text-right`}>Percentage</th><th className={`${thCls} text-right`}>Total Amount</th></tr></thead>
                        <tbody>
                          {['pending', 'booked', 'canceled'].map(status => {
                            const total = (salesData.quotations.pending?.count || 0) + (salesData.quotations.booked?.count || 0) + (salesData.quotations.canceled?.count || 0);
                            return (
                              <tr key={status} className="hover:bg-gray-50 transition-colors">
                                <td className={tdCls}>{status.charAt(0).toUpperCase() + status.slice(1)}</td>
                                <td className={tdRCls}>{salesData.quotations[status]?.count || 0}</td>
                                <td className={tdRCls}>{calculatePercentage(salesData.quotations[status]?.count || 0, total)}</td>
                                <td className={tdRCls}>₹{formatValue(salesData.quotations[status]?.total_amount || 0)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Customer Type */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Customer Type Analysis</h2></div>
                  <div className="p-5">
                    <div className="h-64 mb-5"><canvas id="customerTypeChart" className="w-full h-full" /></div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead><tr><th className={thCls}>Customer Type</th><th className={`${thCls} text-right`}>Bookings</th><th className={`${thCls} text-right`}>Total Amount</th></tr></thead>
                        <tbody>
                          {salesData.customer_types.length > 0 ? salesData.customer_types.map((ct, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{ct.customer_type}</td>
                              <td className={tdRCls}>{ct.count}</td>
                              <td className={tdRCls}>₹{formatValue(ct.total_amount)}</td>
                            </tr>
                          )) : <tr><td colSpan="3" className="px-4 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Cancellations */}
                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Cancellations</h2></div>
                  <div className="p-5 overflow-x-auto">
                    <table className="min-w-full">
                      <thead><tr><th className={thCls}>Order ID</th><th className={`${thCls} text-right`}>Total</th><th className={thCls}>Date</th></tr></thead>
                      <tbody>
                        {salesData.cancellations.length > 0 ? salesData.cancellations.map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className={tdCls}>{c.order_id}</td>
                            <td className={tdRCls}>₹{formatValue(c.total)}</td>
                            <td className={tdCls}>{new Date(c.created_at).toLocaleDateString('en-GB')}</td>
                          </tr>
                        )) : <tr><td colSpan="3" className="px-4 py-6 text-center text-sm text-gray-400">No cancellations</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}