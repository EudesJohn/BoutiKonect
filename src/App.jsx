import { Routes, Route, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AppContext } from './context/AppContext'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import VirtualAssistant from './components/VirtualAssistant/VirtualAssistant'
import PageTransition from './components/Animations/PageTransition'
import './App.css'
import './components/Animations/Animations.css'

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
import SellerDashboard from './pages/SellerDashboard/SellerDashboard'
import NotFound from './pages/NotFound/NotFound'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminRoute from './components/Auth/AdminRoute'
import GuestRoute from './components/Auth/GuestRoute'
import PaymentCallback from './pages/Payment/PaymentCallback'
import PromotionCallback from './pages/Payment/PromotionCallback'

function App() {
  const { seller, user } = useContext(AppContext)
  const location = useLocation()

  // Wrap a route element with page transition and optional auth guard
  const withTransition = (Component, variant, Guard) => {
    const page = (
      <PageTransition variant={variant}>
        <Component />
      </PageTransition>
    )

    if (Guard === ProtectedRoute) return <ProtectedRoute>{page}</ProtectedRoute>
    if (Guard === AdminRoute) return <AdminRoute>{page}</AdminRoute>
    if (Guard === GuestRoute) return <GuestRoute>{page}</GuestRoute>
    return page
  }

  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={withTransition(Home)} />
            <Route path="/products" element={withTransition(Products)} />
            <Route path="/product/:id" element={withTransition(ProductDetail)} />
            <Route path="/services" element={withTransition(Services)} />
            <Route path="/service/:id" element={withTransition(ServiceDetail)} />
            <Route path="/publish" element={withTransition(Publish, 'fadeSlide', ProtectedRoute)} />
            <Route path="/register" element={withTransition(Register, 'scale', GuestRoute)} />
            <Route path="/login" element={withTransition(Login, 'scale', GuestRoute)} />
            <Route path="/profile" element={withTransition(Profile, 'fadeSlide', ProtectedRoute)} />
            <Route path="/forgot-password" element={withTransition(ForgotPassword)} />
            <Route path="/my-services" element={withTransition(MyServices, 'fadeSlide', ProtectedRoute)} />
            <Route path="/cart" element={withTransition(Cart)} />
            <Route path="/payment" element={withTransition(Payment, 'fadeSlide', ProtectedRoute)} />
            <Route path="/payment-callback" element={withTransition(PaymentCallback, 'fadeSlide', ProtectedRoute)} />
            <Route path="/promotion/success" element={withTransition(PromotionCallback, 'fadeSlide', ProtectedRoute)} />
            <Route path="/admin" element={withTransition(Admin, 'fadeSlide', AdminRoute)} />
            <Route path="/seller/:sellerId" element={withTransition(SellerProfile)} />
            <Route path="/terms" element={withTransition(Terms)} />
            <Route path="/privacy" element={withTransition(Privacy)} />
            <Route path="/my-products" element={withTransition(MyProducts, 'fadeSlide', ProtectedRoute)} />
            <Route path="/seller-dashboard" element={withTransition(SellerDashboard, 'fadeSlide', ProtectedRoute)} />
            <Route path="*" element={withTransition(NotFound, 'scale')} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <VirtualAssistant />
    </div>
  )
}

export default App
