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
    fetchBanners(); // Refresh banner list
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
      fetchBanners();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err?.response?.data?.message || err.message);
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
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <Logout />
    <div className="p-6 w-full justify-center">
      <h2 className="text-3xl text-center font-bold mb-6">Manage Banners</h2>

      {/* Upload Section */}
      <div className="mb-10 bg-white p-6 rounded-lg shadow mx-auto max-w-2xl onefifty:ml-[25%]">
        <label className="block text-sm font-medium mb-2">Upload Banner Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        {previewURLs.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 justify-center">
            {previewURLs.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Preview ${index}`}
                className="h-24 w-auto rounded border shadow"
              />
            ))}
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`px-5 py-2 rounded text-white ${
            uploading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* Banner List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mobile:grid-cols-1 justify-items-center mx-auto max-w-7xl onefifty:ml-[25%]">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white border rounded-lg shadow p-3">
            <img
              src={`${API_BASE_URL}${banner.image_url}`}
              alt="Banner"
              className="w-full h-32 object-cover rounded mb-2"
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  banner.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {banner.is_active ? 'Visible' : 'Hidden'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(banner.id, banner.is_active)}
                  className={`text-xs px-3 py-1 rounded ${
                    banner.is_active ? 'bg-red-500' : 'bg-green-500'
                  } text-white`}
                >
                  {banner.is_active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="text-xs px-3 py-1 rounded bg-gray-600 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
}