import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  FaInfoCircle,
  FaArrowLeft,
  FaArrowRight,
  FaPlus,
  FaMinus,
  FaTimes,
  FaWhatsapp,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../Component/Navbar";
import "../App.css";
import { API_BASE_URL } from "../../Config";
import need from "../default.jpg";

// ─────────────────────────────────────────────────────────
// EDIT THIS: WhatsApp number the floating button opens a chat with
// Format: countrycode + number, no spaces, no "+"
// ─────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "916383659214";
const WHATSAPP_DEFAULT_MESSAGE = "Hi! I'm interested in your crackers.";

const navLinks = ["Home", "About Us", "Price List", "Safety Tips", "Contact Us"];

const styles = {
  card: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(224,242,254,0.3) 50%, rgba(186,230,253,0.2))",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(125,211,252,0.3)",
    boxShadow:
      "0 25px 45px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(56,189,248,0.1)",
  },
  cardHover: {
    background: "linear-gradient(135deg, rgba(125,211,252,0.3), transparent 50%, rgba(56,189,248,0.2))",
  },
  shine: {
    background: "linear-gradient(45deg, transparent 30%, rgba(125,211,252,0.4) 50%, transparent 70%)",
    transform: "translateX(-100%)",
    animation: "shine 2s ease-in-out infinite",
  },
  button: {
    background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(125,211,252,0.4)",
    boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  whatsappButton: {
    background: "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(21,128,61,0.95))",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(134,239,172,0.4)",
    boxShadow: "0 15px 35px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  modal: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(2,132,199,0.3)",
    boxShadow: "0 25px 45px rgba(2,132,199,0.2)",
  },
  input: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(2,132,199,0.3)",
  },
};

// ─────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────

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
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-4">
      <div className="loader-spinner w-16 h-16 border-4 border-t-sky-500 border-gray-200 rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-sky-700">
        {showWarning ? "Your network is slow. Please check your internet and try again." : "Loading products..."}
      </p>
    </motion.div>
  </div>
);

// Parses/sorts a product's media array (images first, then gifs, then videos)
const parseMediaItems = (media) => {
  let parsed = [];
  if (typeof media === "string") {
    try {
      parsed = JSON.parse(media);
      if (!Array.isArray(parsed)) parsed = [parsed];
    } catch {
      parsed = media.trim() ? [media.trim()] : [];
    }
  } else if (Array.isArray(media)) {
    parsed = media;
  }

  return parsed
    .filter((item) => typeof item === "string" && item.trim())
    .sort((a, b) => {
      const aStr = a || "";
      const bStr = b || "";
      const isAVideo = aStr.includes("/video/") || aStr.startsWith("data:video/");
      const isBVideo = bStr.includes("/video/") || bStr.startsWith("data:video/");
      const isAGif = aStr.startsWith("data:image/gif") || aStr.toLowerCase().endsWith(".gif");
      const isBGif = bStr.startsWith("data:image/gif") || bStr.toLowerCase().endsWith(".gif");
      const isAImage = aStr.startsWith("data:image/") && !isAGif;
      const isBImage = bStr.startsWith("data:image/") && !isBGif;
      return (isAImage ? 0 : isAVideo ? 1 : isAGif ? 2 : 3) - (isBImage ? 0 : isBVideo ? 1 : isBGif ? 2 : 3);
    });
};

const isVideoMedia = (media) => typeof media === "string" && (media.includes("/video/") || media.startsWith("data:video/"));

const Carousel = ({ media, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const videoRef = useRef(null);

  const mediaItems = useMemo(() => parseMediaItems(media), [media]);

  const renderMedia = (item, idx) => {
    const src = typeof item === "string" ? item : "";
    if (isVideoMedia(src)) {
      return (
        <video
          key={idx}
          ref={videoRef}
          src={src}
          controls
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-contain p-2"
          onError={(e) => console.error("Video load error:", e)}
        />
      );
    }
    return (
      <img
        key={idx}
        src={src || need}
        alt={`media-${idx}`}
        className="w-full h-full object-contain p-2 cursor-pointer"
        onClick={onImageClick}
        onError={(e) => { e.target.src = need; }}
      />
    );
  };

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));

  const handleTouchStart = (e) => { setIsDragging(true); setStartX(e.touches[0].clientX); };
  const handleTouchMove = () => {};
  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    if (diffX > 50) handleNext();
    else if (diffX < -50) handlePrev();
  };

  useEffect(() => {
    if (videoRef.current && isVideoMedia(mediaItems[currentIndex])) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, mediaItems]);

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className="w-full h-30 rounded-2xl mb-4 overflow-hidden bg-sky-300 flex items-center justify-center">
        <img src={need} alt="Default product" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-40 rounded-2xl mb-4 overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,255,0.4))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {renderMedia(mediaItems[currentIndex], currentIndex)}
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
              <div key={index} className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-sky-700" : "bg-gray-300"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ImageModal = ({ media, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);
  const mediaItems = useMemo(() => parseMediaItems(media), [media]);

  const renderMedia = (item, idx) => {
    const src = typeof item === "string" ? item : "";
    if (isVideoMedia(src)) {
      return (
        <video key={idx} ref={videoRef} src={src} controls autoPlay muted loop playsInline className="w-full h-full object-contain rounded-xl" />
      );
    }
    return <img key={idx} src={src || need} alt={`media-${idx}`} className="w-full h-full object-contain rounded-xl" onError={(e) => { e.target.src = need; }} />;
  };

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    if (videoRef.current && isVideoMedia(mediaItems[currentIndex])) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, mediaItems]);

  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative max-w-4xl w-full h-[80vh] mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-red-400" aria-label="Close image modal">
          <FaTimes />
        </button>
        {renderMedia(mediaItems[currentIndex], currentIndex)}
        {mediaItems.length > 1 && (
          <>
            <button onClick={handlePrev} className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-xl z-10 hover:bg-sky-700 hover:text-white" aria-label="Previous media">
              <FaArrowLeft />
            </button>
            <button onClick={handleNext} className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-xl z-10 hover:bg-sky-700 hover:text-white" aria-label="Next media">
              <FaArrowRight />
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {mediaItems.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full ${index === currentIndex ? "bg-sky-700" : "bg-gray-300"}`} />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const StatCard = () => null; // (achievements section removed, kept as no-op stub in case it's referenced elsewhere)

// ─────────────────────────────────────────────────────────
// Promo burst — rocket launch → firework → promo-code card
// ─────────────────────────────────────────────────────────
const PromoBurst = ({ promoCodes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBursted, setHasBursted] = useState(false);
  const [showPromoCard, setShowPromoCard] = useState(false);
  const [copied, setCopied] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();
  const rocketRef = useRef(null);
  const [hasRocketBeenUsed, setHasRocketBeenUsed] = useState(false);

  const handleClick = () => {
    if (!hasBursted && !hasRocketBeenUsed) {
      setHasRocketBeenUsed(true);
      setIsOpen(true);
      setTimeout(() => {
        setHasBursted(true);
        setTimeout(() => setShowPromoCard(true), 2500);
      }, 1200);
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <div className="fixed left-1/2 -translate-x-1/2 bottom-4 -translate-y-1/2 z-40">
        <AnimatePresence>
          {!hasRocketBeenUsed && !isOpen && !hasBursted && (
            <motion.div
              key="rocket"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }}
              exit={{ y: "-100vh", opacity: 0, scale: 0.3, rotate: 15, transition: { duration: 1.2, ease: "easeInOut" } }}
              className="relative cursor-pointer"
              onClick={handleClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                ref={rocketRef}
                className="w-14 h-20 bg-gradient-to-b from-red-500 via-red-600 to-orange-600 rounded-t-full rounded-b-md relative shadow-lg"
                animate={{ y: [-3, 3], rotate: [-1, 1], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
              >
                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-800" />
                <div className="absolute bottom-0 left-[-6px] w-6 h-6 bg-red-800 rounded-bl-full" />
                <div className="absolute bottom-0 right-[-6px] w-6 h-6 bg-red-800 rounded-br-full" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-200 rounded-full border-2 border-blue-400" />
                <motion.div
                  className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                  animate={{ opacity: [0.7, 1, 0.7], y: [0, -25, -15], scale: [0.8, 1.2, 0.8], x: [-2, 2, -1] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full"
                  animate={{ opacity: [0.5, 0.9, 0.5], y: [0, -30, -20], scale: [0.6, 1, 0.6], x: [1, -1, 2] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
              </motion.div>
              <motion.div
                className="absolute top-20 left-1/2 -translate-x-1/2 w-1 h-12 bg-gray-500 cursor-pointer rounded-full"
                style={{ touchAction: "none" }}
                animate={{ rotateZ: [-3, 3], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="absolute bottom-0 w-4 h-4 bg-gray-600 rounded-full -translate-x-[7px] shadow-md" />
                <AnimatePresence>
                  {isHovering && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap"
                    >
                      Click to launch! 🚀
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  style={{ left: `${20 + i * 8}px`, top: `${25 + (i % 2) * 10}px` }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -10, -20] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>{hasBursted && !showPromoCard && <BigFireworkAnimation key="burst" />}</AnimatePresence>
      <AnimatePresence>
        {showPromoCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              style={{ background: "radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.7) 60%)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.8, 0.6], scale: [0, 1.2, 1], transition: { duration: 1, ease: "easeOut" } }}
              exit={{ opacity: 0, scale: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full z-40"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(135,206,235,0.2) 30%, transparent 70%)", boxShadow: "0 0 200px rgba(135,206,235,0.4), inset 0 0 100px rgba(255,255,255,0.2)" }}
            />
            <motion.div
              key="promo-card"
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15, duration: 0.8 } }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md mobile:max-w-[90%] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-sky-100"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative rounded-3xl p-6 bg-white shadow-2xl border border-sky-200" style={{ boxShadow: "0 25px 50px rgba(135,206,235,0.3), 0 0 0 1px rgba(135,206,235,0.2)" }}>
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, rgba(135,206,235,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(135,206,235,0.2) 0%, transparent 50%)` }} />
                <motion.h3
                  animate={{ scale: [1, 1.05, 1], color: ["rgb(14, 165, 233)", "rgb(2, 132, 199)", "rgb(14, 165, 233)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl font-bold text-center mb-4 drop-shadow-sm"
                  style={{ color: "rgb(14, 165, 233)" }}
                >
                  ✨ EXCLUSIVE DEALS ✨
                </motion.h3>
                <div className="space-y-4">
                  {promoCodes.map((promo, i) => (
                    <motion.div
                      key={promo.id}
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200 hover:border-sky-300 transition-all duration-300"
                      style={{ boxShadow: "0 4px 15px rgba(135,206,235,0.1)" }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <motion.span className="bg-sky-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-md" whileHover={{ scale: 1.1 }}>{promo.discount}%</motion.span>
                            <span className="text-sky-700 font-mono text-lg font-semibold">{promo.code}</span>
                          </div>
                          {promo.min_amount && <p className="text-sky-600 text-sm">Minimum order: ₹{promo.min_amount}</p>}
                          {promo.end_date && <p className="text-sky-600 text-sm">Expires: {formatDate(promo.end_date)}</p>}
                          <p className="text-sky-600 text-sm">Valid for: {promo.product_type || "All Products"}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <motion.button onClick={() => handleCopy(promo.code)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 bg-sky-100 rounded-full text-sky-600 hover:bg-sky-200 transition-colors duration-200 shadow-md z-60">
                            {copied === promo.code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setIsOpen(false); setHasBursted(false); setShowPromoCard(false);
                              document.getElementById("pricelist")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-sky-500 text-white rounded-full text-sm font-bold hover:bg-sky-600 transition-colors duration-200 shadow-md z-60"
                          >
                            USE NOW
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  onClick={() => (setIsOpen(false), setHasBursted(false), setShowPromoCard(false))}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-3 right-3 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 hover:bg-sky-200 transition-colors duration-200 shadow-md font-black z-60"
                >
                  ×
                </motion.button>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 rounded-t-3xl" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 rounded-b-3xl" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────────────────
// Home + Pricelist (merged)
// ─────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const pricelistRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // ---------- Hero banner ----------
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ---------- Fast running products ----------
  const [fastRunningProducts, setFastRunningProducts] = useState([]);
  const [selectedFastProduct, setSelectedFastProduct] = useState(null);
  const [showFastDetailsModal, setShowFastDetailsModal] = useState(false);

  // ---------- Promo codes (drives both the rocket-burst promo and the price list dropdown) ----------
  const [promoCodes, setPromoCodes] = useState([]);

  // ---------- Full pricelist state ----------
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User",
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
  const [isLoading, setIsLoading] = useState(true);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const debounceTimeout = useRef(null);
  const loadingTimeout = useRef(null);

  // ---------- AI assistant ----------
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiBudget, setAiBudget] = useState("");
  const [aiPreferences, setAiPreferences] = useState({ kids: false, sound: false, night: false, kidsnight: false });
  const [suggestedCart, setSuggestedCart] = useState({});

  const formatPrice = (price) => {
    const num = Number.parseFloat(price) || 0;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const getSafeImages = useCallback((raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter((url) => typeof url === "string" && url.trim());
    if (typeof raw !== "string") return [];
    const str = raw.trim();
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.filter((url) => typeof url === "string" && url.trim());
      if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    } catch {}
    if (str.startsWith("http") || str.startsWith("//") || str.startsWith("/")) return [str];
    return [];
  }, []);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
  const scrollToPricelist = () => pricelistRef.current?.scrollIntoView({ behavior: "smooth" });

  // ---------- Fetch: banners + fast running products + promo codes (polling) ----------
  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const response = await res.json();
        let dataArray;
        if (Array.isArray(response)) dataArray = response;
        else if (response && Array.isArray(response.data)) dataArray = response.data;
        else { setter([]); return; }

        if (url.includes("/api/products") || url.includes("/api/banners")) {
          setter(dataArray.filter((item) => item.is_active || item.fast_running));
        } else {
          setter(dataArray);
        }
      } catch (err) {
        console.error(`Error loading ${url}:`, err);
        setter([]);
      }
    };

    const fetchPromoCodes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/promocodes`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        setPromoCodes(await res.json());
      } catch (err) {
        console.error("Error loading promo codes:", err);
        setPromoCodes([]);
      }
    };

    fetchData(`${API_BASE_URL}/api/banners`, setBanners);
    fetchData(`${API_BASE_URL}/api/products`, setFastRunningProducts);
    fetchPromoCodes();

    const intervals = [
      setInterval(() => fetchData(`${API_BASE_URL}/api/banners`, setBanners), 1200 * 1000),
      setInterval(() => fetchData(`${API_BASE_URL}/api/products`, setFastRunningProducts), 30 * 1000),
      setInterval(fetchPromoCodes, 30 * 1000),
      setInterval(() => {
        setBanners((prevBanners) => {
          if (prevBanners.length > 0) setCurrentSlide((prev) => (prev + 1) % prevBanners.length);
          return prevBanners;
        });
      }, 4000),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  // ---------- Fetch: full pricelist data (states, all products, cart from storage) ----------
  useEffect(() => {
    const initializeData = async () => {
      try {
        loadingTimeout.current = setTimeout(() => setShowNetworkWarning(true), 5000);

        const savedCart = localStorage.getItem("firecracker-cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const [statesRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/locations/states`),
          fetch(`${API_BASE_URL}/api/products`),
        ]);
        const [statesData, productsData] = await Promise.all([statesRes.json(), productsRes.json()]);

        setStates(Array.isArray(statesData) ? statesData : []);

        const naturalSort = (a, b) => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare(a.productname, b.productname);

        const seenSerials = new Set();
        const normalizedProducts = productsData.data
          .filter((p) => {
            if (p.status !== "on") return false;
            if (seenSerials.has(p.serial_number)) return false;
            seenSerials.add(p.serial_number);
            return true;
          })
          .map((product) => ({ ...product, images: getSafeImages(product.image) }))
          .sort(naturalSort);

        setProducts(normalizedProducts);
        setIsLoading(false);
        clearTimeout(loadingTimeout.current);
      } catch (err) {
        console.error("Error loading initial data:", err);
        toast.error("Failed to load initial data", { position: "top-center", autoClose: 5000 });
        setIsLoading(false);
        clearTimeout(loadingTimeout.current);
      }
    };

    initializeData();
    return () => { if (loadingTimeout.current) clearTimeout(loadingTimeout.current); };
  }, [getSafeImages]);

  useEffect(() => {
    if (customerDetails.state) {
      fetch(`${API_BASE_URL}/api/locations/states/${customerDetails.state}/districts`)
        .then((res) => res.json())
        .then((data) => setDistricts(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error("Error fetching districts:", err);
          toast.error("Failed to load districts", { position: "top-center", autoClose: 5000 });
        });
    }
  }, [customerDetails.state]);

  useEffect(() => localStorage.setItem("firecracker-cart", JSON.stringify(cart)), [cart]);

  const addToCart = useCallback((product) => {
    if (!product?.serial_number) {
      toast.error("Invalid product or missing serial_number", { position: "top-center", autoClose: 5000 });
      return;
    }
    setCart((prev) => ({ ...prev, [product.serial_number]: (prev[product.serial_number] || 0) + 1 }));
  }, []);

  const removeFromCart = useCallback((product) => {
    if (!product?.serial_number) {
      toast.error("Invalid product or missing serial_number", { position: "top-center", autoClose: 5000 });
      return;
    }
    setCart((prev) => {
      const count = (prev[product.serial_number] || 1) - 1;
      const updated = { ...prev };
      if (count <= 0) delete updated[product.serial_number];
      else updated[product.serial_number] = count;
      return updated;
    });
  }, []);

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
    setTimeout(() => setShowErrorModal(false), 5000);
  };

  const totals = useMemo(() => {
    let net = 0, save = 0, total = 0, productDiscount = 0, promoDiscount = 0;
    for (const serial in cart) {
      const qty = cart[serial];
      const product = products.find((p) => p.serial_number === serial);
      if (!product) continue;
      const originalPrice = Number.parseFloat(product.price) || 0;
      const discount = originalPrice * (Number.parseFloat(product.discount) / 100 || 0);
      const priceAfterProductDiscount = originalPrice - discount;
      net += originalPrice * qty;
      productDiscount += discount * qty;
      let itemTotal = priceAfterProductDiscount * qty;
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
      net: formatPrice(net), save: formatPrice(save), total: formatPrice(total),
      promo_discount: formatPrice(promoDiscount), product_discount: formatPrice(productDiscount),
    };
  }, [cart, products, appliedPromo]);

  const handleApplyPromo = useCallback(async (code) => {
    if (!code) { setAppliedPromo(null); setPromocode(""); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes`);
      const promos = await res.json();
      const found = promos.find((p) => p.code.toLowerCase() === code.toLowerCase());

      if (!found) { showError("Invalid promocode."); setAppliedPromo(null); setPromocode(""); return; }
      if (found.min_amount && parseFloat(totals.total) < found.min_amount) {
        showError(`Minimum order amount for this promocode is ₹${found.min_amount}. Your total is ₹${totals.total}.`);
        setAppliedPromo(null); setPromocode(""); return;
      }
      if (found.end_date && new Date(found.end_date) < new Date()) {
        showError("This promocode has expired."); setAppliedPromo(null); setPromocode(""); return;
      }
      if (found.product_type) {
        const cartProductTypes = Object.keys(cart).map((serial) => products.find((p) => p.serial_number === serial)?.product_type || "Others");
        if (!cartProductTypes.some((type) => type === found.product_type)) {
          showError(`This promocode is only valid for ${found.product_type.replace(/_/g, " ")} products, and none are in your cart.`);
          setAppliedPromo(null); setPromocode(""); return;
        }
      }
      setAppliedPromo(found);
      toast.success(`Promocode ${found.code} applied successfully! Discount: ${found.discount}%`, { position: "top-center", autoClose: 3000 });
    } catch (err) {
      console.error("Promo apply error:", err);
      showError("Could not validate promocode.");
      setAppliedPromo(null); setPromocode("");
    }
  }, [cart, products, totals.total]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (promocode && promocode !== "custom") handleApplyPromo(promocode);
      else if (promocode !== "custom") setAppliedPromo(null);
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [promocode, handleApplyPromo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile_number") {
      setCustomerDetails((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(-10) }));
    } else {
      setCustomerDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleShowDetails = useCallback((product) => { setSelectedProduct(product); setShowDetailsModal(true); }, []);
  const handleCloseDetails = useCallback(() => { setSelectedProduct(null); setShowDetailsModal(false); }, []);
  const handleShowImage = useCallback((product) => { setSelectedProduct(product); setShowImageModal(true); }, []);
  const handleCloseImage = useCallback(() => { setSelectedProduct(null); setShowImageModal(false); }, []);

  const handleCheckoutClick = () => {
    Object.keys(cart).length ? (setShowModal(true), setIsCartOpen(false)) : showError("Your cart is empty.");
  };

  const downloadPDF = async () => {
    try {
      const productsRes = await fetch(`${API_BASE_URL}/api/products`);
      const productsData = await productsRes.json();

      const naturalSort = (a, b) => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare(a.productname, b.productname);
      const serialSort = (a, b) => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare(a.serial_number, b.serial_number);

      const seenSerials = new Set();
      const normalizedProducts = productsData.data
        .filter((p) => {
          if (seenSerials.has(p.serial_number)) return false;
          seenSerials.add(p.serial_number);
          return p.status === "on";
        })
        .map((product) => ({
          ...product,
          images: product.image ? (typeof product.image === "string" ? JSON.parse(product.image) : product.image) : [],
          price: parseFloat(product.price) || 0,
          discount: parseFloat(product.discount) || 0,
        }))
        .sort(naturalSort);

      if (!normalizedProducts.length) { showError("No products available to export"); return; }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yOffset = 20;

      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("FUN WITH CRACKERS", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 10;
      doc.setFontSize(12); doc.setFont("helvetica", "normal");
      doc.text("Website - www.funwithcrackers.com", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 10;
      doc.text(`Retail Pricelist - ${new Date().getFullYear()}`, pageWidth / 2, yOffset, { align: "center" });
      yOffset += 20;

      const tableData = [];
      let slNo = 1;
      const orderedTypes = [
        "One sound crackers", "Ground Chakkar", "Flower Pots", "Twinkling Star",
        "Rockets", "Bombs", "Repeating Shots", "Comets Sky Shots",
        "Fancy pencil varieties", "Fountain and Fancy Novelties", "Matches",
        "Guns and Caps", "Sparklers","Sony comets", "Gift Boxes", "Combo Pack", "New Arrivals",
      ];

      orderedTypes.forEach((type) => {
        const typeKey = type.replace(/ /g, "_").toLowerCase();
        const typeProducts = normalizedProducts.filter((product) => product.product_type.toLowerCase() === typeKey).sort(serialSort);
        if (typeProducts.length > 0) {
          tableData.push([{ content: type, colSpan: 6, styles: { fontStyle: "bold", halign: "left", fillColor: [200, 200, 200] } }]);
          tableData.push(["Sl No.", "Prod No.", "Product Name", "Rate", "Discounted Rate", "Per"]);
          typeProducts.forEach((product) => {
            const dis = product.price * (product.discount / 100);
            const discountedRate = product.price - dis;
            tableData.push([slNo++, product.serial_number, product.productname, `Rs.${formatPrice(product.price)}`, `Rs.${formatPrice(discountedRate)}`, product.per]);
          });
          tableData.push([]);
        }
      });

      autoTable(doc, {
        startY: yOffset,
        head: [["Sl No.", "Prod No.", "Product Name", "Rate", "Discounted Rate", "Per"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 20 }, 2: { cellWidth: 70 }, 3: { cellWidth: 20 }, 4: { cellWidth: 30 }, 5: { cellWidth: 25 } },
        didDrawCell: (data) => {
          if (data.row.section === "body" && data.cell.raw && data.cell.raw.colSpan === 6) {
            data.cell.styles.cellPadding = 5;
            data.cell.styles.fontSize = 12;
          }
        },
      });

      const currentYear = new Date().getFullYear();
      doc.save(`FWC_Pricelist_${currentYear}.pdf`);
    } catch (err) {
      showError("Failed to generate PDF: " + err.message);
    }
  };

  const handleFinalCheckout = async () => {
    setIsBooking(true);
    const order_id = `ORD-${Date.now()}`;
    const selectedProducts = Object.entries(cart).map(([serial, qty]) => {
      const product = products.find((p) => p.serial_number === serial);
      return {
        id: product.id, product_type: product.product_type, quantity: qty, per: product.per,
        image: product.image, price: product.price, discount: product.discount,
        serial_number: product.serial_number, productname: product.productname, status: product.status,
      };
    });

    if (!selectedProducts.length) { setIsBooking(false); return showError("Your cart is empty."); }
    if (!customerDetails.customer_name.trim()) { setIsBooking(false); return showError("Customer name is required."); }
    if (!customerDetails.address.trim()) { setIsBooking(false); return showError("Address is required."); }
    if (!customerDetails.district.trim()) { setIsBooking(false); return showError("District is required."); }
    if (!customerDetails.state.trim()) { setIsBooking(false); return showError("Please select a state."); }
    if (!customerDetails.mobile_number.trim()) { setIsBooking(false); return showError("Mobile number is required."); }

    const mobile = customerDetails.mobile_number.replace(/\D/g, "").slice(-10);
    if (mobile.length !== 10) { setIsBooking(false); return showError("Mobile number must be 10 digits."); }
    if (customerDetails.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      setIsBooking(false); return showError("Please enter a valid email address.");
    }

    const selectedState = customerDetails.state.trim();
    const minOrder = states.find((s) => s.name === selectedState)?.min_rate;
    if (minOrder && parseFloat(totals.total) < minOrder) {
      setIsBooking(false);
      return showError(`Minimum order for ${selectedState} is ₹${minOrder}. Your total is ₹${totals.total}.`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/direct/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id, products: selectedProducts,
          net_rate: parseFloat(totals.net), you_save: parseFloat(totals.save), total: parseFloat(totals.total),
          promo_discount: parseFloat(totals.promo_discount || "0.00"),
          customer_type: customerDetails.customer_type, customer_name: customerDetails.customer_name,
          address: customerDetails.address, mobile_number: mobile, email: customerDetails.email,
          district: customerDetails.district, state: customerDetails.state, promocode: appliedPromo?.code || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsBooking(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
        setCart({});
        setAppliedPromo(null);
        setPromocode("");
        setIsCartOpen(false);
        setShowModal(false);

        const bookedCustomerName = customerDetails.customer_name;
        setCustomerDetails({ customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User" });

        try {
          const pdfResponse = await fetch(`${API_BASE_URL}/api/direct/invoice/${data.order_id}`);
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const safeCustomerName = (bookedCustomerName || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
          link.setAttribute("download", `${safeCustomerName}-${data.order_id}.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("Downloaded estimate bill, check downloads", { position: "top-center", autoClose: 5000 });
        } catch (pdfErr) {
          console.error("PDF download error:", pdfErr);
          toast.error("Booking successful but PDF download failed. Contact support.", { position: "top-center", autoClose: 5000 });
        }
      } else {
        setIsBooking(false);
        showError(data.message || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setIsBooking(false);
      showError("Something went wrong during checkout. Please try again.");
    }
  };

  // ---------- AI assistant suggestion engine ----------
  const generateSuggestions = useCallback(() => {
    const budget = Number(aiBudget);
    if (!budget || budget <= 0) { showError("Please enter a valid budget"); return; }

    const categories = {
      kids: ["new_arrivals", "fancy_pencil_varieties", "twinkling_star", "guns_and_caps", "matches"],
      sound: ["bombs", "one_sound_crackers"],
      night: ["repeating_shots", "comets_sky_shots", "new_arrivals", "rockets"],
      kidsnight: ["fountain_and_fancy_novelties", "flower_pots", "ground_chakkar", "sparklers"],
    };

    const selectedPrefs = ["night", "kids", "sound", "kidsnight"].filter((p) => aiPreferences[p]);
    if (!selectedPrefs.length) { showError("Select at least one preference"); return; }

    const budgetPerPref = budget / selectedPrefs.length;
    const tempCart = {};
    const sparklerSizeCount = {};
    const categorySpentMap = {};
    selectedPrefs.forEach((p) => { categorySpentMap[p] = 0; });

    const getSparklerSize = (name) => {
      const m = name?.match(/(\d+)\s*cm/i);
      return m ? m[1] : null;
    };

    for (const pref of selectedPrefs) {
      const phase1Budget = budgetPerPref * 0.7;
      const types = categories[pref];
      const byType = {};
      for (const type of types) byType[type] = [];

      products
        .filter((p) => types.includes(p.product_type?.toLowerCase()))
        .forEach((p) => {
          const type = p.product_type?.toLowerCase();
          if (byType[type]) byType[type].push({ ...p, finalPrice: p.price * (1 - (p.discount || 0) / 100) });
        });

      for (const type of types) byType[type].sort((a, b) => a.finalPrice - b.finalPrice);
      const sorted = types.flatMap((type) => byType[type] || []).filter((p) => p.finalPrice > 0);

      let prefSpent = 0;
      for (const p of sorted) {
        if (prefSpent + p.finalPrice > phase1Budget) continue;
        if (tempCart[p.serial_number]) continue;

        if (p.product_type === "sparklers" || p.product_type === "premium_sparklers") {
          const size = getSparklerSize(p.productname) || "unknown";
          if ((sparklerSizeCount[size] || 0) >= 3) continue;
          sparklerSizeCount[size] = (sparklerSizeCount[size] || 0) + 1;
        }

        tempCart[p.serial_number] = 1;
        prefSpent += p.finalPrice;
        categorySpentMap[pref] = (categorySpentMap[pref] || 0) + p.finalPrice;
      }
    }

    for (const pref of selectedPrefs) {
      const phase2Budget = budgetPerPref * 0.3;
      const types = categories[pref];
      const boostCandidates = types.flatMap((type) =>
        Object.keys(tempCart)
          .map((serial) => {
            const p = products.find((x) => x.serial_number === serial);
            if (!p) return null;
            if (p.product_type?.toLowerCase() !== type) return null;
            return { ...p, finalPrice: p.price * (1 - (p.discount || 0) / 100) };
          })
          .filter(Boolean)
          .sort((a, b) => a.finalPrice - b.finalPrice)
      );

      if (!boostCandidates.length) continue;

      let boostRemaining = phase2Budget;
      const boostThreshold = budgetPerPref * 0.02;
      let safetyLimit = 500;

      while (boostRemaining > boostThreshold && safetyLimit-- > 0) {
        let addedAny = false;
        for (const p of boostCandidates) {
          if (boostRemaining < p.finalPrice) continue;
          const maxQty = Math.max(1, Math.floor((budgetPerPref * 0.25) / p.finalPrice));
          const currentQty = tempCart[p.serial_number] || 0;
          if (currentQty >= maxQty) continue;
          tempCart[p.serial_number] = currentQty + 1;
          boostRemaining -= p.finalPrice;
          addedAny = true;
          if (boostRemaining <= boostThreshold) break;
        }
        if (!addedAny) break;
      }
    }

    const totalSpent = Object.entries(tempCart).reduce((sum, [serial, qty]) => {
      const p = products.find((x) => x.serial_number === serial);
      if (!p) return sum;
      return sum + p.price * (1 - (p.discount || 0) / 100) * qty;
    }, 0);

    let globalRemaining = budget - totalSpent;
    const globalThreshold = budget * 0.03;

    if (globalRemaining > globalThreshold && Object.keys(tempCart).length > 0) {
      const globalCandidates = selectedPrefs.flatMap((pref) =>
        categories[pref].flatMap((type) =>
          Object.keys(tempCart)
            .map((serial) => {
              const p = products.find((x) => x.serial_number === serial);
              if (!p) return null;
              if (p.product_type?.toLowerCase() !== type) return null;
              return { ...p, finalPrice: p.price * (1 - (p.discount || 0) / 100) };
            })
            .filter(Boolean)
            .sort((a, b) => a.finalPrice - b.finalPrice)
        )
      );

      let safetyLimit = 500;
      while (globalRemaining > globalThreshold && safetyLimit-- > 0) {
        let addedAny = false;
        for (const p of globalCandidates) {
          if (globalRemaining < p.finalPrice) continue;
          const maxQty = Math.max(1, Math.floor((budget * 0.2) / p.finalPrice));
          const currentQty = tempCart[p.serial_number] || 0;
          if (currentQty >= maxQty) continue;
          tempCart[p.serial_number] = currentQty + 1;
          globalRemaining -= p.finalPrice;
          addedAny = true;
          if (globalRemaining <= globalThreshold) break;
        }
        if (!addedAny) break;
      }
    }

    setSuggestedCart(tempCart);
  }, [aiBudget, aiPreferences, products]);

  const handleAiNext = () => {
    if (aiStep === 0 && !aiBudget) return showError("Please enter a budget.");
    if (aiStep < 2) setAiStep(aiStep + 1);
    else generateSuggestions();
  };

  const handleAiBack = () => {
    if (aiStep > 0) {
      if (aiStep === 2) setSuggestedCart({});
      setAiStep(aiStep - 1);
    }
  };

  const addSuggestedToCart = () => {
    setCart((prev) => {
      const updated = { ...prev };
      Object.entries(suggestedCart).forEach(([serial, qty]) => { updated[serial] = (updated[serial] || 0) + qty; });
      return updated;
    });
    setShowAiModal(false);
    setAiStep(0);
    setAiBudget("");
    setAiPreferences({ kids: false, sound: false, night: false, kidsnight: false });
    setSuggestedCart({});
  };

  const suggestedTotals = useMemo(() => {
    let total = 0;
    for (const serial in suggestedCart) {
      const qty = suggestedCart[serial];
      const product = products.find((p) => p.serial_number === serial);
      if (!product) continue;
      total += product.price * (1 - (product.discount || 0) / 100) * qty;
    }
    return formatPrice(total);
  }, [suggestedCart, products]);

  const productTypes = useMemo(() => {
    const orderedTypes = [
      "One sound crackers", "Ground Chakkar", "Flower Pots", "Twinkling Star", "Rockets", "Bombs",
      "Repeating Shots", "Comets Sky Shots", "Fancy pencil varieties", "Fountain and Fancy Novelties",
      "Matches", "Guns and Caps", "Sparklers","Sony comets", "Gift Boxes", "Combo Pack", "New Arrivals",
    ];
    const availableTypes = [...new Set(products.filter((p) => p.product_type !== "gift_box_dealers").map((p) => p.product_type || "Others"))];
    const filteredOrderedTypes = orderedTypes.filter((type) => availableTypes.includes(type.replace(/ /g, "_").toLowerCase()));
    return ["All", ...filteredOrderedTypes];
  }, [products]);

  const grouped = useMemo(() => {
    const orderedTypes = [
      "One sound crackers", "Ground Chakkar", "Flower Pots", "Twinkling Star", "Rockets", "Bombs",
      "Repeating Shots", "Comets Sky Shots", "Fancy pencil varieties", "Fountain and Fancy Novelties",
      "Matches", "Guns and Caps", "Sparklers","Sony comets", "Gift Boxes", "Combo Pack", "New Arrivals",
    ];
    const result = products
      .filter((p) => p.product_type !== "gift_box_dealers" &&
        (selectedType === "All" || p.product_type === selectedType.replace(/ /g, "_").toLowerCase()) &&
        (!searchTerm || p.productname.toLowerCase().includes(searchTerm.toLowerCase()) || p.serial_number.toLowerCase().includes(searchTerm.toLowerCase())))
      .reduce((acc, p) => {
        const key = p.product_type || "Others";
        acc[key] = acc[key] || [];
        acc[key].push(p);
        return acc;
      }, {});
    const orderedResult = {};
    orderedTypes.map((type) => type.replace(/ /g, "_").toLowerCase()).forEach((type) => { if (result[type]) orderedResult[type] = result[type]; });
    return orderedResult;
  }, [products, selectedType, searchTerm]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-slate-800 overflow-x-hidden relative"
      style={{ background: "linear-gradient(135deg, #fef7ff 0%, #f0f9ff 25%, #ecfdf5 50%, #fef3c7 75%, #fef7ff 100%)" }}
    >
      <Navbar />
      <ToastContainer />

      {isLoading && <Loader showWarning={showNetworkWarning} />}

      {/* Fast-running product details modal */}
      {showFastDetailsModal && selectedFastProduct && (
        <div className="fixed inset-0 bg-black/50 z-55 flex items-center justify-center details-modal">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative rounded-3xl shadow-lg max-w-md w-full mx-4 overflow-hidden" style={styles.modal}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-sky-700 drop-shadow-sm">{selectedFastProduct.productname}</h2>
                <button onClick={() => setShowFastDetailsModal(false)} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer" aria-label="Close details modal">×</button>
              </div>
              <Carousel media={selectedFastProduct.image} />
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-800">Description</h3>
                <p className="text-sm text-slate-600 mt-2">{selectedFastProduct.description || "No description available."}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowFastDetailsModal(false)} className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}>
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===================== HERO BANNER ===================== */}
      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-8xl mt-[100px] h-[350px] hundred:h-[500px] onefifty:h-[350px] mobile:h-[150px] overflow-hidden rounded-3xl mx-4 md:mx-8">
        <div className="absolute inset-0 z-10 rounded-3xl"></div>
        {banners.map((banner, idx) => (
          <motion.div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out rounded-3xl overflow-hidden${currentSlide === idx ? " opacity-100 z-5" : " opacity-0 z-0"}`}
            style={{ transition: "transform 4s ease-in-out" }}
          >
            <img
              src={banner.image_url.startsWith("http") ? banner.image_url : `${API_BASE_URL}${banner.image_url}`}
              alt={`Banner ${banner.id}`}
              className="hundred:w-full hundred:h-full object-cover rounded-3xl mobile:w-[100%] mobile:h-[100%]"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ===================== FAST RUNNING PRODUCTS ===================== */}
      <section className="py-2 px-4 sm:px-6 max-w-7xl mx-auto mt-5">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-5xl font-bold text-slate-800 mb-4 mobile:text-3xl">Fast Running Products</h2>
          <div className="w-24 h-1 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.8), rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8))", boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }} />
        </motion.div>
        <div className="flex flex-row space-x-6 overflow-x-auto mt-8 mobile:space-x-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-sky-100">
          {fastRunningProducts.map((product) => {
            const originalPrice = Number.parseFloat(product.price);
            const finalPrice = (originalPrice - originalPrice * (product.discount / 100)).toFixed(2);
            const hasValidImage = product.image &&
              (typeof product.image === "string" ? product.image.trim() !== "" && JSON.parse(product.image).length > 0 : Array.isArray(product.image) && product.image.length > 0);

            return (
              <motion.div
                key={product.serial_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500 mobile:p-3 min-w-[300px] mobile:min-w-[250px] snap-center"
                style={styles.card}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={styles.cardHover} />
                <motion.button
                  onClick={() => (setSelectedFastProduct(product), setShowFastDetailsModal(true))}
                  className="absolute cursor-pointer right-2 top-2 bg-sky-500 text-white mobile:text-md hundred:text-2xl font-bold hundred:w-8 hundred:h-8 mobile:w-6 mobile:h-6 rounded-full flex items-center justify-center hover:bg-sky-700 transition-all duration-300 z-20 pointer-events-auto"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="View product details"
                >
                  <FaInfoCircle />
                </motion.button>
                <div className="relative z-10 flex">
                  <div className="absolute left-0 top-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg rounded-tl-lg mobile:text-[10px] mobile:px-1.5 mobile:py-0.5">{product.discount}% OFF</div>
                  <div className="flex-1 mt-5">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm line-clamp-2 mb-2 mobile:text-sm">{product.productname}</h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-slate-600 line-through mobile:text-xs">MRP: ₹{originalPrice}</p>
                      <p className="text-xl font-bold text-sky-700 group-hover:text-sky-800 transition-colors duration-500 mobile:text-base">₹{finalPrice} / {product.per}</p>
                    </div>
                    {hasValidImage ? (
                      <Carousel media={product.image} />
                    ) : (
                      <div className="w-full h-30 rounded-2xl mb-4 overflow-hidden bg-gray-200 flex items-center justify-center text-slate-600 text-sm font-medium">
                        <img alt="image" src={need} />
                      </div>
                    )}
                    <div className="relative min-h-[3rem] flex items-center justify-center translate-x-3 mobile:min-h-[2rem] w-52">
                      <motion.button
                        onClick={scrollToPricelist}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full cursor-pointer flex justify-center text-white font-semibold py-2 rounded-lg transition-all duration-300 mobile:text-sm mobile:py-1"
                        style={styles.button}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(14,165,233,1), rgba(2,132,199,1))", boxShadow: "0 8px 24px rgba(2,132,199,0.4)" })}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.button)}
                      >
                        Enquire Now
                      </motion.button>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, rgba(2,132,199,0.6), transparent)" }} />
              </motion.div>
            );
          })}
        </div>
      </section>

      {promoCodes.length > 0 && <PromoBurst promoCodes={promoCodes} />}

      {/* ===================== FULL PRICE LIST (merged in) ===================== */}
      <section id="pricelist" ref={pricelistRef} className="relative pt-16 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div className="text-center mb-10">
          <h2 className="text-5xl font-bold text-slate-800 mb-4 mobile:text-3xl">Full Price List</h2>
          <div className="w-24 h-1 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.8), rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8))", boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }} />
        </div>

        {showErrorModal && (
          <motion.div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="bg-red-200 text-red-400 border-2 text-lg font-semibold rounded-xl p-6 max-w-md mx-4 text-center shadow-lg">{errorMessage}</div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <BigFireworkAnimation delay={0} />
            <motion.div className="flex flex-col items-center gap-4 z-10" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <motion.h2 className="text-5xl font-bold from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent" style={{ textShadow: "0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5)" }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: 1, delay: 0.5 }}>
                Booked
              </motion.h2>
            </motion.div>
          </motion.div>
        )}

        {isCartOpen && <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsCartOpen(false)} />}

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

        <section className={`rounded-xl px-4 py-3 shadow-inner flex justify-between flex-wrap gap-4 text-sm sm:text-base border border-sky-300 from-sky-400/80 to-sky-600/90 text-white font-semibold transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
          <div>Net Rate: ₹{totals.net}</div>
          <div>You Save: ₹{totals.save}</div>
          {appliedPromo && <div>Promocode ({appliedPromo.code}): -₹{totals.promo_discount}</div>}
          <div className="font-bold">Total: ₹{totals.total}</div>
        </section>

        <div className={`flex justify-center gap-4 mb-8 mt-8 transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-3 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input}>
            {productTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search by name or serial number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl px-2 w-1/2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300"
            style={styles.input}
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex hundred:justify-center hundred:gap-8 mobile:gap-0 mobile:justify-around mb-8 transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={downloadPDF} className="px-8 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}>
            Download Pricelist
          </motion.button>

          <motion.button onClick={() => setShowAiModal(true)} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }} className="relative right-6 z-20 w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl text-2xl hover:shadow-xl transition-shadow">
            <span>🤖</span>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-12 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow">
              Need Help?
            </motion.span>
          </motion.button>
        </motion.div>

        <div className={`transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mt-12 mb-10">
              <h2 className="text-3xl text-sky-800 mb-5 font-semibold capitalize border-b-4 border-sky-500 pb-2">{type.replace(/_/g, " ")}</h2>
              <div className="grid mobile:grid-cols-2 onefifty:grid-cols-3 hundred:grid-cols-4 gap-6">
                {items.map((product) => {
                  if (!product) return null;
                  const originalPrice = Number.parseFloat(product.price);
                  const discount = originalPrice * (product.discount / 100);
                  const finalPrice = product.discount > 0 ? formatPrice(originalPrice - discount) : formatPrice(originalPrice);
                  const count = cart[product.serial_number] || 0;
                  const images = getSafeImages(product.image);

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
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.3), transparent 50%, rgba(14,165,233,0.2))" }} />
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

                        <div className="relative w-full h-40 rounded-2xl mb-4 overflow-hidden select-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,255,0.4))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}>
                          {images.length > 0 ? (
                            <img src={images[0]} alt={product.productname} className="w-full h-full object-contain p-2 cursor-pointer" onClick={() => handleShowImage(product)} onError={(e) => { e.target.src = need; }} />
                          ) : (
                            <img src={need} alt="Default" className="w-full h-full object-contain p-2" />
                          )}
                        </div>

                        <div className="relative flex items-end justify-end">
                          <AnimatePresence mode="wait">
                            {count > 0 ? (
                              <motion.div key="quantity-controls" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex items-center justify-between w-full rounded-full p-2" style={styles.button}>
                                <motion.button onClick={() => removeFromCart(product)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300">
                                  <FaMinus />
                                </motion.button>
                                <span className="text-white font-bold text-lg px-4 drop-shadow-lg w-16 text-center">{count}</span>
                                <motion.button onClick={() => addToCart(product)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300">
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
                                <motion.div className="absolute inset-0 rounded-full" initial={{ scale: 0, opacity: 0.5 }} whileTap={{ scale: 2, opacity: 0 }} transition={{ duration: 0.4 }} style={{ background: "rgba(255,255,255,0.3)" }} />
                                <FaPlus />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, rgba(2,132,199,0.6), transparent)" }} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative rounded-3xl shadow-lg max-w-7xl tab:max-w-md onefifty:max-w-4xl w-full mx-4 overflow-hidden" style={styles.modal}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-sky-700 drop-shadow-sm">Enter Customer Details</h2>
              <div className="space-y-4 grid hundred:grid-cols-2 onefifty:grid-cols-2 onefifty:gap-2 mobile:grid-cols-1 mobile:gap-0 mobile:space-y-0 gap-2">
                {[
                  { name: "customer_name", type: "text", placeholder: "Customer Name", pattern: null, title: "Please enter customer name", required: true },
                  { name: "address", type: "text", placeholder: "Address", pattern: null, title: "Please enter address", required: true },
                  { name: "mobile_number", type: "tel", placeholder: "Mobile Number", pattern: "[0-9]{10}", title: "Please enter a valid 10-digit mobile number", required: true },
                  { name: "email", type: "email", placeholder: "Email", pattern: null, title: "Please enter a valid email address", required: false },
                ].map((field) => (
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
                    <p className="text-red-500 text-xs mt-1 hidden peer-invalid:block">{field.title}</p>
                  </div>
                ))}

                <div className="relative">
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                  </div>
                  <select
                    name="state"
                    value={customerDetails.state}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, state: e.target.value, district: "" }))}
                    className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 peer"
                    style={styles.input}
                    required
                  >
                    <option value="">Select State</option>
                    {states.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  <p className="text-red-500 text-xs mt-1 hidden peer-invalid:block">Please select a state</p>
                </div>

                {customerDetails.state && (
                  <div className="relative">
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-slate-700 mb-1">District <span className="text-red-500">*</span></label>
                    </div>
                    <select name="district" value={customerDetails.district} onChange={handleInputChange} className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 peer" style={styles.input} required>
                      <option value="">Select District</option>
                      {districts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <p className="text-red-500 text-xs mt-1 hidden peer-invalid:block">Please select a district</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Promocode</label>
                  <select value={promocode} onChange={(e) => setPromocode(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300" style={styles.input}>
                    <option value="">Select Promocode</option>
                    {promoCodes.map((promo) => (
                      <option key={promo.id} value={promo.code}>
                        {promo.code} ({promo.discount}% OFF{promo.min_amount ? `, Min: ₹${promo.min_amount}` : ""}{promo.end_date ? `, Exp: ${new Date(promo.end_date).toLocaleDateString()}` : ""})
                      </option>
                    ))}
                    <option value="custom">Enter custom code</option>
                  </select>
                  {promocode === "custom" && (
                    <input type="text" value={promocode === "custom" ? "" : promocode} onChange={(e) => setPromocode(e.target.value)} placeholder="Enter custom code" className="w-full px-3 py-2 mt-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300" style={styles.input} />
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
                <motion.button onClick={() => setShowModal(false)} whileHover={{ scale: isBooking ? 1 : 1.05 }} whileTap={{ scale: isBooking ? 1 : 0.95 }} className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${isBooking ? "opacity-75 cursor-not-allowed" : ""}`} style={{ background: "linear-gradient(135deg, rgba(156,163,175,0.8), rgba(107,114,128,0.9))", color: "white" }} disabled={isBooking}>
                  Cancel
                </motion.button>
                <motion.button onClick={handleFinalCheckout} whileHover={{ scale: isBooking ? 1 : 1.05 }} whileTap={{ scale: isBooking ? 1 : 0.95 }} className={`px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer relative flex items-center justify-center ${isBooking ? "opacity-75 cursor-not-allowed" : ""}`} style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }} disabled={isBooking}>
                  {isBooking ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Booking...
                    </>
                  ) : ("Confirm Booking")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI assistant modal */}
      {showAiModal && (
        <div
          className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center backdrop-blur-sm"
          onClick={() => { setShowAiModal(false); setAiStep(0); setAiBudget(""); setAiPreferences({ kids: false, sound: false, night: false, kidsnight: false }); setSuggestedCart({}); }}
        >
          <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.82, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[92vh] overflow-y-auto border border-sky-200/40" style={{ ...styles.modal, boxShadow: "0 25px 60px -15px rgba(2,132,199,0.4)" }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-sky-800">Smart Fireworks Assistant</h2>
                <button onClick={() => { setShowAiModal(false); setAiStep(0); setAiBudget(""); setAiPreferences({ kids: false, sound: false, night: false, kidsnight: false }); setSuggestedCart({}); }} className="text-gray-500 hover:text-red-500 text-2xl">×</button>
              </div>

              <AnimatePresence mode="wait">
                {aiStep === 0 && (
                  <motion.div key="budget" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-4">
                    <p className="text-lg text-slate-700">What's your approximate budget? (₹)</p>
                    <input type="number" value={aiBudget} onChange={(e) => setAiBudget(e.target.value)} placeholder="e.g. 5000" className="w-full px-4 py-3 rounded-xl border border-sky-200 focus:ring-2 focus:ring-sky-400 focus:border-transparent text-lg" style={styles.input} />
                  </motion.div>
                )}

                {aiStep === 1 && (
                  <motion.div key="preferences" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-5">
                    <p className="text-lg text-slate-700">What would you like more of?</p>
                    <div className="space-y-4">
                      {[
                        { key: "kids", label: "🎠 Kids (Twinkling Star, Fancy Pencil, Novelties...)" },
                        { key: "sound", label: "💥 Loud Sound Crackers (Bombs, Atom Bombs...)" },
                        { key: "night", label: "🚀 Night Sky (Rockets, Repeating Shots, Sky Shots...)" },
                        { key: "kidsnight", label: "✨ Kids Night (Sparklers, Flower Pots, Fountains, Ground Chakkar...)" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" checked={aiPreferences[key]} onChange={(e) => setAiPreferences((prev) => ({ ...prev, [key]: e.target.checked }))} className="w-5 h-5 accent-sky-600" />
                          <span className="text-slate-700 group-hover:text-sky-700 transition-colors">{label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">💡 Select multiple for a mixed experience. Budget splits equally across selections.</p>
                  </motion.div>
                )}

                {aiStep === 2 && (
                  <motion.div key="suggestions" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-bold text-sky-800">Your Smart Suggestions</p>
                        <p className="text-sm text-slate-600 mt-1">{Object.keys(suggestedCart).length} items • ≈ ₹{suggestedTotals}</p>
                      </div>
                      <button onClick={generateSuggestions} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-medium flex items-center gap-2">Change List</button>
                    </div>

                    {Object.keys(suggestedCart).length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <p>No suitable combination found.</p>
                        <p className="text-sm mt-2">Try a higher budget or different preferences.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {Object.entries(suggestedCart).map(([serial, qty]) => {
                          const p = products.find((x) => x.serial_number === serial);
                          if (!p) return null;
                          const priceAfter = p.price * (1 - (p.discount || 0) / 100);
                          const images = getSafeImages(p.image);
                          return (
                            <div key={serial} className="flex gap-4 p-4 bg-sky-50/60 rounded-2xl border border-sky-100">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-sky-200 flex-shrink-0">
                                <img src={images[0] || need} alt={p.productname} className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = need; }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 line-clamp-2">{p.productname}</p>
                                <p className="text-sm text-sky-700 mt-1">₹{formatPrice(priceAfter)} × {qty}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { const updated = { ...suggestedCart }; if (qty <= 1) delete updated[serial]; else updated[serial] = qty - 1; setSuggestedCart(updated); }} className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700">
                                  <FaMinus />
                                </button>
                                <span className="w-10 text-center font-medium">{qty}</span>
                                <button onClick={() => setSuggestedCart((prev) => ({ ...prev, [serial]: (prev[serial] || 0) + 1 }))} className="w-9 h-9 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700">
                                  <FaPlus />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {Object.keys(suggestedCart).length > 0 && (
                      <button onClick={addSuggestedToCart} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg">
                        Add All Suggested Items to Cart
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 flex justify-between gap-4">
                {aiStep > 0 && <button onClick={handleAiBack} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium">Back</button>}
                <button onClick={handleAiNext} className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold rounded-xl shadow-md">
                  {aiStep < 2 ? "Next" : "Generate Suggestions"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cart toggle + sidebar */}
      <motion.button
        onClick={() => setIsCartOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed cursor-pointer bottom-6 right-6 z-50 text-white rounded-full shadow-xl w-16 h-16 flex items-center justify-center text-2xl transition-all duration-300 ${isCartOpen ? "hidden" : ""}`}
        style={styles.button}
      >
        🛒
        {Object.keys(cart).length > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">
            {Object.values(cart).reduce((a, b) => a + b, 0)}
          </motion.span>
        )}
      </motion.button>

      <motion.aside initial={false} animate={{ x: isCartOpen ? 0 : 320 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="fixed top-0 right-0 w-80 h-full shadow-xl border-l z-50" style={styles.modal}>
        <div className="flex justify-between items-center p-4 border-b border-sky-200">
          <h3 className="text-lg font-bold text-sky-800">Your Cart</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer">×</button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-280px)] p-4 space-y-4">
          {Object.keys(cart).length === 0 ? (
            <p className="text-gray-500 text-sm">Your cart is empty.</p>
          ) : (
            Object.entries(cart).map(([serial, qty]) => {
              const product = products.find((p) => p.serial_number === serial);
              if (!product) return null;
              const discount = (product.price * product.discount) / 100;
              const priceAfterDiscount = formatPrice(product.price - discount);
              const images = getSafeImages(product.image);

              return (
                <motion.div key={serial} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 border-b pb-3 border-sky-100">
                  <div className="w-16 h-16">
                    <img src={images[0] || need} alt={product.productname} className="w-full h-full object-contain rounded-lg p-1" onError={(e) => { e.target.src = need; }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{product.productname}</p>
                    <p className="text-sm text-sky-700 font-bold">₹{priceAfterDiscount} x {qty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => removeFromCart(product)} className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300" style={styles.button}>
                        <FaMinus />
                      </button>
                      <span className="text-sm font-medium px-2 w-16 text-center">{qty}</span>
                      <button onClick={() => addToCart(product)} className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300" style={styles.button}>
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
            <div className="animate-marquee inline-block">🚚 {states.map((s) => `${s.name}: ₹${s.min_rate}`).join(" • ")}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Promocode</label>
            <select value={promocode} onChange={(e) => setPromocode(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300" style={styles.input}>
              <option value="">Select Promocode</option>
              {promoCodes.map((promo) => (
                <option key={promo.id} value={promo.code}>
                  {promo.code} ({promo.discount}% OFF{promo.min_amount ? `, Min: ₹${promo.min_amount}` : ""}{promo.end_date ? `, Exp: ${new Date(promo.end_date).toLocaleDateString()}` : ""})
                </option>
              ))}
              <option value="custom">Enter custom code</option>
            </select>

            {promocode === "custom" && (
              <input type="text" value={promocode === "custom" ? "" : promocode} onChange={(e) => setPromocode(e.target.value)} placeholder="Enter custom code" className="w-full px-3 py-2 mt-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400 transition-all duration-300" style={styles.input} />
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
            <button onClick={() => { setCart({}); setAppliedPromo(null); setPromocode(""); }} className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))", boxShadow: "0 5px 15px rgba(239,68,68,0.3)" }}>
              Clear Cart
            </button>
            <button onClick={handleCheckoutClick} className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 5px 15px rgba(2,132,199,0.3)" }}>
              Checkout
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ===================== FOOTER ===================== */}
      <footer className="px-4 sm:px-6 py-16 mt-20 mb-10 relative">
        <div className="absolute inset-0 rounded-3xl mx-4" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))", backdropFilter: "blur(20px)", border: "1px solid rgba(125,211,252,0.2)", boxShadow: "0 25px 45px rgba(15,23,42,0.3)" }}></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 text-white hundred:ml-[23%] tab:ml-[10%]">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-4 drop-shadow-sm">Our Profile</h2>
            <p className="text-sky-200 mb-2 font-semibold">Fun With Crackers</p>
            <p className="text-sky-100 mb-10 leading-relaxed p-5 md:p-0">Our products focus on our Customer's happiness. Crackers are available in different specifications as per the requirements of the clients.</p>
            <div className="flex justify-center md:justify-start">
              <a
                href="#"
                className="mt-2 cursor-pointer text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 inline-block"
                style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.3), rgba(14,165,233,0.2))", backdropFilter: "blur(10px)", border: "2px solid rgba(125,211,252,0.3)", boxShadow: "0 10px 25px rgba(56,189,248,0.2)" }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(56,189,248,0.9), rgba(14,165,233,0.8))", borderColor: "rgba(125,211,252,0.5)", boxShadow: "0 15px 35px rgba(56,189,248,0.3)" })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(56,189,248,0.3), rgba(14,165,233,0.2))", borderColor: "rgba(125,211,252,0.3)", boxShadow: "0 10px 25px rgba(56,189,248,0.2)" })}
                onClick={() => navigate("/about-us")}
              >
                Read More →
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} viewport={{ once: true }} className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-6 drop-shadow-sm">Contact Us</h2>
            <div className="space-y-4 text-sky-100">
              <div>
                <p className="font-semibold text-white mb-2">Address</p>
                <p>Phoenix Crackers<br />Anil Kumar Eye Hospital Opp.<br />Sattur Road<br />Sivakasi</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Mobile</p>
                <p>+91 63836 59214<br />+91 96554 56167</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Email</p>
                <p>nivasramasamy27@gmail.com</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-6 drop-shadow-sm">Quick Links</h2>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link}>
                  {link === "Price List" ? (
                    <button onClick={scrollToPricelist} className="text-sky-200 hover:text-white transition-colors duration-300 font-medium cursor-pointer">Price List</button>
                  ) : (
                    <a href={link === "Home" ? "/" : `/${link.toLowerCase().replace(/ /g, "-")}`} className="text-sky-200 hover:text-white transition-colors duration-300 font-medium">
                      {link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }} className="mt-16 max-w-5xl mx-auto text-sm text-sky-100 leading-relaxed relative z-10 text-center md:text-center">
          {[
            "As per 2018 Supreme Court order, online sale of firecrackers are not permitted! We value our customers and at the same time, respect jurisdiction. We request you to add your products to the cart and submit the required crackers through the enquiry button. We will contact you within 24 hrs and confirm the order through WhatsApp or phone call. Please add and submit your enquiries and enjoy your Diwali with Fun With Crackers.",
            "Our License No. ----. Fun With Crackers as a company follows 100% legal & statutory compliances, and all our shops, go-downs are maintained as per the explosive acts. We send the parcels through registered and legal transport service providers as every other major company in Sivakasi is doing.",
          ].map((text, i) => (
            <p key={i} className="mb-4 text-sky-100 leading-relaxed p-5 md:p-0">{text}</p>
          ))}
        </motion.div>
        <div className="mt-12 border-t border-sky-700 pt-8 text-center text-sm text-white relative z-10">
          <p>
            Copyright © 2025, <span className="text-sky-300 font-semibold">Fun With Crackers</span>. All rights reserved. Developed by <span className="text-sky-300 font-semibold">SPD Solutions</span>
          </p>
        </div>
      </footer>

      {/* ===================== WhatsApp floating button ===================== */}
      <motion.a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center text-2xl shadow-xl z-50"
        style={styles.whatsappButton}
        aria-label="Chat with us on WhatsApp"
      >
        <FaWhatsapp />
      </motion.a>

      <style jsx>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .details-modal { display: flex !important; visibility: visible !important; opacity: 1 !important; }
        .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 10s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .loader-spinner { border-top-color: #0284c7; }
      `}</style>
    </div>
  );
}