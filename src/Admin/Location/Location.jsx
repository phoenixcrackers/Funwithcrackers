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

  const styles = {
    input: { 
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", 
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", 
      border: "1px solid rgba(2,132,199,0.3)", 
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 flex justify-center p-6 hundred:ml-[15%] onefifty:ml-[15%] mobile:ml-[0%]">
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">Manage Locations</h2>
          <form onSubmit={handleAddState} className="mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="Enter state name"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500"
                  style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                />
              </div>
              <button
                type="submit"
                className="text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition cursor-pointer"
                style={{ background: styles.button.background.replace('2,132,199', '31,41,55').replace('14,165,233', '55,65,81'), backgroundDark: styles.button.backgroundDark.replace('59,130,246', '75,85,99').replace('37,99,235', '55,65,81'), border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
              >
                Add
              </button>
            </div>
          </form>
          <div className="grid mobile:grid-cols-1 hundred:grid-cols-2 gap-6">
            {states.map((state) => (
              <div key={state.name} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{state.name}</h3>
                  <button
                    onClick={() => handleDeleteState(state.name)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold"
                  >
                    Delete State
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateRate(state.name, minRates[state.name]);
                  }}
                  className="mb-4 flex justify-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={minRates[state.name] || ''}
                        onChange={(e) => setMinRates(prev => ({ ...prev, [state.name]: e.target.value }))}
                        placeholder="Delivery rate"
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 pl-8 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500"
                        style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-blue-600 transition cursor-pointer"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      Rate
                    </button>
                  </div>
                </form>
                <form onSubmit={(e) => handleAddDistrict(e, state.name)} className="mb-4 flex justify-center">
                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={newDistrict[state.name] || ''}
                        onChange={(e) => setNewDistrict(prev => ({ ...prev, [state.name]: e.target.value }))}
                        placeholder="Add new district"
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-blue-500"
                        style={{ background: styles.input.background, backgroundDark: styles.input.backgroundDark, border: styles.input.border, borderDark: styles.input.borderDark, backdropFilter: styles.input.backdropFilter }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition cursor-pointer"
                      style={{ background: styles.button.background.replace('2,132,199', '31,41,55').replace('14,165,233', '55,65,81'), backgroundDark: styles.button.backgroundDark.replace('59,130,246', '75,85,99').replace('37,99,235', '55,65,81'), border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      Save
                    </button>
                  </div>
                </form>
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {districts[state.name]?.map((district) => (
                    <div
                      key={district.id}
                      className="flex items-center bg-indigo-100 dark:bg-indigo-900 rounded-full px-3 py-1 text-sm text-indigo-800 dark:text-indigo-200"
                    >
                      <span>{district.name}</span>
                      <button
                        onClick={() => handleDeleteDistrict(state.name, district.id)}
                        className="ml-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
      <style>{`
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