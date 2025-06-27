import { useState, useEffect, useRef } from "react"
import { Sparkles, Rocket, Volume2, Bomb, Disc, CloudSun, Heart, SmilePlus, Clock } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Navbar from '../Component/Navbar'
import "../App.css"

// Categories
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

function StatCard({ icon: Icon, value, label, delay }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (inView && count === 0) {
      let start = 0
      const duration = 1000
      const stepTime = Math.max(Math.floor(duration / value), 10)
      const timer = setInterval(() => {
        start += 1
        setCount(start)
        if (start === value) clearInterval(timer)
      }, stepTime)
    }
  }, [inView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="group relative rounded-2xl py-8 px-6 transition-all duration-500 overflow-hidden cursor-pointer"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(224,242,254,0.3) 50%, rgba(186,230,253,0.2) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(125,211,252,0.3)",
        boxShadow:
          "0 25px 45px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(56,189,248,0.1)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: "linear-gradient(135deg, rgba(125,211,252,0.2) 0%, transparent 50%, rgba(56,189,248,0.1) 100%)",
        }}
      />

      <div
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-all duration-1000"
        style={{
          background: "linear-gradient(45deg, transparent 30%, rgba(125,211,252,0.4) 50%, transparent 70%)",
          transform: "translateX(-100%)",
          animation: "shine 2s ease-in-out infinite",
        }}
      />

      <div className="relative z-10">
        <Icon className="w-12 h-12 text-sky-600 group-hover:text-sky-700 mb-4 transition-colors duration-500 drop-shadow-lg" />
        <p className="text-4xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm">
          {count}+
        </p>
        <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 mt-2 transition-colors duration-500">
          {label}
        </p>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const [banners, setBanners] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const aboutY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"])

  useEffect(() => {
    fetch("http://localhost:5000/api/banners")
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter((b) => b.is_active)
        setBanners(active)
      })
      .catch((err) => console.error("Error loading banners:", err))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [banners])

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-slate-800 overflow-x-hidden"
      style={{
        background: "linear-gradient(135deg, #fef7ff 0%, #f0f9ff 25%, #ecfdf5 50%, #fef3c7 75%, #fef7ff 100%)",
        minHeight: "100vh",
      }}
    >
      <Navbar />

      {/* Hero Carousel with Parallax */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative max-w-8xl mt-[100px] h-[350px] hundred:h-[500px] onefifty:h-[350px] overflow-hidden rounded-3xl mx-4 md:mx-8"
      >
        <div
          className="absolute inset-0 z-10 rounded-3xl"
        ></div>
        {banners.map((banner, idx) => (
          <motion.div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out rounded-3xl overflow-hidden ${currentSlide === idx ? "opacity-100 z-5" : "opacity-0 z-0"}`}
            style={{
              transition: "transform 4s ease-in-out",
            }}
          >
            <img
              src={`http://localhost:5000${banner.image_url}`}
              alt={`Banner ${banner.id}`}
              className="w-full h-full object-cover rounded-3xl"
            />
          </motion.div>
        ))}

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 cursor-pointer h-3 rounded-full transition-all duration-300 ${
                currentSlide === i ? "scale-125 shadow-lg" : ""
              }`}
              style={{
                background:
                  currentSlide === i
                    ? "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(125,211,252,0.8) 100%)"
                    : "rgba(255,255,255,0.6)",
                backdropFilter: "blur(10px)",
                boxShadow: currentSlide === i ? "0 4px 15px rgba(56,189,248,0.4)" : "none",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* About Section with Parallax */}
      <motion.section style={{ y: aboutY }} className="py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative md:translate-x-60 mobile:ml-5"
          >
            <div
              className="absolute -inset-4 rounded-3xl transform rotate-3 w-96 mobile:w-92"
              style={{
                background: "linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(125,211,252,0.3) 100%)",
                backdropFilter: "blur(10px)",
              }}
            ></div>
            <div
              className="relative rounded-3xl w-84"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,249,255,0.6) 100%)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(125,211,252,0.3)",
                boxShadow: "0 25px 45px rgba(56,189,248,0.1)",
              }}
            >
              <img
                src="/cont.png"
                alt="Diwali Poster"
                className="w-84 h-96 object-cover rounded-2xl hover:scale-105 transition-all duration-700"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <motion.h2
                className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight drop-shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Fun With
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-500">
                  Crackers
                </span>
              </motion.h2>
            </div>

            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Fun With Crackers has been a well-known Fireworks Store in Sivakasi. What started out as a hobby has
                become our passion.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                We offer quality products, unparalleled service, and the most competitive prices in town.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
              >
                Trusted name among top companies in the Sivakasi fireworks business — manufacturing, wholesaling, and
                retailing traditional and modern fireworks.
              </motion.p>
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer text-white px-8 py-4 rounded-full font-semibold transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.9) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(125,211,252,0.3)",
                boxShadow: "0 10px 25px rgba(56,189,248,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(14,165,233,1) 0%, rgba(2,132,199,1) 100%)"
                e.currentTarget.style.boxShadow = "0 15px 35px rgba(56,189,248,0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.9) 100%)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(56,189,248,0.3)"
              }}
            >
              LEARN MORE
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Categories Section - Enhanced with Glossy Effect */}
      <section className="py-32 mobile:-translate-y-40 px-4 sm:px-6 max-w-7xl mx-auto relative">
        <div className="relative z-10 mobile:-tanslate-y-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-slate-800 via-sky-600 to-teal-500 bg-clip-text drop-shadow-sm">
              Our Categories
            </h2>
            <div
              className="w-24 h-1 mx-auto rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(56,189,248,0.8) 0%, rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8) 100%)",
                boxShadow: "0 4px 15px rgba(56,189,248,0.3)",
              }}
            ></div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(({ name, icon: Icon }, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -15,
                  scale: 1.02,
                  rotateY: 5,
                }}
                className="group relative rounded-3xl p-8 overflow-hidden cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(224,242,254,0.3) 50%, rgba(186,230,253,0.2) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(125,211,252,0.3)",
                  boxShadow:
                    "0 25px 45px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(56,189,248,0.1)",
                }}
              >
                {/* Glossy overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(125,211,252,0.3) 0%, transparent 50%, rgba(56,189,248,0.2) 100%)",
                  }}
                />

                {/* Shine effect */}
                <div
                  className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-all duration-1000"
                  style={{
                    background: "linear-gradient(45deg, transparent 30%, rgba(125,211,252,0.4) 50%, transparent 70%)",
                    transform: "translateX(-100%)",
                    animation: "shine 2s ease-in-out infinite",
                  }}
                />

                {/* Hover gradient background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.05) 0%, rgba(20,184,166,0.05) 100%)",
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: "linear-gradient(135deg, rgba(56,189,248,0.8) 0%, rgba(14,165,233,0.9) 100%)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(125,211,252,0.3)",
                      boxShadow: "0 10px 25px rgba(56,189,248,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    <Icon className="text-white w-8 h-8 transition-all duration-500 group-hover:text-sky-100 drop-shadow-lg" />
                  </div>

                  <h3 className="text-2xl font-bold text-center mb-4 text-slate-800 group-hover:text-slate-900 transition-colors duration-500 drop-shadow-sm">
                    {name}
                  </h3>

                  <p className="text-slate-600 group-hover:text-slate-700 text-center mb-6 transition-colors duration-500">
                    Get quality {name} from Fun With Crackers
                  </p>

                  <div className="text-center">
                    <button
                      className="px-6 py-3 cursor-pointer font-semibold rounded-full transition-all duration-500 group-hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(224,242,254,0.2) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "2px solid rgba(56,189,248,0.6)",
                        color: "#0f172a",
                        boxShadow: "0 10px 25px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.9) 100%)"
                        e.currentTarget.style.color = "white"
                        e.currentTarget.style.borderColor = "rgba(125,211,252,0.4)"
                        e.currentTarget.style.boxShadow =
                          "0 15px 35px rgba(56,189,248,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(224,242,254,0.2) 100%)"
                        e.currentTarget.style.color = "#0f172a"
                        e.currentTarget.style.borderColor = "rgba(56,189,248,0.6)"
                        e.currentTarget.style.boxShadow =
                          "0 10px 25px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.3)"
                      }}
                    >
                      EXPLORE
                    </button>
                  </div>
                </div>

                {/* Bottom highlight */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-60"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(125,211,252,0.6), transparent)",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us with Parallax Image */}
      <section className="py-32 mobile:-translate-y-80 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8"
          >
            <div>
              <motion.p
                className="text-sky-600 text-sm font-semibold uppercase tracking-wider mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                Why Choose Us
              </motion.p>
              <motion.h2
                className="text-5xl font-bold text-slate-800 mb-6 drop-shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Fun With Crackers
              </motion.h2>
              <motion.p
                className="text-xl text-slate-600 leading-relaxed mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                We are a leading online crackers shop in Sivakasi offering top quality directly from factories.
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                ["👨‍💼", "Customer Support"],
                ["🎁", "Good Packaging"],
                ["💸", "80% Discount"],
                ["✅", "Trust Worthy"],
              ].map(([icon, label], i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(240,249,255,0.4) 100%)",
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(125,211,252,0.3)",
                    boxShadow: "0 15px 35px rgba(56,189,248,0.1)",
                  }}
                >
                  <span className="text-3xl drop-shadow-sm">{icon}</span>
                  <p className="font-semibold text-slate-800">{label}</p>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer text-white px-8 py-4 rounded-full font-semibold transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.9) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(125,211,252,0.3)",
                boxShadow: "0 10px 25px rgba(56,189,248,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(14,165,233,1) 0%, rgba(2,132,199,1) 100%)"
                e.currentTarget.style.boxShadow = "0 15px 35px rgba(56,189,248,0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.9) 100%)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(56,189,248,0.3)"
              }}
            >
              LEARN MORE →
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div
              className="absolute -inset-4 rounded-3xl transform -rotate-3"
              style={{
                background: "linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(125,211,252,0.3) 100%)",
                backdropFilter: "blur(10px)",
              }}
            ></div>
            <motion.img
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ duration: 0.5 }}
              src="/cont2.png"
              alt="Why Choose Us"
              className="relative w-80 md:w-96 object-contain rounded-3xl hover:scale-105 transition-all duration-700"
              style={{
                filter: "drop-shadow(0 25px 45px rgba(56,189,248,0.2))",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Banner with Parallax */}
      <section className="relative py-32 mobile:-translate-y-70 px-4 sm:px-6 text-white overflow-hidden">
        <div
          className="absolute inset-0 rounded-3xl mx-4"
          style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(125,211,252,0.2)",
            boxShadow: "0 25px 45px rgba(15,23,42,0.3)",
          }}
        ></div>
        <motion.div
          className="absolute inset-0 opacity-20 rounded-3xl mx-4 overflow-hidden"
          style={{
            backgroundImage: "url('/fireworks-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg"
          >
            Order Your Crackers
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-300">
              & Gift Boxes Now
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl mb-8 text-sky-100 drop-shadow-sm  leading-relaxed p-5 md:p-0"
          >
            Order online and get the best discounts on all products.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer text-slate-800 px-12 py-4 rounded-full text-lg font-bold transition-all duration-300 uppercase tracking-wide"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(125,211,252,0.3)",
              boxShadow: "0 15px 35px rgba(56,189,248,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.9) 100%)"
              e.currentTarget.style.color = "white"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(56,189,248,0.4)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.9) 100%)"
              e.currentTarget.style.color = "#0f172a"
              e.currentTarget.style.boxShadow = "0 15px 35px rgba(56,189,248,0.3)"
            }}
          >
            PLACE YOUR ORDER
          </motion.button>
        </div>

        {/* Floating Elements */}
        <div
          className="absolute top-10 left-10 w-8 h-8 rounded-full opacity-75"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.8) 0%, rgba(245,158,11,0.6) 100%)",
            backdropFilter: "blur(10px)",
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            boxShadow: "0 10px 25px rgba(251,191,36,0.3)",
          }}
        ></div>
        <div
          className="absolute bottom-12 right-16 w-5 h-5 rounded-full opacity-60"
          style={{
            background: "linear-gradient(135deg, rgba(236,72,153,0.8) 0%, rgba(219,39,119,0.6) 100%)",
            backdropFilter: "blur(10px)",
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "0.5s",
            boxShadow: "0 8px 20px rgba(236,72,153,0.3)",
          }}
        ></div>
        <div
          className="absolute top-24 right-24 w-6 h-6 rounded-full opacity-70"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(124,58,237,0.6) 100%)",
            backdropFilter: "blur(10px)",
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            animationDelay: "1s",
            boxShadow: "0 8px 20px rgba(139,92,246,0.3)",
          }}
        ></div>
      </section>

      {/* Stats Section */}
      <section className="py-32 mobile:-translate-y-70 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-slate-800 mb-4 drop-shadow-sm">Our Achievements</h2>
            <div
              className="w-24 h-1 mx-auto rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(56,189,248,0.8) 0%, rgba(20,184,166,0.6) 50%, rgba(56,189,248,0.8) 100%)",
                boxShadow: "0 4px 15px rgba(56,189,248,0.3)",
              }}
            ></div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, i) => (
              <StatCard key={i} {...stat} delay={i * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-16 mobile:-translate-y-70 mobile:-mb-60 mb-10 relative">
        <div
          className="absolute inset-0 rounded-3xl mx-4"
          style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(125,211,252,0.2)",
            boxShadow: "0 25px 45px rgba(15,23,42,0.3)",
          }}
        />
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 text-white">
          {/* Our Profile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <h2 className="text-2xl font-bold mb-4 drop-shadow-sm">Our Profile</h2>
            <p className="text-sky-200 mb-2 font-semibold">Fun With Crackers</p>
            <p className="text-sky-100 mb-10 leading-relaxed p-5 md:p-0">
              Our products focus on our Customer's happiness. Crackers are available in different specifications as per
              the requirements of the clients.
            </p>
            <div className="flex justify-center md:justify-start">
              <a
                href="#"
                className="mt-2 cursor-pointer text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 inline-block"
                style={{
                  background: "linear-gradient(135deg, rgba(56,189,248,0.3) 0%, rgba(14,165,233,0.2) 100%)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(125,211,252,0.3)",
                  boxShadow: "0 10px 25px rgba(56,189,248,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.8) 100%)"
                  e.currentTarget.style.borderColor = "rgba(125,211,252,0.5)"
                  e.currentTarget.style.boxShadow = "0 15px 35px rgba(56,189,248,0.3)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(56,189,248,0.3) 0%, rgba(14,165,233,0.2) 100%)"
                  e.currentTarget.style.borderColor = "rgba(125,211,252,0.3)"
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(56,189,248,0.2)"
                }}
              >
                Read More →
              </a>
            </div>
          </motion.div>

          {/* Contact Us */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <h2 className="text-2xl font-bold mb-6 drop-shadow-sm">Contact Us</h2>
            <div className="space-y-4 text-sky-100">
              <div>
                <p className="font-semibold text-white mb-2">Address</p>
                <p>
                  Phoenix Crackers
                  <br />
                  Anil Kumar Eye Hospital Opp.
                  <br />
                  Sattur Road
                  <br />
                  Sivakasi
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Mobile</p>
                <p>
                  +91 63836 59214
                  <br />
                  +91 96554 56167
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Email</p>
                <p>nivasramasamy27@gmail.com</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <h2 className="text-2xl font-bold mb-6 drop-shadow-sm">Quick Links</h2>
            <ul className="space-y-3">
              {navLinks.map((link, index) => (
                <li key={link}>
                  <a
                    href={link === "Home" ? "/" : `/${link.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sky-200 hover:text-white transition-colors duration-300 font-medium"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Legal Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 max-w-5xl mx-auto text-sm text-sky-100 leading-relaxed relative z-10 text-center md:text-left"
        >
          <p className="mb-4 text-sky-100 leading-relaxed p-5 md:p-0">
            As per 2018 Supreme Court order, online sale of firecrackers are not permitted! We value our customers and
            at the same time, respect jurisdiction. We request you to add your products to the cart and submit the
            required crackers through the enquiry button. We will contact you within 24 hrs and confirm the order
            through WhatsApp or phone call. Please add and submit your enquiries and enjoy your Diwali with Fun With
            Crackers.
          </p>
          <p className="mb-4 text-sky-100 leading-relaxed p-5 md:p-0">
            Our License No. ----. Fun With Crackers as a company follows 100% legal & statutory compliances, and all our
            shops, go-downs are maintained as per the explosive acts. We send the parcels through registered and legal
            transport service providers as every other major company in Sivakasi is doing.
          </p>
        </motion.div>

        {/* Copyright */}
        <div className="mt-12 border-t border-sky-700 pt-8 text-center text-sm text-sky-300 relative z-10">
          <p>
            Copyright © 2023, <span className="text-white font-semibold">Fun With Crackers</span>. All rights reserved.
            Developed by <span className="text-white font-semibold">SPD</span>
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
