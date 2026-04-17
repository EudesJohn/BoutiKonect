console.log('main.jsx is loading...');
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'
// import './pwa.js'

// Forcer la mise à jour du Service Worker si une nouvelle version est disponible
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update()
    })
  })
}

const root = createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>
);

// Signaler que l'application est prête
// La suppression du loader est maintenant gérée par AppContext une fois les données reçues
if (window.hideAppLoader) {
  // Supprimé: l'appel immédiat
}
