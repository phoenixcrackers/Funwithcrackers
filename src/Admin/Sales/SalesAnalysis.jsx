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
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg text-center shadow-md">
          An error occurred. Please try again or contact support.
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

  // Refs to store chart instances
  const chartsRef = useRef({});

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sales-analysis/detailed`);
        setSalesData(response.data);
      } catch (err) {
        setError(`Failed to fetch sales data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  useEffect(() => {
    if (salesData) {
      // Destroy existing charts before creating new ones
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());

      // Top 10 Highest Sold Products (Pie Chart)
      const ctx1 = document.getElementById('highestSoldProductsChart')?.getContext('2d');
      if (ctx1) {
        chartsRef.current.highestSoldProductsChart = new Chart(ctx1, {
          type: 'pie',
          data: {
            labels: salesData.top_10_highest_products?.map(p => p.productname) || ['N/A'],
            datasets: [{
              data: salesData.top_10_highest_products?.map(p => p.count) || [100],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0z.6)',
                'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(100, 192, 100, 0.6)',
                'rgba(255, 102, 102, 0.6)'
              ].slice(0, salesData.top_10_highest_products?.length || 1)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      // Top 10 Lowest Sold Products (Pie Chart)
      const ctx2 = document.getElementById('lowestSoldProductsChart')?.getContext('2d');
      if (ctx2) {
        chartsRef.current.lowestSoldProductsChart = new Chart(ctx2, {
          type: 'pie',
          data: {
            labels: salesData.top_10_lowest_products?.map(p => p.productname) || ['N/A'],
            datasets: [{
              data: salesData.top_10_lowest_products?.map(p => p.count) || [100],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(100, 192, 100, 0.6)',
                'rgba(255, 102, 102, 0.6)'
              ].slice(0, salesData.top_10_lowest_products?.length || 1)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      // Top 10 Highest Booked Cities (Pie Chart)
      const ctx3 = document.getElementById('highestBookedCitiesChart')?.getContext('2d');
      if (ctx3) {
        chartsRef.current.highestBookedCitiesChart = new Chart(ctx3, {
          type: 'pie',
          data: {
            labels: salesData.top_10_highest_cities?.map(c => c.district) || ['N/A'],
            datasets: [{
              data: salesData.top_10_highest_cities?.map(c => c.count) || [100],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(100, 192, 100, 0.6)',
                'rgba(255, 102, 102, 0.6)'
              ].slice(0, salesData.top_10_highest_cities?.length || 1)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      // Top 10 Lowest Booked Cities (Pie Chart)
      const ctx4 = document.getElementById('lowestBookedCitiesChart')?.getContext('2d');
      if (ctx4) {
        chartsRef.current.lowestBookedCitiesChart = new Chart(ctx4, {
          type: 'pie',
          data: {
            labels: salesData.top_10_lowest_cities?.map(c => c.district) || ['N/A'],
            datasets: [{
              data: salesData.top_10_lowest_cities?.map(c => c.count) || [100],
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(100, 192, 100, 0.6)',
                'rgba(255, 102, 102, 0.6)'
              ].slice(0, salesData.top_10_lowest_cities?.length || 1)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }

      // Historical Highest Total (Bar Chart)
      const ctx5 = document.getElementById('historicalHighestTotalChart')?.getContext('2d');
      if (ctx5) {
        chartsRef.current.historicalHighestTotalChart = new Chart(ctx5, {
          type: 'bar',
          data: {
            labels: salesData.historical_totals?.map(h => h.analysis_date) || ['N/A'],
            datasets: [{
              label: 'Highest Total (Rs)',
              data: salesData.historical_totals?.map(h => h.highest_total || 0) || [0],
              backgroundColor: 'rgba(255, 206, 86, 0.6)',
              borderColor: 'rgba(255, 206, 86, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: 'Date' } },
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Amount (Rs)' },
                ticks: { callback: (value) => `₹${value.toLocaleString()}` }
              }
            },
            plugins: { legend: { position: 'top' } }
          }
        });
      }
    }
  }, [salesData]);

  const formatValue = (value) => {
    const numValue = Number(value);
    return isNaN(numValue) ? '0.00' : numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Cleanup charts on component unmount
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
        <div className="flex-1 md:ml-64 p-6 pt-16 mobile:p-2">
          <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 mobile:text-2xl dark:text-gray-100">Sales Analysis</h1>
            {loading && <div className="text-center text-gray-500">Loading...</div>}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
                {error}
              </div>
            )}
            {salesData && (
              <div className="space-y-8">
                {/* Top 10 Highest Sold Products Report */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Top 10 Highest Sold Products</h2>
                  <div className="h-64"> {/* Increased from h-40 to h-64 (256px) */}
                    <canvas id="highestSoldProductsChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
                        <th className="border p-2 text-left">Product</th>
                        <th className="border p-2 text-left">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.top_10_highest_products.map((p, index) => (
                        <tr key={index}>
                          <td className="border p-2 dark:text-gray-100">{p.productname}</td>
                          <td className="border p-2 dark:text-gray-100">{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top 10 Lowest Sold Products Report */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Top 10 Lowest Sold Products</h2>
                  <div className="h-64"> {/* Increased from h-40 to h-64 (256px) */}
                    <canvas id="lowestSoldProductsChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Product</th>
                        <th className="border p-2 text-left dark:text-gray-100">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.top_10_lowest_products.map((p, index) => (
                        <tr key={index}>
                          <td className="border p-2 dark:text-gray-100">{p.productname}</td>
                          <td className="border p-2 dark:text-gray-100">{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top 10 Highest Booked Cities Report */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Top 10 Highest Booked Cities</h2>
                  <div className="h-64"> {/* Increased from h-40 to h-64 (256px) */}
                    <canvas id="highestBookedCitiesChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">City</th>
                        <th className="border p-2 text-left dark:text-gray-100">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.top_10_highest_cities.map((c, index) => (
                        <tr key={index}>
                          <td className="border p-2 dark:text-gray-100">{c.district}</td>
                          <td className="border p-2 dark:text-gray-100">{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top 10 Lowest Booked Cities Report */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Top 10 Lowest Booked Cities</h2>
                  <div className="h-64"> {/* Increased from h-40 to h-64 (256px) */}
                    <canvas id="lowestBookedCitiesChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">City</th>
                        <th className="border p-2 text-left dark:text-gray-100">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.top_10_lowest_cities.map((c, index) => (
                        <tr key={index}>
                          <td className="border p-2 dark:text-gray-100">{c.district}</td>
                          <td className="border p-2 dark:text-gray-100">{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Historical Highest Total Report */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Historical Highest Total</h2>
                  <div className="h-40">
                    <canvas id="historicalHighestTotalChart" className="w-full h-full"></canvas>
                  </div>
                  <table className="w-full mt-4 border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-2 text-left dark:text-gray-100">Date</th>
                        <th className="border p-2 text-left dark:text-gray-100">Highest Total (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.historical_totals.map((h, index) => (
                        <tr key={index}>
                          <td className="border p-2 dark:text-gray-100">{h.analysis_date}</td>
                          <td className="border p-2 dark:text-gray-100">₹{formatValue(h.highest_total)}</td>
                        </tr>
                      ))}
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