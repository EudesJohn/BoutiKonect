import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
// Vercel Trigger: 2026-04-29 - FINAL STABLE - Promotions + RLS Orders + Realtime Seller/Admin
import { supabase } from '../supabase/client'
import { isAdminConfigured, getAdminInfo } from '../services/adminAuth'
import { logoutUser as authLogoutUser, loginUser as authServiceLogin, registerUser as authRegisterUser } from '../services/authService'
import { cacheService } from '../services/cacheService'
import { saveSecureUser, loadSecureUser, secureRemoveItem, saveSecureCart, loadSecureCart, secureSetItem, secureGetItem, loadSecureSeller, saveSecureSeller, secureClear } from '../services/secureStorage'
import { PROMOTION_PRICES } from '../services/paymentService'
import { cities, categories, serviceCategories } from './constants'
import {
  formatPrice, checkIsAdmin, parseDate, cleanObject,
  mapItemFromDB, mapItemToDB, mapOrderFromDB, mapOrderToDB, getDistance
} from './utils'
import { sendPasswordResetEmail, updateEmailWithVerification } from '../services/authService'
import { confirmPromotionPayment } from '../services/paymentService'
import { useProductSearch } from '../hooks/useProductSearch'
import { AppContext } from './AppContextInstance'

/**
 * AppProvider - Gestionnaire central du state de l'application.
 * Défini comme une fonction pour profiter du hoisting et éviter les erreurs de TDZ.
 */
export function AppProvider({ children }) {
  const [seller, setSeller] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isAppReady, setIsAppReady] = useState(false)
  const [errors, setErrors] = useState({ products: null, users: null, orders: null })
  const [dataLoading, setDataLoading] = useState({ products: true, users: true, orders: true, services: true, reviews: true })

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

  // === LIFTED FUNCTIONS (Avoid TDZ) ===
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

  const fetchInitialData = useCallback(async () => {
    setDataLoading(prev => ({ ...prev, products: true, services: true }))

    // Suppression du chargement optimiste (cache) pour forcer le temps réel dès le début
    // comme demandé par l'utilisateur.

    const productsPromise = supabase
      .from('products').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => {
        if (error) throw error;
        if (data) {
          const mappedData = data.map(mapItemFromDB).filter(Boolean);
          setProducts(mappedData);
          cacheService.set('initial_products', data, 1) // Réduit à 1h pour plus de fraîcheur
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
          .then(({ data }) => {
            if (data) setReviews(data.map(r => ({
              id: r.id, productId: r.product_id, reviewerName: r.reviewer_name,
              reviewerId: r.reviewer_id, reviewerAvatar: r.reviewer_avatar, rating: r.rating, comment: r.comment, createdAt: r.created_at
            })));
          })
          .catch(err => console.warn('Reviews fetch error:', err))
          .finally(() => setDataLoading(prev => ({ ...prev, reviews: false })));

        if (checkIsAdmin(seller || user)) {
          supabase.from('profiles').select('*').limit(200)
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching profiles:', error);
                setAllUsers([]);
              } else if (data) {
                setAllUsers(data);
              } else {
                setAllUsers([]);
              }
            });
        }
      } catch (e) { console.warn('BG fetch error:', e); }
      finally { setDataLoading(prev => ({ ...prev, orders: false, users: false })); }
    };

    fetchBackgroundData();
    // Ne pas await ici pour ne pas bloquer tout le cycle d'init si la requête est lente
    productsPromise.then(() => console.log('📦 Products load complete'));
  }, [user, seller])

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
          setUser(finalProfile);
          if (finalProfile.is_seller) { setSeller(finalProfile); }
          else { setSeller(null); }
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
        if (cachedSeller) { setSeller(cachedSeller); setUser(cachedSeller); setAuthLoading(false); }
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

  useEffect(() => {
    // On attend que l'auth ET les données critiques (produits, services, avis) soient prêtes
    if (!authLoading && !dataLoading.products && !dataLoading.services && !dataLoading.reviews) {
      setIsAppReady(true);
      const loaderTimer = setTimeout(() => {
        if (window.hideAppLoader) window.hideAppLoader();
      }, 800);
      return () => clearTimeout(loaderTimer);
    }
  }, [authLoading, dataLoading.products, dataLoading.services, dataLoading.reviews, isAppReady])

  // === FILTERS STATE ===
  const [filters, setFilters] = useState({
    city: '',
    neighborhood: '',
    category: '',
    priceMin: '',
    priceMax: '',
    search: '',
    promoted: false,
    nearMe: false,
    type: 'all'
  })

  // === DATA STATE ===
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [orders, setOrders] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cart, setCart] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [adminNotifications, setAdminNotifications] = useState([])

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

  useEffect(() => {
    console.log('🚀 BoutiKonect v1.1.9 (STABLE - 2026-05-01) loaded.');
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const productsSub = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const mapped = mapItemFromDB(payload.new)
          if (mapped) {
            setProducts(prev => {
              if (prev.find(p => p.id === mapped.id)) return prev
              return [...prev, mapped]
            })
          }
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => {
            if (p.id === payload.new.id) {
              // Merge with existing product to avoid losing fields not in the payload
              return mapItemFromDB({ ...p, ...payload.new })
            }
            return p
          }))
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id))
        }
      }).subscribe()

    const profilesSub = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedProfile = payload.new
          setAllUsers(prev => prev.map(u => u.id === updatedProfile.id ? { ...u, ...updatedProfile } : u))
          
          // Also update current user if needed
          if (user && updatedProfile.id === user.id) setUser(prev => ({ ...prev, ...updatedProfile }))
          if (seller && updatedProfile.id === seller.id) setSeller(prev => ({ ...prev, ...updatedProfile }))
        }
      }).subscribe()

    // Realtime pour les commandes - essentiel pour la visibilité vendeur
    const ordersSub = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') setOrders(prev => [mapOrderFromDB(payload.new), ...prev])
        else if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? mapOrderFromDB(payload.new) : o))
        else if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.old.id))
      }).subscribe()

    const reviewsSub = supabase.channel('public:reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
        const mapReview = (r) => r ? ({
          id: r.id, productId: r.product_id, reviewerName: r.reviewer_name,
          reviewerId: r.reviewer_id, reviewerAvatar: r.reviewer_avatar, rating: r.rating, comment: r.comment, createdAt: r.created_at
        }) : null
        if (payload.eventType === 'INSERT') {
          const mapped = mapReview(payload.new);
          if (mapped) setReviews(prev => [mapped, ...prev])
        }
        else if (payload.eventType === 'UPDATE') {
          const mapped = mapReview(payload.new);
          if (mapped) setReviews(prev => prev.map(r => r.id === payload.new.id ? mapped : r))
        }
        else if (payload.eventType === 'DELETE') setReviews(prev => prev.filter(r => r.id !== payload.old.id))
      }).subscribe()

    // Realtime pour les notifications admin - signalements en temps réel
    const adminNotifSub = supabase.channel('public:admin_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAdminNotifications(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setAdminNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
        } else if (payload.eventType === 'DELETE') {
          setAdminNotifications(prev => prev.filter(n => n.id !== payload.old.id))
        }
      }).subscribe()

    return () => {
      supabase.removeChannel(productsSub)
      supabase.removeChannel(profilesSub)
      supabase.removeChannel(ordersSub)
      supabase.removeChannel(reviewsSub)
      supabase.removeChannel(adminNotifSub)
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
      
      const isAdmin = checkIsAdmin(currentUser)
      
      // Fetch orders: all if admin, else only user's orders
      let ordersQuery = supabase.from('orders').select('*')
      if (!isAdmin) {
        ordersQuery = ordersQuery.or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
      }
      
      const { data: ordersData } = await ordersQuery.order('created_at', { ascending: false })
      if (ordersData) setOrders(ordersData.map(mapOrderFromDB))

      if (isAdmin) {
        const { data: usersData } = await supabase.from('profiles').select('*')
        if (usersData) setAllUsers(usersData)
        
        const { data: notificationsData } = await supabase.from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
        if (notificationsData) setAdminNotifications(notificationsData)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller?.id, user?.id]);

  // === DATA HELPERS ===
  const getFavoriteProducts = useCallback(() => {
    return products.filter(p => favorites.includes(p.id) && (p.type === 'product' || !p.type));
  }, [products, favorites]);

  const getFavoriteServices = useCallback(() => {
    return products.filter(p => favorites.includes(p.id) && p.type === 'service');
  }, [products, favorites]);

  const getSellerOrders = useCallback((sellerId) => {
    return orders.filter(o => o.sellerId === sellerId);
  }, [orders]);

  const updateOrderStatus = async (orderId, status) => {
    if (!orderId) return { success: false, error: 'ID manquant' };
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select();
      
      if (error) throw error;
      
      // PostgREST update returns an array of updated rows
      if (!data || data.length === 0) {
        console.warn('Aucune ligne mise à jour pour l\'ID:', orderId);
        showToast('Aucun changement effectué', 'info');
        return { success: false, error: 'Commande non trouvée' };
      }

      setOrders(prev => prev.map(o => o.id === orderId ? mapOrderFromDB(data[0]) : o));
      showToast('Statut mis à jour', 'success');
      return { success: true };
    } catch (error) {
      console.error('updateOrderStatus error:', error);
      showToast('Erreur lors de la mise à jour', 'error');
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (userId, profileData) => {
    try {
      const dbProfile = cleanObject({
        name: profileData.name,
        phone: profileData.phone,
        city: profileData.city,
        neighborhood: profileData.neighborhood,
        avatar: profileData.avatar,
        whatsapp: profileData.whatsapp
      });
      const { error } = await supabase.from('profiles').update(dbProfile).eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('updateProfile error:', error);
      return { success: false, error: error.message };
    }
  };

  const upgradeToSeller = async (userId, sellerData = {}) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_seller: true, ...sellerData }).eq('id', userId);
      if (error) throw error;
      showToast('Félicitations ! Vous êtes maintenant vendeur.', 'success');
      return { success: true };
    } catch (error) {
      console.error('upgradeToSeller error:', error);
      showToast('Erreur lors de la mise à jour', 'error');
      return { success: false, error: error.message };
    }
  };

  const promoteProduct = async (productId, planKey) => {
    const currentUser = seller || user;
    if (!currentUser) return { success: false, error: 'Vous devez être connecté.' };
    
    const plan = PROMOTION_PRICES[planKey];
    if (!plan) return { success: false, error: 'Plan invalide.' };

    return await confirmPromotionPayment(productId, plan, currentUser.id);
  };

  const activatePromotionInstant = async (productId, days) => {
    try {
      console.log('🚀 Tentative d\'activation promotion pour:', productId);
      
      // 1. Forcer la récupération de la session pour s'assurer que le JWT est envoyé
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      let { data: { user: freshUser } } = await supabase.auth.getUser();
      
      if (!session && freshUser) {
        console.log('✅ Utilisateur trouvé via getUser(), poursuite de l\'activation...');
      } else if (!session && !freshUser) {
        console.warn('⚠️ Aucun utilisateur trouvé, tentative finale de rafraîchissement...');
        const { data: { session: secondSession } } = await supabase.auth.getSession();
        if (!secondSession) {
          console.error('❌ Impossible de restaurer la session. L\'utilisateur est anonyme.');
          return { success: false, error: "Votre session a expiré ou est introuvable. Veuillez vous reconnecter pour valider l'activation." };
        }
      }

      console.log('✅ Session active pour:', session.user.id);
      
      // 2. Appel RPC avec la session garantie
      const { data: rpcStatus, error: rpcError } = await supabase.rpc('activate_product_promotion', {
        p_product_id: productId,
        p_days: days
      });

      if (rpcError) {
        console.error('activatePromotionInstant - Erreur RPC:', rpcError);
        // Fallback sur l'update classique si le RPC n'est pas encore déployé
        if (rpcError.message?.includes('not found') || rpcError.message?.includes('function')) {
          console.log('⚠️ RPC non trouvé, fallback sur update classique...');
          const now = new Date();
          const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          
          const { data, error } = await supabase
            .from('products')
            .update({ is_promoted: true, promotion_end_date: endDate.toISOString() })
            .eq('id', productId)
            .select();

          if (error) throw error;
          if (!data || data.length === 0) throw new Error("Produit non trouvé ou droits insuffisants.");
          
          // Mise à jour state local
          const updatedProduct = mapItemFromDB(data[0]);
          setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
          showToast("⭐ Badge Vedette activé !", "success");
          return { success: true };
        }
        throw rpcError;
      }

      if (rpcStatus === 'SUCCESS') {
        // Rafraîchir le produit localement
        const { data: refreshed } = await supabase.from('products').select('*').eq('id', productId).single();
        if (refreshed) {
          const mapped = mapItemFromDB(refreshed);
          setProducts(prev => prev.map(p => p.id === productId ? mapped : p));
        }
        showToast("⭐ Félicitations ! Votre produit est maintenant en Vedette.", "success");
        return { success: true };
      } else {
        console.warn('activatePromotionInstant: RPC a retourné un échec:', rpcStatus);
        const errorMsg = rpcStatus?.startsWith('ERROR:') ? rpcStatus.replace('ERROR: ', '') : "Le serveur a refusé l'activation.";
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('activatePromotionInstant error:', err);
      return { success: false, error: err.message || "Erreur de communication avec la base de données." };
    }
  };

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
      cacheService.remove('initial_products')
      return { success: true, data: data[0] }
    } catch (error) { return { success: false, error: error.message } }
  }

  const updateProduct = async (id, itemData) => {
    try {
      const dbItem = mapItemToDB(itemData)
      const { error } = await supabase.from('products').update(dbItem).eq('id', id)
      if (error) throw error
      cacheService.remove('initial_products')
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

  const addService = addProduct
  const updateService = updateProduct

  const createOrder = async (orderData) => {
    try {
      const dbOrder = mapOrderToDB(orderData)
      const { error } = await supabase.from('orders').insert([dbOrder])
      if (error) throw error
      return { success: true }
    } catch (error) { return { success: false, error: error.message } }
  }

  const forceUpdate = () => {
    if (window.confirm("Cela va rafraîchir toutes les données et synchroniser l'application. Voulez-vous continuer ?")) {
      window.location.href = window.location.origin + window.location.pathname + '?reset=true';
    }
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

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
    showToast("Retiré du panier", 'info')
  }

  const updateCartQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item))
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)
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
      const { data: success, error } = await supabase.rpc('decrement_product_stock', {
        p_product_id: id,
        p_amount: amount
      });
      
      if (error) throw error;
      
      if (success) {
        // Rafraîchir l'état local du produit
        const { data: refreshed } = await supabase.from('products').select('*').eq('id', id).single();
        if (refreshed) {
          const mapped = mapItemFromDB(refreshed);
          setProducts(prev => prev.map(p => p.id === id ? mapped : p));
        }
        return { success: true };
      } else {
        return { success: false, error: 'Stock insuffisant ou erreur lors de la mise à jour' };
      }
    } catch (err) { 
      console.error('Stock decrement error:', err);
      return { success: false, error: err.message };
    }
  }

  const reportProduct = async (productId, reason, reporterId) => {
    try {
      const { error } = await supabase.from('admin_notifications').insert([{
        type: 'report',
        data: { productId, reason, reporterId },
        read: false
      }])
      if (error) throw error
      showToast("Signalement envoyé avec succès", 'success')
    } catch (err) { 
      console.error('Report error:', err)
      showToast("Erreur lors de l'envoi du signalement", 'error')
    }
  }

  const getReportedProducts = useCallback(() => {
    // Collect IDs from low ratings
    const lowRatingProductIds = reviews.filter(r => r.rating <= 2).map(r => r.productId)
    
    // Collect IDs from admin notifications
    const reportNotificationIds = adminNotifications
      .filter(n => n.type === 'report' && n.data?.productId)
      .map(n => n.data.productId)
    
    const allReportedIds = [...new Set([...lowRatingProductIds, ...reportNotificationIds])]
    return products.filter(p => allReportedIds.includes(p.id))
  }, [products, reviews, adminNotifications])

  const getAllReports = useCallback(() => {
    // Reports from reviews
    const reviewReports = reviews.filter(r => r.rating <= 2).map(r => ({
      id: r.id,
      productId: r.productId,
      reason: r.comment,
      status: 'pending',
      createdAt: r.createdAt,
      source: 'review'
    }))
    
    // Reports from admin notifications
    const directReports = adminNotifications
      .filter(n => n.type === 'report')
      .map(n => ({
        id: n.id,
        productId: n.data?.productId,
        reason: n.data?.reason || 'Signalement direct',
        status: n.read ? 'resolved' : 'pending',
        createdAt: n.created_at,
        source: 'notification'
      }))
      
    return [...reviewReports, ...directReports].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  }, [reviews, adminNotifications])

  const deleteService = deleteProduct // Alias

  const deleteUser = async (userId) => {
    try {
      // Supprimer le profil (les produits/commandes sont en cascade dans Supabase)
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) throw error
      setAllUsers(prev => prev.filter(u => u.id !== userId))
      showToast('Utilisateur supprimé', 'success')
      return { success: true }
    } catch (error) {
      console.error('deleteUser error:', error)
      showToast('Erreur lors de la suppression', 'error')
      return { success: false, error: error.message }
    }
  }

  const resolveReport = async (reportId) => {
    if (!reportId) return;
    try {
      // 1. Essayer de marquer la notification comme lue si c'est une notification
      const { error: notifError } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', reportId);
      
      // 2. Si c'est un avis (ID commence par l'ID utilisateur), on peut imaginer un flag 'resolved'
      // Mais comme le schéma reviews n'a pas forcément ce flag, on se base sur admin_notifications pour l'instant
      
      if (notifError) {
        // Si ce n'est pas dans notifications, c'est peut-être un avis.
        // On pourrait ajouter un flag status dans reviews si nécessaire.
      }

      setAdminNotifications(prev => prev.map(n => n.id === reportId ? { ...n, read: true } : n));
      showToast("Signalement marqué comme traité", 'success');
    } catch (error) {
      console.error('resolveReport error:', error);
      showToast("Erreur lors de la résolution", 'error');
    }
  };

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

  // === SEARCH & FILTER ===
  const { getFilteredProducts: _getFilteredProducts } = useProductSearch(products, filters)

  const getFilteredProducts = useCallback(() => {
    const now = new Date()
    let results = _getFilteredProducts()

    // Type filter (all / product / service)
    if (filters.type === 'product') results = results.filter(p => !p.type || p.type === 'product')
    else if (filters.type === 'service') results = results.filter(p => p.type === 'service')

    // Promoted filter
    if (filters.promoted) {
      results = results.filter(p => {
        const isPromoted = p.isPromoted === true || p.isPromoted === 'true'
        const promoEnd = p.promotionEndDate ? parseDate(p.promotionEndDate) : null
        return isPromoted && promoEnd && promoEnd > now
      })
    }

    // Near me filter (Refined: Fallback to city coordinates if exact ones are missing)
    if (filters.nearMe && userLocation) {
      results = results.filter(p => {
        const pLat = p.latitude || cities.find(c => c.name === p.sellerCity)?.lat;
        const pLng = p.longitude || cities.find(c => c.name === p.sellerCity)?.lng;
        
        if (!pLat || !pLng) return false;
        const dist = getDistance(userLocation.latitude, userLocation.longitude, pLat, pLng);
        return dist !== null && dist <= 50;
      })
    }

    // Sort results: Promoted first, then recent
    return results.sort((a, b) => {
      const isAPromoted = (a.isPromoted === true || a.isPromoted === 'true') && parseDate(a.promotionEndDate) > now;
      const isBPromoted = (b.isPromoted === true || b.isPromoted === 'true') && parseDate(b.promotionEndDate) > now;

      if (isAPromoted && !isBPromoted) return -1;
      if (!isAPromoted && isBPromoted) return 1;

      // Both promoted or both not: sort by date
      const dateA = parseDate(a.createdAt || a.created_at);
      const dateB = parseDate(b.createdAt || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [_getFilteredProducts, filters, userLocation])

  const getFilteredServices = useCallback(() => {
    const results = getFilteredProducts();
    return Array.isArray(results) ? results.filter(p => p && p.type === 'service') : [];
  }, [getFilteredProducts])

  const authLoginUser = async (email, password, rememberMe = true) => {
    try {
      const result = await authServiceLogin(email, password, rememberMe);
      
      if (!result.success) {
        showToast(result.error, "error");
        return result;
      }
      
      const profile = result.user;
      if (profile) {
        const finalProfile = await handleSellerAutoRepair(profile, profile.id);
        setUser(finalProfile);
        if (finalProfile.is_seller) { setSeller(finalProfile); }
        else { setSeller(null); }
        saveSecureUser(finalProfile);
        saveSecureSeller(finalProfile.is_seller ? finalProfile : null);
      }
      
      showToast("Connexion réussie", "success");
      return result;
    } catch (err) {
      console.error('Login error:', err);
      showToast(err.message || "Erreur de connexion", "error");
      return { success: false, error: err.message || "Erreur de connexion" };
    }
  };

  const authRegisterUser = async (email, password, metadata) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      showToast("Inscription réussie ! Vérifiez vos emails.", "success");
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Register error:', err);
      showToast(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      showToast("Email de réinitialisation envoyé", "info");
      return { success: true };
    } catch (err) {
      showToast(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  const updateEmailWithVerification = async (newEmail) => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      showToast("Veuillez confirmer le changement sur vos deux emails", "info");
      return { success: true };
    } catch (err) {
      showToast(err.message, "error");
      return { success: false, error: err.message };
    }
  };

  const authLogoutUser = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSeller(null);
      saveSecureUser(null);
      saveSecureSeller(null);
      secureClear();
      
      // Nettoyage manuel des cookies et localStorage pour éviter les sessions fantômes
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('boutikonect-auth-token');
      
      showToast("Déconnexion réussie", "info");
      
      // Redirection forcée pour nettoyer tout état résiduel (Service Workers, etc.)
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      showToast("Erreur lors de la déconnexion", "error");
      // Fallback: force reset
      setUser(null);
      setSeller(null);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const now = new Date();
    return [...products].sort((a, b) => {
      if (!a || !b) return 0;
      
      const isAPromoted = (a.isPromoted === true || a.isPromoted === 'true') && parseDate(a.promotionEndDate) > now;
      const isBPromoted = (b.isPromoted === true || b.isPromoted === 'true') && parseDate(b.promotionEndDate) > now;

      if (isAPromoted && !isBPromoted) return -1;
      if (!isAPromoted && isBPromoted) return 1;

      const dateA = parseDate(a.createdAt || a.created_at);
      const dateB = parseDate(b.createdAt || b.created_at);
      return (dateB.getTime() || 0) - (dateA.getTime() || 0);
    });
  }, [products])

  const value = {
    seller, user, products, services: (products || []).filter(p => p && p.type === 'service'), reviews, orders, allUsers, favorites, cart,
    toasts, showToast, removeToast, authLoading, dataLoading, isAppReady, errors,
    getProductById, getServiceById, fetchSingleProduct, addProduct, updateProduct, deleteProduct, deleteService,
    addService, updateService,
    createOrder, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal,
    toggleFavorite, isFavorite, decrementProductStock, reportProduct, forceUpdate,
    getFavoriteProducts, getFavoriteServices, getSellerOrders, updateOrderStatus, updateProfile, upgradeToSeller,
    PROMOTION_PRICES, promoteProduct, activatePromotionInstant,
    getAllUsers: () => allUsers,
    getAllProducts: () => products,
    getAllOrders: () => orders,
    getReportedProducts,
    getAllReports,
    resolveReport,
    deleteUser,
    messages: [], // Stub for now
    getCurrentLocation, formatPrice, parseDate, checkIsAdmin,
    setCart, setFavorites, setSeller, setUser, setIsAppReady,
    filteredProducts, recommendations,
    logoutUser: authLogoutUser,
    logoutSeller: authLogoutUser, // alias pour Navbar
    loginUser: authLoginUser,
    registerUser: authRegisterUser,
    resetPassword: sendPasswordResetEmail,
    updateEmailWithVerification,
    // Filters
    filters, setFilters,
    getFilteredProducts,
    getFilteredServices,
    userLocation
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Ré-exportation du contexte pour compatibilité
// export { AppContext }; // Removed to avoid shadowing AppContextInstance
