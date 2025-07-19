import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

const Promocode = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [form, setForm] = useState({ code: '', discount: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const styles = {
    input: { 
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", 
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", 
      border: "1px solid rgba(2,132,199,0.3)", 
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  useEffect(() => {
    fetchPromocodes();
  }, []);

  const fetchPromocodes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes`);
      const data = await res.json();
      setPromocodes(data);
    } catch (err) {
      console.error('Error fetching promocodes:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) return;

    try {
      if (isEditing) {
        const res = await fetch(`${API_BASE_URL}/api/promocodes/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: form.code,
            discount: parseInt(form.discount, 10),
          }),
        });
        const updated = await res.json();
        setPromocodes((prev) =>
          prev.map((promo) => (promo.id === editingId ? updated : promo))
        );
      } else {
        const res = await fetch(`${API_BASE_URL}/api/promocodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: form.code,
            discount: parseInt(form.discount, 10),
          }),
        });
        const newPromo = await res.json();
        setPromocodes([...promocodes, newPromo]);
      }

      setForm({ code: '', discount: '' });
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error submitting promocode:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/promocodes/${id}`, {
        method: 'DELETE',
      });
      setPromocodes(promocodes.filter((promo) => promo.id !== id));
      if (editingId === id) {
        setIsEditing(false);
        setEditingId(null);
        setForm({ code: '', discount: '' });
      }
    } catch (err) {
      console.error('Error deleting promocode:', err);
    }
  };

  const handleEdit = (promo) => {
    setForm({ code: promo.code, discount: promo.discount });
    setIsEditing(true);
    setEditingId(promo.id);
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 mobile:p-6 hundred:ml-64">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center md:text-center text-gray-900 dark:text-gray-100">Promocode Management</h1>
        <div className="bg-white dark:bg-gray-900 shadow-md rounded p-4 mobile:p-6 max-w-full mobile:max-w-md mx-auto md:mx-0 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{isEditing ? 'Edit Promocode' : 'Add New Promocode'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Code</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500"
                style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={form.discount}
                onChange={handleChange}
                className="w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500"
                style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                required
                min="1"
                max="100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-md text-white dark:text-gray-100 font-semibold hover:bg-blue-700 dark:hover:bg-blue-600"
                style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    setForm({ code: '', discount: '' });
                  }}
                  className="px-4 py-2 rounded-md text-white dark:text-gray-100 font-semibold hover:bg-gray-700 dark:hover:bg-gray-600"
                  style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow-md rounded">
          <table className="min-w-full text-sm text-center">
            <thead className="bg-gray-200 dark:bg-gray-800 text-black dark:text-gray-200 uppercase">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Discount (%)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promocodes.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center p-4 text-gray-500 dark:text-gray-400">
                    No promocodes added yet.
                  </td>
                </tr>
              ) : (
                promocodes.map((promo) => (
                  <tr key={promo.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{promo.code}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{promo.discount}%</td>
                    <td className="px-4 py-2 space-x-5">
                      <button
                        onClick={() => handleEdit(promo)}
                        className="text-blue-600 dark:text-blue-400 bg-gray-300 dark:bg-gray-700 h-10 w-15 font-semibold rounded-lg cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-600 dark:text-red-400 bg-gray-300 dark:bg-gray-700 h-10 w-15 font-semibold rounded-lg cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
};

export default Promocode;