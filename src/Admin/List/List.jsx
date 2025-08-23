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
    productname: "",
    serial_number: "",
    price: "",
    dprice: "", // Added dprice
    discount: "",
    per: "",
    product_type: "",
    description: "",
    box_count: 1,
    images: [],
    existingImages: [],
    imagesToDelete: [],
  });

  const productsPerPage = 9;

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
      borderDark: "1px solid rgba(59,130,246,0.4)",
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    },
  };

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
          dprice: product.dprice || "0", // Ensure dprice is a string
        }))
        .sort((a, b) => a.serial_number.localeCompare(b.serial_number));
      setProducts(normalizedData);
      applyFilters(normalizedData, filterType, searchQuery);
      setToggleStates(
        normalizedData.reduce(
          (acc, p) => ({
            ...acc,
            [`${p.product_type}-${p.id}`]: p.status === "on",
            [`fast-${p.product_type}-${p.id}`]: p.fast_running === true,
          }),
          {},
        ),
      );
    });

  const applyFilters = (productsData, type, query) => {
    let filtered = productsData;
    if (type !== "all") {
      filtered = filtered.filter((p) => p.product_type === type);
    }
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (p) => p.productname.toLowerCase().includes(lowerQuery) || p.serial_number.toLowerCase().includes(lowerQuery),
      );
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
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
      const response = await fetch(`${API_BASE_URL}/api/products/${tableName}/${product.id}/${endpoint}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error(`Failed to toggle ${endpoint}`);
      fetchProducts();
    } catch (err) {
      setError(err.message);
      setToggleStates((prev) => ({ ...prev, [productKey]: prev[productKey] }));
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
    const intervalId = setInterval(() => {
      fetchProductTypes();
      fetchProducts();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    applyFilters(products, filterType, searchQuery);
  }, [filterType, searchQuery, products]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    const validFiles = [];

    for (const file of files) {
      const fileType = file.type.toLowerCase();
      if (!allowedTypes.includes(fileType)) {
        setError("Only JPG, PNG, GIF images and MP4, WebM, Ogg videos are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each file must be less than 5MB");
        return;
      }
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
        setDiscountWarning("");
        setFormData((prev) => ({ ...prev, [name]: value }));
      } else if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        setDiscountWarning("Discount must be between 0 and 100%");
        setFormData((prev) => ({ ...prev, [name]: numValue < 0 ? "0" : "100" }));
      } else {
        setDiscountWarning("");
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "dprice") {
      const numValue = Number.parseFloat(value);
      if (value === "") {
        setFormData((prev) => ({ ...prev, [name]: value }));
      } else if (isNaN(numValue) || numValue < 0) {
        setError("Direct Customer Price must be a valid positive number");
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
    setDiscountWarning("");
    setError("");

    if (
      !formData.productname.trim() ||
      !formData.serial_number.trim() ||
      !formData.price ||
      !formData.dprice ||
      !formData.per ||
      formData.discount === "" ||
      !formData.product_type
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const price = Number.parseFloat(formData.price);
    const dprice = Number.parseFloat(formData.dprice || 0);
    const discount = Number.parseFloat(formData.discount);

    if (isNaN(price) || price < 0) {
      setError("Price must be a valid positive number");
      return;
    }

    if (isNaN(dprice) || dprice < 0) {
      setError("Direct Customer Price must be a valid positive number");
      return;
    }

    if (isNaN(discount) || discount < 0 || discount > 100) {
      setError("Discount must be a valid number between 0 and 100%");
      return;
    }

    if (formData.product_type === "gift_box_dealers") {
      setError('Product type "gift_box_dealers" is not allowed');
      return;
    }

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
      if (remainingExistingImages.length > 0) {
        formDataToSend.append("existingImages", JSON.stringify(remainingExistingImages));
      }
      formData.images.forEach((file) => formDataToSend.append("images", file));
    } else {
      formData.images.forEach((file) => formDataToSend.append("images", file));
    }

    const url = isEdit
      ? `${API_BASE_URL}/api/products/${selectedProduct.product_type.toLowerCase().replace(/\s+/g, "_")}/${selectedProduct.id}`
      : `${API_BASE_URL}/api/products`;

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: formDataToSend,
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Server response:", result);
        throw new Error(result.message || `Failed to ${isEdit ? "update" : "add"} product`);
      }

      fetchProducts();
      closeModal();
      e.target.reset();
      setFormData({
        productname: "",
        serial_number: "",
        price: "",
        dprice: "",
        discount: "",
        per: "",
        product_type: "",
        description: "",
        box_count: 1,
        images: [],
        existingImages: [],
        imagesToDelete: [],
      });
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (product) => {
    try {
      await fetch(
        `${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, "_")}/${product.id}`,
        { method: "DELETE" },
      );
      fetchProducts();
      setDeleteModalIsOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setError("Failed to delete product");
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditModalIsOpen(false);
    setAddModalIsOpen(false);
    setDeleteModalIsOpen(false);
    setRateChangeModalIsOpen(false);
    setConfirmRateChangeModalIsOpen(false);
    setSelectedProduct(null);
    setProductToDelete(null);
    setEditedRates({});
    setRateChangeSearchQuery("");
    setError("");
    setDiscountWarning("");
    setFormData({
      productname: "",
      serial_number: "",
      price: "",
      dprice: "",
      discount: "",
      per: "",
      product_type: "",
      description: "",
      box_count: 1,
      images: [],
      existingImages: [],
      imagesToDelete: [],
    });
  };

  const capitalize = (str) =>
    str
      ? str
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "";

  const downloadPDF = () => {
    if (!products.length || !productTypes.length) {
      setError("No products or product types available to export");
      return;
    }
    setConfirmRateChangeModalIsOpen(true);
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yOffset = 20;

      // Add company details
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PHOENIX CRACKERS", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Sivakasi", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 8;
      doc.text("Website: www.funwithcrackers.com", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 8;
      doc.text("Pricelist 2025", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 20;

      // Prepare table data
      const tableData = [];
      let serialNumber = 1;
      let hasActiveProducts = false;

      productTypes.forEach((type) => {
        const typeProducts = products
          .filter((product) => product.product_type === type && product.status === "on")
          .sort((a, b) => a.productname.localeCompare(b.productname));

        if (typeProducts.length > 0) {
          hasActiveProducts = true;
          tableData.push([
            {
              content: capitalize(type),
              colSpan: 8,
              styles: { fontStyle: "bold", halign: "left", fillColor: [200, 200, 200] },
            },
          ]);

          tableData.push(["S.No", "Product No.", "Product", "Net Rate", "Direct Price", "Per", "Quantity", "Amount"]);

          typeProducts.forEach((product) => {
            const productKey = `${product.product_type}-${product.id}`;
            let rate = editedRates[productKey]?.price
              ? Number.parseFloat(editedRates[productKey].price)
              : Number.parseFloat(product.net_rate || product.price || 0);
            let dprice = editedRates[productKey]?.dprice
              ? Number.parseFloat(editedRates[productKey].dprice)
              : Number.parseFloat(product.dprice || 0);

            if (editedRates[productKey] && (
              product.productname.toLowerCase() === "10*10" ||
              product.productname.toLowerCase().endsWith("setout")
            )) {
              rate *= 5;
              dprice *= 5;
            }

            tableData.push([
              serialNumber++,
              product.serial_number,
              product.productname,
              `Rs.${Math.floor(rate)}`,
              `Rs.${Math.floor(dprice)}`,
              product.per,
              "",
              "",
            ]);
          });

          tableData.push([]);
        }
      });

      if (!hasActiveProducts) {
        setError("No active products (status: on) available to export");
        return;
      }

      // Generate table
      autoTable(doc, {
        startY: yOffset,
        head: [["S.No", "Product No.", "Product", "Net Rate", "Direct Price", "Per", "Quantity", "Amount"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 15 }, // S.No
          1: { cellWidth: 25 }, // Product No.
          2: { cellWidth: 50 }, // Product
          3: { cellWidth: 30 }, // Net Rate
          4: { cellWidth: 30 }, // Direct Price
          5: { cellWidth: 20 }, // Per
          6: { cellWidth: 25 }, // Quantity
          7: { cellWidth: 25 }, // Amount
        },
        didDrawCell: (data) => {
          if (data.row.section === "body" && data.cell.raw && data.cell.raw.colSpan === 8) {
            data.cell.styles.cellPadding = 5;
            data.cell.styles.fontSize = 12;
          }
        },
      });

      doc.save("Pricelist_2025.pdf");
      closeModal();
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    }
  };

  const handleRateChangeSubmit = (e) => {
    e.preventDefault();
    setError("");
    for (const productKey in editedRates) {
      const priceValue = Number.parseFloat(editedRates[productKey].price);
      const dpriceValue = Number.parseFloat(editedRates[productKey].dprice);
      if ((priceValue && (isNaN(priceValue) || priceValue < 0)) || (dpriceValue && (isNaN(dpriceValue) || dpriceValue < 0))) {
        setError(`Invalid rate or direct price for product ${productKey}. Please enter valid positive numbers.`);
        return;
      }
    }
    if (Object.keys(editedRates).length === 0) {
      setError("Please edit at least one product rate");
      return;
    }
    generatePDF();
  };

  const handleRateChangeInput = (product, value, field) => {
    const productKey = `${product.product_type}-${product.id}`;
    if (value === "") {
      setEditedRates((prev) => {
        const newRates = { ...prev };
        if (newRates[productKey]) {
          delete newRates[productKey][field];
          if (Object.keys(newRates[productKey]).length === 0) {
            delete newRates[productKey];
          }
        }
        return newRates;
      });
    } else {
      setEditedRates((prev) => ({
        ...prev,
        [productKey]: {
          ...prev[productKey],
          [field]: value,
        },
      }));
    }
  };

  const clearAllRates = () => {
    setEditedRates({});
  };

  const renderRateChangeModal = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-3 max-w-4xl w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">
        Change Product Rates
      </h2>
      <form onSubmit={handleRateChangeSubmit}>
        <div className="space-y-4 mobile:space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Product</label>
            <input
              type="text"
              value={rateChangeSearchQuery}
              onChange={(e) => setRateChangeSearchQuery(e.target.value)}
              placeholder="Search by name or serial number"
              className="mt-1 text-md px-2 h-8 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
              style={{
                background: styles.input.background,
                backgroundDark: styles.input.backgroundDark,
                border: styles.input.border,
                borderDark: styles.input.borderDark,
                backdropFilter: styles.input.backdropFilter,
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {applyRateChangeFilter().length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      Net Rate
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      Direct Customer Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {applyRateChangeFilter().map((product) => {
                    const productKey = `${product.product_type}-${product.id}`;
                    const defaultRate = Number.parseFloat(product.net_rate || product.price || 0).toFixed(2);
                    const defaultDPrice = Number.parseFloat(product.dprice || 0).toFixed(2);

                    return (
                      <tr key={productKey}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.productname}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.serial_number}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            value={editedRates[productKey]?.price ?? defaultRate}
                            onChange={(e) => handleRateChangeInput(product, e.target.value, "price")}
                            placeholder="Enter new rate"
                            className="text-md px-2 h-8 block w-24 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                            style={{
                              background: styles.input.background,
                              backgroundDark: styles.input.backgroundDark,
                              border: styles.input.border,
                              borderDark: styles.input.borderDark,
                              backdropFilter: styles.input.backdropFilter,
                            }}
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            value={editedRates[productKey]?.dprice ?? defaultDPrice}
                            onChange={(e) => handleRateChangeInput(product, e.target.value, "dprice")}
                            placeholder="Enter DPrice"
                            className="text-md px-2 h-8 block w-24 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                            style={{
                              background: styles.input.background,
                              backgroundDark: styles.input.backgroundDark,
                              border: styles.input.border,
                              borderDark: styles.input.borderDark,
                              backdropFilter: styles.input.backdropFilter,
                            }}
                            step="0.01"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No products found</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-6 mobile:mt-3 flex justify-end space-x-2 mobile:space-x-1">
            <button
              type="button"
              onClick={clearAllRates}
              className="rounded-md px-4 mobile:px-3 py-2 mobile:py-1 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-red-700 dark:hover:bg-red-600"
              style={{
                background: styles.button.background
                  .replace("2,132,199", "220,38,38")
                  .replace("14,165,233", "239,68,68"),
                backgroundDark: styles.button.backgroundDark
                  .replace("59,130,246", "220,38,38")
                  .replace("37,99,235", "200,35,35"),
                border: styles.button.border.replace("125,211,252", "252,165,165"),
                borderDark: styles.button.borderDark.replace("147,197,253", "252,165,165"),
                boxShadow: styles.button.boxShadow.replace("2,132,199", "220,38,38"),
                boxShadowDark: styles.button.boxShadowDark.replace("59,130,246", "220,38,38"),
              }}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md px-4 mobile:px-3 py-2 mobile:py-1 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
              style={{
                background: styles.button.background,
                backgroundDark: styles.button.backgroundDark,
                border: styles.button.border,
                borderDark: styles.button.borderDark,
                boxShadow: styles.button.boxShadow,
                boxShadowDark: styles.button.boxShadowDark,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md px-4 mobile:px-3 py-2 mobile:py-1 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
              style={{
                background: styles.button.background,
                backgroundDark: styles.button.backgroundDark,
                border: styles.button.border,
                borderDark: styles.button.borderDark,
                boxShadow: styles.button.boxShadow,
                boxShadowDark: styles.button.boxShadowDark,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const renderMedia = (media, idx, sizeClass) => {
    let src
    let isVideo = false

    if (media instanceof File) {
      src = URL.createObjectURL(media)
      isVideo = media.type.startsWith("video/")
    } else if (typeof media === "string") {
      src = media
      isVideo = media.includes("/video/")
    } else {
      return (
        <span key={idx} className="text-gray-500 dark:text-gray-400 text-sm">
          Invalid media
        </span>
      )
    }

    return isVideo ? (
      <video
        key={idx}
        src={src}
        controls
        className={`${sizeClass} object-cover rounded-md inline-block mx-1`}
        onLoad={() => {
          if (media instanceof File) URL.revokeObjectURL(src)
        }}
      />
    ) : (
      <img
        key={idx}
        src={src || "/placeholder.svg"}
        alt={`media-${idx}`}
        className={`${sizeClass} object-cover rounded-md inline-block mx-1`}
        onLoad={() => {
          if (media instanceof File) URL.revokeObjectURL(src)
        }}
      />
    )
  }

  const handleDeleteExistingImage = (indexToDelete) => {
    setFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, index) => index !== indexToDelete),
      imagesToDelete: [...prev.imagesToDelete, indexToDelete],
    }))
  }

  const renderModalForm = (isEdit) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-3 max-w-2xl w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">
        {isEdit ? "Edit Product" : "Add Product"}
      </h2>
      <form onSubmit={(e) => handleSubmit(e, isEdit)}>
        <div className="space-y-4 mobile:space-y-2">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Type</label>
              <select
                name="product_type"
                value={formData.product_type}
                onChange={handleInputChange}
                className="mt-1 text-md mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
              >
                <option value="">Select Product Type</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {capitalize(type)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
              <input
                type="text"
                name="productname"
                value={formData.productname}
                onChange={handleInputChange}
                className="mt-1 text-md px-2 h-8 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                className="mt-1 text-md px-2 h-8 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 text-md px-2 h-8 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
                step="0.01"
              />
            </div>
<div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Direct Customer Price</label>
            <input
              type="number"
              name="dprice"
              value={formData.dprice}
              onChange={handleInputChange}
              className="mt-1 text-md px-2 h-8 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm"
              style={styles.input}
              required
              step="0.01"
            />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                className="mt-1 text-md px-2 h-8 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
                step="0.01"
                min="0"
                max="100"
              />
              {discountWarning && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{discountWarning}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Per</label>
              <select
                name="per"
                value={formData.per}
                onChange={handleInputChange}
                className="mt-1 h-8 text-md mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
              >
                <option value="">Select Unit</option>
                {["pieces", "box", "pkt"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Box Count</label>
              <input
                type="number"
                name="box_count"
                value={formData.box_count}
                onChange={handleInputChange}
                className="mt-1 text-md px-2 h-8 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm"
                style={{
                  background: styles.input.background,
                  backgroundDark: styles.input.backgroundDark,
                  border: styles.input.border,
                  borderDark: styles.input.borderDark,
                  backdropFilter: styles.input.backdropFilter,
                }}
                required
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isEdit ? "Manage Images" : "Images"}
            </label>
            <input
              type="file"
              name="images"
              multiple
              onChange={handleImageChange}
              accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg"
              className="mt-1 mobile:mt-0.5 block w-full text-sm text-gray-900 dark:text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-gray-700 file:text-indigo-600 dark:file:text-gray-200 hover:file:bg-indigo-100 dark:hover:file:bg-gray-600"
            />

            {isEdit && formData.existingImages.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current images (click × to delete):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.existingImages.map((file, idx) => (
                    <div key={idx} className="relative">
                      {renderMedia(file, idx, "h-20 w-20")}
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                        title="Delete this image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.images.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  New images (will be added to existing images):
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((file, idx) => (
                    <div key={idx} className="relative">
                      {renderMedia(file, idx, "h-20 w-20")}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, index) => index !== idx),
                          }))
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                        title="Remove this new image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 mobile:mt-3 flex justify-end space-x-2 mobile:space-x-1">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md px-4 mobile:px-3 py-2 mobile:py-1 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
              style={{
                background: styles.button.background,
                backgroundDark: styles.button.backgroundDark,
                border: styles.button.border,
                borderDark: styles.button.borderDark,
                boxShadow: styles.button.boxShadow,
                boxShadowDark: styles.button.boxShadowDark,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md px-4 mobile:px-3 py-2 mobile:py-1 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
              style={{
                background: styles.button.background,
                backgroundDark: styles.button.backgroundDark,
                border: styles.button.border,
                borderDark: styles.button.borderDark,
                boxShadow: styles.button.boxShadow,
                boxShadowDark: styles.button.boxShadowDark,
              }}
            >
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )

  const { indexOfFirstProduct, indexOfLastProduct } = {
    indexOfFirstProduct: currentPage * productsPerPage - productsPerPage,
    indexOfLastProduct: currentPage * productsPerPage,
  }

  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 overflow-hidden justify-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6 mobile:mb-4">
            List Products
          </h2>

          {error && <div className="mb-4 mobile:mb-2 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}

          <div className="mb-6 mobile:mb-4 hundred:mx-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div>
                <label
                  htmlFor="product-type-filter"
                  className="block text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Filter by Product Type
                </label>
                <select
                  id="product-type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="mt-2 mobile:mt-1 block w-48 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 outline-1 outline-gray-300 dark:outline-gray-600 focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                  style={{
                    background: styles.input.background,
                    backgroundDark: styles.input.backgroundDark,
                    border: styles.input.border,
                    borderDark: styles.input.borderDark,
                    backdropFilter: styles.input.backdropFilter,
                  }}
                >
                  <option value="all">All</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {capitalize(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Search Products
                </label>
                <input
                  id="search-filter"
                  type="text"
                  placeholder="Search by name or serial number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2 mobile:mt-1 block w-48 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 outline-1 outline-gray-300 dark:outline-gray-600 focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm"
                  style={{
                    background: styles.input.background,
                    backgroundDark: styles.input.backgroundDark,
                    border: styles.input.border,
                    borderDark: styles.input.borderDark,
                    backdropFilter: styles.input.backdropFilter,
                  }}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setAddModalIsOpen(true)}
                className="rounded-md px-3 py-2 mobile:translate-y-3 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
                style={{
                  background: styles.button.background,
                  backgroundDark: styles.button.backgroundDark,
                  border: styles.button.border,
                  borderDark: styles.button.borderDark,
                  boxShadow: styles.button.boxShadow,
                  boxShadowDark: styles.button.boxShadowDark,
                }}
              >
                Add Product
              </button>
              <button
                onClick={downloadPDF}
                className="rounded-md px-3 py-2 mobile:translate-y-3 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
                style={{
                  background: styles.button.background,
                  backgroundDark: styles.button.backgroundDark,
                  border: styles.button.border,
                  borderDark: styles.button.borderDark,
                  boxShadow: styles.button.boxShot,
                  boxShadowDark: styles.button.boxShadowDark,
                }}
              >
                Pricelist 2025
              </button>
            </div>
          </div>

          {currentProducts.length === 0 ? (
            <p className="text-lg text-center text-gray-600 dark:text-gray-300 sm:text-xl font-medium">
              No products found
            </p>
          ) : (
            <div className="grid onefifty:grid-cols-3 hundred:translate-x-0 mobile:grid-cols-1 hundred:grid-cols-3 gap-6 mobile:gap-4 justify-center">
              {currentProducts.map((product) => {
                const productKey = `${product.product_type}-${product.id}`
                return (
                  <div
                    key={productKey}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {product.productname}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{capitalize(product.product_type)}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">S/N: {product.serial_number}</p>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2 justify-center">
                        {product.images.length > 0 ? (
                          product.images.map((media, idx) =>
                            renderMedia(media, idx, "h-16 w-16 mobile:h-12 mobile:w-12"),
                          )
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">No media</span>
                        )}
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Price: ₹{Number.parseFloat(product.price).toFixed(2)}
                          </span>
                        </div>
                        <div>
  <span className="font-medium text-gray-700 dark:text-gray-300">
    Direct Price: ₹{Number.parseFloat(product.dprice).toFixed(2)}
  </span>
</div>

                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Per: {product.per}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Discount: {Number.parseFloat(product.discount).toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Box Count: {product.box_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={toggleStates[productKey]}
                              onChange={() => handleToggle(product, "toggle-status", "")}
                            />
                            <div
                              className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[productKey] ? "bg-green-600 dark:bg-green-500" : "bg-red-600 dark:bg-red-500"}`}
                            >
                              <div
                                className={`absolute top-0.25 w-3.5 h-3.5 bg-white dark:bg-gray-200 rounded-full transition-transform duration-200 ease-in-out ${toggleStates[productKey] ? "translate-x-4" : "translate-x-0.5"}`}
                              ></div>
                            </div>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Fast Running:</span>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={toggleStates[`fast-${productKey}`]}
                              onChange={() => handleToggle(product, "toggle-fast-running", "fast-")}
                            />
                            <div
                              className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${toggleStates[`fast-${productKey}`] ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-400 dark:bg-gray-500"}`}
                            >
                              <div
                                className={`absolute top-0.25 w-3.5 h-3.5 bg-white dark:bg-gray-200 rounded-full transition-transform duration-200 ease-in-out ${toggleStates[`fast-${productKey}`] ? "translate-x-4" : "translate-x-0.5"}`}
                              ></div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setModalIsOpen(true)
                          }}
                          className="flex items-center px-3 py-1 text-xs sm:text-sm text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md"
                          style={{
                            background: styles.button.background,
                            backgroundDark: styles.button.backgroundDark,
                            border: styles.button.border,
                            borderDark: styles.button.borderDark,
                            boxShadow: styles.button.boxShadow,
                            boxShadowDark: styles.button.boxShadowDark,
                          }}
                        >
                          <FaEye className="mr-1 h-4 w-4" /> View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setFormData({
                              productname: product.productname,
                              serial_number: product.serial_number,
                              price: product.price,
                              dprice: product.dprice,   // ✅ new
                              discount: product.discount,
                              per: product.per,
                              product_type: product.product_type,
                              description: product.description || "",
                              box_count: product.box_count,
                              images: [],
                              existingImages: product.images || [],
                              imagesToDelete: [],
                            })

                            setEditModalIsOpen(true)
                          }}
                          className="flex items-center px-3 py-1 text-xs sm:text-sm text-white dark:text-gray-100 hover:bg-green-700 dark:hover:bg-green-600 rounded-md"
                          style={{
                            background: styles.button.background,
                            backgroundDark: styles.button.backgroundDark,
                            border: styles.button.border,
                            borderDark: styles.button.borderDark,
                            boxShadow: styles.button.boxShadow,
                            boxShadowDark: styles.button.boxShadowDark,
                          }}
                        >
                          <FaEdit className="mr-1 h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="flex items-center px-3 py-1 text-xs sm:text-sm text-white dark:text-gray-100 hover:bg-red-700 dark:hover:bg-red-600 rounded-md"
                          style={{
                            background: styles.button.background,
                            backgroundDark: styles.button.backgroundDark,
                            border: styles.button.border,
                            borderDark: styles.button.borderDark,
                            boxShadow: styles.button.boxShadow,
                            boxShadowDark: styles.button.boxShadowDark,
                          }}
                        >
                          <FaTrash className="mr-1 h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 mobile:mt-4 flex justify-center items-center space-x-4 mobile:space-x-2">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1))
                  window.scrollTo(0, 0)
                }}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-white dark:text-gray-100 hover:bg-indigo-700 dark:hover:bg-blue-600"}`}
                style={
                  currentPage !== 1
                    ? {
                        background: styles.button.background,
                        backgroundDark: styles.button.backgroundDark,
                        border: styles.button.border,
                        borderDark: styles.button.borderDark,
                        boxShadow: styles.button.boxShadow,
                        boxShadowDark: styles.button.boxShadowDark,
                      }
                    : {}
                }
              >
                <FaArrowLeft className="h-5 w-5 mobile:h-4 mobile:w-4" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                  window.scrollTo(0, 0)
                }}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-white dark:text-gray-100 hover:bg-indigo-700 dark:hover:bg-blue-600"}`}
                style={
                  currentPage !== totalPages
                    ? {
                        background: styles.button.background,
                        backgroundDark: styles.button.backgroundDark,
                        border: styles.button.border,
                        borderDark: styles.button.borderDark,
                        boxShadow: styles.button.boxShadow,
                        boxShadowDark: styles.button.boxShadowDark,
                      }
                    : {}
                }
              >
                <FaArrowRight className="h-5 w-5 mobile:h-4 mobile:w-4" />
              </button>
            </div>
          )}

          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            {selectedProduct && (
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-3 max-w-md w-full sm:max-w-lg">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">
                  Product Details
                </h2>
                <div className="space-y-4 mobile:space-y-2">
                  <div className="flex justify-center">
                    {selectedProduct.images.length > 0 ? (
                      selectedProduct.images.map((media, idx) =>
                        renderMedia(media, idx, "h-24 w-24 mobile:h-sm mobile:w-sm"),
                      )
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">No media</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 mobile:grid-cols-2 gap-4 mobile:gap-2">
                    {[
                      "product_type",
                      "serial_number",
                      "productname",
                      "price",
                        "dprice",       // ✅ show direct price

                      "per",
                      "discount",
                      "box_count",
                      "status",
                      "description",
                    ].map((field) => (
                      <div key={field} className={field === "description" ? "sm:col-span-2" : ""}>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {capitalize(field.replace("_", " "))}:
                        </span>
                        <span className="ml-2 text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
{field === "price" || field === "dprice"
                            ? `₹${Number.parseFloat(selectedProduct[field]).toFixed(2)}`
                            : field === "discount"
                              ? `${Number.parseFloat(selectedProduct[field]).toFixed(2)}%`
                              : field === "description"
                                ? selectedProduct[field] || "No"
                                : field === "box_count"
                                  ? selectedProduct[field]
                                  : capitalize(selectedProduct[field])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 mobile:mt-3 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
                    style={{
                      background: styles.button.background,
                      backgroundDark: styles.button.backgroundDark,
                      border: styles.button.border,
                      borderDark: styles.button.borderDark,
                      boxShadow: styles.button.boxShadow,
                      boxShadowDark: styles.button.boxShadowDark,
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>

          <Modal
            isOpen={editModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            {renderModalForm(true)}
          </Modal>

          <Modal
            isOpen={addModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/30"
          >
            {renderModalForm(false)}
          </Modal>

          <Modal
            isOpen={deleteModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-3 max-w-sm w-full">
              <div className="flex items-center justify-center mb-4">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 h-8 w-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">
                Would you like to delete the product?
              </h2>
              <div className="flex justify-center space-x-4 mobile:space-x-2">
                <button
                  onClick={() => handleDelete(productToDelete)}
                  className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-red-700 dark:hover:bg-gray-600"
                  style={{
                    background: styles.button.background
                      .replace("2,132,199", "220,38,38")
                      .replace("14,165,233", "239,68,68"),
                    backgroundDark: styles.button.backgroundDark
                      .replace("59,130,246", "220,38,38")
                      .replace("37,99,235", "200,35,35"),
                    border: styles.button.border.replace("125,211,252", "252,165,165"),
                    borderDark: styles.button.borderDark.replace("147,197,253", "252,165,165"),
                    boxShadow: styles.button.boxShadow.replace("2,132,199", "220,38,38"),
                    boxShadowDark: styles.button.boxShadowDark.replace("59,130,246", "220,38,38"),
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={closeModal}
                  className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-dark dark:hover:bg-gray-600"
                  style={{
                    background: styles.button.background,
                    backgroundDark: styles.button.backgroundDark,
                    border: styles.button.borderDark,
                    boxShadow: styles.button.boxShadow,
                    boxShadowDark: styles.button.boxShadowDark,
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={confirmRateChangeModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-3 max-w-sm w-full">
              <div className="flex items-center justify-center mb-4">
                <FaExclamationTriangle className="text-blue-600 dark:text-blue-400 h-8 w-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">
                Would you like to change the rate of the product?
              </h2>
              <div className="flex justify-center space-x-4 mobile:space-x-2">
                <button
                  onClick={() => {
                    setConfirmRateChangeModalIsOpen(false)
                    setRateChangeModalIsOpen(true)
                  }}
                  className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
                  style={{
                    background: styles.button.background,
                    backgroundDark: styles.button.backgroundDark,
                    border: styles.button.border,
                    borderDark: styles.button.borderDark,
                    boxShadow: styles.button.boxShadow,
                    boxShadowDark: styles.button.boxShadowDark,
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    setConfirmRateChangeModalIsOpen(false)
                    generatePDF()
                  }}
                  className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
                  style={{
                    background: styles.button.background,
                    backgroundDark: styles.button.backgroundDark,
                    border: styles.button.borderDark,
                    boxShadow: styles.button.boxShadow,
                    boxShadowDark: styles.button.boxShadowDark,
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={rateChangeModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            {renderRateChangeModal()}
          </Modal>
        </div>
      </div>
      <style>{`
        .line-height-2 { display: -webkit-box; -webkit-line-height: 2; -webkit-box-orientation: vertical; overflow: hidden; }
        [style*="backgroundDark"] { background: var(--background-dark bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --background-dark: var(--bg-dark, ${styles.input.backgroundDark}); } 
        [style*="borderDark"] { border: var(--border-dark, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border-dark: var(--border-dark, ${styles.input.borderDark}); } 
        [style*="box-shadowDark"] { box-shadow: var(--shadow-dark box-shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow-dark: var(--shadow-dark, ${styles.button.boxShadowDark}); } 
      `}</style>
    </div>
  )
}