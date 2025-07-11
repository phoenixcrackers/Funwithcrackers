import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaEdit, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Logout from '../Logout';

Modal.setAppElement('#root');

export default function List() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [productTypes, setProductTypes] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [viewModalIsOpen, setViewModalIsOpen] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [toggleStates, setToggleStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ 
    productname: '', 
    serial_number: '', 
    price: '', 
    discount: '', 
    per: '', 
    product_type: '', 
    description: '', 
    images: [] 
  });
  const productsPerPage = 10;
  const menuRef = useRef({});

  const fetchData = async (url, errorMsg, setter) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || errorMsg);
      setter(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProductTypes = () => fetchData(
    `${API_BASE_URL}/api/product-types`, 
    'Failed to fetch product types', 
    data => setProductTypes(data.filter(item => item.product_type !== 'gift_box_dealers').map(item => item.product_type))
  );

  const fetchProducts = () => fetchData(`${API_BASE_URL}/api/products`, 'Failed to fetch products', data => {
    const normalizedData = data
      .filter(product => product.product_type !== 'gift_box_dealers')
      .map(product => ({
        ...product,
        images: product.image ? (Array.isArray(JSON.parse(product.image)) ? JSON.parse(product.image) : [product.image]) : [],
      }));
    setProducts(normalizedData);
    setFilteredProducts(filterType === 'all' ? normalizedData : normalizedData.filter(p => p.product_type === filterType));
    setToggleStates(normalizedData.reduce((acc, p) => ({
      ...acc, 
      [`${p.product_type}-${p.id}`]: p.status === 'on', 
      [`fast-${p.product_type}-${p.id}`]: p.fast_running === true,
    }), {}));
  });

  const handleToggle = async (product, endpoint, keyPrefix) => {
    const productKey = `${keyPrefix}${product.product_type}-${product.id}`;
    const tableName = product.product_type.toLowerCase().replace(/\s+/g, '_');
    try {
      setToggleStates(prev => ({ ...prev, [productKey]: !prev[productKey] }));
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/${endpoint}`, { method: 'PATCH' });
      if (!response.ok) throw new Error(`Failed to toggle ${endpoint}`);
      fetchProducts();
    } catch (err) {
      setError(err.message);
      setToggleStates(prev => ({ ...prev, [productKey]: prev[productKey] }));
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
    const intervalId = setInterval(() => { fetchProductTypes(); fetchProducts(); }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setFilteredProducts(filterType === 'all' ? products : products.filter(p => p.product_type === filterType));
  }, [filterType, products]);

  useEffect(() => {
    const handleClickOutside = e => viewModalIsOpen && menuRef.current[viewModalIsOpen] && !menuRef.current[viewModalIsOpen].contains(e.target) && setViewModalIsOpen(null);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [viewModalIsOpen]);

  const handleImageChange = (e, isEdit) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
    const maxSize = 5 * 1024 * 1024;
    if (files.some(file => !allowedTypes.includes(file.type))) return setError('Only JPG, PNG, GIF, MP4, WebM, or Ogg files allowed');
    if (files.some(file => file.size > maxSize)) return setError('Each file must be less than 5MB');
    Promise.all(files.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }))).then(base64Files => {
      setError('');
      setFormData(prev => ({ ...prev, images: base64Files }));
    }).catch(() => setError('Failed to read files'));
  };

  const handleSubmit = async (e, isEdit) => {
    e.preventDefault();
    if (formData.product_type === 'gift_box_dealers') {
      setError('Product type "gift_box_dealers" is not allowed');
      return;
    }
    const url = isEdit 
      ? `${API_BASE_URL}/api/products/${selectedProduct.product_type.toLowerCase().replace(/\s+/g, '_')}/${selectedProduct.id}` 
      : `${API_BASE_URL}/api/products`;
    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'add'} product`);
      fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditModalIsOpen(false);
    setAddModalIsOpen(false);
    setViewModalIsOpen(null);
    setSelectedProduct(null);
    setError('');
    setFormData({ productname: '', serial_number: '', price: '', discount: '', per: '', product_type: '', description: '', images: [] });
  };

  const capitalize = str => str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  const renderMedia = (media, idx, sizeClass) => (
    media.startsWith('data:video/') ? (
      <video key={idx} src={media} controls className={`${sizeClass} object-cover rounded-md inline-block mx-1`} />
    ) : media.startsWith('data:image/') ? (
      <img key={idx} src={media} alt={`media-${idx}`} className={`${sizeClass} object-cover rounded-md inline-block mx-1`} />
    ) : (
      <span key={idx} className="text-xs text-gray-500">Unsupported format</span>
    )
  );

  const renderModalForm = (isEdit) => (
    <div className="bg-white rounded-lg p-6 mobile:p-3 max-w-md w-full sm:max-w-lg">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 mobile:mb-2 text-center">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <form onSubmit={e => handleSubmit(e, isEdit)} className="space-y-4 mobile:space-y-2">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Type</label>
            <input
              type="text"
              name="product_type"
              value={formData.product_type}
              onChange={e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
              required
            />
          </div>
        )}
        {['productname', 'serial_number', 'price', 'discount'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700">{capitalize(field.replace('_', ' '))}</label>
            <input
              type={field === 'price' || field === 'discount' ? 'number' : 'text'}
              name={field}
              value={formData[field]}
              onChange={e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
              required
              step={field === 'price' || field === 'discount' ? '0.01' : undefined}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700">Per</label>
          <select
            name="per"
            value={formData.per}
            onChange={e => setFormData(prev => ({ ...prev, per: e.target.value }))}
            className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
            required
          >
            {isEdit 
              ? ['pieces', 'box', 'pkt'].map(opt => <option key={opt} value={opt}>{opt}</option>) 
              : [<option key="" value="">Select Unit</option>, ...['pieces', 'box', 'pkt'].map(opt => <option key={opt} value={opt}>{opt}</option>)]
            }
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
            rows="3"
            placeholder="Enter product description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <input
            type="file"
            name="images"
            multiple
            onChange={e => handleImageChange(e, isEdit)}
            accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/ogg"
            className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
          />
          {formData.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.images.map((file, idx) => renderMedia(file, idx, 'h-24 w-24'))}
            </div>
          )}
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
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );

  const { indexOfFirstProduct, indexOfLastProduct } = { 
    indexOfFirstProduct: currentPage * productsPerPage - productsPerPage, 
    indexOfLastProduct: currentPage * productsPerPage 
  };
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="flex min-h-screen overflow-hidden mobile:overflow-hidden">
      <Sidebar />
      <Logout />
      <div className="flex-1 md:ml-64 p-6 mobile:p-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 mb-6 mobile:mb-4">List Products</h2>
          {error && <div className="mb-4 mobile:mb-2 text-red-600 text-sm text-center">{error}</div>}
          <div className="mb-6 mobile:mb-4 flex justify-between items-center">
            <div>
              <label htmlFor="product-type-filter" className="block text-sm font-medium text-gray-900">Filter by Product Type</label>
              <select
                id="product-type-filter"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="mt-2 mobile:mt-1 block w-48 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:outline-offset-1 focus:outline-indigo-600 sm:text-sm"
              >
                <option value="all">All</option>
                {productTypes.map(type => <option key={type} value={type}>{capitalize(type)}</option>)}
              </select>
            </div>
            <button
              onClick={() => setAddModalIsOpen(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Add Product
            </button>
          </div>
          {currentProducts.length === 0 ? (
            <p className="text-lg text-center text-gray-600 sm:text-xl font-medium">No products found</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {['Product Type', 'Serial Number', 'Product Name', 'Price (INR)', 'Per', 'Discount (%)', 'Image', 'Status', 'Fast Running', 'Actions'].map(header => (
                        <th
                          key={header}
                          className={`px-4 py-3 text-${header === 'Price (INR)' || header === 'Discount (%)' ? 'right' : header === 'Image' || header === 'Status' || header === 'Fast Running' || header === 'Actions' ? 'center' : 'left'} text-xs font-medium text-gray-500 uppercase ${header === 'Serial Number' || header === 'Product Name' ? 'tracking-wider' : ''}`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 border-b border-gray-200">
                    {currentProducts.map(product => {
                      const productKey = `${product.product_type}-${product.id}`;
                      return (
                        <tr key={productKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{capitalize(product.product_type)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.serial_number}</td>
                          <td className="px-2 py-3 whitespace-normal text-sm text-gray-900 max-w-xs truncate">{product.productname}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">₹{parseFloat(product.price).toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.per}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">{parseFloat(product.discount).toFixed(2)}%</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {product.images.length > 0 ? product.images.map((media, idx) => renderMedia(media, idx, 'h-12 w-12')) : <span className="text-xs text-gray-500">No media</span>}
                          </td>
                          {[productKey, `fast-${productKey}`].map((key, i) => (
                            <td key={key} className="px-4 py-3 whitespace-nowrap text-center">
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={toggleStates[key]}
                                  onChange={() => handleToggle(product, i === 0 ? 'toggle-status' : 'toggle-fast-running', i === 0 ? '' : 'fast-')}
                                />
                                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[key] ? (i === 0 ? 'bg-green-600' : 'bg-blue-600') : (i === 0 ? 'bg-red-600' : 'bg-gray-400')}`}>
                                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${toggleStates[key] ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </div>
                              </label>
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap text-center relative">
                            <button
                              onClick={() => setViewModalIsOpen(viewModalIsOpen === productKey ? null : productKey)}
                              className="text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" /></svg>
                            </button>
                            {viewModalIsOpen === productKey && (
                              <div ref={el => (menuRef.current[productKey] = el)} className="absolute z-10 w-28 bg-white rounded-md shadow-lg border border-gray-200 right-0">
                                <div className="py-1 flex flex-col">
                                  {[
                                    { icon: FaEye, label: 'View', action: () => { setSelectedProduct(product); setModalIsOpen(true); setViewModalIsOpen(null); } },
                                    { icon: FaEdit, label: 'Edit', action: () => { setSelectedProduct(product); setFormData({ productname: product.productname, serial_number: product.serial_number, price: product.price, discount: product.discount, per: product.per, description: product.description || '', images: product.images }); setEditModalIsOpen(true); setViewModalIsOpen(null); } },
                                    { icon: FaTrash, label: 'Delete', action: async () => { 
                                      try { 
                                        await fetch(`${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, '_')}/${product.id}`, { method: 'DELETE' }); 
                                        fetchProducts(); 
                                        setViewModalIsOpen(null); 
                                      } catch (err) { 
                                        setError('Failed to delete product'); 
                                      } 
                                    }, className: 'text-red-600' }
                                  ].map(({ icon: Icon, label, action, className }, i) => (
                                    <button
                                      key={i}
                                      onClick={action}
                                      className={`flex cursor-pointer items-center px-4 py-2 text-sm ${className || 'text-gray-700'} hover:bg-gray-300 text-left`}
                                    >
                                      <Icon className="mr-2 h-4 w-4" />{label}
                                    </button>
                                  ))}
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
              {/* Mobile Card View */}
              <div className="md:hidden grid gap-4">
                {currentProducts.map(product => {
                  const productKey = `${product.product_type}-${product.id}`;
                  return (
                    <div key={productKey} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{product.productname}</h3>
                          <p className="text-xs text-gray-600">{capitalize(product.product_type)}</p>
                          <p className="text-xs text-gray-600">S/N: {product.serial_number}</p>
                        </div>
                        <button
                          onClick={() => setViewModalIsOpen(viewModalIsOpen === productKey ? null : productKey)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                      </div>
                      {viewModalIsOpen === productKey && (
                        <div ref={el => (menuRef.current[productKey] = el)} className="mt-2 flex flex-col gap-2">
                          {[
                            { icon: FaEye, label: 'View', action: () => { setSelectedProduct(product); setModalIsOpen(true); setViewModalIsOpen(null); } },
                            { icon: FaEdit, label: 'Edit', action: () => { setSelectedProduct(product); setFormData({ productname: product.productname, serial_number: product.serial_number, price: product.price, discount: product.discount, per: product.per, description: product.description || '', images: product.images }); setEditModalIsOpen(true); setViewModalIsOpen(null); } },
                            { icon: FaTrash, label: 'Delete', action: async () => { 
                              try { 
                                await fetch(`${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, '_')}/${product.id}`, { method: 'DELETE' }); 
                                fetchProducts(); 
                                setViewModalIsOpen(null); 
                              } catch (err) { 
                                setError('Failed to delete product'); 
                              } 
                            }, className: 'text-red-600' }
                          ].map(({ icon: Icon, label, action, className }, i) => (
                            <button
                              key={i}
                              onClick={action}
                              className={`flex items-center px-2 py-1 text-xs ${className || 'text-gray-700'} hover:bg-gray-100 rounded`}
                            >
                              <Icon className="mr-1 h-4 w-4" />{label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.images.length > 0 ? product.images.map((media, idx) => renderMedia(media, idx, 'h-16 w-16')) : <span className="text-xs text-gray-500">No media</span>}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Price:</span> ₹{parseFloat(product.price).toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Per:</span> {product.per}
                        </div>
                        <div>
                          <span className="font-medium">Discount:</span> {parseFloat(product.discount).toFixed(2)}%
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={toggleStates[productKey]}
                              onChange={() => handleToggle(product, 'toggle-status', '')}
                            />
                            <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[productKey] ? 'bg-green-600' : 'bg-red-600'}`}>
                              <div className={`absolute top-0.25 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out ${toggleStates[productKey] ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                            </div>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Fast Running:</span>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={toggleStates[`fast-${productKey}`]}
                              onChange={() => handleToggle(product, 'toggle-fast-running', 'fast-')}
                            />
                            <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[`fast-${productKey}`] ? 'bg-blue-600' : 'bg-gray-400'}`}>
                              <div className={`absolute top-0.25 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out ${toggleStates[`fast-${productKey}`] ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {totalPages > 1 && (
            <div className="mt-6 mobile:mt-4 flex justify-center items-center space-x-4 mobile:space-x-2">
              <button
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <FaArrowLeft className="h-5 w-5 mobile:h-4 mobile:w-4" />
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <FaArrowRight className="h-5 w-5 mobile:h-4 mobile:w-4" />
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
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 mobile:mb-2 text-center">Product Details</h2>
                <div className="space-y-4 mobile:space-y-2">
                  <div className="flex justify-center">
                    {selectedProduct.images.length > 0 ? selectedProduct.images.map((media, idx) => renderMedia(media, idx, 'h-24 w-24 mobile:h-16 mobile:w-16')) : <span className="text-gray-500 text-sm">No media</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mobile:gap-2">
                    {['product_type', 'serial_number', 'productname', 'price', 'per', 'discount', 'description', 'status'].map(field => (
                      <div key={field} className={field === 'description' ? 'sm:col-span-2' : ''}>
                        <span className="font-medium text-gray-700 text-xs sm:text-sm">{capitalize(field.replace('_', ' '))}:</span>
                        <span className="ml-2 text-gray-900 text-xs sm:text-sm">
                          {field === 'price' ? `₹${parseFloat(selectedProduct[field]).toFixed(2)}` : field === 'discount' ? `${parseFloat(selectedProduct[field]).toFixed(2)}%` : field === 'description' ? (selectedProduct[field] || 'No description') : capitalize(selectedProduct[field])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 mobile:mt-3 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="rounded-md bg-gray-600 px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
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
            {renderModalForm(true)}
          </Modal>
          <Modal
            isOpen={addModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50"
          >
            {renderModalForm(false)}
          </Modal>
        </div>
      </div>
    </div>
  );
}