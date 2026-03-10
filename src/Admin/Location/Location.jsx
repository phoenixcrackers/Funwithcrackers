import React, { useState, useEffect } from 'react';
import '../../App.css';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
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
      <p className="text-sm text-gray-400 font-medium">Loading locations…</p>
    </div>
  </div>
);

export default function Location() {
  const [states, setStates] = useState([]);
  const [newState, setNewState] = useState('');
  const [districts, setDistricts] = useState({});
  const [newDistrict, setNewDistrict] = useState({});
  const [minRates, setMinRates] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [addingState, setAddingState] = useState(false);
  const [deletingState, setDeletingState] = useState(null);
  const [addingDistrict, setAddingDistrict] = useState(null);
  const [deletingDistrict, setDeletingDistrict] = useState(null);
  const [savingRate, setSavingRate] = useState(null);

  // ── all original logic/API calls unchanged ────────────────────────────────

  useEffect(() => { fetchStates(); }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setStates(data);
      data.forEach(state => {
        fetchDistricts(state.name);
        setMinRates(prev => ({ ...prev, [state.name]: state.min_rate || '' }));
      });
    } catch (error) { console.error('Error fetching states:', error); }
    finally { setPageLoading(false); }
  };

  const fetchDistricts = async (stateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setDistricts(prev => ({ ...prev, [stateName]: data }));
    } catch (error) { console.error('Error fetching districts:', error); }
  };

  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newState.trim()) return;
    try {
      setAddingState(true);
      const response = await fetch(`${API_BASE_URL}/api/locations/states`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newState })
      });
      if (response.ok) { setNewState(''); fetchStates(); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { console.error('Error adding state:', error); }
    finally { setAddingState(false); }
  };

  const handleAddDistrict = async (e, stateName) => {
    e.preventDefault();
    if (!newDistrict[stateName]?.trim()) return;
    try {
      setAddingDistrict(stateName);
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newDistrict[stateName] })
      });
      if (response.ok) { setNewDistrict(prev => ({ ...prev, [stateName]: '' })); fetchDistricts(stateName); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { console.error('Error adding district:', error); }
    finally { setAddingDistrict(null); }
  };

  const handleUpdateRate = async (stateName, rate) => {
    try {
      setSavingRate(stateName);
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/rate`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rate: parseFloat(rate) || 0 })
      });
      if (response.ok) { setMinRates(prev => ({ ...prev, [stateName]: rate })); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { console.error('Error updating minimum rate:', error); }
    finally { setSavingRate(null); }
  };

  const handleDeleteState = async (stateName) => {
    try {
      setDeletingState(stateName);
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}`, { method: 'DELETE' });
      if (response.ok) {
        setDistricts(prev => { const n = { ...prev }; delete n[stateName]; return n; });
        setMinRates(prev => { const n = { ...prev }; delete n[stateName]; return n; });
        fetchStates();
      } else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { console.error('Error deleting state:', error); }
    finally { setDeletingState(null); }
  };

  const handleDeleteDistrict = async (stateName, districtId) => {
    try {
      setDeletingDistrict(districtId);
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts/${districtId}`, { method: 'DELETE' });
      if (response.ok) { fetchDistricts(stateName); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { console.error('Error deleting district:', error); }
    finally { setDeletingDistrict(null); }
  };

  // ── shared UI classes ─────────────────────────────────────────────────────
  const ic = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const btnPrimary = "h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2";
  const btnDark = "h-9 px-4 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2";

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="flex-1 hundred:ml-[15%] onefifty:ml-[15%] mobile:ml-0 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-3 border-b border-gray-200">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Settings</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Manage Locations</h1>
          </div>

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Add State */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4">Add New State</h2>
                <form onSubmit={handleAddState} className="flex gap-3 max-w-sm">
                  <input type="text" value={newState} onChange={(e) => setNewState(e.target.value)}
                    placeholder="Enter state name" className={ic} />
                  <button type="submit" disabled={addingState} className={`${btnDark} ${addingState ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {addingState ? <><Spinner />Adding…</> : 'Add'}
                  </button>
                </form>
              </div>

              {/* States Grid */}
              <div className="grid mobile:grid-cols-1 hundred:grid-cols-2 gap-5">
                {states.map((state) => (
                  <div key={state.name} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* State header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                      <h3 className="text-sm font-bold text-gray-800">{state.name}</h3>
                      <button
                        onClick={() => handleDeleteState(state.name)}
                        disabled={deletingState === state.name}
                        className={`text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${deletingState === state.name ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                      >
                        {deletingState === state.name ? <><Spinner color="text-gray-400" />Deleting…</> : 'Delete State'}
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Delivery Rate */}
                      <form onSubmit={(e) => { e.preventDefault(); handleUpdateRate(state.name, minRates[state.name]); }} className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">Delivery Rate</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 pointer-events-none">₹</span>
                            <input type="number" step="0.01" value={minRates[state.name] || ''}
                              onChange={(e) => setMinRates(prev => ({ ...prev, [state.name]: e.target.value }))}
                              placeholder="0.00" className={`${ic} pl-7`} />
                          </div>
                          <button type="submit" disabled={savingRate === state.name} className={`${btnPrimary} ${savingRate === state.name ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {savingRate === state.name ? <><Spinner />Saving…</> : 'Save'}
                          </button>
                        </div>
                      </form>

                      {/* Add District */}
                      <form onSubmit={(e) => handleAddDistrict(e, state.name)} className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">Add District</label>
                        <div className="flex gap-2">
                          <input type="text" value={newDistrict[state.name] || ''}
                            onChange={(e) => setNewDistrict(prev => ({ ...prev, [state.name]: e.target.value }))}
                            placeholder="District name" className={`${ic} flex-1`} />
                          <button type="submit" disabled={addingDistrict === state.name} className={`${btnDark} ${addingDistrict === state.name ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {addingDistrict === state.name ? <><Spinner />Adding…</> : 'Add'}
                          </button>
                        </div>
                      </form>

                      {/* Districts list */}
                      {districts[state.name]?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Districts</p>
                          <div className="flex flex-wrap gap-1.5">
                            {districts[state.name].map((district) => (
                              <div key={district.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 font-medium">
                                <span>{district.name}</span>
                                <button
                                  onClick={() => handleDeleteDistrict(state.name, district.id)}
                                  disabled={deletingDistrict === district.id}
                                  className={`font-bold leading-none transition-colors cursor-pointer ${deletingDistrict === district.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                                >
                                  {deletingDistrict === district.id ? <Spinner color="text-gray-400" /> : '×'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {states.length === 0 && (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 text-center">
                  <p className="text-sm text-gray-400 font-medium">No states added yet. Add one above.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}