import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../Component/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const cardStyles = {
  card: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(224,242,254,0.3) 50%, rgba(186,230,253,0.2) 100%)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(125,211,252,0.3)",
    boxShadow: "0 25px 45px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(56,189,248,0.1)"
  },
  hoverOverlay: {
    background: "linear-gradient(135deg, rgba(125,211,252,0.2) 0%, transparent 50%, rgba(56,189,248,0.1) 100%)"
  },
  shineEffect: {
    background: "linear-gradient(45deg, transparent 30%, rgba(125,211,252,0.4) 50%, transparent 70%)",
    transform: "translateX(-100%)",
    animation: "shine 2s ease-in-out infinite"
  }
};

export default function About() {
  const [blasts, setBlasts] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBlasts = Array.from({ length: 6 }).map(() => ({
        id: Date.now() + Math.random(),
        top: Math.random() * 60 + 10,
        left: Math.random() * 90,
        color: ['#facc15', '#ec4899', '#3b82f6', '#22c55e', '#ef4444', '#a855f7'][Math.floor(Math.random() * 6)],
      }));
      setBlasts((prev) => [...prev, ...newBlasts]);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 flex flex-col bg-gradient-to-br from-white via-sky-50 to-white"
      style={{
          background: "linear-gradient(135deg, #fef7ff 0%, #f0f9ff 20%, #ecfdf5 40%, #fef3c7 60%, #fef7ff 100%)",
      }}
    >
      <Navbar />
      <div className="flex-grow">
        <div className="w-full h-64 md:h-80 lg:h-96 mt-[100px] overflow-hidden rounded-3xl mx-auto px-4 md:px-8">
          <img src="/aboutbanner.png" alt="About banner" className="w-full h-full object-cover rounded-3xl" />
        </div>

        <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 1.2 }}
            className="relative w-full h-96 rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 -z-10">
              {['rocket1', 'rocket2', 'rocket3'].map((rocket, i) => (
                <div
                  key={rocket}
                  className={`absolute w-6 h-16 bg-gradient-to-t from-pink-400 to-purple-600 rounded-t-full animate-${rocket}`}
                  style={{ left: `${i * 60 + 20}px`, bottom: `${i * 20 + 10}px` }}
                />
              ))}
            </div>
            <img src="/aboutimage.jpg" alt="About Us" className="w-full h-full object-cover rounded-3xl shadow-2xl" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 1 }}
            className="space-y-6 text-slate-700"
          >
            <h2 className="text-4xl font-bold text-slate-900">About Us</h2>
            <h3 className="text-2xl font-semibold text-sky-600">Fun With Crackers</h3>
            <p>Fun With Crackers is a premium supplier of fancy fireworks. From traditional celebrations to modern extravaganzas, our products bring sparkle to every moment.</p>
            <p>Our trusted brands—French Terry, Vinayaga, Sony, and Century—symbolize quality, innovation, and dazzling fun.</p>
            <p>With a strong presence across Tamil Nadu and South India, we proudly serve individual customers and event organizers with customized service and unmatched value.</p>
          </motion.div>
        </section>

        <section className="py-24 overflow-hidden rounded-3xl mx-4" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)", backdropFilter: "blur(20px)", border: "1px solid rgba(125,211,252,0.2)", boxShadow: "0 25px 45px rgba(15,23,42,0.3)" }}>
          <div className="absolute inset-0 z-0 pointer-events-none">
            {blasts.map((blast) => (
              <div
                key={blast.id}
                className="absolute w-4 h-4 rounded-full animate-blast"
                style={{ top: `${blast.top}%`, left: `${blast.left}%`, backgroundColor: blast.color }}
              />
            ))}
          </div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative z-10 max-w-4xl mx-auto text-center px-6 text-white"
          >
            <h2 className="text-4xl font-bold mb-4 text-yellow-400 drop-shadow-lg">🎆 Exclusive Cracker Outlets With Discounts!</h2>
            <p className="text-lg mb-4">Celebrate Diwali with <span className="font-semibold text-yellow-300">Fun With Crackers</span>. Your one-stop shop for elite fireworks and festive delights.</p>
            <p className="text-lg mb-6">Explore rockets, gift boxes, skyshots, sparklers, and more—with simple online ordering and doorstep delivery.</p>
            <a href="tel:+916383659214" className="text-sky-200 text-xl font-semibold hover:underline block">📞 +91 63836 59214</a>
            <a href="tel:+919655456167" className="text-sky-200 text-xl font-semibold hover:underline block mt-2">📞 +91 96554 56167</a>
          </motion.div>
        </section>

        <section className="py-32 px-4 md:px-8 relative">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Motto",
                  content: "Our motto is SAFETY FIRST. Fun With Crackers Industry adopted several stringent quality testing measures as well as norms defined by the fireworks industry.",
                },
                {
                  title: "Vision",
                  content: "The company's presence is also established amongst retailers which makes our product accessible to all parts of India. Our products have carved a niche for their quality, thanks to strict control measures.",
                },
                {
                  title: "Mission",
                  content: "We respect consumer's benefit, safety, good quality, beautiful packing, effective service, and reasonable price. Our products are market-oriented and meet high-quality standards.",
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative rounded-2xl py-8 px-6 transition-all duration-500 overflow-hidden cursor-pointer text-center"
                  style={cardStyles.card}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={cardStyles.hoverOverlay} />
                  <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-all duration-1000" style={cardStyles.shineEffect} />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-sky-600 group-hover:text-sky-700 mb-4 transition-colors duration-500 drop-shadow-sm">{card.title}</h3>
                    <p className="text-base text-slate-600 group-hover:text-slate-700 leading-relaxed transition-colors duration-500">{card.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
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
        <div className="mt-12 border-t border-sky-700 pt-6 text-center text-sm text-sky-300">
          © 2023 <span className="text-white font-semibold">Fun With Crackers</span>. Developed by{' '}
          <span className="text-white font-semibold">SPD</span>.
        </div>
      </footer>
        <style>
          {`
            @keyframes rocket1 {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-200px) rotate(20deg); opacity: 0; }
            }
            @keyframes rocket2 {
              0% { transform: translateY(0) rotate(-10deg); opacity: 1; }
              100% { transform: translateY(-220px) rotate(30deg); opacity: 0; }
            }
            @keyframes rocket3 {
              0% { transform: translateY(0) rotate(15deg); opacity: 1; }
              100% { transform: translateY(-180px) rotate(-20deg); opacity: 0; }
            }
            .animate-rocket1 { animation: rocket1 3s linear infinite; }
            .animate-rocket2 { animation: rocket2 4s ease-in-out infinite; }
            .animate-rocket3 { animation: rocket3 3.5s ease-in-out infinite; }

            @keyframes blast {
              0% { transform: scale(0.5); opacity: 1; }
              40% { transform: scale(1.5); opacity: 0.8; }
              100% { transform: scale(2.5); opacity: 0; }
            }
            .animate-blast {
              animation: blast 1.4s ease-out forwards;
            }
          `}
        </style>
      </div>
    );
  }
