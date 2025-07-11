import React, { useState, useEffect } from 'react';
import { FiLogOut } from 'react-icons/fi';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import { FaPlus } from 'react-icons/fa';
import Logout from '../Logout';

export default function Inventory() {
  const [focused, setFocused] = useState({});
const [values, setValues] = useState({ description: '' });
  const [productType, setProductType] = useState('');
  const [newProductType, setNewProductType] = useState('');
  const [productTypes, setProductTypes] = useState([]);
const [images, setImages] = useState([]); // instead of image
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setValues((prev) => ({ ...prev, [inputId]: event.target.value }));
  };

const handleImageChange = (event) => {
  const files = Array.from(event.target.files);
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
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
    setValues({});
    setFocused({});
    setImages(null);
    setError('');
    setSuccess('');
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

const handleSubmit = async (event) => {
  event.preventDefault();
  setError('');
  setSuccess('');

  // Validate required fields
  if (!values.serialNum || !values.productName || !values.price || !values.per || !values.discount || !productType) {
    setError('Please fill in all required fields');
    return;
  }

  // Convert image to base64 if it exists
let imageBase64Array = [];

if (images.length > 0) {
  for (const file of images) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    imageBase64Array.push(base64);
  }
}
  
  const payload = {
    serial_number: values.serialNum,
    productname: values.productName,
    price: values.price,
    per: values.per,
    discount: values.discount,
      description: values.description || '',

    product_type: productType,
    images: imageBase64Array.length ? imageBase64Array : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save product');

      setSuccess('Product saved successfully!');
      setValues({});
      setImages([]);
      event.target.reset();
    } catch (err) {
      setError(err.message);
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
    return (
      <>
        <div className="sm:col-span-3">
          <label htmlFor={`serial-num-${productType}`} className="block text-sm font-medium text-gray-900">
            Serial Number*
          </label>
          <div className="mt-2">
            <input
              type="text"
              id={`serial-num-${productType}`}
              required
              value={values.serialNum || ''}
              onChange={(e) => handleChange('serialNum', e)}
              onFocus={() => handleFocus('serialNum')}
              onBlur={() => handleBlur('serialNum')}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-900">
            Product Name*
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="product-name"
              required
              value={values.productName || ''}
              onChange={(e) => handleChange('productName', e)}
              onFocus={() => handleFocus('productName')}
              onBlur={() => handleBlur('productName')}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="price" className="block text-sm font-medium text-gray-900">
            Price (INR)*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={values.price || ''}
              onChange={(e) => handleChange('price', e)}
              onFocus={() => handleFocus('price')}
              onBlur={() => handleBlur('price')}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="per" className="block text-sm font-medium text-gray-900">
            Per*
          </label>
          <div className="mt-2">
            <select
              id="per"
              required
              value={values.per || ''}
              onChange={(e) => handleChange('per', e)}
              onFocus={() => handleFocus('per')}
              onBlur={() => handleBlur('per')}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            >
              <option value="">Select</option>
              <option value="pieces">Pieces</option>
              <option value="box">Box</option>
              <option value="pkt">Pkt</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="discount" className="block text-sm font-medium text-gray-900">
            Discount (%)*
          </label>
          <div className="mt-2">
            <input
              type="number"
              id="discount"
              required
              min="0"
              max="100"
              step="0.01"
              value={values.discount || ''}
              onChange={(e) => handleChange('discount', e)}
              onFocus={() => handleFocus('discount')}
              onBlur={() => handleBlur('discount')}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
            />
          </div>
        </div>
        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            Description
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              rows="3"
              value={values.description || ''}
              onChange={(e) => handleChange('description', e)}
              onFocus={() => handleFocus('description')}
              onBlur={() => handleBlur('description')}
              className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
              placeholder="Enter product description"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="image" className="block text-sm font-medium text-gray-900">
            Image Upload
          </label>
          <div className="mt-2">
            <input
              type="file"
              id="image"
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/ogg"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <Logout/>
      <div className="flex-1 md:ml-64 p-6 pt-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 mb-6">Add Items</h2>
          {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
          {success && <div className="mb-4 text-green-600 text-sm text-center">{success}</div>}
          <form className="space-y-8" onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="border-b border-gray-900/10 pb-8">
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="new-product-type" className="block text-sm font-medium text-gray-900">
                    Create New Product Type
                  </label>
                  <div className="mt-2 flex gap-x-4">
                    <input
                      type="text"
                      id="new-product-type"
                      value={newProductType}
                      onChange={handleNewProductTypeChange}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                      placeholder="Enter product type name"
                    />
                    <button
                      type="button"
                      onClick={handleCreateProductType}
                      className="rounded-full w-8 h-7 flex justify-center items-center bg-black/50 cursor-pointer font-semibold text-white shadow-xs hover:bg-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50"
                    >
                      <FaPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="product-type" className="block text-sm font-medium text-gray-900">
                    Select Product Type
                  </label>
                  <div className="mt-2">
                    <select
                      id="product-type"
                      value={productType}
                      onChange={handleProductTypeChange}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                    >
                      <option value="">Select</option>
                      {productTypes.map(type => (
                        <option key={type} value={type}>
                          {formatProductTypeDisplay(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {productType ? (
              <>
                <div className="border-b border-gray-900/10 pb-8">
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    {renderFormFields()}
                  </div>
                </div>
                <div className="flex justify-end gap-x-6">
                  <button
                    type="button"
                    className="text-sm cursor-pointer font-semibold text-gray-900"
                    onClick={() => {
                      setValues({});setImages([]);setProductType('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md cursor-pointer bg-black/50 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center">
                <p className="text-lg text-center font-medium text-gray-900">
                  Please select or create a product type to add items
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}