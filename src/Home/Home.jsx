import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Rocket,
  Volume2,
  Bomb,
  Disc,
  CloudSun,
  Menu,
  Heart,
  SmilePlus,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../App.css';
import { useInView } from 'react-intersection-observer';

// Nav Links and Categories
const navLinks = ['Home', 'About Us', 'Price List', 'Safety Tips', 'Contact Us'];
const categories = [
  { name: 'Sparklers', icon: Sparkles },
  { name: 'Rockets', icon: Rocket },
  { name: 'Single Sound Crackers', icon: Volume2 },
  { name: 'Atom Bombs', icon: Bomb },
  { name: 'Ground Chakkars', icon: Disc },
  { name: 'Sky Shots', icon: CloudSun },
];

// Stats Data
const statsData = [
  { label: 'Customer Satisfaction', value: 100, icon: Heart },
  { label: 'Products', value: 200, icon: Sparkles },
  { label: 'Happy Clients', value: 500, icon: SmilePlus },
  { label: 'Days Of Crackers', value: 365, icon: Clock },
];

// Reusable StatCard component
function StatCard({ icon: Icon, value, label, delay }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true });

  useEffect(() => {
    if (inView && count === 0) {
      let start = 0;
      const duration = 1000;
      const stepTime = Math.max(Math.floor(duration / value), 10);
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === value) clearInterval(timer);
      }, stepTime);
    }
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center bg-white rounded-xl py-6 px-4 transition duration-300 hover:shadow-xl"
    >
      <Icon className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-3xl font-bold text-gray-900">{count}+</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
    </motion.div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(prev => (prev === 3 ? 1 : prev + 1)), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-white via-amber-50 to-pink-50 text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 md:px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">Fun With Firecrackers</h1>
          <div className="hidden md:flex gap-4 text-sm font-medium">
            {navLinks.map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`} className="hover:text-amber-600 transition">{link}</a>
            ))}
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="h-6 w-6 text-gray-900" />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden mt-2 bg-white shadow rounded-lg p-4">
            {navLinks.map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                className="block text-sm font-medium text-gray-700 hover:text-amber-600 mb-2"
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Carousel */}
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] overflow-hidden">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${currentSlide === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img src={`/ban${i}.webp`} alt={`Banner ${i}`} className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {[1, 2, 3].map(i => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === i ? 'bg-amber-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>

      {/* About Section */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} viewport={{ once: true }}>
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-6 h-80 sm:h-96 flex justify-center items-center">
              <img src="/cont.png" alt="Diwali Poster" className="w-full h-full object-contain rounded-2xl" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="space-y-6">
            <h2 className="text-4xl font-playfair font-extrabold text-gray-900">Fun With Crackers</h2>
            <p className="text-lg text-gray-700">Fun With Crackers has been a well-known Fireworks Store in Sivakasi. What started out as a hobby has become our passion.</p>
            <p className="text-lg text-gray-700">We offer quality products, unparalleled service, and the most competitive prices in town.</p>
            <p className="text-lg text-gray-700">Trusted name among top companies in the Sivakasi fireworks business — manufacturing, wholesaling, and retailing traditional and modern fireworks.</p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Our Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map(({ name, icon: Icon }, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black mb-4 mx-auto">
                <Icon className="text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-center">{name}</h3>
              <p className="text-sm text-gray-600 mt-2 text-center">Get quality {name} from Fun With Crackers</p>
              <div className="mt-4 text-center">
                <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition">Read More</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} viewport={{ once: true }} className="flex-1 space-y-4">
            <h3 className="text-red-600 text-sm sm:text-base font-semibold uppercase tracking-wider">Why Choose Us</h3>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Fun With Crackers</h2>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">We are a leading online crackers shop in Sivakasi offering top quality directly from factories.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[['👨‍💼', 'Customer Support'], ['🎁', 'Good Packaging'], ['💸', '80% Discount'], ['✅', 'Trust Worthy']].map(([icon, label], i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-red-600 text-xl">{icon}</span>
                  <p className="font-medium text-gray-800 text-sm sm:text-base">{label}</p>
                </div>
              ))}
            </div>
            <a href="#benefits" className="inline-block mt-4 text-red-600 font-medium hover:underline">Learn more about our benefit →</a>
          </motion.div>
          <motion.img
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            src="/cont2.png"
            alt="Why Choose Us"
            className="w-64 sm:w-72 md:w-96 object-contain rounded-3xl shadow-2xl"
          />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative bg-cover bg-center bg-no-repeat py-20 px-4 sm:px-6 text-white" style={{ backgroundImage: "url('/fireworks-bg.jpg')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 drop-shadow-lg">🎆 Order Your Crackers & Gift Boxes Now 🎇</h2>
          <p className="text-lg mb-2 drop-shadow-md">Order online and get the best discounts on all products.</p>
          <p className="text-base mb-6 italic opacity-90">Hurry, don't miss out!</p>
          <button className="bg-red-600 hover:bg-red-700 transition px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold shadow-lg uppercase tracking-wide">PLACE YOUR ORDER</button>
        </div>
        <div className="absolute top-10 left-10 w-8 h-8 animate-ping bg-yellow-400 rounded-full opacity-75"></div>
        <div className="absolute bottom-12 right-16 w-5 h-5 animate-ping bg-pink-500 rounded-full opacity-60"></div>
        <div className="absolute top-24 right-24 w-6 h-6 animate-ping bg-purple-400 rounded-full opacity-70"></div>
      </section>

      {/* Stats Section */}
      <section className="bg-rose-50 py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, i) => (
              <StatCard key={i} {...stat} delay={i * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer (unchanged from your code) */}
            {/* Footer */}
   <footer className="bg-black text-white px-4 sm:px-6 py-12">
  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
    
    {/* Our Profile */}
    <div>
      <h2 className="text-xl font-bold mb-2">Our Profile</h2>
      <p className="text-sm text-gray-400 mb-2">Fun With Crackers</p>
      <p className="text-sm text-gray-400 mb-4">
        Our products focus on our Customer's happiness. Crackers are available in different specifications as per the requirements of the clients.
      </p>
      <a href="#" className="text-red-400 text-sm hover:underline">Read More . .</a>
    </div>

    {/* Contact Us */}
    <div>
      <h2 className="text-xl font-bold mb-4">Contact Us</h2>
      <p className="text-sm text-gray-400"><strong>Address</strong><br />
        Phoenix Crackers<br />
        Anil Kumar Eye Hospital Opp.<br />
        Sattur Road<br />
        Sivakasi</p>
      <p className="mt-4 text-sm text-gray-400"><strong>Mobile</strong><br />
        +91 63836 59214<br />
        +91 96554 56167</p>
      <p className="mt-4 text-sm text-gray-400"><strong>Email</strong><br />
        nivasramasamy27@gmail.com</p>
    </div>

    {/* Quick Links */}
    <div>
      <h2 className="text-xl font-bold mb-4">Quick Links</h2>
      <ul className="space-y-2 text-sm text-gray-400">
        <li><a href="#home" className="hover:text-white transition">Home</a></li>
        <li><a href="#about-us" className="hover:text-white transition">About Us</a></li>
        <li><a href="#price-list" className="hover:text-white transition">Our Pricelist</a></li>
        <li><a href="#safety-tips" className="hover:text-white transition">Safetytips</a></li>
        <li><a href="#contact-us" className="hover:text-white transition">Contact Us</a></li>
      </ul>
    </div>
  </div>

  {/* Legal Disclaimer */}
  <div className="mt-12 max-w-5xl mx-auto text-sm text-gray-400 text-justify">
    <p className="mb-4">
      As per 2018 Supreme Court order, online sale of firecrackers are not permitted! We value our customers and at the same time, respect jurisdiction.
      We request you to add your products to the cart and submit the required crackers through the enquiry button. We will contact you within 24 hrs and confirm
      the order through WhatsApp or phone call. Please add and submit your enquiries and enjoy your Diwali with Fun With Crackers.
    </p>
    <p className="mb-4">
      Our License No. ----. Fun With Crackers as a company follows 100% legal & statutory compliances, and all our shops, go-downs are maintained as per the explosive acts.
      We send the parcels through registered and legal transport service providers as every other major company in Sivakasi is doing.
    </p>
  </div>

  {/* Copyright */}
  <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
    Copyright © 2023, <span className="text-white">Fun With Crackers</span>. All rights reserved. Developed by <span className="text-red-400">SPD</span>
  </div>
</footer>
    </div>
  );
}
