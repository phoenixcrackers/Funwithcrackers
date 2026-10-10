import { useState, useEffect } from "react";
import Modal from "react-modal";
import Sidebar from "../Sidebar/Sidebar";
import "../../App.css";
import { API_BASE_URL } from "../../../Config";
import { FaEye, FaEdit, FaTrash, FaArrowLeft, FaArrowRight, FaExclamationTriangle, FaDownload, FaUpload, FaFileArchive, FaCheckCircle, FaTimesCircle, FaCheck, FaTimes, FaSearch, FaImages } from "react-icons/fa";
import Logout from "../Logout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTamilName, ensureTamilFont, renderTamilTextToDataURL, splitTamilText } from "../../utils/tamilTranslation";
import { downloadSingleImage, generateProductImageZip, extractImagesFromZip, matchImagesToProducts, uploadSingleProductImage } from "../../utils/productImageSync";

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

  // ── Download Images state ──────────────────────────────────────────────────
  const [downloadModalIsOpen, setDownloadModalIsOpen] = useState(false);
  const [downloadScope, setDownloadScope] = useState("all");
  const [downloadNaming, setDownloadNaming] = useState("name");
  const [downloadIncludeCsv, setDownloadIncludeCsv] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({
    active: false, current: 0, total: 0, status: "", error: "",
  });

  // ── Bulk Upload state ─────────────────────────────────────────────────────
  const [bulkModalIsOpen, setBulkModalIsOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState("select"); // 'select' | 'preview' | 'uploading' | 'done'
  const [bulkMatches, setBulkMatches] = useState([]);
  const [bulkMode, setBulkMode] = useState("replace"); // 'replace' | 'append'
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkFilterStatus, setBulkFilterStatus] = useState("all"); // 'all' | 'matched' | 'unmatched'
  const [bulkProcessingFiles, setBulkProcessingFiles] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    current: 0, total: 0, status: "", successCount: 0, errorCount: 0, log: [],
  });

  const handleDownloadSingle = async (product) => {
    try {
      await downloadSingleImage(product);
    } catch (err) {
      setError(err.message || "Failed to download image");
    }
  };

  const handleStartZipDownload = async () => {
    const listToDownload = downloadScope === "filtered" ? filteredProducts : products;
    const itemsWithImages = listToDownload.filter((p) => Array.isArray(p.images) && p.images.length > 0);
    if (itemsWithImages.length === 0) {
      setDownloadProgress((prev) => ({ ...prev, error: "No products with images found to export." }));
      return;
    }
    setDownloadProgress({ active: true, current: 0, total: itemsWithImages.length, status: "Preparing...", error: "" });
    try {
      await generateProductImageZip(itemsWithImages, {
        filenameFormat: downloadNaming,
        includeCsv: downloadIncludeCsv,
      }, ({ current, total, status }) => {
        setDownloadProgress({ active: true, current, total, status, error: "" });
      });
      setDownloadProgress({ active: false, current: 0, total: 0, status: "", error: "" });
      setDownloadModalIsOpen(false);
    } catch (err) {
      setDownloadProgress((prev) => ({ ...prev, active: false, error: err.message || "Failed to create ZIP" }));
    }
  };

  const closeDownloadModal = () => {
    if (downloadProgress.active) return;
    setDownloadModalIsOpen(false);
    setDownloadProgress({ active: false, current: 0, total: 0, status: "", error: "" });
  };

  const processBulkFiles = async (rawFiles) => {
    if (!rawFiles || rawFiles.length === 0) return;
    setBulkProcessingFiles(true);
    setError("");
    try {
      let imageFiles = [];
      for (const file of rawFiles) {
        if (file.name.toLowerCase().endsWith(".zip")) {
          const unzippedFiles = await extractImagesFromZip(file);
          imageFiles = [...imageFiles, ...unzippedFiles];
        } else if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
          imageFiles.push(file);
        }
      }
      if (imageFiles.length === 0) {
        throw new Error("No valid image files or images found inside ZIP.");
      }
      const matchResults = matchImagesToProducts(imageFiles, products);
      setBulkMatches(matchResults);
      setBulkStep("preview");
    } catch (err) {
      setError(err.message || "Failed to process files");
    } finally {
      setBulkProcessingFiles(false);
    }
  };

  const handleBulkFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    processBulkFiles(files);
    e.target.value = "";
  };

  const handleBulkDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    processBulkFiles(files);
  };

  const handleReassignProduct = (matchId, productKey) => {
    setBulkMatches((prev) =>
      prev.map((item) => {
        if (item.id !== matchId) return item;
        const target = productKey
          ? products.find((p) => `${p.product_type}___${p.id}` === productKey)
          : null;
        return {
          ...item,
          matchedProduct: target || null,
          matchReason: target ? "Manual Selection" : "Unmatched",
          status: target ? "matched" : "unmatched",
        };
      })
    );
  };

  const handleRemoveBulkItem = (matchId) => {
    setBulkMatches((prev) => prev.filter((item) => item.id !== matchId));
  };

  const handleStartBulkUpload = async () => {
    const readyItems = bulkMatches.filter((item) => item.matchedProduct);
    if (readyItems.length === 0) {
      setError("No matched products to upload.");
      return;
    }

    const productMap = new Map();
    readyItems.forEach((item) => {
      // Must use compound key: product_type + id (because id alone is not unique across different tables!)
      const pKey = `${item.matchedProduct.product_type}___${item.matchedProduct.id}`;
      if (!productMap.has(pKey)) {
        productMap.set(pKey, {
          product: item.matchedProduct,
          files: [],
        });
      }
      productMap.get(pKey).files.push(item.file);
    });

    const tasks = Array.from(productMap.values());
    setBulkStep("uploading");
    setBulkProgress({
      current: 0,
      total: tasks.length,
      status: `Starting upload for ${tasks.length} product(s)...`,
      successCount: 0,
      errorCount: 0,
      log: [],
    });

    let succ = 0;
    let fail = 0;
    const logs = [];

    for (let i = 0; i < tasks.length; i++) {
      const { product, files } = tasks[i];
      setBulkProgress((prev) => ({
        ...prev,
        current: i + 1,
        status: `Uploading images for "${product.productname}" (${i + 1}/${tasks.length})...`,
      }));

      try {
        await uploadSingleProductImage(product, files, bulkMode, API_BASE_URL);
        succ++;
        logs.push({
          id: `${product.product_type}-${product.id}`,
          name: product.productname,
          status: "success",
          message: `Updated with ${files.length} image(s)`,
        });
      } catch (uploadErr) {
        fail++;
        logs.push({
          id: `${product.product_type}-${product.id}`,
          name: product.productname,
          status: "error",
          message: uploadErr.message || "Upload failed",
        });
      }

      setBulkProgress((prev) => ({
        ...prev,
        successCount: succ,
        errorCount: fail,
        log: [...logs],
      }));
    }

    await fetchProducts();
    setBulkStep("done");
  };


  const closeBulkModal = () => {
    setBulkModalIsOpen(false);
    setBulkStep("select");
    bulkMatches.forEach((m) => { if (m.previewUrl) URL.revokeObjectURL(m.previewUrl); });
    setBulkMatches([]);
    setBulkSearch("");
    setBulkFilterStatus("all");
    setBulkProgress({
      current: 0,
      total: 0,
      status: "",
      successCount: 0,
      errorCount: 0,
      log: [],
    });
  };

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
      const remainingExistingImages = (formData.existingImages || [])
        .map((img) => (typeof img === "string" ? img : img?.path || img?.url || img?.secure_url || ""))
        .filter(Boolean);
      formDataToSend.append("existingImages", JSON.stringify(remainingExistingImages));
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

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const fontName = await ensureTamilFont(doc);
      const pageWidth = doc.internal.pageSize.getWidth();
      let yOffset = 20;
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("PHOENIX CRACKERS", pageWidth / 2, yOffset, { align: "center" }); yOffset += 8;
      doc.setFontSize(12); doc.setFont("helvetica", "normal");
      doc.text("Sivakasi", pageWidth / 2, yOffset, { align: "center" }); yOffset += 8;
      doc.text("Website: www.funwithcrackers.com", pageWidth / 2, yOffset, { align: "center" }); yOffset += 8;
      doc.text(`Retail Pricelist - ${new Date().getFullYear()}`, pageWidth / 2, yOffset, { align: "center" });
      const tableData = [];
      let serialNumber = 1;
      let hasProducts = false;
      productTypes.forEach((type) => {
        const typeProducts = products.filter((product) => product.product_type === type).sort((a, b) => a.productname.localeCompare(b.productname));
        if (typeProducts.length > 0) {
          hasProducts = true;
          tableData.push([{ content: capitalize(type), colSpan: 8, styles: { fontStyle: "bold", halign: "left", fillColor: [200, 200, 200] } }]);
          tableData.push(["S.No", "Code", "Product", "Tamil", "Net Rate", "Direct Price", "Per", "Quantity"]);
          typeProducts.forEach((product) => {
            const productKey = `${product.product_type}-${product.id}`;
            let rate = editedRates[productKey]?.price ? Number.parseFloat(editedRates[productKey].price) : Number.parseFloat(product.net_rate || product.price || 0);
            let dprice = editedRates[productKey]?.dprice ? Number.parseFloat(editedRates[productKey].dprice) : Number.parseFloat(product.dprice || 0);
            if (editedRates[productKey] && (product.productname.toLowerCase() === "10*10" || product.productname.toLowerCase().endsWith("setout"))) {
              rate *= 5; dprice *= 5;
            }
            const tamilName = getTamilName(product);
            const isTwoLines = tamilName && splitTamilText(tamilName).length >= 2;
            tableData.push([
              serialNumber++,
              product.serial_number,
              product.productname,
              {
                content: isTwoLines ? " \n " : " ",
                tamilText: tamilName,
                styles: { minCellHeight: isTwoLines ? 11.5 : 7.5 }
              },
              `Rs.${Math.floor(rate)}`,
              `Rs.${Math.floor(dprice)}`,
              product.per,
              ""
            ]);
          });
          tableData.push([]);
        }
      });
      if (!hasProducts) { setError("No products available to export"); return; }
      autoTable(doc, {
        startY: yOffset,
        head: [["S.No", "Code", "Product", "Tamil", "Net Rate", "Direct Price", "Per", "Quantity"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3, font: fontName || undefined, fontStyle: "normal" },
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], font: fontName || undefined, fontStyle: "normal" },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 15 }, 2: { cellWidth: 42 }, 3: { cellWidth: 42, textColor: [255, 255, 255] }, 4: { cellWidth: 25 }, 5: { cellWidth: 25 }, 6: { cellWidth: 15 }, 7: { cellWidth: 16 } },
        didDrawCell: (data) => {
          if (fontName && data.cell) {
            data.cell.styles.font = fontName;
            data.cell.styles.fontStyle = "normal";
          }
          if (data.section === "body" && data.column.index === 3 && data.cell.raw) {
            const rawVal = typeof data.cell.raw === "object" ? (data.cell.raw.tamilText || data.cell.raw.content) : data.cell.raw;
            if (rawVal && typeof rawVal === "string" && rawVal.trim() !== "") {
              const rendered = renderTamilTextToDataURL(rawVal, 10, "#111827");
              if (rendered && rendered.dataUrl) {
                const padding = 2;
                const cellX = data.cell.x + padding;
                const maxW = data.cell.width - padding * 2;
                const maxH = data.cell.height - 1;
                
                let imgW = rendered.widthMm;
                let imgH = rendered.heightMm;
                if (imgW > maxW) {
                  const ratio = maxW / imgW;
                  imgW = maxW;
                  imgH = imgH * ratio;
                }
                if (imgH > maxH) {
                  const ratio = maxH / imgH;
                  imgH = maxH;
                  imgW = imgW * ratio;
                }

                const offsetY = data.cell.y + (data.cell.height - imgH) / 2;
                doc.addImage(rendered.dataUrl, "PNG", cellX, offsetY, imgW, imgH);
              }
            }
          }
          if (data.row.section === "body" && data.cell.raw && data.cell.raw.colSpan === 8) {
            data.cell.styles.cellPadding = 5;
            data.cell.styles.fontSize = 11;
          }
        },
      });
      const currentYear = new Date().getFullYear();
      doc.save(`FWC_Pricelist_${currentYear}.pdf`);
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

  const renderDownloadModal = () => {
    const totalAllWithImages = products.filter((p) => p.images?.length > 0).length;
    const totalFilteredWithImages = filteredProducts.filter((p) => p.images?.length > 0).length;
    const selectedCount = downloadScope === "filtered" ? totalFilteredWithImages : totalAllWithImages;

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg shadow-sm">
              <FaDownload />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Download Product Images</h2>
              <p className="text-xs text-gray-400 mt-0.5">Export images named with product names into a ZIP archive</p>
            </div>
          </div>
          {!downloadProgress.active && (
            <button onClick={closeDownloadModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 text-lg">×</button>
          )}
        </div>

        {downloadProgress.active ? (
          <div className="py-8 px-2 space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                <Spinner size="sm" color="text-purple-600" />
                {downloadProgress.status}
              </span>
              <span className="text-purple-600 font-bold">
                {downloadProgress.total > 0
                  ? `${Math.round((downloadProgress.current / downloadProgress.total) * 100)}%`
                  : ''}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${downloadProgress.total > 0 ? (downloadProgress.current / downloadProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Processed {downloadProgress.current} of {downloadProgress.total} images. Generating ZIP...
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            {downloadProgress.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                {downloadProgress.error}
              </div>
            )}

            {/* Scope Selection */}
            <div>
              <label className={lc}>Products to Export</label>
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setDownloadScope("all")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    downloadScope === "all"
                      ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold text-gray-800">All Products</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{totalAllWithImages} with images ({products.length} total)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadScope("filtered")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    downloadScope === "filtered"
                      ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold text-gray-800">Filtered Only</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{totalFilteredWithImages} with images ({filteredProducts.length} in filter)</p>
                </button>
              </div>
            </div>

            {/* Naming Convention */}
            <div>
              <label className={lc}>File Naming Format</label>
              <div className="space-y-2 mt-1">
                {[
                  { id: "name", label: "Product Name (Recommended)", example: "10 CM Electric Sparklers.jpg" },
                  { id: "serial_name", label: "Serial Number + Product Name", example: "001 - 10 CM Electric Sparklers.jpg" },
                  { id: "serial", label: "Serial Number Only", example: "001.jpg" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      downloadNaming === opt.id
                        ? "border-purple-400 bg-purple-50/30"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="downloadNaming"
                      value={opt.id}
                      checked={downloadNaming === opt.id}
                      onChange={() => setDownloadNaming(opt.id)}
                      className="mt-0.5 text-purple-600 focus:ring-purple-400"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-800">{opt.label}</span>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{opt.example}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Manifest Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadIncludeCsv}
                  onChange={(e) => setDownloadIncludeCsv(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-400 h-4 w-4"
                />
                <span className="text-xs text-gray-700 font-medium">
                  Include <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">manifest.csv</code> mapping product codes & names to images
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button type="button" onClick={closeDownloadModal} className={btnGhost}>Cancel</button>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleStartZipDownload}
                className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
                  selectedCount === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 cursor-pointer"
                }`}
              >
                <FaDownload className="h-3.5 w-3.5" /> Download ZIP ({selectedCount} Products)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBulkUploadModal = () => {
    const matchedCount = bulkMatches.filter((m) => m.matchedProduct).length;
    const unmatchedCount = bulkMatches.filter((m) => !m.matchedProduct).length;

    const filteredMatches = bulkMatches.filter((item) => {
      if (bulkFilterStatus === "matched" && !item.matchedProduct) return false;
      if (bulkFilterStatus === "unmatched" && item.matchedProduct) return false;
      if (bulkSearch) {
        const q = bulkSearch.toLowerCase();
        const fnameMatch = item.filename.toLowerCase().includes(q);
        const pNameMatch = item.matchedProduct?.productname?.toLowerCase().includes(q);
        const pSnMatch = item.matchedProduct?.serial_number?.toLowerCase().includes(q);
        return fnameMatch || pNameMatch || pSnMatch;
      }
      return true;
    });

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-sm">
              <FaUpload />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Bulk Upload Product Images</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upload edited images (ZIP archive or multiple files) to update products</p>
            </div>
          </div>
          {bulkStep !== "uploading" && (
            <button onClick={closeBulkModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 text-lg">×</button>
          )}
        </div>

        {/* Body content based on bulkStep */}
        {bulkStep === "select" && (
          <div className="py-6 flex-1 flex flex-col justify-center">
            {bulkProcessingFiles ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" color="text-blue-600" />
                <p className="text-sm font-semibold text-gray-700">Reading files & matching products...</p>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBulkDrop}
                className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center"
                onClick={() => document.getElementById("bulk-file-input")?.click()}
              >
                <input
                  id="bulk-file-input"
                  type="file"
                  multiple
                  accept=".zip,image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleBulkFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4 shadow-sm">
                  <FaFileArchive />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  Drag and drop a <span className="text-blue-600 font-extrabold">.ZIP</span> archive or multiple image files here
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mb-5">
                  Upload the ZIP file of images you downloaded and edited, or select multiple JPG/PNG images. Files will be matched automatically by product name or serial number!
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Select ZIP or Images
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}
          </div>
        )}

        {bulkStep === "preview" && (
          <div className="py-4 flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">{bulkMatches.length} Total Files:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                  ✓ {matchedCount} Matched
                </span>
                {unmatchedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                    ⚠ {unmatchedCount} Unmatched
                  </span>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500 font-medium">Update Mode:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="replace"
                    checked={bulkMode === "replace"}
                    onChange={() => setBulkMode("replace")}
                    className="text-blue-600"
                  />
                  <span className="font-semibold text-gray-800">Replace existing</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkMode"
                    value="append"
                    checked={bulkMode === "append"}
                    onChange={() => setBulkMode("append")}
                    className="text-blue-600"
                  />
                  <span className="font-semibold text-gray-800">Append</span>
                </label>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center flex-shrink-0">
              <div className="flex gap-1.5 w-full sm:w-auto">
                {["all", "matched", "unmatched"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBulkFilterStatus(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      bulkFilterStatus === tab
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {capitalize(tab)} (
                    {tab === "all" ? bulkMatches.length : tab === "matched" ? matchedCount : unmatchedCount}
                    )
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search file or product name..."
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
                />
                <FaSearch className="absolute left-2.5 top-2.5 text-gray-400 text-xs" />
              </div>
            </div>

            {/* Preview List */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-96">
              {filteredMatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No images match your filter</div>
              ) : (
                filteredMatches.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                    {/* Thumbnail & File name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.previewUrl}
                        alt={item.filename}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={item.filename}>
                          {item.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.matchedProduct ? (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Matched ({item.matchReason})
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Unmatched
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Matched product / Product selector */}
                    <div className="w-64 sm:w-80 flex-shrink-0">
                      <select
                        value={item.matchedProduct ? `${item.matchedProduct.product_type}___${item.matchedProduct.id}` : ""}
                        onChange={(e) => handleReassignProduct(item.id, e.target.value)}
                        className="w-full text-xs rounded-lg border border-gray-200 px-2 py-1.5 bg-white text-gray-800 outline-none focus:border-blue-400 cursor-pointer"
                      >
                        <option value="">-- Assign to Product --</option>
                        {products.map((p) => {
                          const pKey = `${p.product_type}___${p.id}`;
                          return (
                            <option key={pKey} value={pKey}>
                              [{p.serial_number}] {p.productname} ({capitalize(p.product_type)})
                            </option>
                          );
                        })}
                      </select>

                      {item.matchedProduct && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          Currently: {item.matchedProduct.productname} (S/N: {item.matchedProduct.serial_number})
                        </p>
                      )}
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      title="Remove from upload"
                      onClick={() => handleRemoveBulkItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <FaTimes className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setBulkMatches([]);
                  setBulkStep("select");
                }}
                className={btnGhost}
              >
                Re-select Files
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={closeBulkModal} className={btnGhost}>Cancel</button>
                <button
                  type="button"
                  disabled={matchedCount === 0}
                  onClick={handleStartBulkUpload}
                  className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
                    matchedCount === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  <FaUpload className="h-3.5 w-3.5" /> Upload & Update {matchedCount} Product(s)
                </button>
              </div>
            </div>
          </div>
        )}

        {bulkStep === "uploading" && (
          <div className="py-8 flex-1 flex flex-col justify-center space-y-5">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                <Spinner size="sm" color="text-blue-600" />
                {bulkProgress.status}
              </span>
              <span className="text-blue-600 font-bold">
                {bulkProgress.total > 0
                  ? `${Math.round((bulkProgress.current / bulkProgress.total) * 100)}%`
                  : ''}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Updating products on server... Please keep this window open.
            </p>

            {/* Live activity log */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1 text-xs">
              {bulkProgress.log.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {entry.status === "success" ? (
                    <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-gray-800">{entry.name}:</span>
                  <span className={entry.status === "success" ? "text-gray-500" : "text-red-500"}>
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bulkStep === "done" && (
          <div className="py-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
              <FaCheckCircle />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Bulk Upload Completed!</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Successfully updated <span className="font-bold text-emerald-600">{bulkProgress.successCount}</span> products with new images.
              {bulkProgress.errorCount > 0 && (
                <span className="text-red-500 block mt-1">
                  {bulkProgress.errorCount} products encountered errors. Check log below.
                </span>
              )}
            </p>

            {bulkProgress.log.length > 0 && (
              <div className="w-full max-h-40 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3 text-left space-y-1 text-xs">
                {bulkProgress.log.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {entry.status === "success" ? (
                      <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <FaTimesCircle className="text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-gray-800">{entry.name}:</span>
                    <span className={entry.status === "success" ? "text-gray-500" : "text-red-500"}>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={closeBulkModal}
              className="h-9 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Done & Refresh Catalogue
            </button>
          </div>
        )}
      </div>
    );
  };

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
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setAddModalIsOpen(true)} className={btnPrimary}>Add Product</button>
                  <button
                    onClick={() => setDownloadModalIsOpen(true)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold transition-all cursor-pointer"
                    title="Download images of all products with product names"
                  >
                    <FaDownload className="h-3.5 w-3.5" /> Download Images
                  </button>
                  <button
                    onClick={() => setBulkModalIsOpen(true)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-all cursor-pointer"
                    title="Bulk upload edited product images"
                  >
                    <FaUpload className="h-3.5 w-3.5" /> Bulk Upload Images
                  </button>
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
                          <div className="flex gap-1.5 pt-1 border-t border-gray-100">
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
                            {product.images?.length > 0 && (
                              <button
                                title={`Download image: ${product.productname}`}
                                onClick={() => handleDownloadSingle(product)}
                                className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs font-semibold transition-colors"
                              >
                                <FaDownload className="h-3 w-3" />
                              </button>
                            )}
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
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
        {renderRateChangeModal()}
      </Modal>

      {/* Download Product Images Modal */}
      <Modal isOpen={downloadModalIsOpen} onRequestClose={closeDownloadModal}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
        {renderDownloadModal()}
      </Modal>

      {/* Bulk Upload Product Images Modal */}
      <Modal isOpen={bulkModalIsOpen} onRequestClose={closeBulkModal}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
        {renderBulkUploadModal()}
      </Modal>
    </div>
  );
}