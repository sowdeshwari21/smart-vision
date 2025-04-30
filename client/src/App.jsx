import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Converter from "./Pages/Converter"
import "./App.css"

function App() {
  return (
    <Router>
      <motion.div
        className="min-h-screen relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="fixed inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 100% 100%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Converter />} />
              <Route path="/converter" element={<Converter />} />
              <Route
                path="/about"
                element={
                  <motion.div
                    className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-4xl font-bold mb-4">About Page Coming Soon</h1>
                      <p className="text-gray-300">We're working on something amazing!</p>
                    </motion.div>
                  </motion.div>
                }
              />
              <Route
                path="*"
                element={
                  <motion.div
                    className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
                      <p className="text-gray-300">The page you're looking for doesn't exist.</p>
                    </motion.div>
                  </motion.div>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
      </motion.div>
    </Router>
  )
}

export default App