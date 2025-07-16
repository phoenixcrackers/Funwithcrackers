import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewURLs, setPreviewURLs] = useState([]);
  const [uploading, setUploading] = useState(false);

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
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/banners`);
      setBanners(res.data);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewURLs(previews);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/banners/${id}`);
      fetchBanners();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete banner');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('images', file));

    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/api/banners/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFiles([]);
      setPreviewURLs([]);
      document.querySelector('input[type="file"]').value = ''; // Clear input
      fetchBanners();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/banners/${id}`, {
        is_active: !currentStatus,
      });
      fetchBanners();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="p-6 w-full justify-center">
        <h2 className="text-3xl text-center font-bold mb-6 text-gray-900 dark:text-gray-100">Manage Banners</h2>

        {/* Upload Section */}
        <div className="mb-10 bg-white dark:bg-gray-900 p-6 rounded-lg shadow mx-auto max-w-2xl onefifty:ml-[25%]">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Upload Banner Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="mb-4 text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-gray-700 file:text-indigo-600 dark:file:text-gray-200 hover:file:bg-indigo-100 dark:hover:file:bg-gray-600"
          />
          {previewURLs.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4 justify-center">
              {previewURLs.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Preview ${index}`}
                  className="h-24 w-auto rounded border border-gray-300 dark:border-gray-600 shadow"
                />
              ))}
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-5 py-2 rounded text-white dark:text-gray-100 font-semibold ${
              uploading ? 'bg-gray-500 dark:bg-gray-700 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
            style={uploading ? {} : { background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Banner List */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mobile:grid-cols-1 justify-items-center mx-auto max-w-7xl onefifty:ml-[25%]">
          {banners.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No banners uploaded yet.</p>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-3">
                <img
                  src={banner.image_url.startsWith('http') ? banner.image_url : `${API_BASE_URL}${banner.image_url}`}
                  alt="Banner"
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      banner.is_active
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'
                    }`}
                  >
                    {banner.is_active ? 'Visible' : 'Hidden'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(banner.id, banner.is_active)}
                      className={`text-xs px-3 py-1 rounded text-white dark:text-gray-100 font-semibold ${
                        banner.is_active ? 'bg-red-500 dark:bg-red-600' : 'bg-green-500 dark:bg-green-600'
                      } hover:bg-opacity-80 dark:hover:bg-opacity-80`}
                    >
                      {banner.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="text-xs px-3 py-1 rounded text-white dark:text-gray-100 font-semibold hover:bg-gray-700 dark:hover:bg-gray-600"
                      style={{ background: styles.button.background, backgroundDark: styles.button.backgroundDark, border: styles.button.border, borderDark: styles.button.borderDark, boxShadow: styles.button.boxShadow, boxShadowDark: styles.button.boxShadowDark }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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