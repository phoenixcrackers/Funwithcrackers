import React, { useState } from 'react';
import '../../App.css';
import Sidebar from '../Sidebar/Sidebar';

export default function Inventory() {
  const [focused, setFocused] = useState({});
  const [values, setValues] = useState({});
  const [productType, setProductType] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setImage(event.target.files[0]);
  };

  const handleProductTypeChange = (event) => {
    setProductType(event.target.value);
    setValues({});
    setFocused({});
    setImage(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('serial_number', values.serialNum || '');
    formData.append('product_name', values.productName || '');
    formData.append('price', values.price || '');
    formData.append('discount', values.discount || '');
    formData.append('product_type', productType);
    if (productType === 'ground-chakras') {
      formData.append('per', values.per || '');
    }
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save product');
      }

      setSuccess('Product saved successfully!');
      setValues({});
      setImage(null);
      event.target.reset();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderFormFields = () => {
    switch (productType) {
      case 'sparklers':
        return (
          <>
            <div className="sm:col-span-3">
              <label
                htmlFor="serial-num-sparklers"
                className="block text-sm font-medium text-gray-900"
              >
                Serial Number*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="serial-num-sparklers"
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
              <label
                htmlFor="product-name"
                className="block text-sm font-medium text-gray-900"
              >
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
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-900"
              >
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
              <label
                htmlFor="discount"
                className="block text-sm font-medium text-gray-900"
              >
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
            <div className="sm:col-span-3">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-900"
              >
                Image Upload*
              </label>
              <div className="mt-2">
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>
            </div>
          </>
        );
      case 'ground-chakras':
        return (
          <>
            <div className="sm:col-span-3">
              <label
                htmlFor="serial-num-chakras"
                className="block text-sm font-medium text-gray-900"
              >
                Serial Number*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="serial-num-chakras"
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
              <label
                htmlFor="product-name"
                className="block text-sm font-medium text-gray-900"
              >
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
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-900"
              >
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
              <label
                htmlFor="per"
                className="block text-sm font-medium text-gray-900"
              >
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
                </select>
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="discount"
                className="block text-sm font-medium text-gray-900"
              >
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
            <div className="sm:col-span-3">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-900"
              >
                Image Upload
              </label>
              <div className="mt-2">
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>
            </div>
          </>
        );
      case 'rockets':
        return (
          <>
            <div className="sm:col-span-3">
              <label
                htmlFor="serial-num-rockets"
                className="block text-sm font-medium text-gray-900"
              >
                Serial Number*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="serial-num-rockets"
                  required
                  value={values.serialNumRockets || ''}
                  onChange={(e) => handleChange('serialNumRockets', e)}
                  onFocus={() => handleFocus('serialNumRockets')}
                  onBlur={() => handleBlur('serialNumRockets')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="rocket-height"
                className="block text-sm font-medium text-gray-900"
              >
                Max Height (meters)
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="rocket-height"
                  required
                  value={values.rocketHeight || ''}
                  onChange={(e) => handleChange('rocketHeight', e)}
                  onFocus={() => handleFocus('rocketHeight')}
                  onBlur={() => handleBlur('rocketHeight')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
          </>
        );
      case 'flower-pots':
        return (
          <>
            <div className="sm:col-span-3">
              <label
                htmlFor="serial-num-flower"
                className="block text-sm font-medium text-gray-900"
              >
                Serial Number*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="serial-num-flower"
                  required
                  value={values.serialNumFlower || ''}
                  onChange={(e) => handleChange('serialNumFlower', e)}
                  onFocus={() => handleFocus('serialNumFlower')}
                  onBlur={() => handleBlur('serialNumFlower')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="flower-size"
                className="block text-sm font-medium text-gray-900"
              >
                Size (cm)
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="flower-size"
                  required
                  value={values.flowerSize || ''}
                  onChange={(e) => handleChange('flowerSize', e)}
                  onFocus={() => handleFocus('flowerSize')}
                  onBlur={() => handleBlur('flowerSize')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
          </>
        );
      case 'shots':
        return (
          <>
            <div className="sm:col-span-3">
              <label
                htmlFor="serial-num-shots"
                className="block text-sm font-medium text-gray-900"
              >
                Serial Number*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="serial-num-shots"
                  required
                  value={values.serialNumShots || ''}
                  onChange={(e) => handleChange('serialNumShots', e)}
                  onFocus={() => handleFocus('serialNumShots')}
                  onBlur={() => handleBlur('serialNumShots')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="shot-count"
                className="block text-sm font-medium text-gray-900"
              >
                Shot Count
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="shot-count"
                  required
                  value={values.shotCount || ''}
                  onChange={(e) => handleChange('shotCount', e)}
                  onFocus={() => handleFocus('shotCount')}
                  onBlur={() => handleBlur('shotCount')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 mb-6">Add Items</h2>
          {error && (
            <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="mb-4 text-green-600 text-sm text-center">{success}</div>
          )}
          <form className="space-y-8" onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="border-b border-gray-900/10 pb-8">
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="product-type"
                    className="block text-sm font-medium text-gray-900"
                  >
                    Product Type
                  </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="product-type"
                      value={productType}
                      onChange={handleProductTypeChange}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                    >
                      <option value="">Select</option>
                      <option value="sparklers">Sparklers</option>
                      <option value="ground-chakras">Ground Chakras</option>
                      <option value="rockets">Rockets</option>
                      <option value="flower-pots">Flower Pots</option>
                      <option value="shots">Shots</option>
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
                    className="text-sm font-semibold text-gray-900"
                    onClick={() => {
                      setValues({});
                      setImage(null);
                      setProductType('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-black/50 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center">
                <p className="text-lg text-center font-medium text-gray-900">
                  Please select product type to add items
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}