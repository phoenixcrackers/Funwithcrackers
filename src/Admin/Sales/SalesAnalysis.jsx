import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

const Spinner = ({ size = 'sm', color = 'text-white' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" color="text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading…</p>
    </div>
  </div>
);

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
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

const SECTION_CONFIG = [
  { id: 'trends', label: 'Sales Trends Over Time', chartKey: 'salesTrendChart' },
  { id: 'products', label: 'Product Performance' },
  { id: 'product_types', label: 'Product Type Mix', chartKey: 'productTypeChart' },
  { id: 'cities', label: 'Regional Demand', chartKey: 'regionalDemandChart' },
  { id: 'profitability', label: 'Profitability Analysis' },
  { id: 'quotations', label: 'Quotation Conversion Rates', chartKey: 'quotationChart' },
  { id: 'customer_types', label: 'Customer Type Analysis', chartKey: 'customerTypeChart' },
  { id: 'cancellations', label: 'Cancellations' },
];

const PALETTE = [
  'rgba(37,99,235,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)',
  'rgba(236,72,153,0.7)', 'rgba(139,92,246,0.7)', 'rgba(20,184,166,0.7)',
  'rgba(239,68,68,0.7)', 'rgba(107,114,128,0.7)',
];

const formatValue = (value) => {
  const numValue = Number(value);
  if (isNaN(numValue)) return '0.00';
  return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const calculatePercentage = (value, total) => {
  if (!total || total === 0) return '0.00%';
  return ((value / total) * 100).toFixed(2) + '%';
};

const KpiCard = ({ label, value, sub, trend }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col gap-1">
    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
    <p className="text-xl font-extrabold text-gray-900 tabular-nums">{value}</p>
    {sub && (
      <p className={`text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
        {sub}
      </p>
    )}
  </div>
);

export default function SalesAnalysis() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const chartsRef = useRef({});

  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [productSort, setProductSort] = useState('quantity');

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('xlsx');
  const [selectedSections, setSelectedSections] = useState(() =>
    Object.fromEntries(SECTION_CONFIG.map((s) => [s.id, true]))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sales-analysis/detailed`);
        if (!response.data || typeof response.data !== 'object') throw new Error('Invalid response format');
        const expectedFields = ['products', 'cities', 'trends', 'profitability', 'quotations', 'customer_types', 'cancellations'];
        if (!expectedFields.every((field) => field in response.data)) {
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

  const productTypes = useMemo(() => {
    if (!Array.isArray(salesData?.products)) return [];
    return [...new Set(salesData.products.map((p) => p.product_type || 'Uncategorized'))].sort();
  }, [salesData]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(salesData?.products)) return [];
    const base = productTypeFilter === 'all'
      ? salesData.products
      : salesData.products.filter((p) => (p.product_type || 'Uncategorized') === productTypeFilter);
    return [...base].sort((a, b) =>
      productSort === 'revenue' ? (b.est_revenue || 0) - (a.est_revenue || 0) : b.quantity - a.quantity
    );
  }, [salesData, productTypeFilter, productSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productTypeFilter, productSort]);

  useEffect(() => {
    if (salesData) {
      Object.values(chartsRef.current).forEach((chart) => chart?.destroy());

      const salesCtx = document.getElementById('salesTrendChart')?.getContext('2d');
      if (salesCtx && salesData.trends?.length) {
        chartsRef.current.salesTrendChart = new Chart(salesCtx, {
          type: 'line',
          data: {
            labels: salesData.trends.map((t) => t.month),
            datasets: [
              { label: 'Total Amount (Rs)', data: salesData.trends.map((t) => t.total_amount), borderColor: 'rgba(37,99,235,1)', backgroundColor: 'rgba(37,99,235,0.15)', fill: true, tension: 0.4 },
              { label: 'Amount Paid (Rs)', data: salesData.trends.map((t) => t.amount_paid), borderColor: 'rgba(16,185,129,1)', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.4 },
              { label: 'Avg Order Value (Rs)', data: salesData.trends.map((t) => t.avg_order_value), borderColor: 'rgba(245,158,11,1)', backgroundColor: 'transparent', borderDash: [5, 4], yAxisID: 'y1', tension: 0.4 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              y: { beginAtZero: true, ticks: { callback: (value) => '₹' + value.toLocaleString('en-IN') } },
              y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: (value) => '₹' + value.toLocaleString('en-IN') } },
            },
            plugins: { legend: { position: 'bottom' } },
          },
        });
      }

      const customerCtx = document.getElementById('customerTypeChart')?.getContext('2d');
      if (customerCtx && salesData.customer_types?.length) {
        chartsRef.current.customerTypeChart = new Chart(customerCtx, {
          type: 'bar',
          data: {
            labels: salesData.customer_types.map((ct) => ct.customer_type),
            datasets: [{ label: 'Total Amount (Rs)', data: salesData.customer_types.map((ct) => ct.total_amount), backgroundColor: 'rgba(54,162,235,0.6)', borderColor: 'rgba(54,162,235,1)', borderWidth: 1 }],
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (value) => '₹' + value.toLocaleString('en-IN') } } }, plugins: { legend: { position: 'bottom' } } },
        });
      }

      const quotationCtx = document.getElementById('quotationChart')?.getContext('2d');
      if (quotationCtx) {
        chartsRef.current.quotationChart = new Chart(quotationCtx, {
          type: 'pie',
          data: {
            labels: ['Pending', 'Booked'],
            datasets: [{ data: [salesData.quotations?.pending?.count || 0, salesData.quotations?.booked?.count || 0], backgroundColor: ['rgba(245,158,11,0.6)', 'rgba(16,185,129,0.6)'] }],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
        });
      }

      const regionalCtx = document.getElementById('regionalDemandChart')?.getContext('2d');
      if (regionalCtx && salesData.cities?.length) {
        chartsRef.current.regionalDemandChart = new Chart(regionalCtx, {
          type: 'bar',
          data: {
            labels: salesData.cities.slice(0, 10).map((c) => c.district),
            datasets: [{ label: 'Total Amount (Rs)', data: salesData.cities.slice(0, 10).map((c) => c.total_amount), backgroundColor: 'rgba(139,92,246,0.6)', borderColor: 'rgba(139,92,246,1)', borderWidth: 1 }],
          },
          options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { callback: (value) => '₹' + value.toLocaleString('en-IN') } } }, plugins: { legend: { position: 'bottom' } } },
        });
      }

      const productTypeCtx = document.getElementById('productTypeChart')?.getContext('2d');
      if (productTypeCtx && salesData.product_types?.length) {
        chartsRef.current.productTypeChart = new Chart(productTypeCtx, {
          type: 'doughnut',
          data: {
            labels: salesData.product_types.map((pt) => pt.product_type),
            datasets: [{ data: salesData.product_types.map((pt) => pt.est_revenue), backgroundColor: salesData.product_types.map((_, i) => PALETTE[i % PALETTE.length]) }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ₹${Number(ctx.parsed).toLocaleString('en-IN')}` } },
            },
          },
        });
      }
    }
  }, [salesData]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getVisiblePages = () => {
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) startPage = Math.max(1, endPage - maxVisiblePages + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    return () => { Object.values(chartsRef.current).forEach((chart) => chart?.destroy()); };
  }, []);

  const getSectionData = (id) => {
    if (!salesData) return { headers: [], rows: [] };
    switch (id) {
      case 'trends':
        return {
          headers: ['Month', 'Volume', 'Total Amount', 'Amount Paid', 'Avg Order Value', 'MoM Growth'],
          rows: (salesData.trends || []).map((t) => [
            t.month, t.volume, formatValue(t.total_amount), formatValue(t.amount_paid),
            formatValue(t.avg_order_value), t.mom_growth === null || t.mom_growth === undefined ? 'N/A' : `${t.mom_growth}%`,
          ]),
        };
      case 'products':
        return {
          headers: ['Product', 'Type', 'Units Sold', 'Est. Revenue'],
          rows: filteredProducts.map((p) => [p.productname, p.product_type || 'Uncategorized', p.quantity, formatValue(p.est_revenue)]),
        };
      case 'product_types':
        return {
          headers: ['Product Type', 'Units Sold', 'Est. Revenue', 'Share'],
          rows: (salesData.product_types || []).map((pt) => [pt.product_type, pt.quantity, formatValue(pt.est_revenue), `${pt.share ?? 0}%`]),
        };
      case 'cities':
        return {
          headers: ['District', 'Bookings', 'Total Amount'],
          rows: (salesData.cities || []).map((c) => [c.district, c.count, formatValue(c.total_amount)]),
        };
      case 'profitability':
        return {
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Amount', formatValue(salesData.profitability?.total_amount)],
            ['Amount Paid', formatValue(salesData.profitability?.amount_paid)],
            ['Unpaid Amount', formatValue(salesData.profitability?.unpaid_amount)],
            ['Collection Rate', `${salesData.profitability?.collection_rate ?? 0}%`],
            ['Avg Order Value', formatValue(salesData.profitability?.avg_order_value)],
          ],
        };
      case 'quotations': {
        const total = ['pending', 'booked'].reduce((s, st) => s + (salesData.quotations?.[st]?.count || 0), 0);
        return {
          headers: ['Status', 'Count', '%', 'Total Amount'],
          rows: ['pending', 'booked'].map((st) => [
            st.charAt(0).toUpperCase() + st.slice(1),
            salesData.quotations?.[st]?.count || 0,
            calculatePercentage(salesData.quotations?.[st]?.count || 0, total),
            formatValue(salesData.quotations?.[st]?.total_amount || 0),
          ]),
        };
      }
      case 'customer_types':
        return {
          headers: ['Customer Type', 'Bookings', 'Total Amount', 'Share'],
          rows: (salesData.customer_types || []).map((ct) => [ct.customer_type, ct.count, formatValue(ct.total_amount), `${ct.share ?? 0}%`]),
        };
      case 'cancellations':
        return {
          headers: ['Order ID', 'Total', 'Date'],
          rows: (salesData.cancellations || []).map((c) => [c.order_id, formatValue(c.total), new Date(c.created_at).toLocaleDateString('en-GB')]),
        };
      default:
        return { headers: [], rows: [] };
    }
  };

  const getDateStamp = () => new Date().toISOString().slice(0, 10);

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();
    let sheetsAdded = 0;
    const usedSheetNames = new Set();

    const addSheet = (name, wsData) => {
      let sheetName = name.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Sheet';
      let unique = sheetName;
      let n = 1;
      while (usedSheetNames.has(unique)) {
        n += 1;
        unique = `${sheetName.slice(0, 28)}_${n}`;
      }
      usedSheetNames.add(unique);
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, unique);
      sheetsAdded += 1;
    };

    SECTION_CONFIG.forEach((sec) => {
      if (!selectedSections[sec.id]) return;

      if (sec.id === 'products') {
        const byType = (salesData.products || []).reduce((acc, p) => {
          const type = p.product_type || 'Uncategorized';
          if (!acc[type]) acc[type] = [];
          acc[type].push(p);
          return acc;
        }, {});
        const headers = ['Product', 'Units Sold', 'Est. Revenue'];
        Object.keys(byType).sort().forEach((type) => {
          const rows = byType[type]
            .sort((a, b) => b.quantity - a.quantity)
            .map((p) => [p.productname, p.quantity, formatValue(p.est_revenue)]);
          addSheet(`Products - ${type}`, [headers, ...(rows.length ? rows : [['No data available']])]);
        });
        return;
      }

      const { headers, rows } = getSectionData(sec.id);
      const wsData = rows.length ? [headers, ...rows] : [headers, ['No data available']];
      addSheet(sec.label, wsData);
    });

    if (sheetsAdded === 0) throw new Error('Select at least one section to download');
    XLSX.writeFile(wb, `sales-analysis-${getDateStamp()}.xlsx`);
  };

  const generatePdf = () => {
    const anySelected = SECTION_CONFIG.some((sec) => selectedSections[sec.id]);
    if (!anySelected) throw new Error('Select at least one section to download');

    const doc = new jsPDF();
    const marginX = 14;
    const pageBottom = 280;

    doc.setFontSize(18);
    doc.setTextColor(20);
    doc.text('Market Analysis Report', marginX, 18);
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, marginX, 25);

    let y = 34;

    SECTION_CONFIG.forEach((sec) => {
      if (!selectedSections[sec.id]) return;
      const { headers, rows } = getSectionData(sec.id);

      if (y > pageBottom - 20) { doc.addPage(); y = 20; }

      doc.setFontSize(13);
      doc.setTextColor(20);
      doc.text(sec.label, marginX, y);
      y += 6;

      if (sec.chartKey && chartsRef.current[sec.chartKey]) {
        try {
          const imgData = chartsRef.current[sec.chartKey].toBase64Image();
          const imgWidth = 120;
          const imgHeight = 65;
          if (y + imgHeight > pageBottom) { doc.addPage(); y = 20; }
          doc.addImage(imgData, 'PNG', marginX, y, imgWidth, imgHeight);
          y += imgHeight + 6;
        } catch (e) {
          console.warn(`Could not capture chart for ${sec.id}:`, e);
        }
      }

      if (rows.length) {
        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: y,
          margin: { left: marginX, right: marginX },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        });
        y = doc.lastAutoTable.finalY + 12;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(160);
        doc.text('No data available', marginX, y);
        y += 12;
      }
    });

    doc.save(`sales-analysis-${getDateStamp()}.pdf`);
  };

  const handleConfirmDownload = async () => {
    setDownloadError('');
    setIsGenerating(true);
    try {
      if (downloadFormat === 'xlsx') generateExcel();
      else generatePdf();
      setShowDownloadModal(false);
    } catch (err) {
      console.error('Download generation failed:', err);
      setDownloadError(err.message || 'Failed to generate the file. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (id) => setSelectedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSelectAll = () => {
    const allSelected = SECTION_CONFIG.every((sec) => selectedSections[sec.id]);
    setSelectedSections(Object.fromEntries(SECTION_CONFIG.map((sec) => [sec.id, !allSelected])));
  };

  const allSectionsSelected = SECTION_CONFIG.every((sec) => selectedSections[sec.id]);
  const noSectionsSelected = SECTION_CONFIG.every((sec) => !selectedSections[sec.id]);

  const thCls = 'px-3 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100';
  const tdCls = 'px-3 py-3 text-sm text-gray-700 border-b border-gray-100';
  const tdRCls = 'px-3 py-3 text-sm text-gray-700 border-b border-gray-100 text-right tabular-nums';
  const sectionCard = 'bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden';
  const sectionHeader = 'px-4 py-4 border-b border-gray-100 bg-gray-50/70';

  const summary = salesData?.summary;

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#f5f6f8]">
        <Sidebar />
        <Logout />
        <div className="flex-1 hundred:ml-64 mobile:ml-0 hundred:px-8 mobile:px-4 pt-8 pb-16">
          <div className="max-w-5xl mx-auto space-y-6">

            <div className="pb-3 border-b border-gray-200 flex items-end justify-between flex-wrap gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Analytics</p>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Market Analysis Report</h1>
              </div>
              {!loading && salesData && (
                <button
                  onClick={() => { setDownloadError(''); setShowDownloadModal(true); }}
                  className="h-9 px-4 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download Report
                </button>
              )}
            </div>

            {loading && <PageLoader />}
            {error && <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}

            {!loading && salesData && (
              <div className="space-y-6">

                {summary && (
                  <div className="grid grid-cols-2 hundred:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KpiCard label="Total Revenue" value={`₹${formatValue(summary.total_revenue)}`} />
                    <KpiCard
                      label="Collection Rate"
                      value={`${summary.collection_rate}%`}
                      sub={`₹${formatValue(summary.total_unpaid)} outstanding`}
                      trend={summary.collection_rate >= 80 ? 'up' : summary.collection_rate < 50 ? 'down' : 'flat'}
                    />
                    <KpiCard label="Avg Order Value" value={`₹${formatValue(summary.avg_order_value)}`} sub={`${summary.booking_volume} bookings`} />
                    <KpiCard
                      label="Quotation Conversion"
                      value={`${summary.conversion_rate}%`}
                      trend={summary.conversion_rate >= 50 ? 'up' : 'down'}
                    />
                    <KpiCard
                      label="MoM Growth"
                      value={summary.mom_growth === null || summary.mom_growth === undefined ? 'N/A' : `${summary.mom_growth > 0 ? '+' : ''}${summary.mom_growth}%`}
                      trend={summary.mom_growth > 0 ? 'up' : summary.mom_growth < 0 ? 'down' : 'flat'}
                    />
                    <KpiCard
                      label="Cancellations"
                      value={summary.cancelled_orders}
                      sub={`₹${formatValue(summary.cancelled_amount)} lost`}
                      trend={summary.cancelled_orders > 0 ? 'down' : 'flat'}
                    />
                  </div>
                )}

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Sales Trends Over Time</h2></div>
                  <div className="p-4">
                    <div className="mobile:h-48 hundred:h-64 mb-5">
                      <canvas id="salesTrendChart" className="w-full h-full" />
                    </div>
                    {!salesData.trends?.length && <p className="text-sm text-gray-400 text-center mb-4">No trends data available</p>}
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Month</th>
                            <th className={thCls}>Volume</th>
                            <th className={`${thCls} text-right`}>Total Amount</th>
                            <th className={`${thCls} text-right`}>Amount Paid</th>
                            <th className={`${thCls} text-right`}>Avg Order Value</th>
                            <th className={`${thCls} text-right`}>MoM Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.trends.length > 0 ? salesData.trends.map((t, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{t.month}</td>
                              <td className={tdCls}>{t.volume}</td>
                              <td className={tdRCls}>₹{formatValue(t.total_amount)}</td>
                              <td className={tdRCls}>₹{formatValue(t.amount_paid)}</td>
                              <td className={tdRCls}>₹{formatValue(t.avg_order_value)}</td>
                              <td className={`${tdRCls} ${t.mom_growth > 0 ? 'text-emerald-600' : t.mom_growth < 0 ? 'text-red-600' : ''}`}>
                                {t.mom_growth === null || t.mom_growth === undefined ? 'N/A' : `${t.mom_growth > 0 ? '+' : ''}${t.mom_growth}%`}
                              </td>
                            </tr>
                          )) : <tr><td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Product Performance</h2></div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Type</label>
                      <select
                        value={productTypeFilter}
                        onChange={(e) => setProductTypeFilter(e.target.value)}
                        className="h-8 px-2 rounded-lg text-sm border border-gray-200 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Types</option>
                        {productTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-2">Sort by</label>
                      <select
                        value={productSort}
                        onChange={(e) => setProductSort(e.target.value)}
                        className="h-8 px-2 rounded-lg text-sm border border-gray-200 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="quantity">Units Sold</option>
                        <option value="revenue">Est. Revenue</option>
                      </select>
                      <span className="text-xs text-gray-400 ml-auto">{filteredProducts.length} products</span>
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Product</th>
                            <th className={thCls}>Type</th>
                            <th className={`${thCls} text-right`}>Units Sold</th>
                            <th className={`${thCls} text-right`}>Est. Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentProducts.length > 0 ? currentProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{p.productname}</td>
                              <td className={tdCls}>{p.product_type || 'Uncategorized'}</td>
                              <td className={tdRCls}>{p.quantity}</td>
                              <td className={tdRCls}>₹{formatValue(p.est_revenue)}</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-4 flex justify-center gap-2 flex-wrap">
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

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Product Type Mix</h2></div>
                  <div className="p-4">
                    <div className="mobile:h-48 hundred:h-64 mb-5">
                      <canvas id="productTypeChart" className="w-full h-full" />
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Product Type</th>
                            <th className={`${thCls} text-right`}>Units Sold</th>
                            <th className={`${thCls} text-right`}>Est. Revenue</th>
                            <th className={`${thCls} text-right`}>Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(salesData.product_types || []).length > 0 ? salesData.product_types.map((pt, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{pt.product_type}</td>
                              <td className={tdRCls}>{pt.quantity}</td>
                              <td className={tdRCls}>₹{formatValue(pt.est_revenue)}</td>
                              <td className={tdRCls}>{pt.share ?? 0}%</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Regional Demand</h2></div>
                  <div className="p-4">
                    <div className="mobile:h-48 hundred:h-64 mb-5">
                      <canvas id="regionalDemandChart" className="w-full h-full" />
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>District</th>
                            <th className={`${thCls} text-right`}>Bookings</th>
                            <th className={`${thCls} text-right`}>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.cities.length > 0 ? salesData.cities.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{c.district}</td>
                              <td className={tdRCls}>{c.count}</td>
                              <td className={tdRCls}>₹{formatValue(c.total_amount)}</td>
                            </tr>
                          )) : <tr><td colSpan="3" className="px-3 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Profitability Analysis</h2></div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Metric</th>
                            <th className={`${thCls} text-right`}>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['Total Amount', `₹${formatValue(salesData.profitability.total_amount)}`],
                            ['Amount Paid', `₹${formatValue(salesData.profitability.amount_paid)}`],
                            ['Unpaid Amount', `₹${formatValue(salesData.profitability.unpaid_amount)}`],
                            ['Collection Rate', `${salesData.profitability.collection_rate ?? 0}%`],
                            ['Avg Order Value', `₹${formatValue(salesData.profitability.avg_order_value)}`],
                          ].map(([label, value]) => (
                            <tr key={label} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{label}</td>
                              <td className={tdRCls}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Quotation Conversion Rates</h2></div>
                  <div className="p-4">
                    <div className="mobile:h-48 hundred:h-64 mb-5">
                      <canvas id="quotationChart" className="w-full h-full" />
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Status</th>
                            <th className={`${thCls} text-right`}>Count</th>
                            <th className={`${thCls} text-right`}>%</th>
                            <th className={`${thCls} text-right`}>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['pending', 'booked'].map((status) => {
                            const total = (salesData.quotations.pending?.count || 0) + (salesData.quotations.booked?.count || 0);
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

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Customer Type Analysis</h2></div>
                  <div className="p-4">
                    <div className="mobile:h-48 hundred:h-64 mb-5">
                      <canvas id="customerTypeChart" className="w-full h-full" />
                    </div>
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Customer Type</th>
                            <th className={`${thCls} text-right`}>Bookings</th>
                            <th className={`${thCls} text-right`}>Total Amount</th>
                            <th className={`${thCls} text-right`}>Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.customer_types.length > 0 ? salesData.customer_types.map((ct, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={tdCls}>{ct.customer_type}</td>
                              <td className={tdRCls}>{ct.count}</td>
                              <td className={tdRCls}>₹{formatValue(ct.total_amount)}</td>
                              <td className={tdRCls}>{ct.share ?? 0}%</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-400">No data available</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className={sectionCard}>
                  <div className={sectionHeader}><h2 className="text-sm font-bold text-gray-700">Cancellations</h2></div>
                  <div className="p-4">
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="max-w-full w-full">
                        <thead>
                          <tr>
                            <th className={thCls}>Order ID</th>
                            <th className={`${thCls} text-right`}>Total</th>
                            <th className={thCls}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesData.cancellations.length > 0 ? salesData.cancellations.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className={`${tdCls} font-mono text-xs`}>{c.order_id}</td>
                              <td className={tdRCls}>₹{formatValue(c.total)}</td>
                              <td className={tdCls}>{new Date(c.created_at).toLocaleDateString('en-GB')}</td>
                            </tr>
                          )) : <tr><td colSpan="3" className="px-3 py-6 text-center text-sm text-gray-400">No cancellations</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {showDownloadModal && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDownloadModal(false); }}
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Download Sales Analysis</h3>
                <button onClick={() => setShowDownloadModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              <div className="px-5 py-4 overflow-y-auto space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Format</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDownloadFormat('xlsx')}
                      className={`flex-1 h-9 rounded-lg text-sm font-semibold border transition-colors ${downloadFormat === 'xlsx' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => setDownloadFormat('pdf')}
                      className={`flex-1 h-9 rounded-lg text-sm font-semibold border transition-colors ${downloadFormat === 'pdf' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Sections</p>
                    <button onClick={toggleSelectAll} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      {allSectionsSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {SECTION_CONFIG.map((sec) => (
                      <label key={sec.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selectedSections[sec.id]}
                          onChange={() => toggleSection(sec.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{sec.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {downloadError && (
                  <div className="px-3 py-2 rounded-lg border bg-red-50 border-red-200 text-red-700 text-xs">{downloadError}</div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="h-9 px-4 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDownload}
                  disabled={isGenerating || noSectionsSelected}
                  className={`h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors ${isGenerating || noSectionsSelected ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isGenerating && <Spinner size="sm" />}
                  {isGenerating ? 'Generating…' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}