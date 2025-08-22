import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logout from '../Logout';

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

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
      borderDark: "1px solid rgba(59,130,246,0.4)",
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    },
  };

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
    setValues({
      serialNum: '',
      productName: '',
      price: '',
      dprice: '',
      per: '',
      discount: '',
      description: '',
    });
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
    }
  };

  const handleDeleteProductType = async () => {
    if (!productTypeToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types/${productTypeToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete product type');
      setProductTypes(productTypes.filter((type) => type !== productTypeToDelete));
      setSuccess('Product type deleted successfully!');
      setError('');
      if (productType === productTypeToDelete) {
        setProductType('');
        setValues({
          serialNum: '',
          productName: '',
          price: '',
          dprice: '',
          per: '',
          discount: '',
          description: '',
        });
        setImages([]);
        setFocused({});
        setDiscountWarning('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteModal(false);
      setProductTypeToDelete(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setDiscountWarning('');

    // Validate required fields
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

    if (isNaN(price) || price < 0) {
      setError('Price must be a valid positive number');
      return;
    }

    if (isNaN(dprice) || dprice < 0) {
      setError('Direct Customer Price must be a valid positive number');
      return;
    }

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
    formData.append('discount', values.discount || '0'); // Default to 0 if empty
    formData.append('description', values.description || '');
    formData.append('product_type', productType);

    if (Array.isArray(images) && images.length > 0) {
      images.forEach(file => formData.append('images', file));
    }

    // Log FormData for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key} = ${value}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Failed to save product');

      setSuccess('Product saved successfully!');
      setValues({
        serialNum: '',
        productName: '',
        price: '',
        dprice: '',
        per: '',
        discount: '',
        description: '',
      });
      setImages([]);
      setFocused({});
      setDiscountWarning('');
      event.target.reset();
    } catch (err) {
      console.error('Submission error:', err);
      setError(`Failed to save product: ${err.message}`);
    }
  };

  const formatProductTypeDisplay = (type) => {
    if (!type || typeof type !== 'string') return 'Unknown Type';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderFormFields = () => {
    if (!productType) return null;

    const renderMedia = (media, idx) => {
      let src;
      let isVideo = false;

      if (media instanceof File) {
        src = URL.createObjectURL(media);
        isVideo = media.type.startsWith('video/');
      } else {
        return <span key={idx} className="text-gray-500 dark:text-gray-400 text-sm">Invalid media</span>;
      }

      return isVideo ? (
        <div key={idx} className="relative">
          <video
            src={src}
            controls
            className="h-20 w-20 object-cover rounded-md inline-block mx-1"
            onLoad={() => URL.revokeObjectURL(src)}
          />
          <button
            type="button"
            onClick={() => setImages(images.filter((_, index) => index !== idx))}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
            title="Remove this media"
          >
            ×
          </button>
        </div>
      ) : (
        <div key={idx} className="relative">
          <img
            src={src || '/placeholder.svg'}
            alt={`media-${idx}`}
            className="h-20 w-20 object-cover rounded-md inline-block mx-1"
            onLoad={() => URL.revokeObjectURL(src)}
          />
          <button
            type="button"
            onClick={() => setImages(images.filter((_, index) => index !== idx))}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
            title="Remove this media"
          >
            ×
          </button>
        </div>
      );
    };

    return (
      <>
        <div className="mobile:col-span-6">
          <label htmlFor={`serial-num-${productType}`} className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Serial Number*
          </label>
          <div className="mt-2">
            <input
              type="text"
              id={`serial-num-${productType}`}
              name="serialNum"
              required
              value={values.serialNum}
              onChange={(e) => handleChange('serialNum', e)}
              onFocus={() => handleFocus('serialNum')}
              onBlur={() => handleBlur('serialNum')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Product Name*
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="product-name"
              name="productName"
              required
              value={values.productName}
              onChange={(e) => handleChange('productName', e)}
              onFocus={() => handleFocus('productName')}
              onBlur={() => handleBlur('productName')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="price" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Price (INR)*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="price"
              name="price"
              required
              min="0"
              step="0.01"
              value={values.price}
              onChange={(e) => handleChange('price', e)}
              onFocus={() => handleFocus('price')}
              onBlur={() => handleBlur('price')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="dprice" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Direct Customer Price (INR)*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="dprice"
              name="dprice"
              required
              min="0"
              step="0.01"
              value={values.dprice}
              onChange={(e) => handleChange('dprice', e)}
              onFocus={() => handleFocus('dprice')}
              onBlur={() => handleBlur('dprice')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
          </div>
        </div>
        <div className="mobile:col-span-3">
          <label htmlFor="per" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Per*
          </label>
          <div className="mt-2">
            <select
              id="per"
              name="per"
              required
              value={values.per}
              onChange={(e) => handleChange('per', e)}
              onFocus={() => handleFocus('per')}
              onBlur={() => handleBlur('per')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            >
              <option value="">Select</option>
              <option value="pieces">Pieces</option>
              <option value="box">Box</option>
              <option value="pkt">Pkt</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="discount" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Discount (%)
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="discount"
              name="discount"
              min="0"
              max="100"
              step="0.01"
              value={values.discount}
              onChange={(e) => handleChange('discount', e)}
              onFocus={() => handleFocus('discount')}
              onBlur={() => handleBlur('discount')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
            />
            {discountWarning && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{discountWarning}</p>
            )}
          </div>
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Description
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              name="description"
              rows="3"
              value={values.description}
              onChange={(e) => handleChange('description', e)}
              onFocus={() => handleFocus('description')}
              onBlur={() => handleBlur('description')}
              className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-2 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
              style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
              placeholder="Enter product description"
            />
          </div>
        </div>
        <div className="mobile:col-span-6">
          <label htmlFor="image" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
            Image Upload
          </label>
          <div className="mt-2">
            <input
              type="file"
              id="image"
              name="images"
              accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-gray-700 file:text-indigo-600 dark:file:text-gray-200 hover:file:bg-indigo-100 dark:hover:file:bg-gray-600"
            />
          </div>
          {images.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Selected media:</p>
              <div className="flex flex-wrap gap-2">
                {images.map((file, idx) => renderMedia(file, idx))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 pt-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6">Add Items</h2>
          {error && <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
          {success && <div className="mb-4 text-green-600 dark:text-green-400 text-sm text-center">{success}</div>}
          <div className="space-y-8">
            <div className="border-b border-gray-900/10 dark:border-gray-700 pb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Product Types</h3>
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="new-product-type" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Create New Product Type
                  </label>
                  <div className="mt-2 flex gap-x-4">
                    <input
                      type="text"
                      id="new-product-type"
                      value={newProductType}
                      onChange={handleNewProductTypeChange}
                      className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                      placeholder="Enter product type name"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={handleCreateProductType}
                      className="rounded-full w-8 h-7 flex justify-center items-center text-white dark:text-gray-100 font-semibold shadow-xs"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      <FaPlus className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="product-type" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                    Select Product Type
                  </label>
                  <div className="mt-2">
                    <select
                      id="product-type"
                      value={productType}
                      onChange={handleProductTypeChange}
                      className="block w-full rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-base text-gray-900 dark:text-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                      style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                    >
                      <option value="">Select</option>
                      {productTypes.map(type => (
                        <option key={type} value={type} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          {formatProductTypeDisplay(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">Existing Product Types</h4>
                {productTypes.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No product types available.</p>
                ) : (
                  <ul className="space-y-2 grid hundred:grid-cols-3 onefifty:grid-cols-3 mobile:grid-cols-3">
                    {productTypes.map(type => (
                      <li key={type} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatProductTypeDisplay(type)}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setProductTypeToDelete(type);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <FaTrash className="h-4 w-4" />
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {productType ? (
              <form onSubmit={handleSubmit}>
                <div className="border-b border-gray-900/10 dark:border-gray-700 pb-8">
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    {renderFormFields()}
                  </div>
                </div>
                <div className="flex justify-end gap-x-6">
                  <button
                    type="button"
                    className="text-sm cursor-pointer font-semibold text-gray-900 dark:text-gray-100"
                    onClick={() => {
                      setValues({
                        serialNum: '',
                        productName: '',
                        price: '',
                        dprice: '',
                        per: '',
                        discount: '',
                        description: '',
                      });
                      setImages([]);
                      setProductType('');
                      setFocused({});
                      setDiscountWarning('');
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="rounded-md cursor-pointer text-white dark:text-gray-100 px-3 py-2 text-sm font-semibold shadow-xs"
                    style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                  >
                    Save
                  </motion.button>
                </div>
              </form>
            ) : (
              <div className="flex justify-center items-center">
                <p className="text-lg text-center font-medium text-gray-900 dark:text-gray-100">
                  Please select or create a product type to add items
                </p>
              </div>
            )}
          </div>
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTrash className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirm Deletion</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to delete the product type "{formatProductTypeDisplay(productTypeToDelete)}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100 font-semibold px-6 py-3 rounded-2xl"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteProductType}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-3 rounded-2xl"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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