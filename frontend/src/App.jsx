import { Routes, Route } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import VirtualAssistant from './components/VirtualAssistant/VirtualAssistant'
import PWAInstallPrompt from './components/PWAInstallPrompt/PWAInstallPrompt'
import './App.css'

import Home from './pages/Home/Home'
import Products from './pages/Products/Products'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import Services from './pages/Services/Services'
import ServiceDetail from './pages/ServiceDetail/ServiceDetail'
import Publish from './pages/Publish/Publish'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import Profile from './pages/Profile/Profile'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import MyServices from './pages/MyServices/MyServices'
import Cart from './pages/Cart/Cart'
import Admin from './pages/Admin/Admin'
import SellerProfile from './pages/SellerProfile/SellerProfile'
import Terms from './pages/Terms/Terms'
import Privacy from './pages/Privacy/Privacy'
import MyProducts from './pages/MyProducts/MyProducts'
import Payment from './pages/Payment/Payment'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import SellerDashboard from './pages/SellerDashboard/SellerDashboard'
import NotFound from './pages/NotFound/NotFound'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminRoute from './components/Auth/AdminRoute'
import GuestRoute from './components/Auth/GuestRoute'
import PaymentCallback from './pages/Payment/PaymentCallback'
import PromotionCallback from './pages/Payment/PromotionCallback'

import Toast from './components/Toast/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const { seller, user, toasts, removeToast } = useContext(AppContext)

  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      
      {/* Toasts Portal */}
      <div className="toasts-portal">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast 
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/publish" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/my-services" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/payment-callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
          <Route path="/promotion/success" element={<ProtectedRoute><PromotionCallback /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/seller/:sellerId" element={<SellerProfile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
          <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <VirtualAssistant />
      <PWAInstallPrompt />
    </div>
  )
}

export default App
