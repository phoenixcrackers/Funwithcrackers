import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

export default function Direct() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersResponse, productsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/direct/customers`),
          axios.get(`${API_BASE_URL}/api/direct/products`)
        ]);
        setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : []);
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = () => {
    if (!selectedProduct) return setError('Please select a product');
    const [id, type] = selectedProduct.value.split('-');
    const product = products.find(p => p.id.toString() === id && p.product_type === type);
    if (!product) return;
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.product_type === product.product_type);
      return exists
        ? prev.map(item =>
            item.id === product.id && item.product_type === product.product_type
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { ...product, quantity: 1 }];
    });
    setSelectedProduct(null);
    setError('');
  };

  const updateQuantity = (id, type, quantity) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id && item.product_type === type
          ? { ...item, quantity: quantity < 0 ? 0 : quantity }
          : item
      )
    );
  };

  const updateDiscount = (id, type, discount) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id && item.product_type === type
          ? { ...item, discount: discount < 0 ? 0 : discount > 100 ? 100 : discount }
          : item
      )
    );
  };

  const removeFromCart = (id, type) => {
    setCart(cart.filter(item => !(item.id === id && item.product_type === type)));
  };

  const calculateTotal = () =>
    cart.reduce((total, item) => total + (item.price * (1 - item.discount / 100)) * item.quantity, 0).toFixed(2);

  const calculateNetRate = () =>
    cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);

  const calculateYouSave = () =>
    cart.reduce((total, item) => total + (item.price * item.discount / 100 * item.quantity), 0).toFixed(2);

  const handleBooking = async () => {
  if (!selectedCustomer) return setError('Please select a customer');
  if (!cart.length) return setError('Cart is empty');
  const customer = customers.find(c => c.id.toString() === selectedCustomer);
  try {
    // Calculate numeric values
    const netRate = parseFloat(calculateNetRate()) || 0;
    const youSave = parseFloat(calculateYouSave()) || 0;
    const total = parseFloat(calculateTotal()) || 0;
    const promoDiscount = parseFloat(cart.reduce((sum, item) => sum + (item.discount * item.price * item.quantity / 100), 0).toFixed(2)) || 0; // Example promo discount logic

    // Validate numeric values
    if (isNaN(netRate) || isNaN(youSave) || isNaN(total) || isNaN(promoDiscount)) {
      return setError('Invalid calculation values');
    }

    const response = await axios.post(`${API_BASE_URL}/api/direct/bookings`, {
      customer_id: Number(selectedCustomer),
      order_id: `ORD-${Date.now()}`,
      products: cart.map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        discount: parseFloat(item.discount) || 0,
        quantity: parseInt(item.quantity) || 0
      })),
      net_rate: parseFloat(netRate.toFixed(2)),
      you_save: parseFloat(youSave.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      promo_discount: parseFloat(promoDiscount.toFixed(2)),
      customer_type: customer?.customer_type || 'User'
    });
    setCart([]);
    setSelectedCustomer('');
    setSelectedProduct(null);
    setError('');
    setSuccessMessage('Booking created successfully!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Download PDF
    const { order_id } = response.data;
    const pdfResponse = await axios.get(`${API_BASE_URL}/api/direct/invoice/${order_id}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
    const link = document.createElement('a');
    link.href = url;
    const safeCustomerName = (customer.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    link.setAttribute('download', `${safeCustomerName}-${order_id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    setError(`Failed to create booking: ${err.response?.data?.message || err.message}`);
  }
};

  const renderSelect = (value, onChange, options, label, placeholder) => (
    <div className="flex flex-col items-center mobile:w-full">
      <label className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile:text-base">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="onefifty:w-96 hundred:w-96 p-3 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500 mobile:w-full mobile:p-2 mobile:text-sm"
        style={styles.input}
      >
        <option value="">{placeholder}</option>
        {options.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.customer_type === 'Customer of Selected Agent' ? 'Customer - Agent' : c.customer_type || 'User'})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 mobile:flex-col">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex justify-center items-start mobile:p-2">
        <div className="w-full max-w-5xl p-6 mobile:p-4">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100 mobile:text-2xl">Direct Booking</h1>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {error}
            </div>
          )}
          {showSuccess && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {successMessage}
            </div>
          )}
          <div className="flex flex-wrap gap-6 justify-center mb-8 mobile:flex-col mobile:gap-3">
            {renderSelect(selectedCustomer, e => setSelectedCustomer(e.target.value), customers, 'Select Customer', 'Select a customer')}
            <div className="flex flex-col items-center mobile:w-full">
              <label className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 mobile:text-base">Product</label>
              <Select
                value={selectedProduct}
                onChange={setSelectedProduct}
                options={products.map(p => ({
                  value: `${p.id}-${p.product_type}`,
                  label: `${p.serial_number} - ${p.productname} (${p.product_type})`
                }))}
                placeholder="Search for a product..."
                isClearable
                className="mobile:w-full onefifty:w-96 hundred:w-96"
                classNamePrefix="react-select"
                styles={{
                  control: base => ({
                    ...base,
                    padding: '0.25rem',
                    fontSize: '1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg, #fff)',
                    borderColor: '#d1d5db',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    '&:hover': { borderColor: '#3b82f6' },
                    '@media (max-width: 640px)': { padding: '0.25rem', fontSize: '0.875rem' },
                    '[data-dark] &': { background: 'var(--bg, #1f2937)', borderColor: '#4b5563' }
                  }),
                  menu: base => ({
                    ...base,
                    zIndex: 20,
                    background: '#fff',
                    '[data-dark] &': { background: '#1f2937', color: '#e5e7eb' },
                    '@media (max-width: 640px)': { fontSize: '0.875rem' }
                  }),
                  singleValue: base => ({
                    ...base,
                    color: '#1f2937',
                    '[data-dark] &': { color: '#e5e7eb' }
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    background: isSelected ? '#3b82f6' : isFocused ? '#e5e7eb' : '#fff',
                    color: isSelected ? '#fff' : '#1f2937',
                    '[data-dark] &': {
                      background: isSelected ? '#2563eb' : isFocused ? '#374151' : '#1f2937',
                      color: isSelected ? '#e5e7eb' : '#e5e7eb'
                    }
                  }),
                  placeholder: base => ({
                    ...base,
                    color: '#9ca3af',
                    '[data-dark] &': { color: '#9ca3af' }
                  })
                }}
              />
            </div>
            <div className="mobile:w-full mobile:text-center">
              <button
                onClick={addToCart}
                disabled={!selectedProduct}
                className={`mt-8 onefifty:w-50 hundred:w-50 h-10 text-white px-6 py-3 rounded-lg font-bold shadow ${!selectedProduct ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' : 'hover:bg-indigo-700 dark:hover:bg-blue-600' } mobile:mt-4 mobile:w-full mobile:py-1 mobile:px-4 mobile:text-sm`}
                style={!selectedProduct ? {} : styles.button}
              >
                Add to Cart
              </button>
            </div>
          </div>
          <div className="overflow-x-auto onefifty:ml-32">
            <table className="w-full border-collapse bg-white dark:bg-gray-900 shadow rounded-lg mobile:text-xs">
              <thead className="bg-gray-200 dark:bg-gray-800">
                <tr className="hundred:text-lg mobile:text-sm text-gray-900 dark:text-gray-100">
                  <th className="text-center mobile:p-1">Product</th>
                  <th className="text-center mobile:p-1">Type</th>
                  <th className="text-center mobile:p-1">Price</th>
                  <th className="text-center mobile:p-1">Discount (%)</th>
                  <th className="text-center mobile:p-1">Qty</th>
                  <th className="text-center mobile:p-1">Total</th>
                  <th className="text-center mobile:p-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.length ? cart.map(item => (
                  <tr key={`${item.id}-${item.product_type}`} className="border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 mobile:text-sm">
                    <td className="text-center mobile:p-1">{item.productname}</td>
                    <td className="text-center mobile:p-1">{item.product_type}</td>
                    <td className="text-center mobile:p-1">₹{item.price}</td>
                    <td className="text-center mobile:p-1">
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.id, item.product_type, parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-20 text-center bg-transparent border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </td>
                    <td className="text-center mobile:p-1">
                      <div className="flex justify-center hundred:gap-3 onefifty:gap-3 mobile:gap-0.5">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, item.product_type, parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-16 text-center border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </td>
                    <td className="text-center mobile:p-1">₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(2)}</td>
                    <td className="text-center mobile:p-1">
                      <button onClick={() => removeFromCart(item.id, item.product_type)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold mobile:text-xs">Remove</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500 dark:text-gray-400 mobile:p-2 mobile:text-xs">Cart is empty</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-xl text-center mt-4 font-bold text-gray-900 dark:text-gray-100 mobile:text-base mobile:mt-2">Net Rate: ₹{calculateNetRate()}</div>
            <div className="text-xl text-center mt-2 font-bold text-gray-900 dark:text-gray-100 mobile:text-base mobile:mt-1">You Save: ₹{calculateYouSave()}</div>
            <div className="text-xl text-center mt-2 font-bold text-gray-900 dark:text-gray-100 mobile:text-base mobile:mt-1">Total: ₹{calculateTotal()}</div>
          </div>
          <div className="flex justify-center mt-8 mobile:mt-4">
            <button
              onClick={handleBooking}
              className="onefifty:w-50 hundred:w-50 h-10 text-white px-8 py-4 rounded-lg font-bold shadow hover:bg-green-700 dark:hover:bg-green-600 mobile:w-full mobile:py-2 mobile:px-6 mobile:text-sm"
              style={{
                background: styles.button.background.replace('2,132,199', '22,163,74').replace('14,165,233', '34,197,94'),
                backgroundDark: styles.button.backgroundDark.replace('59,130,246', '22,163,74').replace('37,99,235', '20,83,45'),
                border: styles.button.border.replace('125,211,252', '134,239,172'),
                borderDark: styles.button.borderDark.replace('147,197,253', '134,239,172'),
                boxShadow: styles.button.boxShadow.replace('2,132,199', '22,163,74'),
                boxShadowDark: styles.button.boxShadowDark.replace('59,130,246', '22,163,74')
              }}
            >
              Create Booking
            </button>
          </div>
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
}