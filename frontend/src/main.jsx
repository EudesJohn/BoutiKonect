import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

// VitePWA gère l'enregistrement du Service Worker automatiquement.
// On écoute uniquement le changement de controller pour forcer le refresh.
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const root = createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>
);

