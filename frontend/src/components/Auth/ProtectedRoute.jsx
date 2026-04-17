import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { user, seller, authLoading } = useContext(AppContext);
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="auth-loading-screen" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: 'var(--bg-dark)',
        gap: '20px'
      }}>
        <div className="loader-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '3px solid rgba(138, 43, 226, 0.1)', 
          borderTopColor: 'var(--primary)', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ color: 'var(--text-light)', fontWeight: '500', letterSpacing: '1px' }}>Sécurisation de la session...</p>
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
