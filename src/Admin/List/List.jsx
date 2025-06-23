import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import '../../App.css';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

export default function List() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch products');
        }
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProducts();
  }, []);

  // Filter products based on selected product type
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.product_type === filterType));
    }
  }, [filterType, products]);

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedProduct(null);
  };

  // Capitalize product type for display
  const capitalize = (str) => {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 mb-6">List Products</h2>
          {error && (
            <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
          )}
          <div className="mb-6">
            <label htmlFor="product-type-filter" className="block text-sm font-medium text-gray-900">
              Filter by Product Type
            </label>
            <select
              id="product-type-filter"
              value={filterType}
              onChange={handleFilterChange}
              className="mt-2 block w-48 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="sparklers">Sparklers</option>
              <option value="ground-chakras">Ground Chakras</option>
            </select>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-lg text-center font-medium text-gray-900">
              No products found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (INR)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.serial_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.image_path ? (
                          <img
                            src={`http://localhost:5000${product.image_path}`}
                            alt={product.product_name}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {capitalize(product.product_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openModal(product)}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black/50 bg-opacity-50"
          >
            {selectedProduct && (
              <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Product Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-gray-700">Serial Number:</span>
                    <span className="ml-2 text-gray-900">{selectedProduct.serial_number}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Product Name:</span>
                    <span className="ml-2 text-gray-900">{selectedProduct.product_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Image:</span>
                    <div className="mt-2">
                      {selectedProduct.image_path ? (
                        <img
                          src={`http://localhost:5000${selectedProduct.image_path}`}
                          alt={selectedProduct.product_name}
                          className="h-32 w-32 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="ml-2 text-gray-900">₹{parseFloat(selectedProduct.price).toFixed(2)}</span>
                  </div>
                  {selectedProduct.product_type === 'ground-chakras' && (
                    <div>
                      <span className="font-medium text-gray-700">Per:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.per}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Discount:</span>
                    <span className="ml-2 text-gray-900">{selectedProduct.discount}%</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Product Type:</span>
                    <span className="ml-2 text-gray-900">{capitalize(selectedProduct.product_type)}</span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="rounded-md bg-black/50 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}