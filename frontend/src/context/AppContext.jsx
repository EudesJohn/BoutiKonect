import { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../supabase/client'
import { isAdminConfigured, getAdminInfo } from '../services/adminAuth'
import { logoutUser as authLogoutUser } from '../services/authService'
import { cacheService } from '../services/cacheService'
import { saveSecureUser, loadSecureUser, secureRemoveItem, saveSecureCart, loadSecureCart, secureSetItem, secureGetItem, loadSecureSeller, saveSecureSeller, secureClear } from '../services/secureStorage'
import { PROMOTION_PRICES } from '../services/paymentService'
import { cities, categories, serviceCategories } from './constants'
import {
  formatPrice, checkIsAdmin, parseDate, cleanObject,
  mapItemFromDB, mapItemToDB, mapOrderFromDB, mapOrderToDB, getDistance
} from './utils'

// Export AppContext early to avoid TDZ for components that import it
export const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [seller, setSeller] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isAppReady, setIsAppReady] = useState(false)
  const [errors, setErrors] = useState({ products: null, users: null, orders: null })
  const [dataLoading, setDataLoading] = useState({ products: true, users: true, orders: true, services: true })
  
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((message, type = 'info', duration = 5000, onClick = null) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, message, type, duration, onClick }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const authProcessing = useRef(false)
  const lastSessionId = useRef(null)
  const authControllerRef = useRef(null)

  /**
   * Fonction interne d'auto-réparation du statut vendeur
   */
  const handleSellerAutoRepair = useCallback(async (profile, userId) => {
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);
      
      if (!error && count > 0 && !profile.is_seller) {
        console.log(`🔧 Auto-repair: User ${userId} has ${count} products. Updating status...`);
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ is_seller: true })
          .eq('id', userId)
          .select()
          .single();
        
        return updatedProfile || profile;
      }
    } catch (e) {
      console.error('Auto-repair failed:', e);
    }
    return profile;
  }, [])

  // GESTION DE LA SESSION SUPABASE
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      cacheService.clearAll();
      secureClear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) registration.unregister();
        });
      }
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }

    let isInitialized = false;
    const authTimeout = setTimeout(() => {
      if (!isInitialized) { setAuthLoading(false); isInitialized = true; }
    }, 10000); 

    if (!supabase || !supabase.auth) {
      setAuthLoading(false);
      setDataLoading({ products: false, users: false, orders: false, services: false });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id || null;
      if (event === 'SIGNED_IN' && lastSessionId.current === currentUserId) {
        setAuthLoading(false);
        return;
      }
      lastSessionId.current = currentUserId;

      if (authControllerRef.current) authControllerRef.current.abort();

      if (!session?.user) {
        if (user || seller) {
          setUser(null); setSeller(null);
          saveSecureUser(null); saveSecureSeller(null);
          secureClear();
        }
        setAuthLoading(false); isInitialized = true; clearTimeout(authTimeout);
        return;
      }

      const controller = new AbortController();
      authControllerRef.current = controller;

      try {
        const { data: profile, error } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
          .abortSignal(controller.signal);

        if (error) {
          if (error.name === 'AbortError') return;
          const cachedUser = await loadSecureUser();
          if (cachedUser && cachedUser.id === session.user.id) {
            if (cachedUser.is_seller) { setSeller(cachedUser); setUser(null); }
            else { setUser(cachedUser); setSeller(null); }
          }
        } else if (profile) {
          const finalProfile = await handleSellerAutoRepair(profile, session.user.id);
          if (finalProfile.is_seller) { setSeller(finalProfile); setUser(null); }
          else { setUser(finalProfile); setSeller(null); }
          saveSecureUser(finalProfile);
          saveSecureSeller(finalProfile.is_seller ? finalProfile : null);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Auth error:', err);
      } finally {
        if (authControllerRef.current === controller) {
          setAuthLoading(false); isInitialized = true; clearTimeout(authTimeout);
        }
      }
    });

    const loadOptimisticUser = async () => {
      try {
        const [cachedUser, cachedSeller] = await Promise.all([loadSecureUser(), loadSecureSeller()])
        if (cachedSeller) { setSeller(cachedSeller); setUser(null); setAuthLoading(false); }
        else if (cachedUser) { setUser(cachedUser); setSeller(null); setAuthLoading(false); }
      } catch (err) { console.error('Optimistic load error:', err) }
    }
    loadOptimisticUser()

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
      if (authControllerRef.current) authControllerRef.current.abort();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === APP READINESS LOGIC ===
  useEffect(() => {
    const globalSafetyTimeout = setTimeout(() => {
      if (!isAppReady) {
        setIsAppReady(true);
        if (window.hideAppLoader) window.hideAppLoader();
      }
    }, 8000);

    if (!authLoading && !dataLoading.products) {
      setIsAppReady(true);
      const loaderTimer = setTimeout(() => {
        if (window.hideAppLoader) window.hideAppLoader();
      }, 800);
      return () => { clearTimeout(globalSafetyTimeout); clearTimeout(loaderTimer); };
    }
    return () => clearTimeout(globalSafetyTimeout);
  }, [authLoading, dataLoading.products, isAppReady])

  // === DATA STATE ===
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [orders, setOrders] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cart, setCart] = useState([])
  const [recommendations, setRecommendations] = useState([])

  // === LOAD LOCAL STORAGE ===
  useEffect(() => {
    const savedFavorites = localStorage.getItem('BoutiKonect_favorites')
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
    
    const initCart = async () => {
      try {
        const savedCart = await loadSecureCart()
        if (savedCart && Array.isArray(savedCart)) setCart(savedCart)
      } catch (err) { console.error('Cart load error:', err) }
    }
    initCart()
  }, [])

  useEffect(() => {
    localStorage.setItem('BoutiKonect_favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const persistCart = async () => {
      try { await saveSecureCart(cart) } catch (err) { console.error('Cart save error:', err) }
    }
    persistCart()
  }, [cart])

  // === DATA FETCHING METHODS ===
  const fetchInitialData = useCallback(async () => {
    setDataLoading(prev => ({ ...prev, products: true, services: true }))
    
    const cachedProducts = cacheService.get('initial_products')
    if (cachedProducts) {
      setProducts(cachedProducts.map(mapItemFromDB))
      setDataLoading(prev => ({ ...prev, products: false, services: false }))
    }

    const productsPromise = supabase
      .from('products').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          setProducts(data.map(mapItemFromDB));
          cacheService.set('initial_products', data, 12)
        }
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setErrors(prev => ({ ...prev, products: err.message }));
      })
      .finally(() => {
        setDataLoading(prev => ({ ...prev, products: false, services: false }))
      });

      const fetchBackgroundData = async () => {
        try {
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20)
            .then(({ data }) => data && setOrders(data.map(mapOrderFromDB)));

          supabase.from('reviews').select('*').limit(50)
            .then(({ data }) => data && setReviews(data.map(r => ({
              id: r.id, productId: r.product_id, reviewerName: r.reviewer_name,
              reviewerId: r.reviewer_id, rating: r.rating, comment: r.comment, createdAt: r.created_at
            }))));

          if (checkIsAdmin(seller || user)) {
            supabase.from('profiles').select('*').limit(100)
              .then(({ data }) => data && setAllUsers(data));
          }
        } catch (e) { console.warn('BG fetch error:', e); }
        finally { setDataLoading(prev => ({ ...prev, orders: false, users: false })); }
      };

      fetchBackgroundData();
      await productsPromise;
  }, [user, seller])

  useEffect(() => {
    fetchInitialData()
    const productsSub = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') setProducts(prev => [mapItemFromDB(payload.new), ...prev])
        else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? mapItemFromDB(payload.new) : p))
        else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id))
      }).subscribe()

    const profilesSub = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedProfile = payload.new
          if (user && updatedProfile.id === user.id) setUser(prev => ({ ...prev, ...updatedProfile }))
          if (seller && updatedProfile.id === seller.id) setSeller(prev => ({ ...prev, ...updatedProfile }))
          setAllUsers(prev => prev.map(u => u.id === updatedProfile.id ? updatedProfile : u))
        }
      }).subscribe()

    return () => {
      supabase.removeChannel(productsSub)
      supabase.removeChannel(profilesSub)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const currentUser = seller || user
    if (!currentUser) {
      setDataLoading(prev => ({ ...prev, orders: false, users: false }))
      return
    }
    const fetchUserData = async () => {
      setDataLoading(prev => ({ ...prev, orders: true, users: true }))
      const { data: ordersData } = await supabase.from('orders').select('*')
        .or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
      if (ordersData) setOrders(ordersData.map(mapOrderFromDB))

      if (checkIsAdmin(currentUser)) {
        const { data: usersData } = await supabase.from('profiles').select('*')
        if (usersData) setAllUsers(usersData)
      }
      setDataLoading(prev => ({ ...prev, orders: false, users: false }))
    }
    fetchUserData()
  }, [seller, user])

  useEffect(() => {
    const fetchRecs = async () => {
      const currentUser = seller || user;
      if (currentUser) {
        try {
          const { getRecommendedProducts } = await import('../services/analyticsService');
          const recs = await getRecommendedProducts(currentUser.id, 8);
          setRecommendations(recs.map(mapItemFromDB));
        } catch (e) { console.error('Recs error:', e) }
      }
    };
    fetchRecs();
  }, [seller?.id, user?.id]);

  // === HELPER METHODS ===
  const getProductById = useCallback((id) => products.find(p => p.id === id), [products])
  const getServiceById = useCallback((id) => products.find(p => p.id === id && p.type === 'service'), [products])

  const fetchSingleProduct = useCallback(async (id) => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) throw error
      const mapped = mapItemFromDB(data)
      setProducts(prev => {
        if (prev.find(p => p.id === id)) return prev
        return [...prev, mapped]
      })
      return mapped
    } catch (error) { console.error("fetchSingleProduct error:", error); return null }
  }, [])

  const addProduct = async (itemData) => {
    try {
      const dbItem = mapItemToDB(itemData)
      const { data, error } = await supabase.from('products').insert([dbItem]).select()
      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) { return { success: false, error: error.message } }
  }

  const updateProduct = async (id, itemData) => {
    try {
      const dbItem = mapItemToDB(itemData)
      const { error } = await supabase.from('products').update(dbItem).eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (error) { return { success: false, error: error.message } }
  }

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== id))
      showToast("Élément supprimé", 'success')
      return { success: true }
    } catch (error) { return { success: false, error: error.message } }
  }

  const createOrder = async (orderData) => {
    try {
      const dbOrder = mapOrderToDB(orderData)
      const { data, error } = await supabase.from('orders').insert([dbOrder]).select()
      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) { return { success: false, error: error.message } }
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    showToast("Ajouté au panier", 'success')
  }

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const isFav = prev.includes(id)
      if (isFav) { showToast("Retiré des favoris", 'info'); return prev.filter(fid => fid !== id); }
      showToast("Ajouté aux favoris", 'success'); return [...prev, id];
    })
  }

  const isFavorite = (id) => favorites.includes(id)

  const decrementProductStock = async (id, amount = 1) => {
    try {
      const product = products.find(p => p.id === id)
      if (product && product.stock !== undefined) {
        const newStock = Math.max(0, product.stock - amount)
        await supabase.from('products').update({ stock: newStock }).eq('id', id)
      }
    } catch (err) { console.error('Stock decrement error:', err) }
  }

  const reportProduct = async (productId, reason, reporterId) => {
    try {
      await supabase.from('admin_notifications').insert([{
        type: 'report',
        data: { productId, reason, reporterId },
        read: false
      }])
    } catch (err) { console.error('Report error:', err) }
  }

  const getReportedProducts = useCallback(() => {
    const reportedIds = reviews.filter(r => r.rating <= 2).map(r => r.productId)
    // Also check admin_notifications if available
    return products.filter(p => reportedIds.includes(p.id))
  }, [products, reviews])

  const getAllReports = useCallback(() => {
    return reviews.filter(r => r.rating <= 2).map(r => ({
      id: r.id,
      productId: r.productId,
      reason: r.comment,
      status: 'pending',
      createdAt: r.createdAt
    }))
  }, [reviews])

  const deleteService = deleteProduct // Alias

  const resolveReport = async (reportId) => {
    // For now, just a stub or update review status if possible
    showToast("Signalement résolu", 'success')
  }

  const [userLocation, setUserLocation] = useState(null)
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation non supportee'))
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const l = { latitude: position.coords.latitude, longitude: position.coords.longitude }
          setUserLocation(l)
          resolve(l)
        },
        (error) => reject(error)
      )
    })
  }, [])

  const filteredProducts = useMemo(() => {
    return products.sort((a, b) => {
      const dateA = parseDate(a.created_at);
      const dateB = parseDate(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [products])

  const value = {
    seller, user, products, services: products.filter(p => p.type === 'service'), reviews, orders, allUsers, favorites, cart,
    toasts, showToast, removeToast, authLoading, dataLoading, isAppReady, errors,
    getProductById, getServiceById, fetchSingleProduct, addProduct, updateProduct, deleteProduct, deleteService,
    createOrder, addToCart, toggleFavorite, isFavorite, decrementProductStock, reportProduct,
    getAllUsers: () => allUsers,
    getAllProducts: () => products,
    getAllOrders: () => orders,
    getReportedProducts,
    getAllReports,
    resolveReport,
    messages: [], // Stub for now
    getCurrentLocation, formatPrice, parseDate, checkIsAdmin,
    setCart, setFavorites, setSeller, setUser, setIsAppReady,
    filteredProducts, recommendations,
    logoutUser: authLogoutUser
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
