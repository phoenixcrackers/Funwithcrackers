import { motion } from "framer-motion"
import { Shield, AlertTriangle, CheckCircle, XCircle, Flame, Droplets, Eye, Users } from "lucide-react"
import Navbar from "../Component/Navbar"
import "../App.css"

const dosData = [
  {
    icon: CheckCircle,
    title: "Follow Instructions",
    description: "Display fireworks as per the instructions mentioned on the pack.",
  },
  {
    icon: Shield,
    title: "Branded Fireworks",
    description: "Buy fireworks from authorized / reputed manufacturers only.",
  },
  {
    icon: Eye,
    title: "Outdoor Use",
    description: "Use fireworks only outdoor in open spaces.",
  },
  {
    icon: Users,
    title: "Safe Distance",
    description: "Light only one firework at a time, by one person. Others should watch from a safe distance.",
  },
  {
    icon: Droplets,
    title: "Keep Water Ready",
    description: "Keep two buckets of water handy. In the event of fire or any mishap.",
  },
]

const dontsData = [
  {
    icon: XCircle,
    title: "Don't Make Tricks",
    description: "Never make your own fireworks.",
  },
  {
    icon: Flame,
    title: "Don't Relight",
    description: "Never try to re-light or pick up fireworks that have not ignited fully.",
  },
  {
    icon: AlertTriangle,
    title: "Don't Wear Loose Clothes",
    description: "Do not wear loose clothing while using fireworks.",
  },
  {
    icon: XCircle,
    title: "Don't Touch Leftovers",
    description: "After fireworks display never pick up fireworks that may be left over, they still may be active.",
  },
  {
    icon: Shield,
    title: "Don't Carry in Pockets",
    description: "Never carry fireworks in your pockets or bags.",
  },
]

const BigFireworkAnimation = ({ delay = 0, startPosition, endPosition, burstPosition, color }) => {
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080

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
          const distance = screenWidth * 0.4 // Much larger distance
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
          const distance = screenWidth * 0.25
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
          const distance = screenWidth * 0.35
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

export default function Safety() {
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1920
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 1080

  const fireworkConfigs = [
    {
      delay: 0,
      startPosition: { x: -50, y: 50 }, // Top left
      endPosition: { x: screenWidth * 0.3, y: screenHeight * 0.3 },
      burstPosition: { x: screenWidth * 0.3, y: screenHeight * 0.3 },
      color: { primary: "#ff6b6b", secondary: "#ff8e8e", tertiary: "#ffb3b3" },
    },
    {
      delay: 2,
      startPosition: { x: screenWidth + 50, y: 50 }, // Top right
      endPosition: { x: screenWidth * 0.7, y: screenHeight * 0.3 },
      burstPosition: { x: screenWidth * 0.7, y: screenHeight * 0.3 },
      color: { primary: "#4ecdc4", secondary: "#7dd3db", tertiary: "#a8e6cf" },
    },
    {
      delay: 4,
      startPosition: { x: -50, y: screenHeight + 50 }, // Bottom left
      endPosition: { x: screenWidth * 0.25, y: screenHeight * 0.6 },
      burstPosition: { x: screenWidth * 0.25, y: screenHeight * 0.6 },
      color: { primary: "#ffd93d", secondary: "#ffe066", tertiary: "#ffe999" },
    },
    {
      delay: 6,
      startPosition: { x: screenWidth + 50, y: screenHeight + 50 }, // Bottom right
      endPosition: { x: screenWidth * 0.75, y: screenHeight * 0.6 },
      burstPosition: { x: screenWidth * 0.75, y: screenHeight * 0.6 },
      color: { primary: "#a8e6cf", secondary: "#c8f7c5", tertiary: "#e8f8f5" },
    },
    {
      delay: 8,
      startPosition: { x: screenWidth * 0.5, y: -50 }, // Top center
      endPosition: { x: screenWidth * 0.5, y: screenHeight * 0.4 },
      burstPosition: { x: screenWidth * 0.5, y: screenHeight * 0.4 },
      color: { primary: "#ff9ff3", secondary: "#ffb3f7", tertiary: "#ffc6fb" },
    },
  ]

  return (
    <div
      className="min-h-screen text-slate-800 overflow-x-hidden relative"
    >
      {/* Background Fireworks Animation */}
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

      {/* All content with higher z-index */}
      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-12"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 bg-gradient-to-r from-slate-800 via-sky-600 to-teal-500 bg-clip-text drop-shadow-sm">
                Safety Tips
              </h1>
              <p className="text-4xl mt-20 font-bold text-slate-800 bg-gradient-to-r from-slate-800 via-sky-600 to-teal-500 bg-clip-text drop-shadow-sm">
                Fun With Crackers
              </p>
              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
                There are certain Do's & Don'ts to follow while purchasing, bursting and storing crackers. A little
                negligence, ignorance and carelessness can cause a fatal injury.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Do's Section */}
        <section className="py-20 px-4 sm:px-6 relative -mt-30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-4 mobile:flex-col mobile:gap-2">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  Do's
                </span>
              </h2>
              <div
                className="w-24 h-1 mx-auto rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(34,197,94,0.8) 0%, rgba(16,185,129,0.6) 50%, rgba(34,197,94,0.8) 100%)",
                  boxShadow: "0 4px 15px rgba(34,197,94,0.3)",
                }}
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mobile:gap-6">
              {dosData.map(({ icon: Icon, title, description }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative rounded-3xl p-8 mobile:p-6 overflow-hidden cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.05) 50%, rgba(34,197,94,0.1) 100%)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    boxShadow: "0 25px 45px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  <div className="relative z-10">
                    <div
                      className="flex items-center justify-center w-16 h-16 mobile:w-14 mobile:h-14 rounded-full mb-6 mobile:mb-4 mx-auto transition-all duration-500 group-hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, rgba(34,197,94,0.8) 0%, rgba(16,185,129,0.9) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        boxShadow: "0 10px 25px rgba(34,197,94,0.2)",
                      }}
                    >
                      <Icon className="text-white w-8 h-8 mobile:w-6 mobile:h-6 drop-shadow-lg" />
                    </div>

                    <h3 className="text-xl mobile:text-lg font-bold text-center mb-4 mobile:mb-3 text-slate-800 drop-shadow-sm">
                      {title}
                    </h3>

                    <p className="text-slate-600 text-center leading-relaxed mobile:text-sm">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Don'ts Section */}
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-4 mobile:flex-col mobile:gap-2">
                <XCircle className="w-12 h-12 text-red-600" />
                <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Don'ts</span>
              </h2>
              <div
                className="w-24 h-1 mx-auto rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(239,68,68,0.8) 0%, rgba(244,63,94,0.6) 50%, rgba(239,68,68,0.8) 100%)",
                  boxShadow: "0 4px 15px rgba(239,68,68,0.3)",
                }}
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mobile:gap-6">
              {dontsData.map(({ icon: Icon, title, description }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative rounded-3xl p-8 mobile:p-6 overflow-hidden cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(244,63,94,0.05) 50%, rgba(239,68,68,0.1) 100%)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    boxShadow: "0 25px 45px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  <div className="relative z-10">
                    <div
                      className="flex items-center justify-center w-16 h-16 mobile:w-14 mobile:h-14 rounded-full mb-6 mobile:mb-4 mx-auto transition-all duration-500 group-hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(244,63,94,0.9) 100%)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        boxShadow: "0 10px 25px rgba(239,68,68,0.2)",
                      }}
                    >
                      <Icon className="text-white w-8 h-8 mobile:w-6 mobile:h-6 drop-shadow-lg" />
                    </div>

                    <h3 className="text-xl mobile:text-lg font-bold text-center mb-4 mobile:mb-3 text-slate-800 drop-shadow-sm">
                      {title}
                    </h3>

                    <p className="text-slate-600 text-center leading-relaxed mobile:text-sm">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Warning Banner */}
        <section className="py-16 px-4 sm:px-6 relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative rounded-3xl p-8 mobile:p-6 text-center overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 50%, rgba(251,191,36,0.1) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(251,191,36,0.3)",
                boxShadow: "0 25px 45px rgba(251,191,36,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <AlertTriangle className="w-16 h-16 mobile:w-12 mobile:h-12 text-amber-600 mx-auto mb-6 mobile:mb-4" />
              <h3 className="text-2xl mobile:text-xl font-bold text-slate-800 mb-4 mobile:mb-3">
                Important Safety Reminder
              </h3>
              <p className="text-lg mobile:text-base text-slate-600 leading-relaxed">
                A little negligence, ignorance and carelessness can cause a fatal injury. Always prioritize safety over
                celebration. Follow these guidelines to ensure a safe and enjoyable fireworks experience for everyone.
              </p>
            </motion.div>
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
