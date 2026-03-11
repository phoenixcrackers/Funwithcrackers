import { motion } from "framer-motion";

export default function Nav() {

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
          <span className="hidden sm:inline">Fun With Crackers</span>
          <span className="sm:hidden">Fun With Crackers</span>
        </motion.h1>
      </div>
    </nav>
  );
}