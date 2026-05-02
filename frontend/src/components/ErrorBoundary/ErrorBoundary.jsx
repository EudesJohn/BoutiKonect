import React from 'react'

/**
 * ErrorBoundary — Isole les pannes de composants React pour éviter
 * qu'une erreur dans un sous-arbre ne fasse crasher toute l'application.
 *
 * Usage :
 *   <ErrorBoundary fallback={<p>Quelque chose s'est mal passé.</p>}>
 *     <MonComposant />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Erreur capturée :', error, errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '2rem',
          fontFamily: 'Inter, sans-serif', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ margin: '0 0 0.5rem', color: '#1a1a2e' }}>
            Une erreur inattendue s'est produite
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Cette section a rencontré un problème. Vos données ne sont pas affectées.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.75rem 1.5rem', background: '#6c63ff', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: 600
            }}
          >
            Réessayer
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', color: '#999', fontSize: '0.85rem' }}>
                Détails de l'erreur (dev uniquement)
              </summary>
              <pre style={{
                background: '#f5f5f5', padding: '1rem', borderRadius: '6px',
                fontSize: '0.75rem', overflow: 'auto', marginTop: '0.5rem'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
