import React, { useState, useEffect } from 'react';
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
    box_count: 1,
    images: []
  });
  const productsPerPage = 9;

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
        box_count: product.box_count || 1
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
    setCurrentPage(1);
  }, [filterType, products]);

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
        body: JSON.stringify({ ...formData, box_count: Math.max(1, parseInt(formData.box_count) || 1) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'add'} product`);
      fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (product) => {
    try {
      await fetch(`${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, '_')}/${product.id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditModalIsOpen(false);
    setAddModalIsOpen(false);
    setSelectedProduct(null);
    setError('');
    setFormData({ productname: '', serial_number: '', price: '', discount: '', per: '', product_type: '', description: '', box_count: 1, images: [] });
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
        {['productname', 'serial_number', 'price', 'discount', 'box_count'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700">{capitalize(field.replace('_', ' '))}</label>
            <input
              type={field === 'price' || field === 'discount' || field === 'box_count' ? 'number' : 'text'}
              name={field}
              value={formData[field]}
              onChange={e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              className="mt-1 mobile:mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 sm:text-sm"
              required
              step={field === 'price' || field === 'discount' ? '0.01' : undefined}
              min={field === 'box_count' ? '1' : undefined}
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
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 overflow-hidden">
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
                className="mt-2 mobile:mt-1 block w-48 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              >
                <option value="all">All</option>
                {productTypes.map(type => <option key={type} value={type}>{capitalize(type)}</option>)}
              </select>
            </div>
            <button
              onClick={() => setAddModalIsOpen(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 mobile:translate-y-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Add Product
            </button>
          </div>
          {currentProducts.length === 0 ? (
            <p className="text-lg text-center text-gray-600 sm:text-xl font-medium">No products found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
              {currentProducts.map(product => {
                const productKey = `${product.product_type}-${product.id}`;
                return (
                  <div key={productKey} className="bg-white rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200">
                    <div className="flex flex-col">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{product.productname}</h3>
                        <p className="text-xs text-gray-600">{capitalize(product.product_type)}</p>
                        <p className="text-xs text-gray-600">S/N: {product.serial_number}</p>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-2 justify-center">
                        {product.images.length > 0 ? product.images.map((media, idx) => renderMedia(media, idx, 'h-16 w-16 mobile:h-12 mobile:w-12')) : <span className="text-xs text-gray-500">No media</span>}
                      </div>
                      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Price:</span> ₹{parseFloat(product.price).toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Per:</span> {product.per}
                        </div>
                        <div>
                          <span className="font-medium">Discount:</span> {parseFloat(product.discount).toFixed(2)}%
                        </div>
                        <div>
                          <span className="font-medium">Box Count:</span> {product.box_count}
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
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setSelectedProduct(product); setModalIsOpen(true); }}
                          className="flex items-center px-3 py-1 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        >
                          <FaEye className="mr-1 h-4 w-4" /> View
                        </button>
                        <button
                          onClick={() => { setSelectedProduct(product); setFormData({ productname: product.productname, serial_number: product.serial_number, price: product.price, discount: product.discount, per: product.per, description: product.description || '', box_count: product.box_count, images: product.images }); setEditModalIsOpen(true); }}
                          className="flex items-center px-3 py-1 text-xs sm:text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
                        >
                          <FaEdit className="mr-1 h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="flex items-center px-3 py-1 text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          <FaTrash className="mr-1 h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                    {['product_type', 'serial_number', 'productname', 'price', 'per', 'discount', 'box_count', 'description', 'status'].map(field => (
                      <div key={field} className={field === 'description' ? 'sm:col-span-2' : ''}>
                        <span className="font-medium text-gray-700 text-xs sm:text-sm">{capitalize(field.replace('_', ' '))}:</span>
                        <span className="ml-2 text-gray-900 text-xs sm:text-sm">
                          {field === 'price' ? `₹${parseFloat(selectedProduct[field]).toFixed(2)}` : field === 'discount' ? `${parseFloat(selectedProduct[field]).toFixed(2)}%` : field === 'description' ? (selectedProduct[field] || 'No description') : field === 'box_count' ? selectedProduct[field] : capitalize(selectedProduct[field])}
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