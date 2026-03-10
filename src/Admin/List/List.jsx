import { useState, useEffect } from "react";
import Modal from "react-modal";
import Sidebar from "../Sidebar/Sidebar";
import "../../App.css";
import { API_BASE_URL } from "../../../Config";
import { FaEye, FaEdit, FaTrash, FaArrowLeft, FaArrowRight, FaExclamationTriangle } from "react-icons/fa";
import Logout from "../Logout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

Modal.setAppElement("#root");

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
      <p className="text-sm text-gray-400 font-medium">Loading…</p>
    </div>
  </div>
);

export default function List() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [productTypes, setProductTypes] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [rateChangeModalIsOpen, setRateChangeModalIsOpen] = useState(false);
  const [confirmRateChangeModalIsOpen, setConfirmRateChangeModalIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [error, setError] = useState("");
  const [discountWarning, setDiscountWarning] = useState("");
  const [toggleStates, setToggleStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rateChangeSearchQuery, setRateChangeSearchQuery] = useState("");
  const [editedRates, setEditedRates] = useState({});
  const [formData, setFormData] = useState({
    productname: "", serial_number: "", price: "", dprice: "", discount: "", per: "",
    product_type: "", description: "", box_count: 1, images: [], existingImages: [], imagesToDelete: [],
  });

  // ── loader states ─────────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const productsPerPage = 9;

  const fetchData = async (url, errorMsg, setter) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || errorMsg);
      setter(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProductTypes = () =>
    fetchData(`${API_BASE_URL}/api/product-types`, "Failed to fetch product types", (data) =>
      setProductTypes(data.filter((item) => item.product_type !== "gift_box_dealers").map((item) => item.product_type)),
    );

  const fetchProducts = () =>
    fetchData(`${API_BASE_URL}/api/products`, "Failed to fetch products", (data) => {
      const normalizedData = data.data
        .filter((product) => product.product_type !== "gift_box_dealers")
        .map((product) => ({
          ...product,
          images: product.image ? (typeof product.image === "string" ? JSON.parse(product.image) : product.image) : [],
          box_count: product.box_count || 1,
          dprice: product.dprice || "0",
        }))
        .sort((a, b) => a.serial_number.localeCompare(b.serial_number));
      setProducts(normalizedData);
      setToggleStates(
        normalizedData.reduce((acc, p) => ({
          ...acc,
          [`${p.product_type}-${p.id}`]: p.status === "on",
          [`fast-${p.product_type}-${p.id}`]: p.fast_running === true,
        }), {}),
      );
    });

  const applyFilters = (productsData, type, query, resetPage = true) => {
    let filtered = productsData;
    if (type !== "all") filtered = filtered.filter((p) => p.product_type === type);
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (p) => p.productname.toLowerCase().includes(lowerQuery) || p.serial_number.toLowerCase().includes(lowerQuery),
      );
    }
    setFilteredProducts(filtered);
    if (resetPage) {
      setCurrentPage(1);
    } else {
      const totalPages = Math.ceil(filtered.length / productsPerPage);
      if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }
  };

  const applyRateChangeFilter = () => {
    let filtered = products;
    if (rateChangeSearchQuery) {
      const lowerQuery = rateChangeSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.productname.toLowerCase().includes(lowerQuery) || p.serial_number.toLowerCase().includes(lowerQuery),
      );
    }
    return filtered;
  };

  const handleToggle = async (product, endpoint, keyPrefix) => {
    const productKey = `${keyPrefix}${product.product_type}-${product.id}`;
    const tableName = product.product_type.toLowerCase().replace(/\s+/g, "_");
    try {
      setToggleStates((prev) => ({ ...prev, [productKey]: !prev[productKey] }));
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/${endpoint}`, { method: "PATCH" });
      if (!response.ok) throw new Error(`Failed to toggle ${endpoint}`);
      fetchProducts();
    } catch (err) {
      setError(err.message);
      setToggleStates((prev) => ({ ...prev, [productKey]: prev[productKey] }));
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProductTypes(), fetchProducts()]);
      setPageLoading(false);
    };
    init();
    const intervalId = setInterval(() => { fetchProductTypes(); fetchProducts(); }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    applyFilters(products, filterType, searchQuery, filterType !== "all" || searchQuery !== "");
  }, [filterType, searchQuery]);

  useEffect(() => {
    applyFilters(products, filterType, searchQuery, false);
  }, [products]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    const validFiles = [];
    for (const file of files) {
      const fileType = file.type.toLowerCase();
      if (!allowedTypes.includes(fileType)) { setError("Only JPG, PNG, GIF images and MP4, WebM, Ogg videos are allowed"); return; }
      if (file.size > 5 * 1024 * 1024) { setError("Each file must be less than 5MB"); return; }
      validFiles.push(file);
    }
    setError("");
    setFormData((prev) => ({ ...prev, images: validFiles }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "discount") {
      const numValue = Number.parseFloat(value);
      if (value === "") {
        setDiscountWarning(""); setFormData((prev) => ({ ...prev, [name]: value }));
      } else if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        setDiscountWarning("Discount must be between 0 and 100%");
        setFormData((prev) => ({ ...prev, [name]: numValue < 0 ? "0" : "100" }));
      } else {
        setDiscountWarning(""); setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "price" || name === "dprice") {
      const numValue = Number.parseFloat(value);
      if (value === "") {
        setFormData((prev) => ({ ...prev, [name]: value }));
      } else if (isNaN(numValue) || numValue < 0) {
        setError(`${name === "price" ? "Price" : "Direct Customer Price"} must be a valid positive number`);
        setFormData((prev) => ({ ...prev, [name]: "0" }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e, isEdit) => {
    e.preventDefault();
    setDiscountWarning(""); setError("");
    if (!formData.productname.trim() || !formData.serial_number.trim() || !formData.price || !formData.dprice ||
      !formData.per || formData.discount === "" || !formData.product_type) {
      setError("Please fill in all required fields"); return;
    }
    const price = Number.parseFloat(formData.price);
    const dprice = Number.parseFloat(formData.dprice || 0);
    const discount = Number.parseFloat(formData.discount);
    if (isNaN(price) || price < 0) { setError("Price must be a valid positive number"); return; }
    if (isNaN(dprice) || dprice < 0) { setError("Direct Customer Price must be a valid positive number"); return; }
    if (isNaN(discount) || discount < 0 || discount > 100) { setError("Discount must be a valid number between 0 and 100%"); return; }
    if (formData.product_type === "gift_box_dealers") { setError('Product type "gift_box_dealers" is not allowed'); return; }
    const formDataToSend = new FormData();
    formDataToSend.append("productname", formData.productname);
    formDataToSend.append("serial_number", formData.serial_number);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("dprice", formData.dprice || "0");
    formDataToSend.append("per", formData.per);
    formDataToSend.append("discount", formData.discount);
    formDataToSend.append("description", formData.description || "");
    formDataToSend.append("product_type", formData.product_type);
    formDataToSend.append("box_count", Math.max(1, Number.parseInt(formData.box_count) || 1));
    if (isEdit) {
      const remainingExistingImages = formData.existingImages || [];
      if (remainingExistingImages.length > 0) formDataToSend.append("existingImages", JSON.stringify(remainingExistingImages));
      if (formData.imagesToDelete.length > 0) formDataToSend.append("imagesToDelete", JSON.stringify(formData.imagesToDelete));
      formData.images.forEach((file) => formDataToSend.append("images", file));
    } else {
      formData.images.forEach((file) => formDataToSend.append("images", file));
    }
    const url = isEdit
      ? `${API_BASE_URL}/api/products/${selectedProduct.product_type.toLowerCase().replace(/\s+/g, "_")}/${selectedProduct.id}`
      : `${API_BASE_URL}/api/products`;
    try {
      setSubmitLoading(true);
      const response = await fetch(url, { method: isEdit ? "PUT" : "POST", body: formDataToSend });
      const result = await response.json();
      if (!response.ok) { console.error("Server response:", result); throw new Error(result.message || `Failed to ${isEdit ? "update" : "add"} product`); }
      if (isEdit) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id && p.product_type === selectedProduct.product_type
              ? { ...p, productname: formData.productname, serial_number: formData.serial_number, price: formData.price, dprice: formData.dprice, discount: formData.discount, per: formData.per, description: formData.description, box_count: Math.max(1, Number.parseInt(formData.box_count) || 1), images: result.images || formData.existingImages.concat(formData.images) }
              : p,
          ),
        );
      } else {
        fetchProducts();
      }
      closeModal();
      e.target.reset();
      setFormData({ productname: "", serial_number: "", price: "", dprice: "", discount: "", per: "", product_type: "", description: "", box_count: 1, images: [], existingImages: [], imagesToDelete: [] });
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (product) => {
    try {
      setDeleteLoading(true);
      await fetch(`${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, "_")}/${product.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== product.id || p.product_type !== product.product_type));
      setDeleteModalIsOpen(false);
      setProductToDelete(null);
      const totalPages = Math.ceil((filteredProducts.length - 1) / productsPerPage);
      if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    } catch (err) {
      setError("Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (product) => { setProductToDelete(product); setDeleteModalIsOpen(true); };

  const closeModal = () => {
    setModalIsOpen(false); setEditModalIsOpen(false); setAddModalIsOpen(false);
    setDeleteModalIsOpen(false); setRateChangeModalIsOpen(false); setConfirmRateChangeModalIsOpen(false);
    setSelectedProduct(null); setProductToDelete(null); setEditedRates({});
    setRateChangeSearchQuery(""); setError(""); setDiscountWarning("");
    setFormData({ productname: "", serial_number: "", price: "", dprice: "", discount: "", per: "", product_type: "", description: "", box_count: 1, images: [], existingImages: [], imagesToDelete: [] });
  };

  const capitalize = (str) => str ? str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "";

  const downloadPDF = () => {
    if (!products.length || !productTypes.length) { setError("No products or product types available to export"); return; }
    setConfirmRateChangeModalIsOpen(true);
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yOffset = 20;
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("PHOENIX CRACKERS", pageWidth / 2, yOffset, { align: "center" }); yOffset += 8;
      doc.setFontSize(12); doc.setFont("helvetica", "normal");
      doc.text("Sivakasi", pageWidth / 2, yOffset, { align: "center" }); yOffset += 8;
      doc.text("Website: www.funwithcrackers.com", pageWidth / 2, yOffset, { align: "center" }); yOffset += 8;
      doc.text("Pricelist 2025", pageWidth / 2, yOffset, { align: "center" }); yOffset += 20;
      const tableData = [];
      let serialNumber = 1;
      let hasProducts = false;
      productTypes.forEach((type) => {
        const typeProducts = products.filter((product) => product.product_type === type).sort((a, b) => a.productname.localeCompare(b.productname));
        if (typeProducts.length > 0) {
          hasProducts = true;
          tableData.push([{ content: capitalize(type), colSpan: 8, styles: { fontStyle: "bold", halign: "left", fillColor: [200, 200, 200] } }]);
          tableData.push(["S.No", "Code", "Product", "Net Rate", "Direct Price", "Per", "Quantity"]);
          typeProducts.forEach((product) => {
            const productKey = `${product.product_type}-${product.id}`;
            let rate = editedRates[productKey]?.price ? Number.parseFloat(editedRates[productKey].price) : Number.parseFloat(product.net_rate || product.price || 0);
            let dprice = editedRates[productKey]?.dprice ? Number.parseFloat(editedRates[productKey].dprice) : Number.parseFloat(product.dprice || 0);
            if (editedRates[productKey] && (product.productname.toLowerCase() === "10*10" || product.productname.toLowerCase().endsWith("setout"))) {
              rate *= 5; dprice *= 5;
            }
            tableData.push([serialNumber++, product.serial_number, product.productname, `Rs.${Math.floor(rate)}`, `Rs.${Math.floor(dprice)}`, product.per, "", ""]);
          });
          tableData.push([]);
        }
      });
      if (!hasProducts) { setError("No products available to export"); return; }
      autoTable(doc, {
        startY: yOffset,
        head: [["S.No", "Code", "Product", "Net Rate", "Direct Price", "Per", "Quantity"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 15 }, 2: { cellWidth: 50 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 }, 5: { cellWidth: 20 }, 6: { cellWidth: 25 } },
        didDrawCell: (data) => { if (data.row.section === "body" && data.cell.raw && data.cell.raw.colSpan === 8) { data.cell.styles.cellPadding = 5; data.cell.styles.fontSize = 12; } },
      });
      doc.save("Pricelist_2025.pdf");
      closeModal();
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    }
  };

  const handleRateChangeSubmit = (e) => {
    e.preventDefault(); setError("");
    for (const productKey in editedRates) {
      const priceValue = Number.parseFloat(editedRates[productKey].price);
      const dpriceValue = Number.parseFloat(editedRates[productKey].dprice);
      if ((priceValue && (isNaN(priceValue) || priceValue < 0)) || (dpriceValue && (isNaN(dpriceValue) || dpriceValue < 0))) {
        setError(`Invalid rate or direct price for product ${productKey}. Please enter valid positive numbers.`); return;
      }
    }
    if (Object.keys(editedRates).length === 0) { setError("Please edit at least one product rate"); return; }
    generatePDF();
  };

  const handleRateChangeInput = (product, value, field) => {
    const productKey = `${product.product_type}-${product.id}`;
    if (value === "") {
      setEditedRates((prev) => {
        const newRates = { ...prev };
        if (newRates[productKey]) { delete newRates[productKey][field]; if (Object.keys(newRates[productKey]).length === 0) delete newRates[productKey]; }
        return newRates;
      });
    } else {
      setEditedRates((prev) => ({ ...prev, [productKey]: { ...prev[productKey], [field]: value } }));
    }
  };

  const clearAllRates = () => { setEditedRates({}); };

  const renderMedia = (media, idx, sizeClass) => {
    let src; let isVideo = false;
    if (media instanceof File) { src = URL.createObjectURL(media); isVideo = media.type.startsWith("video/"); }
    else if (typeof media === "string") { src = media; isVideo = media.includes("/video/"); }
    else return <span key={idx} className="text-gray-500 text-sm">Invalid media</span>;
    return isVideo ? (
      <video key={idx} src={src} controls className={`${sizeClass} object-cover rounded-lg`} onLoad={() => { if (media instanceof File) URL.revokeObjectURL(src); }} />
    ) : (
      <img key={idx} src={src || "/placeholder.svg"} alt={`media-${idx}`} className={`${sizeClass} object-cover rounded-lg`} onLoad={() => { if (media instanceof File) URL.revokeObjectURL(src); }} />
    );
  };

  const handleDeleteExistingImage = (indexToDelete) => {
    setFormData((prev) => ({ ...prev, existingImages: prev.existingImages.filter((_, index) => index !== indexToDelete), imagesToDelete: [...prev.imagesToDelete, indexToDelete] }));
  };

  const ic = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sc = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";
  const lc = "block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1";
  const btnPrimary = "h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer";
  const btnGhost = "h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-all cursor-pointer";
  const btnRed = "h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer";

  const renderRateChangeModal = () => (
    <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-2xl">
      <h2 className="text-base font-bold text-gray-800 mb-4 text-center">Change Product Rates</h2>
      <form onSubmit={handleRateChangeSubmit}>
        <div className="space-y-4">
          <div>
            <label className={lc}>Search Product</label>
            <input type="text" value={rateChangeSearchQuery} onChange={(e) => setRateChangeSearchQuery(e.target.value)}
              placeholder="Search by name or serial number" className={ic} />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
            {applyRateChangeFilter().length > 0 ? (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    {["Product Name", "Serial Number", "Net Rate", "Direct Customer Price"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applyRateChangeFilter().map((product) => {
                    const productKey = `${product.product_type}-${product.id}`;
                    const defaultRate = Number.parseFloat(product.net_rate || product.price || 0).toFixed(2);
                    const defaultDPrice = Number.parseFloat(product.dprice || 0).toFixed(2);
                    return (
                      <tr key={productKey} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-sm text-gray-800 font-medium">{product.productname}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{product.serial_number}</td>
                        <td className="px-4 py-2">
                          <input type="number" value={editedRates[productKey]?.price ?? defaultRate}
                            onChange={(e) => handleRateChangeInput(product, e.target.value, "price")}
                            className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" step="0.01" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={editedRates[productKey]?.dprice ?? defaultDPrice}
                            onChange={(e) => handleRateChangeInput(product, e.target.value, "dprice")}
                            className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" step="0.01" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No products found</p>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={clearAllRates} className={btnRed}>Clear All</button>
            <button type="button" onClick={closeModal} className={btnGhost}>Cancel</button>
            <button type="submit" className={btnPrimary}>Save</button>
          </div>
        </div>
      </form>
    </div>
  );

  const renderModalForm = (isEdit) => (
    <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-screen overflow-y-auto">
      <h2 className="text-base font-bold text-gray-800 mb-5 text-center">{isEdit ? "Edit Product" : "Add Product"}</h2>
      <form onSubmit={(e) => handleSubmit(e, isEdit)}>
        <div className="space-y-4">
          {!isEdit && (
            <div>
              <label className={lc}>Product Type</label>
              <select name="product_type" value={formData.product_type} onChange={handleInputChange} className={sc} required>
                <option value="">Select Product Type</option>
                {productTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Product Name", name: "productname", type: "text" },
              { label: "Serial Number", name: "serial_number", type: "text" },
              { label: "Price", name: "price", type: "number", step: "0.01" },
              { label: "Direct Customer Price", name: "dprice", type: "number", step: "0.01" },
              { label: "Discount (%)", name: "discount", type: "number", step: "0.01", min: "0", max: "100" },
            ].map(({ label, name, type, step, min, max }) => (
              <div key={name}>
                <label className={lc}>{label}</label>
                <input type={type} name={name} value={formData[name]} onChange={handleInputChange}
                  className={ic} required step={step} min={min} max={max} />
                {name === "discount" && discountWarning && <p className="mt-1 text-xs text-red-500">{discountWarning}</p>}
              </div>
            ))}
            <div>
              <label className={lc}>Per</label>
              <select name="per" value={formData.per} onChange={handleInputChange} className={sc} required>
                <option value="">Select Unit</option>
                {["pieces", "box", "pkt"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Box Count</label>
              <input type="number" name="box_count" value={formData.box_count} onChange={handleInputChange}
                className={ic} required min="1" />
            </div>
          </div>
          <div>
            <label className={lc}>{isEdit ? "Manage Images" : "Images"}</label>
            <input type="file" name="images" multiple onChange={handleImageChange}
              accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg"
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer" />
            {isEdit && formData.existingImages.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Current images (click × to delete):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.existingImages.map((file, idx) => (
                    <div key={idx} className="relative">
                      {renderMedia(file, idx, "h-20 w-20")}
                      <button type="button" onClick={() => handleDeleteExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formData.images.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">New images:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((file, idx) => (
                    <div key={idx} className="relative">
                      {renderMedia(file, idx, "h-20 w-20")}
                      <button type="button" onClick={() => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, index) => index !== idx) }))}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal} className={btnGhost}>Cancel</button>
            <button type="submit" disabled={submitLoading}
              className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors ${submitLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {submitLoading ? <><Spinner />{isEdit ? 'Saving…' : 'Adding…'}</> : (isEdit ? 'Save' : 'Add')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const { indexOfFirstProduct, indexOfLastProduct } = {
    indexOfFirstProduct: currentPage * productsPerPage - productsPerPage,
    indexOfLastProduct: currentPage * productsPerPage,
  };
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const Toggle = ({ checked, onChange, color }) => (
    <label className="inline-flex items-center cursor-pointer" onClick={onChange}>
      <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${checked ? color : "bg-gray-300"}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </label>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="flex-1 hundred:ml-0 mobile:p-4 hundred:px-8 pt-8 pb-16 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-3 border-b border-gray-200">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Catalogue</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">List Products</h1>
          </div>

          {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Filters + Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Filter by Type</label>
                    <select id="product-type-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)} className={sc + " w-44"}>
                      <option value="all">All</option>
                      {productTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Search</label>
                    <input id="search-filter" type="text" placeholder="Name or serial number" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)} className={ic + " w-52"} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddModalIsOpen(true)} className={btnPrimary}>Add Product</button>
                  <button onClick={downloadPDF} className="h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all cursor-pointer">Pricelist 2025</button>
                </div>
              </div>

              {/* Product Grid */}
              {currentProducts.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 text-center">
                  <p className="text-sm text-gray-400 font-medium">No products found</p>
                </div>
              ) : (
                <div className="grid onefifty:grid-cols-3 hundred:grid-cols-3 mobile:grid-cols-1 gap-5">
                  {currentProducts.map((product) => {
                    const productKey = `${product.product_type}-${product.id}`;
                    return (
                      <div key={productKey} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-800 truncate">{product.productname}</h3>
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">{capitalize(product.product_type)}</p>
                            <p className="text-xs text-gray-400">S/N: {product.serial_number}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {product.images.length > 0 ? (
                              product.images.map((media, idx) => renderMedia(media, idx, "h-16 w-16 mobile:h-12 mobile:w-12"))
                            ) : (
                              <span className="text-xs text-gray-400">No media</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <span className="text-gray-500">Price: <span className="font-semibold text-gray-700">₹{Number.parseFloat(product.price).toFixed(2)}</span></span>
                            <span className="text-gray-500">Direct: <span className="font-semibold text-gray-700">₹{Number.parseFloat(product.dprice).toFixed(2)}</span></span>
                            <span className="text-gray-500">Per: <span className="font-semibold text-gray-700">{product.per}</span></span>
                            <span className="text-gray-500">Disc: <span className="font-semibold text-gray-700">{Number.parseFloat(product.discount).toFixed(2)}%</span></span>
                            <span className="text-gray-500">Box: <span className="font-semibold text-gray-700">{product.box_count}</span></span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Status:</span>
                              <label className="inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={toggleStates[productKey]} onChange={() => handleToggle(product, "toggle-status", "")} />
                                <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${toggleStates[productKey] ? "bg-emerald-500" : "bg-red-400"}`}>
                                  <div className={`absolute top-0.25 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ${toggleStates[productKey] ? "translate-x-4" : "translate-x-0.5"}`} />
                                </div>
                              </label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Fast:</span>
                              <label className="inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={toggleStates[`fast-${productKey}`]} onChange={() => handleToggle(product, "toggle-fast-running", "fast-")} />
                                <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${toggleStates[`fast-${productKey}`] ? "bg-blue-500" : "bg-gray-300"}`}>
                                  <div className={`absolute top-0.25 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ${toggleStates[`fast-${productKey}`] ? "translate-x-4" : "translate-x-0.5"}`} />
                                </div>
                              </label>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1 border-t border-gray-100">
                            <button onClick={() => { setSelectedProduct(product); setModalIsOpen(true); }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors">
                              <FaEye className="h-3 w-3" /> View
                            </button>
                            <button onClick={() => {
                              setSelectedProduct(product);
                              setFormData({ productname: product.productname, serial_number: product.serial_number, price: product.price, dprice: product.dprice, discount: product.discount, per: product.per, product_type: product.product_type, description: product.description || "", box_count: product.box_count, images: [], existingImages: product.images || [], imagesToDelete: [] });
                              setEditModalIsOpen(true);
                            }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition-colors">
                              <FaEdit className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={() => openDeleteModal(product)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors">
                              <FaTrash className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3">
                  <button onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${currentPage === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <FaArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <FaArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm">
        {selectedProduct && (
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-screen overflow-y-auto">
            <h2 className="text-base font-bold text-gray-800 mb-4 text-center">Product Details</h2>
            <div className="space-y-4">
              <div className="flex justify-center flex-wrap gap-2">
                {selectedProduct.images.length > 0 ? selectedProduct.images.map((media, idx) => renderMedia(media, idx, "h-24 w-24")) : <span className="text-gray-400 text-sm">No media</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["product_type", "serial_number", "productname", "price", "dprice", "per", "discount", "box_count", "status", "description"].map((field) => (
                  <div key={field} className={field === "description" ? "col-span-2" : ""}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{capitalize(field.replace("_", " "))}</span>
                    <p className="text-sm text-gray-800 font-medium mt-0.5">
                      {field === "price" || field === "dprice" ? `₹${Number.parseFloat(selectedProduct[field]).toFixed(2)}`
                        : field === "discount" ? `${Number.parseFloat(selectedProduct[field]).toFixed(2)}%`
                        : field === "description" ? selectedProduct[field] || "—"
                        : capitalize(String(selectedProduct[field]))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={closeModal} className={btnGhost}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalIsOpen} onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm">
        {renderModalForm(true)}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addModalIsOpen} onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm">
        {renderModalForm(false)}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalIsOpen} onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-500 h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Delete Product?</h2>
          <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(productToDelete)} disabled={deleteLoading}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors ${deleteLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}>
              {deleteLoading ? <><Spinner />Deleting…</> : 'Yes, Delete'}
            </button>
            <button onClick={closeModal} className={`flex-1 ${btnGhost}`}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Confirm Rate Change Modal */}
      <Modal isOpen={confirmRateChangeModalIsOpen} onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-blue-500 h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Change Product Rates?</h2>
          <p className="text-sm text-gray-500 mb-6">Would you like to update rates before downloading the pricelist?</p>
          <div className="flex gap-3">
            <button onClick={() => { setConfirmRateChangeModalIsOpen(false); setRateChangeModalIsOpen(true); }} className={`flex-1 ${btnPrimary}`}>Yes</button>
            <button onClick={() => { setConfirmRateChangeModalIsOpen(false); generatePDF(); }} className={`flex-1 ${btnGhost}`}>No</button>
          </div>
        </div>
      </Modal>

      {/* Rate Change Modal */}
      <Modal isOpen={rateChangeModalIsOpen} onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm">
        {renderRateChangeModal()}
      </Modal>
    </div>
  );
}