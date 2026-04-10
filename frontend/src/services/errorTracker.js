import React from 'react'

/**
 * Service de surveillance des erreurs
 * Gère le tracking des erreurs et l'intégration avec Sentry
 */

// Configuration Sentry (optionnelle)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
let sentryInitialized = false

// Tableau des erreurs récentes
let errorLog = []
const MAX_ERRORS = 50

// Callbacks pour les listeners d'erreurs
let errorListeners = []

/**
 * Initialise Sentry si configuré
 */
export const initSentry = async () => {
  if (!SENTRY_DSN) {
    console.log('ℹ️ Sentry non configuré (VITE_SENTRY_DSN manquant)')
    return false
  }

  try {
    // Dynamic import de Sentry
    const Sentry = await import('@sentry/browser')
    
    await Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE || 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false
        })
      ],
      // Performance monitoring
      tracesSampleRate: 0.1,
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 0.1
    })

    sentryInitialized = true
    console.log('✅ Sentry initialisé avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur initialisation Sentry:', error)
    return false
  }
}

/**
 * Capture une erreur et l'envoie à Sentry
 */
export const captureError = (error, context = {}) => {
  // Logger localement
  const errorEntry = {
    id: `err_${Date.now()}`,
    message: error.message || String(error),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // Ajouter au log local
  errorLog.unshift(errorEntry)
  if (errorLog.length > MAX_ERRORS) {
    errorLog.pop()
  }

  // Envoyer aux listeners
  errorListeners.forEach(listener => {
    try {
      listener(errorEntry)
    } catch (e) {
      console.error('Erreur dans le listener:', e)
    }
  })

  // Envoyer à Sentry si disponible
  if (sentryInitialized) {
    import('@sentry/browser').then(Sentry => {
      Sentry.captureException(error, {
        extra: context
      })
    }).catch(() => {})
  } else {
    // Logger dans la console en développement
    console.error('Erreur capturée:', errorEntry)
  }

  return errorEntry.id
}

/**
 * Capture un message (non-erreur)
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (sentryInitialized) {
    import('@sentry/browser').then(Sentry => {
      Sentry.captureMessage(message, level, { extra: context })
    }).catch(() => {})
  }
  
  console.log(`[${level.toUpperCase()}] ${message}`, context)
}

/**
 * Ajoute des données de contexte utilisateur
 */
export const setUserContext = (user) => {
  if (sentryInitialized) {
    import('@sentry/browser').then(Sentry => {
      Sentry.setUser({
        id: user?.id,
        email: user?.email,
        username: user?.name
      })
    }).catch(() => {})
  }
}

/**
 * Ajoute des tags personnalisés
 */
export const setTags = (tags) => {
  if (sentryInitialized) {
    import('@sentry/browser').then(Sentry => {
      Object.entries(tags).forEach(([key, value]) => {
        Sentry.setTag(key, value)
      })
    }).catch(() => {})
  }
}

/**
 * Ajoute des données supplémentaires
 */
export const setExtra = (data) => {
  if (sentryInitialized) {
    import('@sentry/browser').then(Sentry => {
      Object.entries(data).forEach(([key, value]) => {
        Sentry.setExtra(key, value)
      })
    }).catch(() => {})
  }
}

/**
 * Ajoute un listener pour les erreurs
 */
export const onError = (callback) => {
  errorListeners.push(callback)
  return () => {
    errorListeners = errorListeners.filter(cb => cb !== callback)
  }
}

/**
 * Récupère le log des erreurs
 */
export const getErrorLog = () => errorLog

/**
 * Efface le log des erreurs
 */
export const clearErrorLog = () => {
  errorLog = []
}

/**
 * Crée un wrapper pour capturer les erreurs de fonctions async
 */
export const withErrorTracking = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error, context)
      throw error
    }
  }
}

/**
 * Crée un HOC pour capturer les erreurs de composant React
 */
export const withErrorBoundary = (Component, errorFallback) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props)
      this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
      // FIX: 'context' n'existe pas dans ce scope.
      captureError(error, {
        componentStack: errorInfo.componentStack,
        source: 'ErrorBoundary'
      })
    }

    render() {
      if (this.state.hasError) {
        if (errorFallback) {
          return errorFallback(this.state.error)
        }
        return <div>Une erreur s'est produite</div>
      }
      return <Component {...this.props} />
    }
  }
}

/**
 * Hook React pour utiliser le tracker d'erreurs
 */
export const useErrorTracker = () => {
  const trackError = (error, context) => captureError(error, context)
  const trackMessage = (message, level, context) => captureMessage(message, level, context)
  
  return {
    trackError,
    trackMessage,
    errorLog,
    setUserContext,
    setTags,
    setExtra
  }
}

export default {
  initSentry,
  captureError,
  captureMessage,
  setUserContext,
  setTags,
  setExtra,
  onError,
  getErrorLog,
  clearErrorLog,
  withErrorTracking,
  withErrorBoundary,
  useErrorTracker
}
