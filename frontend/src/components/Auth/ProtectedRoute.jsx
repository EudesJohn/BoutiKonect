import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { user, seller, authLoading, isAppReady } = useContext(AppContext);
  const location = useLocation();

  if (!isAppReady) {
    return null; // Don't show anything or a tiny spinner, App.jsx handles the Splash
  }

  if (authLoading) {
    return (
      <div className="auth-loading-screen" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#0d1b2a',
        gap: '20px'
      }}>
        <div className="loader-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid rgba(255, 255, 255, 0.05)', 
          borderTopColor: '#FF6A00', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ color: 'var(--text-light)', fontWeight: '500', fontSize: '14px', letterSpacing: '0.5px' }}>Vérification de l'identité...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user && !seller) {
    // Redirige vers la page de connexion tout en sauvegardant l'URL tentée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
