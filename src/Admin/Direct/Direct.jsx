import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaEdit, FaArrowRight, FaTrash, FaDownload, FaSearch, FaCamera } from 'react-icons/fa';
import Select from 'react-select';
import Tesseract from 'tesseract.js';
import Webcam from 'react-webcam';

Modal.setAppElement("#root");

// ─── react-select styles (kept as JS object — required by react-select API) ──
const selectStyles = {
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

// ─── Error Boundaries ─────────────────────────────────────────────────────────
class DirectErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("DirectErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg text-sm">
        <span className="text-lg">⚠</span>
        An error occurred: {this.state.error?.message || 'Unknown error'}. Please refresh.
      </div>
    );
    return this.props.children;
  }
}

class QuotationTableErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("QuotationTableErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg text-sm">
        <span className="text-lg">⚠</span>
        Error rendering quotation table. Please try again.
      </div>
    );
    return this.props.children;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const getEffectivePrice = (item) => Math.round(Number(item.price) || 0);
const styles = { input: {}, button: {}, card: {} };

// ─── Micro-components ─────────────────────────────────────────────────────────
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

const StatusBadge = ({ status }) => {
  const cfg = {
    pending:   { cls: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400", text: "Pending" },
    booked:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", text: "Booked" },
    cancelled: { cls: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-400",    text: "Cancelled" },
  };
  const { cls, dot, text } = cfg[status] || { cls: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-300", text: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );
};

const QuotActionBtn = ({ label, onClick, disabled, color }) => {
  const colorMap = {
    "#f59e0b": disabled
      ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
      : "bg-white text-amber-600 border-amber-300 hover:bg-amber-500 hover:text-white hover:border-amber-500",
    "#10b981": disabled
      ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
      : "bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
    "#ef4444": disabled
      ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
      : "bg-white text-red-500 border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-1.5 rounded-md border text-[11px] font-semibold tracking-wide transition-all duration-150 ${colorMap[color] || colorMap["#6366f1"]}`}
    >
      {label}
    </button>
  );
};

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`min-w-[36px] px-3 py-1.5 rounded-md border text-xs font-semibold transition-all duration-150
      ${active   ? "bg-blue-600 border-blue-600 text-white shadow-sm"
      : disabled ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                 : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}
  >
    {label}
  </button>
);

const Divider = () => <div className="h-px bg-gray-100 w-full" />;

// ─── Cart input — fixed width, clean ─────────────────────────────────────────
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
  cart = [], products = [], selectedProduct, setSelectedProduct,
  addToCart, updateQuantity, updateDiscount, updatePrice, removeFromCart,
  calculateNetRate, calculateYouSave, calculateTotal,
  isModal = false, additionalDiscount, setAdditionalDiscount,
  changeDiscount, setChangeDiscount, openNewProductModal,
  lastAddedProduct, setLastAddedProduct, setCart, setModalCart,
}) => {
  const quantityInputRefs = useRef({});
  const productSelectRef = useRef(null);

  useEffect(() => {
    if (lastAddedProduct) {
      const key = `${lastAddedProduct.id}-${lastAddedProduct.product_type}`;
      const input = quantityInputRefs.current[key];
      if (input) { input.focus(); input.select(); setLastAddedProduct(null); }
    }
  }, [lastAddedProduct, setLastAddedProduct]);

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); productSelectRef.current?.focus(); }
  };

  const handleChangeDiscount = (value) => {
    const newDiscount = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setChangeDiscount(newDiscount);
    const updatedCart = cart.map(item => ({ ...item, discount: item.initialDiscount === 0 ? 0 : newDiscount }));
    if (isModal) setModalCart(updatedCart); else setCart(updatedCart);
  };

  const total = parseFloat(calculateTotal(cart, additionalDiscount));

  return (
    <div className="space-y-4">
      {/* Product search + buttons */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1">
          <FieldLabel>Search & Add Product</FieldLabel>
          <Select
            ref={productSelectRef}
            value={selectedProduct}
            onChange={setSelectedProduct}
            options={products.map((p) => ({
              value: `${p.id}-${p.product_type}`,
              label: `${p.serial_number ? `[${p.serial_number}] ` : ''}${p.productname} · ${p.product_type} · ₹${getEffectivePrice(p)}`,
            }))}
            placeholder="Search products…"
            isClearable
            isSearchable
            styles={selectStyles}
          />
        </div>
        <button
          onClick={() => addToCart(isModal)}
          disabled={!selectedProduct}
          className={`h-[42px] px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5 border transition-all duration-150 whitespace-nowrap
            ${selectedProduct
              ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm"
              : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add to Cart
        </button>
        <button
          onClick={() => openNewProductModal(isModal)}
          className="h-[42px] px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-150 whitespace-nowrap"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Custom Product
        </button>
      </div>

      {/* Discount controls */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Additional Discount", accent: "text-amber-500", value: additionalDiscount, onChange: (v) => setAdditionalDiscount(Math.max(0, Math.min(100, parseFloat(v) || 0))), focusCls: "focus:border-amber-400 focus:ring-2 focus:ring-amber-100" },
          { label: "Bulk Change Discount", accent: "text-blue-500", value: changeDiscount, onChange: handleChangeDiscount, focusCls: "focus:border-blue-400 focus:ring-2 focus:ring-blue-100" },
        ].map(({ label, accent, value, onChange, focusCls }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-3">
            <FieldLabel accent={accent}>{label} (%)</FieldLabel>
            <div className="relative">
              <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0"
                min="0" max="100" step="1"
                className={`w-full h-9 pl-3 pr-8 rounded-md border border-gray-200 text-sm font-semibold text-gray-800 bg-gray-50 outline-none transition-all duration-150 ${focusCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cart table */}
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-14 bg-gray-50">
          <span className="text-3xl opacity-40">🛒</span>
          <p className="text-sm text-gray-400 font-medium">Cart is empty — add products above</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto hundred:max-w-xl mobile:max-w-xs">
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
                  const lineTotal = Math.round(getEffectivePrice(item) * (1 - item.discount / 100) * item.quantity);
                  return (
                    <tr key={`${item.id}-${item.product_type}`} className="hover:bg-blue-50/40 transition-colors duration-100 group">
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-300 tabular-nums">{index + 1}</td>
                      <td className="px-3 py-2.5 max-w-[180px]">
                        <div className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.productname}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">{item.product_type}{item.serial_number ? ` · ${item.serial_number}` : ""}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <CartInput
                          value={getEffectivePrice(item)}
                          onChange={(e) => updatePrice(item.id, item.product_type, parseFloat(e.target.value) || 0, isModal)}
                          accentCls="focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <CartInput
                          value={item.discount}
                          onChange={(e) => updateDiscount(item.id, item.product_type, parseFloat(e.target.value) || 0, isModal)}
                          accentCls="focus:border-amber-400 focus:ring-2 focus:ring-amber-100 pr-5"
                          suffix="%"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <CartInput
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, item.product_type, parseInt(e.target.value) || 0, isModal)}
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
                          onClick={() => removeFromCart(item.id, item.product_type, isModal)}
                          className="w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-150 opacity-0 group-hover:opacity-100"
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

          {/* Updated summary – no Processing Fee */}
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

// ─── FormFields ───────────────────────────────────────────────────────────────
const FormFields = ({
  isEdit, customers, modalSelectedCustomer, setModalSelectedCustomer,
  modalCart, setModalCart, products, modalSelectedProduct, setModalSelectedProduct,
  addToCart, updateQuantity, updateDiscount, updatePrice, removeFromCart,
  calculateNetRate, calculateYouSave, calculateProcessingFee, calculateTotal,
  handleSubmit, closeModal, modalAdditionalDiscount, setModalAdditionalDiscount,
  modalChangeDiscount, setModalChangeDiscount, openNewProductModal,
  modalLastAddedProduct, setModalLastAddedProduct,
}) => (
  <div className="space-y-5">
    <div>
      <FieldLabel>Customer</FieldLabel>
      <Select
        value={modalSelectedCustomer}
        onChange={setModalSelectedCustomer}
        options={customers.map((c) => ({
          value: c.id.toString(),
          label: `${c.name} (${c.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : c.customer_type || "User"} - ${c.district || "N/A"})`,
        }))}
        placeholder="Search for a customer…"
        isClearable
        styles={selectStyles}
      />
    </div>
    <QuotationTableErrorBoundary>
      <QuotationTable
        cart={modalCart} setCart={setModalCart} setModalCart={setModalCart}
        products={products || []} selectedProduct={modalSelectedProduct}
        setSelectedProduct={setModalSelectedProduct} addToCart={addToCart}
        updateQuantity={updateQuantity} updateDiscount={updateDiscount}
        updatePrice={updatePrice} removeFromCart={removeFromCart}
        calculateNetRate={calculateNetRate} calculateYouSave={calculateYouSave}
        calculateProcessingFee={calculateProcessingFee} calculateTotal={calculateTotal}
        styles={styles} isModal={true}
        additionalDiscount={modalAdditionalDiscount} setAdditionalDiscount={setModalAdditionalDiscount}
        changeDiscount={modalChangeDiscount} setChangeDiscount={setModalChangeDiscount}
        openNewProductModal={openNewProductModal}
        lastAddedProduct={modalLastAddedProduct} setLastAddedProduct={setModalLastAddedProduct}
      />
    </QuotationTableErrorBoundary>
    <div className="flex justify-end gap-2 pt-1">
      <button
        onClick={closeModal}
        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!modalSelectedCustomer || !modalCart.length}
        className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all duration-150
          ${!modalSelectedCustomer || !modalCart.length
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : isEdit
              ? "bg-amber-500 hover:bg-amber-600 shadow-sm"
              : "bg-blue-600 hover:bg-blue-700 shadow-sm"}`}
      >
        {isEdit ? "Update Quotation" : "Confirm Booking"}
      </button>
    </div>
  </div>
);

// ─── NewProductModal ──────────────────────────────────────────────────────────
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
    { name: "per",         label: "Unit",          type: "text",   placeholder: "Box / Piece" },
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

// ─── CancelConfirmModal ───────────────────────────────────────────────────────
const CancelConfirmModal = ({ isOpen, onClose, onConfirm, quotationId }) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} className="fixed inset-0 flex items-center justify-center p-4 z-50" overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl font-bold">!</span>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-2">Cancel this quotation?</h3>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-semibold text-gray-700">{quotationId}</span> will be permanently cancelled and cannot be undone.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={onClose} className="flex-1 max-w-[140px] py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Keep It
          </button>
          <button onClick={onConfirm} className="flex-1 max-w-[140px] py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm">
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  </Modal>
);

// ─── PDFDownloadConfirmModal ──────────────────────────────────────────────────
const PDFDownloadConfirmModal = ({ isOpen, onClose, onYes, fileName }) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} className="fixed inset-0 flex items-center justify-center p-4 z-50" overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-2">Download PDF?</h3>
        <p className="text-sm text-gray-500 mb-5">Quotation created successfully. Download the PDF invoice now?</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onClose} className="flex-1 max-w-[140px] py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Skip
          </button>
          <button onClick={onYes} className="flex-1 max-w-[140px] py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1.5">
            <FaDownload className="text-xs" /> Download
          </button>
        </div>
      </div>
    </div>
  </Modal>
);

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Direct() {
  const [state, setState] = useState({
    customers: [], products: [], quotations: [], selectedCustomer: "", cart: [], selectedProduct: null,
    error: "", loading: true, successMessage: "", showSuccess: false, quotationId: null,
    isQuotationCreated: false, modalIsOpen: false, modalMode: null, modalCart: [], modalSelectedProduct: null,
    modalSelectedCustomer: "", orderId: "", additionalDiscount: 0, modalAdditionalDiscount: 0,
    changeDiscount: 0, modalChangeDiscount: 0, newProductModalIsOpen: false,
    newProductData: { productname: "", price: "", discount: 0, quantity: 1, per: "" }, isModalNewProduct: false,
    lastAddedProduct: null, modalLastAddedProduct: null, userType: "", modalUserType: "",
    currentPage: 1, searchQuery: "", customerTypeFilter: "",
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [quotationId, setQuotationId] = useState(null);
  const [isQuotationCreated, setIsQuotationCreated] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalCart, setModalCart] = useState([]);
  const [modalSelectedProduct, setModalSelectedProduct] = useState(null);
  const [modalSelectedCustomer, setModalSelectedCustomer] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [modalAdditionalDiscount, setModalAdditionalDiscount] = useState(0);
  const [modalChangeDiscount, setModalChangeDiscount] = useState(0);
  const [newProductModalIsOpen, setNewProductModalIsOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({ productname: '', price: '', discount: 0, quantity: 1, per: '', product_type: 'custom' });
  const [newProductIsForModal, setNewProductIsForModal] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [modalLastAddedProduct, setModalLastAddedProduct] = useState(null);
  const [changeDiscount, setChangeDiscount] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [modalSubmitLoading, setModalSubmitLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [quotationToCancel, setQuotationToCancel] = useState(null);
  const [pdfConfirmOpen, setPdfConfirmOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");

  const triggerPdfDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', fileName);
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); window.URL.revokeObjectURL(url);
  };
  const handlePdfYes = () => { if (pdfUrl && pdfFileName) triggerPdfDownload(pdfUrl, pdfFileName); setPdfConfirmOpen(false); setPdfUrl(null); setPdfFileName(""); };
  const handlePdfNo = () => { if (pdfUrl) window.URL.revokeObjectURL(pdfUrl); setPdfConfirmOpen(false); setPdfUrl(null); setPdfFileName(""); };

  const fetchQuotations = async () => {
    try {
      const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
      const data = Array.isArray(quotationsResponse.data) ? quotationsResponse.data : [];
      const validQuotations = data.filter(q => q.quotation_id && q.quotation_id !== "undefined" && /^[a-zA-Z0-9-_]+$/.test(q.quotation_id));
      setQuotations(validQuotations); setFilteredQuotations(validQuotations);
    } catch (err) { console.error("Failed to fetch quotations:", err.message); setError(`Failed to fetch quotations: ${err.message}`); }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersResponse, productsResponse, quotationsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/direct/customers`),
          axios.get(`${API_BASE_URL}/api/direct/aproducts`),
          axios.get(`${API_BASE_URL}/api/direct/quotations`),
        ]);
        const sortedCustomers = Array.isArray(customersResponse.data) ? customersResponse.data.sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
        const validProducts = Array.isArray(productsResponse.data) ? productsResponse.data.filter(p => p != null && typeof p === 'object' && typeof p.id !== 'undefined' && typeof p.product_type === 'string' && typeof p.productname === 'string') : [];
        setCustomers(sortedCustomers); setProducts(validProducts);
        const data = Array.isArray(quotationsResponse.data) ? quotationsResponse.data : [];
        const validQuotations = data.filter(q => q.quotation_id && q.quotation_id !== "undefined" && /^[a-zA-Z0-9-_]+$/.test(q.quotation_id));
        setQuotations(validQuotations); setFilteredQuotations(validQuotations);
      } catch (err) { console.error('Fetch data error:', err); setError(`Failed to fetch data: ${err.message}`); setProducts([]); }
      finally { setLoading(false); }
    };
    fetchData();
    const intervalId = setInterval(fetchQuotations, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSearch = useCallback(debounce((query) => {
    const lowerQuery = query.toLowerCase();
    const filtered = quotations.filter(q => q.quotation_id.toLowerCase().includes(lowerQuery) || (q.customer_name || '').toLowerCase().includes(lowerQuery) || q.status.toLowerCase().includes(lowerQuery));
    setFilteredQuotations(filtered); setCurrentPage(1);
  }, 300), [quotations]);

  const handleSearchChange = (e) => { const query = e.target.value; setSearchQuery(query); handleSearch(query); };

  const downloadCustomersExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const customerGroups = { Customer: customers.filter(c => c.customer_type === 'Customer'), Agent: customers.filter(c => c.customer_type === 'Agent'), 'Customer of Agent': customers.filter(c => c.customer_type === 'Customer of Selected Agent') };
      for (const [type, group] of Object.entries(customerGroups)) {
        if (group.length === 0) continue;
        const data = group.map(customer => ({ ID: customer.id || 'N/A', Name: customer.name || 'N/A', 'Customer Type': customer.customer_type || 'User', ...(type === 'Customer of Agent' ? { 'Agent Name': customer.agent_name || 'N/A' } : {}), 'Mobile Number': customer.mobile_number || 'N/A', Email: customer.email || 'N/A', Address: customer.address || 'N/A', District: customer.district || 'N/A', State: customer.state || 'N/A' }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
      }
      XLSX.writeFile(workbook, 'customers_export.xlsx');
    } catch (err) { console.error('Failed to download customers Excel:', err); setError(`Failed to download customers Excel: ${err.message}`); }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const customerGroups = { Customer: customers.filter(c => c.customer_type === "Customer"), Agent: customers.filter(c => c.customer_type === "Agent"), "Customer of Agent": customers.filter(c => c.customer_type === "Customer of Selected Agent") };
      let hasAnyData = false;
      for (const [type, group] of Object.entries(customerGroups)) {
        if (group.length === 0) continue; hasAnyData = true;
        const data = group.map(customer => ({ ID: customer.id || "N/A", Name: customer.name || "N/A", "Customer Type": customer.customer_type || "User", ...(type === "Customer of Agent" ? { "Agent Name": customer.agent_name || "N/A" } : {}), "Mobile Number": customer.mobile_number || "N/A", Email: customer.email || "N/A", Address: customer.address || "N/A", District: customer.district || "N/A", State: customer.state || "N/A" }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
      }
      if (!hasAnyData) { setError("No customer data available to export"); return; }
      XLSX.writeFile(workbook, "customers_export.xlsx");
      setSuccessMessage("Customers exported successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) { console.error("Failed to export customers:", err); setError(`Failed to export customers: ${err.message}`); }
  };

  const exportQuotationsToExcel = async () => {
    setError(""); setSuccessMessage("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/direct/export-quotations-excel`, { responseType: "blob", timeout: 300000 });
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition?.split("filename=")[1]?.replace(/["']/g, "") || `MadhunishaCrackers_Quotations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a"); link.href = url; link.setAttribute("download", filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
      setSuccessMessage("Quotations exported successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Export quotations failed:", err);
      let message = "Failed to export quotations. Please try again.";
      if (err.code === "ECONNABORTED") message = "Export timed out. The file may be very large.";
      else if (err.response?.status === 500) message = "Server error during export.";
      setError(message);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginate = (pageNumber) => { if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber); };

  const addToCart = (isModal = false, customProduct = null, directProduct = null) => {
    const targetCart = isModal ? modalCart : cart;
    const setTargetCart = isModal ? setModalCart : setCart;
    const targetSelectedProduct = isModal ? modalSelectedProduct : selectedProduct;
    const setTargetSelectedProduct = isModal ? setModalSelectedProduct : setSelectedProduct;
    const targetDiscount = isModal ? modalChangeDiscount : changeDiscount;
    const setTargetLastAddedProduct = isModal ? setModalLastAddedProduct : setLastAddedProduct;
    if (!customProduct && !targetSelectedProduct && !directProduct) { setError("Please select a product"); return; }
    let product;
    if (customProduct) {
      product = { ...customProduct, id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, product_type: customProduct.product_type || 'custom', price: Math.round(Number(customProduct.price) || 0), quantity: parseInt(customProduct.quantity) || 1, discount: parseFloat(customProduct.discount) || targetDiscount, initialDiscount: parseFloat(customProduct.discount) || targetDiscount, per: customProduct.per || 'Unit' };
    } else if (directProduct) {
      product = { ...directProduct, id: directProduct.id, price: Math.round(Number(directProduct.price) || 0), quantity: 1, discount: parseFloat(directProduct.discount) || targetDiscount, initialDiscount: parseFloat(directProduct.discount) || 0, per: directProduct.per || 'Unit' };
    } else {
      const [id, type] = targetSelectedProduct.value.split("-");
      product = products.find(p => p.id.toString() === id && p.product_type === type);
      if (!product) { setError("Product not found"); return; }
      product = { ...product, id: product.id, price: Math.round(Number(product.price) || 0), quantity: 1, discount: parseFloat(product.discount) || targetDiscount, initialDiscount: parseFloat(product.discount) || 0, per: product.per || 'Unit' };
    }
    setTargetCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.product_type === product.product_type);
      return exists ? prev.map(item => item.id === product.id && item.product_type === product.product_type ? { ...item, quantity: item.quantity + 1 } : item) : [product, ...prev];
    });
    setTargetSelectedProduct(null);
    setTargetLastAddedProduct({ id: product.id, product_type: product.product_type });
    setError("");
  };

  const updateQuantity = (id, type, quantity, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, quantity: quantity < 0 ? 0 : quantity } : item)); };
  const updateDiscount = (id, type, discount, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, discount: discount < 0 ? 0 : discount > 100 ? 100 : discount } : item)); };
  const updatePrice = (id, type, price, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, price: price < 0 ? 0 : price } : item)); };
  const removeFromCart = (id, type, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.filter(item => !(item.id === id && item.product_type === type))); };

  const calculateNetRate = (targetCart = []) => targetCart.reduce((total, item) => total + getEffectivePrice(item) * item.quantity, 0).toFixed(2);
  const calculateYouSave = (targetCart = []) => targetCart.reduce((total, item) => total + getEffectivePrice(item) * (item.discount / 100) * item.quantity, 0).toFixed(2);

  // Updated calculateTotal – no processing fee
  const calculateTotal = (targetCart = [], additionalDiscount = 0) => {
    const subtotal = targetCart.reduce((total, item) => total + getEffectivePrice(item) * (1 - item.discount / 100) * item.quantity, 0);
    const discountedSubtotal = subtotal * (1 - additionalDiscount / 100);
    return discountedSubtotal.toFixed(2);   // ← only discounted subtotal, no extra fees
  };

  const createQuotation = async () => {
    if (!selectedCustomer || !cart.length) return setError("Customer and products are required");
    if (cart.some(i => i.quantity === 0)) return setError("Please remove products with zero quantity");
    setCreateLoading(true); setError("");
    const customer = customers.find(c => c.id.toString() === selectedCustomer.value);
    if (!customer) { setCreateLoading(false); return setError("Invalid customer"); }
    const quotation_id = `QUO-${Date.now()}`;
    try {
      const subtotal = parseFloat(calculateNetRate(cart)) - parseFloat(calculateYouSave(cart));
      const discountedSubtotal = subtotal * (1 - additionalDiscount / 100);
      const processingFee = discountedSubtotal * 0.03;
      const payload = { customer_id: Number(selectedCustomer.value), quotation_id, products: cart.map(item => ({ id: item.id, product_type: item.product_type, productname: item.productname, price: getEffectivePrice(item), discount: parseFloat(item.discount) || 0, quantity: parseInt(item.quantity) || 0, per: item.per || 'Unit', serial_number: item.serial_number || undefined })), net_rate: parseFloat(calculateNetRate(cart)), you_save: parseFloat(calculateYouSave(cart)), processing_fee: processingFee, total: parseFloat(calculateTotal(cart, additionalDiscount)), promo_discount: 0, additional_discount: parseFloat(additionalDiscount.toFixed(2)), customer_type: customer.customer_type || "User", customer_name: customer.name, address: customer.address, mobile_number: customer.mobile_number, email: customer.email, district: customer.district, state: customer.state, status: "pending" };
      const response = await axios.post(`${API_BASE_URL}/api/direct/quotations`, payload);
      const newQuotationId = response.data.quotation_id;
      if (!newQuotationId || newQuotationId === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(newQuotationId)) throw new Error("Invalid quotation ID returned from server");
      setQuotationId(newQuotationId); setIsQuotationCreated(true);
      setSuccessMessage("Quotation created successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => [{ ...payload, created_at: new Date().toISOString(), customer_name: customer.name, total: payload.total }, ...prev]);
      setFilteredQuotations(prev => [{ ...payload, created_at: new Date().toISOString(), customer_name: customer.name, total: payload.total }, ...prev]);
      const pdfRes = await axios.get(`${API_BASE_URL}/api/direct/quotation/${newQuotationId}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const safeName = (customer.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setPdfUrl(blobUrl); setPdfFileName(`${safeName}-${newQuotationId}-quotation.pdf`); setPdfConfirmOpen(true);
      setCart([]); setSelectedCustomer(null); setSelectedProduct(null); setAdditionalDiscount(0); setChangeDiscount(0); setLastAddedProduct(null); setQuotationId(null); setIsQuotationCreated(false);
    } catch (err) { console.error("Create quotation error:", err); setError(`Failed to create quotation: ${err.message}`); }
    finally { setCreateLoading(false); }
  };

  const editQuotation = async (quotation = null) => {
    if (quotation) {
      if (!quotation.quotation_id || quotation.quotation_id === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotation.quotation_id)) { setError("Invalid or missing quotation ID"); return; }
      setModalMode("edit");
      setModalSelectedCustomer({ value: quotation.customer_id?.toString(), label: `${quotation.customer_name} (${quotation.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : quotation.customer_type || "User"} - ${quotation.district || "N/A"})` });
      setQuotationId(quotation.quotation_id); setModalAdditionalDiscount(parseFloat(quotation.additional_discount) || 0); setModalChangeDiscount(0);
      try {
        const products = typeof quotation.products === "string" ? JSON.parse(quotation.products) : quotation.products;
        setModalCart(Array.isArray(products) ? products.map(p => ({ ...p, id: p.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, price: parseFloat(p.price) || 0, discount: parseFloat(p.discount) || 0, initialDiscount: parseFloat(p.discount) || 0, quantity: parseInt(p.quantity) || 0, per: p.per || 'Unit', product_type: p.product_type || 'custom' })) : []);
      } catch (e) { setModalCart([]); setError("Failed to parse quotation products"); return; }
      setModalIsOpen(true); return;
    }
    if (!modalSelectedCustomer || !modalCart.length) return setError("Customer and products are required");
    if (modalCart.some(item => item.quantity === 0)) return setError("Please remove products with zero quantity");
    if (!quotationId || quotationId === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotationId)) { setError("Invalid or missing quotation ID"); return; }
    setModalSubmitLoading(true);
    try {
      const customer = customers.find(c => c.id.toString() === modalSelectedCustomer.value);
      if (!customer) throw new Error("Invalid customer");
      const subtotal = parseFloat(calculateNetRate(modalCart)) - parseFloat(calculateYouSave(modalCart));
      const discountedSubtotal = subtotal * (1 - modalAdditionalDiscount / 100);
      const processingFee = discountedSubtotal * 0.01;
      const payload = { customer_id: Number(modalSelectedCustomer.value), products: modalCart.map(item => ({ id: item.id, product_type: item.product_type, productname: item.productname, price: parseFloat(item.price) || 0, discount: parseFloat(item.discount) || 0, quantity: parseInt(item.quantity) || 0, per: item.per || 'Unit' })), net_rate: parseFloat(calculateNetRate(modalCart)) || 0, you_save: parseFloat(calculateYouSave(modalCart)) || 0, processing_fee: parseFloat(processingFee) || 0, total: parseFloat(calculateTotal(modalCart, modalAdditionalDiscount)) || 0, promo_discount: 0, additional_discount: parseFloat(modalAdditionalDiscount.toFixed(2)) || 0, status: "pending" };
      const response = await axios.put(`${API_BASE_URL}/api/direct/quotations/${quotationId}`, payload);
      const updatedId = response.data.quotation_id || quotationId;
      if (!updatedId) throw new Error("Invalid quotation ID returned");
      setSuccessMessage("Quotation updated successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, ...payload, customer_name: customer.name, total: payload.total } : q));
      setFilteredQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, ...payload, customer_name: customer.name, total: payload.total } : q));
      const pdfRes = await axios.get(`${API_BASE_URL}/api/direct/quotation/${updatedId}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const safeName = (customer.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setPdfUrl(blobUrl); setPdfFileName(`${safeName}-${updatedId}-quotation.pdf`); setPdfConfirmOpen(true);
      closeModal();
    } catch (err) { console.error("Edit quotation error:", err); setError(`Failed to update quotation: ${err.message}`); }
    finally { setModalSubmitLoading(false); }
  };

  const convertToBooking = async (quotation = null) => {
    if (quotation) {
      if (!quotation.quotation_id || quotation.quotation_id === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotation.quotation_id)) { setError("Invalid or missing quotation ID"); return; }
      setModalMode("book");
      setModalSelectedCustomer({ value: quotation.customer_id?.toString(), label: `${quotation.customer_name} (${quotation.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : quotation.customer_type || "User"} - ${quotation.district || "N/A"})` });
      setQuotationId(quotation.quotation_id); setOrderId(`ORD-${Date.now()}`); setModalAdditionalDiscount(parseFloat(quotation.additional_discount) || 0); setModalChangeDiscount(0);
      try {
        const products = typeof quotation.products === "string" ? JSON.parse(quotation.products) : quotation.products;
        setModalCart(Array.isArray(products) ? products.map(p => ({ ...p, id: p.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, price: parseFloat(p.price) || 0, discount: parseFloat(p.discount) || 0, initialDiscount: parseFloat(p.discount) || 0, quantity: parseInt(p.quantity) || 0, per: p.per || 'Unit', product_type: p.product_type || 'custom' })) : []);
      } catch (e) { setModalCart([]); setError("Failed to parse quotation products"); return; }
      setModalIsOpen(true); return;
    }
    if (!modalSelectedCustomer || !modalCart.length || !orderId) return setError("Customer, products, and order ID are required");
    if (modalCart.some(item => item.quantity === 0)) return setError("Please remove products with zero quantity");
    if (!quotationId || quotationId === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotationId)) { setError("Invalid or missing quotation ID"); return; }
    setModalSubmitLoading(true);
    try {
      const customer = customers.find(c => c.id.toString() === modalSelectedCustomer.value);
      if (!customer) throw new Error("Invalid customer");
      const subtotal = parseFloat(calculateNetRate(modalCart)) - parseFloat(calculateYouSave(modalCart));
      const discountedSubtotal = subtotal * (1 - modalAdditionalDiscount / 100);
      const processingFee = discountedSubtotal * 0.03;
      const payload = { customer_id: Number(modalSelectedCustomer.value), order_id: orderId, quotation_id: quotationId, products: modalCart.map(item => ({ id: item.id, product_type: item.product_type, productname: item.productname, price: getEffectivePrice(item), discount: parseFloat(item.discount) || 0, quantity: parseInt(item.quantity) || 0, per: item.per || 'Unit', serial_number: item.serial_number || undefined })), net_rate: parseFloat(calculateNetRate(modalCart)), you_save: parseFloat(calculateYouSave(modalCart)), processing_fee: processingFee, total: parseFloat(calculateTotal(modalCart, modalAdditionalDiscount)), promo_discount: 0, additional_discount: parseFloat(modalAdditionalDiscount.toFixed(2)), customer_type: customer.customer_type || "User", customer_name: customer.name, address: customer.address, mobile_number: customer.mobile_number, email: customer.email, district: customer.district, state: customer.state };
      const response = await axios.post(`${API_BASE_URL}/api/direct/bookings`, payload);
      setSuccessMessage("Booking created successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: "booked" } : q));
      setFilteredQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: "booked" } : q));
      const pdfRes = await axios.get(`${API_BASE_URL}/api/direct/invoice/${response.data.order_id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const safeName = (customer.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setPdfUrl(blobUrl); setPdfFileName(`${safeName}-${response.data.order_id}-invoice.pdf`); setPdfConfirmOpen(true);
      closeModal();
    } catch (err) { console.error("Convert to booking error:", err); setError(`Failed to create booking: ${err.message}`); }
    finally { setModalSubmitLoading(false); }
  };

  const cancelQuotation = async () => {
    const target = quotationToCancel;
    if (!target || target === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(target)) { setError("Invalid quotation ID"); setCancelConfirmOpen(false); return; }
    try {
      await axios.put(`${API_BASE_URL}/api/direct/quotations/cancel/${target}`);
      setSuccessMessage("Quotation cancelled successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => prev.map(q => q.quotation_id === target ? { ...q, status: "cancelled" } : q));
      setFilteredQuotations(prev => prev.map(q => q.quotation_id === target ? { ...q, status: "cancelled" } : q));
      if (!quotationToCancel) { setCart([]); setSelectedCustomer(null); setSelectedProduct(null); setQuotationId(null); setIsQuotationCreated(false); setAdditionalDiscount(0); setChangeDiscount(0); setLastAddedProduct(null); }
    } catch (err) { setError(`Failed to cancel: ${err.response?.data?.message || err.message}`); }
    finally { setCancelConfirmOpen(false); setQuotationToCancel(null); }
  };

  const openCancelConfirm = (id) => { setQuotationToCancel(id); setCancelConfirmOpen(true); };
  const openNewProductModal = (isModal = false) => { setNewProductIsForModal(isModal); setNewProductModalIsOpen(true); setNewProductData({ productname: '', price: '', discount: isModal ? modalChangeDiscount : changeDiscount, quantity: 1, per: '', product_type: 'custom' }); };
  const closeNewProductModal = () => { setNewProductModalIsOpen(false); setNewProductData({ productname: '', price: '', discount: 0, quantity: 1, per: '', product_type: 'custom' }); setError(""); };
  const handleAddNewProduct = (productData) => {
    if (!productData.productname) return setError("Product name is required");
    if (productData.price === '' || productData.price < 0) return setError("Price must be a non-negative number");
    if (productData.quantity === '' || productData.quantity < 1) return setError("Quantity must be at least 1");
    if (productData.discount < 0 || productData.discount > 100) return setError("Discount must be between 0 and 100");
    if (!productData.product_type) return setError("Product type is required");
    addToCart(newProductIsForModal, productData); closeNewProductModal();
  };
  const closeModal = () => { setModalIsOpen(false); setModalMode(null); setModalCart([]); setModalSelectedCustomer(null); setModalSelectedProduct(null); setOrderId(""); setModalAdditionalDiscount(0); setModalChangeDiscount(0); setModalLastAddedProduct(null); setError(""); setSuccessMessage(""); };

  return (
    <DirectErrorBoundary>
      <div className="flex min-h-screen bg-[#f5f6f8]">
        <Sidebar />
        <Logout />

        {/* ── Page content ── */}
        <div className="hundred:ml-64 mobile:ml-0 flex-1 hundred:px-8 mobile:px-4 pt-8 pb-16">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Page header ── */}
            <div className="flex items-end justify-between pb-2 border-b border-gray-200">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">Operations</p>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">Direct Booking</h1>
              </div>
              <p className="text-xs text-gray-400 mb-0.5">Create quotations · Convert to bookings</p>
            </div>

            {/* ── Status banners ── */}
            {loading && (
              <div className="flex items-center gap-2.5 text-sm text-blue-600 font-medium">
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Loading data…
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <span className="mt-0.5 font-bold text-red-400">⚠</span>
                <span>{error}</span>
              </div>
            )}
            {showSuccess && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 font-medium">
                <span className="text-emerald-500">✓</span>
                {successMessage}
              </div>
            )}

            {/* ── New quotation card ── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                  </span>
                  <span className="text-sm font-bold text-gray-700">New Quotation</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-5">
                {/* Customer select */}
                <div>
                  <FieldLabel>Select Customer</FieldLabel>
                  <Select
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                    options={customers.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : c.customer_type || "User"} - ${c.district || "N/A"})` }))}
                    placeholder="Search by name, type, or district…"
                    isClearable
                    styles={selectStyles}
                  />
                </div>

                <Divider />

                <QuotationTableErrorBoundary>
                  <QuotationTable
                    cart={cart} setCart={setCart} setModalCart={setModalCart}
                    products={products} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                    addToCart={addToCart} updateQuantity={updateQuantity} updateDiscount={updateDiscount}
                    updatePrice={updatePrice} removeFromCart={removeFromCart}
                    calculateNetRate={calculateNetRate} calculateYouSave={calculateYouSave}calculateTotal={calculateTotal}
                    styles={styles} additionalDiscount={additionalDiscount} setAdditionalDiscount={setAdditionalDiscount}
                    changeDiscount={changeDiscount} setChangeDiscount={setChangeDiscount}
                    openNewProductModal={openNewProductModal}
                    lastAddedProduct={lastAddedProduct} setLastAddedProduct={setLastAddedProduct}
                    className="overflow-x-auto"
                  />
                </QuotationTableErrorBoundary>
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {cart.length > 0 ? `${cart.length} item${cart.length > 1 ? 's' : ''} in cart` : "No items in cart"}
                </span>
                <button
                  onClick={createQuotation}
                  disabled={!selectedCustomer || !cart.length || createLoading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-150
                    ${!selectedCustomer || !cart.length || createLoading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
                >
                  {createLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M3 12a9 9 0 1018 0A9 9 0 003 12z"/></svg>
                      Create Quotation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Quotations list ── */}
            <div>
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-gray-800">All Quotations</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{filteredQuotations.length} total</p>
                </div>
                <div className="relative hundred:w-64 mobile:w-full">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text" value={searchQuery} onChange={handleSearchChange}
                    placeholder="Search quotations…"
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {currentQuotations.length ? (
                <>
                  <div className="grid hundred:grid-cols-3 mobile:grid-cols-1 gap-3">
                    {currentQuotations.map((quotation) => (
                      <div
                        key={quotation.quotation_id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 mr-2">
                            <div className="text-[10px] font-bold tracking-widest text-blue-500 uppercase mb-0.5 truncate">{quotation.quotation_id}</div>
                            <div className="text-sm font-bold text-gray-800 leading-tight truncate">{quotation.customer_name || "N/A"}</div>
                          </div>
                          <StatusBadge status={quotation.status} />
                        </div>
                        <div className="space-y-1.5 mb-3.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Location</span>
                            <span className="text-xs font-medium text-gray-700">{quotation.district || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total</span>
                            <span className="text-sm font-bold text-gray-800 tabular-nums">₹{parseFloat(quotation.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Created</span>
                            <span className="text-xs font-medium text-gray-600">{new Date(quotation.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                          <QuotActionBtn label="Edit"   onClick={() => editQuotation(quotation)}          disabled={quotation.status !== "pending"} color="#f59e0b" />
                          <QuotActionBtn label="Book"   onClick={() => convertToBooking(quotation)}        disabled={quotation.status !== "pending"} color="#10b981" />
                          <QuotActionBtn label="Cancel" onClick={() => openCancelConfirm(quotation.quotation_id)} disabled={quotation.status !== "pending"} color="#ef4444" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-1.5 mt-5">
                      <PaginBtn label="←" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                      {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                        const max = 4;
                        let start = Math.max(1, currentPage - Math.floor(max / 2));
                        let end = Math.min(totalPages, start + max - 1);
                        if (end === totalPages) start = Math.max(1, totalPages - max + 1);
                        const page = start + i;
                        if (page > end) return null;
                        return <PaginBtn key={page} label={page} onClick={() => paginate(page)} active={currentPage === page} />;
                      }).filter(Boolean)}
                      <PaginBtn label="→" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
                  <div className="text-3xl mb-3 opacity-30">📋</div>
                  <p className="text-sm text-gray-400 font-medium">
                    {searchQuery ? "No quotations match your search" : "No quotations yet — create your first one above"}
                  </p>
                </div>
              )}
            </div>

            {/* ── Export actions ── */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <button onClick={exportToExcel} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <FaDownload className="text-emerald-500" /> Export Customers
              </button>
              <button onClick={exportQuotationsToExcel} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                <FaDownload className="text-violet-500" /> Export Quotations
              </button>
            </div>

          </div>
        </div>

        {/* ── Main Edit/Book Modal ── */}
        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="fixed inset-0 flex items-center justify-center p-4 z-50" overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" key="quotation-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${modalMode === "edit" ? "bg-amber-400" : "bg-emerald-400"}`} />
                <h2 className="text-base font-bold text-gray-800">
                  {modalMode === "edit" ? "Edit Quotation" : "Convert to Booking"}
                </h2>
                {quotationId && <span className="ml-1 text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{quotationId}</span>}
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
                  <span className="text-red-400 font-bold mt-0.5">⚠</span> {error}
                </div>
              )}
              {modalMode === "book" && (
                <div className="mb-5">
                  <FieldLabel>Order ID</FieldLabel>
                  <input
                    type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Enter Order ID"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-800 bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              )}
              <FormFields
                isEdit={modalMode === "edit"} customers={customers}
                modalSelectedCustomer={modalSelectedCustomer} setModalSelectedCustomer={setModalSelectedCustomer}
                modalCart={modalCart} setModalCart={setModalCart} products={products}
                modalSelectedProduct={modalSelectedProduct} setModalSelectedProduct={setModalSelectedProduct}
                addToCart={addToCart} updateQuantity={updateQuantity} updateDiscount={updateDiscount}
                updatePrice={updatePrice} removeFromCart={removeFromCart}
                calculateNetRate={calculateNetRate} calculateYouSave={calculateYouSave} calculateTotal={calculateTotal}
                handleSubmit={modalMode === "edit" ? () => editQuotation() : () => convertToBooking()}
                closeModal={closeModal} styles={styles}
                modalAdditionalDiscount={modalAdditionalDiscount} setModalAdditionalDiscount={setModalAdditionalDiscount}
                modalChangeDiscount={modalChangeDiscount} setModalChangeDiscount={setModalChangeDiscount}
                openNewProductModal={openNewProductModal}
                modalLastAddedProduct={modalLastAddedProduct} setModalLastAddedProduct={setModalLastAddedProduct}
              />
            </div>
          </div>
        </Modal>

        <CancelConfirmModal isOpen={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)} onConfirm={cancelQuotation} quotationId={quotationToCancel} />
        <PDFDownloadConfirmModal isOpen={pdfConfirmOpen} onClose={handlePdfNo} onYes={handlePdfYes} fileName={pdfFileName} />
        <NewProductModal isOpen={newProductModalIsOpen} onClose={closeNewProductModal} onSubmit={handleAddNewProduct} newProductData={newProductData} setNewProductData={setNewProductData} />
      </div>
    </DirectErrorBoundary>
  );
}