import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
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
      <p className="text-sm text-gray-400 font-medium">Loading report…</p>
    </div>
  </div>
);

export default function Report() {
  const [data, setData] = useState([]);           // renamed from bookings → more accurate
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(''); // optional client-side filter
  const [downloadingId, setDownloadingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const itemsPerPage = 9;

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/tracking/report-bookings`);
        setData(res.data);
        setFilteredData(res.data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
    const interval = setInterval(fetchReport, 15000); // slightly longer interval
    return () => clearInterval(interval);
  }, []);

  // Apply client-side status filter
  useEffect(() => {
    if (!statusFilter) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter(item =>
      (item.status || '').toLowerCase() === statusFilter.toLowerCase()
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [statusFilter, data]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const generatePDF = (item) => {
    setDownloadingId(item.id || item.quotation_id);
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });

      const isQuotation = item.source_type === 'QUOTATION';
      const title = isQuotation ? 'Quotation' : 'Booking';
      doc.setFontSize(16);
      doc.text(`${title} ID: ${item.order_id || item.quotation_id || '—'}`, doc.internal.pageSize.width / 2, 32, { align: 'center' });

      const details = [
        ['Customer', item.customer_name || '—'],
        ['Phone', item.mobile_number || '—'],
        ['District', item.district || '—'],
        ['State', item.state || '—'],
        ['Date', formatDate(item.created_at)],
        ['Status', item.status === 'quotation_pending' ? 'Pending Quotation' : (item.status || '—')],
        isQuotation ? null : ['Payment', item.payment_method || '—'],
        isQuotation ? null : ['Amount Paid', item.amount_paid ? `₹${item.amount_paid}` : '—'],
        isQuotation ? ['Total (Quoted)', `₹${item.total || '0.00'}`] : ['Total', `₹${item.total || '0.00'}`],
      ].filter(Boolean);

      autoTable(doc, {
        startY: 45,
        head: [['Field', 'Value']],
        body: details,
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [2, 132, 199], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 249, 255] }
      });

      const prefix = isQuotation ? 'quotation' : 'booking';
      const name = (item.customer_name || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
      const id = item.order_id || item.quotation_id || 'unknown';
      doc.save(`${prefix}_${name}_${id}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const dataForExcel = filteredData.map((item, i) => ({
        '#': i + 1,
        'Type': item.source_type || '—',
        'ID': item.order_id || item.quotation_id || '—',
        'Customer': item.customer_name || '—',
        'Phone': item.mobile_number || '—',
        'District': item.district || '—',
        'State': item.state || '—',
        'Status': item.status === 'quotation_pending' ? 'Pending Quotation' : (item.status || '—'),
        'Date': formatDate(item.created_at),
        'Total': `₹${Number(item.total ?? 0).toFixed(2)}`,
        'Paid': item.amount_paid ? `₹${item.amount_paid}` : '—',
        'Method': item.payment_method || '—',
        'Txn ID': item.transaction_id || '—',
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `FunCrackers_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const statusBadge = (status, source_type) => {
    if (source_type === 'QUOTATION') {
      return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">QUOTATION</span>;
    }

    const styles = {
      paid: 'bg-emerald-100 text-emerald-800',
      dispatched: 'bg-blue-100 text-blue-800',
      delivered: 'bg-indigo-100 text-indigo-800',
      booked: 'bg-amber-100 text-amber-800',
      canceled: 'bg-red-100 text-red-800',
    };

    const cls = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {(status || '—').toUpperCase()}
    </span>;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <Logout />

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-16">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header + Export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Finance / Tracking</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bookings & Quotations Report</h1>
            </div>
            <button
              onClick={exportToExcel}
              disabled={exporting || loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition
                ${exporting ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {exporting ? <><Spinner /> Exporting…</> : 'Export to Excel'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? <PageLoader /> : (
            <>
              {/* Quick stats + filter */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Bookings</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {data.filter(d => d.source_type === 'BOOKING').length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Quotations</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {data.filter(d => d.source_type === 'QUOTATION').length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Paid</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {data.filter(d => d.status === 'paid').length}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Filter Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="paid">Paid</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="quotation_pending">Pending Quotation</option>
                  </select>
                </div>
              </div>

              {/* Cards / Items */}
              {currentItems.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl py-16 text-center">
                  <p className="text-gray-500 font-medium">
                    {statusFilter ? `No entries match status "${statusFilter}"` : 'No bookings or quotations found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentItems.map((item, idx) => {
                    const isQuotation = item.source_type === 'QUOTATION';
                    return (
                      <div
                        key={item.id || item.quotation_id || idx}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-gray-500">#{startIndex + idx + 1}</p>
                            <h3 className="font-semibold text-gray-900 mt-0.5">
                              {item.customer_name || '—'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isQuotation ? 'Quotation' : 'Booking'}
                            </p>
                          </div>

                          <button
                            onClick={() => generatePDF(item)}
                            disabled={downloadingId === (item.id || item.quotation_id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                              ${downloadingId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                          >
                            {downloadingId ? <Spinner color="text-gray-400" /> : <FaDownload className="w-3.5 h-3.5" />}
                            PDF
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID</span>
                            <span className="font-medium">{item.order_id || item.quotation_id || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium">{item.mobile_number || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Location</span>
                            <span className="font-medium text-right">
                              {item.district ? `${item.district}, ${item.state}` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">{formatDate(item.created_at)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t">
                            <span className="text-gray-500">Status</span>
                            {statusBadge(item.status, item.source_type)}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-500 uppercase">Amount</span>
                          <span className="text-xl font-bold text-emerald-700">
                            ₹{Number(item.total ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded text-sm font-medium border
                      ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded text-sm font-medium border
                          ${p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded text-sm font-medium border
                      ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}