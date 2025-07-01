import React, { useState, useEffect } from 'react';
import '../../App.css';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

export default function Location() {
  const [states, setStates] = useState([]);
  const [newState, setNewState] = useState('');
  const [districts, setDistricts] = useState({});
  const [newDistrict, setNewDistrict] = useState({});
  const [minRates, setMinRates] = useState({});

  // Fetch all states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch states from backend
  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setStates(data);
      data.forEach(state => {
        fetchDistricts(state.name);
        setMinRates(prev => ({ ...prev, [state.name]: state.min_rate || '' }));
      });
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  // Fetch districts for a specific state
  const fetchDistricts = async (stateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setDistricts(prev => ({ ...prev, [stateName]: data }));
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Handle state addition
  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newState.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newState })
      });
      if (response.ok) {
        setNewState('');
        fetchStates();
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding state:', error);
    }
  };

  // Handle district addition
  const handleAddDistrict = async (e, stateName) => {
    e.preventDefault();
    if (!newDistrict[stateName]?.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDistrict[stateName] })
      });
      if (response.ok) {
        setNewDistrict(prev => ({ ...prev, [stateName]: '' }));
        fetchDistricts(stateName);
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding district:', error);
    }
  };

  // Handle minimum rate
  const handleUpdateRate = async (stateName, rate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parseFloat(rate) || 0 })
      });
      if (response.ok) {
        setMinRates(prev => ({ ...prev, [stateName]: rate }));
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating minimum rate:', error);
    }
  };

  // Handle state deletion
  const handleDeleteState = async (stateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDistricts(prev => {
          const newDistricts = { ...prev };
          delete newDistricts[stateName];
          return newDistricts;
        });
        setMinRates(prev => {
          const newRates = { ...prev };
          delete newRates[stateName];
          return newRates;
        });
        fetchStates();
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting state:', error);
    }
  };

  // Handle district deletion
  const handleDeleteDistrict = async (stateName, districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts/${districtId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchDistricts(stateName);
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting district:', error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex justify-center p-6 hundred:ml-[15%] onefifty:ml-[15%] mobile:ml-[0%]">
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Manage Locations</h2>

          {/* Form to Add State */}
          <form onSubmit={handleAddState} className="mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                placeholder="Enter state name"
                className="border border-gray-300 rounded-lg p-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black/50 transition"
              >
                Add
              </button>
            </div>
          </form>

          {/* Display States in a Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {states.map((state) => (
              <div key={state.name} className="bg-white p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-700">{state.name}</h3>
                  <button
                    onClick={() => handleDeleteState(state.name)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    Delete State
                  </button>
                </div>

                {/* Form for Minimum Rate */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateRate(state.name, minRates[state.name]);
                  }}
                  className="mb-4 flex justify-center"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">₹</span>
                        <input
                            type="number"
                            step="0.01"
                            value={minRates[state.name] || ''}
                            onChange={(e) => setMinRates(prev => ({ ...prev, [state.name]: e.target.value }))}
                            placeholder="Delivery rate"
                            className="border border-gray-300 rounded-lg p-2 pl-8 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        </div>
                        <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                        >
                        Rate
                        </button>
                    </div>
                </form>

                {/* Chips Form for Districts */}
                <form onSubmit={(e) => handleAddDistrict(e, state.name)} className="mb-4 flex justify-center">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newDistrict[state.name] || ''}
                      onChange={(e) => setNewDistrict(prev => ({ ...prev, [state.name]: e.target.value }))}
                      placeholder="Add new district"
                      className="border border-gray-300 rounded-lg p-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>

                {/* Display Districts as Chips */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {districts[state.name]?.map((district) => (
                    <div
                      key={district.id}
                      className="flex items-center bg-blue-100 rounded-full px-3 py-1 text-sm text-blue-800"
                    >
                      <span>{district.name}</span>
                      <button
                        onClick={() => handleDeleteDistrict(state.name, district.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}