import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../App.css';
import { API_BASE_URL } from "../../../Config";
import Sidebar from "../Sidebar/Sidebar";

export default function Direct() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const customersResponse = await axios.get(`${API_BASE_URL}/api/direct/customers`);
        setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : []);
        const productTypesResponse = await axios.get(`${API_BASE_URL}/api/direct/products/types`);
        setProductTypes(Array.isArray(productTypesResponse.data) ? productTypesResponse.data : []);
      } catch {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProductType) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/api/direct/products?type=${selectedProductType}`)
        .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
        .catch(() => setError('Failed to fetch products'))
        .finally(() => setLoading(false));
    } else {
      setProducts([]);
      setSelectedProduct('');
    }
  }, [selectedProductType]);

  const addToCart = () => {
    if (!selectedProduct) return setError('Please select a product');
    const [id, type] = selectedProduct.split('-');
    const product = products.find(p => p.id.toString() === id && p.product_type === type);
    if (!product) return;
    const exists = cart.find(item => item.id === product.id && item.product_type === product.product_type);
    setCart(
      exists
        ? cart.map(item =>
            item.id === product.id && item.product_type === product.product_type
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...cart, { ...product, quantity: 1 }]
    );
    setError('');
  };

  const updateQuantity = (id, type, delta) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === id && item.product_type === type
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id, type) => {
    setCart(cart.filter(item => !(item.id === id && item.product_type === type)));
  };

  const calculateTotal = () =>
    cart.reduce((total, item) => {
      const discount = (item.price * item.discount) / 100;
      return total + (item.price - discount) * item.quantity;
    }, 0).toFixed(2);

  const handleBooking = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    const customer = customers.find(c => c.id.toString() === selectedCustomer);
    const customerType = customer?.customer_type || 'User';
    try {
      await axios.post(`${API_BASE_URL}/api/direct/bookings`, {
        customer_id: Number(selectedCustomer),
        order_id: `ORD-${Date.now()}`,
        products: cart,
        total: calculateTotal(),
        customer_type: customerType
      });
      setCart([]);
      setSelectedCustomer('');
      setSelectedProduct('');
      setError('');
      setSuccessMessage('Booking created successfully!');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage('');
      }, 3000);
    } catch {
      setError('Failed to create booking');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex justify-center items-start">
        <div className="w-full max-w-5xl p-6">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Direct Booking</h1>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {error}
            </div>
          )}
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md">
              {successMessage}
            </div>
          )}
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <div className="flex flex-col items-center">
              <label className="text-lg font-semibold text-gray-700 mb-2">Select Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-64 p-3 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type || 'User'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col items-center">
              <label className="text-lg font-semibold text-gray-700 mb-2">Product Type</label>
              <select
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
                className="w-64 p-3 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a type</option>
                {productTypes.map(type => (
                  <option key={type.product_type} value={type.product_type}>
                    {type.product_type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col items-center">
              <label className="text-lg font-semibold text-gray-700 mb-2">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                disabled={!selectedProductType}
                className="w-64 p-3 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={`${p.id}-${p.product_type}`} value={`${p.id}-${p.product_type}`}>
                    {p.serial_number} - {p.productname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={addToCart}
                disabled={!selectedProduct}
                className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow rounded-lg">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3 text-center">Product</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3 text-center">Price</th>
                  <th className="p-3 text-center">Discount</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.length ? cart.map(item => (
                  <tr key={`${item.id}-${item.product_type}`} className="border-t">
                    <td className="p-3 text-center">{item.productname}</td>
                    <td className="p-3 text-center">{item.product_type}</td>
                    <td className="p-3 text-center">₹{item.price}</td>
                    <td className="p-3 text-center">{item.discount}%</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => updateQuantity(item.id, item.product_type, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.product_type, 1)}>+</button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      ₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeFromCart(item.id, item.product_type)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">Cart is empty</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-xl text-right mt-4 font-bold">Total: ₹{calculateTotal()}</div>
          </div>
          <div className="flex justify-center mt-8">
            <button
              onClick={handleBooking}
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold shadow hover:bg-green-700"
            >
              Create Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}