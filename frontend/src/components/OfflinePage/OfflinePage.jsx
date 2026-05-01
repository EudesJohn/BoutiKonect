import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const OfflinePage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          margin: '0 auto 30px'
        }}>
          <WifiOff size={48} color="#FF6A00" />
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '15px', color: '#FF6A00' }}>Connexion perdue</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '400px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Oups ! Il semble que vous n'êtes pas connecté à Internet. 
          BoutiKonect nécessite une connexion active pour fonctionner correctement.
        </p>

        <button 
          onClick={handleRetry}
          style={{
            background: 'linear-gradient(135deg, #FF6A00 0%, #FF8C00 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 30px',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 auto',
            boxShadow: '0 10px 20px rgba(255, 106, 0, 0.3)'
          }}
        >
          <RefreshCw size={20} />
          Réessayer
        </button>
      </motion.div>
    </div>
  );
};

export default OfflinePage;
