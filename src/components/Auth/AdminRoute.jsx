import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

export default function AdminRoute({ children }) {
  const { user, seller, authLoading, checkIsAdmin } = useContext(AppContext);

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>Chargement en cours...</div>;
  }

  const isAdminUser = checkIsAdmin(seller) || checkIsAdmin(user);

  if (!isAdminUser) {
    // Redirige à l'accueil si non autorisé
    return <Navigate to="/" replace />;
  }

  return children;
}
