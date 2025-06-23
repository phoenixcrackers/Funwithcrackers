import React, { useState } from 'react'
import '../../App.css'
import Sidebar from '../Sidebar/Sidebar'

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
    setValues({}); // Reset form values when product type changes
    setFocused({}); // Reset focus states
  };

  const renderFormFields = () => {
    switch (productType) {
      case 'sparkles':
        return (
          <>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="serial-num-sparkles"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.serialNumSparkles || values.serialNumSparkles
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Serial num*
              </label>
              <input
                type="text"
                id="serial-num-sparkles"
                required
                value={values.serialNumSparkles || ''}
                onChange={(e) => handleChange('serialNumSparkles', e)}
                onFocus={() => handleFocus('serialNumSparkles')}
                onBlur={() => handleBlur('serialNumSparkles')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.serialNumSparkles ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="sparkle-color"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.sparkleColor || values.sparkleColor
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Color
              </label>
              <input
                type="text"
                id="sparkle-color"
                required
                value={values.sparkleColor || ''}
                onChange={(e) => handleChange('sparkleColor', e)}
                onFocus={() => handleFocus('sparkleColor')}
                onBlur={() => handleBlur('sparkleColor')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.sparkleColor ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="sparkle-duration"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.sparkleDuration || values.sparkleDuration
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Duration (seconds)
              </label>
              <input
                type="number"
                id="sparkle-duration"
                required
                value={values.sparkleDuration || ''}
                onChange={(e) => handleChange('sparkleDuration', e)}
                onFocus={() => handleFocus('sparkleDuration')}
                onBlur={() => handleBlur('sparkleDuration')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.sparkleDuration ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
          </>
        );
      case 'rockets':
        return (
          <>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="serial-num-rockets"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.serialNumRockets || values.serialNumRockets
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Serial num*
              </label>
              <input
                type="text"
                id="serial-num-rockets"
                required
                value={values.serialNumRockets || ''}
                onChange={(e) => handleChange('serialNumRockets', e)}
                onFocus={() => handleFocus('serialNumRockets')}
                onBlur={() => handleBlur('serialNumRockets')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.serialNumRockets ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="rocket-height"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.rocketHeight || values.rocketHeight
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Max Height (meters)
              </label>
              <input
                type="number"
                id="rocket-height"
                required
                value={values.rocketHeight || ''}
                onChange={(e) => handleChange('rocketHeight', e)}
                onFocus={() => handleFocus('rocketHeight')}
                onBlur={() => handleBlur('rocketHeight')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.rocketHeight ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
          </>
        );
      case 'ground-chakras':
        return (
          <>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="serial-num-chakras"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.serialNumChakras || values.serialNumChakras
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Serial num*
              </label>
              <input
                type="text"
                id="serial-num-chakras"
                required
                value={values.serialNumChakras || ''}
                onChange={(e) => handleChange('serialNumChakras', e)}
                onFocus={() => handleFocus('serialNumChakras')}
                onBlur={() => handleBlur('serialNumChakras')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.serialNumChakras ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="chakra-pattern"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.chakraPattern || values.chakraPattern
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Pattern
              </label>
              <input
                type="text"
                id="chakra-pattern"
                required
                value={values.chakraPattern || ''}
                onChange={(e) => handleChange('chakraPattern', e)}
                onFocus={() => handleFocus('chakraPattern')}
                onBlur={() => handleBlur('chakraPattern')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.chakraPattern ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
          </>
        );
      case 'flower-pots':
        return (
          <>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="serial-num-flower"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.serialNumFlower || values.serialNumFlower
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Serial num*
              </label>
              <input
                type="text"
                id="serial-num-flower"
                required
                value={values.serialNumFlower || ''}
                onChange={(e) => handleChange('serialNumFlower', e)}
                onFocus={() => handleFocus('serialNumFlower')}
                onBlur={() => handleBlur('serialNumFlower')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.serialNumFlower ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="flower-size"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.flowerSize || values.flowerSize
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Size (cm)
              </label>
              <input
                type="number"
                id="flower-size"
                required
                value={values.flowerSize || ''}
                onChange={(e) => handleChange('flowerSize', e)}
                onFocus={() => handleFocus('flowerSize')}
                onBlur={() => handleBlur('flowerSize')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.flowerSize ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
          </>
        );
      case 'shots':
        return (
          <>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="serial-num-shots"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.serialNumShots || values.serialNumShots
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Serial num*
              </label>
              <input
                type="text"
                id="serial-num-shots"
                required
                value={values.serialNumShots || ''}
                onChange={(e) => handleChange('serialNumShots', e)}
                onFocus={() => handleFocus('serialNumShots')}
                onBlur={() => handleBlur('serialNumShots')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.serialNumShots ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
            <div className='flex justify-center items-center relative'>
              <label
                htmlFor="shot-count"
                className={`absolute left-1 transition-all duration-200 ${
                  focused.shotCount || values.shotCount
                    ? 'top-0 text-sm -translate-y-2 text-blue-400'
                    : 'top-1/2 text-base -translate-y-1/2 text-white'
                }`}
              >
                Shot Count
              </label>
              <input
                type="number"
                id="shot-count"
                required
                value={values.shotCount || ''}
                onChange={(e) => handleChange('shotCount', e)}
                onFocus={() => handleFocus('shotCount')}
                onBlur={() => handleBlur('shotCount')}
                className={`w-full sm:w-[50ch] m-1 p-2 bg-gray-800 text-white border-b-2 ${
                  focused.shotCount ? 'border-blue-400' : 'border-white'
                } focus:outline-none transition-colors duration-200`}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Sidebar />
      <div className='flex flex-col items-center min-h-screen'>
        <p className='font-bold text-3xl mt-10 mb-6'>Add Items</p>
        <div className='w-full max-w-4xl mb-6'>
          <select
            value={productType}
            onChange={handleProductTypeChange}
            className='w-full sm:w-[50ch] p-2 bg-gray-800 text-white border-2 border-white rounded-md focus:outline-none focus:border-blue-400 transition-colors duration-200'
          >
            <option value="sparkles">Sparkles</option>
            <option value="rockets">Rockets</option>
            <option value="ground-chakras">Ground Chakras</option>
            <option value="flower-pots">Flower Pots</option>
            <option value="shots">Shots</option>
          </select>
        </div>
        <form className='grid grid-cols-1 sm:grid-cols-2 bg-gray-800 gap-4 w-full max-w-4xl justify-center rounded-lg p-4 sm:p-5'>
          {renderFormFields()}
        </form>
      </div>
    </div>
  );
}