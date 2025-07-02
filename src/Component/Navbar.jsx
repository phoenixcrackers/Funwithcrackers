import { useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav
      className="fixed top-4 left-4 right-4 z-50 rounded-xl px-4 md:px-8 py-4 mx-auto max-w-8xl"
      style={{
        background: "linear-gradient(135deg, rgba(14,165,233,0.95) 0%, rgba(2,132,199,0.9) 100%)",
        backdropFilter: "blur(100px)",
        border: "1px solid rgba(125,211,252,0.3)",
        boxShadow: "0 8px 32px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white drop-shadow-sm"
        >
          <span className="hidden sm:inline">Fun With Firecrackers</span>
          <span className="sm:hidden">Fun With Crackers</span>
        </motion.h1>

        <div className="hidden md:flex gap-4 lg:gap-8 text-sm lg:text-md font-medium">
          <motion.a
            className="relative text-sky-100 hover:text-white transition-colors duration-300 group cursor-pointer drop-shadow-sm px-2 py-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            onClick={() => { navigate("/", { replace: true }); window.scrollTo(0, 0); }}
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 rounded-full"></span>
          </motion.a>

          <motion.a
            className="relative text-sky-100 hover:text-white transition-colors duration-300 group cursor-pointer drop-shadow-sm px-2 py-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => { navigate("/about-us", { replace: true }); window.scrollTo(0, 0); }}
          >
            About Us
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 rounded-full"></span>
          </motion.a>

          <motion.a
            className="relative text-sky-100 hover:text-white transition-colors duration-300 group cursor-pointer drop-shadow-sm px-2 py-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => { navigate("/price-list", { replace: true }); window.scrollTo(0, 0); }}
          >
            Price List
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 rounded-full"></span>
          </motion.a>

          <motion.a
            className="relative text-sky-100 hover:text-white transition-colors duration-300 group cursor-pointer drop-shadow-sm px-2 py-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => { navigate("/safety-tips", { replace: true }); window.scrollTo(0, 0); }}
          >
            Safety Tips
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 rounded-full"></span>
          </motion.a>

          <motion.a
            className="relative text-sky-100 hover:text-white transition-colors duration-300 group cursor-pointer drop-shadow-sm px-2 py-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => { navigate("/contact-us", { replace: true }); window.scrollTo(0, 0); }}
          >
            Contact Us
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 rounded-full"></span>
          </motion.a>
        </div>

        <button
          className="md:hidden p-2 rounded-lg transition-all duration-300 hover:bg-white/10"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 15px 35px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex flex-col space-y-2">
            <a
              className="block cursor-pointer text-sm font-medium text-sky-100 hover:text-white px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10 text-center"
              onClick={() => { navigate("/", { replace: true }); window.scrollTo(0, 0); setMenuOpen(false); }}
            >
              Home
            </a>

            <a
              className="block cursor-pointer text-sm font-medium text-sky-100 hover:text-white px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10 text-center"
              onClick={() => { navigate("/about-us", { replace: true }); window.scrollTo(0, 0); setMenuOpen(false); }}
            >
              About Us
            </a>

            <a
              className="block cursor-pointer text-sm font-medium text-sky-100 hover:text-white px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10 text-center"
              onClick={() => { navigate("/price-list", { replace: true }); window.scrollTo(0, 0); setMenuOpen(false); }}
            >
              Price List
            </a>

            <a
              className="block cursor-pointer text-sm font-medium text-sky-100 hover:text-white px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10 text-center"
              onClick={() => { navigate("/safety-tips", { replace: true }); window.scrollTo(0, 0); setMenuOpen(false); }}
            >
              Safety Tips
            </a>

            <a
              className="block cursor-pointer text-sm font-medium text-sky-100 hover:text-white px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10 text-center"
              onClick={() => { navigate("/contact-us", { replace: true }); window.scrollTo(0, 0); setMenuOpen(false); }}
            >
              Contact Us
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}