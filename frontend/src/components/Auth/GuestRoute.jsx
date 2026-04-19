import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

export default function GuestRoute({ children }) {
  const { user, seller, authLoading } = useContext(AppContext);

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>Chargement en cours...</div>;
  }

  if (user || seller) {
    return <Navigate to="/" replace />;
  }

  return children;
}
