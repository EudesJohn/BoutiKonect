import { createContext, useState, useEffect, useMemo, useCallback } from 'react'
import { db, auth, initialized } from '../firebase/config'
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile as firebaseUpdateProfile, sendEmailVerification } from 'firebase/auth'
import {
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, onSnapshot,
  query, orderBy, serverTimestamp, where, limit, or
} from 'firebase/firestore';
import { verifyAdminCredentials, isAdminConfigured, getAdminInfo } from '../services/adminAuth'
import { logoutUser as authLogoutUser } from '../services/authService'
import { cacheService } from '../services/cacheService'
import { initSecureStorage, saveSecureUser, loadSecureUser, secureRemoveItem, saveSecureCart, loadSecureCart, secureSetItem, secureGetItem } from '../services/secureStorage'

export const AppContext = createContext()

// Villes du Benin avec coordonnees
export const cities = [
  { id: 1, name: 'Banikoara', neighborhoods: ['Banikoara', 'Founougo', 'Gomparou'], lat: 11.3, lng: 2.4 },
  { id: 2, name: 'Gogounou', neighborhoods: ['Gogounou', 'Bagou', 'Gounarou'], lat: 11.5, lng: 2.7 },
  { id: 3, name: 'Kandi', neighborhoods: ['Kandi I', 'Kandi II', 'Kandi III'], lat: 11.13, lng: 2.94 },
  { id: 4, name: 'Karimama', neighborhoods: ['Karimama', 'Birni-Lafia'], lat: 11.8, lng: 3.1 },
  { id: 5, name: 'Malanville', neighborhoods: ['Malanville', 'Garou', 'Guene'], lat: 11.86, lng: 3.23 },
  { id: 6, name: 'Segbana', neighborhoods: ['Segbana', 'Liboussou', 'Lougou'], lat: 10.93, lng: 3.7 },
  { id: 7, name: 'Natitingou', neighborhoods: ['Natitingou I', 'Natitingou II', 'Natitingou III'], lat: 10.3, lng: 1.38 },
  { id: 8, name: 'Tanguieta', neighborhoods: ['Tanguieta', 'Cotiakou', 'Tanongou'], lat: 10.62, lng: 1.07 },
  { id: 9, name: 'Boukoumbe', neighborhoods: ['Boukoumbe', 'Dipoli', 'Korontiere'], lat: 10.05, lng: 1.07 },
  { id: 10, name: 'Kerou', neighborhoods: ['Kerou', 'Brignamaro', 'Firou'], lat: 10.95, lng: 1.55 },
  { id: 11, name: 'Kouande', neighborhoods: ['Kouande', 'Birni', 'Fô-Tance'], lat: 10.65, lng: 1.72 },
  { id: 12, name: 'Materi', neighborhoods: ['Materi', 'Dassari', 'Gouande'], lat: 10.52, lng: 1.33 },
  { id: 13, name: 'Cobly', neighborhoods: ['Cobly', 'Datori', 'Kountori'], lat: 10.38, lng: 1.45 },
  { id: 14, name: 'Pehunco', neighborhoods: ['Pehunco', 'Gnemasson', 'Tobre'], lat: 10.25, lng: 1.65 },
  { id: 15, name: 'Toucountouna', neighborhoods: ['Toucountouna', 'Kouarfa'], lat: 10.47, lng: 1.18 },
  { id: 16, name: 'Abomey-Calavi', neighborhoods: ['Abomey-Calavi', 'Akassato', 'Godomey', 'Glo-Djigbe', 'Hevie', 'Zinvie'], lat: 6.45, lng: 2.35 },
  { id: 17, name: 'Ouidah', neighborhoods: ['Ouidah I', 'Ouidah II', 'Ouidah III', 'Avlekete'], lat: 6.36, lng: 2.08 },
  { id: 18, name: 'Allada', neighborhoods: ['Allada', 'Agbanou', 'Attogon', 'Hinvi'], lat: 6.58, lng: 2.22 },
  { id: 19, name: 'So-Ava', neighborhoods: ['So-Ava', 'Houedo', 'Togba'], lat: 6.51, lng: 2.41 },
  { id: 20, name: 'Toffo', neighborhoods: ['Toffo', 'Kpomasse'], lat: 6.72, lng: 2.15 },
  { id: 21, name: 'Tori-Bossito', neighborhoods: ['Tori', 'Bossito'], lat: 6.25, lng: 2.17 },
  { id: 22, name: 'Kpomasse', neighborhoods: ['Kpomasse'], lat: 6.78, lng: 2.08 },
  { id: 23, name: 'Ze', neighborhoods: ['Ze', 'Djacodji'], lat: 6.62, lng: 2.47 },
  { id: 24, name: 'Parakou', neighborhoods: ['Parakou I', 'Parakou II', 'Parakou III'], lat: 9.34, lng: 2.62 },
  { id: 25, name: 'Bemberere', neighborhoods: ['Bemberere', 'Beroubouay', 'Gamia'], lat: 9.93, lng: 2.69 },
  { id: 26, name: 'Kalale', neighborhoods: ['Kalale', 'Bouca', 'Dekassa'], lat: 9.78, lng: 2.93 },
  { id: 27, name: 'Ndali', neighborhoods: ['Ndali', 'Bori', 'Gbegourou'], lat: 9.72, lng: 2.99 },
  { id: 28, name: 'Nikki', neighborhoods: ['Nikki', 'Biro', 'Sakabansi'], lat: 9.92, lng: 3.21 },
  { id: 29, name: 'Perere', neighborhoods: ['Perere', 'Gninsy', 'Komiguea'], lat: 9.78, lng: 3.35 },
  { id: 30, name: 'Sinende', neighborhoods: ['Sinende', 'Fo-Boure'], lat: 10.11, lng: 2.48 },
  { id: 31, name: 'Tchaourou', neighborhoods: ['Tchaourou', 'Alafiarou', 'Beterou'], lat: 8.89, lng: 2.61 },
  { id: 32, name: 'Dassa-Zoume', neighborhoods: ['Dassa I', 'Dassa II', 'Gbaffo', 'Kpingni'], lat: 7.75, lng: 2.08 },
  { id: 33, name: 'Savalou', neighborhoods: ['Savalou', 'Djloukou', 'Doumè', 'Gobada'], lat: 7.93, lng: 1.97 },
  { id: 34, name: 'Save', neighborhoods: ['Save I', 'Save II', 'Kaboua'], lat: 7.98, lng: 2.49 },
  { id: 35, name: 'Bante', neighborhoods: ['Bante', 'Agoua', 'Atokoligbe'], lat: 7.73, lng: 1.72 },
  { id: 36, name: 'Glazoue', neighborhoods: ['Glazoue', 'Aklankpa', 'Assante'], lat: 7.72, lng: 2.25 },
  { id: 37, name: 'Ouesse', neighborhoods: ['Ouesse', 'Gbanlin', 'Kilibo'], lat: 7.51, lng: 2.47 },
  { id: 38, name: 'Aplahoue', neighborhoods: ['Aplahoue', 'Atome', 'Azove', 'Dekpo'], lat: 6.98, lng: 1.87 },
  { id: 39, name: 'Djakotomey', neighborhoods: ['Djakotomey I', 'Djakotomey II', 'Gohomey'], lat: 6.9, lng: 1.65 },
  { id: 40, name: 'Dogbo', neighborhoods: ['Dogbo', 'Ayomi', 'Devè'], lat: 6.9, lng: 1.78 },
  { id: 41, name: 'Klouekanme', neighborhoods: ['Klouekanme', 'Adjanhonme', 'Ahogbeya'], lat: 7.1, lng: 1.97 },
  { id: 42, name: 'Lalo', neighborhoods: ['Lalo', 'Ahomadegbe', 'Gnizounme'], lat: 6.82, lng: 1.7 },
  { id: 43, name: 'Toviklin', neighborhoods: ['Toviklin', 'Adjido', 'Avedjin'], lat: 6.78, lng: 1.85 },
  { id: 44, name: 'Djougou', neighborhoods: ['Djougou I', 'Djougou II', 'Djougou III', 'Barienou'], lat: 9.7, lng: 1.62 },
  { id: 45, name: 'Bassila', neighborhoods: ['Bassila', 'Alejo', 'Manigri'], lat: 9.0, lng: 1.77 },
  { id: 46, name: 'Copargo', neighborhoods: ['Copargo', 'Anandana', 'Pabegou'], lat: 9.53, lng: 1.43 },
  { id: 47, name: 'Ouake', neighborhoods: ['Ouake', 'Badjoude', 'Komde'], lat: 9.32, lng: 1.41 },
  { id: 48, name: 'Cotonou', neighborhoods: ['Akpakpa', 'Ganhi', 'Fidrosse', 'Menontin', 'Sainte-Rita', 'Agla', 'Missebo', 'Vedoko'], lat: 6.37, lng: 2.39 },
  { id: 49, name: 'Lokossa', neighborhoods: ['Lokossa', 'Agame', 'Houin'], lat: 6.9, lng: 1.97 },
  { id: 50, name: 'Athieme', neighborhoods: ['Athieme', 'Adohoun', 'Atchannou'], lat: 6.6, lng: 1.95 },
  { id: 51, name: 'Bopa', neighborhoods: ['Bopa', 'Agbodji', 'Lobogo'], lat: 6.55, lng: 1.78 },
  { id: 52, name: 'Come', neighborhoods: ['Come', 'Agatogbo', 'Akodeha'], lat: 6.23, lng: 1.87 },
  { id: 53, name: 'Grand-Popo', neighborhoods: ['Grand-Popo', 'Adjaha', 'Avloh'], lat: 6.28, lng: 1.75 },
  { id: 54, name: 'Houeyogbe', neighborhoods: ['Houeyogbe', 'Dahe', 'Honhoue'], lat: 6.43, lng: 1.83 },
  { id: 55, name: 'Seme-Kpodji', neighborhoods: ['Seme-Kpodji', 'Agblangandan'], lat: 6.33, lng: 2.52 },
  { id: 56, name: 'Adjarra', neighborhoods: ['Adjarra I', 'Adjarra II', 'Aglogbe'], lat: 6.55, lng: 2.5 },
  { id: 57, name: 'Adjohoun', neighborhoods: ['Adjohoun', 'Akpadanou', 'Awonou'], lat: 6.68, lng: 2.35 },
  { id: 58, name: 'Aguegues', neighborhoods: ['Avagbodji', 'Houedome'], lat: 6.45, lng: 2.43 },
  { id: 59, name: 'Akpro-Misserete', neighborhoods: ['Akpro-Misserete', 'Gome', 'Katagon'], lat: 6.58, lng: 2.45 },
  { id: 60, name: 'Avrankou', neighborhoods: ['Avrankou', 'Djomon', 'Gbozounme'], lat: 6.72, lng: 2.53 },
  { id: 61, name: 'Bonou', neighborhoods: ['Bonou', 'Affame', 'Atchonsa'], lat: 6.78, lng: 2.25 },
  { id: 62, name: 'Dangbo', neighborhoods: ['Dangbo', 'Dekin', 'Gbeko'], lat: 6.88, lng: 2.48 },
  { id: 63, name: 'Porto-Novo', neighborhoods: ['Centre', 'Haute-Ville', 'Dokpara', 'Nokoue'], lat: 6.5, lng: 2.62 },
  { id: 64, name: 'Ketou', neighborhoods: ['Ketou', 'Adakplame', 'Idigny'], lat: 7.35, lng: 3.08 },
  { id: 65, name: 'Pobe', neighborhoods: ['Pobe', 'Ahoyeye', 'Igana'], lat: 7.45, lng: 2.77 },
  { id: 66, name: 'Sakete', neighborhoods: ['Sakete I', 'Sakete II', 'Aguidi'], lat: 7.42, lng: 2.58 },
  { id: 67, name: 'Ifangni', neighborhoods: ['Ifangni', 'Banigbe', 'Daagbe'], lat: 7.25, lng: 2.45 },
  { id: 68, name: 'Adja-Ouere', neighborhoods: ['Adja-Ouere', 'Ikpinle', 'Koulou'], lat: 7.28, lng: 2.55 },
  { id: 69, name: 'Abomey', neighborhoods: ['Abomey I', 'Abomey II', 'Abomey III', 'Agbokpa'], lat: 7.19, lng: 1.99 },
  { id: 70, name: 'Bohicon', neighborhoods: ['Bohicon I', 'Bohicon II', 'Agongointo'], lat: 7.18, lng: 2.07 },
  { id: 71, name: 'Cove', neighborhoods: ['Cove', 'Adogbe', 'Houen-Hounso'], lat: 7.2, lng: 1.88 },
  { id: 72, name: 'Djidja', neighborhoods: ['Djidja', 'Agondji', 'Agouna', 'Monsourou'], lat: 7.35, lng: 2.08 },
  { id: 73, name: 'Agbangnizoun', neighborhoods: ['Agbangnizoun', 'Adahondjigon', 'Kinta'], lat: 7.08, lng: 1.82 },
  { id: 74, name: 'Ouinhi', neighborhoods: ['Ouinhi', 'Dasso', 'Sagon'], lat: 7.12, lng: 2.25 },
  { id: 75, name: 'Za-Kpota', neighborhoods: ['Za-Kpota', 'Allahé', 'Houngome'], lat: 7.28, lng: 2.18 },
  { id: 76, name: 'Zogbodomey', neighborhoods: ['Zogbodomey', 'Akiza', 'Avlame'], lat: 7.08, lng: 2.28 }
]

// Categories de produits
export const categories = [
  { id: 1, name: 'Electronique', icon: 'smartphone', color: '#D4735A' },
  { id: 2, name: 'Vêtements', icon: 'shirt', color: '#2A7F82' },
  { id: 3, name: 'Alimentation', icon: 'apple', color: '#4CAF50' },
  { id: 4, name: 'Maison', icon: 'home', color: '#D4A353' },
  { id: 5, name: 'Beaute', icon: 'sparkles', color: '#D98A6E' },
  { id: 6, name: 'Sports', icon: 'dumbbell', color: '#A34933' },
  { id: 7, name: 'Jouets', icon: 'gamepad2', color: '#45A6A9' },
  { id: 8, name: 'Vehicules', icon: 'car', color: '#9C8E7E' },
  { id: 9, name: 'Autres', icon: 'package', color: '#6B5344' }
]

// Categories de services
export const serviceCategories = [
  { id: 1, name: 'Dépannage', icon: 'wrench', color: '#D4735A' },
  { id: 2, name: 'Ménage', icon: 'sparkles', color: '#2A7F82' },
  { id: 3, name: 'Beauté', icon: 'scissors', color: '#D98A6E' },
  { id: 4, name: 'Informatique', icon: 'laptop', color: '#45A6A9' },
  { id: 5, name: 'Cours', icon: 'book', color: '#D4A353' },
  { id: 6, name: 'Bâtiment', icon: 'home', color: '#9C8E7E' },
  { id: 7, name: 'Transport', icon: 'truck', color: '#6B5344' },
  { id: 8, name: 'Événementiel', icon: 'music', color: '#A34933' },
  { id: 9, name: 'Autres Services', icon: 'briefcase', color: '#3D322C' }
]

// Prix de promotion (mise en vedette) - XOF
export const PROMOTION_PRICES = {
  threeDays: { name: '3 jours', price: 1000, days: 3 },
  week: { name: '1 semaine', price: 2500, days: 7 },
  month: { name: '1 mois', price: 9000, days: 30 }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

export const AppProvider = ({ children }) => {
  // 🛡️ HELPER : Vérifier si l'utilisateur est un admin
  // Liste unifiée des emails admin pour éviter les incohérences entre pages
  const ADMIN_EMAILS = [
    'eudesjohn650@gmail.com',
    'BoutiKonectbj229@gmail.com',
    'maboutiquebj@gmail.com'
  ]

  const checkIsAdmin = (profile) => {
    if (!profile) return false;
    return profile.isAdmin === true || 
           profile.role === 'admin' || 
           ADMIN_EMAILS.includes(profile.email);
  }

  // 🛠️ HELPER : Parser les dates Firestore (Timestamps ou Strings)
  // Déclaré en haut pour éviter "lexical declaration antes initialization"
  const parseDate = useCallback((dateValue) => {
    if (!dateValue) return new Date();
    // Gérer les Timestamps Firestore
    if (typeof dateValue === 'object') {
       if (dateValue.toDate) return dateValue.toDate();
       if (dateValue.seconds) return new Date(dateValue.seconds * 1000);
    }
    // Gérer les nombres (timestamps JS)
    if (typeof dateValue === 'number') return new Date(dateValue);
    // Gérer les chaînes
    try {
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) {
      return new Date();
    }
  }, []);

  // === SESSION : Restauration sécurisée asynchrone ===
  const [seller, setSeller] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [errors, setErrors] = useState({ products: null, users: null, orders: null })
  const [dataLoading, setDataLoading] = useState({ products: true, users: true, orders: true, services: true })
  const [rememberMe, setRememberMe] = useState(true) // Ajout de l'état pour Login.jsx

  // Chargement asynchrone sécurisé de la session
  useEffect(() => {
    loadSecureUser().then(cachedProfile => {
      setAuthLoading(prevLoading => {
        if (prevLoading && cachedProfile) {
          if (cachedProfile.isSeller) setSeller(cachedProfile);
          else setUser(cachedProfile);
        }
        return false; // Toujours désactiver le chargement après lecture
      });
    })
  }, [])

  // GESTION DE LA SESSION 100% FIREBASE
  useEffect(() => {
    if (!auth) return

    let profileUnsubscribe = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 🛡️ SÉCURITÉ : Bloquer la session si l'email n'est pas vérifié 
          // (Empêche le bypass d'accès lors de l'inscription initiale)
          if (!firebaseUser.emailVerified && !firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
            await signOut(auth);
            return;
          }

          // 🔒 Initialiser le chiffrement avec l'UID de l'utilisateur
          initSecureStorage(firebaseUser.uid)

          const docRef = doc(db, 'users', firebaseUser.uid)

          // FIX: Utilisation de onSnapshot pour éviter la condition de course avec Google Sign-In
          // Le profil est mis à jour en temps réel (ex: si un admin change un rôle, l'UI s'adapte)
          profileUnsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
              const userData = { id: docSnap.id, ...docSnap.data() }
              
              // 🛡️ SÉCURITÉ : Réparer les profils sans rôle (legacy ou bug)
              if (!userData.role) {
                updateDoc(docRef, { role: 'user' });
                userData.role = 'user';
              }

              // 🔄 SYNCHRONISATION E-MAIL
              if (firebaseUser.email && userData.email !== firebaseUser.email) {
                updateDoc(docRef, { email: firebaseUser.email })
                return; // Le snapshot va se redéclencher après l'update, on arrête ici.
              }

              // SECURITE: Ne jamais stocker le mot de passe dans le cache local
              const safeUserData = { ...userData }
              delete safeUserData.password

              // Mettre en cache de manière sécurisée
              saveSecureUser(safeUserData)
              localStorage.removeItem('BK_userProfile') // Nettoyage de l'ancienne clé

              if (userData.isSeller) {
                setSeller(userData)
                setUser(null)
              } else {
                setUser(userData)
                setSeller(null)
              }
            }
            setAuthLoading(false)
          }, (error) => {
            console.error("Erreur de synchronisation du profil:", error)
            setAuthLoading(false)
          })

        } else {
          // Déconnecté : nettoyer le cache et les anciennes clés
          if (profileUnsubscribe) profileUnsubscribe();
          localStorage.removeItem('BK_userProfile')
          localStorage.removeItem('boutique1_user') // Ancienne clé
          secureRemoveItem('BoutiKonect_user')
          secureRemoveItem('BoutiKonect_seller')
          setSeller(null)
          setUser(null)
          setAuthLoading(false)
        }
      } catch (error) {
        console.error("Erreur de session critique:", error)
        setErrors(prev => ({ ...prev, users: "Erreur lors de la récupération de votre profil." }))
        setAuthLoading(false)
      }
    }, (error) => {
      console.error("Firebase auth state error:", error)
      setErrors(prev => ({ ...prev, users: "Problème de connexion aux services d'authentification." }))
      setAuthLoading(false)
    })

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    }
  }, [])

  // === GESTION DE LA GEOLOCALISATION ===
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('BoutiKonect_user_location')
    return saved ? JSON.parse(saved) : null
  })
  const [locationError, setLocationError] = useState(null)

  // Calculer la distance (formule de Haversine)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Obtenir position actuelle
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocalisation non supportee')
        reject(new Error('Geolocation non supportee'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(location)
          localStorage.setItem('BoutiKonect_user_location', JSON.stringify(location))
          setLocationError(null)
          resolve(location)
        },
        (error) => {
          let errorMessage = 'Erreur de geolocalisation'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission refusee'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible'
              break
            case error.TIMEOUT:
              errorMessage = 'Delai depasse'
              break
          }
          setLocationError(errorMessage)
          reject(new Error(errorMessage))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  const clearUserLocation = () => {
    setUserLocation(null)
    localStorage.removeItem('BoutiKonect_user_location')
  }

  // Obtenir coordonnees d'une ville
  const getCityCoordinates = useCallback((cityName) => {
    if (!cityName) return null;
    const city = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase())
    return city ? { lat: city.lat, lng: city.lng } : null
  }, [])

  // === GESTION DES FAVORIS ===
  const [favorites, setFavorites] = useState([])

  // === GESTION DES PRODUITS ===
  const [products, setProducts] = useState(() => cacheService.get('products') || [])

  const getProductById = (productId) => {
    return products.find(p => p.id === productId)
  }

  const addProduct = async (itemData) => {
    if (!initialized || !db) return { success: false, error: "Base de données non prête." };
    try {
      const newItemData = {
        ...itemData,
        type: itemData.type || 'product',
        createdAt: serverTimestamp()
      };
      // On sauvegarde tout dans la collection 'products' pour l'unification
      await addDoc(collection(db, 'products'), newItemData);
      return { success: true };
    } catch (error) {
      console.error("Erreur ajout item:", error);
      return { success: false, error: error.message || "Erreur lors de l'ajout de l'annonce." };
    }
  }

  const updateProduct = async (itemId, itemData) => {
    if (!initialized || !db) return { success: false, error: "Base de données non prête." };
    try {
      await updateDoc(doc(db, 'products', itemId), itemData);
      return { success: true };
    } catch (error) {
      console.error("Erreur mise à jour item:", error);
      return { success: false, error: error.message || "Erreur lors de la mise à jour." };
    }
  }

  const deleteProduct = async (itemId) => {
    if (!initialized || !db) return { success: false, error: "Base de données non prête." };
    try {
      await deleteDoc(doc(db, 'products', itemId));
      return { success: true };
    } catch (error) {
      console.error("Erreur suppression item:", error);
      return { success: false, error: "Erreur lors de la suppression." };
    }
  }

  const decrementProductStock = async (productId, quantity = 1) => {
    if (!initialized || !db) return { success: false };
    try {
      const { increment } = await import('firebase/firestore')
      const productRef = doc(db, 'products', productId)
      await updateDoc(productRef, {
        stock: increment(-quantity)
      })
      return { success: true }
    } catch (error) {
      console.error("Erreur décrémentation stock:", error)
      return { success: false }
    }
  }

  // === GESTION DES SERVICES ===
  // Les services sont maintenant dérivés dynamiquement et en temps réel
  const services = useMemo(() => products.filter(p => p.type === 'service'), [products])

  // Obsolete: utilisez addProduct avec type: 'service'
  const addService = addProduct

  // Obsolete: utilisez updateProduct
  const updateService = updateProduct

  // Obsolete: utilisez deleteProduct
  const deleteService = deleteProduct

  const getServiceById = (id) => services.find(s => s.id === id)

  // === GESTION DU PANIER ===
  const [cart, setCart] = useState([])
  const [isStorageLoaded, setIsStorageLoaded] = useState(false)

  // === GESTION DES MESSAGES ===
  const [messages, setMessages] = useState(() => {
    return []
  })

  const [conversations, setConversations] = useState(() => {
    return []
  })

  // === GESTION DES COMMANDES ===
  const [orders, setOrders] = useState(() => {
    return []
  })

  // === GESTION DES SIGNALEMENTS ===
  const [productReports, setProductReports] = useState(() => {
    return []
  })

  // === GESTION DES NOTIFICATIONS ADMIN ===
  const [adminNotifications, setAdminNotifications] = useState(() => {
    return []
  })

  // === GESTION DES AVIS ===
  const [reviews, setReviews] = useState([])

  // === GESTION DES UTILISATEURS ===
  const [allUsers, setAllUsers] = useState([])

  // Synchronisation Firebase
  useEffect(() => {
    if (!initialized || !db) return

    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100))
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt || new Date().toISOString()),
          promotionEndDate: data?.promotionEndDate?.toDate ? data.promotionEndDate.toDate().toISOString() : data?.promotionEndDate
        };
      })
      setProducts(productsData);
      cacheService.set('products', productsData);
      setDataLoading(prev => ({ ...prev, products: false, services: false })); // services unifié avec products
    }, (error) => {
      setErrors(prev => ({ ...prev, products: "Impossible de charger les produits." }));
      console.error("Erreur chargement produits:", error);
      setDataLoading(prev => ({ ...prev, products: false, services: false }));
    })

    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(100))
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate()?.toISOString() || new Date().toISOString()
      }))
      setReviews(reviewsData);
    }, (error) => {
      console.error("Erreur chargement avis:", error);
    })

    return () => {
      unsubscribeProducts()
      unsubscribeReviews()
    }
  }, [initialized, db])

  // Synchronisation Firebase (Données Sécurisées Privées)
  useEffect(() => {
    if (!initialized || !db) return

    let unsubscribeUsers = () => { }
    let unsubscribeOrders = () => { }

    const currentUser = seller || user

    if (currentUser?.isAdmin) {
      // Admin : On charge tout
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate()?.toISOString() || '',
          lastLogin: doc.data()?.lastLogin?.toDate()?.toISOString() || ''
        }))
        setAllUsers(usersData);
        setDataLoading(prev => ({ ...prev, users: false }));
      }, () => setDataLoading(prev => ({ ...prev, users: false })))

      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100))
      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        }))
        setOrders(ordersData);
        setDataLoading(prev => ({ ...prev, orders: false }));
      }, () => setDataLoading(prev => ({ ...prev, orders: false })))

    } else if (currentUser) {
      // FIX : Un vendeur peut aussi être acheteur. On écoute ses achats ET ses ventes.
      const ordersQuery = query(collection(db, 'orders'),
        or(
          where('sellerId', '==', currentUser.uid),
          where('buyerId', '==', currentUser.uid)
        ),
        orderBy('createdAt', 'desc'),
        limit(100)
      )

      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Tri côté client pour éviter de forcer un Index Firebase

        setOrders(ordersData);
        setDataLoading(prev => ({ ...prev, orders: false, users: false }));
      }, () => setDataLoading(prev => ({ ...prev, orders: false, users: false })))
    } else {
      // Non connecté
      setDataLoading(prev => ({ ...prev, orders: false, users: false }));
    }

    return () => {
      unsubscribeUsers()
      unsubscribeOrders()
    }
  }, [initialized, db, seller, user])

  // Chargement asynchrone sécurisé du panier et favoris
  useEffect(() => {
    const loadLocalData = async () => {
      const savedCart = await loadSecureCart()
      if (savedCart) setCart(savedCart)

      const savedFavs = await secureGetItem('BoutiKonect_favorites', true)
      if (savedFavs) setFavorites(savedFavs)

      setIsStorageLoaded(true)

      // Nettoyage des anciennes clés en clair
      localStorage.removeItem('BoutiKonect_cart')
      localStorage.removeItem('BoutiKonect_favorites')
    }
    loadLocalData()
  }, [])

  // Persistance du panier et des favoris
  useEffect(() => {
    if (isStorageLoaded) saveSecureCart(cart);
  }, [cart, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) secureSetItem('BoutiKonect_favorites', favorites, true);
  }, [favorites, isStorageLoaded]);


  // Gestion des utilisateurs supprimes
  const [deletedUserIds, setDeletedUserIds] = useState(() => {
    return []
  })

  // === FONCTIONS D'INSCRIPTION / CONNEXION ===
  const registerUser = async (userData) => {
    // Utiliser authService.js registerUser
    const result = await import('../services/authService').then(module => module.registerUser(userData))
    return result
  };

  const registerSeller = (userData) => registerUser(userData)
  const registerBuyer = (userData) => registerUser(userData)

  const loginUser = async (email, password, rememberMe = true) => {
    const result = await import('../services/authService').then(module => module.loginUser(email, password, rememberMe))

    if (result.success) {
      const userData = result.user
      if (userData.isSeller) setSeller(userData)
      else setUser(userData)
      return { success: true, user: userData, isAdmin: userData.isAdmin }
    }

    if (result.mfaRequired) {
      return {
        success: false,
        mfaRequired: true,
        mfaType: result.mfaType,
        uid: result.uid,
        email: result.email,
        resolver: result.resolver,
        hints: result.hints
      }
    }

    return { success: false, error: result.error }
  };

  const logoutUser = () => {
    authLogoutUser()
    setUser(null)
    setSeller(null)
  }

  // Promotion de produit
  const promoteProduct = async (productId, duration) => {
    const product = getProductById(productId);
    const currentUser = seller || user;

    if (!product || !currentUser) {
      return { success: false, error: "Produit ou utilisateur introuvable." };
    }

    try {
      const planMap = {
        'threeDays': PROMOTION_PRICES.threeDays,
        'week': PROMOTION_PRICES.week,
        'month': PROMOTION_PRICES.month
      };
      let plan = null;
      if (duration === 'threeDays' || duration === 3) plan = PROMOTION_PRICES.threeDays;
      if (duration === 'week' || duration === 7) plan = PROMOTION_PRICES.week;
      if (duration === 'month' || duration === 30) plan = PROMOTION_PRICES.month;

      if (!plan) return { success: false, error: "Durée de promotion invalide." };

      const { createPromotionCheckoutSession, initFedaPay, confirmPromotionPayment } = await import('../services/paymentService');
      const sessionRes = await createPromotionCheckoutSession(product, plan, currentUser);

      if (!sessionRes.success) return sessionRes;

      return new Promise((resolve) => {
        initFedaPay({
          transaction: sessionRes.data.transaction,
          customer: sessionRes.data.customer,
          onSuccess: async (transaction) => {
            // Activation immédiate côté client pour le confort utilisateur
            await activatePromotionInstant(productId, plan.days);
            const confirmRes = await confirmPromotionPayment(productId, plan, currentUser.uid, transaction.id);
            resolve(confirmRes);
          },
          onCancel: () => resolve({ success: false, error: "Le paiement a été annulé par l'utilisateur." })
        });
      });
    } catch (error) {
      console.error("Erreur système de paiement:", error);
      return { success: false, error: "Erreur lors de l'initialisation du paiement." };
    }
  }

  // Activation instantanée (côté client) pour le retour FedaPay
  const activatePromotionInstant = async (productId, days) => {
    if (!db) return { success: false };
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      
      await updateDoc(doc(db, 'products', productId), {
        isPromoted: true,
        promotionEndDate: endDate,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Erreur activation instantanée:", error);
      return { success: false };
    }
  }

  const getPromotedProducts = useCallback(() => {
    const now = new Date().toISOString()
    // Retourne tout ce qui est promu (produits ET services)
    return products
      .filter(p => p.isPromoted && p.promotionEndDate && p.promotionEndDate > now)
      .sort((a, b) => new Date(b.promotionEndDate) - new Date(a.promotionEndDate))
  }, [products])

  const updateProfile = async (userId, updates) => {
    if (!db) return { success: false, error: "Base de données non prête." };
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      return { success: true };
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      return { success: false, error: "Erreur lors de la mise à jour." };
    }
  }

  const upgradeToSeller = async () => {
    if (user) {
      try {
        // On met à jour le profil dans Firestore
        const result = await updateProfile(user.id, { isSeller: true });
        // Le listener onAuthStateChanged/onSnapshot s'occupera de mettre à jour l'état (user/seller)
        // et de rafraîchir l'interface automatiquement.
        // FIX: Mettre à jour l'état local instantanément pour éviter à l'utilisateur de devoir rafraîchir
        if (result.success) {
          const updatedUser = { ...user, isSeller: true };
          setSeller(updatedUser);
          setUser(null);
          await saveSecureUser(updatedUser); // Mettre à jour le cache sécurisé
        }
        return result.success;
      } catch (err) {
        return false;
      }
    }
    return false
  }

  // === COMMANDES ===
  const createOrder = async (orderData) => {
    if (!initialized || !db) return null;
    try {
      const newOrderData = {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'orders'), newOrderData);
      // On ne met pas à jour l'état local ici, on laisse onSnapshot faire le travail.
      return { id: docRef.id, ...newOrderData };
    } catch (error) {
      console.error("Erreur création commande:", error);
      return null;
    }
  }

  const getSellerOrders = (sellerId) => orders.filter(order => order.sellerId === sellerId)
  const getBuyerOrders = (buyerId) => orders.filter(order => order.buyerId === buyerId)
  const updateOrderStatus = async (orderId, status) => {
    if (!initialized || !db) return;
    try {
      // On ne met pas à jour l'état local ici, on laisse onSnapshot faire le travail.
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      console.error("Erreur mise à jour statut commande:", e);
    }
  }

  // === FAVORIS ===
  const addToFavorites = (productId) => {
    if (!favorites.includes(productId)) setFavorites([...favorites, productId])
  }
  const removeFromFavorites = (productId) => setFavorites(favorites.filter(id => id !== productId))
  const isFavorite = (productId) => favorites.includes(productId)
  const toggleFavorite = (productId) => isFavorite(productId) ? removeFromFavorites(productId) : addToFavorites(productId)
  const getFavoriteProducts = () => products.filter(p => favorites.includes(p.id))
  const getFavoriteServices = () => services.filter(s => favorites.includes(s.id))

  // === PANIER ===
  const addToCart = (product) => {
    const exists = cart.find(item => item.id === product.id)
    if (exists) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }
  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id))
  const updateCartQuantity = (id, quantity) => {
    if (quantity <= 0) removeFromCart(id)
    else setCart(cart.map(item => item.id === id ? { ...item, quantity } : item))
  }
  const clearCart = () => setCart([])
  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  // === MESSAGES ===
  const sendMessage = (senderId, receiverId, productId, text) => {
    const newMessage = { id: Date.now(), senderId, receiverId, productId, text, timestamp: new Date().toISOString(), read: false }
    setMessages([...messages, newMessage])
    return newMessage
  }
  const getMessages = (userId1, userId2) => messages.filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1)).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const getConversations = (userId) => conversations.filter(c => c.buyerId === userId || c.sellerId === userId)

  // === FONCTIONS ADMIN ===
  const reportProduct = async (productId, reason, reporterId) => {
    const newReport = { id: 'report_' + Date.now(), productId, reason, reporterId, status: 'pending', createdAt: new Date().toISOString() }
    if (initialized && db) {
      const docRef = await addDoc(collection(db, 'reports'), { ...newReport, createdAt: serverTimestamp() })
      newReport.id = docRef.id
    }
    setProductReports([...productReports, newReport])
    return newReport
  }

  const getAllReports = () => productReports
  const getReportedProducts = () => {
    const reportedIds = [...new Set(productReports.map(r => r.productId))]
    return products.filter(p => reportedIds.includes(p.id))
  }

  const deleteUser = async (userId) => {
    if (!deletedUserIds.includes(userId)) setDeletedUserIds([...deletedUserIds, userId])
    if (initialized && db) await deleteDoc(doc(db, 'users', userId))
    setAllUsers(allUsers.filter(u => u.id !== userId))
    setProducts(products.filter(p => p.sellerId !== userId))
    return true
  }

  const resolveReport = async (reportId) => {
    if (initialized && db) await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' })
    setProductReports(productReports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r))
  }

  const getAllProducts = () => products
  const getAllOrders = () => orders
  const getAllUsers = () => allUsers

  // === FILTRES - DEFINI AVANT getFilteredProducts ===
  const [filters, setFilters] = useState({
    city: '',
    neighborhood: '',
    category: '', // Utilisé pour produits et services
    priceMin: '',
    priceMax: '',
    search: '',
    promoted: false,
    nearMe: false,
    type: 'all' // all, product, service
  })

  // Filtrage des produits & services unifiés
  const filteredProducts = useMemo(() => {
    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
    const searchTerms = normalize(filters.search).trim().split(/\s+/).filter(t => t.length > 0);

    const filtered = products.filter(item => {
      // Filtre type
      const isService = item.type === 'service';
      if (filters.type === 'product' && isService) return false;
      if (filters.type === 'service' && !isService) return false;
      if (filters.city && item.sellerCity !== filters.city) return false;
      if (filters.neighborhood && item.sellerNeighborhood !== filters.neighborhood) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.priceMin !== '' && item.price !== undefined && item.price < parseInt(filters.priceMin)) return false;
      if (filters.priceMax !== '' && item.price !== undefined && item.price > parseInt(filters.priceMax)) return false;
      if (searchTerms.length > 0) {
        const itemContent = normalize(`${item.title} ${item.description} ${item.sellerName || ''}`);
        if (!searchTerms.every(term => itemContent.includes(term))) return false;
      }
      if (filters.promoted) {
        const isPromoted = item.isPromoted === true || item.isPromoted === 'true';
        if (!isPromoted) return false;
        const promoEnd = item.promotionEndDate ? parseDate(item.promotionEndDate) : null;
        if (!promoEnd || promoEnd < new Date()) return false;
      }
      if (filters.nearMe && userLocation && userLocation.latitude && userLocation.longitude) {
        const cityCoords = getCityCoordinates(item.sellerCity);
        if (cityCoords) {
          const distance = calculateDistance(userLocation.latitude, userLocation.longitude, cityCoords.lat, cityCoords.lng);
          if (distance === null || distance > 50) return false;
        } else return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const aIsPromoted = (a.isPromoted === true || a.isPromoted === 'true') && a.promotionEndDate && parseDate(a.promotionEndDate) > new Date();
      const bIsPromoted = (b.isPromoted === true || b.isPromoted === 'true') && b.promotionEndDate && parseDate(b.promotionEndDate) > new Date();
      if (aIsPromoted && !bIsPromoted) return -1;
      if (!aIsPromoted && bIsPromoted) return 1;
      return parseDate(b.createdAt) - parseDate(a.createdAt);
    });
  }, [products, filters, userLocation, getCityCoordinates, calculateDistance, parseDate]);

  const filteredServices = useMemo(() => {
    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
    const searchTerms = normalize(filters.search).trim().split(/\s+/).filter(t => t.length > 0);

    const filtered = products.filter(item => {
      if (item.type !== 'service') return false;
      if (filters.city && item.sellerCity !== filters.city) return false;
      if (filters.neighborhood && item.sellerNeighborhood !== filters.neighborhood) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.priceMin !== '' && item.price !== undefined && item.price < parseInt(filters.priceMin)) return false;
      if (filters.priceMax !== '' && item.price !== undefined && item.price > parseInt(filters.priceMax)) return false;
      if (searchTerms.length > 0) {
        const itemContent = normalize(`${item.title} ${item.description} ${item.sellerName || ''}`);
        if (!searchTerms.every(term => itemContent.includes(term))) return false;
      }
      if (filters.promoted) {
        const isPromoted = item.isPromoted === true || item.isPromoted === 'true';
        if (!isPromoted) return false;
        const promoEnd = item.promotionEndDate ? parseDate(item.promotionEndDate) : null;
        if (!promoEnd || promoEnd < new Date()) return false;
      }
      if (filters.nearMe && userLocation && userLocation.latitude && userLocation.longitude) {
        const cityCoords = getCityCoordinates(item.sellerCity);
        if (cityCoords) {
          const distance = calculateDistance(userLocation.latitude, userLocation.longitude, cityCoords.lat, cityCoords.lng);
          if (distance === null || distance > 50) return false;
        } else return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const aIsPromoted = (a.isPromoted === true || a.isPromoted === 'true') && a.promotionEndDate && parseDate(a.promotionEndDate) > new Date();
      const bIsPromoted = (b.isPromoted === true || b.isPromoted === 'true') && b.promotionEndDate && parseDate(b.promotionEndDate) > new Date();
      if (aIsPromoted && !bIsPromoted) return -1;
      if (!aIsPromoted && bIsPromoted) return 1;
      return parseDate(b.createdAt) - parseDate(a.createdAt);
    });
  }, [products, filters, userLocation, getCityCoordinates, calculateDistance, parseDate]);

  // Fonction pour obtenir les produits filtrés (exportée pour compatibilité)
  const getFilteredProducts = useCallback(() => {
    return filteredProducts
  }, [filteredProducts])

  // Fonction pour obtenir les services filtrés
  const getFilteredServices = useCallback(() => {
    return filteredServices
  }, [filteredServices])

  const value = {
    seller, user, favorites, products, cart, messages, conversations, orders,
    services, reviews,
    filters, cities, categories, serviceCategories, productReports, allUsers,
    userLocation, locationError, authLoading, dataLoading, errors,
    rememberMe, setRememberMe, // Export pour éviter le crash sur la page Login
    setUser, setSeller,

    registerUser, registerSeller, registerBuyer, loginUser, logoutUser, logoutSeller: logoutUser,
    addToFavorites, removeFromFavorites, isFavorite, toggleFavorite, getFavoriteProducts, getFavoriteServices,
    filteredProducts, getFilteredProducts,
    filteredServices, getFilteredServices,
    addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal,
    addService, updateService, deleteService, getServiceById,
    updateProfile, upgradeToSeller,
    createOrder, getSellerOrders, getBuyerOrders, updateOrderStatus,
    decrementProductStock,
    formatPrice,
    sendMessage, getMessages, getConversations, setFilters,

    reportProduct, getAllReports, getReportedProducts, deleteUser, getProductById, addProduct, updateProduct, deleteProduct,
    getAllProducts, getAllOrders, getAllUsers, resolveReport,

    // Fonctions geolocalisation
    getCurrentLocation, clearUserLocation, calculateDistance, getCityCoordinates,

    // Fonctions promotion
    promoteProduct, activatePromotionInstant, getPromotedProducts, PROMOTION_PRICES,
    parseDate,

    // MFA & Sécurité (Natif Firebase)
    checkIsAdmin,
    updateEmailWithVerification: async (email) => {
      const { updateEmailWithVerification } = await import('../services/authService')
      return updateEmailWithVerification(email)
    },
    resetPassword: async (email) => {
      const { sendPasswordResetEmail } = await import('../services/authService')
      return sendPasswordResetEmail(email)
    }
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
