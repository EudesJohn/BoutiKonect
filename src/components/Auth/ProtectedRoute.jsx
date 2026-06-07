import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { user, seller, authLoading } = useContext(AppContext);
  const location = useLocation();

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>Chargement en cours...</div>;
  }

  if (!user && !seller) {
    // Redirige vers la page de connexion tout en sauvegardant l'URL tentée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
