import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

const Spinner = ({ size = 'sm', color = 'text-white' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" color="text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading promocodes…</p>
    </div>
  </div>
);

const parseExceptions = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const Promocode = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [form, setForm] = useState({
    code: '',
    discount: '',
    min_amount: '',
    end_date: '',
    product_type: '',
    exceptions: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Exception multi-select state
  const [isExceptionOpen, setIsExceptionOpen] = useState(false);
  const [exceptionSearch, setExceptionSearch] = useState('');
  const exceptionDropdownRef = useRef(null);

  useEffect(() => {
    const initLoad = async () => {
      await Promise.all([fetchPromocodes(), fetchProductTypes()]);
      setPageLoading(false);
    };
    initLoad();
  }, []);

  // Close exception dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exceptionDropdownRef.current && !exceptionDropdownRef.current.contains(e.target)) {
        setIsExceptionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchPromocodes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes`);
      if (!res.ok) throw new Error('Failed to fetch promocodes');
      const data = await res.json();
      setPromocodes(data);
    } catch (err) {
      console.error('Error fetching promocodes:', err);
      setError('Failed to load promocodes. Please try again.');
    }
  };

  const fetchProductTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`);
      if (!res.ok) throw new Error('Failed to fetch product types');
      const data = await res.json();
      const types = Array.isArray(data)
        ? data
            .map((item) => (typeof item === 'object' && item !== null ? item.product_type : item))
            .filter((type) => type && type !== 'gift_box_dealers')
        : [];
      setProductTypes(types);
    } catch (err) {
      console.error('Error fetching product types:', err);
      setError('Failed to load product types. Please try again.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleToggleException = (type) => {
    setForm((prev) => {
      const exists = prev.exceptions.includes(type);
      const updated = exists
        ? prev.exceptions.filter((t) => t !== type)
        : [...prev.exceptions, type];
      return { ...prev, exceptions: updated };
    });
  };

  const handleRemoveException = (type) => {
    setForm((prev) => ({
      ...prev,
      exceptions: prev.exceptions.filter((t) => t !== type),
    }));
  };

  const handleSelectAllExceptions = () => {
    setForm((prev) => ({ ...prev, exceptions: [...productTypes] }));
  };

  const handleClearAllExceptions = () => {
    setForm((prev) => ({ ...prev, exceptions: [] }));
  };

  const filteredProductTypes = productTypes.filter((t) =>
    t.toLowerCase().includes(exceptionSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) {
      setError('Code and discount are required.');
      return;
    }
    try {
      setSubmitLoading(true);
      const payload = {
        code: form.code,
        discount: parseInt(form.discount, 10),
        min_amount: form.min_amount ? parseFloat(form.min_amount) : null,
        end_date: form.end_date || null,
        product_type: form.product_type || null,
        exceptions: form.exceptions || [],
      };

      if (isEditing) {
        const res = await fetch(`${API_BASE_URL}/api/promocodes/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update promocode');
        const updated = await res.json();
        setPromocodes((prev) => prev.map((promo) => (promo.id === editingId ? updated : promo)));
      } else {
        const res = await fetch(`${API_BASE_URL}/api/promocodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create promocode');
        const newPromo = await res.json();
        setPromocodes([...promocodes, newPromo]);
      }
      setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '', exceptions: [] });
      setIsEditing(false);
      setEditingId(null);
      setError('');
      setIsExceptionOpen(false);
      setExceptionSearch('');
    } catch (err) {
      console.error('Error submitting promocode:', err);
      setError('Failed to save promocode. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE_URL}/api/promocodes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete promocode');
      setPromocodes(promocodes.filter((promo) => promo.id !== id));
      if (editingId === id) {
        setIsEditing(false);
        setEditingId(null);
        setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '', exceptions: [] });
        setIsExceptionOpen(false);
        setExceptionSearch('');
      }
      setError('');
    } catch (err) {
      console.error('Error deleting promocode:', err);
      setError('Failed to delete promocode. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (promo) => {
    setForm({
      code: promo.code,
      discount: promo.discount.toString(),
      min_amount: promo.min_amount ? promo.min_amount.toString() : '',
      end_date: promo.end_date ? promo.end_date.split('T')[0] : '',
      product_type: promo.product_type || '',
      exceptions: parseExceptions(promo.exceptions),
    });
    setIsEditing(true);
    setEditingId(promo.id);
    setError('');
    setIsExceptionOpen(false);
    setExceptionSearch('');
  };

  // ── shared UI classes ─────────────────────────────────────────────────────
  const ic = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sc = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";
  const lc = "block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5";

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="flex-1 hundred:ml-64 mobile:ml-0 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-3 border-b border-gray-200">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Marketing</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Promocode Management</h1>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Form Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-xl">
                  <h2 className="text-sm font-bold text-gray-700">{isEditing ? 'Edit Promocode' : 'Add New Promocode'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={lc}>Code <span className="text-red-400">*</span></label>
                      <input type="text" name="code" value={form.code} onChange={handleChange} className={ic} required />
                    </div>
                    <div>
                      <label className={lc}>Discount (%) <span className="text-red-400">*</span></label>
                      <input type="number" name="discount" value={form.discount} onChange={handleChange} className={ic} required min="1" max="100" />
                    </div>
                    <div>
                      <label className={lc}>Minimum Amount (Optional)</label>
                      <input type="number" name="min_amount" value={form.min_amount} onChange={handleChange} className={ic} min="0" placeholder="Enter minimum amount" />
                    </div>
                    <div>
                      <label className={lc}>End Date (Optional)</label>
                      <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={ic} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={lc}>Product Type (Optional)</label>
                      <select name="product_type" value={form.product_type} onChange={handleChange} className={sc}>
                        <option value="">All products</option>
                        {productTypes.length === 0
                          ? <option disabled>No product types available</option>
                          : productTypes.map((type) => (
                              <option key={type} value={type} className="capitalize">
                                {type.replace(/_/g, ' ')}
                              </option>
                            ))
                        }
                      </select>
                      <p className="text-[11px] text-gray-400 mt-1">Leave as "All products" unless restricted to one type</p>
                    </div>

                    {/* Exception (Multi-Select Product Types) */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={lc} style={{ marginBottom: 0 }}>
                          Exception (Excluded Product Types)
                        </label>
                        {form.exceptions.length > 0 && (
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {form.exceptions.length} excluded
                          </span>
                        )}
                      </div>

                      {/* Toggle Header Button */}
                      <button
                        type="button"
                        onClick={() => setIsExceptionOpen((prev) => !prev)}
                        className="flex items-center justify-between w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-2xs"
                      >
                        <span className={form.exceptions.length ? "font-semibold text-gray-800" : "text-gray-400"}>
                          {form.exceptions.length === 0
                            ? "Click here to choose product types to exclude (optional)…"
                            : `${form.exceptions.length} product type${form.exceptions.length > 1 ? 's' : ''} excluded from promocode`}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold shrink-0">
                          <span>{isExceptionOpen ? "Hide options ▲" : "Select types ▼"}</span>
                        </div>
                      </button>

                      {/* Selected Exception Badges (Visible even when collapsed) */}
                      {form.exceptions.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mr-1">
                            Excluded:
                          </span>
                          {form.exceptions.map((exc) => (
                            <span
                              key={exc}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                            >
                              <span className="capitalize">{exc.replace(/_/g, ' ')}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveException(exc)}
                                className="hover:bg-rose-200/70 rounded-full w-4 h-4 flex items-center justify-center text-rose-600 font-bold ml-0.5 cursor-pointer"
                                title="Remove exclusion"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={handleClearAllExceptions}
                            className="text-[11px] text-gray-400 hover:text-rose-600 underline ml-1 cursor-pointer font-medium"
                          >
                            Clear all
                          </button>
                        </div>
                      )}

                      {/* Expandable Inline Panel (Never cut off or clipped) */}
                      {isExceptionOpen && (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3 shadow-xs">
                          {/* Search & Actions Bar */}
                          <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center pb-2.5 border-b border-gray-200">
                            <div className="relative flex-1 max-w-sm">
                              <input
                                type="text"
                                placeholder="Search product types..."
                                value={exceptionSearch}
                                onChange={(e) => setExceptionSearch(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                              />
                              {exceptionSearch && (
                                <button
                                  type="button"
                                  onClick={() => setExceptionSearch('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-500 font-medium">
                                {filteredProductTypes.length} types available
                              </span>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={handleSelectAllExceptions}
                                className="text-blue-600 hover:underline font-semibold cursor-pointer"
                              >
                                Select all
                              </button>
                              <span className="text-gray-300">•</span>
                              <button
                                type="button"
                                onClick={handleClearAllExceptions}
                                className="text-rose-600 hover:underline font-semibold cursor-pointer"
                              >
                                Clear all
                              </button>
                            </div>
                          </div>

                          {/* 3-Column Responsive Checkbox Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                            {filteredProductTypes.length === 0 ? (
                              <p className="col-span-full text-xs text-gray-400 py-4 text-center">
                                No matching product types found.
                              </p>
                            ) : (
                              filteredProductTypes.map((type) => {
                                const isChecked = form.exceptions.includes(type);
                                return (
                                  <label
                                    key={type}
                                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold shadow-2xs'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100/70 hover:border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleException(type)}
                                      className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0"
                                    />
                                    <span className="capitalize truncate" title={type.replace(/_/g, ' ')}>
                                      {type.replace(/_/g, ' ')}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-gray-200 text-xs text-gray-500">
                            <span>Click checkboxes to exclude types from this promocode.</span>
                            <button
                              type="button"
                              onClick={() => setIsExceptionOpen(false)}
                              className="px-3.5 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-semibold cursor-pointer shadow-2xs"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400 mt-1.5">
                        Promocode will apply to all products EXCEPT the selected product types above.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    {isEditing && (
                      <button type="button" onClick={() => {
                        setIsEditing(false);
                        setEditingId(null);
                        setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '', exceptions: [] });
                        setIsExceptionOpen(false);
                        setExceptionSearch('');
                        setError('');
                      }} className="h-9 px-5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={submitLoading}
                      className={`h-9 px-6 rounded-lg text-white text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2 ${submitLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {submitLoading ? <><Spinner />{isEditing ? 'Updating…' : 'Adding…'}</> : (isEditing ? 'Update' : 'Add')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Table Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                  <h2 className="text-sm font-bold text-gray-700">All Promocodes</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Code", "Discount", "Min Amount", "End Date", "Product Type", "Exceptions", "Actions"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {promocodes.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-5 py-10 text-center text-sm text-gray-400">No promocodes added yet.</td>
                        </tr>
                      ) : (
                        promocodes.map((promo) => {
                          const isExpired = promo.end_date && new Date(promo.end_date) < new Date();
                          const promoExceptions = parseExceptions(promo.exceptions);
                          return (
                            <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3">
                                <span className="font-bold text-gray-800 tracking-wider">{promo.code}</span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  {promo.discount}%
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-600">{promo.min_amount ? `₹${promo.min_amount}` : '—'}</td>
                              <td className="px-5 py-3">
                                {promo.end_date ? (
                                  <span className={`text-xs font-semibold ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                                    {new Date(promo.end_date).toLocaleDateString()}
                                    {isExpired && ' (Expired)'}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-5 py-3 text-gray-600 capitalize">
                                {promo.product_type ? promo.product_type.replace(/_/g, ' ') : 'All Products'}
                              </td>
                              <td className="px-5 py-3">
                                {promoExceptions.length === 0 ? (
                                  <span className="text-gray-400 text-xs italic">None</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                                    {promoExceptions.map((exc) => (
                                      <span
                                        key={exc}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 capitalize"
                                      >
                                        {exc.replace(/_/g, ' ')}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => handleEdit(promo)}
                                    className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors cursor-pointer">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDelete(promo.id)}
                                    disabled={deletingId === promo.id}
                                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${deletingId === promo.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
                                    {deletingId === promo.id ? <><Spinner color="text-gray-400" />Deleting…</> : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Promocode;