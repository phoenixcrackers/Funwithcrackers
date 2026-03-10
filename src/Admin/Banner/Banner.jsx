import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

const Spinner = ({ size = 'sm', color = 'text-gray' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" color="text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading banners…</p>
    </div>
  </div>
);

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewURLs, setPreviewURLs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/banners`);
      setBanners(res.data);
    } catch (err) { console.error('Failed to fetch banners:', err); }
    finally { setPageLoading(false); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setPreviewURLs(files.map(f => URL.createObjectURL(f)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      setDeletingId(id);
      await axios.delete(`${API_BASE_URL}/api/banners/${id}`); fetchBanners();
    }
    catch (err) { alert('Failed to delete banner'); }
    finally { setDeletingId(null); }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('images', f));
    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/api/banners/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelectedFiles([]); setPreviewURLs([]);
      document.querySelector('input[type="file"]').value = '';
      fetchBanners();
    } catch (err) { alert('Upload failed: ' + (err?.response?.data?.message || err.message)); }
    finally { setUploading(false); }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      await axios.patch(`${API_BASE_URL}/api/banners/${id}`, { is_active: !currentStatus }); fetchBanners();
    }
    catch (err) { console.error('Failed to update status:', err); }
    finally { setTogglingId(null); }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 flex-1 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-end justify-between pb-2 border-b border-gray-200">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Content</p>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">Manage Banners</h1>
            </div>
            <p className="text-xs text-gray-400 mb-0.5">{banners.length} banner{banners.length !== 1 ? 's' : ''}</p>
          </div>

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Upload card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <span className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </span>
                  <span className="text-sm font-bold text-gray-700">Upload Banner Images</span>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Select Images</label>
                    <input
                      type="file" multiple accept="image/*" onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all cursor-pointer"
                    />
                  </div>
                  {previewURLs.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {previewURLs.map((src, i) => (
                        <img key={i} src={src} alt={`preview-${i}`} className="h-20 w-auto rounded-lg border border-gray-200 object-cover shadow-sm" />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleUpload} disabled={uploading || !selectedFiles.length}
                    className={`flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-bold transition-all duration-150
                      ${uploading || !selectedFiles.length
                        ? 'bg-gray-100 text-gray-900 cursor-not-allowed border border-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                  >
                    {uploading ? (<><Spinner />Uploading…</>) : 'Upload Banners'}
                  </button>
                </div>
              </div>

              {/* Banner grid */}
              {banners.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 text-center">
                  <div className="text-3xl mb-3 opacity-30">🖼</div>
                  <p className="text-sm text-gray-400 font-medium">No banners uploaded yet</p>
                </div>
              ) : (
                <div className="grid hundred:grid-cols-3 mobile:grid-cols-1 gap-4">
                  {banners.map(banner => (
                    <div key={banner.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200">
                      <img
                        src={banner.image_url.startsWith('http') ? banner.image_url : `${API_BASE_URL}${banner.image_url}`}
                        alt="Banner"
                        className="w-full h-36 object-cover border-b border-gray-100"
                      />
                      <div className="px-4 py-3 flex justify-between items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border
                          ${banner.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                          {banner.is_active ? 'Visible' : 'Hidden'}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => toggleActive(banner.id, banner.is_active)}
                            disabled={togglingId === banner.id}
                            className={`h-7 px-3 rounded-md border text-[11px] font-semibold transition-all duration-150 flex items-center gap-1.5
                              ${togglingId === banner.id ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : banner.is_active
                                  ? 'bg-white text-red-500 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500'
                                  : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'}`}
                          >
                            {togglingId === banner.id ? <Spinner color="text-gray-400" /> : (banner.is_active ? 'Hide' : 'Show')}
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
                            disabled={deletingId === banner.id}
                            className={`h-7 px-3 rounded-md border text-[11px] font-semibold transition-all duration-150 flex items-center gap-1.5
                              ${deletingId === banner.id ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-red-500 hover:text-white hover:border-red-500'}`}
                          >
                            {deletingId === banner.id ? <Spinner color="text-gray-400" /> : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}