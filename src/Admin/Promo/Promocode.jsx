import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

const Promocode = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [form, setForm] = useState({ code: '', discount: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
    <div className="flex flex-col md:flex-row">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 sm:p-6 md:ml-64 bg-gray-50 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center md:text-left">Promocode Management</h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded p-4 sm:p-6 max-w-full sm:max-w-md mx-auto md:mx-0 mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Promocode' : 'Add New Promocode'}</h2>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Code</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Discount (%)</label>
            <input
              type="number"
              name="discount"
              value={form.discount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              min="1"
              max="100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded">
          <table className="min-w-xl text-sm text-center">
            <thead className="bg-gray-200 text-black uppercase">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Discount (%)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promocodes.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center p-4 text-gray-500">
                    No promocodes added yet.
                  </td>
                </tr>
              ) : (
                promocodes.map((promo) => (
                  <tr key={promo.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{promo.code}</td>
                    <td className="px-4 py-2">{promo.discount}%</td>
                    <td className="px-4 py-2 space-x-5">
                      <button
                        onClick={() => handleEdit(promo)}
                        className="text-blue-600 bg-gray-300 h-10 w-15 font-semibold rounded-lg cursor-pointer hover:bg-gray-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-600 bg-gray-300 h-10 w-15 font-semibold rounded-lg cursor-pointer hover:bg-gray-400"
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
    </div>
  );
};

export default Promocode;
