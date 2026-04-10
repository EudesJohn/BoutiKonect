import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState('other');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. Détecter si l'application est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    // 2. Détecter la plateforme
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // 3. Ne pas afficher si déjà installé ou si l'utilisateur a déjà fermé la bannière ce jour-là
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const isRecentlyDismissed = dismissedDate && (new Date() - dismissedDate < 24 * 60 * 60 * 1000);

    if (isStandalone || isRecentlyDismissed) {
      return;
    }

    // 4. Gérer l'événement d'installation pour Android/Chrome
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    // 5. Pour iOS, on affiche après un petit délai (car pas d'événement auto)
    if (isIOS) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Pour mobile en général, si on ne peut pas compter sur beforeinstallprompt (ex: Firefox Android)
    // on pourrait aussi forcer l'affichage mais restons sur du standard propre
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', new Date().toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt-container">
      <div className="pwa-prompt-card">
        <button className="pwa-close-btn" onClick={handleClose}>
          <X size={18} />
        </button>
        
        <div className="pwa-content">
          <div className="pwa-icon-wrapper">
            <img src="/apple-icon-180.png" alt="App Icon" className="pwa-app-icon" />
          </div>
          
          <div className="pwa-text">
            <h4 className="pwa-title">Installer BoutiKonect</h4>
            <p className="pwa-desc">
              Ajoutez l'application sur votre écran d'accueil pour une expérience plus rapide.
            </p>
          </div>
        </div>

        {platform === 'ios' ? (
          <div className="pwa-ios-instructions">
            <p>
              Appuyez sur <Share size={18} className="inline-icon" /> puis sur 
              <strong> "Sur l'écran d'accueil"</strong> <PlusSquare size={18} className="inline-icon" />
            </p>
          </div>
        ) : (
          <button className="pwa-install-btn" onClick={handleInstallClick}>
            <Download size={18} />
            Installer maintenant
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
