import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logout from '../Logout';

const Spinner = ({ size = 'sm', color = 'text-white' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" color="text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading inventory…</p>
    </div>
  </div>
);

export default function Inventory() {
  const [focused, setFocused] = useState({});
  const [values, setValues] = useState({
    serialNum: '',
    productName: '',
    price: '',
    dprice: '',
    per: '',
    discount: '',
    description: '',
  });
  const [productType, setProductType] = useState('');
  const [newProductType, setNewProductType] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discountWarning, setDiscountWarning] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createTypeLoading, setCreateTypeLoading] = useState(false);
  const [deleteTypeLoading, setDeleteTypeLoading] = useState(false);

  // ── all original logic/API calls unchanged ────────────────────────────────

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch product types');
      const validTypes = data
        .filter(item => item && item.product_type && typeof item.product_type === 'string')
        .map(item => item.product_type);
      setProductTypes(validTypes);
    } catch (err) {
      console.error('Error fetching product types:', err);
      setError(err.message);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
    const intervalId = setInterval(fetchProductTypes, 180000);
    return () => clearInterval(intervalId);
  }, []);

  const handleFocus = (inputId) => {
    setFocused((prev) => ({ ...prev, [inputId]: true }));
  };

  const handleBlur = (inputId) => {
    setFocused((prev) => ({ ...prev, [inputId]: values[inputId] !== '' }));
  };

  const handleChange = (inputId, event) => {
    const value = event.target.value;
    if (inputId === 'discount') {
      if (value === '') {
        setDiscountWarning('');
        setValues((prev) => ({ ...prev, [inputId]: value }));
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          setDiscountWarning('Discount must be between 0 and 100%');
          setValues((prev) => ({ ...prev, [inputId]: numValue < 0 ? '0' : '100' }));
        } else {
          setDiscountWarning('');
          setValues((prev) => ({ ...prev, [inputId]: value }));
        }
      }
    } else if (inputId === 'price' || inputId === 'dprice') {
      if (value === '') {
        setError('');
        setValues((prev) => ({ ...prev, [inputId]: value }));
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          setError(`${inputId === 'price' ? 'Price' : 'Direct Customer Price'} must be a valid positive number`);
          setValues((prev) => ({ ...prev, [inputId]: '0' }));
        } else {
          setError('');
          setValues((prev) => ({ ...prev, [inputId]: value }));
        }
      }
    } else {
      setValues((prev) => ({ ...prev, [inputId]: value }));
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    const validFiles = [];
    for (const file of files) {
      const fileType = file.type.toLowerCase();
      if (!allowedTypes.includes(fileType)) {
        setError('Only JPG, PNG, GIF images and MP4, WebM, Ogg videos are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each file must be less than 5MB');
        return;
      }
      validFiles.push(file);
    }
    setError('');
    setImages(validFiles);
  };

  const handleProductTypeChange = (event) => {
    setProductType(event.target.value);
    setValues({ serialNum: '', productName: '', price: '', dprice: '', per: '', discount: '', description: '' });
    setFocused({});
    setImages([]);
    setError('');
    setSuccess('');
    setDiscountWarning('');
  };

  const handleNewProductTypeChange = (event) => {
    setNewProductType(event.target.value);
  };

  const handleCreateProductType = async () => {
    if (!newProductType) {
      setError('Product type name is required');
      return;
    }
    const formattedProductType = newProductType.toLowerCase().replace(/\s+/g, '_');
    if (productTypes.includes(formattedProductType)) {
      setError('Product type already exists');
      return;
    }
    try {
      setCreateTypeLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formattedProductType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create product type');
      setProductTypes([...productTypes, formattedProductType]);
      setNewProductType('');
      setSuccess('Product type created successfully!');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateTypeLoading(false);
    }
  };

  const handleDeleteProductType = async () => {
    if (!productTypeToDelete) return;
    try {
      setDeleteTypeLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/product-types/${productTypeToDelete}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete product type');
      setProductTypes(productTypes.filter((type) => type !== productTypeToDelete));
      setSuccess('Product type deleted successfully!');
      setError('');
      if (productType === productTypeToDelete) {
        setProductType('');
        setValues({ serialNum: '', productName: '', price: '', dprice: '', per: '', discount: '', description: '' });
        setImages([]);
        setFocused({});
        setDiscountWarning('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteTypeLoading(false);
      setShowDeleteModal(false);
      setProductTypeToDelete(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setDiscountWarning('');
    const missingFields = [];
    if (!values.serialNum) missingFields.push('Serial Number');
    if (!values.productName) missingFields.push('Product Name');
    if (!values.price) missingFields.push('Price');
    if (!values.dprice) missingFields.push('Direct Customer Price');
    if (!values.per) missingFields.push('Per');
    if (!productType) missingFields.push('Product Type');
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    const price = parseFloat(values.price);
    const dprice = parseFloat(values.dprice);
    const discount = values.discount ? parseFloat(values.discount) : 0;
    if (isNaN(price) || price < 0) { setError('Price must be a valid positive number'); return; }
    if (isNaN(dprice) || dprice < 0) { setError('Direct Customer Price must be a valid positive number'); return; }
    if (values.discount && (isNaN(discount) || discount < 0 || discount > 100)) {
      setError('Discount must be a valid number between 0 and 100%');
      return;
    }
    const formData = new FormData();
    formData.append('serial_number', values.serialNum);
    formData.append('productname', values.productName);
    formData.append('price', values.price);
    formData.append('dprice', values.dprice);
    formData.append('per', values.per);
    formData.append('discount', values.discount || '0');
    formData.append('description', values.description || '');
    formData.append('product_type', productType);
    if (Array.isArray(images) && images.length > 0) {
      images.forEach(file => formData.append('images', file));
    }
    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key} = ${value}`);
    }
    try {
      setSubmitLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/products`, { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Failed to save product');
      setSuccess('Product saved successfully!');
      setValues({ serialNum: '', productName: '', price: '', dprice: '', per: '', discount: '', description: '' });
      setImages([]);
      setFocused({});
      setDiscountWarning('');
      event.target.reset();
    } catch (err) {
      console.error('Submission error:', err);
      setError(`Failed to save product: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatProductTypeDisplay = (type) => {
    if (!type || typeof type !== 'string') return 'Unknown Type';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // ── shared UI classes ─────────────────────────────────────────────────────
  const ic = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sc = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";
  const lc = "block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5";

  const renderFormFields = () => {
    if (!productType) return null;

    const renderMedia = (media, idx) => {
      let src;
      let isVideo = false;
      if (media instanceof File) {
        src = URL.createObjectURL(media);
        isVideo = media.type.startsWith('video/');
      } else {
        return <span key={idx} className="text-gray-500 text-sm">Invalid media</span>;
      }
      return isVideo ? (
        <div key={idx} className="relative">
          <video src={src} controls className="h-20 w-20 object-cover rounded-lg border border-gray-200" onLoad={() => URL.revokeObjectURL(src)} />
          <button type="button" onClick={() => setImages(images.filter((_, index) => index !== idx))}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">×</button>
        </div>
      ) : (
        <div key={idx} className="relative">
          <img src={src || '/placeholder.svg'} alt={`media-${idx}`} className="h-20 w-20 object-cover rounded-lg border border-gray-200" onLoad={() => URL.revokeObjectURL(src)} />
          <button type="button" onClick={() => setImages(images.filter((_, index) => index !== idx))}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">×</button>
        </div>
      );
    };

    return (
      <>
        <div className="mobile:col-span-6">
          <label htmlFor={`serial-num-${productType}`} className={lc}>Serial Number <span className="text-red-400">*</span></label>
          <input type="text" id={`serial-num-${productType}`} name="serialNum" required value={values.serialNum}
            onChange={(e) => handleChange('serialNum', e)} onFocus={() => handleFocus('serialNum')} onBlur={() => handleBlur('serialNum')} className={ic} />
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="product-name" className={lc}>Product Name <span className="text-red-400">*</span></label>
          <input type="text" id="product-name" name="productName" required value={values.productName}
            onChange={(e) => handleChange('productName', e)} onFocus={() => handleFocus('productName')} onBlur={() => handleBlur('productName')} className={ic} />
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="price" className={lc}>Price (INR) <span className="text-red-400">*</span></label>
          <input type="number" id="price" name="price" required min="0" step="0.01" value={values.price}
            onChange={(e) => handleChange('price', e)} onFocus={() => handleFocus('price')} onBlur={() => handleBlur('price')} className={ic} />
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="dprice" className={lc}>Direct Customer Price (INR) <span className="text-red-400">*</span></label>
          <input type="number" id="dprice" name="dprice" required min="0" step="0.01" value={values.dprice}
            onChange={(e) => handleChange('dprice', e)} onFocus={() => handleFocus('dprice')} onBlur={() => handleBlur('dprice')} className={ic} />
        </div>
        <div className="mobile:col-span-3">
          <label htmlFor="per" className={lc}>Per <span className="text-red-400">*</span></label>
          <select id="per" name="per" required value={values.per}
            onChange={(e) => handleChange('per', e)} onFocus={() => handleFocus('per')} onBlur={() => handleBlur('per')} className={sc}>
            <option value="">Select</option>
            <option value="pieces">Pieces</option>
            <option value="box">Box</option>
            <option value="pkt">Pkt</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="discount" className={lc}>Discount (%)</label>
          <input type="number" id="discount" name="discount" min="0" max="100" step="0.01" value={values.discount}
            onChange={(e) => handleChange('discount', e)} onFocus={() => handleFocus('discount')} onBlur={() => handleBlur('discount')} className={ic} />
          {discountWarning && <p className="mt-1 text-xs text-red-500">{discountWarning}</p>}
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="description" className={lc}>Description</label>
          <textarea id="description" name="description" rows="3" value={values.description}
            onChange={(e) => handleChange('description', e)} onFocus={() => handleFocus('description')} onBlur={() => handleBlur('description')}
            className={`${ic} resize-none`} placeholder="Enter product description" />
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="image" className={lc}>Image Upload</label>
          <input type="file" id="image" name="images" accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg" multiple onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" />
          {images.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Selected media:</p>
              <div className="flex flex-wrap gap-2">{images.map((file, idx) => renderMedia(file, idx))}</div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="flex-1 hundred:ml-64 mobile:ml-0 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-3 border-b border-gray-200">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Stock</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add Items</h1>
          </div>

          {error && <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}
          {success && <div className="px-4 py-3 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-sm">{success}</div>}

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Product Types Panel */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                  <h2 className="text-sm font-bold text-gray-700">Product Types</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="new-product-type" className={lc}>Create New Product Type</label>
                      <div className="flex gap-2">
                        <input type="text" id="new-product-type" value={newProductType} onChange={handleNewProductTypeChange}
                          className={ic} placeholder="Enter product type name" />
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={handleCreateProductType}
                          disabled={createTypeLoading}
                          className={`flex-shrink-0 h-9 w-9 rounded-lg text-white flex items-center justify-center shadow-sm transition-colors ${createTypeLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {createTypeLoading ? <Spinner /> : <FaPlus className="h-3.5 w-3.5" />}
                        </motion.button>
                      </div>
                    </div>
                    <div className="sm:col-span-4">
                      <label htmlFor="product-type" className={lc}>Select Product Type</label>
                      <select id="product-type" value={productType} onChange={handleProductTypeChange} className={sc}>
                        <option value="">Select</option>
                        {productTypes.map(type => (
                          <option key={type} value={type}>{formatProductTypeDisplay(type)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className={lc}>Existing Product Types</p>
                    {productTypes.length === 0 ? (
                      <p className="text-sm text-gray-400">No product types available.</p>
                    ) : (
                      <ul className="grid hundred:grid-cols-3 onefifty:grid-cols-3 mobile:grid-cols-3 gap-2">
                        {productTypes.map(type => (
                          <li key={type} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg group hover:border-gray-300 transition-colors">
                            <span className="text-sm text-gray-700 font-medium truncate">{formatProductTypeDisplay(type)}</span>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => { setProductTypeToDelete(type); setShowDeleteModal(true); }}
                              className="ml-2 flex-shrink-0 text-red-400 hover:text-red-600 transition-all">
                              <FaTrash className="h-3.5 w-3.5" />
                            </motion.button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Form */}
              {productType ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                    <h2 className="text-sm font-bold text-gray-700">
                      New Product — <span className="text-blue-500">{formatProductTypeDisplay(productType)}</span>
                    </h2>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6">
                    <div className="border-b border-gray-100 pb-6">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-6">
                        {renderFormFields()}
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                      <button type="button" onClick={() => {
                        setValues({ serialNum: '', productName: '', price: '', dprice: '', per: '', discount: '', description: '' });
                        setImages([]); setProductType(''); setFocused({}); setDiscountWarning('');
                      }} className="h-9 px-5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
                        Cancel
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                        disabled={submitLoading}
                        className={`h-9 px-6 rounded-lg text-white text-sm font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2 ${submitLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {submitLoading ? <><Spinner />Saving…</> : 'Save'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex justify-center items-center bg-white border-2 border-dashed border-gray-200 rounded-xl py-16">
                  <p className="text-sm text-gray-400 font-medium text-center">
                    Please select or create a product type to add items
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center"
              onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-700">"{formatProductTypeDisplay(productTypeToDelete)}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteProductType}
                  disabled={deleteTypeLoading}
                  className={`flex-1 h-11 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${deleteTypeLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>
                  {deleteTypeLoading ? <><Spinner />Deleting…</> : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}