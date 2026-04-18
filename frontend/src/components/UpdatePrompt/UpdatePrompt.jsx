import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Download, X } from 'lucide-react';
import './UpdatePrompt.css';

const UpdatePrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
      // Optionnel : vérifier les mises à jour périodiquement
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000); // Toutes les heures
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  const isMobile = window.innerWidth <= 768;

  return (
    <div className={`update-prompt-container ${needRefresh ? 'mandatory' : ''}`}>
      <div className="update-prompt-card">
        <div className="update-prompt-header">
          <div className="update-icon-wrapper">
            <RefreshCw className="update-icon" />
          </div>
          <h3>Mise à jour disponible</h3>
        </div>
        
        <div className="update-prompt-body">
          <p>
            {needRefresh 
              ? "Une nouvelle version de BoutiKonect est prête. Installez-la maintenant pour profiter des dernières corrections et fonctionnalités."
              : "L'application est prête à être utilisée hors-ligne !"}
          </p>
          
          {needRefresh && (
            <div className="update-features">
              <span>✅ Correction Assistant IA</span>
              <span>✅ Amélioration Mobile</span>
              <span>✅ Sécurité renforcée</span>
            </div>
          )}
        </div>

        <div className="update-prompt-actions">
          {needRefresh ? (
            <button 
              className="update-btn primary" 
              onClick={() => updateServiceWorker(true)}
            >
              <Download size={18} />
              Mettre à jour maintenant
            </button>
          ) : (
            <button className="update-btn secondary" onClick={close}>
              Fermer
            </button>
          )}
          
          {/* Uniquement fermable si ce n'est pas forcé ou si c'est juste "prêt hors-ligne" */}
          {!needRefresh && (
            <button className="close-icon-btn" onClick={close}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
