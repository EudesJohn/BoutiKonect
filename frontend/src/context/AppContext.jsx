import { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../supabase/client'
import { isAdminConfigured, getAdminInfo, ADMIN_EMAILS } from '../services/adminAuth'
import { logoutUser as authLogoutUser } from '../services/authService'
import { cacheService } from '../services/cacheService'
import { saveSecureUser, loadSecureUser, secureRemoveItem, saveSecureCart, loadSecureCart, secureSetItem, secureGetItem, loadSecureSeller, saveSecureSeller, secureClear } from '../services/secureStorage'
import { PROMOTION_PRICES } from '../services/paymentService'
import { cities, categories, serviceCategories } from './constants'

export const AppContext = createContext()

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

export const AppProvider = ({ children }) => {
  // ADMIN_EMAILS importé depuis adminAuth.js (source unique de vérité)

  const checkIsAdmin = (profile) => {
    if (!profile) return false;
    return profile.is_admin === true || 
           profile.role === 'admin' || 
           ADMIN_EMAILS.includes(profile.email);
  }

  const parseDate = useCallback((dateValue) => {
    if (!dateValue) return new Date();
    // Handle Supabase/ISO format and ensure it's compatible with all browsers
    let normalizedDate = dateValue;
    if (typeof dateValue === 'string') {
      // Safari fix: replace space with 'T' if it looks like a date string but missing 'T'
      if (dateValue.includes(' ') && !dateValue.includes('T')) {
        normalizedDate = dateValue.replace(' ', 'T');
      }
    }
    const d = new Date(normalizedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, []);

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

  // ============ FONCTIONS UTILITAIRES ET MAPPAGE ============
  
  function cleanObject(obj) {
    const newObj = {}
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null) {
        newObj[key] = obj[key]
      }
    })
    return newObj
  }

  /**
   * Fonction interne d'auto-réparation du statut vendeur
   */
  async function handleSellerAutoRepair(profile, userId) {
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
  }

  function mapItemFromDB(item) {
    return {
      ...item,
      sellerId: item.seller_id,
      sellerName: item.seller_name,
      sellerCity: item.seller_city,
      sellerNeighborhood: item.seller_neighborhood,
      sellerAvatar: item.seller_avatar,
      priceType: item.price_type,
      isPromoted: item.is_promoted,
      promotionEndDate: item.promotion_end_date,
      latitude: item.latitude,
      longitude: item.longitude,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }
  }

  function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
  }

  function mapOrderFromDB(order) {
    return {
      ...order,
      productId: order.product_id,
      productTitle: order.product_title,
      productImage: order.product_image,
      sellerId: order.seller_id,
      sellerName: order.seller_name,
      buyerId: order.buyer_id,
      buyerName: order.buyer_name,
      buyerPhone: order.buyer_phone,
      buyerAddress: order.buyer_address,
      createdAt: order.created_at
    }
  }

  function mapItemToDB(item) {
    const { 
      sellerId, sellerName, sellerCity, sellerNeighborhood, sellerAvatar,
      priceType, isPromoted, promotionEndDate, ...rest 
    } = item;

    return cleanObject({
      ...rest,
      seller_id: sellerId,
      seller_name: sellerName,
      seller_city: sellerCity,
      seller_neighborhood: sellerNeighborhood,
      seller_avatar: sellerAvatar,
      price_type: priceType,
      is_promoted: isPromoted,
      promotion_end_date: promotionEndDate,
      latitude: item.latitude,
      longitude: item.longitude
    })
  }

  function mapOrderToDB(order) {
    const {
      productId, productTitle, productImage, serviceId, serviceTitle,
      sellerId, sellerName, buyerId, buyerName, buyerPhone, buyerAddress,
      paymentId, paymentStatus, paymentMethod, ...rest
    } = order;

    return cleanObject({
      ...rest,
      product_id: productId || serviceId,
      product_title: productTitle || serviceTitle,
      product_image: productImage,
      seller_id: sellerId,
      seller_name: sellerName,
      buyer_id: buyerId,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      buyer_address: buyerAddress,
      location: buyerAddress,
      delivery_address: buyerAddress,
      payment_id: paymentId,
      payment_status: paymentStatus,
      payment_method: paymentMethod
    })
  }

  // GESTION DE LA SESSION SUPABASE
  useEffect(() => {
    console.log('🏗️ Registering auth state listener');
    let isInitialized = false;

    const authTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('⚠️ Auth check timed out after 10s (Check network or Supabase status)');
        setAuthLoading(false);
        isInitialized = true;
      }
    }, 10000); 

    // Early exit if supabase is not properly initialized
    if (!supabase || !supabase.auth) {
      console.error('🛑 Supabase client is invalid. initialization failed.');
      setAuthLoading(false);
      setDataLoading({ products: false, users: false, orders: false, services: false });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth event: ${event}`, { 
        hasSession: !!session, 
        userId: session?.user?.id
      });
      
      const currentUserId = session?.user?.id || null
      // ... same logic but faster handling ...

      if (event === 'INITIAL_SESSION' && !session) {
        const cached = await loadSecureUser();
        if (cached) {
           // Optimistic set already done below, but ensure loading is off
           setAuthLoading(false);
        } else {
           setAuthLoading(false);
        }
      }

      if (event === 'SIGNED_IN' && lastSessionId.current === currentUserId) {
        setAuthLoading(false)
        return
      }

      lastSessionId.current = currentUserId

      try {
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('❌ Profile fetch error:', error);
            const cachedUser = await loadSecureUser();
            if (cachedUser && cachedUser.id === session.user.id) {
              if (cachedUser.is_seller) {
                setSeller(cachedUser);
                setUser(null);
              } else {
                setUser(cachedUser);
                setSeller(null);
              }
            }
          } else if (profile) {
            const finalProfile = await handleSellerAutoRepair(profile, session.user.id);

            if (finalProfile.is_seller) {
              setSeller(finalProfile)
              setUser(null)
            } else {
              setUser(finalProfile)
              setSeller(null)
            }
            
            saveSecureUser(finalProfile)
            saveSecureSeller(finalProfile.is_seller ? finalProfile : null)
          }
        } else {
          // Only clear if we were logged in before - avoid clearing on first guest load
          if (user || seller) {
            setUser(null)
            setSeller(null)
            saveSecureUser(null)
            saveSecureSeller(null)
            secureClear()
          }
        }
      } catch (err) {
        console.error('❌ Global auth listener error:', err)
      } finally {
        setAuthLoading(false)
        isInitialized = true
        clearTimeout(authTimeout)
      }
    });

    const loadOptimisticUser = async () => {
      try {
        const [cachedUser, cachedSeller] = await Promise.all([
          loadSecureUser(),
          loadSecureSeller()
        ])
        
        if (cachedSeller) {
          setSeller(cachedSeller)
          setUser(null)
          setAuthLoading(false) // Faster readiness if cached
        } else if (cachedUser) {
          setUser(cachedUser)
          setSeller(null)
          setAuthLoading(false)
        }
      } catch (err) {
        console.error('Optimistic load error:', err)
      }
    }

    loadOptimisticUser()

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === APP READINESS LOGIC ===
  useEffect(() => {
    // Sécurité globale : force l'affichage après 8s même si tout n'est pas prêt
    const globalSafetyTimeout = setTimeout(() => {
      if (!isAppReady) {
        console.warn('⚠️ Safety Timeout: Forcing App Ready after 8s.');
        setIsAppReady(true);
        if (window.hideAppLoader) window.hideAppLoader();
        
        // Diagnostic for the user
        if (dataLoading.products) {
          showToast("La connexion est lente, chargement en arrière-plan...", "info");
        }
      }
    }, 8000);

    // L'app est prête normalement quand l'auth et les produits sont là
    if (!authLoading && !dataLoading.products) {
      // On déclenche le rendu de l'App
      setIsAppReady(true);
      
      // On masque le loader HTML lourd avec un délai minimal pour le "premium"
      const loaderTimer = setTimeout(() => {
        if (window.hideAppLoader) window.hideAppLoader();
      }, 800);

      return () => {
        clearTimeout(globalSafetyTimeout);
        clearTimeout(loaderTimer);
      };
    }

    return () => clearTimeout(globalSafetyTimeout);
  }, [authLoading, dataLoading.products])

  // === DATA LOADING ===
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [orders, setOrders] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cart, setCart] = useState([])
  const [reports, setReports] = useState([])
  const [messages, setMessages] = useState([])
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    const savedFavorites = localStorage.getItem('BoutiKonect_favorites')
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
  }, [])

  useEffect(() => {
    localStorage.setItem('BoutiKonect_favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const initCart = async () => {
      try {
        const savedCart = await loadSecureCart()
        if (savedCart && Array.isArray(savedCart) && savedCart.length > 0) {
          setCart(savedCart)
        }
      } catch (err) {
        console.error('Error loading secure cart:', err)
      }
    }
    initCart()
  }, [])

  useEffect(() => {
    const persistCart = async () => {
      try {
        await saveSecureCart(cart)
      } catch (err) {
        console.error('Error saving secure cart:', err)
      }
    }
    persistCart()
  }, [cart])

  const fetchInitialData = async () => {
    setDataLoading(prev => ({ ...prev, products: true, services: true }))
    
    // 1. Chargement optimiste (Cache)
    const cachedProducts = cacheService.get('initial_products')
    if (cachedProducts) {
      console.log('📦 Loaded products from cache (Optimistic)');
      setProducts(cachedProducts.map(mapItemFromDB))
      // On permet à l'app de s'afficher plus vite si on a du cache
      setDataLoading(prev => ({ ...prev, products: false, services: false }))
    }

    // 2. Fetch optimisé (limité)
    const productsPromise = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Failed to load products from network:', error);
          throw error;
        }
        if (data) {
          const mapped = data.map(mapItemFromDB)
          setProducts(mapped);
          cacheService.set('initial_products', data, 12) // Cache pendant 12h
        }
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setErrors(prev => ({ ...prev, products: err.message }));
      })
      .finally(() => {
        setDataLoading(prev => ({ ...prev, products: false, services: false }))
      });

      // 3. Charger le reste en arrière-plan sans bloquer l'initialisation
      const fetchBackgroundData = async () => {
        try {
          // Orders (limité aux plus récents pour la vitesse)
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20)
            .then(({ data }) => data && setOrders(data.map(mapOrderFromDB)));

          // Reviews
          supabase.from('reviews').select('*').limit(50)
            .then(({ data }) => data && setReviews(data.map(r => ({
              id: r.id,
              productId: r.product_id,
              reviewerName: r.reviewer_name,
              reviewerId: r.reviewer_id,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.created_at
            }))));

          // Profiles (seulement si admin ou en tâche de fond lente)
          if (checkIsAdmin(seller || user)) {
            supabase.from('profiles').select('*').limit(100)
              .then(({ data }) => data && setAllUsers(data));
          }
        } catch (e) {
          console.warn('Background fetch error:', e);
        } finally {
          setDataLoading(prev => ({ ...prev, orders: false, users: false, services: false }));
        }
      };

      // On lance le fetch background mais on n'attend pas sa fin pour products
      fetchBackgroundData();
      await productsPromise;
    }

  useEffect(() => {
    fetchInitialData()

    const productsSub = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') setProducts(prev => [mapItemFromDB(payload.new), ...prev])
        else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.new.id ? mapItemFromDB(payload.new) : p))
        else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    const profilesSub = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAllUsers(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const updatedProfile = payload.new
          if (user && updatedProfile.id === user.id) setUser(prev => ({ ...prev, ...updatedProfile }))
          if (seller && updatedProfile.id === seller.id) setSeller(prev => ({ ...prev, ...updatedProfile }))
          setAllUsers(prev => prev.map(u => u.id === updatedProfile.id ? updatedProfile : u))
        } else if (payload.eventType === 'DELETE') {
          setAllUsers(prev => prev.filter(u => u.id !== payload.old.id))
          if (user && payload.old.id === user.id) authLogoutUser()
          if (seller && payload.old.id === seller.id) authLogoutUser()
        }
      })
      .subscribe()

    const reviewsSub = supabase
      .channel('public:reviews')
      .on('postgres_changes', { event: '*', table: 'reviews' }, (payload) => {
        const mapRes = (r) => ({
          id: r.id,
          productId: r.product_id,
          reviewerName: r.reviewer_name,
          reviewerId: r.reviewer_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at
        });
        if (payload.eventType === 'INSERT') setReviews(prev => [mapRes(payload.new), ...prev])
        else if (payload.eventType === 'UPDATE') setReviews(prev => prev.map(r => r.id === payload.new.id ? mapRes(payload.new) : r))
        else if (payload.eventType === 'DELETE') setReviews(prev => prev.filter(r => r.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(productsSub)
      supabase.removeChannel(profilesSub)
      supabase.removeChannel(reviewsSub)
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
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
      if (ordersData) setOrders(ordersData)

      if (checkIsAdmin(currentUser)) {
        const { data: usersData } = await supabase.from('profiles').select('*')
        if (usersData) setAllUsers(usersData)

        const { data: notificationsData } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        if (notificationsData) {
          setReports(notificationsData.map(n => ({
            id: n.id,
            type: n.type,
            ...n.data,
            read: n.read,
            createdAt: n.created_at
          })))
        }
      }
      setDataLoading(prev => ({ ...prev, orders: false, users: false }))
    }
    fetchUserData()

    const ordersSub = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', table: 'orders' }, (payload) => {
        const isAdmin = checkIsAdmin(currentUser)
        const isRelated = payload.new?.seller_id === currentUser.id || payload.new?.buyer_id === currentUser.id || 
                          payload.old?.seller_id === currentUser.id || payload.old?.buyer_id === currentUser.id;

        if (payload.eventType === 'INSERT') {
          if (isAdmin || isRelated) {
            setOrders(prev => [mapOrderFromDB(payload.new), ...prev])
            if (payload.new.seller_id === currentUser.id) showToast(`Nouvelle commande reçue !`, 'order')
            else if (isAdmin) showToast(`Nouvelle commande sur la plateforme`, 'info')
          }
        } else if (payload.eventType === 'UPDATE') {
          if (isAdmin || isRelated) {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? mapOrderFromDB(payload.new) : o))
          }
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()

    const adminSub = checkIsAdmin(currentUser) ? supabase
      .channel('public:admin_notifications')
      .on('postgres_changes', { event: '*', table: 'admin_notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newReport = {
            id: payload.new.id,
            type: payload.new.type,
            ...payload.new.data,
            read: payload.new.read,
            createdAt: payload.new.created_at
          }
          setReports(prev => [newReport, ...prev])
          showToast(`Nouveau signalement ou demande reçu`, 'warning')
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => r.id === payload.new.id ? { ...r, read: payload.new.read } : r))
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id))
        }
      })
      .subscribe() : null

    return () => {
      supabase.removeChannel(ordersSub)
      if (adminSub) supabase.removeChannel(adminSub)
    }
  }, [seller, user])

  useEffect(() => {
    const fetchRecs = async () => {
      const currentUser = seller || user;
      if (currentUser) {
        const { getRecommendedProducts } = await import('../services/analyticsService');
        const recs = await getRecommendedProducts(currentUser.id, 8);
        setRecommendations(recs.map(mapItemFromDB));
      } else {
        setRecommendations([]);
      }
    };
    fetchRecs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller?.id, user?.id]);

  // Nettoyage de l'ancien effet hideAppLoader redondant
  useEffect(() => {
    if (isAppReady && window.hideAppLoader) {
      window.hideAppLoader();
    }
  }, [isAppReady]);

  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocalisation non supportee')
        reject(new Error('Geolocation non supportee'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const l = { latitude: position.coords.latitude, longitude: position.coords.longitude }
          setUserLocation(l)
          resolve(l)
        },
        (error) => {
          setLocationError(error.message)
          reject(error)
        }
      )
    })
  }

  const getProductById = (id) => products.find(p => p.id === id)

  const fetchSingleProduct = async (id) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      const mapped = mapItemFromDB(data)
      setProducts(prev => {
        if (prev.find(p => p.id === id)) return prev
        return [...prev, mapped]
      })
      return mapped
    } catch (error) {
      console.error("fetchSingleProduct error:", error)
      return null
    }
  }

  const addProduct = async (itemData) => {
    try {
      const dbItem = mapItemToDB(itemData)
      const { data, error } = await supabase.from('products').insert([dbItem]).select()
      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) {
      console.error("Erreur addProduct:", error)
      return { success: false, error: error.message }
    }
  }

  const updateProduct = async (id, itemData) => {
    try {
      const dbItem = mapItemToDB(itemData)
      const { error } = await supabase.from('products').update(dbItem).eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Erreur updateProduct:", error)
      return { success: false, error: error.message }
    }
  }

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== id))
      showToast("Élément supprimé avec succès", 'success')
      return { success: true }
    } catch (error) {
      console.error("Erreur deleteProduct:", error)
      showToast("Erreur lors de la suppression", 'error')
      return { success: false, error: error.message }
    }
  }

  const deleteUser = async (id) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      setAllUsers(prev => prev.filter(u => u.id !== id))
      return { success: true }
    } catch (error) {
      console.error("Erreur deleteUser:", error)
      return { success: false, error: error.message }
    }
  }

  const resolveReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', reportId)
      if (error) throw error
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, read: true, status: 'resolved' } : r))
      return { success: true }
    } catch (error) {
      console.error("Erreur resolveReport:", error)
      return { success: false, error: error.message }
    }
  }

  const createOrder = async (orderData) => {
    try {
      const dbOrder = mapOrderToDB(orderData)
      const { data, error } = await supabase.from('orders').insert([dbOrder]).select()
      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) {
      console.error("❌ createOrder Exception:", error)
      return { success: false, error: error.message || "Une erreur inconnue est survenue" }
    }
  }

  const promoteProduct = async (productId, planKey) => {
    try {
      const plan = PROMOTION_PRICES[planKey]
      if (!plan) throw new Error("Plan de promotion invalide")
      const { error } = await supabase.from('admin_notifications').insert([{
        type: 'promotion_request',
        data: { 
          productId, 
          plan: plan.name, 
          days: plan.days, 
          price: plan.price,
          status: 'pending' 
        }
      }])
      if (error) throw error
      showToast(`Votre demande de promotion pour ${plan.name} a été envoyée !`, 'success')
      return { success: true }
    } catch (error) {
      console.error("Erreur promotion:", error)
      return { success: false, error: error.message }
    }
  }

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id)
      if (existingItem) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      return [...prev, { ...product, quantity }]
    })
    showToast('Produit ajouté au panier', 'success')
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId))
  const updateCartQuantity = (productId, newQty) => {
    if (newQty < 1) return removeFromCart(productId)
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQty } : item))
  }
  const clearCart = () => setCart([])

  const updateProfile = async (id, profileData) => {
    try {
      const { error } = await supabase.from('profiles').update(profileData).eq('id', id)
      if (error) throw error
      if (seller && id === seller.id) setSeller(prev => ({ ...prev, ...profileData }))
      if (user && id === user.id) setUser(prev => ({ ...prev, ...profileData }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const upgradeToSeller = async (id, sellerData) => updateProfile(id, { ...sellerData, is_seller: true })

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const isFav = prev.some(fav => fav.id === item.id)
      return isFav ? prev.filter(fav => fav.id !== item.id) : [...prev, item]
    })
  }

  const loginUser = async (email, password, rememberMe) => {
    const { loginUser: authLoginUser } = await import('../services/authService')
    return authLoginUser(email, password, rememberMe)
  }

  const resetPassword = async (email) => {
    try {
      const { sendPasswordResetEmail } = await import('../services/authService')
      return await sendPasswordResetEmail(email)
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateEmailWithVerification = async (newEmail) => {
    try {
      const { updateEmailWithVerification: authUpdateEmail } = await import('../services/authService')
      return await authUpdateEmail(newEmail)
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const services = useMemo(() => products.filter(p => p.type === 'service'), [products])
  const [filters, setFilters] = useState({ city: '', neighborhood: '', category: '', priceMin: '', priceMax: '', search: '', promoted: false, nearMe: false, type: 'all' })

  const filteredProducts = useMemo(() => {
    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
    const searchTerms = normalize(filters.search).trim().split(/\s+/).filter(t => t.length > 0);
    return products.filter(item => {
      if (filters.type === 'product' && item.type === 'service') return false;
      if (filters.type === 'service' && item.type !== 'service') return false;
      if (filters.city && item.seller_city !== filters.city) return false;
      if (filters.neighborhood && item.seller_neighborhood !== filters.neighborhood) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.priceMin !== '' && item.price < parseInt(filters.priceMin)) return false;
      if (filters.priceMax !== '' && item.price > parseInt(filters.priceMax)) return false;
      if (searchTerms.length > 0) {
        const itemContent = normalize(`${item.title} ${item.description}`);
        if (!searchTerms.every(term => itemContent.includes(term))) return false;
      }

      if (filters.nearMe && userLocation) {
        let itemLat = item.latitude;
        let itemLng = item.longitude;
        if (!itemLat || !itemLng) {
          const cityData = cities.find(c => c.name === item.seller_city);
          if (cityData) {
            itemLat = cityData.lat;
            itemLng = cityData.lng;
          }
        }
        if (itemLat && itemLng) {
          const distance = getDistance(userLocation.latitude, userLocation.longitude, itemLat, itemLng);
          if (distance === null || distance > 50) return false;
        } else {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const dateA = parseDate(a.created_at);
      const dateB = parseDate(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [products, filters, userLocation, parseDate]);

  const value = {
    seller, user, products, services, reviews, orders, allUsers, favorites, cart,
    filters, userLocation, locationError, authLoading, dataLoading, errors, isAppReady,
    cities, categories, serviceCategories, PROMOTION_PRICES, filteredProducts,
    getFilteredProducts: () => {
      if (!Array.isArray(filteredProducts)) return [];
      return filteredProducts.filter(p => p.type === 'product' || !p.type);
    },
    getFilteredServices: () => {
      if (!Array.isArray(filteredProducts)) return [];
      return filteredProducts.filter(p => p.type === 'service');
    },
    getCartTotal: () => {
      if (!Array.isArray(cart)) return 0;
      return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    },
    setFilters, addToCart, removeFromCart, updateCartQuantity, clearCart, getProductById, fetchSingleProduct,
    addProduct, updateProduct, deleteProduct, createOrder,
    getCurrentLocation, formatPrice, parseDate, checkIsAdmin,
    showToast, removeToast, toasts,
    loginUser, updateProfile, resetPassword, updateEmailWithVerification,
    toggleFavorite, isFavorite: (itemId) => favorites.some(fav => fav.id === itemId),
    getFavoriteProducts: () => favorites.filter(f => f.type === 'product' || !f.type),
    getFavoriteServices: () => favorites.filter(f => f.type === 'service'),
    getSellerOrders: (sellerId) => orders.filter(o => o.seller_id === sellerId), 
    upgradeToSeller,
    addService: addProduct, updateService: updateProduct, deleteService: deleteProduct,
    promoteProduct,
    registerUser: async (userData) => {
      const { registerUser: authRegFunc } = await import('../services/authService')
      const result = await authRegFunc(userData)
      if (result.success) return { success: true, message: 'Un e-mail de confirmation a été envoyé.' }
      return result
    },
    logoutUser: authLogoutUser,
    logoutSeller: authLogoutUser,
    changePassword: async (current, next) => {
      const { changePassword: authPassFunc } = await import('../services/authService')
      return authPassFunc(current, next)
    },
    getAllUsers: () => allUsers,
    getAllProducts: () => products,
    getAllOrders: () => orders,
    getAllReports: () => reports,
    getReportedProducts: () => {
      const reportedIds = [...new Set(reports.filter(r => !r.read).map(r => r.productId))]
      return products.filter(p => reportedIds.includes(p.id))
    },
    messages,
    deleteUser,
    resolveReport,
    recommendations,
    hardRefresh: () => {
      cacheService.clearAll();
      window.location.reload();
    }
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
