import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Modal from 'react-modal';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

// Accessibility setup
Modal.setAppElement("#root");

// Helper to calculate effective price
const getEffectivePrice = (item, customerId, customers = [], userType) => {
  if (!item || (!Array.isArray(customers) && !customerId)) {
    console.warn('getEffectivePrice: Invalid input - item or customer data missing', { item, customerId, customers });
    return 0;
  }
  const customer = customers.find((c) => c.id.toString() === customerId);
  const price = Math.round(
    Number(item.customPrice) ||
    (userType === 'User' ? Number(item.price) : Number(item.dprice)) || 0
  );
  if (price === 0) {
    console.warn('getEffectivePrice: Price is 0 for item', item);
  }
  return price;
};

// Error Boundary
class QuotationTableErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  componentDidCatch(error, errorInfo) { console.error("Error:", error, errorInfo); }
  render() {
    return this.state.hasError
      ? <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg text-center shadow-md">Error rendering table. Please try again.</div>
      : this.props.children;
  }
}

// Shared select styles
const selectStyles = {
  control: (base) => ({
    ...base,
    padding: "0.25rem",
    fontSize: "1rem",
    borderRadius: "0.5rem",
    background: "#fff",
    borderColor: "#d1d5db",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    color: "#1f2937", // Ensure text is visible
    "&:hover": { borderColor: "#3b82f6" },
    "@media (max-width: 640px)": {
      padding: "0.25rem",
      fontSize: "0.875rem",
      color: "#1f2937" // Ensure text visibility in mobile
    }
  }),
  menu: (base) => ({
    ...base,
    zIndex: 20,
    background: "#fff"
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1f2937" // Explicitly set text color to ensure visibility
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    background: isSelected ? "#3b82f6" : isFocused ? "#e5e7eb" : "#fff",
    color: isSelected ? "#fff" : "#1f2937"
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af" // Ensure placeholder text is visible
  })
};

// Shared component styles
const styles = {
  input: { background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", border: "1px solid rgba(2,132,199,0.3)" },
  button: { background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", border: "1px solid rgba(125,211,252,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.3)" },
  card: { background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,249,255,0.7))", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }
};

// Quotation Table Component
const QuotationTable = ({
  cart = [],
  products,
  selectedProduct,
  setSelectedProduct,
  addToCart,
  updateQuantity,
  updateDiscount,
  updatePrice,
  removeFromCart,
  calculateNetRate,
  calculateYouSave,
  calculateTotal,
  isModal = false,
  selectedCustomer,
  modalSelectedCustomer,
  customers,
  additionalDiscount,
  setAdditionalDiscount,
  changeDiscount,
  setChangeDiscount,
  openNewProductModal,
  updateState,
  lastAddedProduct,
  setLastAddedProduct,
  userType
}) => {
  const quantityInputRefs = useRef({});

  useEffect(() => {
    if (lastAddedProduct) {
      const key = `${lastAddedProduct.id}-${lastAddedProduct.product_type}`;
      const input = quantityInputRefs.current[key];
      if (input) {
        input.focus();
        input.select();
        setLastAddedProduct(null);
      }
    }
  }, [lastAddedProduct, setLastAddedProduct]);

  const handleChangeDiscount = (value) => {
    const newDiscount = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setChangeDiscount(newDiscount);
    const cartKey = isModal ? 'modalCart' : 'cart';
    updateState({
      [cartKey]: cart.map(item => {
        const originalProduct = products.find(p => p.id.toString() === item.id && p.product_type === item.product_type);
        const shouldUpdateDiscount = item.product_type !== 'net_rate_products' && 
                                   (!originalProduct || Number(originalProduct.discount) !== 0);
        return {
          ...item,
          discount: shouldUpdateDiscount ? newDiscount : item.discount
        };
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center mobile:w-full">
        <label className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">Product</label>
        <Select
          value={selectedProduct}
          onChange={setSelectedProduct}
          options={products.map(p => ({
            value: `${p.id}-${p.product_type}`,
            label: `${p.serial_number} - ${p.productname} (${p.product_type})`,
          }))}
          placeholder="Search for a product..."
          isClearable
          className="mobile:w-full onefifty:w-96"
          classNamePrefix="react-select"
          styles={selectStyles}
        />
        <button
          onClick={() => addToCart(isModal)}
          disabled={!selectedProduct}
          className={`mt-4 onefifty:w-50 h-10 text-white px-6 rounded-lg font-bold shadow ${
            !selectedProduct ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          style={styles.button}
        >
          Add to Cart
        </button>
      </div>
      <div className="flex flex-col items-center mobile:w-full">
        <label className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">
          Additional Discount (%)
        </label>
        <div className="flex items-center gap-4 mobile:w-full onefifty:w-96">
          <input
            type="number"
            value={additionalDiscount || ''}
            onChange={(e) => setAdditionalDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
            placeholder="Enter additional discount (%)"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="1"
            style={styles.input}
          />
        </div>
      </div>
      <div className="flex flex-col items-center mobile:w-full">
        <label className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">
          Change Discount (%)
        </label>
        <div className="flex items-center gap-4 mobile:w-full onefifty:w-96">
          <input
            type="number"
            value={changeDiscount || ''}
            onChange={(e) => handleChangeDiscount(e.target.value)}
            placeholder="Enter change discount (%)"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
            step="1"
            style={styles.input}
          />
          <button
            onClick={openNewProductModal}
            className="h-10 text-white px-4 rounded-lg font-bold shadow bg-green-600 hover:bg-green-700"
            style={styles.button}
          >
            Add New Product
          </button>
        </div>
      </div>
      <div className={`overflow-x-auto ${isModal ? 'overflow-y-auto max-h-[60vh] pr-2' : ''}`}>
        <table className="w-full border-collapse shadow rounded-lg mobile:text-xs">
          <thead className="border border-white">
            <tr className="hundred:text-lg mobile:text-sm">
              {['Product', 'Price', 'Dis', 'Qty', 'Total', 'Actions'].map((header) => (
                <th key={header} className="text-center border-r border-white text-black dark:text-white">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cart.length ? (
              cart.map((item) => (
                <tr
                  key={`${item.id}-${item.product_type}`}
                  className="border text-gray-900 dark:text-gray-100 mobile:text-sm"
                >
                  <td className="text-center border-r mobile:p-1">{item.productname}</td>
                  <td className="text-center border-r mobile:p-1">
                    <input
                      type="number"
                      value={getEffectivePrice(item, isModal ? modalSelectedCustomer : selectedCustomer, customers, userType)}
                      onChange={(e) =>
                        updatePrice(item.id, item.product_type, Math.round(Number.parseFloat(e.target.value) || 0), isModal)
                      }
                      min="0"
                      step="1"
                      className="w-20 text-center border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </td>
                  <td className="text-center border-r mobile:p-1">
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) =>
                        updateDiscount(item.id, item.product_type, Number.parseFloat(e.target.value) || 0, isModal)
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-20 text-center border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </td>
                  <td className="text-center border-r mobile:p-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, item.product_type, Number.parseInt(e.target.value) || 0, isModal)
                      }
                      min="0"
                      ref={(el) => (quantityInputRefs.current[`${item.id}-${item.product_type}`] = el)}
                      className="w-16 text-center border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </td>
                  <td className="text-center border-r mobile:p-1">
                    ₹{Math.round(
                      getEffectivePrice(item, isModal ? modalSelectedCustomer : selectedCustomer, customers, userType) *
                        (1 - item.discount / 100) *
                        item.quantity
                    )}
                  </td>
                  <td className="text-center border-r mobile:p-1">
                    <button
                      onClick={() => removeFromCart(item.id, item.product_type, isModal)}
                      className="text-red-600 hover:text-red-800 font-bold mobile:text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500 mobile:p-2 mobile:text-xs">
                  Cart is empty
                </td>
              </tr>
            )}
          </tbody>
          {cart.length > 0 && (
            <tfoot>
              {[
                { label: 'Net Rate', value: `₹${Math.round(calculateNetRate(cart, isModal ? modalSelectedCustomer : selectedCustomer))}` },
                { label: 'You Save', value: `₹${Math.round(calculateYouSave(cart, isModal ? modalSelectedCustomer : selectedCustomer))}` },
                additionalDiscount > 0 && {
                  label: 'Additional Discount',
                  value: `${additionalDiscount.toFixed(2)}%`,
                },
                { label: 'Total', value: `₹${Math.round(calculateTotal(cart, isModal ? modalSelectedCustomer : selectedCustomer, isModal))}` },
              ]
                .filter(Boolean)
                .map(({ label, value }) => (
                  <tr key={label} className="dark:text-white">
                    <td colSpan="4" className="text-center font-bold mobile:p-1 text-xl">
                      {label}
                    </td>
                    <td colSpan="0" className="text-center font-bold mobile:p-1 text-xl">
                      {value}
                    </td>
                  </tr>
                ))}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

// Form Fields for Modal
const FormFields = ({
  isEdit,
  customers,
  modalSelectedCustomer,
  setModalSelectedCustomer,
  modalCart,
  products,
  modalSelectedProduct,
  setModalSelectedProduct,
  addToCart,
  updateQuantity,
  updateDiscount,
  updatePrice,
  removeFromCart,
  calculateNetRate,
  calculateYouSave,
  calculateTotal,
  handleSubmit,
  closeModal,
  modalAdditionalDiscount,
  setModalAdditionalDiscount,
  modalChangeDiscount,
  setModalChangeDiscount,
  openNewProductModal,
  updateState,
  modalLastAddedProduct,
  modalUserType
}) => (
  <div className="space-y-6">
    <div className="flex flex-col items-center mobile:w-full">
      <label className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">Select Customer</label>
      <Select
        value={customers.find((c) => c.id === modalSelectedCustomer) || null}
        onChange={(option) => setModalSelectedCustomer(option ? option.value : '')}
        options={customers.map(c => ({ value: c.id, label: c.name }))}
        placeholder="Search for a customer..."
        isClearable
        className="mobile:w-full onefifty:w-96"
        classNamePrefix="react-select"
        styles={selectStyles}
      />
    </div>
    <div className="flex flex-col items-center mobile:w-full">
      <label className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">User Type</label>
      <Select
        value={{ value: modalUserType, label: modalUserType || 'Select user type...' }}
        onChange={(option) => updateState({ modalUserType: option ? option.value : '' })}
        options={[{ value: 'User', label: 'User' }, { value: 'Customer', label: 'Customer' }]}
        placeholder="Select user type..."
        isClearable
        className="mobile:w-full onefifty:w-96"
        classNamePrefix="react-select"
        styles={selectStyles}
      />
    </div>
    <QuotationTableErrorBoundary>
      <QuotationTable
        cart={modalCart}
        products={products}
        selectedProduct={modalSelectedProduct}
        setSelectedProduct={setModalSelectedProduct}
        addToCart={addToCart}
        updateQuantity={updateQuantity}
        updateDiscount={updateDiscount}
        updatePrice={updatePrice}
        removeFromCart={removeFromCart}
        calculateNetRate={calculateNetRate}
        calculateYouSave={calculateYouSave}
        calculateTotal={calculateTotal}
        isModal={true}
        modalSelectedCustomer={modalSelectedCustomer}
        customers={customers}
        additionalDiscount={modalAdditionalDiscount}
        setAdditionalDiscount={setModalAdditionalDiscount}
        changeDiscount={modalChangeDiscount}
        setChangeDiscount={setModalChangeDiscount}
        openNewProductModal={openNewProductModal}
        updateState={updateState}
        lastAddedProduct={modalLastAddedProduct}
        setLastAddedProduct={(val) => updateState({ modalLastAddedProduct: val })}
        userType={modalUserType}
      />
    </QuotationTableErrorBoundary>
    <div className="flex justify-end space-x-3">
      <button onClick={closeModal} className="rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700">Cancel</button>
      <button
        onClick={handleSubmit}
        disabled={!modalSelectedCustomer || !modalCart.length}
        className={`rounded-md px-4 py-2 text-sm text-white ${!modalSelectedCustomer || !modalCart.length ? "bg-gray-400 cursor-not-allowed" : isEdit ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}
      >
        {isEdit ? "Update Quotation" : "Confirm Booking"}
      </button>
    </div>
  </div>
);

// New Product Modal
const NewProductModal = ({ isOpen, onClose, onSubmit, newProductData, setNewProductData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localProductData, setLocalProductData] = useState(newProductData);
  const isMounted = useRef(true);

  useEffect(() => {
    setLocalProductData(newProductData);
  }, [newProductData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...localProductData,
      [name]: ['price', 'discount', 'quantity'].includes(name)
        ? value === '' ? '' : Number.parseFloat(value) || 0
        : value,
    };
    setLocalProductData(updatedData);
    if (isMounted.current) {
      setNewProductData(updatedData);
    }
  };

  const handleKeyDown = (e) => {
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(localProductData);
      console.log('NewProductModal: Submission successful');
      if (isMounted.current) {
        onClose();
      }
    } catch (err) {
      console.error('NewProductModal: Submission error:', err);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-black/50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mobile:p-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">Add New Product</h2>
        <div className="space-y-4">
          {[
            { name: "productname", label: "Product Name *", type: "text", placeholder: "Enter product name", required: true },
            { name: "price", label: "Price (₹) *", type: "number", placeholder: "Enter price", min: 0, step: 1, required: true },
            { name: "discount", label: "Discount (%)", type: "number", placeholder: "Enter discount", min: 0, max: 100, step: 0.01 },
            { name: "quantity", label: "Quantity *", type: "number", placeholder: "Enter quantity", min: 1, step: 1, required: true },
            { name: "per", label: "Unit (e.g., Box, Unit)", type: "text", placeholder: "Enter unit" }
          ].map(({ name, label, type, placeholder, min, max, step, required }) => (
            <div key={name} className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-1">{label}</label>
              <input
                name={name}
                type={type}
                value={localProductData[name] || ''}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={styles.input}
                {...{ min, max, step, required }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`rounded-md px-4 py-2 text-sm text-white ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !localProductData.productname || localProductData.price === '' || localProductData.quantity === ''}
            className={`rounded-md px-4 py-2 text-sm text-white ${isSubmitting || !localProductData.productname || localProductData.price === '' || localProductData.quantity === '' ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            Add Product
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default function Direct() {
  const [state, setState] = useState({
    customers: [],
    products: [],
    quotations: [],
    selectedCustomer: "",
    cart: [],
    selectedProduct: null,
    error: "",
    loading: true,
    successMessage: "",
    showSuccess: false,
    quotationId: null,
    isQuotationCreated: false,
    modalIsOpen: false,
    modalMode: null,
    modalCart: [],
    modalSelectedProduct: null,
    modalSelectedCustomer: "",
    orderId: "",
    additionalDiscount: 0,
    modalAdditionalDiscount: 0,
    changeDiscount: 0,
    modalChangeDiscount: 0,
    newProductModalIsOpen: false,
    newProductData: { productname: '', price: '', discount: 0, quantity: 1, per: '' },
    isModalNewProduct: false,
    lastAddedProduct: null,
    modalLastAddedProduct: null,
    userType: '',
    modalUserType: ''
  });

  const isMounted = useRef(true);

  const updateState = (updates) => {
    if (!isMounted.current) return;
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    isMounted.current = true;

    const messageListener = (event) => {
      console.log('Window message received:', event.data, event.origin);
    };
    window.addEventListener('message', messageListener);

    const fetchData = async () => {
      const controller = new AbortController();
      updateState({ loading: true });
      try {
        const [customers, products, quotations] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/direct/customers`, { signal: controller.signal }),
          axios.get(`${API_BASE_URL}/api/direct/aproducts`, { signal: controller.signal }),
          axios.get(`${API_BASE_URL}/api/direct/quotations`, { signal: controller.signal })
        ]);
        if (isMounted.current) {
          updateState({
            customers: Array.isArray(customers.data) ? customers.data : [],
            products: Array.isArray(products.data) ? products.data : [],
            quotations: Array.isArray(quotations.data) ? quotations.data : [],
            loading: false
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Fetch error:', err);
        if (isMounted.current) {
          updateState({ error: `Failed to fetch data: ${err.message}`, loading: false });
        }
      }
    };
    fetchData();

    const intervalId = setInterval(async () => {
      const controller = new AbortController();
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/direct/quotations`, { signal: controller.signal });
        if (isMounted.current) {
          updateState({ quotations: Array.isArray(data) ? data : [] });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Interval fetch error:', err);
        if (isMounted.current) {
          updateState({ error: `Failed to fetch quotations: ${err.message}` });
        }
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      window.removeEventListener('message', messageListener);
    };
  }, []);

  const addToCart = (isModal = false, customProduct = null) => {
    console.log('Direct: Adding to cart:', { isModal, customProduct });
    const {
      cart,
      modalCart,
      selectedProduct,
      modalSelectedProduct,
      selectedCustomer,
      modalSelectedCustomer,
      products,
      customers,
      changeDiscount,
      modalChangeDiscount,
      userType,
      modalUserType
    } = state;
    const targetCart = isModal ? modalCart : cart;
    const targetSelectedProduct = isModal ? modalSelectedProduct : selectedProduct;
    const targetDiscount = isModal ? modalChangeDiscount : changeDiscount;
    const targetUserType = isModal ? modalUserType : userType;

    if (!customProduct && !targetSelectedProduct)
      return updateState({ error: "Please select a product" });

    let product;
    if (customProduct) {
      product = {
        ...customProduct,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_type: 'Custom',
        basePrice: Math.round(Number(customProduct.price)),
        customPrice: Math.round(Number(customProduct.price)),
        quantity: Number.parseInt(customProduct.quantity) || 1,
        discount: Number.parseFloat(customProduct.discount) || targetDiscount,
        per: customProduct.per || 'Unit',
      };
    } else {
      const [id, type] = targetSelectedProduct.value.split("-");
      product = products.find(
        (p) => p.id.toString() === id && p.product_type === type
      );
      if (!product) return updateState({ error: "Product not found" });
      const customer = customers.find(
        (c) => c.id.toString() === (isModal ? modalSelectedCustomer : selectedCustomer)
      );
      const effectivePrice = getEffectivePrice(product, isModal ? modalSelectedCustomer : selectedCustomer, customers, targetUserType);
      product = {
        ...product,
        basePrice: Math.round(Number(product.price)),
        dprice: Math.round(Number(product.dprice)),
        customPrice: effectivePrice,
        quantity: 1,
        discount: Number.parseFloat(product.discount) || 0,
        per: product.per || 'Unit',
        product_type: type,
      };
    }

    updateState({
      [isModal ? 'modalCart' : 'cart']: targetCart.find(
        (item) => item.id === product.id && item.product_type === product.product_type
      )
        ? targetCart.map((item) =>
            item.id === product.id && item.product_type === product.product_type
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...targetCart, product],
      [isModal ? 'modalSelectedProduct' : 'selectedProduct']: null,
      [isModal ? 'modalLastAddedProduct' : 'lastAddedProduct']: {
        id: product.id,
        product_type: product.product_type,
      },
      error: "",
    });
  };

  const updateCartItem = (id, type, key, value, isModal = false) => {
    const cartKey = isModal ? 'modalCart' : 'cart';
    updateState({
      [cartKey]: state[cartKey].map(item =>
        item.id === id && item.product_type === type
          ? {
              ...item,
              [key]:
                key === 'customPrice'
                  ? Math.round(value < 0 ? 0 : value)
                  : key === 'discount'
                  ? Math.max(0, Math.min(100, value))
                  : value < 0
                  ? 0
                  : value,
            }
          : item
      ),
    });
  };

  const removeFromCart = (id, type, isModal = false) => {
    const cartKey = isModal ? 'modalCart' : 'cart';
    updateState({
      [cartKey]: state[cartKey].filter(
        (item) => !(item.id === id && item.product_type === type)
      ),
    });
  };

  const calculateNetRate = (targetCart = [], customerId) =>
    targetCart.reduce(
      (total, item) =>
        total + getEffectivePrice(item, customerId, state.customers, state.userType) * item.quantity,
      0
    );

  const calculateYouSave = (targetCart = [], customerId) =>
    targetCart.reduce(
      (total, item) =>
        total +
        getEffectivePrice(item, customerId, state.customers, state.userType) *
          (item.discount / 100) *
          item.quantity,
      0
    );

  const calculateTotal = (targetCart = [], customerId, isModal) => {
    const subtotal = calculateNetRate(targetCart, customerId) - calculateYouSave(targetCart, customerId);
    return Math.max(0, subtotal * (1 - (isModal ? state.modalAdditionalDiscount : state.additionalDiscount) / 100));
  };

  const openNewProductModal = (isModal = false) => {
    updateState({
      newProductModalIsOpen: true,
      isModalNewProduct: isModal,
      newProductData: { productname: '', price: '', discount: 0, quantity: 1, per: '' },
    });
  };

  const closeNewProductModal = () => {
    updateState({
      newProductModalIsOpen: false,
      isModalNewProduct: false,
      newProductData: { productname: '', price: '', discount: 0, quantity: 1, per: '' },
      error: "",
    });
  };

  const handleAddNewProduct = useCallback((productData) => {
    const { isModalNewProduct, modalChangeDiscount, changeDiscount } = state;
    if (!productData.productname) {
      return updateState({ error: "Product name is required" });
    }
    if (productData.price === '' || productData.price < 0) {
      return updateState({ error: "Price must be a non-negative number" });
    }
    if (productData.quantity === '' || productData.quantity < 1) {
      return updateState({ error: "Quantity must be at least 1" });
    }
    if (productData.discount < 0 || productData.discount > 100) {
      return updateState({ error: "Discount must be between 0 and 100" });
    }
    addToCart(isModalNewProduct, {
      ...productData,
      price: Number.parseFloat(productData.price) || 0,
      discount: Number.parseFloat(productData.discount) || (isModalNewProduct ? modalChangeDiscount : changeDiscount),
      quantity: Number.parseInt(productData.quantity) || 1,
    });
    closeNewProductModal();
  }, [state.isModalNewProduct, state.modalChangeDiscount, state.changeDiscount, addToCart, closeNewProductModal]);

  const createQuotation = async () => {
    const controller = new AbortController();
    const { selectedCustomer, cart, customers, additionalDiscount, userType } = state;
    if (!selectedCustomer || !cart.length)
      return updateState({ error: "Customer and products are required" });
    if (cart.some(item => item.quantity === 0))
      return updateState({ error: "Please remove products with zero quantity" });
    const customer = customers.find(c => c.id.toString() === selectedCustomer);
    if (!customer) return updateState({ error: "Invalid customer" });

    const quotation_id = `QUO-${Date.now()}`;
    try {
      const payload = {
        customer_id: Number(selectedCustomer),
        quotation_id,
        products: cart.map(item => ({
          id: item.id,
          product_type: item.product_type,
          productname: item.productname,
          price: getEffectivePrice(item, selectedCustomer, customers, userType),
          discount: Number.parseFloat(item.discount) || 0,
          quantity: Number.parseInt(item.quantity) || 0,
          per: item.per || 'Unit',
        })),
        net_rate: Math.round(calculateNetRate(cart)),
        you_save: Math.round(calculateYouSave(cart)),
        total: Math.round(calculateTotal(cart, selectedCustomer, false)),
        promo_discount: 0,
        additional_discount: Number.parseFloat(additionalDiscount.toFixed(2)),
        customer_type: customer.customer_type || userType || "User",
        customer_name: customer.name,
        address: customer.address,
        mobile_number: customer.mobile_number,
        email: customer.email,
        district: customer.district,
        state: customer.state,
        status: "pending",
      };

      const { data: { quotation_id: newQuotationId } } = await axios.post(
        `${API_BASE_URL}/api/direct/quotations`,
        payload,
        { signal: controller.signal }
      );
      updateState({
        quotationId: newQuotationId,
        isQuotationCreated: true,
        successMessage: "Quotation created successfully! Check downloads for PDF.",
        showSuccess: true,
        cart: [],
        selectedCustomer: "",
        selectedProduct: null,
        additionalDiscount: 0,
        changeDiscount: 0,
        lastAddedProduct: null,
        userType: '',
        quotations: [
          {
            ...payload,
            created_at: new Date().toISOString(),
            customer_name: customer.name || "N/A",
            total: payload.total,
          },
          ...state.quotations,
        ],
      });
      setTimeout(() => updateState({ showSuccess: false }), 3000);

      const pdfResponse = await axios.get(
        `${API_BASE_URL}/api/direct/quotation/${newQuotationId}`,
        { responseType: "blob", signal: controller.signal }
      );
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${(customer.name || "unknown")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")}-${newQuotationId}-quotation.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Create quotation error:', err);
      updateState({
        error: `Failed to create quotation: ${err.response?.data?.message || err.message}`,
      });
    }
    return () => controller.abort();
  };

  const editQuotation = async (quotation = null) => {
    if (quotation) {
      const products =
        typeof quotation.products === "string"
          ? JSON.parse(quotation.products)
          : quotation.products;
      updateState({
        modalMode: "edit",
        modalSelectedCustomer: quotation.customer_id?.toString() || "",
        quotationId: quotation.quotation_id,
        modalAdditionalDiscount: Number.parseFloat(quotation.additional_discount) || 0,
        modalChangeDiscount: 0,
        modalCart: products?.map(p => ({
          ...p,
          price: Math.round(Number(p.price) || 0),
          customPrice: Math.round(Number(p.price) || 0),
          quantity: Number(p.quantity) || 0,
          discount: Number(p.discount) || 0,
          per: p.per || 'Unit',
          product_type: p.product_type,
        })) || [],
        modalIsOpen: true,
        modalUserType: quotation.customer_type || '',
      });
      return;
    }

    const controller = new AbortController();
    const { modalSelectedCustomer, modalCart, modalAdditionalDiscount, customers, quotationId, modalUserType } = state;
    if (!modalSelectedCustomer || !modalCart.length)
      return updateState({ error: "Customer and products are required" });
    if (modalCart.some(item => item.quantity === 0))
      return updateState({ error: "Please remove products with zero quantity" });

    try {
      const customer = customers.find(c => c.id.toString() === modalSelectedCustomer);
      const payload = {
        customer_id: Number(modalSelectedCustomer),
        products: modalCart.map(item => ({
          id: item.id,
          product_type: item.product_type,
          productname: item.productname,
          price: getEffectivePrice(item, modalSelectedCustomer, customers, modalUserType),
          discount: Number.parseFloat(item.discount) || 0,
          quantity: Number.parseInt(item.quantity) || 0,
          per: item.per || 'Unit',
        })),
        net_rate: Math.round(calculateNetRate(modalCart)),
        you_save: Math.round(calculateYouSave(modalCart)),
        total: Math.round(calculateTotal(modalCart, modalSelectedCustomer, true)),
        promo_discount: 0,
        additional_discount: Number.parseFloat(modalAdditionalDiscount.toFixed(2)),
        status: "pending",
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/direct/quotations/${quotationId}`,
        payload,
        { responseType: "blob", signal: controller.signal }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${(customer?.name || "unknown")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")}-${quotationId}-quotation.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      updateState({
        quotations: state.quotations.map(q =>
          q.quotation_id === quotationId
            ? { ...q, ...payload, customer_name: customer?.name || "N/A", total: payload.total }
            : q
        ),
        successMessage: "Quotation updated successfully! Check downloads for PDF.",
        showSuccess: true,
        modalIsOpen: false,
        modalMode: null,
        modalCart: [],
        modalSelectedCustomer: "",
        modalSelectedProduct: null,
        orderId: "",
        modalAdditionalDiscount: 0,
        modalChangeDiscount: 0,
        modalLastAddedProduct: null,
        modalUserType: '',
        error: "",
      });
      setTimeout(() => updateState({ showSuccess: false }), 3000);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Edit quotation error:', err);
      let errorMessage = "Failed to update quotation";
      if (err.response?.status === 400) {
        try {
          const text = await err.response.data.text();
          errorMessage = JSON.parse(text).message || errorMessage;
        } catch (e) {}
      }
      updateState({ error: `Failed to update quotation: ${errorMessage}` });
    }
    return () => controller.abort();
  };

  const cancelQuotation = async (quotationIdToCancel = null) => {
    const controller = new AbortController();
    const { quotationId, customers, selectedCustomer, cart, selectedProduct, additionalDiscount, changeDiscount, userType } = state;
    const targetQuotationId = quotationIdToCancel || quotationId;
    if (!targetQuotationId) return updateState({ error: "No quotation to cancel" });
    try {
      await axios.put(`${API_BASE_URL}/api/direct/quotations/cancel/${targetQuotationId}`, {}, { signal: controller.signal });
      updateState({
        ...(quotationIdToCancel
          ? {}
          : {
              cart: [],
              selectedCustomer: "",
              selectedProduct: null,
              quotationId: null,
              isQuotationCreated: false,
              additionalDiscount: 0,
              changeDiscount: 0,
              lastAddedProduct: null,
              userType: '',
            }),
        successMessage: "Quotation canceled successfully!",
        showSuccess: true,
        quotations: state.quotations.map(q =>
          q.quotation_id === targetQuotationId ? { ...q, status: "cancelled" } : q
        ),
      });
      setTimeout(() => updateState({ showSuccess: false }), 3000);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Cancel quotation error:', err);
      updateState({
        error: `Failed to cancel quotation: ${err.response?.data?.message || err.message}`,
      });
    }
    return () => controller.abort();
  };

  const convertToBooking = async (quotation = null) => {
    if (quotation) {
      const products =
        typeof quotation.products === "string"
          ? JSON.parse(quotation.products)
          : quotation.products;
      updateState({
        modalMode: "book",
        modalSelectedCustomer: quotation.customer_id?.toString() || "",
        quotationId: quotation.quotation_id,
        orderId: `ORD-${Date.now()}`,
        modalAdditionalDiscount: Number.parseFloat(quotation.additional_discount) || 0,
        modalChangeDiscount: 0,
        modalCart: products?.map(p => ({
          ...p,
          price: Math.round(Number(p.price) || 0),
          customPrice: Math.round(Number(p.price) || 0),
          quantity: Number(p.quantity) || 0,
          discount: Number(p.discount) || 0,
          per: p.per || 'Unit',
          product_type: p.product_type,
        })) || [],
        modalIsOpen: true,
        modalUserType: quotation.customer_type || '',
      });
      return;
    }

    const controller = new AbortController();
    const { modalSelectedCustomer, modalCart, orderId, quotationId, customers, modalAdditionalDiscount, modalUserType } = state;
    if (!modalSelectedCustomer || !modalCart.length || !orderId || !quotationId)
      return updateState({ error: "Customer, products, order ID, and quotation ID are required" });
    if (modalCart.some(item => item.quantity <= 0))
      return updateState({ error: "Please remove products with zero quantity" });
    const customer = customers.find(c => c.id.toString() === modalSelectedCustomer);
    if (!customer || !customer.name || !customer.address || !customer.mobile_number || !customer.district || !customer.state)
      return updateState({ error: "Customer data is incomplete" });

    try {
      const payload = {
        customer_id: Number(modalSelectedCustomer),
        order_id: orderId,
        quotation_id: quotationId,
        products: modalCart.map(item => ({
          id: item.id,
          product_type: item.product_type,
          productname: item.productname,
          price: getEffectivePrice(item, modalSelectedCustomer, customers, modalUserType),
          discount: Number.parseFloat(item.discount) || 0,
          quantity: Number.parseInt(item.quantity) || 0,
          per: item.per || 'Unit',
        })),
        net_rate: Math.round(calculateNetRate(modalCart)),
        you_save: Math.round(calculateYouSave(modalCart)),
        total: Math.round(calculateTotal(modalCart, modalSelectedCustomer, true)),
        promo_discount: 0,
        additional_discount: Number.parseFloat(modalAdditionalDiscount.toFixed(2)),
        customer_type: customer.customer_type || modalUserType || "User",
        customer_name: customer.name,
        address: customer.address,
        mobile_number: customer.mobile_number,
        email: customer.email,
        district: customer.district,
        state: customer.state,
      };

      const { data: { order_id: newOrderId } } = await axios.post(
        `${API_BASE_URL}/api/direct/bookings`,
        payload,
        { signal: controller.signal }
      );
      const pdfResponse = await axios.get(
        `${API_BASE_URL}/api/direct/invoice/${newOrderId}`,
        { responseType: "blob", signal: controller.signal }
      );
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${(customer.name || "unknown")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")}-${newOrderId}-invoice.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      updateState({
        quotations: state.quotations.map(q =>
          q.quotation_id === quotationId ? { ...q, status: "booked" } : q
        ),
        successMessage: "Booking created successfully! Check downloads for PDF.",
        showSuccess: true,
        modalIsOpen: false,
        modalMode: null,
        modalCart: [],
        modalSelectedCustomer: "",
        modalSelectedProduct: null,
        orderId: "",
        modalAdditionalDiscount: 0,
        modalChangeDiscount: 0,
        modalLastAddedProduct: null,
        modalUserType: '',
        error: "",
      });
      setTimeout(() => updateState({ showSuccess: false }), 3000);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Convert to booking error:', err);
      updateState({
        error: `Failed to create booking: ${err.response?.data?.message || err.message}`,
      });
    }
    return () => controller.abort();
  };

  const renderSelect = (value, onChange, options, label, id) => (
    <div className="flex flex-col items-center mobile:w-full">
      <label className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-2 mobile:text-base">{label}</label>
      <Select
        value={options.find(c => c.value === value) || null}
        onChange={onChange}
        options={options}
        placeholder={`Search for a ${label.toLowerCase()}...`}
        isClearable
        className="mobile:w-full onefifty:w-96"
        classNamePrefix="react-select"
        styles={selectStyles}
      />
    </div>
  );

  const {
    customers,
    products,
    quotations,
    selectedCustomer,
    cart,
    selectedProduct,
    error,
    loading,
    successMessage,
    showSuccess,
    modalIsOpen,
    modalMode,
    modalCart,
    modalSelectedProduct,
    modalSelectedCustomer,
    orderId,
    additionalDiscount,
    modalAdditionalDiscount,
    changeDiscount,
    modalChangeDiscount,
    newProductModalIsOpen,
    newProductData,
    lastAddedProduct,
    modalLastAddedProduct,
    userType,
  } = state;

  return (
    <div className="flex min-h-screen dark:bg-gray-800 bg-gray-50 mobile:flex-col">
      <Sidebar />
      <Logout />
      <div className="flex-1 hundred:ml-64 p-6 pt-16 mobile:p-2">
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 mobile:text-2xl dark:text-gray-100">Direct Booking</h1>
          {loading && <div className="text-center text-gray-500">Loading...</div>}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm">
              {error}
            </div>
          )}
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm">
              {successMessage}
            </div>
          )}
          <div className="flex flex-wrap gap-6 justify-center mb-8 mobile:flex-col mobile:gap-3">
            {renderSelect(
              selectedCustomer,
              (option) => updateState({ selectedCustomer: option ? option.value : '' }),
              customers.map(c => ({ value: c.id.toString(), label: c.name })),
              "Customer",
              "main-customer-select"
            )}
            {renderSelect(
              userType,
              (option) => updateState({ userType: option ? option.value : '' }),
              [{ value: 'User', label: 'User' }, { value: 'Customer', label: 'Customer' }],
              "User Type",
              "main-user-type-select"
            )}
            <QuotationTableErrorBoundary>
              <QuotationTable
                cart={cart}
                products={products}
                selectedProduct={selectedProduct}
                setSelectedProduct={(val) => updateState({ selectedProduct: val })}
                addToCart={addToCart}
                updateQuantity={(id, type, val, isModal) =>
                  updateCartItem(id, type, 'quantity', val, isModal)
                }
                updateDiscount={(id, type, val, isModal) =>
                  updateCartItem(id, type, 'discount', val, isModal)
                }
                updatePrice={(id, type, val, isModal) =>
                  updateCartItem(id, type, 'customPrice', val, isModal)
                }
                removeFromCart={removeFromCart}
                calculateNetRate={calculateNetRate}
                calculateYouSave={calculateYouSave}
                calculateTotal={calculateTotal}
                selectedCustomer={selectedCustomer}
                modalSelectedCustomer={modalSelectedCustomer}
                customers={customers}
                additionalDiscount={additionalDiscount}
                setAdditionalDiscount={(val) => updateState({ additionalDiscount: val })}
                changeDiscount={changeDiscount}
                setChangeDiscount={(val) => updateState({ changeDiscount: val })}
                openNewProductModal={() => openNewProductModal(false)}
                updateState={updateState}
                lastAddedProduct={lastAddedProduct}
                setLastAddedProduct={(val) => updateState({ lastAddedProduct: val })}
                userType={userType}
              />
            </QuotationTableErrorBoundary>
          </div>
          <div className="flex justify-center gap-4 mt-8 mobile:mt-4 mobile:flex-col">
            <button
              onClick={createQuotation}
              disabled={!selectedCustomer || !cart.length}
              className={`onefifty:w-50 h-10 text-white px-8 rounded-lg font-bold shadow ${
                !selectedCustomer || !cart.length
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              style={styles.button}
            >
              Create Quotation
            </button>
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800 mobile:text-xl">
              All Quotations
            </h2>
            {quotations.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
                {quotations.map(q => (
                  <div key={q.quotation_id} className="p-6 rounded-lg shadow-lg" style={styles.card}>
                    <h3 className="text-lg font-bold mb-2 mobile:text-base text-gray-900">
                      {q.quotation_id}
                    </h3>
                    {[
                      { label: "Customer", value: q.customer_name || "N/A" },
                      { label: "Total", value: `₹${Math.round(Number.parseFloat(q.total))}` },
                      q.additional_discount > 0 && {
                        label: "Additional Discount",
                        value: `${Number.parseFloat(q.additional_discount).toFixed(2)}%`,
                      },
                      {
                        label: "Status",
                        value: (
                          <span
                            className={`capitalize ${
                              q.status === "pending"
                                ? "text-yellow-600"
                                : q.status === "booked"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {q.status}
                          </span>
                        ),
                      },
                      {
                        label: "Created At",
                        value: new Date(q.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }),
                      },
                    ]
                      .filter(Boolean)
                      .map(({ label, value }) => (
                        <div key={label} className="text-sm mb-1 mobile:text-xs text-gray-900">
                          <span className="font-semibold">{label}:</span> {value}
                        </div>
                      ))}
                    <div className="flex gap-2 mobile:flex-col">
                      {[
                        {
                          onClick: () => editQuotation(q),
                          disabled: q.status !== "pending",
                          className: "bg-yellow-600 hover:bg-yellow-700",
                          text: "Edit",
                        },
                        {
                          onClick: () => convertToBooking(q),
                          disabled: q.status !== "pending",
                          className: "bg-green-600 hover:bg-green-700",
                          text: "Convert to Booking",
                        },
                        {
                          onClick: () => cancelQuotation(q.quotation_id),
                          disabled: q.status !== "pending",
                          className: "bg-red-600 hover:bg-red-700",
                          text: "Cancel",
                        },
                      ].map(({ onClick, disabled, className, text }) => (
                        <button
                          key={text}
                          onClick={onClick}
                          disabled={disabled}
                          className={`flex-1 text-white px-4 py-2 rounded-lg font-bold text-sm ${
                            disabled ? "bg-gray-400 cursor-not-allowed" : className
                          }`}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 mobile:p-2 mobile:text-xs">
                No quotations available
              </div>
            )}
          </div>
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() =>
              updateState({
                modalIsOpen: false,
                modalMode: null,
                modalCart: [],
                modalSelectedCustomer: "",
                modalSelectedProduct: null,
                orderId: "",
                modalAdditionalDiscount: 0,
                modalChangeDiscount: 0,
                modalLastAddedProduct: null,
                modalUserType: '',
                error: "",
              })
            }
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed inset-0 bg-black/50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mobile:p-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
                {modalMode === "edit" ? "Edit Quotation" : "Convert to Booking"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg mb-6 text-center shadow-md mobile:text-sm">
                  {error}
                </div>
              )}
              {modalMode === "book" && (
                <div className="flex flex-col items-center mobile:w-full mb-6">
                  <label className="text-lg font-semibold dark:text-gray-100 text-gray-700 mb-2 mobile:text-base">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => updateState({ orderId: e.target.value })}
                    className="onefifty:w-96 p-3 rounded-lg bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 mobile:w-full mobile:p-2 mobile:text-sm"
                    style={styles.input}
                    placeholder="Enter Order ID"
                  />
                </div>
              )}
              <FormFields
                isEdit={modalMode === "edit"}
                customers={customers}
                modalSelectedCustomer={modalSelectedCustomer}
                setModalSelectedCustomer={(val) => updateState({ modalSelectedCustomer: val })}
                modalCart={modalCart}
                products={products}
                modalSelectedProduct={modalSelectedProduct}
                setModalSelectedProduct={(val) => updateState({ modalSelectedProduct: val })}
                addToCart={addToCart}
                updateQuantity={(id, type, val, isModal) =>
                  updateCartItem(id, type, 'quantity', val, isModal)
                }
                updateDiscount={(id, type, val, isModal) =>
                  updateCartItem(id, type, 'discount', val, isModal)
                }
                updatePrice={(id, type, val, isModal) =>
                  updateCartItem(id, type, 'customPrice', val, isModal)
                }
                removeFromCart={removeFromCart}
                calculateNetRate={calculateNetRate}
                calculateYouSave={calculateYouSave}
                calculateTotal={calculateTotal}
                handleSubmit={modalMode === "edit" ? () => editQuotation() : () => convertToBooking()}
                closeModal={() =>
                  updateState({
                    modalIsOpen: false,
                    modalMode: null,
                    modalCart: [],
                    modalSelectedCustomer: "",
                    modalSelectedProduct: null,
                    orderId: "",
                    modalAdditionalDiscount: 0,
                    modalChangeDiscount: 0,
                    modalLastAddedProduct: null,
                    modalUserType: '',
                    error: "",
                  })
                }
                modalAdditionalDiscount={modalAdditionalDiscount}
                setModalAdditionalDiscount={(val) => updateState({ modalAdditionalDiscount: val })}
                modalChangeDiscount={modalChangeDiscount}
                setModalChangeDiscount={(val) => updateState({ modalChangeDiscount: val })}
                openNewProductModal={() => openNewProductModal(true)}
                updateState={updateState}
                modalLastAddedProduct={modalLastAddedProduct}
                modalUserType={state.modalUserType}
              />
            </div>
          </Modal>
          <NewProductModal
            isOpen={newProductModalIsOpen}
            onClose={closeNewProductModal}
            onSubmit={handleAddNewProduct}
            newProductData={newProductData}
            setNewProductData={(data) => updateState({ newProductData: data })}
          />
        </div>
      </div>
    </div>
  );
}