import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaPlus, FaMinus } from "react-icons/fa"
import Navbar from "../Component/Navbar"
import { API_BASE_URL } from "../../Config"

const BigFireworkAnimation = ({ delay = 0, startPosition, endPosition, burstPosition, color }) => {
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <motion.div
        className="absolute w-6 h-6 rounded-full"
        style={{ left: startPosition.x, top: startPosition.y, background: `linear-gradient(180deg, ${color.primary} 0%, ${color.secondary} 50%, ${color.tertiary} 100%)`, boxShadow: `0 0 15px ${color.primary}`, transform: "rotate(45deg)" }}
        animate={{ x: [0, endPosition.x - startPosition.x], y: [0, endPosition.y - startPosition.y], opacity: [1, 1, 0] }}
        transition={{ duration: 2.5, delay, ease: "easeOut" }}
      />
      <motion.div
        className="absolute"
        style={{ left: burstPosition.x, top: burstPosition.y, transform: "translate(-50%, -50%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.8, 0] }}
        transition={{ duration: 4, delay: delay + 2.5 }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = i * 15 * (Math.PI / 180), distance = screenWidth * 0.4, x = Math.cos(angle) * distance, y = Math.sin(angle) * distance
          return (
            <motion.div
              key={`main-${i}`}
              className="absolute w-4 h-4 rounded-full"
              style={{ background: `hsl(${(i * 15 + Math.random() * 60) % 360}, 80%, 65%)`, boxShadow: `0 0 20px hsl(${(i * 15 + Math.random() * 60) % 360}, 80%, 65%)` }}
              animate={{ x: [0, x * 0.3, x * 0.7, x], y: [0, y * 0.3, y * 0.7, y], opacity: [1, 0.8, 0.4, 0], scale: [1, 1.2, 0.8, 0] }}
              transition={{ duration: 4, delay: delay + 2.5, ease: "easeOut" }}
            />
          )
        })}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10 * (Math.PI / 180), distance = screenWidth * 0.25, x = Math.cos(angle) * distance, y = Math.sin(angle) * distance
          return (
            <motion.div
              key={`secondary-${i}`}
              className="absolute w-2 h-2 rounded-full"
              style={{ background: `hsl(${(i * 10 + Math.random() * 40) % 360}, 70%, 60%)`, boxShadow: `0 0 12px hsl(${(i * 10 + Math.random() * 40) % 360}, 70%, 60%)` }}
              animate={{ x: [0, x * 0.4, x * 0.8, x], y: [0, y * 0.4, y * 0.8, y], opacity: [1, 0.7, 0.3, 0], scale: [1, 1.1, 0.6, 0] }}
              transition={{ duration: 3.5, delay: delay + 2.7, ease: "easeOut" }}
            />
          )
        })}
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = i * 7.5 * (Math.PI / 180), distance = screenWidth * 0.35, x = Math.cos(angle) * distance, y = Math.sin(angle) * distance
          return (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 rounded-full"
              style={{ background: "#ffffff", boxShadow: "0 0 8px #ffffff" }}
              animate={{ x: [0, x * 0.2, x * 0.6, x * 1.2], y: [0, y * 0.2, y * 0.6, y * 1.2], opacity: [1, 0.8, 0.4, 0], scale: [1, 0.8, 0.4, 0] }}
              transition={{ duration: 3, delay: delay + 3, ease: "easeOut" }}
            />
          )
        })}
        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{ background: `radial-gradient(circle, ${color.primary}aa 0%, ${color.secondary}66 30%, transparent 70%)`, transform: "translate(-50%, -50%)" }}
          animate={{ scale: [0, 3, 1.5, 0], opacity: [0, 1, 0.3, 0] }}
          transition={{ duration: 2, delay: delay + 2.5, ease: "easeOut" }}
        />
      </motion.div>
    </div>
  )
}

const Pricelist = () => {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [customerDetails, setCustomerDetails] = useState({ customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User" })
  const [selectedType, setSelectedType] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")

  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080

  const fireworkConfigs = [
    { delay: 0, startPosition: { x: -50, y: screenHeight + 50 }, endPosition: { x: screenWidth * 0.5, y: screenHeight * 0.5 }, burstPosition: { x: screenWidth * 0.5, y: screenHeight * 0.5 }, color: { primary: "#ffd93d", secondary: "#ffe066", tertiary: "#ffe999" } },
    { delay: 0, startPosition: { x: screenWidth + 50, y: screenHeight + 50 }, endPosition: { x: screenWidth * 0.5, y: screenHeight * 0.5 }, burstPosition: { x: screenWidth * 0.5, y: screenHeight * 0.5 }, color: { primary: "#a8e6cf", secondary: "#c8f7c5", tertiary: "#e8f8f5" } },
  ]

  useEffect(() => {
    const savedCart = localStorage.getItem("firecracker-cart")
    if (savedCart) setCart(JSON.parse(savedCart))
  }, [])

  useEffect(() => {
    localStorage.setItem("firecracker-cart", JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data.filter((product) => product.status === "on")))
      .catch((err) => console.error("Error loading products:", err))
  }, [])

  const addToCart = useCallback((product) => {
    setCart((prev) => ({ ...prev, [product.serial_number]: (prev[product.serial_number] || 0) + 1 }))
  }, [])

  const removeFromCart = useCallback((product) => {
    setCart((prev) => {
      const count = (prev[product.serial_number] || 1) - 1
      const updated = { ...prev }
      if (count <= 0) delete updated[product.serial_number]
      else updated[product.serial_number] = count
      return updated
    })
  }, [])

  const handleFinalCheckout = async () => {
    const order_id = `ORD-${Date.now()}`
    const selectedProducts = Object.entries(cart).map(([serial, qty]) => {
      const product = products.find((p) => p.serial_number === serial)
      return { id: product.id, product_type: product.product_type, quantity: qty, per: product.per, image: product.image, price: product.price, discount: product.discount, serial_number: product.serial_number, productname: product.productname, status: product.status }
    })
    if (selectedProducts.length === 0) return alert("Your cart is empty.")
    try {
      const response = await fetch(`${API_BASE_URL}/api/direct/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, products: selectedProducts, total: Number.parseFloat(totals.total), customer_type: "User", ...customerDetails })
      })
      const data = await response.json()
      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 6000)
        setCart({})
        setIsCartOpen(false)
        setShowModal(false)
        setCustomerDetails({ customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User" })
      } else {
        alert(data.message || "Booking failed.")
      }
    } catch (err) {
      console.error("Checkout error:", err)
      alert("Something went wrong during checkout.")
    }
  }

  const handleCheckoutClick = () => {
    if (Object.keys(cart).length === 0) return alert("Your cart is empty.")
    setShowModal(true)
  }

  const handleInputChange = (e) => {
    setCustomerDetails({ ...customerDetails, [e.target.name]: e.target.value })
  }

  const totals = useMemo(() => {
    let net = 0, save = 0, total = 0
    for (const serial in cart) {
      const qty = cart[serial]
      const product = products.find((p) => p.serial_number === serial)
      if (!product) continue
      const originalPrice = Number.parseFloat(product.price)
      const discount = originalPrice * (product.discount / 100)
      const priceAfterDiscount = originalPrice - discount
      net += originalPrice * qty
      save += discount * qty
      total += priceAfterDiscount * qty
    }
    return { net: net.toFixed(2), save: save.toFixed(2), total: total.toFixed(2) }
  }, [cart, products])

  const productTypes = useMemo(() => {
    const types = [...new Set(products.map((p) => (p.product_type || "Others").replace(/_/g, " ")))]
    return ["All", ...types.sort()]
  }, [products])

  const grouped = useMemo(() => {
    const filteredProducts = products.filter((product) => {
      const matchesType = selectedType === "All" || product.product_type === selectedType.replace(/ /g, "_")
      const matchesSearch = !searchTerm || 
        product.productname.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesType && matchesSearch
    })
    return filteredProducts.reduce((acc, product) => {
      const key = product.product_type || "Others"
      acc[key] = acc[key] || []
      acc[key].push(product)
      return acc
    }, {})
  }, [products, selectedType, searchTerm])

  return (
    <>
      <Navbar />
      {isCartOpen && <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsCartOpen(false)} />}
      {showSuccess && (
        <>
          <div className="fixed inset-0 pointer-events-none z-50">
            {fireworkConfigs.map((config, index) => (
              <BigFireworkAnimation
                key={index}
                delay={config.delay}
                startPosition={config.startPosition}
                endPosition={config.endPosition}
                burstPosition={config.burstPosition}
                color={config.color}
              />
            ))}
          </div>
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 2.5 }}
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">
              Booked Successfully
            </h2>
          </motion.div>
        </>
      )}
      <main className={`relative pt-28 px-4 sm:px-8 max-w-7xl mx-auto transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
        <section className="rounded-xl px-4 py-3 shadow-inner flex justify-between flex-wrap gap-4 text-sm sm:text-base border border-sky-300 bg-gradient-to-br from-sky-400/80 to-sky-600/90 text-white font-semibold">
          <div>Net Total: ₹{totals.net}</div>
          <div>You Save: ₹{totals.save}</div>
          <div className="font-bold">Total: ₹{totals.total}</div>
        </section>
        <div className="flex justify-center gap-4 mb-8 mt-8">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 mobile:text-sm"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,249,255,0.6) 100%)", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)" }}
          >
            {productTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by name or serial number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 mobile:text-sm w-64"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,249,255,0.6) 100%)", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)" }}
          />
        </div>
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="mt-12 mb-10">
            <h2 className="text-3xl text-sky-800 mb-5 font-semibold capitalize border-b-4 border-sky-500 pb-2">
              {type.replace(/_/g, " ")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((product) => {
                const originalPrice = Number.parseFloat(product.price)
                const discount = originalPrice * (product.discount / 100)
                const finalPrice = (originalPrice - discount).toFixed(2)
                const count = cart[product.serial_number] || 0
                return (
                  <motion.div
                    key={product.serial_number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(224,242,254,0.3) 50%, rgba(186,230,253,0.2) 100%)", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 25px 45px rgba(2,132,199,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(2,132,199,0.1)" }}
                  >
                    <div className="absolute left-2 top-2 bg-red-500 text-white text-md font-bold px-2 py-1 rounded-br-lg rounded-tl-lg mobile:text-[10px] mobile:px-1.5 mobile:py-0.5">{product.discount}%</div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.3) 0%, transparent 50%, rgba(14,165,233,0.2) 100%)" }} />
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm line-clamp-2 mb-2">{product.productname}</h3>
                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-slate-500 line-through">MRP: ₹{originalPrice}</p>
                        <p className="text-xl font-bold text-sky-700 group-hover:text-sky-800 transition-colors duration-500">₹{finalPrice} / {product.per}</p>
                      </div>
                      {product.image && (
                        <div className="w-full h-30 rounded-2xl mb-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(240,249,255,0.4) 100%)", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}>
                          <img src={`${API_BASE_URL}${product.image}`} alt={product.productname} className="w-full h-full object-contain p-2" />
                        </div>
                      )}
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
                              style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.9) 0%, rgba(14,165,233,0.95) 100%)", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.25), inset 0 1px 0 rgba(255,255,255,0.2)" }}
                            >
                              <motion.button
                                onClick={() => removeFromCart(product)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300"
                              >
                                <FaMinus />
                              </motion.button>
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={count}
                                  initial={{ scale: 1.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="text-white font-bold text-lg px-4 drop-shadow-lg"
                                >
                                  {count}
                                </motion.span>
                              </AnimatePresence>
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
                              whileTap={{ scale: 0.9 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="w-12 h-12 cursor-pointer rounded-full text-white font-bold text-xl flex items-center justify-center shadow-lg relative overflow-hidden"
                              style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.9) 0%, rgba(14,165,233,0.95) 100%)", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" }}
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
                )
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
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 25px 45px rgba(2,132,199,0.2)" }}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-sky-700 drop-shadow-sm">Enter Customer Details</h2>
              <div className="space-y-4">
                {["customer_name", "address", "district", "state", "mobile_number", "email"].map((field) => (
                  <input
                    key={field}
                    name={field}
                    type={field === "email" ? "email" : "text"}
                    placeholder={field.replace(/_/g, " ").toUpperCase()}
                    value={customerDetails[field]}
                    onChange={handleInputChange}
                    className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,249,255,0.6) 100%)", backdropFilter: "blur(10px)" }}
                    required
                  />
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, rgba(156,163,175,0.8) 0%, rgba(107,114,128,0.9) 100%)", color: "white" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalCheckout}
                  className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.9) 0%, rgba(14,165,233,0.9) 100%)", boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}
                >
                  Confirm Booking
                </button>
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
        style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.9) 0%, rgba(14,165,233,0.9) 100%)", backdropFilter: "blur(10px)", border: "1px solid rgba(125,211,252,0.3)", boxShadow: "0 15px 35px rgba(2,132,199,0.3)" }}
      >
        🛒
        {Object.keys(cart).length > 0 && (
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
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)" }}
      >
        <div className="flex justify-between items-center p-4 border-b border-sky-200">
          <h3 className="text-lg font-bold text-sky-800">Your Cart</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer">×</button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-130px)] space-y-4">
          {Object.keys(cart).length === 0 ? (
            <p className="text-gray-500 text-sm">Your cart is empty.</p>
          ) : (
            Object.entries(cart).map(([serial, qty]) => {
              const product = products.find((p) => p.serial_number === serial)
              if (!product) return null
              const discount = (product.price * product.discount) / 100
              const priceAfterDiscount = product.price - discount
              return (
                <motion.div
                  key={serial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 border-b pb-3 border-sky-100"
                >
                  {product.image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(240,249,255,0.4) 100%)", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}>
                      <img src={`${API_BASE_URL}${product.image}`} alt={product.productname} className="w-full h-full object-contain p-1" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{product.productname}</p>
                    <p className="text-sm text-sky-700 font-bold">₹{priceAfterDiscount.toFixed(2)} x {qty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => removeFromCart(product)} className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300" style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.8) 0%, rgba(14,165,233,0.9) 100%)" }}>
                        <FaMinus />
                      </button>
                      <span className="text-sm font-medium px-2">{qty}</span>
                      <button onClick={() => addToCart(product)} className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300" style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.8) 0%, rgba(14,165,233,0.9) 100%)" }}>
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
        <div className="p-4 border-t border-sky-200 sticky bottom-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)", backdropFilter: "blur(20px)" }}>
          <div className="space-y-3">
            <div className="text-sm text-slate-700 space-y-1">
              <p>Net: ₹{totals.net}</p>
              <p>You Save: ₹{totals.save}</p>
              <p className="font-bold text-sky-800 text-lg">Total: ₹{totals.total}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCart({})} className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.9) 0%, rgba(220,38,38,0.9) 100%)", boxShadow: "0 5px 15px rgba(239,68,68,0.3)" }}>
                Clear Cart
              </button>
              <button onClick={handleCheckoutClick} className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.9) 0%, rgba(14,165,233,0.9) 100%)", boxShadow: "0 5px 15px rgba(2,132,199,0.3)" }}>
                Checkout
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}

export default Pricelist