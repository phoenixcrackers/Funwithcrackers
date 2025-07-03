import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaPlus, FaMinus } from "react-icons/fa"
import Navbar from "../Component/Navbar"
import { API_BASE_URL } from "../../Config"

const Pricelist = () => {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showMinOrderModal, setShowMinOrderModal] = useState(false)
  const [minOrderMessage, setMinOrderMessage] = useState("")
  const [customerDetails, setCustomerDetails] = useState({ customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User" })
  const [selectedType, setSelectedType] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [promocode, setPromocode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [invoiceOrderId, setInvoiceOrderId] = useState(null) // Store order_id for download

  const styles = {
    card: { background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(224,242,254,0.3), rgba(186,230,253,0.2))", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 25px 45px rgba(2,132,199,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(2,132,199,0.1)" },
    button: { background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" },
    input: { background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)" },
    modal: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.9))", backdropFilter: "blur(20px)", border: "1px solid rgba(2,132,199,0.3)", boxShadow: "0 25px 45px rgba(2,132,199,0.2)" },
  }

  useEffect(() => {
    const savedCart = localStorage.getItem("firecracker-cart")
    if (savedCart) setCart(JSON.parse(savedCart))
    fetch(`${API_BASE_URL}/api/locations/states`)
      .then(res => res.json())
      .then(setStates)
      .catch(err => console.error("Error fetching states:", err))
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data.filter(p => p.status === "on")))
      .catch(err => console.error("Error loading products:", err))
  }, [])

  useEffect(() => {
    if (customerDetails.state) {
      fetch(`${API_BASE_URL}/api/locations/states/${customerDetails.state}/districts`)
        .then(res => res.json())
        .then(setDistricts)
        .catch(err => console.error("Error fetching districts:", err))
    }
  }, [customerDetails.state])

  useEffect(() => localStorage.setItem("firecracker-cart", JSON.stringify(cart)), [cart])

  const addToCart = useCallback(product => setCart(prev => ({ ...prev, [product.serial_number]: (prev[product.serial_number] || 0) + 1 })), [])
  const removeFromCart = useCallback(product => setCart(prev => {
    const count = (prev[product.serial_number] || 1) - 1
    const updated = { ...prev }
    if (count <= 0) delete updated[product.serial_number]
    else updated[product.serial_number] = count
    return updated
  }), [])

  const handleDownloadPDF = async () => {
    if (!invoiceOrderId) return showError("No invoice available to download.")
    try {
      const invoiceUrl = `${API_BASE_URL}/api/direct/invoice/${invoiceOrderId}`
      const filename = `${customerDetails.customer_name.toLowerCase().replace(/\s+/g, '_')}-${invoiceOrderId}.pdf`
      const pdfResponse = await fetch(invoiceUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/pdf' },
      })
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(link.href)
      } else {
        const errorData = await pdfResponse.json()
        showError(errorData.message || "Failed to download the invoice PDF.")
      }
    } catch (err) {
      console.error("PDF download error:", err)
      showError("Something went wrong while downloading the PDF.")
    }
  }

  const handleFinalCheckout = async () => {
    const order_id = `ORD-${Date.now()}`
    const selectedProducts = Object.entries(cart).map(([serial, qty]) => {
      const product = products.find(p => p.serial_number === serial)
      return { id: product.id, product_type: product.product_type, quantity: qty, per: product.per, image: product.image, price: product.price, discount: product.discount, serial_number: product.serial_number, productname: product.productname, status: product.status }
    })

    if (!selectedProducts.length) return showError("Your cart is empty.")
    const selectedState = customerDetails.state?.trim()
    if (!selectedState) return showError("Please select a state.")
    const minOrder = states.find(s => s.name === selectedState)?.min_rate
    if (minOrder && parseFloat(totals.total) < minOrder) return showError(`Minimum order for ${selectedState} is ₹${minOrder}. Your total is ₹${totals.total}.`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/direct/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, products: selectedProducts, total: Number.parseFloat(totals.total), customer_type: "User", ...customerDetails }),
      })
      if (response.ok) {
        const data = await response.json()
        setInvoiceOrderId(data.order_id) // Store order_id for download
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 6000)
        setCart({})
        setIsCartOpen(false)
        setShowModal(false)
        setCustomerDetails({ customer_name: "", address: "", district: "", state: "", mobile_number: "", email: "", customer_type: "User" })
      } else {
        const data = await response.json()
        showError(data.message || "Booking failed.")
      }
    } catch (err) {
      console.error("Checkout error:", err)
      showError("Something went wrong during checkout.")
    }
  }

  const showError = (message) => {
    setMinOrderMessage(message)
    setShowMinOrderModal(true)
    setTimeout(() => setShowMinOrderModal(false), 5000)
  }

  const handleCheckoutClick = () => Object.keys(cart).length ? setShowModal(true) : showError("Your cart is empty.")

  const handleInputChange = e => setCustomerDetails(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const totals = useMemo(() => {
    let net = 0, save = 0, total = 0
    for (const serial in cart) {
      const qty = cart[serial], product = products.find(p => p.serial_number === serial)
      if (!product) continue
      const originalPrice = Number.parseFloat(product.price), discount = originalPrice * (product.discount / 100), priceAfterDiscount = originalPrice - discount
      net += originalPrice * qty
      save += discount * qty
      total += priceAfterDiscount * qty
    }
    if (appliedPromo) {
      const promoDiscount = (total * appliedPromo.discount) / 100
      total -= promoDiscount
      save += promoDiscount
    }
    return { net: net.toFixed(2), save: save.toFixed(2), total: total.toFixed(2) }
  }, [cart, products, appliedPromo])

  const handleApplyPromo = async () => {
    if (!promocode) return showError("Enter a promocode.")
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes`)
      const promos = await res.json()
      const found = promos.find(p => p.code.toLowerCase() === promocode.toLowerCase())
      found ? setAppliedPromo(found) : showError("Invalid promocode.") || setAppliedPromo(null)
    } catch (err) {
      console.error("Promo apply error:", err)
      showError("Could not validate promocode.")
    }
  }

  const productTypes = useMemo(() => ["All", ...new Set(products.map(p => (p.product_type || "Others").replace(/_/g, " ")).sort())], [products])
  const grouped = useMemo(() => {
    const filtered = products.filter(p => (selectedType === "All" || p.product_type === selectedType.replace(/ /g, "_")) && (!searchTerm || p.productname.toLowerCase().includes(searchTerm.toLowerCase()) || p.serial_number.toLowerCase().includes(searchTerm.toLowerCase())))
    return filtered.reduce((acc, p) => {
      const key = p.product_type || "Others"
      acc[key] = acc[key] || []
      acc[key].push(p)
      return acc
    }, {})
  }, [products, selectedType, searchTerm])

  return (
    <>
      <Navbar />
      {isCartOpen && <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsCartOpen(false)} />}
      {showSuccess && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-auto" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col items-center gap-4 bg-white rounded-xl p-6 shadow-lg" style={styles.modal}>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg">Booked Successfully</h2>
            <button onClick={handleDownloadPDF} className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}>
              Download Invoice PDF
            </button>
          </div>
        </motion.div>
      )}
      {showMinOrderModal && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5 }}>
          <div className="bg-red-200 text-red-400 border-2 text-lg font-semibold rounded-xl p-6 max-w-md mx-4 text-center shadow-lg">{minOrderMessage}</div>
        </motion.div>
      )}
      <main className={`relative pt-28 px-4 sm:px-8 max-w-7xl mx-auto transition-all duration-300 ${isCartOpen ? "mr-80" : ""}`}>
        <section className="rounded-xl px-4 py-3 shadow-inner flex justify-between flex-wrap gap-4 text-sm sm:text-base border border-sky-300 bg-gradient-to-br from-sky-400/80 to-sky-600/90 text-white font-semibold">
          <div>Net Total: ₹{totals.net}</div>
          <div>You Save: ₹{totals.save}</div>
          <div className="font-bold">Total: ₹{totals.total}</div>
        </section>
        <div className="flex justify-center gap-4 mb-8 mt-8">
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="px-4 py-3 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input}>
            {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <input type="text" placeholder="Search by name or serial number" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-xl px-2 w-1/2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input} />
        </div>
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="mt-12 mb-10">
            <h2 className="text-3xl text-sky-800 mb-5 font-semibold capitalize border-b-4 border-sky-500 pb-2">{type.replace(/_/g, " ")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map(product => {
                const originalPrice = Number.parseFloat(product.price), discount = originalPrice * (product.discount / 100), finalPrice = (originalPrice - discount).toFixed(2), count = cart[product.serial_number] || 0
                return (
                  <motion.div key={product.serial_number} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -8, scale: 1.02 }} className="group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-500" style={styles.card}>
                    <div className="absolute left-2 top-2 bg-red-500 text-white text-md font-bold px-2 py-1 rounded-br-lg rounded-tl-lg mobile:text-[10px] mobile:px-1.5 mobile:py-0.5">{product.discount}%</div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "linear-gradient(135deg, rgba(2,132,199,0.3), transparent 50%, rgba(14,165,233,0.2))" }} />
                    <div className="relative z-10 mobile:mt-2">
                      <p className="text-lg mobile:text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm line-clamp-2 mb-2">{product.productname}</p>
                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-slate-500 line-through">MRP: ₹{originalPrice}</p>
                        <p className="text-xl font-bold text-sky-700 group-hover:text-sky-800 transition-colors duration-500">₹{finalPrice} / {product.per}</p>
                      </div>
                      {product.image && (
                        <div className="w-full h-30 rounded-2xl mb-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,255,0.4))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}>
                          <img src={`${API_BASE_URL}${product.image}`} alt={product.productname} className="w-full h-full object-contain p-2" />
                        </div>
                      )}
                      <div className="relative min-h-[3rem] flex items-end justify-end">
                        <AnimatePresence mode="wait">
                          {count > 0 ? (
                            <motion.div key="quantity-controls" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex items-center justify-between w-full rounded-full p-2" style={styles.button}>
                              <motion.button onClick={() => removeFromCart(product)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300"><FaMinus /></motion.button>
                              <motion.span key={count} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="text-white font-bold text-lg px-4 drop-shadow-lg">{count}</motion.span>
                              <motion.button onClick={() => addToCart(product)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-8 h-8 cursor-pointer rounded-full bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-all duration-300"><FaPlus /></motion.button>
                            </motion.div>
                          ) : (
                            <motion.button key="add-button" onClick={() => addToCart(product)} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-12 h-12 cursor-pointer rounded-full text-white font-bold text-xl flex items-center justify-center shadow-lg relative overflow-hidden" style={styles.button}>
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
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative rounded-3xl shadow-lg max-w-md w-full mx-4 overflow-hidden" style={styles.modal}>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-sky-700 drop-shadow-sm">Enter Customer Details</h2>
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-sky-800 font-medium shadow-sm">
                <p className="mb-2 font-semibold">🚚 Minimum Order Amount by Location:</p>
                <ul className="list-disc pl-6 space-y-1">
                  {states.map(s => <li key={s.name}>{s.name}: ₹{s.min_rate}</li>)}
                </ul>
              </div>
              <div className="space-y-4">
                {["customer_name", "address", "mobile_number", "email"].map(field => (
                  <input key={field} name={field} type={field === "email" ? "email" : "text"} placeholder={field.replace(/_/g, " ").toUpperCase()} value={customerDetails[field]} onChange={handleInputChange} className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input} required />
                ))}
                <select name="state" value={customerDetails.state} onChange={e => setCustomerDetails(prev => ({ ...prev, state: e.target.value, district: "" }))} className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input} required>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                {customerDetails.state && (
                  <select name="district" value={customerDetails.district} onChange={handleInputChange} className="w-full border border-sky-200 px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300" style={styles.input} required>
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(156,163,175,0.8), rgba(107,114,128,0.9))", color: "white" }}>Cancel</button>
                <button onClick={handleFinalCheckout} className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 10px 25px rgba(2,132,199,0.3)" }}>Confirm Booking</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <motion.button onClick={() => setIsCartOpen(true)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`fixed cursor-pointer bottom-6 right-6 z-50 text-white rounded-full shadow-xl w-16 h-16 flex items-center justify-center text-2xl transition-all duration-300 ${isCartOpen ? "hidden" : ""}`} style={styles.button}>
        🛒
        {Object.keys(cart).length > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">{Object.values(cart).reduce((a, b) => a + b, 0)}</motion.span>
        )}
      </motion.button>
      <motion.aside initial={false} animate={{ x: isCartOpen ? 0 : 320 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="fixed top-0 right-0 w-80 h-full shadow-xl border-l z-50" style={styles.modal}>
        <div className="flex justify-between items-center p-4 border-b border-sky-200">
          <h3 className="text-lg font-bold text-sky-800">Your Cart</h3>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-600 hover:text-red-500 text-xl cursor-pointer">×</button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-200px)] space-y-4">
          {Object.keys(cart).length === 0 ? (
            <p className="text-gray-500 text-sm">Your cart is empty.</p>
          ) : (
            Object.entries(cart).map(([serial, qty]) => {
              const product = products.find(p => p.serial_number === serial)
              if (!product) return null
              const discount = (product.price * product.discount) / 100, priceAfterDiscount = product.price - discount
              return (
                <motion.div key={serial} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 border-b pb-3 border-sky-100">
                  {product.image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,255,0.4))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.2)" }}>
                      <img src={`${API_BASE_URL}${product.image}`} alt={product.productname} className="w-full h-full object-contain p-1" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{product.productname}</p>
                    <p className="text-sm text-sky-700 font-bold">₹{priceAfterDiscount.toFixed(2)} x {qty}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => removeFromCart(product)} className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300" style={{ background: styles.button.background }}><FaMinus /></button>
                      <span className="text-sm font-medium px-2">{qty}</span>
                      <button onClick={() => addToCart(product)} className="w-7 h-7 text-sm text-white cursor-pointer rounded-full flex items-center justify-center transition-all duration-300" style={{ background: styles.button.background }}><FaPlus /></button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
        <div className="p-4 border-t border-sky-200 sticky bottom-0 space-y-4" style={styles.modal}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Promocode</label>
            <div className="flex gap-2">
              <input type="text" value={promocode} onChange={e => setPromocode(e.target.value)} placeholder="Enter code" className="flex-1 px-3 py-2 rounded-xl border border-sky-300 text-sm focus:ring-2 focus:ring-sky-400" />
              <button onClick={handleApplyPromo} className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))", boxShadow: "0 4px 10px rgba(34,197,94,0.3)" }}>Apply</button>
            </div>
            {appliedPromo && <p className="text-green-600 text-xs mt-1">Applied: {appliedPromo.code} ({appliedPromo.discount}% OFF)</p>}
          </div>
          <div className="text-sm text-slate-700 space-y-1">
            <p>Net: ₹{totals.net}</p>
            <p>You Save: ₹{totals.save}</p>
            <p className="font-bold text-sky-800 text-lg">Total: ₹{totals.total}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCart({})} className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))", boxShadow: "0 5px 15px rgba(239,68,68,0.3)" }}>Clear Cart</button>
            <button onClick={handleCheckoutClick} className="flex-1 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-300 cursor-pointer" style={{ background: styles.button.background, boxShadow: "0 5px 15px rgba(2,132,199,0.3)" }}>Checkout</button>
          </div>
        </div>
      </motion.aside>
      <style jsx>{`.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }`}</style>
    </>
  )
}

export default Pricelist