import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Modal from 'react-modal';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaEdit, FaArrowRight, FaTrash } from 'react-icons/fa';

// Set app element for accessibility
Modal.setAppElement('#root');

// Error Boundary Component
class QuotationTableErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg text-center shadow-md">
          An error occurred while rendering the quotation table. Please try again.
        </div>
      );
    }
    return this.props.children;
  }
}

// Reusable QuotationTable component
const QuotationTable = ({
  cart = [], products, selectedProduct, setSelectedProduct, addToCart, updateQuantity, updateDiscount, removeFromCart,
  calculateNetRate, calculateYouSave, calculateTotal, styles, isModal = false
}) => (
  <div className="space-y-4">
    <div className="flex flex-col items-center mobile:w-full">
      <label htmlFor="product-select" className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">Product</label>
      <Select
        id="product-select"
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
            background: '#fff',
            borderColor: '#d1d5db',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            '&:hover': { borderColor: '#3b82f6' },
            '@media (max-width: 640px)': { padding: '0.25rem', fontSize: '0.875rem' }
          }),
          menu: base => ({
            ...base,
            zIndex: 20,
            background: '#fff'
          }),
          singleValue: base => ({
            ...base,
            color: '#1f2937'
          }),
          option: (base, { isFocused, isSelected }) => ({
            ...base,
            background: isSelected ? '#3b82f6' : isFocused ? '#e5e7eb' : '#fff',
            color: isSelected ? '#fff' : '#1f2937'
          }),
          placeholder: base => ({
            ...base,
            color: '#9ca3af'
          })
        }}
      />
      <button
        onClick={() => addToCart(isModal)}
        disabled={!selectedProduct}
        className={`mt-4 onefifty:w-50 hundred:w-50 h-10 text-white px-6 rounded-lg font-bold shadow ${!selectedProduct ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        style={styles.button}
      >
        Add to Cart
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse dark:bg-gray-800 dark:text-gray-100 bg-white shadow rounded-lg mobile:text-xs">
        <thead className="border">
          <tr className="hundred:text-lg mobile:text-sm">
            <th className="text-center border-r mobile:p-1">Product</th>
            <th className="text-center border-r mobile:p-1">Type</th>
            <th className="text-center border-r mobile:p-1">Price</th>
            <th className="text-center border-r mobile:p-1">Discount (%)</th>
            <th className="text-center border-r mobile:p-1">Qty</th>
            <th className="text-center border-r mobile:p-1">Total</th>
            <th className="text-center border-r mobile:p-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cart.length ? cart.map(item => (
            <tr key={`${item.id}-${item.product_type}`} className="border border-gray-200 text-gray-900 dark:text-gray-100 mobile:text-sm">
              <td className="text-center border-r mobile:p-1">{item.productname}</td>
              <td className="text-center border-r mobile:p-1">{item.product_type}</td>
              <td className="text-center border-r mobile:p-1">₹{parseFloat(item.price).toFixed(2)}</td>
              <td className="text-center border-r mobile:p-1">
                <input
                  type="number"
                  value={item.discount}
                  onChange={(e) => updateDiscount(item.id, item.product_type, parseInt(e.target.value) || 0, isModal)}
                  min="0"
                  max="100"
                  className="w-20 text-center bg-transparent border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </td>
              <td className="text-center border-r mobile:p-1">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, item.product_type, parseInt(e.target.value) || 0, isModal)}
                  min="0"
                  className="w-16 text-center border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </td>
              <td className="text-center border-r mobile:p-1">₹{((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(2)}</td>
              <td className="text-center border-r mobile:p-1">
                <button onClick={() => removeFromCart(item.id, item.product_type, isModal)} className="text-red-600 hover:text-red-800 font-bold mobile:text-xs">Remove</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500 dark:text-gray-100 mobile:p-2 mobile:text-xs">Cart is empty</td>
            </tr>
          )}
        </tbody>
      </table>
      {cart.length > 0 && (
        <>
          <div className="text-xl text-center mt-4 font-bold text-gray-900 dark:text-gray-100 mobile:text-base mobile:mt-2">Net Rate: ₹{calculateNetRate(cart)}</div>
          <div className="text-xl text-center mt-2 font-bold text-gray-900 dark:text-gray-100 mobile:text-base mobile:mt-1">You Save: ₹{calculateYouSave(cart)}</div>
          <div className="text-xl text-center mt-2 font-bold text-gray-900 dark:text-gray-100 mobile:text-base mobile:mt-1">Total: ₹{calculateTotal(cart)}</div>
        </>
      )}
    </div>
  </div>
);

// FormFields component for modal
const FormFields = ({
  isEdit, customers, modalSelectedCustomer, setModalSelectedCustomer, modalCart, products, modalSelectedProduct,
  setModalSelectedProduct, addToCart, updateQuantity, updateDiscount, removeFromCart, calculateNetRate, calculateYouSave,
  calculateTotal, handleSubmit, closeModal, styles
}) => (
  <div className="space-y-6">
    <QuotationTableErrorBoundary>
      <QuotationTable
        cart={modalCart}
        products={products}
        selectedProduct={modalSelectedProduct}
        setSelectedProduct={setModalSelectedProduct}
        addToCart={addToCart}
        updateQuantity={updateQuantity}
        updateDiscount={updateDiscount}
        removeFromCart={removeFromCart}
        calculateNetRate={calculateNetRate}
        calculateYouSave={calculateYouSave}
        calculateTotal={calculateTotal}
        styles={styles}
        isModal={true}
      />
    </QuotationTableErrorBoundary>
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={closeModal}
        className="rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!modalSelectedCustomer || !modalCart.length}
        className={`rounded-md px-4 py-2 text-sm text-white ${!modalSelectedCustomer || !modalCart.length ? 'bg-gray-400 cursor-not-allowed' : isEdit ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {isEdit ? 'Update Quotation' : 'Confirm Booking'}
      </button>
    </div>
  </div>
);

export default function Direct() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [quotationId, setQuotationId] = useState(null);
  const [isQuotationCreated, setIsQuotationCreated] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'edit' or 'book'
  const [modalCart, setModalCart] = useState([]);
  const [modalSelectedProduct, setModalSelectedProduct] = useState(null);
  const [modalSelectedCustomer, setModalSelectedCustomer] = useState('');
  const [orderId, setOrderId] = useState('');

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)"
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
    },
    card: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,249,255,0.7))",
      border: "1px solid rgba(2,132,199,0.3)",
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersResponse, productsResponse, quotationsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/direct/customers`),
          axios.get(`${API_BASE_URL}/api/direct/products`),
          axios.get(`${API_BASE_URL}/api/direct/quotations`)
        ]);
        setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : []);
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
        setQuotations(Array.isArray(quotationsResponse.data) ? quotationsResponse.data : []);
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (isModal = false) => {
    const targetCart = isModal ? modalCart : cart;
    const setTargetCart = isModal ? setModalCart : setCart;
    const targetSelectedProduct = isModal ? modalSelectedProduct : selectedProduct;
    const setTargetSelectedProduct = isModal ? setModalSelectedProduct : setSelectedProduct;

    if (!targetSelectedProduct) {
      setError('Please select a product');
      return;
    }
    const [id, type] = targetSelectedProduct.value.split('-');
    const product = products.find(p => p.id.toString() === id && p.product_type === type);
    if (!product) {
      setError('Product not found');
      return;
    }
    setTargetCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.product_type === product.product_type);
      return exists
        ? prev.map(item =>
            item.id === product.id && item.product_type === product.product_type
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...prev, { ...product, quantity: 1, discount: parseFloat(product.discount) || 0 }];
    });
    setTargetSelectedProduct(null);
    setError('');
  };

  const updateQuantity = (id, type, quantity, isModal = false) => {
    const setTargetCart = isModal ? setModalCart : setCart;
    setTargetCart(prev =>
      prev.map(item =>
        item.id === id && item.product_type === type
          ? { ...item, quantity: quantity < 0 ? 0 : quantity }
          : item
      )
    );
  };

  const updateDiscount = (id, type, discount, isModal = false) => {
    const setTargetCart = isModal ? setModalCart : setCart;
    setTargetCart(prev =>
      prev.map(item =>
        item.id === id && item.product_type === type
          ? { ...item, discount: discount < 0 ? 0 : discount > 100 ? 100 : discount }
          : item
      )
    );
  };

  const removeFromCart = (id, type, isModal = false) => {
    const setTargetCart = isModal ? setModalCart : setCart;
    setTargetCart(prev => prev.filter(item => !(item.id === id && item.product_type === type)));
  };

  const calculateNetRate = (targetCart = []) => targetCart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  const calculateYouSave = (targetCart = []) => targetCart.reduce((total, item) => total + (item.price * (item.discount / 100) * item.quantity), 0).toFixed(2);
  const calculateTotal = (targetCart = []) => targetCart.reduce((total, item) => total + (item.price * (1 - item.discount / 100)) * item.quantity, 0).toFixed(2);

  const createQuotation = async () => {
    if (!selectedCustomer || !cart.length) return setError('Customer and products are required');
    if (cart.some(item => item.quantity === 0)) return setError('Please remove products with zero quantity');
    const customer = customers.find(c => c.id.toString() === selectedCustomer);
    if (!customer) return setError('Invalid customer');
    const quotation_id = `QUO-${Date.now()}`;

    try {
      const payload = {
        customer_id: Number(selectedCustomer),
        quotation_id,
        products: cart.map(item => ({
          id: item.id,
          product_type: item.product_type,
          productname: item.productname,
          price: parseFloat(item.price) || 0,
          discount: parseFloat(item.discount) || 0,
          quantity: parseInt(item.quantity) || 0
        })),
        net_rate: parseFloat(calculateNetRate(cart)),
        you_save: parseFloat(calculateYouSave(cart)),
        total: parseFloat(calculateTotal(cart)),
        promo_discount: 0,
        customer_type: customer.customer_type || 'User',
        customer_name: customer.name,
        address: customer.address,
        mobile_number: customer.mobile_number,
        email: customer.email,
        district: customer.district,
        state: customer.state,
        status: 'pending'
      };

      const response = await axios.post(`${API_BASE_URL}/api/direct/quotations`, payload);
      setQuotationId(response.data.quotation_id);
      setIsQuotationCreated(true);
      setSuccessMessage('Quotation created successfully! Check downloads for PDF.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Download PDF
      const pdfResponse = await axios.get(`${API_BASE_URL}/api/direct/quotation/${response.data.quotation_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeCustomerName = (customer.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      link.setAttribute('download', `${safeCustomerName}-${response.data.quotation_id}-quotation.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh quotations
      const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
      setQuotations(Array.isArray(quotationsResponse.data) ? quotationsResponse.data : []);
      setCart([]);
      setSelectedCustomer('');
      setSelectedProduct(null);
    } catch (err) {
      setError(`Failed to create quotation: ${err.response?.data?.message || err.message}`);
    }
  };

  const editQuotation = async (quotation = null) => {
    if (quotation) {
      setModalMode('edit');
      setModalSelectedCustomer(quotation.customer_id?.toString() || '');
      setQuotationId(quotation.quotation_id);
      try {
        const products = typeof quotation.products === 'string' ? JSON.parse(quotation.products) : quotation.products;
        setModalCart(Array.isArray(products) ? products.map(p => ({
          ...p,
          price: parseFloat(p.price) || 0,
          discount: parseFloat(p.discount) || 0,
          quantity: parseInt(p.quantity) || 0
        })) : []);
      } catch (e) {
        setModalCart([]);
        setError('Failed to parse quotation products');
      }
      setModalIsOpen(true);
      return;
    }

    if (!modalSelectedCustomer || !modalCart.length) return setError('Customer and products are required');
    if (modalCart.some(item => item.quantity === 0)) return setError('Please remove products with zero quantity');
    try {
      const payload = {
        customer_id: Number(modalSelectedCustomer),
        products: modalCart.map(item => ({
          id: item.id,
          product_type: item.product_type,
          productname: item.productname,
          price: parseFloat(item.price) || 0,
          discount: parseFloat(item.discount) || 0,
          quantity: parseInt(item.quantity) || 0
        })),
        net_rate: parseFloat(calculateNetRate(modalCart)),
        you_save: parseFloat(calculateYouSave(modalCart)),
        total: parseFloat(calculateTotal(modalCart)),
        promo_discount: 0,
        status: 'pending'
      };

      const response = await axios.put(`${API_BASE_URL}/api/direct/quotations/${quotationId}`, payload);
      setSuccessMessage('Quotation updated successfully! Check downloads for PDF.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Download PDF
      const pdfResponse = await axios.get(`${API_BASE_URL}/api/direct/quotation/${response.data.quotation_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const customer = customers.find(c => c.id.toString() === modalSelectedCustomer);
      const safeCustomerName = (customer?.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      link.setAttribute('download', `${safeCustomerName}-${response.data.quotation_id}-quotation.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh quotations
      const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
      setQuotations(Array.isArray(quotationsResponse.data) ? quotationsResponse.data : []);
      closeModal();
    } catch (err) {
      setError(`Failed to update quotation: ${err.response?.data?.message || err.message}`);
    }
  };

  const cancelQuotation = async (quotationIdToCancel = null) => {
    const targetQuotationId = quotationIdToCancel || quotationId;
    if (!targetQuotationId) {
      setError('No quotation to cancel');
      return;
    }
    try {
      console.log('Canceling quotation:', targetQuotationId);
      await axios.put(`${API_BASE_URL}/api/direct/quotations/cancel/${targetQuotationId}`);
      if (!quotationIdToCancel) {
        setCart([]);
        setSelectedCustomer('');
        setSelectedProduct(null);
        setQuotationId(null);
        setIsQuotationCreated(false);
      }
      setSuccessMessage('Quotation canceled successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
      setQuotations(Array.isArray(quotationsResponse.data) ? quotationsResponse.data : []);
      setError('');
    } catch (err) {
      console.error('Failed to cancel quotation:', err.response?.data || err.message);
      setError(`Failed to cancel quotation: ${err.response?.data?.message || err.message}`);
    }
  };

  const convertToBooking = async (quotation = null) => {
    if (quotation) {
      setModalMode('book');
      setModalSelectedCustomer(quotation.customer_id?.toString() || '');
      setQuotationId(quotation.quotation_id);
      setOrderId(`ORD-${Date.now()}`);
      try {
        const products = typeof quotation.products === 'string' ? JSON.parse(quotation.products) : quotation.products;
        setModalCart(Array.isArray(products) ? products.map(p => ({
          ...p,
          price: parseFloat(p.price) || 0,
          discount: parseFloat(p.discount) || 0,
          quantity: parseInt(p.quantity) || 0
        })) : []);
      } catch (e) {
        setModalCart([]);
        setError('Failed to parse quotation products');
      }
      setModalIsOpen(true);
      return;
    }

    if (!modalSelectedCustomer || !modalCart.length || !orderId) return setError('Customer, products, and order ID are required');
    if (modalCart.some(item => item.quantity === 0)) return setError('Please remove products with zero quantity');
    const customer = customers.find(c => c.id.toString() === modalSelectedCustomer);
    if (!customer) return setError('Invalid customer');
    try {
      const payload = {
        customer_id: Number(modalSelectedCustomer),
        order_id: orderId,
        quotation_id: quotationId,
        products: modalCart.map(item => ({
          id: item.id,
          product_type: item.product_type,
          productname: item.productname,
          price: parseFloat(item.price) || 0,
          discount: parseFloat(item.discount) || 0,
          quantity: parseInt(item.quantity) || 0
        })),
        net_rate: parseFloat(calculateNetRate(modalCart)),
        you_save: parseFloat(calculateYouSave(modalCart)),
        total: parseFloat(calculateTotal(modalCart)),
        promo_discount: 0,
        customer_type: customer.customer_type || 'User',
        customer_name: customer.name,
        address: customer.address,
        mobile_number: customer.mobile_number,
        email: customer.email,
        district: customer.district,
        state: customer.state
      };

      const response = await axios.post(`${API_BASE_URL}/api/direct/bookings`, payload);
      await axios.put(`${API_BASE_URL}/api/direct/quotations/${quotationId}`, { status: 'booked' });
      setSuccessMessage('Booking created successfully! Check downloads for PDF.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Download PDF
      const pdfResponse = await axios.get(`${API_BASE_URL}/api/direct/invoice/${response.data.order_id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeCustomerName = (customer.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      link.setAttribute('download', `${safeCustomerName}-${response.data.order_id}-invoice.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh quotations
      const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
      setQuotations(Array.isArray(quotationsResponse.data) ? quotationsResponse.data : []);
      closeModal();
    } catch (err) {
      setError(`Failed to create booking: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleBooking = async () => {
  if (!quotationId || !selectedCustomer || !cart.length) return setError('Quotation, customer, and products are required');
  if (cart.some(item => item.quantity === 0)) return setError('Please remove products with zero quantity');
  const customer = customers.find(c => c.id.toString() === selectedCustomer);
  if (!customer) return setError('Invalid customer');
  const order_id = `ORD-${Date.now()}`;

  try {
    const payload = {
      customer_id: Number(selectedCustomer),
      order_id,
      quotation_id: quotationId,
      products: cart.map(item => ({
        id: item.id,
        product_type: item.product_type,
        productname: item.productname,
        price: parseFloat(item.price) || 0,
        discount: parseFloat(item.discount) || 0,
        quantity: parseInt(item.quantity) || 0
      })),
      net_rate: parseFloat(calculateNetRate(cart)),
      you_save: parseFloat(calculateYouSave(cart)),
      total: parseFloat(calculateTotal(cart)),
      promo_discount: 0,
      customer_type: customer.customer_type || 'User',
      customer_name: customer.name,
      address: customer.address,
      mobile_number: customer.mobile_number,
      email: customer.email,
      district: customer.district,
      state: customer.state
    };

    const response = await axios.post(`${API_BASE_URL}/api/direct/bookings`, payload);
    await axios.put(`${API_BASE_URL}/api/direct/quotations/${quotationId}`, { status: 'booked' });
    setCart([]);
    setSelectedCustomer('');
    setSelectedProduct(null);
    setQuotationId(null);
    setIsQuotationCreated(false);
    setSuccessMessage('Booking created successfully! Check downloads for PDF.');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Download PDF
    const pdfResponse = await axios.get(`${API_BASE_URL}/api/direct/invoice/${response.data.order_id}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
    const link = document.createElement('a');
    link.href = url;
    const safeCustomerName = (customer.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    link.setAttribute('download', `${safeCustomerName}-${response.data.order_id}-invoice.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Refresh quotations
    const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
    setQuotations(Array.isArray(quotationsResponse.data) ? quotationsResponse.data : []);
  } catch (err) {
    setError(`Failed to create booking: ${err.response?.data?.message || err.message}`);
  }
};

  const renderSelect = (value, onChange, options, label, placeholder, id) => (
    <div className="flex flex-col items-center mobile:w-full">
      <label htmlFor={id} className="text-lg font-semibold text-gray-700 mb-2 mobile:text-base">{label}</label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="onefifty:w-96 hundred:w-96 p-3 rounded-lg bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 mobile:w-full mobile:p-2 mobile:text-sm"
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

  const closeModal = () => {
    setModalIsOpen(false);
    setModalMode(null);
    setModalCart([]);
    setModalSelectedCustomer('');
    setModalSelectedProduct(null);
    setOrderId('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="flex min-h-screen dark:bg-gray-800 bg-gray-50 mobile:flex-col">
      <Sidebar />
      <Logout />
      <div className="flex-1 md:ml-64 p-6 pt-16 mobile:p-2">
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 mobile:text-2xl dark:text-gray-100">Direct Booking</h1>
          {loading && (
            <div className="text-center text-gray-500">Loading...</div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {error}
            </div>
          )}
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
              {successMessage}
            </div>
          )}
          <div className="flex flex-wrap gap-6 justify-center mb-8 mobile:flex-col mobile:gap-3">
            {renderSelect(selectedCustomer, e => setSelectedCustomer(e.target.value), customers, 'Select Customer', 'Select a customer', 'main-customer-select')}
            <QuotationTableErrorBoundary>
              <QuotationTable
                cart={cart}
                products={products}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                updateDiscount={updateDiscount}
                removeFromCart={removeFromCart}
                calculateNetRate={calculateNetRate}
                calculateYouSave={calculateYouSave}
                calculateTotal={calculateTotal}
                styles={styles}
              />
            </QuotationTableErrorBoundary>
          </div>
          <div className="flex justify-center gap-4 mt-8 mobile:mt-4 mobile:flex-col">
              <button
                onClick={createQuotation}
                disabled={!selectedCustomer || !cart.length}
                className={`onefifty:w-50 hundred:w-50 h-10 text-white px-8 rounded-lg font-bold shadow ${!selectedCustomer || !cart.length ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                style={styles.button}
              >
                Create Quotation
              </button>
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800 mobile:text-xl">All Quotations</h2>
            {quotations.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
                {quotations.map(quotation => (
                  <div
                    key={quotation.quotation_id}
                    className="p-6 rounded-lg shadow-lg"
                    style={styles.card}
                  >
                    <h3 className="text-lg font-bold mb-2 mobile:text-base text-gray-900">{quotation.quotation_id}</h3>
                    <p className="text-sm mb-1 mobile:text-xs text-gray-900">
                      <span className="font-semibold">Customer:</span> {quotation.customer_name || 'N/A'}
                    </p>
                    <p className="text-sm mb-1 mobile:text-xs text-gray-900">
                      <span className="font-semibold">Total:</span> ₹{parseFloat(quotation.total).toFixed(2)}
                    </p>
                    <p className="text-sm mb-1 mobile:text-xs text-gray-900">
                      <span className="font-semibold">Status:</span> 
                      <span className={`capitalize ${quotation.status === 'pending' ? 'text-yellow-600' : quotation.status === 'booked' ? 'text-green-600' : 'text-red-600'}`}>
                        {quotation.status}
                      </span>
                    </p>
                    <p className="text-sm mb-4 mobile:text-xs text-gray-900">
                      <span className="font-semibold">Created At:</span> 
                      {new Date(quotation.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    <div className="flex gap-2 mobile:flex-col">
                      <button
                        onClick={() => editQuotation(quotation)}
                        disabled={quotation.status !== 'pending'}
                        className={`flex-1 text-white px-4 py-2 rounded-lg font-bold text-sm ${quotation.status !== 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => convertToBooking(quotation)}
                        disabled={quotation.status !== 'pending'}
                        className={`flex-1 text-white px-4 py-2 rounded-lg font-bold text-sm ${quotation.status !== 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        Convert to Booking
                      </button>
                      <button
                        onClick={() => cancelQuotation(quotation.quotation_id)}
                        disabled={quotation.status !== 'pending'}
                        className={`flex-1 text-white px-4 py-2 rounded-lg font-bold text-sm ${quotation.status !== 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 mobile:p-2 mobile:text-xs">
                No quotations available
              </div>
            )}
          </div>
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black/50"
            key="quotation-modal"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mobile:p-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
                {modalMode === 'edit' ? 'Edit Quotation' : 'Convert to Booking'}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm mobile:px-3 mobile:py-2">
                  {error}
                </div>
              )}
              {modalMode === 'book' && (
                <div className="flex flex-col items-center mobile:w-full mb-6">
                  <label htmlFor="order-id" className="text-lg font-semibold dark:text-gray-100 text-gray-700 mb-2 mobile:text-base">Order ID</label>
                  <input
                    id="order-id"
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="onefifty:w-96 hundred:w-96 p-3 rounded-lg bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 mobile:w-full mobile:p-2 mobile:text-sm"
                    style={styles.input}
                    placeholder="Enter Order ID"
                  />
                </div>
              )}
              <FormFields
                isEdit={modalMode === 'edit'}
                customers={customers}
                modalSelectedCustomer={modalSelectedCustomer}
                setModalSelectedCustomer={setModalSelectedCustomer}
                modalCart={modalCart}
                products={products}
                modalSelectedProduct={modalSelectedProduct}
                setModalSelectedProduct={setModalSelectedProduct}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                updateDiscount={updateDiscount}
                removeFromCart={removeFromCart}
                calculateNetRate={calculateNetRate}
                calculateYouSave={calculateYouSave}
                calculateTotal={calculateTotal}
                handleSubmit={modalMode === 'edit' ? () => editQuotation() : () => convertToBooking()}
                closeModal={closeModal}
                styles={styles}
              />
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}