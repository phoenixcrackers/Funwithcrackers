import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Navbar from "../Component/Navbar"
import { MapPin, Phone, Mail, Globe } from "lucide-react"

const BigFireworkAnimation = ({ delay = 0, startPosition, endPosition, burstPosition, color }) => {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-6 h-6 rounded-full"
        style={{
          left: startPosition.x,
          top: startPosition.y,
          background: `linear-gradient(180deg, ${color.primary} 0%, ${color.secondary} 50%, ${color.tertiary} 100%)`,
          boxShadow: `0 0 15px ${color.primary}`,
          transform: "rotate(45deg)",
        }}
        animate={{
          x: [0, endPosition.x - startPosition.x],
          y: [0, endPosition.y - startPosition.y],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 2.5,
          delay: delay,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 8,
          ease: "easeOut",
        }}
      />

      <motion.div
        className="absolute"
        style={{
          left: burstPosition.x,
          top: burstPosition.y,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.8, 0] }}
        transition={{
          duration: 4,
          delay: delay + 2.5,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 8,
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = i * 15 * (Math.PI / 180)
          const distance = dimensions.width * 0.4
          const x = Math.cos(angle) * distance
          const y = Math.sin(angle) * distance

          return (
            <motion.div
              key={`main-${i}`}
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: `hsl(${(i * 15 + Math.random() * 60) % 360}, 80%, 65%)`,
                boxShadow: `0 0 20px hsl(${(i * 15 + Math.random() * 60) % 360}, 80%, 65%)`,
              }}
              animate={{
                x: [0, x * 0.3, x * 0.7, x],
                y: [0, y * 0.3, y * 0.7, y],
                opacity: [1, 0.8, 0.4, 0],
                scale: [1, 1.2, 0.8, 0],
              }}
              transition={{
                duration: 4,
                delay: delay + 2.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 8,
                ease: "easeOut",
              }}
            />
          )
        })}

        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10 * (Math.PI / 180)
          const distance = dimensions.width * 0.25
          const x = Math.cos(angle) * distance
          const y = Math.sin(angle) * distance

          return (
            <motion.div
              key={`secondary-${i}`}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: `hsl(${(i * 10 + Math.random() * 40) % 360}, 70%, 60%)`,
                boxShadow: `0 0 12px hsl(${(i * 10 + Math.random() * 40) % 360}, 70%, 60%)`,
              }}
              animate={{
                x: [0, x * 0.4, x * 0.8, x],
                y: [0, y * 0.4, y * 0.8, y],
                opacity: [1, 0.7, 0.3, 0],
                scale: [1, 1.1, 0.6, 0],
              }}
              transition={{
                duration: 3.5,
                delay: delay + 2.7,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 8,
                ease: "easeOut",
              }}
            />
          )
        })}

        {Array.from({ length: 48 }).map((_, i) => {
          const angle = i * 7.5 * (Math.PI / 180)
          const distance = dimensions.width * 0.35
          const x = Math.cos(angle) * distance
          const y = Math.sin(angle) * distance

          return (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: "#ffffff",
                boxShadow: "0 0 8px #ffffff",
              }}
              animate={{
                x: [0, x * 0.2, x * 0.6, x * 1.2],
                y: [0, y * 0.2, y * 0.6, y * 1.2],
                opacity: [1, 0.8, 0.4, 0],
                scale: [1, 0.8, 0.4, 0],
              }}
              transition={{
                duration: 3,
                delay: delay + 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 8,
                ease: "easeOut",
              }}
            />
          )
        })}

        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color.primary}aa 0%, ${color.secondary}66 30%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [0, 3, 1.5, 0],
            opacity: [0, 1, 0.3, 0],
          }}
          transition={{
            duration: 2,
            delay: delay + 2.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 8,
            ease: "easeOut",
          }}
        />
      </motion.div>
    </div>
  )
}

export default function Contact() {
  const [screenDimensions, setScreenDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const contactCards = [
    {
      icon: MapPin,
      title: "Our Shop Location",
      content: ["Phoenix Crackers", "Anil Kumar Eye Hospital Opp.", "Sattur Road", "Sivakasi"],
    },
    {
      icon: Phone,
      title: "Mobile Number",
      content: [
        { text: "+91 63836 59214", href: "tel:+916383659214" },
        { text: "+91 63836 59214", href: "tel:+916383659214" },
        { text: "+91 63836 59214", href: "tel:+916383659214" },
      ],
    },
    {
      icon: Mail,
      title: "Email Address",
      content: [{ text: "nivasramasamy27@gmail.com", href: "mailto:nivasramasamy27@gmail.com" }],
    },
  ]

  const fireworkConfigs = [
    {
      delay: 0,
      startPosition: { x: -50, y: 50 },
      endPosition: { x: screenDimensions.width * 0.3, y: screenDimensions.height * 0.3 },
      burstPosition: { x: screenDimensions.width * 0.3, y: screenDimensions.height * 0.3 },
      color: { primary: "#ff6b6b", secondary: "#ff8e8e", tertiary: "#ffb3b3" },
    },
    {
      delay: 2,
      startPosition: { x: screenDimensions.width + 50, y: 50 },
      endPosition: { x: screenDimensions.width * 0.7, y: screenDimensions.height * 0.3 },
      burstPosition: { x: screenDimensions.width * 0.7, y: screenDimensions.height * 0.3 },
      color: { primary: "#4ecdc4", secondary: "#7dd3db", tertiary: "#a8e6cf" },
    },
    {
      delay: 4,
      startPosition: { x: -50, y: screenDimensions.height + 50 },
      endPosition: { x: screenDimensions.width * 0.25, y: screenDimensions.height * 0.6 },
      burstPosition: { x: screenDimensions.width * 0.25, y: screenDimensions.height * 0.6 },
      color: { primary: "#ffd93d", secondary: "#ffe066", tertiary: "#ffe999" },
    },
    {
      delay: 6,
      startPosition: { x: screenDimensions.width + 50, y: screenDimensions.height + 50 },
      endPosition: { x: screenDimensions.width * 0.75, y: screenDimensions.height * 0.6 },
      burstPosition: { x: screenDimensions.width * 0.75, y: screenDimensions.height * 0.6 },
      color: { primary: "#a8e6cf", secondary: "#c8f7c5", tertiary: "#e8f8f5" },
    },
    {
      delay: 8,
      startPosition: { x: screenDimensions.width * 0.5, y: -50 },
      endPosition: { x: screenDimensions.width * 0.5, y: screenDimensions.height * 0.4 },
      burstPosition: { x: screenDimensions.width * 0.5, y: screenDimensions.height * 0.4 },
      color: { primary: "#ff9ff3", secondary: "#ffb3f7", tertiary: "#ffc6fb" },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100">
      <div className="fixed inset-0 pointer-events-none z-0">
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

      <div className="relative z-10">
        <Navbar />

        <section className="max-w-7xl mx-auto py-30 px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-sky-600 bg-clip-text text-transparent mb-4">
              Contact Us
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Get in touch with us for all your fireworks needs. We're here to make your celebrations memorable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {contactCards.map((card, index) => (
              <div key={index} className="relative group">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="relative pt-8 p-8 bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-sky-100/20 rounded-3xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 via-blue-500/5 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">{card.title}</h2>
                    <div className="space-y-2">
                      {card.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          {typeof item === "string" ? (
                            <p className="text-gray-700 text-center text-sm leading-relaxed">{item}</p>
                          ) : (
                            <a
                              href={item.href}
                              className="block text-sky-600 hover:text-sky-800 text-center text-sm transition-colors duration-200 hover:underline"
                            >
                              {item.text}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative group">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="relative pt-8 p-8 bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-emerald-100/20 rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-500/5 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Find Us on Map</h2>
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3936.0487539047143!2d77.79800291478508!3d9.453334793222115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06cf8c8c8c8c8c%3A0x8c8c8c8c8c8c8c8c!2sPhoenix%20Crackers%2C%20Anil%20Kumar%20Eye%20Hospital%20Opp.%2C%20Sattur%20Road%2C%20Sivakasi%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1703123456789!5m2!1sen!2sin"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            </div>
          </div>
        </section>

        <footer className="bg-slate-900 text-white py-16 mt-20 px-6 rounded-3xl inset-0 mx-4 mb-10"
          style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(125,211,252,0.2)",
                boxShadow: "0 25px 45px rgba(15,23,42,0.3)",
              }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 hundred:ml-[15%] mobile:text-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Profile</h2>
              <p className="text-sky-200 font-semibold">Fun With Crackers</p>
              <p className="text-sky-100 mt-2">
                Spark joy, spread light—fireworks crafted for your celebration.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-sky-100">Phoenix Crackers</p>
              <p className="text-sky-100 mt-2">
                Anil Kumar Eye Hospital Opp.,<br />Sattur Road, Sivakasi
              </p>
              <a href="tel:+916383659214" className="text-sky-100 hover:underline block mt-2">+91 63836 59214</a>
              <a href="tel:+919655456167" className="text-sky-100 hover:underline block mt-1">+91 96554 56167</a>
              <p className="text-sky-100 mt-2">nivasramasamy27@gmail.com</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
              <ul className="space-y-2">
                {['Home', 'About Us', 'Price List', 'Safety Tips', 'Contact Us'].map((link) => (
                  <li key={link}>
                    <a
                      href={link === 'Home' ? '/' : `/${link.toLowerCase().replace(/ /g, '-')}`}
                      className="text-sky-200 hover:text-white transition"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-sky-700 pt-6 text-center text-sm text-sky-300 cursor-pointer">
            © 2025 <span className="text-white font-semibold">Fun With Crackers</span>.<span className="text-white font-semibold">Developed by{' '}</span>
            SPD Solutions.
          </div>
        </footer>
      </div>
    </div>
  )
}
