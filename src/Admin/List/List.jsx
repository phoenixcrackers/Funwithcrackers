import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

Modal.setAppElement('#root');

export default function List() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [productTypes, setProductTypes] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [viewModalIsOpen, setViewModalIsOpen] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [toggleStates, setToggleStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [editFormData, setEditFormData] = useState({
    productname: '',
    serial_number: '',
    price: '',
    discount: '',
    per: '',
    image: null,
  });
  const productsPerPage = 10;
  const menuRef = useRef({});

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch product types');
      }
      setProductTypes(data.map(item => item.product_type));
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      setProducts(data);
      setFilteredProducts(data);
      const initialToggles = data.reduce((acc, product) => ({
        ...acc,
        [`${product.product_type}-${product.id}`]: product.status === 'on',
        [`fast-${product.product_type}-${product.id}`]: product.fast_running === true,
      }), {});
      setToggleStates(initialToggles);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFastToggleChange = async (product) => {
    const productKey = `fast-${product.product_type}-${product.id}`;
    const tableName = product.product_type.toLowerCase().replace(/\s+/g, '_');
    try {
      setToggleStates(prev => ({
        ...prev,
        [productKey]: !prev[productKey],
      }));
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/toggle-fast-running`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle fast running');
      await fetchProducts();
    } catch (err) {
      setError(err.message);
      setToggleStates(prev => ({
        ...prev,
        [productKey]: prev[productKey],
      }));
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
    const intervalId = setInterval(() => {
      fetchProductTypes();
      fetchProducts();
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.product_type === filterType));
    }
    setCurrentPage(1);
  }, [filterType, products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewModalIsOpen && menuRef.current[viewModalIsOpen] && !menuRef.current[viewModalIsOpen].contains(event.target)) {
        setViewModalIsOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [viewModalIsOpen]);

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setModalIsOpen(true);
    setViewModalIsOpen(null);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      productname: product.productname,
      serial_number: product.serial_number,
      price: product.price,
      discount: product.discount,
      per: product.per,
      image: null,
    });
    setEditModalIsOpen(true);
    setViewModalIsOpen(null);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditModalIsOpen(false);
    setViewModalIsOpen(null);
    setSelectedProduct(null);
  };

  const handleDelete = async (product) => {
    try {
      const tableName = product.product_type.toLowerCase().replace(/\s+/g, '_');
      await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}`, {
        method: 'DELETE',
      });
      fetchProducts();
      setViewModalIsOpen(null);
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('productname', editFormData.productname);
      formData.append('serial_number', editFormData.serial_number);
      formData.append('price', editFormData.price);
      formData.append('discount', editFormData.discount);
      formData.append('per', editFormData.per);
      if (editFormData.image) {
        formData.append('image', editFormData.image);
      }
      const tableName = selectedProduct.product_type.toLowerCase().replace(/\s+/g, '_');
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${selectedProduct.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setEditFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleToggleChange = async (product) => {
    const productKey = `${product.product_type}-${product.id}`;
    const tableName = product.product_type.toLowerCase().replace(/\s+/g, '_');
    try {
      setToggleStates(prev => ({
        ...prev,
        [productKey]: !prev[productKey],
      }));
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/toggle-status`, {
        method: 'PATCH',
      });
      if (!response.ok) {
        throw new Error('Failed to toggle status');
      }
      await fetchProducts();
    } catch (err) {
      setToggleStates(prev => ({
        ...prev,
        [productKey]: prev[productKey],
      }));
      setError(err.message);
    }
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex min-h-screen overflow-hidden mobile:overflow-hidden">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6 mobile:p-8 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 mb-6 mobile:mb-2">List Products</h2>
          {error && (
            <div className="mb-4 mobile:mb-1 text-red-600 text-sm text-center">{error}</div>
          )}
          <div className="mb-6 mobile:mb-2">
            <label htmlFor="product-type-filter" className="block text-sm font-medium text-gray-900">
              Filter by Product Type
            </label>
            <select
              id="product-type-filter"
              value={filterType}
              onChange={handleFilterChange}
              className="mt-2 mobile:mt-1 block w-48 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:outline-offset-1 focus:outline-indigo-600 sm:text-sm"
            >
              <option value="all">All</option>
              {productTypes.map(type => (
                <option key={type} value={type}>
                  {capitalize(type)}
                </option>
              ))}
            </select>
          </div>
          {currentProducts.length === 0 ? (
            <p className="text-lg text-center text-gray-600 sm:text-xl font-medium">
              No products found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-left text-xs font-medium text-gray-500 uppercase">
                      Product Type
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-right text-xs font-medium text-gray-500 uppercase">
                      Price (INR)
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-left text-xs font-medium text-gray-500 uppercase">
                      Per
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-right text-xs font-medium text-gray-500 uppercase">
                      Discount (%)
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-center text-xs font-medium text-gray-500 uppercase">
                      Image
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-center text-xs font-medium text-gray-500 uppercase">
                      Fast Running
                    </th>
                    <th className="px-4 mobile:px-2 py-3 mobile:py-1 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 border-b border-gray-200">
                  {currentProducts.map((product) => {
                    const productKey = `${product.product_type}-${product.id}`;
                    return (
                      <tr key={productKey} className="hover:bg-gray-50">
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {capitalize(product.product_type)}
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {product.serial_number}
                        </td>
                        <td className="px-2 mobile:px-1 py-3 mobile:py-1 whitespace-normal text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                          {product.productname}
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                          ₹{parseFloat(product.price).toFixed(2)}
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {product.per}
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900">
                          {parseFloat(product.discount).toFixed(2)}%
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-center">
                          {product.image ? (
                            <img
                              src={`${API_BASE_URL}${product.image}`}
                              alt={product.productname}
                              className="h-12 w-12 mobile:h-8 mobile:w-8 object-cover rounded-md mx-auto"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">No image</span>
                          )}
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={toggleStates[productKey]}
                              onChange={() => handleToggleChange(product)}
                            />
                            <div
                              className={`relative w-11 h-6 mobile:w-8 mobile:h-4 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[productKey] ? 'bg-green-600' : 'bg-red-600'}`}
                            >
                              <div
                                className={`absolute top-0.5 mobile:top-0.25 w-5 h-5 mobile:w-3.5 mobile:h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out ${toggleStates[productKey] ? 'translate-x-5 mobile:translate-x-4' : 'translate-x-0.5'}`}
                              ></div>
                            </div>
                          </label>
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={toggleStates[`fast-${productKey}`]}
                              onChange={() => handleFastToggleChange(product)}
                            />
                            <div
                              className={`relative w-11 h-6 mobile:w-8 mobile:h-4 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[`fast-${productKey}`] ? 'bg-blue-600' : 'bg-gray-400'}`}
                            >
                              <div
                                className={`absolute top-0.5 mobile:top-0.25 w-5 h-5 mobile:w-3.5 mobile:h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out ${toggleStates[`fast-${productKey}`] ? 'translate-x-5 mobile:translate-x-4' : 'translate-x-0.5'}`}
                              ></div>
                            </div>
                          </label>
                        </td>
                        <td className="px-4 mobile:px-2 py-3 mobile:py-1 whitespace-nowrap text-center relative">
                          <button
                            onClick={() => setViewModalIsOpen(viewModalIsOpen === productKey ? null : productKey)}
                            className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            <svg className="w-5 h-5 mobile:w-4 mobile:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {viewModalIsOpen === productKey && (
                            <div
                              ref={(el) => (menuRef.current[productKey] = el)}
                              className="absolute z-10 w-28 bg-white rounded-md shadow-lg border border-gray-200 right-0 mobile:w-24"
                            >
                              <div className="py-1 mobile:py-0.5 flex flex-col">
                                <button
                                  onClick={() => openModal(product)}
                                  className="flex cursor-pointer items-center px-4 mobile:px-2 py-2 mobile:py-1 text-sm mobile:text-xs text-gray-700 hover:bg-gray-300 text-left"
                                >
                                  <FaEye className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" />
                                  View
                                </button>
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="flex cursor-pointer items-center px-4 mobile:px-2 py-2 mobile:py-1 text-sm mobile:text-xs text-gray-700 hover:bg-gray-300 text-left"
                                >
                                  <FaEdit className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  className="flex cursor-pointer items-center px-4 mobile:px-2 py-2 mobile:py-1 text-sm mobile:text-xs text-red-600 hover:bg-gray-300 text-left"
                                >
                                  <FaTrash className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-6 mobile:mt-2 flex justify-center items-center space-x-2 mobile:space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 mobile:px-2 py-1 mobile:py-0.5 rounded-md text-sm mobile:text-xs font-medium ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Previous
              </button>
              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handlePageChange(page + 1)}
                  className={`px-3 mobile:px-2 py-1 mobile:py-0.5 rounded-md text-sm mobile:text-xs font-medium ${currentPage === page + 1 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                >
                  {page + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 mobile:px-2 py-1 mobile:py-0.5 rounded-md text-sm mobile:text-xs font-medium ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Next
              </button>
            </div>
          )}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50"
          >
            {selectedProduct && (
              <div className="bg-white rounded-lg p-6 mobile:p-3 max-w-md w-full sm:max-w-lg">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 mobile:mb-2 text-center">
                  Product Details
                </h2>
                <div className="space-y-4 mobile:space-y-2">
                  <div className="flex justify-center">
                    {selectedProduct.image ? (
                      <img
                        src={`${API_BASE_URL}${selectedProduct.image}`}
                        alt={selectedProduct.productname}
                        className="h-24 w-24 mobile:h-16 mobile:w-16 anum-mobile:h-12 object-cover rounded-md"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">No Image</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mobile:gap-2">
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Product Type:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">{capitalize(selectedProduct.product_type)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Serial Number:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">{selectedProduct.serial_number}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Product Name:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">{selectedProduct.productname}</span>
                    </div>
                    <div>
                      <span coverings="font-medium text-gray-700 text-xs sm:text-sm">Price:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">₹{parseFloat(selectedProduct.price).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Per:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">{selectedProduct.per}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Discount:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">{parseFloat(selectedProduct.discount).toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">Status:</span>
                      <span className="ml-2 text-gray-900 text-xs sm:text-sm">{capitalize(selectedProduct.status)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 mobile:mt-3 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="rounded-md bg-gray-600 px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>
          <Modal
            isOpen={editModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50"
          >
            <div className="bg-white rounded-lg p-6 mobile:p-3 max-w-md w-full sm:max-w-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 mobile:mb-2 text-center">
                Edit Product
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-4 mobile:space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    name="productname"
                    value={editFormData.productname}
                    onChange={handleInputChange}
                    className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    name="serial_number"
                    value={editFormData.serial_number}
                    onChange={handleInputChange}
                    className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={handleInputChange}
                    className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
                    required
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={editFormData.discount}
                    onChange={handleInputChange}
                    className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
                    required
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Per</label>
                  <select
                    name="per"
                    value={editFormData.per}
                    onChange={handleInputChange}
                    className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
                    required
                  >
                    <option value="pieces">Pieces</option>
                    <option value="box">Box</option>
                    <option value="pkt">Packet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png"
                    className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
                  />
                </div>
                <div className="mt-6 mobile:mt-3 flex justify-end space-x-2 mobile:space-x-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md bg-gray-600 px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}