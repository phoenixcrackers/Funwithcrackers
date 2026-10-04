import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import Select from 'react-select';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaDownload, FaTrash, FaSearch, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';

Modal.setAppElement("#root");

const customSelectStyles = {
  control: (base, { isFocused }) => ({
    ...base,
    minHeight: 42,
    fontSize: "0.875rem",
    borderRadius: "8px",
    background: "#ffffff",
    borderColor: isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: isFocused ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    "&:hover": { borderColor: "#3b82f6" },
  }),
  menu: (base) => ({
    ...base, zIndex: 9999, borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb", overflow: "hidden",
  }),
  singleValue: (base) => ({ ...base, color: "#111827", fontWeight: 500, fontSize: "0.875rem" }),
  option: (base, { isFocused, isSelected }) => ({
    ...base, fontSize: "0.875rem",
    background: isSelected ? "#3b82f6" : isFocused ? "#eff6ff" : "#fff",
    color: isSelected ? "#fff" : "#111827",
    fontWeight: isSelected ? 600 : 400,
    cursor: "pointer",
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "0.875rem" }),
  clearIndicator: (base) => ({ ...base, color: "#9ca3af", "&:hover": { color: "#ef4444" } }),
  dropdownIndicator: (base) => ({ ...base, color: "#9ca3af" }),
  indicatorSeparator: (base) => ({ ...base, background: "#e5e7eb" }),
};

const getEffectivePrice = (item) => Math.round(Number(item?.price) || 0);

const isExcludedFromBulk = (item = {}) => {
  const type = (item.product_type || '').trim().toLowerCase();
  const initDisc = parseFloat(item.initialDiscount !== undefined ? item.initialDiscount : item.discount);
  return type === 'net_rate' || type === 'netrate' || isNaN(initDisc) || initDisc <= 0;
};

const applyBulkDiscount = (cartArr = [], discountValue = 0) =>
  cartArr.map((item) => {
    if (isExcludedFromBulk(item)) return item;
    const resolvedDiscount = discountValue > 0 ? discountValue : (parseFloat(item.initialDiscount) || 0);
    return { ...item, discount: resolvedDiscount };
  });

const calculateNetRate = (targetCart = []) =>
  targetCart.reduce((total, item) => total + getEffectivePrice(item) * (item.quantity || 1), 0).toFixed(2);

const calculateYouSave = (targetCart = []) =>
  targetCart.reduce((total, item) => total + getEffectivePrice(item) * ((parseFloat(item.discount) || 0) / 100) * (item.quantity || 1), 0).toFixed(2);

const calculateTotal = (targetCart = [], extraDiscount = 0) => {
  const total = targetCart.reduce((sum, item) => {
    const lineAfterDiscount = getEffectivePrice(item) * (1 - (parseFloat(item.discount) || 0) / 100) * (item.quantity || 1);
    const lineTotal = isExcludedFromBulk(item) ? lineAfterDiscount : lineAfterDiscount * (1 - extraDiscount / 100);
    return sum + lineTotal;
  }, 0);
  return total.toFixed(2);
};

const FieldLabel = ({ children, accent }) => (
  <label className={`block text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5 ${accent || "text-gray-500"}`}>
    {children}
  </label>
);

const SummaryChip = ({ label, value, color, large }) => {
  const colorMap = {
    "#64748b": "text-gray-500",
    "#10b981": "text-emerald-500",
    "#f59e0b": "text-amber-500",
    "#94a3b8": "text-gray-400",
    "#6366f1": "text-blue-600",
  };
  const textColor = colorMap[color] || "text-gray-600";
  return (
    <div className="text-right">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</div>
      <div className={`font-bold tabular-nums ${large ? "text-xl" : "text-sm"} ${textColor}`}>{value}</div>
    </div>
  );
};

const CartInput = ({ value, onChange, onKeyDown, inputRef, accentCls, suffix }) => (
  <div className="relative inline-flex items-center">
    <input
      type="number"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      ref={inputRef}
      style={{ width: 72 }}
      className={`h-8 px-2 text-center text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-md outline-none transition-all duration-150 tabular-nums ${accentCls || "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
    />
    {suffix && (
      <span className="absolute right-2 text-[10px] font-bold text-gray-400 pointer-events-none">{suffix}</span>
    )}
  </div>
);

const QuotationTable = ({
  cart = [], products = [],
  addToCart, updateQuantity, updateDiscount, updatePrice, removeFromCart,
  calculateNetRate, calculateYouSave, calculateTotal,
  additionalDiscount, setAdditionalDiscount,
  changeDiscount, setChangeDiscount, openNewProductModal,
  lastAddedProduct, setLastAddedProduct, setCart,
}) => {
  const quantityInputRefs = useRef({});
  const productSelectRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const [productQuery, setProductQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (lastAddedProduct) {
      const key = `${lastAddedProduct.id}-${lastAddedProduct.product_type}`;
      const input = quantityInputRefs.current[key];
      if (input) { input.focus(); input.select(); setLastAddedProduct(null); }
    }
  }, [lastAddedProduct, setLastAddedProduct]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); productSelectRef.current?.focus(); }
  };

  const handleChangeDiscount = (value) => {
    const val = value === '' ? 0 : Math.max(0, Math.min(100, parseFloat(value) || 0));
    setChangeDiscount(val);
    const updatedCart = applyBulkDiscount(cart, val);
    setCart(updatedCart);
  };

  const total = parseFloat(calculateTotal(cart, additionalDiscount));

  const filteredProducts = productQuery.trim()
    ? products.filter((p) => {
        const q = productQuery.toLowerCase();
        return (
          (p.productname || '').toLowerCase().includes(q) ||
          (p.product_type || '').toLowerCase().includes(q) ||
          (p.serial_number || '').toLowerCase().includes(q)
        );
      })
    : products;

  const handleProductClick = (product) => {
    addToCart(product);
    setProductQuery("");
    setShowDropdown(false);
  };

  return (
    <div className="space-y-4">
      <div ref={searchWrapperRef} className="relative">
        <FieldLabel>Search & Add Products</FieldLabel>
        <input
          type="text"
          ref={productSelectRef}
          value={productQuery}
          onChange={(e) => { setProductQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Click to browse products, or type name / code / category to filter…"
          className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
        />
        {showDropdown && (
          <div className="mt-2 border border-gray-200 rounded-xl max-h-80 overflow-y-auto bg-white shadow-2xl absolute z-30 w-full p-3">
            {filteredProducts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {filteredProducts.map((p) => {
                  const initDisc = parseFloat(p.discount) || 0;
                  return (
                    <button
                      key={`${p.id}-${p.product_type}`}
                      type="button"
                      onClick={() => handleProductClick(p)}
                      className="text-left p-2.5 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/70 transition-all duration-150 flex flex-col justify-between group bg-white shadow-xs cursor-pointer"
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-blue-700" title={p.productname}>
                            {p.serial_number ? `[${p.serial_number}] ` : ''}{p.productname}
                          </span>
                          {initDisc > 0 && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex-shrink-0">
                              {initDisc}%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 capitalize truncate">
                          {(p.product_type || '').replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-gray-50 w-full">
                        <span className="text-xs font-bold text-blue-600">₹{getEffectivePrice(p)}</span>
                        <span className="text-[10px] font-semibold text-gray-400">/ {p.per || 'Unit'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-6 text-sm text-gray-400 text-center">No matching products found</div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => openNewProductModal()}
          className="h-[40px] px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-150 whitespace-nowrap cursor-pointer"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Custom Product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <FieldLabel accent="text-amber-500">Additional Discount (%)</FieldLabel>
          <div className="relative">
            <input
              type="number"
              value={additionalDiscount || ''}
              onChange={(e) => setAdditionalDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              placeholder="0"
              min="0" max="100" step="1"
              className="w-full h-9 pl-3 pr-8 rounded-md border border-gray-200 text-sm font-semibold text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <FieldLabel accent="text-blue-500">Bulk Change Discount (%)</FieldLabel>
          <div className="relative">
            <input
              type="number"
              value={changeDiscount || ''}
              onChange={(e) => handleChangeDiscount(e.target.value)}
              placeholder="0"
              min="0" max="100" step="1"
              className="w-full h-9 pl-3 pr-8 rounded-md border border-gray-200 text-sm font-semibold text-gray-800 bg-gray-50 outline-none transition-all duration-150 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
          </div>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-14 bg-gray-50">
          <span className="text-3xl opacity-40">🛒</span>
          <p className="text-sm text-gray-400 font-medium">Cart is empty — add products above</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto hundred:max-w-full tab:max-w-full mobile:max-w-xs">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Product", "Price (₹)", "Discount", "Qty", "Total", ""].map((h, i) => (
                    <th key={i} className={`px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap ${i === 0 || i === 6 ? "text-center" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((item, index) => {
                  const lineTotal = Math.round(getEffectivePrice(item) * (1 - (parseFloat(item.discount) || 0) / 100) * (item.quantity || 1));
                  const excluded = isExcludedFromBulk(item);
                  return (
                    <tr key={`${item.id}-${item.product_type}`} className="hover:bg-blue-50/40 transition-colors duration-100 group">
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-300 tabular-nums">{index + 1}</td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <div className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.productname}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {item.product_type}{item.serial_number ? ` · ${item.serial_number}` : ""}
                          {excluded && <span className="ml-1 text-red-400 font-semibold">· excluded</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <CartInput
                          value={getEffectivePrice(item)}
                          onChange={(e) => updatePrice(item.id, item.product_type, parseFloat(e.target.value) || 0)}
                          accentCls="focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <CartInput
                          value={item.discount}
                          onChange={(e) => updateDiscount(item.id, item.product_type, parseFloat(e.target.value) || 0)}
                          accentCls="focus:border-amber-400 focus:ring-2 focus:ring-amber-100 pr-5"
                          suffix="%"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <CartInput
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, item.product_type, parseInt(e.target.value) || 0)}
                          onKeyDown={handleQuantityKeyDown}
                          inputRef={(el) => (quantityInputRefs.current[`${item.id}-${item.product_type}`] = el)}
                          accentCls="focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-bold text-gray-800 tabular-nums">₹{lineTotal.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.product_type)}
                          className="w-7 h-7 rounded-md border text-white text-xs font-bold bg-red-500 border-red-500 transition-all duration-150 hover:bg-red-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
            <div className="flex justify-end items-end flex-wrap gap-5">
              <SummaryChip label="Net Rate" value={`₹${parseFloat(calculateNetRate(cart)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#64748b" />
              <SummaryChip label="You Save" value={`₹${parseFloat(calculateYouSave(cart)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#10b981" />
              {additionalDiscount > 0 && <SummaryChip label="Extra Discount" value={`${additionalDiscount}%`} color="#f59e0b" />}
              <div className="text-right pl-5 border-l border-gray-200">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Grand Total</div>
                <div className="text-2xl font-extrabold text-blue-600 tabular-nums">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NewProductModal = ({ isOpen, onClose, onSubmit, newProductData, setNewProductData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localProductData, setLocalProductData] = useState(newProductData);

  useEffect(() => { setLocalProductData(newProductData); }, [newProductData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...localProductData,
      [name]: ['price', 'discount', 'quantity'].includes(name) ? (value === '' ? '' : parseFloat(value) || 0) : value,
    };
    setLocalProductData(updatedData);
    setNewProductData(updatedData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try { await onSubmit(localProductData); onClose(); }
    catch (err) { console.error('NewProductModal error:', err); }
    finally { setIsSubmitting(false); }
  };

  const fields = [
    { name: "productname", label: "Product Name", type: "text", placeholder: "e.g. Ground Chakkar", required: true, full: true },
    { name: "price",       label: "Price (₹)",    type: "number", placeholder: "0", min: 0, step: 1, required: true },
    { name: "discount",    label: "Discount (%)",  type: "number", placeholder: "0", min: 0, max: 100, step: 0.01 },
    { name: "quantity",    label: "Quantity",      type: "number", placeholder: "1", min: 1, step: 1, required: true },
    { name: "per",          label: "Unit",          type: "text",   placeholder: "Box / Piece" },
    { name: "product_type",label: "Product Type",  type: "text",   placeholder: "custom", required: true },
  ];

  const isValid = localProductData.productname && localProductData.price !== '' && localProductData.quantity !== '' && localProductData.product_type;

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} className="fixed inset-0 flex items-center justify-center p-4 z-50" overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Add Custom Product</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors text-sm">✕</button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3.5">
            {fields.map(({ name, label, type, placeholder, min, max, step, required, full }) => (
              <div key={name} className={full ? "col-span-2" : "col-span-1"}>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <input
                  name={name} type={type} value={localProductData[name] || ''} onChange={handleInputChange}
                  placeholder={placeholder}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-800 bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  {...(min !== undefined ? { min } : {})} {...(max !== undefined ? { max } : {})} {...(step !== undefined ? { step } : {})}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || !isValid}
            className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all duration-150
              ${isSubmitting || !isValid ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-sm"}`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Modal>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    booked:     "text-sky-600 bg-sky-50 border-sky-200",
    paid:       "text-amber-600 bg-amber-50 border-amber-200",
    dispatched: "text-emerald-600 bg-emerald-50 border-emerald-200",
    delivered:  "text-emerald-700 bg-emerald-100 border-emerald-300",
  };
  const icons = {
    booked: "⏳ Booked",
    paid: "💰 Paid",
    dispatched: "🚚 Dispatched",
    delivered: "✓ Delivered",
  };
  const cls = map[status?.toLowerCase()] || "text-slate-400 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {icons[status?.toLowerCase()] || status}
    </span>
  );
};

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active    ? "bg-indigo-600 border-indigo-600 text-white"
      : disabled  ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                  : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}
  >
    {label}
  </button>
);

const ModalWrapper = ({ children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
      {children}
    </div>
  </div>
);

const selectStyles = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border";

export default function Tracking() {
  const [bookings, setBookings] = useState([]);
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);
  const ordersPerPage = 12;
  const amountPaidRef = useRef(null);
  const transactionIdRef = useRef(null);

  // Edit Bill States
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [modalSelectedCustomer, setModalSelectedCustomer] = useState(null);
  const [modalCart, setModalCart] = useState([]);
  const [modalAdditionalDiscount, setModalAdditionalDiscount] = useState(0);
  const [modalChangeDiscount, setModalChangeDiscount] = useState(0);
  const [modalLastAddedProduct, setModalLastAddedProduct] = useState(null);
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);
  const [newProductModalIsOpen, setNewProductModalIsOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({ productname: '', price: '', discount: 0, quantity: 1, per: '', product_type: 'custom' });
  const [editError, setEditError] = useState('');

  // Fetch customers and products for editing
  useEffect(() => {
    const fetchDirectData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/direct/customers`),
          axios.get(`${API_BASE_URL}/api/direct/aproducts`),
        ]);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
        const validProducts = Array.isArray(prodRes.data)
          ? prodRes.data
              .filter(p => p != null && typeof p === 'object' && typeof p.id !== 'undefined')
              .map(p => ({
                ...p,
                price: Number(p.price) || 0,
                discount: p.discount !== undefined && p.discount !== null ? parseFloat(p.discount) || 0 : 0
              }))
          : [];
        setProducts(validProducts);
      } catch (err) {
        console.error('Failed to load customers or products for editing in Tracking:', err);
      }
    };
    fetchDirectData();
  }, []);

  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setEditError("");
    setModalAdditionalDiscount(parseFloat(booking.additional_discount) || 0);
    setModalChangeDiscount(0);

    let parsedProds = [];
    try {
      parsedProds = typeof booking.products === 'string' ? JSON.parse(booking.products) : (booking.products || []);
    } catch {
      parsedProds = [];
    }

    const mappedCart = Array.isArray(parsedProds) ? parsedProds.map((p, idx) => ({
      ...p,
      id: p.id || `custom-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      productname: p.productname || 'Custom Product',
      product_type: p.product_type || 'custom',
      price: Math.round(Number(p.price) || 0),
      discount: parseFloat(p.discount) || 0,
      initialDiscount: parseFloat(p.initialDiscount !== undefined ? p.initialDiscount : p.discount) || 0,
      quantity: parseInt(p.quantity) || 1,
      per: p.per || 'Unit',
      serial_number: p.serial_number || undefined,
    })) : [];
    setModalCart(mappedCart);

    const foundCustomer = customers.find(c => c.id?.toString() === booking.customer_id?.toString()) ||
                          customers.find(c => c.name?.toLowerCase() === booking.customer_name?.toLowerCase());

    if (foundCustomer) {
      setModalSelectedCustomer({
        value: foundCustomer.id.toString(),
        label: `${foundCustomer.name} (${foundCustomer.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : foundCustomer.customer_type || "User"} - ${foundCustomer.district || "N/A"})`,
      });
    } else {
      setModalSelectedCustomer({
        value: booking.customer_id?.toString() || 'existing',
        label: `${booking.customer_name || 'Customer'} (${booking.customer_type || 'User'} - ${booking.district || 'N/A'})`,
      });
    }

    setEditModalIsOpen(true);
  };

  const addToCart = (directProduct = null, customProduct = null) => {
    let product;
    if (customProduct) {
      const baseDiscount = parseFloat(customProduct.discount) || 0;
      const isNet = (customProduct.product_type || '').toLowerCase() === 'net_rate' || (customProduct.product_type || '').toLowerCase() === 'netrate' || baseDiscount <= 0;
      const resolvedDiscount = isNet ? 0 : (modalChangeDiscount > 0 ? modalChangeDiscount : baseDiscount);
      product = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productname: customProduct.productname,
        product_type: customProduct.product_type || 'custom',
        price: Math.round(Number(customProduct.price) || 0),
        quantity: parseInt(customProduct.quantity) || 1,
        discount: resolvedDiscount,
        initialDiscount: baseDiscount,
        per: customProduct.per || 'Unit',
      };
    } else if (directProduct) {
      const baseDiscount = directProduct.discount !== undefined && directProduct.discount !== null
        ? parseFloat(directProduct.discount) : 0;
      const cleanBaseDiscount = isNaN(baseDiscount) ? 0 : baseDiscount;
      const isNet = (directProduct.product_type || '').toLowerCase() === 'net_rate' || (directProduct.product_type || '').toLowerCase() === 'netrate' || cleanBaseDiscount <= 0;
      const resolvedDiscount = isNet ? 0 : (modalChangeDiscount > 0 ? modalChangeDiscount : cleanBaseDiscount);

      product = {
        ...directProduct,
        id: directProduct.id,
        price: Math.round(Number(directProduct.price) || 0),
        quantity: 1,
        discount: resolvedDiscount,
        initialDiscount: cleanBaseDiscount,
        per: directProduct.per || 'Unit',
      };
    } else {
      return;
    }

    setModalCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.product_type === product.product_type);
      return exists
        ? prev.map(item => item.id === product.id && item.product_type === product.product_type ? { ...item, quantity: item.quantity + 1 } : item)
        : [product, ...prev];
    });
    setModalLastAddedProduct({ id: product.id, product_type: product.product_type });
    setEditError("");
  };

  const updateQuantity = (id, type, qty) => {
    setModalCart(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, quantity: qty < 0 ? 0 : qty } : item));
  };

  const updateDiscount = (id, type, disc) => {
    setModalCart(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, discount: disc < 0 ? 0 : disc > 100 ? 100 : disc } : item));
  };

  const updatePrice = (id, type, price) => {
    setModalCart(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, price: price < 0 ? 0 : price } : item));
  };

  const removeFromCart = (id, type) => {
    setModalCart(prev => prev.filter(item => !(item.id === id && item.product_type === type)));
  };

  const handleAddNewProduct = (productData) => {
    if (!productData.productname) { setEditError("Product name is required"); return; }
    if (productData.price === '' || productData.price < 0) { setEditError("Price must be a non-negative number"); return; }
    if (productData.quantity === '' || productData.quantity < 1) { setEditError("Quantity must be at least 1"); return; }
    if (productData.discount < 0 || productData.discount > 100) { setEditError("Discount must be between 0 and 100"); return; }
    if (!productData.product_type) { setEditError("Product type is required"); return; }

    addToCart(null, productData);
    setNewProductModalIsOpen(false);
    setNewProductData({ productname: '', price: '', discount: 0, quantity: 1, per: '', product_type: 'custom' });
  };

  const handleSaveEditBooking = async () => {
    if (!editingBooking) return;
    if (!modalCart || modalCart.length === 0) {
      setEditError("Please add at least one product to the bill.");
      return;
    }
    if (modalCart.some(item => !item.quantity || item.quantity <= 0)) {
      setEditError("Please remove products with zero quantity or enter valid quantities.");
      return;
    }

    setIsUpdatingBill(true);
    setEditError("");

    try {
      const netRateNum = parseFloat(calculateNetRate(modalCart));
      const youSaveNum = parseFloat(calculateYouSave(modalCart));
      const totalNum = parseFloat(calculateTotal(modalCart, modalAdditionalDiscount));
      const addDiscNum = parseFloat(modalAdditionalDiscount) || 0;

      const customerId = modalSelectedCustomer?.value && modalSelectedCustomer.value !== 'existing'
        ? Number(modalSelectedCustomer.value)
        : editingBooking.customer_id;

      const payload = {
        customer_id: customerId,
        products: modalCart.map(item => ({
          id: item.id,
          product_type: item.product_type || 'custom',
          productname: item.productname,
          price: getEffectivePrice(item),
          discount: parseFloat(item.discount) || 0,
          quantity: parseInt(item.quantity) || 0,
          per: item.per || 'Unit',
          serial_number: item.serial_number || undefined,
        })),
        net_rate: netRateNum,
        you_save: youSaveNum,
        total: totalNum,
        additional_discount: addDiscNum,
        promo_discount: 0,
      };

      await axios.put(`${API_BASE_URL}/api/direct/bookings/${editingBooking.order_id}`, payload);

      const newCust = customers.find(c => c.id.toString() === modalSelectedCustomer?.value);

      const updatedBooking = {
        ...editingBooking,
        products: payload.products,
        net_rate: netRateNum,
        you_save: youSaveNum,
        total: totalNum,
        additional_discount: addDiscNum,
        ...(newCust ? {
          customer_id: newCust.id,
          customer_name: newCust.name,
          customer_type: newCust.customer_type,
          mobile_number: newCust.mobile_number,
          district: newCust.district,
          state: newCust.state,
          address: newCust.address,
          email: newCust.email,
        } : {})
      };

      setBookings(prev => prev.map(b => b.order_id === editingBooking.order_id ? updatedBooking : b));

      toast.success("Bill updated successfully!", { position: "top-center", autoClose: 4000 });
      setEditModalIsOpen(false);

      // Set target for invoice download
      setDownloadTarget(updatedBooking);
      setShowDownloadModal(true);

    } catch (err) {
      console.error("Failed to update booking bill:", err);
      setEditError(err.response?.data?.message || err.message || "Failed to update bill");
    } finally {
      setIsUpdatingBill(false);
    }
  };

  useEffect(() => {
    if (showDetailsModal) {
      setTimeout(() => {
        if (amountPaidRef.current) {
          amountPaidRef.current.focus();
        }
      }, 150);
    }
  }, [showDetailsModal]);

  const fetchBookings = async (resetPage = false) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
        params: { status: filterStatus || undefined, customerType: filterCustomerType || undefined }
      });
      const sortedBookings = response.data.sort((a, b) => b.id - a.id);
      setBookings(sortedBookings);
      setError('');
      if (resetPage) setCurrentPage(1);
    } catch {
      setError('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings(true);
    const interval = setInterval(() => fetchBookings(false), 100000);
    return () => clearInterval(interval);
  }, [filterStatus, filterCustomerType]);

  const handleStatusChange = (id, newStatus, total) => {
    if (newStatus === 'paid') {
      setSelectedBookingId(id);
      setSelectedTotal(total || 0);
      setShowPaidModal(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  const updateStatus = async (id, newStatus, paymentDetails = null) => {
    try {
      const payload = { status: newStatus };
      if (paymentDetails) {
        payload.payment_method = paymentDetails.paymentMethod;
        payload.transaction_id = paymentDetails.transactionId || null;
        payload.amount_paid = paymentDetails.amountPaid;
      }
      await axios.put(`${API_BASE_URL}/api/tracking/bookings/${id}/status`, payload);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id
            ? {
                ...booking,
                status: newStatus,
                ...(paymentDetails && {
                  payment_method: paymentDetails.paymentMethod,
                  transaction_id: paymentDetails.transactionId,
                  amount_paid: paymentDetails.amountPaid
                })
              }
            : booking
        ).sort((a, b) => b.id - a.id)
      );

      setError('');
      setShowPaidModal(false);
      setShowDetailsModal(false);
      resetPaymentForm();
      toast.success("Status updated successfully", { position: "top-center", autoClose: 5000 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const resetPaymentForm = () => {
    setPaymentMethod('cash');
    setTransactionId('');
    setAmountPaid('');
    setSelectedTotal(0);
  };

  const handleFillDetails = () => {
    setShowPaidModal(false);
    setShowDetailsModal(true);
  };

  const handleDetailsSubmit = () => {
    if (!amountPaid.trim() || isNaN(amountPaid) || Number(amountPaid) <= 0) {
      setError('Please enter a valid amount paid');
      return;
    }
    if (paymentMethod === 'bank' && !transactionId.trim()) {
      setError('Transaction ID is required for bank transactions');
      return;
    }

    updateStatus(selectedBookingId, 'paid', {
      paymentMethod,
      transactionId: paymentMethod === 'bank' ? transactionId : null,
      amountPaid: Number(amountPaid)
    });
  };

  const generateBillPDF = async (booking) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/direct/invoice/${booking.order_id}`, { responseType: 'blob' });
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeCustomerName = (booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      link.setAttribute('download', `${safeCustomerName}-${booking.order_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded estimate bill, check downloads", { position: "top-center", autoClose: 5000 });
    } catch (err) {
      toast.error("Failed to download PDF. Please try again.", { position: "top-center", autoClose: 5000 });
    }
  };

  const generatePackingPDF = async (booking) => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const marginL = 14;
      const contentW = pageW - marginL * 2;

      // Blue color scheme
      const brandBlue = [0, 102, 204];      // Main blue
      const darkBlue = [13, 71, 161];
      const lightBlue = [33, 150, 243];

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brandBlue);
      doc.text('PHOENIX CRACKERS', pageW / 2, 18, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('www.funwithcrackers.com  |  +91 63836 59214  |  nivasramasamy27@gmail.com', 
               pageW / 2, 25, { align: 'center' });

      doc.setDrawColor(...brandBlue);
      doc.setLineWidth(0.8);
      doc.line(marginL, 29, marginL + contentW, 29);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('PACKING SLIP', marginL, 38);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.4);
      doc.line(marginL, 41, marginL + contentW, 41);

      const boxY = 46;
      const boxH = 52;
      const halfW = contentW / 2 - 4;

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.rect(marginL, boxY, halfW, boxH);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(150, 150, 150);
      doc.text('FROM', marginL + 4, boxY + 7);
      doc.setFontSize(9);
      doc.setTextColor(...darkBlue);
      doc.text('Phoenix Crackers', marginL + 4, boxY + 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('Sivakasi, Tamil Nadu', marginL + 4, boxY + 24);
      doc.text('+91 63836 59214', marginL + 4, boxY + 32);
      doc.text('nivasramasamy27@gmail.com', marginL + 4, boxY + 40);

      const shipX = marginL + halfW + 8;
      doc.rect(shipX, boxY, halfW, boxH);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(150, 150, 150);
      doc.text('SHIP TO', shipX + 4, boxY + 7);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(booking.customer_name || 'N/A', shipX + 4, boxY + 16, { width: halfW - 8 });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      let addr = booking.address || '';
      if (addr.length > 40) addr = addr.substring(0, 37) + '…';
      doc.text(addr, shipX + 4, boxY + 24, { width: halfW - 8 });
      const distState = [booking.district, booking.state].filter(Boolean).join(', ');
      doc.text(distState, shipX + 4, boxY + 32);
      doc.text(`Mobile: ${booking.mobile_number || 'N/A'}`, shipX + 4, boxY + 40);

      const metaY = boxY + boxH + 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Order ID:`, marginL, metaY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(booking.order_id || 'N/A', marginL + 20, metaY);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.4);
      doc.line(marginL, metaY + 4, marginL + contentW, metaY + 4);

      let products = [];
      try {
        products = typeof booking.products === 'string' ? JSON.parse(booking.products) : (booking.products || []);
      } catch { products = []; }

      const tableRows = products.map((p, i) => [i + 1, p.productname || 'N/A', p.quantity || 1]);

      autoTable(doc, {
        startY: metaY + 10,
        head: [['Sl.No', 'Product Name', 'Quantity']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: {
          fillColor: [255, 255, 255], 
          textColor: [...darkBlue], 
          fontStyle: 'bold',
          halign: 'center', 
          lineColor: [200, 200, 200], 
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 28, halign: 'center' },
        },
        alternateRowStyles: { fillColor: [240, 248, 255] }, // Light blue tint
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setDrawColor(...brandBlue);
      doc.setLineWidth(0.6);
      doc.line(marginL, finalY, marginL + contentW, finalY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('Thank you for your business with Phoenix Crackers, Sivakasi', 
               pageW / 2, finalY + 7, { align: 'center' });

      const safeCustomerName = (booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      doc.save(`${safeCustomerName}-${booking.order_id}-packing.pdf`);
      toast.success("Packing slip downloaded!", { position: "top-center", autoClose: 5000 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate packing slip.", { position: "top-center", autoClose: 5000 });
    }
  };

  const handleDownloadClick = (booking) => {
    setDownloadTarget(booking);
    setShowDownloadModal(true);
  };

  const handleDownloadChoice = async (type) => {
    setShowDownloadModal(false);
    if (!downloadTarget) return;
    if (type === 'bill') await generateBillPDF(downloadTarget);
    else await generatePackingPDF(downloadTarget);
    setDownloadTarget(null);
  };

  const handleDeleteBooking = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tracking/bookings/${selectedOrderId}`);
      setBookings((prev) => prev.filter((booking) => booking.order_id !== selectedOrderId));
      setShowDeleteModal(false);
      toast.success("Booking deleted successfully", { position: "top-center", autoClose: 5000 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete booking');
      setShowDeleteModal(false);
    }
  };

  const getISTDateString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = ['customer_name', 'order_id', 'total', 'customer_type'].some((key) =>
      booking[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (filterDate) {
      const bookingISTDate = getISTDateString(booking.created_at);
      matchesDate = bookingISTDate === filterDate;
    }

    return matchesSearch && matchesDate;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return `${String(istDate.getDate()).padStart(2, '0')}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${istDate.getFullYear()}`;
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredBookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tracking</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Monitor and manage all bookings</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectStyles}>
                  <option value="">All Statuses</option>
                  <option value="booked">Booked</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Customer Type</label>
                <select value={filterCustomerType} onChange={(e) => setFilterCustomerType(e.target.value)} className={selectStyles}>
                  <option value="">All Customer Types</option>
                  <option value="Customer">Customer</option>
                  <option value="Agent">Agent</option>
                  <option value="Customer of Selected Agent">Customer of Selected Agent</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={selectStyles}
                />
              </div>
              <div className="flex-1 min-w-64">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Name, order ID, total, type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                  />
                </div>
              </div>
            </div>
          </div>

          {currentOrders.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mb-6">
              {currentOrders.map((booking) => (
                <div key={booking.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-extrabold text-indigo-500 tracking-wide">{booking.order_id}</div>
                      <div className="text-base font-bold text-slate-800 mt-0.5">{booking.customer_name}</div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{parseFloat(booking.total || 0).toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      ["📍 District", booking.district || "N/A"],
                      ["🏛️ State", booking.state || "N/A"],
                      ["👤 Type", booking.customer_type],
                      ["📅 Date", formatDate(booking.created_at)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg px-2.5 py-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>

                  {(booking.amount_paid || booking.payment_method || booking.transaction_id) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4 space-y-1">
                      {booking.amount_paid && <p className="text-xs text-slate-700"><span className="font-bold text-amber-600">Amount Paid:</span> ₹{booking.amount_paid}</p>}
                      {booking.payment_method && <p className="text-xs text-slate-700"><span className="font-bold text-amber-600">Method:</span> {booking.payment_method}</p>}
                      {booking.transaction_id && <p className="text-xs text-slate-700"><span className="font-bold text-amber-600">Txn ID:</span> {booking.transaction_id}</p>}
                    </div>
                  )}

                  {booking.mobile_number && (
                    <a href={`tel:${booking.mobile_number}`} className="block text-xs font-semibold text-indigo-500 hover:text-indigo-700 mb-4 transition-colors">
                      📞 {booking.mobile_number}
                    </a>
                  )}

                  {booking.status?.toLowerCase() === 'booked' && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Update Status</label>
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value, booking.total)}
                        className={selectStyles}
                      >
                        <option value="">— Change Status —</option>
                        <option value="booked">Booked</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(booking)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200 cursor-pointer"
                    >
                      <FaEdit className="text-xs" /> Edit Bill
                    </button>
                    <button
                      onClick={() => handleDownloadClick(booking)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200 cursor-pointer"
                    >
                      <FaDownload className="text-xs" /> Download
                    </button>
                    <button
                      onClick={() => { setSelectedOrderId(booking.order_id); setShowDeleteModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 cursor-pointer"
                    >
                      <FaTrash className="text-xs" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl mb-6">
              No bookings found
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              <PaginBtn label="← Prev" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginBtn key={page} label={page} onClick={() => setCurrentPage(page)} active={currentPage === page} />
              ))}
              <PaginBtn label="Next →" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
            </div>
          )}
        </div>
      </div>

      {showPaidModal && (
        <ModalWrapper>
          <div className="text-5xl mb-4 text-center">💰</div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2 text-center">Update to Paid?</h2>
          <p className="text-slate-500 text-sm mb-6 text-center">Please fill in the payment details to proceed.</p>
          <div className="flex gap-2.5 justify-center">
            <button onClick={() => setShowPaidModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleFillDetails} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500 transition-all duration-200">Fill Details</button>
          </div>
        </ModalWrapper>
      )}

      {showDetailsModal && (
        <ModalWrapper>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">💳 Payment Details</h2>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm font-medium text-emerald-600">Total Amount</p>
            <p className="text-3xl font-bold text-emerald-700">₹{parseFloat(selectedTotal).toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (e.target.value === 'bank') {
                    setTimeout(() => transactionIdRef.current?.focus(), 0);
                  }
                }}
                className={selectStyles}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transaction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <input
                ref={amountPaidRef}
                type="text"
                inputMode="numeric"
                value={amountPaid ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(val)) setAmountPaid(val);
                }}
                placeholder="Enter amount paid"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
              />
            </div>

            {paymentMethod === 'bank' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  ref={transactionIdRef}
                  type="text"
                  value={transactionId ?? ""}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2.5 justify-end mt-6">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                fetchBookings(false);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDetailsSubmit}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200"
            >
              Submit
            </button>
          </div>
        </ModalWrapper>
      )}

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Download PDF</h2>
            <p className="text-slate-400 text-sm mb-7">Choose the type of PDF to download</p>
            <div className="flex gap-3">
              <button onClick={() => handleDownloadChoice('bill')} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 hover:from-indigo-600">🧾 Bill</button>
              <button onClick={() => handleDownloadChoice('packing')} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-orange-500 to-orange-400 hover:from-orange-600">📦 Packing</button>
            </div>
            <button onClick={() => { setShowDownloadModal(false); setDownloadTarget(null); }} className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ModalWrapper>
          <div className="text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-2.5 text-center">Delete Booking?</h2>
          <p className="text-slate-500 text-sm mb-6 text-center">Are you sure you want to delete this booking? This cannot be undone.</p>
          <div className="flex gap-2.5 justify-center">
            <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50">Keep It</button>
            <button onClick={handleDeleteBooking} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 hover:from-red-600">Yes, Delete</button>
          </div>
        </ModalWrapper>
      )}

      {/* Edit Bill Modal with all options from direct.jsx */}
      <Modal
        isOpen={editModalIsOpen}
        onRequestClose={() => { if (!isUpdatingBill) setEditModalIsOpen(false); }}
        className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Edit Bill — Order #{editingBooking?.order_id}
                </h2>
                <p className="text-xs text-slate-400">
                  Update customer, products, quantities, prices, or discounts
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditModalIsOpen(false)}
              disabled={isUpdatingBill}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {editError && (
              <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                ⚠️ {editError}
              </div>
            )}

            {/* Customer selector */}
            <div>
              <FieldLabel>Customer Details</FieldLabel>
              <Select
                value={modalSelectedCustomer}
                onChange={setModalSelectedCustomer}
                options={customers.map((c) => ({
                  value: c.id.toString(),
                  label: `${c.name} (${c.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : c.customer_type || "User"} - ${c.district || "N/A"})`,
                }))}
                placeholder="Search or change customer…"
                isClearable={false}
                styles={customSelectStyles}
              />
            </div>

            {/* Quotation / Product Table */}
            <QuotationTable
              cart={modalCart}
              products={products || []}
              addToCart={addToCart}
              updateQuantity={updateQuantity}
              updateDiscount={updateDiscount}
              updatePrice={updatePrice}
              removeFromCart={removeFromCart}
              calculateNetRate={calculateNetRate}
              calculateYouSave={calculateYouSave}
              calculateTotal={calculateTotal}
              additionalDiscount={modalAdditionalDiscount}
              setAdditionalDiscount={setModalAdditionalDiscount}
              changeDiscount={modalChangeDiscount}
              setChangeDiscount={setModalChangeDiscount}
              openNewProductModal={() => {
                setNewProductData({ productname: '', price: '', discount: modalChangeDiscount, quantity: 1, per: '', product_type: 'custom' });
                setNewProductModalIsOpen(true);
              }}
              lastAddedProduct={modalLastAddedProduct}
              setLastAddedProduct={setModalLastAddedProduct}
              setCart={setModalCart}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Total Items: <span className="font-bold text-slate-800">{modalCart.length}</span>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditModalIsOpen(false)}
                disabled={isUpdatingBill}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditBooking}
                disabled={isUpdatingBill || !modalCart.length}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all duration-150 flex items-center gap-2 cursor-pointer
                  ${isUpdatingBill || !modalCart.length
                    ? "bg-slate-300 cursor-not-allowed text-slate-500"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-200"}`}
              >
                {isUpdatingBill ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving Changes…
                  </>
                ) : (
                  "Save & Update Bill"
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* New Product Modal for adding custom products */}
      <NewProductModal
        isOpen={newProductModalIsOpen}
        onClose={() => setNewProductModalIsOpen(false)}
        onSubmit={handleAddNewProduct}
        newProductData={newProductData}
        setNewProductData={setNewProductData}
      />
    </div>
  );
}