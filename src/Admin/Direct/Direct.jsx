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
        if (Array.isArray(customersResponse.data)) {
          setCustomers(customersResponse.data);
        } else {
          setError('Invalid customers data received');
          setCustomers([]);
        }

        const productTypesResponse = await axios.get(`${API_BASE_URL}/api/direct/products/types`);
        if (Array.isArray(productTypesResponse.data)) {
          setProductTypes(productTypesResponse.data);
        } else {
          setError('Invalid product types data received');
          setProductTypes([]);
        }
      } catch (err) {
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
      setSelectedProduct('');
      axios
        .get(`${API_BASE_URL}/api/direct/products?type=${selectedProductType}`)
        .then(response => {
          if (Array.isArray(response.data)) {
            setProducts(response.data);
          } else {
            setError('Invalid products data received');
            setProducts([]);
          }
        })
        .catch(err => {
          setError('Failed to fetch products');
        })
        .finally(() => setLoading(false));
    } else {
      setProducts([]);
      setSelectedProduct('');
    }
  }, [selectedProductType]);

  const addToCart = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    const product = products.find(p => `${p.id}-${p.product_type}` === selectedProduct);
    if (product) {
      const existingItem = cart.find(item => item.id === product.id && item.product_type === product.product_type);
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === product.id && item.product_type === product.product_type
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, { ...product, quantity: 1 }]);
      }
      setError('');
    }
  };

  const updateQuantity = (productId, productType, delta) => {
    setCart(cart.map(item =>
      item.id === productId && item.product_type === productType
        ? { ...item, quantity: item.quantity + delta }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId, productType) => {
    setCart(cart.filter(item => !(item.id === productId && item.product_type === productType)));
  };

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => {
        const discountedPrice = item.price * (1 - item.discount / 100);
        return total + discountedPrice * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const handleBooking = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      const orderId = `ORD-${Date.now()}`;
      await axios.post(`${API_BASE_URL}/api/direct/bookings`, {
        customer_id: selectedCustomer,
        order_id: orderId,
        products: cart,
        total: calculateTotal(),
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
    } catch (err) {
      setError('Failed to create booking');
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex items-top justify-center mobile:flex mobile:overflow-hidden onefifty:ml-[20%]">
        <div className="w-full max-w-5xl p-6 mobile:overflow-hidden">
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

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <div className="flex flex-col items-center">
              <label className="block text-lg font-semibold text-gray-700 mb-2">Select Customer</label>
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-64 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer</option>
                {customers.length > 0 ? (
                  customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_type})
                    </option>
                  ))
                ) : (
                  <option disabled>No customers available</option>
                )}
              </select>
            </div>

            <div className="flex flex-col items-center">
              <label className="block text-lg font-semibold text-gray-700 mb-2">Select Product Type</label>
              <select
                value={selectedProductType}
                onChange={e => setSelectedProductType(e.target.value)}
                className="w-64 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product type</option>
                {productTypes.length > 0 ? (
                  productTypes.map(type => (
                    <option key={type.product_type} value={type.product_type}>
                      {type.product_type}
                    </option>
                  ))
                ) : (
                  <option disabled>No product types available</option>
                )}
              </select>
            </div>

            <div className="flex flex-col items-center">
              <label className="block text-lg font-semibold text-gray-700 mb-2">Select Product</label>
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-64 p-3 border-2 border-gray-300 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedProductType || products.length === 0}
              >
                <option value="">Select a product</option>
                {products.length > 0 ? (
                  products.map(product => (
                    <option key={`${product.id}-${product.product_type}`} value={`${product.id}-${product.product_type}`}>
                      {product.serial_number} - {product.productname}
                    </option>
                  ))
                ) : (
                  <option disabled>No products available</option>
                )}
              </select>
            </div>

            <div>
              <button
                onClick={addToCart}
                className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!selectedProduct}
              >
                Add to Cart
              </button>
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-4xl">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Cart</h2>
              <div className="overflow-x-auto mobile:w-[100%]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-4 text-center text-gray-700 font-semibold">Product</th>
                      <th className="p-4 text-center text-gray-700 font-semibold">Type</th>
                      <th className="p-4 text-center text-gray-700 font-semibold">Price</th>
                      <th className="p-4 text-center text-gray-700 font-semibold">Discount</th>
                      <th className="p-4 text-center text-gray-700 font-semibold">Quantity</th>
                      <th className="p-4 text-center text-gray-700 font-semibold">Total</th>
                      <th className="p-4 text-center text-gray-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length > 0 ? (
                      cart.map(item => (
                        <tr key={`${item.id}-${item.product_type}`} className="border-b border-gray-300 hover:bg-gray-50">
                          <td className="p-4 text-center text-gray-800">{item.productname}</td>
                          <td className="p-4 text-center text-gray-800">{item.product_type}</td>
                          <td className="p-4 text-center text-gray-800">₹{item.price}</td>
                          <td className="p-4 text-center text-gray-800">{item.discount}%</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.product_type, -1)}
                                className="w-10 h-10 bg-gray-200 rounded-full font-bold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                -
                              </button>
                              <span className="text-lg text-gray-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.product_type, 1)}
                                className="w-10 h-10 bg-gray-200 rounded-full font-bold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center text-gray-800">₹{(item.price * (1 - item.discount / 100) * item.quantity).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => removeFromCart(item.id, item.product_type)}
                              className="text-red-600 hover:text-red-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-gray-600">
                          Cart is empty
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-2xl font-bold text-center text-gray-800">Total: ₹{calculateTotal()}</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleBooking}
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Create Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}