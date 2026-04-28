import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../supabase/client'
import { isAdminConfigured, getAdminInfo } from '../services/adminAuth'
import { logoutUser as authLogoutUser, loginUser as authLoginUser, registerUser as authRegisterUser } from '../services/authService'
import { cacheService } from '../services/cacheService'
import { saveSecureUser, loadSecureUser, secureRemoveItem, saveSecureCart, loadSecureCart, secureSetItem, secureGetItem, loadSecureSeller, saveSecureSeller, secureClear } from '../services/secureStorage'
import { PROMOTION_PRICES } from '../services/paymentService'
import { cities, categories, serviceCategories } from './constants'
import {
  formatPrice, checkIsAdmin, parseDate, cleanObject,
  mapItemFromDB, mapItemToDB, mapOrderFromDB, mapOrderToDB, getDistance
} from './utils'
import { useProductSearch } from '../hooks/useProductSearch'
import { AppContext } from './AppContextInstance'

/**
 * AppProvider - Gestionnaire central du state de l'application.
 * Toutes les fonctions sont déclarées avec 'function' pour bénéficier du hoisting
 * et éviter les erreurs de "ReferenceError" (Temporal Dead Zone).
 */
export function AppProvider({ children }) {
  const [seller, setSeller] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isAppReady, setIsAppReady] = useState(false)
  const [errors, setErrors] = useState({ products: null, users: null, orders: null })
  const [dataLoading, setDataLoading] = useState({ products: true, users: true, orders: true, services: true })
  const [toasts, setToasts] = useState([])
  const [filters, setFilters] = useState({
    city: '', neighborhood: '', category: '', priceMin: '', priceMax: '',
    search: '', promoted: false, nearMe: false, type: 'all'
  })
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [orders, setOrders] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cart, setCart] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [userLocation, setUserLocation] = useState(null)

  const authProcessing = useRef(false)
  const lastSessionId = useRef(null)
  const authControllerRef = useRef(null)

  // === HOISTED FUNCTIONS ===

  function showToast(message, type = 'info', duration = 5000, onClick = null) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, message, type, duration, onClick }])
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  async function handleSellerAutoRepair(profile, userId) {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);
      
      if (!error && count > 0 && !profile.is_seller) {
        const { data: updatedProfile } = await supabase
          .from('profiles').update({ is_seller: true }).eq('id', userId).select().single();
        return updatedProfile || profile;
      }
    } catch (e) { console.error('Auto-repair failed:', e); }
    return profile;
  }

  async function fetchInitialData() {
    setDataLoading(prev => ({ ...prev, products: true, services: true }))
    const cachedProducts = cacheService.get('initial_products')
    if (cachedProducts && Array.isArray(cachedProducts)) {
      setProducts(cachedProducts.map(mapItemFromDB).filter(Boolean));
      setDataLoading(prev => ({ ...prev, products: false, services: false }))
    }

    try {
      const { data, error } = await supabase
        .from('products').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      if (data) {
        setProducts(data.map(mapItemFromDB).filter(Boolean));
        cacheService.set('initial_products', data, 12)
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setErrors(prev => ({ ...prev, products: err.message }));
    } finally {
      setDataLoading(prev => ({ ...prev, products: false, services: false }))
    }

    // Background fetch for others
    try {
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => data && setOrders(data.map(mapOrderFromDB)));
      supabase.from('reviews').select('*').limit(50)
        .then(({ data }) => data && setReviews(data.map(r => ({
          id: r.id, productId: r.product_id, reviewerName: r.reviewer_name,
          reviewerId: r.reviewer_id, rating: r.rating, comment: r.comment, createdAt: r.created_at
        }))));
    } catch (e) { console.warn('BG fetch error:', e); }
  }

  async function fetchUserData(currentUser) {
    if (!currentUser) return;
    setDataLoading(prev => ({ ...prev, orders: true, users: true }))
    try {
      const { data: ordersData } = await supabase.from('orders').select('*')
        .or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
      if (ordersData) setOrders(ordersData.map(mapOrderFromDB))

      if (checkIsAdmin(currentUser)) {
        const { data: usersData } = await supabase.from('profiles').select('*')
        if (usersData) setAllUsers(usersData)
      }
    } finally {
      setDataLoading(prev => ({ ...prev, orders: false, users: false }))
    }
  }

  // === EFFECTS ===

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      cacheService.clearAll();
      secureClear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && lastSessionId.current === session?.user?.id) {
        setAuthLoading(false); return;
      }
      lastSessionId.current = session?.user?.id || null;
      if (authControllerRef.current) authControllerRef.current.abort();

      if (!session?.user) {
        setUser(null); setSeller(null); setAuthLoading(false); return;
      }

      const controller = new AbortController();
      authControllerRef.current = controller;

      try {
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single().abortSignal(controller.signal);
        if (profile) {
          const finalProfile = await handleSellerAutoRepair(profile, session.user.id);
          if (finalProfile.is_seller) { setSeller(finalProfile); setUser(null); }
          else { setUser(finalProfile); setSeller(null); }
          saveSecureUser(finalProfile);
        }
      } catch (err) { if (err.name !== 'AbortError') console.error('Auth error:', err); }
      finally { setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchUserData(seller || user);
  }, [seller?.id, user?.id]);

  useEffect(() => {
    if (!authLoading && !dataLoading.products) {
      setIsAppReady(true);
      if (window.hideAppLoader) window.hideAppLoader();
    }
  }, [authLoading, dataLoading.products]);

  // === DATA LOGIC ===

  const getProductById = useCallback((id) => products.find(p => p.id === id), [products])
  const getServiceById = useCallback((id) => products.find(p => p.id === id && p.type === 'service'), [products])

  const { getFilteredProducts: _getFilteredProducts } = useProductSearch(products, filters)

  const getFilteredProducts = useCallback(() => {
    let results = _getFilteredProducts()
    if (filters.type === 'product') results = results.filter(p => !p.type || p.type === 'product')
    else if (filters.type === 'service') results = results.filter(p => p.type === 'service')
    return results
  }, [_getFilteredProducts, filters.type])

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return [...products].sort((a, b) => {
      const dateA = parseDate(a.createdAt || a.created_at);
      const dateB = parseDate(b.createdAt || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [products])

  function toggleFavorite(id) {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  }

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
    showToast("Ajouté au panier", 'success')
  }

  // === CONTEXT VALUE ===

  const value = {
    seller, user, products, reviews, orders, allUsers, favorites, cart,
    toasts, showToast, removeToast, authLoading, dataLoading, isAppReady, errors,
    getProductById, getServiceById, getFilteredProducts, filteredProducts,
    toggleFavorite, isFavorite: (id) => favorites.includes(id),
    addToCart, setFilters, filters,
    logoutUser: authLogoutUser, loginUser: authLoginUser, registerUser: authRegisterUser
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
