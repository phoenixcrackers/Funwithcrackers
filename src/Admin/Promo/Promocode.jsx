import React, { useState, useEffect } from 'react';
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

const Promocode = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [form, setForm] = useState({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── all original logic/API calls unchanged ────────────────────────────────

  useEffect(() => {
    const initLoad = async () => {
      await Promise.all([fetchPromocodes(), fetchProductTypes()]);
      setPageLoading(false);
    };
    initLoad();
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
        ? data.map(item => item.product_type).filter(type => type && type !== 'gift_box_dealers')
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) { setError('Code and discount are required.'); return; }
    try {
      setSubmitLoading(true);
      const payload = {
        code: form.code,
        discount: parseInt(form.discount, 10),
        min_amount: form.min_amount ? parseFloat(form.min_amount) : null,
        end_date: form.end_date || null,
        product_type: form.product_type || null,
      };
      if (isEditing) {
        const res = await fetch(`${API_BASE_URL}/api/promocodes/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update promocode');
        const updated = await res.json();
        setPromocodes((prev) => prev.map((promo) => (promo.id === editingId ? updated : promo)));
      } else {
        const res = await fetch(`${API_BASE_URL}/api/promocodes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create promocode');
        const newPromo = await res.json();
        setPromocodes([...promocodes, newPromo]);
      }
      setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
      setIsEditing(false); setEditingId(null); setError('');
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
        setIsEditing(false); setEditingId(null);
        setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
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
      code: promo.code, discount: promo.discount.toString(),
      min_amount: promo.min_amount ? promo.min_amount.toString() : '',
      end_date: promo.end_date ? promo.end_date.split('T')[0] : '',
      product_type: promo.product_type || '',
    });
    setIsEditing(true); setEditingId(promo.id); setError('');
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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
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
                          : productTypes.map((type) => <option key={type} value={type}>{type}</option>)
                        }
                      </select>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    {isEditing && (
                      <button type="button" onClick={() => {
                        setIsEditing(false); setEditingId(null);
                        setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
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
                        {["Code", "Discount", "Min Amount", "End Date", "Product Type", "Actions"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {promocodes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-5 py-10 text-center text-sm text-gray-400">No promocodes added yet.</td>
                        </tr>
                      ) : (
                        promocodes.map((promo) => {
                          const isExpired = promo.end_date && new Date(promo.end_date) < new Date();
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
                              <td className="px-5 py-3 text-gray-600">{promo.product_type || 'All Products'}</td>
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