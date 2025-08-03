import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus, FaArrowLeft, FaArrowRight, FaInfoCircle, FaTimes } from "react-icons/fa";
import Navbar from "../Component/Navbar";
import { API_BASE_URL } from "../../Config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import need from "../default.jpg";
import "../App.css";

const BigFireworkAnimation = ({ delay = 0 }) => {
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080;
  const burstPosition = { x: screenWidth * 0.5, y: screenHeight * 0.5 };
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <motion.div className="absolute" style={{ left: burstPosition.x, top: burstPosition.y, transform: "translate(-50%, -50%)" }}>
        {Array.from({ length: 32 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-4 h-4 rounded-full"
            style={{ background: `hsl(${(i * 15) % 360}, 80%, 65%)`, boxShadow: `0 0 20px hsl(${(i * 15) % 360}, 80%, 65%)` }}
            animate={{ x: Math.cos(i * 11.25 * (Math.PI / 180)) * screenWidth * 0.4, y: Math.sin(i * 11.25 * (Math.PI / 180)) * screenWidth * 0.4, opacity: [1, 0.8, 0], scale: [1, 1.2, 0] }}
            transition={{ duration: 4, delay, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="absolute w-48 h-48 rounded-full"
          style={{ background: "radial-gradient(circle, #ffd93d 0%, #ff6b6b66 30%, transparent 70%)", transform: "translate(-50%, -50%)", boxShadow: "0 0 100px #ffd93d" }}
          animate={{ scale: [0, 4, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 4, delay, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full border-4"
          style={{ margin: "-192px 0 0 -192px", borderColor: "#ffd93d", boxShadow: "0 0 60px #ffd93d" }}
          animate={{ scale: [0, 3, 4], opacity: [0, 0.8, 0] }}
          transition={{ duration: 4, delay: delay + 0.2, ease: "easeOut" }}
        />
      </motion.div>
    </div>
  );
};

const Loader = ({ showWarning }) => (
  <div className="fixed inset-0 bg-white/90 z-70 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="loader-spinner w-16 h-16 border-4 border-t-sky-500 border-gray-200 rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-sky-700">
        {showWarning ? "Your network is slow. Please check your internet and try again." : "Loading products..."}
      </p>
    </motion.div>
  </div>
);

const ImageModal = ({ media, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const mediaItems = useMemo(() => {
    const items = media && typeof media === 'string' ? JSON.parse(media) : (Array.isArray(media) ? media : []);
    return items.filter(item => !item.startsWith('data:video/'));
  }, [media]);

  const handlePrev = () => setCurrentIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));

  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative max-w-4xl w-full h-[80vh] mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-red-400"
          aria-label="Close image modal"
        >
          <FaTimes />
        </button>
        <img
          src={mediaItems[currentIndex] || need}
          alt="Enlarged product"
          className="w-full h-full object-contain rounded-xl"
        />
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-xl z-10 hover:bg-sky-700 hover:text-white"
              aria-label="Previous image"
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-xl z-10 hover:bg-sky-700 hover:text-white"
              aria-label="Next image"
            >
              <FaArrowRight />
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {mediaItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-sky-700' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const Carousel = ({ media, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const mediaItems = useMemo(() => {
    const items = media && typeof media === 'string' ? JSON.parse(media) : (Array.isArray(media) ? media : []);
    return items.sort((a, b) => {
      const aStr = typeof a === 'string' ? a : '';
      const bStr = typeof b === 'string' ? b : '';
      const isAVideo = aStr.startsWith('data:video/');
      const isBVideo = bStr.startsWith('data:video/');
      const isAGif = aStr.startsWith('data:image/gif') || aStr.toLowerCase().endsWith('.gif');
      const isBGif = bStr.startsWith('data:image/gif') || bStr.toLowerCase().endsWith('.gif');
      const isAImage = aStr.startsWith('data:image/') && !isAGif;
      const isBImage = bStr.startsWith('data:image/') && !isBGif;
      return (isAImage ? 0 : isAGif ? 1 : isAVideo ? 2 : 3) - (isBImage ? 0 : isBGif ? 1 : isBVideo ? 2 : 3);
    });
  }, [media]);

  const isVideo = (item) => typeof item === 'string' && item.startsWith('data:video/');

  const handlePrev = () => setCurrentIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    if (diffX > 50) handleNext();
    else if (diffX < -50) handlePrev();
  };

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className="w-full h-30 rounded-2xl mb-4 overflow-hidden bg-sky-300 flex items-center justify-center">
        <img src={need} alt="Default product" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-30 rounded-2xl mb-4 overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,255,0.4))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isVideo(mediaItems[currentIndex]) ? (
        <video src={mediaItems[currentIndex]} autoPlay muted loop className="w-full h-full object-contain p-2" />
      ) : (
        <img
          src={mediaItems[currentIndex] || need}
          alt="Product"
          className="w-full h-full object-contain p-2 cursor-pointer"
          onClick={onImageClick}
        />
      )}
      {mediaItems.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="mobile:hidden sm:flex absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-lg z-10 hover:bg-sky-700 hover:text-white cursor-pointer"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
            aria-label="Previous media"
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="mobile:hidden sm:flex absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-lg z-10 hover:bg-sky-700 hover:text-white cursor-pointer"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
            aria-label="Next media"
          >
            <FaArrowRight />
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
            {mediaItems.map((_, index) => (
              <div key={index} className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-sky-700' : 'bg-gray-300'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Pricelist = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    customer_name: "",
    address: "",
    district: "",
    state: "",
    mobile_number: "",
    email: "",
    customer_type: "User"
  });
  const [selectedType, setSelectedType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [promocode, setPromocode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [promocodes, setPromocodes] = useState([]);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const debounceTimeout = useRef(null);
  const loadingTimeout = useRef(null);

  const styles = {
    card: { background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(224,242,254,0.3), rgba(186,230,253,0.2))", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 25px 45px rgba(2,132,199,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(2,132,199,0.1)" },
    button: { background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" },
    input: { background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)" },
    modal: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 25px 45px rgba(2,132,199,0.2)" }
  };

  const formatPrice = (price) => {
    const num = Number.parseFloat(price) || 0;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const capitalize = str => str ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

  const downloadPDF = () => {
    try {
      if (!products.length || !productTypes.length) {
        showError('No products or product types available to export');
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yOffset = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FUN WITH CRACKERS', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Website - www.funwithcrackers.com', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 10;
      doc.text('Retail Pricelist - 2025', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 20;

      const tableData = [];
      productTypes
        .filter(type => type !== "All")
        .forEach(type => {
          const typeKey = type.replace(/ /g, "_");
          const typeProducts = products.filter(product => product.product_type === typeKey);
          if (typeProducts.length > 0) {
            tableData.push([{ content: capitalize(type), colSpan: 4, styles: { fontStyle: 'bold', halign: 'left', fillColor: [200, 200, 200] } }]);
            tableData.push(['Serial No.', 'Product Name', 'Rate', 'Per']);
            typeProducts.forEach(product => {
              tableData.push([
                product.serial_number,
                product.productname,
                `Rs.${formatPrice(product.price)}`,
                product.per,
              ]);
            });
            tableData.push([]);
          }
        });

      autoTable(doc, {
        startY: yOffset,
        head: [['Serial No.', 'Product Name', 'Rate', 'Per']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 70 }, 2: { cellWidth: 40 }, 3: { cellWidth: 30 } },
        didDrawCell: (data) => {
          if (data.row.section === 'body' && data.cell.raw && data.cell.raw.colSpan === 4) {
            data.cell.styles.cellPadding = 5;
            data.cell.styles.fontSize = 12;
          }
        },
      });

      doc.save('FWC_Pricelist_2025.pdf');
    } catch (err) {
      showError('Failed to generate PDF: ' + err.message);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        loadingTimeout.current = setTimeout(() => {
          setShowNetworkWarning(true);
        }, 5000);

        const savedCart = localStorage.getItem("firecracker-cart");
        if (savedCart) setCart(JSON.parse(savedCart));
        const [statesRes, productsRes, promocodesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/locations/states`),
          fetch(`${API_BASE_URL}/api/products`),
          fetch(`${API_BASE_URL}/api/promocodes`),
        ]);
        const [statesData, productsData, promocodesData] = await Promise.all([
          statesRes.json(),
          productsRes.json(),
          promocodesRes.json(),
        ]);
        setStates(Array.isArray(statesData) ? statesData : []);

        const naturalSort = (a, b) => {
          const collator = new Intl.Collator(undefined, {
            numeric: true,
            sensitivity: "base",
          });
          return collator.compare(a.productname, b.productname);
        };

        const seenSerials = new Set();
        const normalizedProducts = productsData.data
          .filter((p) => {
            if (p.status !== "on") return false;
            if (seenSerials.has(p.serial_number)) {
              console.warn(`Duplicate serial_number found: ${p.serial_number}`);
              return false;
            }
            seenSerials.add(p.serial_number);
            return true;
          })
          .map((product) => ({
            ...product,
            images: product.image
              ? typeof product.image === "string"
                ? JSON.parse(product.image)
                : product.image
              : [],
          }))
          .sort(naturalSort);

        setProducts(normalizedProducts);
        setPromocodes(Array.isArray(promocodesData) ? promocodesData : []);
        setIsLoading(false);
        clearTimeout(loadingTimeout.current);
      } catch (err) {
        console.error("Error loading initial data:", err);
        toast.error("Failed to load initial data", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setIsLoading(false);
        clearTimeout(loadingTimeout.current);
      }
    };
    initializeData();

    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (customerDetails.state) {
      fetch(`${API_BASE_URL}/api/locations/states/${customerDetails.state}/districts`)
        .then(res => res.json())
        .then(data => setDistricts(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Error fetching districts:", err);
          toast.error("Failed to load districts", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        });
    }
  }, [customerDetails.state]);

  useEffect(() => localStorage.setItem("firecracker-cart", JSON.stringify(cart)), [cart]);

  const addToCart = useCallback((product) => {
    if (!product?.serial_number) {
      toast.error("Invalid product or missing serial_number", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    setCart(prev => ({ ...prev, [product.serial_number]: (prev[product.serial_number] || 0) + 1 }));
  }, []);

  const removeFromCart = useCallback(product => {
    if (!product?.serial_number) {
      toast.error("Invalid product or missing serial_number", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    setCart(prev => {
      const count = (prev[product.serial_number] || 1) - 1;
      const updated = { ...prev };
      if (count <= 0) delete updated[product.serial_number];
      else updated[product.serial_number] = count;
      return updated;
    });
  }, []);

  const handleFinalCheckout = async () => {
    setIsBooking(true);
    const order_id = `ORD-${Date.now()}`;
    const selectedProducts = Object.entries(cart).map(([serial, qty]) => {
      const product = products.find(p => p.serial_number === serial);
      return {
        id: product.id,
        product_type: product.product_type,
        quantity: qty,
        per: product.per,
        image: product.image,
        price: product.price,
        discount: product.discount,
        serial_number: product.serial_number,
        productname: product.productname,
        status: product.status
      };
    });
    if (!selectedProducts.length) {
      setIsBooking(false);
      return showError("Your cart is empty.");
    }
    if (!customerDetails.customer_name.trim()) {
      setIsBooking(false);
      return showError("Customer name is required.");
    }
    if (!customerDetails.address.trim()) {
      setIsBooking(false);
      return showError("Address is required.");
    }
    if (!customerDetails.district.trim()) {
      setIsBooking(false);
      return showError("District is required.");
    }
    if (!customerDetails.state.trim()) {
      setIsBooking(false);
      return showError("Please select a state.");
    }
    if (!customerDetails.mobile_number.trim()) {
      setIsBooking(false);
      return showError("Mobile number is required.");
    }
    const mobile = customerDetails.mobile_number.replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10) {
      setIsBooking(false);
      return showError("Mobile number must be 10 digits.");
    }
    if (customerDetails.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      setIsBooking(false);
      return showError("Please enter a valid email address.");
    }
    const selectedState = customerDetails.state.trim();
    const minOrder = states.find(s => s.name === selectedState)?.min_rate;
    if (minOrder && parseFloat(totals.total) < minOrder) {
      setIsBooking(false);
      return showError(`Minimum order for ${selectedState} is ₹${minOrder}. Your total is ₹${totals.total}.`);
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/direct/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id,
          products: selectedProducts,
          net_rate: parseFloat(totals.net),
          you_save: parseFloat(totals.save),
          total: parseFloat(totals.total),
          promo_discount: parseFloat(totals.promo_discount || '0.00'),
          customer_type: customerDetails.customer_type,
          customer_name: customerDetails.customer_name,
          address: customerDetails.address,
          mobile_number: mobile,
          email: customerDetails.email,
          district: customerDetails.district,
          state: customerDetails.state,
          promocode: appliedPromo?.code || null
        })
      });
      const data = await response.json();
      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
        setCart({});
        setAppliedPromo(null);
        setPromocode("");
        setIsCartOpen(false);
        setShowModal(false);
        setCustomerDetails({ customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User" });
        setOriginalTotal(0);
        setTotalDiscount(0);

        const pdfResponse = await fetch(`${API_BASE_URL}/api/direct/invoice/${data.order_id}`, { responseType: 'blob' });
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeCustomerName = (customerDetails.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        link.setAttribute('download', `${safeCustomerName}-${data.order_id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Downloaded estimate bill, check downloads", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        showError(data.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      showError("Something went wrong during checkout. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const showError = message => {
    setErrorMessage(message);
    setShowErrorModal(true);
    setTimeout(() => setShowErrorModal(false), 5000);
  };

  const handleCheckoutClick = () => {
    Object.keys(cart).length ? (setShowModal(true), setIsCartOpen(false)) : showError("Your cart is empty.");
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (name === 'mobile_number') {
      const cleaned = value.replace(/\D/g, '').slice(-10);
      setCustomerDetails(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setCustomerDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleShowDetails = useCallback((product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedProduct(null);
    setShowDetailsModal(false);
  }, []);

  const handleShowImage = useCallback((product) => {
    setSelectedProduct(product);
    setShowImageModal(true);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedProduct(null);
    setShowImageModal(false);
  }, []);

  const totals = useMemo(() => {
    let net = 0, save = 0, total = 0, productDiscount = 0, promoDiscount = 0;
    for (const serial in cart) {
      const qty = cart[serial];
      const product = products.find(p => p.serial_number === serial);
      if (!product) continue;
      const originalPrice = Number.parseFloat(product.price) || 0;
      const discount = originalPrice * (Number.parseFloat(product.discount) / 100 || 0);
      const priceAfterProductDiscount = originalPrice - discount;
      net += originalPrice * qty;
      productDiscount += discount * qty;
      let itemTotal = priceAfterProductDiscount * qty;

      // Apply promocode discount if applicable
      if (appliedPromo) {
        const promoDiscountRate = Number.parseFloat(appliedPromo.discount) || 0;
        const isApplicable = !appliedPromo.product_type || product.product_type === appliedPromo.product_type;
        if (isApplicable) {
          const promoDiscountAmount = (itemTotal * promoDiscountRate) / 100;
          promoDiscount += promoDiscountAmount;
          itemTotal -= promoDiscountAmount;
        }
      }
      total += itemTotal;
    }
    save = productDiscount + promoDiscount;
    return { 
      net: formatPrice(net), 
      save: formatPrice(save), 
      total: formatPrice(total), 
      promo_discount: formatPrice(promoDiscount),
      product_discount: formatPrice(productDiscount)
    };
  }, [cart, products, appliedPromo]);

  const handleApplyPromo = useCallback(async (code) => {
    if (!code) {
      setAppliedPromo(null);
      setPromocode("");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes`);
      const promos = await res.json();
      const found = promos.find(p => p.code.toLowerCase() === code.toLowerCase());
      
      if (!found) {
        showError("Invalid promocode.");
        setAppliedPromo(null);
        setPromocode("");
        return;
      }
      
      if (found.min_amount && parseFloat(totals.total) < found.min_amount) {
        showError(`Minimum order amount for this promocode is ₹${found.min_amount}. Your total is ₹${totals.total}.`);
        setAppliedPromo(null);
        setPromocode("");
        return;
      }
      
      if (found.end_date && new Date(found.end_date) < new Date()) {
        showError("This promocode has expired.");
        setAppliedPromo(null);
        setPromocode("");
        return;
      }
      
      // Check if promocode is applicable to at least one product in the cart
      if (found.product_type) {
        const cartProductTypes = Object.keys(cart).map(serial => {
          const product = products.find(p => p.serial_number === serial);
          return product?.product_type || "Others";
        });
        if (!cartProductTypes.some(type => type === found.product_type)) {
          showError(`This promocode is only valid for ${found.product_type.replace(/_/g, " ")} products, and none are in your cart.`);
          setAppliedPromo(null);
          setPromocode("");
          return;
        }
      }
      
      setAppliedPromo(found);
      toast.success(`Promocode ${found.code} applied successfully! Discount: ${found.discount}%`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error("Promo apply error:", err);
      showError("Could not validate promocode.");
      setAppliedPromo(null);
      setPromocode("");
    }
  }, [cart, products, totals.total]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (promocode && promocode !== "custom") handleApplyPromo(promocode);
      else if (promocode === "custom") {
        // Handle custom code input without immediate validation
      } else {
        setAppliedPromo(null);
      }
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [promocode, handleApplyPromo]);

  const productTypes = useMemo(() => {
    const types = [...new Set(products
      .filter(p => p.product_type !== "gift_box_dealers")
      .map(p => (p.product_type || "Others").replace(/_/g, " "))
    )];
    return ["All", ...types.sort()];
  }, [products]);

  const grouped = useMemo(() => products
    .filter(p => p.product_type !== "gift_box_dealers" &&
             (selectedType === "All" || p.product_type === selectedType.replace(/ /g, "_")) &&
             (!searchTerm || 
              p.productname.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.serial_number.toLowerCase().includes(searchTerm.toLowerCase())))
    .reduce((acc, p) => {
      const key = p.product_type || "Others";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {}), [products, selectedType, searchTerm]);

  if (isLoading) {
    return (
      <>
        <ToastContainer />
        <Loader showWarning={showNetworkWarning} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer />
      {isCartOpen && <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsCartOpen(false)} />}
      {showSuccess && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <BigFireworkAnimation delay={0} />
          <motion.div className="flex flex-col items-center gap-4 z-10" style={{ background: "none" }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <motion.h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent" style={{ textShadow: "0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5)" }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: 1, delay: 0.5 }}>Booked</motion.h2>
          </motion.div>
        </motion.div>
      )}
      {showErrorModal && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="bg-red-200 text-red-400 border-2 text-lg font-semibold rounded-xl p-6 max-w-md mx-4 text-center shadow-lg">{errorMessage}</div>
        </motion.div>
      )}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-55 flex items-center justify-center details-modal">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative rounded-3xl shadow-lg max-w-md w-full mx-4 overflow-hidden" style={styles.modal}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-sky-700 drop-shadow-sm">{selectedProduct.productname}</h2>
                <button onClick={handleCloseDetails} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer" aria-label="Close details modal">×</button>
              </div>
              <Carousel media={selectedProduct.image} onImageClick={() => handleShowImage(selectedProduct)} />
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-800">Description</h3>
                <p className="text-sm text-slate-600 mt-2">{selectedProduct.description || "No description available."}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleCloseDetails} className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}>Close</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {showImageModal && selectedProduct && (
        <AnimatePresence>
          <ImageModal media={selectedProduct.image} onClose={handleCloseImage} />
        </AnimatePresence>
      )}
      <main className={`relative pt-28 px-4 sm:px-8 max-w-7xl mx-auto transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
        <section className="rounded-xl px-4 py-3 shadow-inner flex justify-between flex-wrap gap-4 text-sm sm:text-base border border-sky-300 bg-gradient-to-br from-sky-400/80 to-sky-600/90 text-white font-semibold">
          <div>Net Rate: ₹{totals.net}</div>
          <div>You Save: ₹{totals.save}</div>
          {appliedPromo && <div>Promocode ({appliedPromo.code}): -₹{totals.promo_discount}</div>}
          <div className="font-bold">Total: ₹{totals.total}</div>
        </section>
        <div className="flex justify-center gap-4 mb-8 mt-8">
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="px-4 py-3 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input}>
            {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search by name or serial number"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="rounded-xl px-2 w-1/2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300"
            style={styles.input}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            className="px-8 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer"
            style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}
          >
            Download Pricelist
          </motion.button>
        </motion.div>
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="mt-12 mb-10">
            <h2 className="text-3xl text-sky-800 mb-5 font-semibold capitalize border-b-4 border-sky-500 pb-2">{type.replace(/_/g, " ")}</h2>
            <div className="grid mobile:grid-cols-2 onefifty:grid-cols-3 hundred:grid-cols-4 gap-6">
              {items.map(product => {
                if (!product) return null;
                const originalPrice = Number.parseFloat(product.price);
                const discount = originalPrice * (product.discount / 100);
                const finalPrice = product.discount > 0 ? formatPrice(originalPrice - discount) : formatPrice(originalPrice);
                const count = cart[product.serial_number] || 0;
                return (
                  <motion.div
                    key={product.serial_number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500"
                    style={styles.card}
                  >
                    {product.discount > 0 && (
                      <div className="absolute left-2 top-2 bg-red-500 text-white text-md font-bold px-2 py-1 rounded-br-lg rounded-tl-lg mobile:text-[10px] mobile:px-1.5 mobile:py-0.5">{product.discount}%</div>
                    )}
                    <motion.button
                      onClick={() => handleShowDetails(product)}
                      className="absolute cursor-pointer right-2 top-2 bg-sky-500 text-white mobile:text-md hundred:text-2xl font-bold hundred:w-8 hundred:h-8 mobile:w-6 mobile:h-6 rounded-full flex items-center justify-center hover:bg-sky-700 transition-all duration-300 z-20 pointer-events-auto"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="View product details"
                    >
                      <FaInfoCircle />
                    </motion.button>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"
                      style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.3), transparent 50%, rgba(14,165,233,0.2))" }}
                    />
                    <div className="relative z-10 mobile:mt-2">
                      <p className="text-lg mobile:text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm line-clamp-2 mb-2">{product.productname}</p>
                      <div className="space-y-1 mb-4">
                        {product.discount > 0 ? (
                          <>
                            <p className="text-sm text-slate-500 line-through">MRP: ₹{formatPrice(originalPrice)}</p>
                            <p className="text-xl font-bold text-sky-700 group-hover:text-sky-800 transition-colors duration-500">₹{finalPrice} / {product.per}</p>
                          </>
                        ) : (
                          <p className="text-xl font-bold text-sky-700 group-hover:text-sky-800 transition-colors duration-500">₹{finalPrice} / {product.per}</p>
                        )}
                      </div>
                      <Carousel media={product.image} onImageClick={() => handleShowImage(product)} />
                      <div className="relative min-h-[3rem] flex items-end justify-end">
                        <AnimatePresence mode="wait">
                          {count > 0 ? (
                            <motion.div
                              key="quantity-controls"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="flex items-center justify-between w-full rounded-full p-2"
                              style={styles.button}
                            >
                              <motion.button
                                onClick={() => removeFromCart(product)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300"
                              >
                                <FaMinus />
                              </motion.button>
                              <span className="text-white font-bold text-lg px-4 drop-shadow-lg w-16 text-center">{count}</span>
                              <motion.button
                                onClick={() => addToCart(product)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300"
                              >
                                <FaPlus />
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="add-button"
                              onClick={() => addToCart(product)}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="w-12 h-12 cursor-pointer rounded-full text-white font-bold text-xl flex items-center justify-center shadow-lg relative overflow-hidden"
                              style={styles.button}
                            >
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                initial={{ scale: 0, opacity: 0.5 }}
                                whileTap={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                style={{ background: "rgba(255,255,255,0.3)" }}
                              />
                              <FaPlus />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-px opacity-60"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(2,132,199,0.6), transparent)" }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-3xl shadow-lg max-w-md w-full mx-4 overflow-hidden"
            style={styles.modal}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-sky-700 drop-shadow-sm">Enter Customer Details</h2>
              <div className="space-y-4">
                {[
                  { name: "customer_name", type: "text", placeholder: "Customer Name", pattern: null, title: "Please enter customer name", required: true },
                  { name: "address", type: "text", placeholder: "Address", pattern: null, title: "Please enter address", required: true },
                  {
                    name: "mobile_number",
                    type: "tel",
                    placeholder: "Mobile Number",
                    pattern: "[0-9]{10}",
                    title: "Please enter a valid 10-digit mobile number",
                    required: true
                  },
                  {
                    name: "email",
                    type: "email",
                    placeholder: "Email",
                    pattern: null,
                    title: "Please enter a valid email address",
                    required: false
                  }
                ].map(field => (
                  <div key={field.name} className="relative">
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {field.placeholder} {field.required && <span className="text-red-500">*</span>}
                      </label>
                    </div>
                    <input
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder.toUpperCase()}
                      value={customerDetails[field.name]}
                      onChange={handleInputChange}
                      className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 peer"
                      style={styles.input}
                      required={field.required}
                      pattern={field.pattern}
                      title={field.title}
                    />
                    <p className="text-red-500 text-xs mt-1 hidden peer-invalid:block">
                      {field.title}
                    </p>
                  </div>
                ))}
                <div className="relative">
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <select
                    name="state"
                    value={customerDetails.state}
                    onChange={e => setCustomerDetails(prev => ({ ...prev, state: e.target.value, district: "" }))}
                    className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 peer"
                    style={styles.input}
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  <p className="text-red-500 text-xs mt-1 hidden peer-invalid:block">
                    Please select a state
                  </p>
                </div>
                {customerDetails.state && (
                  <div className="relative">
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <select
                      name="district"
                      value={customerDetails.district}
                      onChange={handleInputChange}
                      className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 peer"
                      style={styles.input}
                      required
                    >
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <p className="text-red-500 text-xs mt-1 hidden peer-invalid:block">
                      Please select a district
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Promocode</label>
                  <select
                    value={promocode}
                    onChange={e => setPromocode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300"
                    style={styles.input}
                  >
                    <option value="">Select Promocode</option>
                    {promocodes.map(promo => (
                      <option key={promo.id} value={promo.code}>
                        {promo.code} ({promo.discount}% OFF{promo.min_amount ? `, Min: ₹${promo.min_amount}` : ''}{promo.end_date ? `, Exp: ${new Date(promo.end_date).toLocaleDateString()}` : ''})
                      </option>
                    ))}
                    <option value="custom">Enter custom code</option>
                  </select>
                  {promocode === "custom" && (
                    <input
                      type="text"
                      value={promocode === "custom" ? "" : promocode}
                      onChange={e => setPromocode(e.target.value)}
                      placeholder="Enter custom code"
                      className="w-full px-3 py-2 mt-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300"
                      style={styles.input}
                    />
                  )}
                  {appliedPromo && (
                    <p className="text-green-600 text-xs mt-1">
                      Applied: {appliedPromo.code} ({appliedPromo.discount}% OFF)
                      {appliedPromo.min_amount && `, Min: ₹${appliedPromo.min_amount}`}
                      {appliedPromo.end_date && `, Expires: ${new Date(appliedPromo.end_date).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="text-sm text-slate-700 space-y-1">
                  <p>Net Rate: ₹{totals.net}</p>
                  <p>Product Discount: ₹{totals.product_discount}</p>
                  {appliedPromo && <p>Promocode ({appliedPromo.code}): -₹{totals.promo_discount}</p>}
                  <p className="font-bold text-sky-800 text-lg">Total: ₹{totals.total}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <motion.button
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: isBooking ? 1 : 1.05 }}
                  whileTap={{ scale: isBooking ? 1 : 0.95 }}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${isBooking ? "opacity-75 cursor-not-allowed" : ""}`}
                  style={{ background: "linear-gradient(135deg, rgba(156,163,175,0.8), rgba(107,114,128,0.9))", color: "white" }}
                  disabled={isBooking}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleFinalCheckout}
                  whileHover={{ scale: isBooking ? 1 : 1.05 }}
                  whileTap={{ scale: isBooking ? 1 : 0.95 }}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer relative flex items-center justify-center ${isBooking ? "opacity-75 cursor-not-allowed" : ""}`}
                  style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <motion.button
        onClick={() => setIsCartOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed cursor-pointer bottom-6 right-6 z-50 text-white rounded-full shadow-xl w-16 h-16 flex items-center justify-center text-2xl transition-all duration-300 ${isCartOpen ? "hidden" : ""}`}
        style={styles.button}
      >
        🛒{Object.keys(cart).length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold"
          >
            {Object.values(cart).reduce((a, b) => a + b, 0)}
          </motion.span>
        )}
      </motion.button>
      <motion.aside
        initial={false}
        animate={{ x: isCartOpen ? 0 : 320 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed top-0 right-0 w-80 h-full shadow-xl border-l z-50"
        style={styles.modal}
      >
        <div className="flex justify-between items-center p-4 border-b border-sky-200">
          <h3 className="text-lg font-bold text-sky-800">Your Cart</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer">×</button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-280px)] p-4 space-y-4">
          {Object.keys(cart).length === 0 ? (
            <p className="text-gray-500 text-sm">Your cart is empty.</p>
          ) : (
            Object.entries(cart).map(([serial, qty]) => {
              const product = products.find(p => p.serial_number === serial);
              if (!product) return null;
              const discount = (product.price * product.discount) / 100;
              const priceAfterDiscount = formatPrice(product.price - discount);
              const imageSrc = (product.image && typeof product.image === 'string' ? JSON.parse(product.image) : (Array.isArray(product.image) ? product.image : [])).filter(item => !item.startsWith('data:video/') && !item.startsWith('data:image/gif') && !item.toLowerCase().endsWith('.gif'))[0] || need;
              return (
                <motion.div
                  key={serial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 border-b pb-3 border-sky-100"
                >
                  <div className="w-16 h-16">
                    <img src={imageSrc} alt={product.productname} className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{product.productname}</p>
                    <p className="text-sm text-sky-700 font-bold">₹{priceAfterDiscount} x {qty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => removeFromCart(product)}
                        className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300"
                        style={styles.button}
                      >
                        <FaMinus />
                      </button>
                      <span className="text-sm font-medium px-2 w-16 text-center">{qty}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300"
                        style={styles.button}
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-sky-200 absolute bottom-0 w-full space-y-4" style={styles.modal}>
          <div className="overflow-hidden whitespace-nowrap border border-blue-300 bg-blue-50 rounded-xl py-2 px-3 text-sky-900 font-medium text-sm relative">
            <div className="flex justify-center mb-2">
              <p className="text-center border-b w-1/2 border-blue-300 flex justify-center">Minimum Purchase Rate</p>
            </div>
            <div className="animate-marquee inline-block">
              🚚 {states.map(s => `${s.name}: ₹${s.min_rate}`).join(" • ")}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Promocode</label>
            <select
              value={promocode}
              onChange={e => setPromocode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300"
              style={styles.input}
            >
              <option value="">Select Promocode</option>
              {promocodes.map(promo => (
                <option key={promo.id} value={promo.code}>
                  {promo.code} ({promo.discount}% OFF{promo.min_amount ? `, Min: ₹${promo.min_amount}` : ''}{promo.end_date ? `, Exp: ${new Date(promo.end_date).toLocaleDateString()}` : ''})
                </option>
              ))}
              <option value="custom">Enter custom code</option>
            </select>
            {promocode === "custom" && (
              <input
                type="text"
                value={promocode === "custom" ? "" : promocode}
                onChange={e => setPromocode(e.target.value)}
                placeholder="Enter custom code"
                className="w-full px-3 py-2 mt-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300"
                style={styles.input}
              />
            )}
            {appliedPromo && (
              <p className="text-green-600 text-xs mt-1">
                Applied: {appliedPromo.code} ({appliedPromo.discount}% OFF)
                {appliedPromo.min_amount && `, Min: ₹${appliedPromo.min_amount}`}
                {appliedPromo.end_date && `, Expires: ${new Date(appliedPromo.end_date).toLocaleDateString()}`}
              </p>
            )}
          </div>
          <div className="text-sm text-slate-700 space-y-1">
            <p>Net Rate: ₹{totals.net}</p>
            <p>Product Discount: ₹{totals.product_discount}</p>
            {appliedPromo && <p>Promocode ({appliedPromo.code}): -₹{totals.promo_discount}</p>}
            <p className="font-bold text-sky-800 text-lg">Total: ₹{totals.total}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setCart({}); setAppliedPromo(null); setPromocode(""); }}
              className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer"
              style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))", boxShadow: "0 5px 15px rgba(239,68,68,0.3)" }}
            >
              Clear Cart
            </button>
            <button
              onClick={handleCheckoutClick}
              className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer"
              style={{ background: styles.button.background, boxShadow: "0 5px 15px rgba(2,132,199,0.3)" }}
            >
              Checkout
            </button>
          </div>
        </div>
      </motion.aside>
      <style jsx>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .details-modal { display: flex !important; visibility: visible !important; opacity: 1 !important; }
        .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 10s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .loader-spinner { border-top-color: #0284c7; }
      `}</style>
    </>
  );
};

export default Pricelist;