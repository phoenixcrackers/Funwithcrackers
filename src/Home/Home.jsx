import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkles, Rocket, Volume2, Bomb, Disc, CloudSun, Heart, SmilePlus, Clock, Copy, Check } from "lucide-react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { FaInfoCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa"
import Navbar from "../Component/Navbar"
import "../App.css"
import { API_BASE_URL } from "../../Config"

const categories = [
  { name: "Sparklers", icon: Sparkles },
  { name: "Rockets", icon: Rocket },
  { name: "Single Sound Crackers", icon: Volume2 },
  { name: "Atom Bombs", icon: Bomb },
  { name: "Ground Chakkars", icon: Disc },
  { name: "Sky Shots", icon: CloudSun },
]

const statsData = [
  { label: "Customer Satisfaction", value: 100, icon: Heart },
  { label: "Products", value: 200, icon: Sparkles },
  { label: "Happy Clients", value: 500, icon: SmilePlus },
  { label: "Days Of Crackers", value: 365, icon: Clock },
]

const navLinks = ["Home", "About Us", "Price List", "Safety Tips", "Contact Us"]

const styles = {
  card: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(224,242,254,0.3) 50%, rgba(186,230,253,0.2))",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(125,211,252,0.3)",
    boxShadow: "0 25px 45px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(56,189,248,0.1)",
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
  modal: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(2,132,199,0.3)",
    boxShadow: "0 25px 45px rgba(2,132,199,0.2)",
  },
  categoryIcon: {
    background: "linear-gradient(135deg, rgba(56,189,248,0.8), rgba(14,165,233,0.9))",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(125,211,252,0.3)",
    boxShadow: "0 10px 25px rgba(56,189,248,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
}

const Carousel = ({ media }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const dragRef = useRef(null)

  const mediaItems = useMemo(() => {
    const items = typeof media === "string" ? JSON.parse(media) : Array.isArray(media) ? media : []
    return items.sort((a, b) => {
      const [isAImage, isAGif, isAVideo] = [a.startsWith("data:image/") && !a.includes(".gif"), a.includes(".gif"), a.startsWith("data:video/")]
      const [isBImage, isBGif, isBVideo] = [b.startsWith("data:image/") && !b.includes(".gif"), b.includes(".gif"), b.startsWith("data:video/")]
      const getPriority = (img, gif, vid) => img ? 0 : gif ? 1 : vid ? 2 : 3
      return getPriority(isAImage, isAGif, isAVideo) - getPriority(isBImage, isBGif, isBVideo)
    })
  }, [media])

  const handleSwipe = (e, direction) => {
    setIsDragging(false)
    const endX = e.changedTouches[0].clientX
    const diffX = startX - endX
    if (Math.abs(diffX) > 50) setCurrentIndex((prev) => (prev + (diffX > 0 ? 1 : -1) + mediaItems.length) % mediaItems.length)
  }

  if (!mediaItems.length) {
    return <div className="w-full h-30 rounded-2xl mb-4 overflow-hidden bg-gray-200 flex items-center justify-center">No media available</div>
  }

  return (
    <div
      className="relative w-full h-30 rounded-2xl mb-4 overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,255,0.4))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}
      onTouchStart={(e) => (setIsDragging(true), setStartX(e.touches[0].clientX))}
      onTouchMove={() => isDragging && null}
      onTouchEnd={(e) => handleSwipe(e)}
      ref={dragRef}
    >
      {mediaItems[currentIndex].startsWith("data:video/") ? (
        <video src={mediaItems[currentIndex]} autoPlay muted loop className="w-full h-full object-contain p-2" />
      ) : (
        <img src={mediaItems[currentIndex] || "/placeholder.svg"} alt="Product" className="w-full h-full object-contain p-2" />
      )}
      {mediaItems.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))}
            className="mobile:hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-lg z-10 hover:bg-sky-700 hover:text-white cursor-pointer"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
            aria-label="Previous media"
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))}
            className="mobile:hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-sky-700 flex items-center justify-center text-lg z-10 hover:bg-sky-700 hover:text-white cursor-pointer"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
            aria-label="Next media"
          >
            <FaArrowRight />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {mediaItems.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-sky-700" : "bg-gray-300"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const StatCard = ({ icon: Icon, value, label, delay }) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (inView && count === 0) {
      let start = 0
      const timer = setInterval(() => {
        start += 1
        setCount(start)
        if (start === value) clearInterval(timer)
      }, Math.max(Math.floor(1000 / value), 10))
      return () => clearInterval(timer)
    }
  }, [inView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="group relative rounded-2xl py-8 px-6 transition-all duration-500 overflow-hidden cursor-pointer"
      style={styles.card}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={styles.cardHover} />
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-all duration-1000" style={styles.shine} />
      <div className="relative z-10">
        <Icon className="w-12 h-12 text-sky-600 group-hover:text-sky-700 mb-4 transition-colors duration-500 drop-shadow-lg" />
        <p className="text-4xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm">{count}+</p>
        <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 mt-2 transition-colors duration-500">{label}</p>
      </div>
    </motion.div>
  )
}

const PromoBurst = ({ promoCodes }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBursted, setHasBursted] = useState(false)
  const [showPromoCard, setShowPromoCard] = useState(false)
  const [copied, setCopied] = useState('')
  const [isHovering, setIsHovering] = useState(false)
  const navigate = useNavigate()
  const rocketRef = useRef(null)
  const [hasRocketBeenUsed, setHasRocketBeenUsed] = useState(false)

  const handleClick = () => {
    if (!hasBursted && !hasRocketBeenUsed) {
      setHasRocketBeenUsed(true)
      setIsOpen(true)
      setTimeout(() => {
        setHasBursted(true)
        setTimeout(() => setShowPromoCard(true), 2500)
      }, 1200)
    }
  }

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Format date if it exists
  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-40">
        <AnimatePresence>
          {!hasRocketBeenUsed && !isOpen && !hasBursted && (
            <motion.div
              key="rocket"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } }}
              exit={{ y: '-100vh', opacity: 0, scale: 0.3, rotate: 15, transition: { duration: 1.2, ease: 'easeInOut' } }}
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
                animate={{ y: [-3, 3], rotate: [-1, 1], transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' } }}
              >
                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-800" />
                <div className="absolute bottom-0 left-[-6px] w-6 h-6 bg-red-800 rounded-bl-full" />
                <div className="absolute bottom-0 right-[-6px] w-6 h-6 bg-red-800 rounded-br-full" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-200 rounded-full border-2 border-blue-400" />
                <motion.div
                  className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                  animate={{ opacity: [0.7, 1, 0.7], y: [0, -25, -15], scale: [0.8, 1.2, 0.8], x: [-2, 2, -1] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full"
                  animate={{ opacity: [0.5, 0.9, 0.5], y: [0, -30, -20], scale: [0.6, 1, 0.6], x: [1, -1, 2] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
              </motion.div>
              <motion.div
                className="absolute top-20 left-1/2 -translate-x-1/2 w-1 h-12 bg-gray-500 cursor-pointer rounded-full"
                style={{ touchAction: 'none' }}
                animate={{ rotateZ: [-3, 3], transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}
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
              style={{ background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.7) 60%)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.8, 0.6], scale: [0, 1.2, 1], transition: { duration: 1, ease: 'easeOut' } }}
              exit={{ opacity: 0, scale: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full z-40"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(135,206,235,0.2) 30%, transparent 70%)', boxShadow: '0 0 200px rgba(135,206,235,0.4), inset 0 0 100px rgba(255,255,255,0.2)' }}
            />
            <motion.div
              key="promo-card"
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 15, duration: 0.8 } }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-80 md:w-96 mobile:w-96 rounded-3xl p-4 overflow-hidden bg-white shadow-2xl border border-sky-200" style={{ boxShadow: '0 25px 50px rgba(135,206,235,0.3), 0 0 0 1px rgba(135,206,235,0.2)' }}>
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, rgba(135,206,235,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(135,206,235,0.2) 0%, transparent 50%)` }} />
                <motion.h3
                  animate={{ scale: [1, 1.05, 1], color: ['rgb(14, 165, 233)', 'rgb(2, 132, 199)', 'rgb(14, 165, 233)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl font-bold text-center mb-4 drop-shadow-sm"
                  style={{ color: 'rgb(14, 165, 233)' }}
                >
                  ✨ EXCLUSIVE DEALS ✨
                </motion.h3>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-sky-300 scrollbar-track-sky-100 pr-4">
                  {promoCodes.map((promo, i) => (
                    <motion.div
                      key={promo.id}
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200 hover:border-sky-300 transition-all duration-300 mb-4"
                      style={{ boxShadow: '0 4px 15px rgba(135,206,235,0.1)' }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <motion.span className="bg-sky-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-md" whileHover={{ scale: 1.1 }}>{promo.discount}%</motion.span>
                            <span className="text-sky-700 font-mono text-lg font-semibold">{promo.code}</span>
                          </div>
                          {promo.min_amount && (
                            <p className="text-sky-600 text-sm">Minimum order: ₹{promo.min_amount}</p>
                          )}
                          {promo.end_date && (
                            <p className="text-sky-600 text-sm">Expires: {formatDate(promo.end_date)}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <motion.button
                            onClick={() => handleCopy(promo.code)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-sky-100 rounded-full text-sky-600 hover:bg-sky-200 transition-colors duration-200 shadow-md z-60"
                          >
                            {copied === promo.code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            onClick={() => navigate('/price-list')}
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
  )
}

const BigFireworkAnimation = ({ delay = 0 }) => {
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080
  const burstPosition = { x: screenWidth * 0.5, y: screenHeight * 0.5 }
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
  )
}

export default function Home() {
  const [banners, setBanners] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fastRunningProducts, setFastRunningProducts] = useState([])
  const [promoCodes, setPromoCodes] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const aboutY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = (url, setter) => {
      fetch(url)
        .then((res) => res.json())
        .then((data) => setter(data.filter((item) => item.is_active || item.fast_running)))
        .catch((err) => console.error(`Error loading ${url}:`, err))
    }
    const fetchPromoCodes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/promocodes`)
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        setPromoCodes(await res.json())
      } catch (err) {
        console.error("Error loading promo codes:", err)
        setPromoCodes([])
      }
    }
    fetchData(`${API_BASE_URL}/api/banners`, setBanners)
    fetchData(`${API_BASE_URL}/api/products`, setFastRunningProducts)
    fetchPromoCodes()
    const intervals = [
      setInterval(() => fetchData(`${API_BASE_URL}/api/banners`, setBanners), 1200 * 1000),
      setInterval(() => fetchData(`${API_BASE_URL}/api/products`, setFastRunningProducts), 5 * 1000),
      setInterval(fetchPromoCodes, 30 * 1000),
      setInterval(() => setCurrentSlide((prev) => (prev + 1) % (banners.length || 1)), 4000),
    ]
    return () => intervals.forEach(clearInterval)
  }, [banners.length])

  return (
    <div ref={containerRef} className="min-h-screen text-slate-800 overflow-x-hidden" style={{ background: "linear-gradient(135deg, #fef7ff 0%, #f0f9ff 25%, #ecfdf5 50%, #fef3c7 75%, #fef7ff 100%)" }}>
      <Navbar />
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-55 flex items-center justify-center details-modal">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative rounded-3xl shadow-lg max-w-md w-full mx-4 overflow-hidden" style={styles.modal}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-sky-700 drop-shadow-sm">{selectedProduct.productname}</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer" aria-label="Close details modal">×</button>
              </div>
              <Carousel media={selectedProduct.image} />
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-800">Description</h3>
                <p className="text-sm text-slate-600 mt-2">{selectedProduct.description || "No description available."}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer"
                  style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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
      <section className="py-2 px-4 sm:px-6 max-w-7xl mx-auto mt-5">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-5xl font-bold text-slate-800 mb-4 mobile:text-3xl">Fast Running Products</h2>
          <div className="w-24 h-1 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.8), rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8))", boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }} />
        </motion.div>
        <div className="flex flex-row space-x-6 overflow-x-auto mt-8 mobile:space-x-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-sky-100">
          {fastRunningProducts.map((product) => {
            const originalPrice = Number.parseFloat(product.price)
            const finalPrice = (originalPrice - originalPrice * (product.discount / 100)).toFixed(2)
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
                  onClick={() => (setSelectedProduct(product), setShowDetailsModal(true))}
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
                    {product.image && <Carousel media={product.image} />}
                    <div className="relative min-h-[3rem] flex items-center justify-center translate-x-3 mobile:min-h-[2rem] w-52">
                      <motion.button
                        onClick={() => navigate("/price-list")}
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
            )
          })}
        </div>
      </section>
      {promoCodes.length > 0 && <PromoBurst promoCodes={promoCodes} />}
      <motion.section style={{ y: aboutY }} className="py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -100 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="relative md:translate-x-60 mobile:ml-5">
            <div className="absolute -inset-4 rounded-3xl transform rotate-3 w-96 mobile:w-92" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(125,211,252,0.3))", backdropFilter: "blur(10px)" }}></div>
            <div className="relative rounded-3xl w-84" style={{ ...styles.card, border: "1px solid rgba(125,211,252,0.3)" }}>
              <img src="/cont.png" alt="Diwali Poster" className="w-84 h-96 object-cover rounded-2xl hover:scale-105 transition-all duration-700" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 100 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="space-y-8">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight drop-shadow-sm">
              Fun With<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-500">Crackers</span>
            </motion.h2>
            {["Fun With Crackers has been a well-known Fireworks Store in Sivakasi. What started out as a hobby has become our passion.", "We offer quality products, unparalleled service, and the most competitive prices in town.", "Trusted name among top companies in the Sivakasi fireworks business — manufacturing, wholesaling, and retailing traditional and modern fireworks."].map((text, i) => (
              <motion.p key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} viewport={{ once: true }} className="text-lg text-slate-600 leading-relaxed">{text}</motion.p>
            ))}
          </motion.div>
        </div>
      </motion.section>
      <section className="py-32 mobile:-translate-y-40 px-4 sm:px-6 max-w-7xl mx-auto relative">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-slate-800 via-sky-600 to-teal-500 bg-clip-text drop-shadow-sm">Our Categories</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.8), rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8))", boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }}></div>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(({ name, icon: Icon }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                whileHover={{ y: -15, scale: 1.02, rotateY: 5 }}
                className="group relative rounded-3xl p-8 overflow-hidden cursor-pointer"
                style={styles.card}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={styles.cardHover} />
                <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-all duration-1000" style={styles.shine} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.05), rgba(20,184,166,0.05))" }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto transition-all duration-500 group-hover:scale-110" style={styles.categoryIcon}>
                    <Icon className="text-white w-8 h-8 transition-all duration-500 group-hover:text-sky-100 drop-shadow-lg" />
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-4 text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm">{name}</h3>
                  <p className="text-slate-600 group-hover:text-slate-700 text-center mb-6 transition-colors duration-500">Get quality {name} from Fun With Crackers</p>
                  <div className="text-center">
                    <button
                      onClick={() => navigate("/price-list")}
                      className="px-6 py-3 cursor-pointer font-semibold rounded-full transition-all duration-500 group-hover:scale-105"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(224,242,254,0.2))", backdropFilter: "blur(10px)", border: "2px solid rgba(56,189,248,0.6)", color: "#0f172a", boxShadow: "0 10px 25px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.3)" }}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(56,189,248,0.9), rgba(14,165,233,0.9))", color: "white", borderColor: "rgba(125,211,252,0.4)", boxShadow: "0 15px 35px rgba(56,189,248,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" })}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(224,242,254,0.2))", color: "#0f172a", borderColor: "rgba(56,189,248,0.6)", boxShadow: "0 10px 25px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.3)" })}
                    >
                      EXPLORE
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, rgba(125,211,252,0.6), transparent)" }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-32 mobile:-translate-y-70 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 rounded-3xl mx-4" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))", backdropFilter: "blur(20px)", border: "1px solid rgba(125,211,252,0.2)", boxShadow: "0 25px 45px rgba(15,23,42,0.3)" }}></div>
        <motion.div className="absolute inset-0 opacity-20 rounded-3xl mx-4 overflow-hidden" style={{ backgroundImage: "url('/fireworks-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }} />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h2 initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg text-white">
            Order Your Crackers<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-300">& Gift Boxes Now</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} viewport={{ once: true }} className="text-xl mb-8 text-sky-100 drop-shadow-sm leading-relaxed p-5 md:p-0">Order online and get the best discounts on all products.</motion.p>
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer text-slate-800 px-12 py-4 rounded-full text-lg font-bold transition-all duration-300 uppercase tracking-wide"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.3)", boxShadow: "0 15px 35px rgba(56,189,248,0.3)" }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(56,189,248,0.9), rgba(14,165,233,0.9))", color: "white", boxShadow: "0 20px 40px rgba(56,189,248,0.4)" })}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))", color: "#0f172a", boxShadow: "0 15px 35px rgba(56,189,248,0.3)" })}
            onClick={() => navigate("/price-list")}
          >
            PLACE YOUR ORDER
          </motion.button>
        </div>
        <div className="absolute top-10 left-10 w-8 h-8 rounded-full opacity-75" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.8) 0%, rgba(245,158,11,0.6) 100%)", backdropFilter: "blur(10px)", animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", boxShadow: "0 10px 25px rgba(251,191,36,0.3)" }}></div>
        <div className="absolute bottom-12 right-16 w-5 h-5 rounded-full opacity-60" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.8) 0%, rgba(219,39,119,0.6) 100%)", backdropFilter: "blur(10px)", animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", animationDelay: "0.5s", boxShadow: "0 8px 20px rgba(236,72,153,0.3)" }}></div>
        <div className="absolute top-24 right-24 w-6 h-6 rounded-full opacity-70" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(124,58,237,0.6) 100%)", backdropFilter: "blur(10px)", animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", animationDelay: "1s", boxShadow: "0 8px 20px rgba(139,92,246,0.3)" }}></div>
      </section>
      <section className="py-32 mobile:-translate-y-70 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-slate-800 via-sky-600 to-teal-500 bg-clip-text drop-shadow-sm">Our Achievements</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.8), rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8))", boxShadow: "0 4px 15px rgba(56,189,248,0.3)" }}></div>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, i) => <StatCard key={i} {...stat} delay={i * 0.2} />)}
          </div>
        </div>
      </section>
      <footer className="px-4 sm:px-6 py-16 mobile:-translate-y-70 mobile:-mb-60 mb-10 relative">
        <div className="absolute inset-0 rounded-3xl mx-4" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))", backdropFilter: "blur(20px)", border: "1px solid rgba(125,211,252,0.2)", boxShadow: "0 25px 45px rgba(15,23,42,0.3)" }}></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 text-white hundred:ml-[23%] onefifty:ml-[15%]">
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
              <div><p className="font-semibold text-white mb-2">Address</p><p>Phoenix Crackers<br />Anil Kumar Eye Hospital Opp.<br />Sattur Road<br />Sivakasi</p></div>
              <div><p className="font-semibold text-white mb-2">Mobile</p><p>+91 63836 59214<br />+91 96554 56167</p></div>
              <div><p className="font-semibold text-white mb-2">Email</p><p>nivasramasamy27@gmail.com</p></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }} className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-6 drop-shadow-sm">Quick Links</h2>
            <ul className="space-y-3">{navLinks.map((link) => <li key={link}><a href={link === "Home" ? "/" : `/${link.toLowerCase().replace(/ /g, "-")}`} className="text-sky-200 hover:text-white transition-colors duration-300 font-medium">{link}</a></li>)}</ul>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }} className="mt-16 max-w-5xl mx-auto text-sm text-sky-100 leading-relaxed relative z-10 text-center md:text-left">
          {["As per 2018 Supreme Court order, online sale of firecrackers are not permitted! We value our customers and at the same time, respect jurisdiction. We request you to add your products to the cart and submit the required crackers through the enquiry button. We will contact you within 24 hrs and confirm the order through WhatsApp or phone call. Please add and submit your enquiries and enjoy your Diwali with Fun With Crackers.", "Our License No. ----. Fun With Crackers as a company follows 100% legal & statutory compliances, and all our shops, go-downs are maintained as per the explosive acts. We send the parcels through registered and legal transport service providers as every other major company in Sivakasi is doing."].map((text, i) => (
            <p key={i} className="mb-4 text-sky-100 leading-relaxed p-5 md:p-0">{text}</p>
          ))}
        </motion.div>
        <div className="mt-12 border-t border-sky-700 pt-8 text-center text-sm text-white relative z-10">
          <p>Copyright © 2025, <span className="text-sky-300 font-semibold">Fun With Crackers</span>. All rights reserved. Developed by <span className="text-sky-300 font-semibold">SPD Solutions</span></p>
        </div>
      </footer>
      <style>
        {`
          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .details-modal {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  )
}