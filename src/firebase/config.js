import { initializeApp } from 'firebase/app'
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAnalytics } from 'firebase/analytics'

// Configuration Firebase
const firebaseConfig = {  
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser Firestore avec cache PERSISTANT et MULTI-ONGLETS
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

const auth = getAuth(app)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

// Activer la persistance de l'Auth immédiatement
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err))

// App Check initialization
if (import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

const initialized = true;

export { app, db, auth, analytics, initialized }

// Fonction pour vérifier si Firebase est prêt
export const isFirebaseReady = () => {
  return initialized && db !== undefined
}

// Fonction pour obtenir le statut de configuration
export const getFirebaseConfigStatus = () => {
  return {
    isConfigured: true,
    isInitialized: initialized,
    missingFields: []
  }
}


