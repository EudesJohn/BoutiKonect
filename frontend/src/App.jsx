import { Routes, Route, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import VirtualAssistant from './components/VirtualAssistant/VirtualAssistant'
import PWAInstallPrompt from './components/PWAInstallPrompt/PWAInstallPrompt'
import TopBarLoader from './components/TopBarLoader/TopBarLoader'
import PageTransition from './components/PageTransition/PageTransition'
import SplashScreen from './components/SplashScreen/SplashScreen'
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
  const { seller, user, toasts, removeToast, isAppReady } = useContext(AppContext)
  const location = useLocation()

  if (!isAppReady) {
    return <SplashScreen />
  }

  return (
    <div className="app">
      <ScrollToTop />
      <TopBarLoader />
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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
            <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
            <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
            <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
            <Route path="/service/:id" element={<PageTransition><ServiceDetail /></PageTransition>} />
            <Route path="/publish" element={<ProtectedRoute><PageTransition><Publish /></PageTransition></ProtectedRoute>} />
            <Route path="/register" element={<GuestRoute><PageTransition><Register /></PageTransition></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><PageTransition><Login /></PageTransition></GuestRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
            <Route path="/my-services" element={<ProtectedRoute><PageTransition><MyServices /></PageTransition></ProtectedRoute>} />
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="/payment" element={<ProtectedRoute><PageTransition><Payment /></PageTransition></ProtectedRoute>} />
            <Route path="/payment-callback" element={<ProtectedRoute><PageTransition><PaymentCallback /></PageTransition></ProtectedRoute>} />
            <Route path="/promotion/success" element={<ProtectedRoute><PageTransition><PromotionCallback /></PageTransition></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><PageTransition><Admin /></PageTransition></AdminRoute>} />
            <Route path="/seller/:sellerId" element={<PageTransition><SellerProfile /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
            <Route path="/my-products" element={<ProtectedRoute><PageTransition><MyProducts /></PageTransition></ProtectedRoute>} />
            <Route path="/seller-dashboard" element={<ProtectedRoute><PageTransition><SellerDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <VirtualAssistant />
      <PWAInstallPrompt />
    </div>
  )
}

export default App
