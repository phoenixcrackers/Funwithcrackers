import React, { useState } from 'react';
import '../../App.css';
import './Inventory.css';
import Sidebar from '../Sidebar/Sidebar';

export default function Inventory() {
  const [focused, setFocused] = useState({});
  const [values, setValues] = useState({});
  const [productType, setProductType] = useState('sparkles');

  const handleFocus = (inputId) => {
    setFocused((prev) => ({ ...prev, [inputId]: true }));
  };

  const handleBlur = (inputId) => {
    setFocused((prev) => ({ ...prev, [inputId]: values[inputId] !== '' }));
  };

  const handleChange = (inputId, event) => {
    setValues((prev) => ({ ...prev, [inputId]: event.target.value }));
  };

  const handleProductTypeChange = (event) => {
    setProductType(event.target.value);
    setValues({});
    setFocused({});
  };

  const renderFormFields = () => {
    switch (productType) {
      case 'sparkles':
        return (
          <>
            <div className="sm:col-span-3">
              <label
                htmlFor="serial-num-sparkles"
                className="block text-sm font-medium text-gray-900"
              >
                Serial Number*
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="serial-num-sparkles"
                  required
                  value={values.serialNumSparkles || ''}
                  onChange={(e) => handleChange('serialNumSparkles', e)}
                  onFocus={() => handleFocus('serialNumSparkles')}
                  onBlur={() => handleBlur('serialNumSparkles')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="sparkle-color"
                className="block text-sm font-medium text-gray-900"
              >
                Color
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="sparkle-color"
                  required
                  value={values.sparkleColor || ''}
                  onChange={(e) => handleChange('sparkleColor', e)}
                  onFocus={() => handleFocus('sparkleColor')}
                  onBlur={() => handleBlur('sparkleColor')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="sparkle-duration"
                className="block text-sm font-medium text-gray-900"
              >
                Duration (seconds)
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  id="sparkle-duration"
                  required
                  value={values.sparkleDuration || ''}
                  onChange={(e) => handleChange('sparkleDuration', e)}
                  onFocus={() => handleFocus('sparkleDuration')}
                  onBlur={() => handleBlur('sparkleDuration')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
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
                  value={values.serialNumChakras || ''}
                  onChange={(e) => handleChange('serialNumChakras', e)}
                  onFocus={() => handleFocus('serialNumChakras')}
                  onBlur={() => handleBlur('serialNumChakras')}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="chakra-pattern"
                className="block text-sm font-medium text-gray-900"
              >
                Pattern
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  id="chakra-pattern"
                  required
                  value={values.chakraPattern || ''}
                  onChange={(e) => handleChange('chakraPattern', e)}
                  onFocus={() => handleFocus('chakraPattern')}
                  onBlur={() => handleBlur('chakraPattern')}
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
    <div className="flex min-h-screen bg-gray-100 xs:bg-red-500 2xl:bg-green-300">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-6">
        <div className="max-w-4xl mx-auto justify-center">
          <h2 className="text-2xl text-center font-bold text-gray-900 mb-6">Add Items</h2>
          <form className="space-y-8">
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
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                    >
                      <option value="">Select</option>
                      <option value="sparkles">Sparkles</option>
                      <option value="rockets">Rockets</option>
                      <option value="ground-chakras">Ground Chakras</option>
                      <option value="flower-pots">Flower Pots</option>
                      <option value="shots">Shots</option>
                    </select>
                    <svg
                      className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b border-gray-900/10 pb-8">
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {renderFormFields()}
              </div>
            </div>
            <div className="flex justify-end gap-x-6">
              <button
                type="button"
                className="text-sm font-semibold text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}