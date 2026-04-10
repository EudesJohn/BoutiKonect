import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, ShoppingBag, Bell } from 'lucide-react'
import './Toast.css'

export default function Toast({ message, type = 'info', onClose, duration = 5000, onClick }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="toast-icon success" />,
    error: <AlertCircle className="toast-icon error" />,
    order: <ShoppingBag className="toast-icon order" />,
    info: <Bell className="toast-icon info" />
  }

  return (
    <motion.div 
      className={`toast-container ${type}`}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      layout
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="toast-content">
        <div className="icon-wrapper">
          {icons[type] || icons.info}
        </div>
        <div className="text-wrapper">
          <p>{message}</p>
        </div>
        <button className="close-btn" onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}>
          <X size={16} />
        </button>
      </div>
      {duration > 0 && (
        <motion.div 
          className="progress-bar"
          initial={{ width: '100%' }}
          animate={{ width: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}
