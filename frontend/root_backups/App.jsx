import { Routes, Route } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import './App.css'

import Home from './pages/Home/Home'
import Products from './pages/Products/Products'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import Publish from './pages/Publish/Publish'
import ServicesPage from './pages/Services/Services'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import Profile from './pages/Profile/Profile'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Messages from './pages/Messages/Messages'
import Cart from './pages/Cart/Cart'
import Admin from './pages/Admin/Admin'
import SellerProfile from './pages/SellerProfile/SellerProfile'
import Terms from './pages/Terms/Terms'
import Privacy from './pages/Privacy/Privacy'
import MyProducts from './pages/MyProducts/MyProducts'
import Payment from './pages/Payment/Payment'
import SellerDashboard from './pages/SellerDashboard/SellerDashboard'
import NotFound from './pages/NotFound/NotFound'

function App() {
  const { seller, user } = useContext(AppContext)

  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/publish" element={seller || user ? <Publish /> : <Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:sellerId" element={<Messages />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seller/:sellerId" element={<SellerProfile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
