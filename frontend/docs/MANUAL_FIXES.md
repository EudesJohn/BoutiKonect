# Corrections à Appliquer Manuellement

## Fichier: src/context/AppContext.jsx

### Bug 1: Nettoyage des sessions au démarrage
**Ligne ~130** - Remplacer:
```javascript
// Nettoyer les sessions au demarrage
useEffect(() => {
  localStorage.removeItem('boutique1_user')
  localStorage.removeItem('boutique1_seller')
  localStorage.setItem('boutique1_remember_me', 'false')
}, [])
```

**Par:**
```javascript
// Restaurer la session au demarrage si rememberMe est actif
useEffect(() => {
  const savedSeller = localStorage.getItem('boutique1_seller')
  const savedUser = localStorage.getItem('boutique1_user')
  const remember = localStorage.getItem('boutique1_remember_me')
  
  if (remember === 'true') {
    if (savedSeller) {
      try {
        const sellerData = JSON.parse(savedSeller)
        setSeller(sellerData)
        console.log('✅ Session vendeur restaurée')
      } catch (e) {
        console.error('Erreur restauration session:', e)
      }
    } else if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        console.log('✅ Session utilisateur restaurée')
      } catch (e) {
        console.error('Erreur restauration session:', e)
      }
    }
  }
}, [])
```

---

## Fichier: src/pages/Login/Login.jsx

### Bug 2: Remember Me non utilisé
**Ajouter après la fonction handleSubmit:**

```javascript
// Gérer rememberMe
useEffect(() => {
  localStorage.setItem('boutique1_remember_me', rememberMe.toString())
}, [rememberMe])
```

**Dans handleSubmit, ajouter après la connexion:**
```javascript
// Sauvegarder la session
if (rememberMe) {
  localStorage.setItem('boutique1_remember_me', 'true')
  if (result.user.isSeller) {
    localStorage.setItem('boutique1_seller', JSON.stringify(result.user))
  } else {
    localStorage.setItem('boutique1_user', JSON.stringify(result.user))
  }
}
```

---

## Fichier: src/pages/Products/Products.jsx

### Bug 3: Filtre nearMe non fonctionnel
**Rechercher la fonction getFilteredProducts et ajouter:**

```javascript
// Appliquer le filtre nearMe
if (debouncedFilters.nearMe && userLocation) {
  results = results.filter(p => {
    // Calculer la distance si les coordonnées du vendeur sont disponibles
    if (p.sellerLat && p.sellerLng) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        p.sellerLat,
        p.sellerLng
      )
      // Afficher les produits dans un rayon de 50km
      return distance !== null && distance <= 50
    }
    return false
  })
}
```

---

## Fichier: src/context/AppContext.jsx

### Bug 4: Sauvegarder rememberMe correctement
**Rechercher:**
```javascript
useEffect(() => { localStorage.setItem('boutique1_favorites', JSON.stringify(favorites)) }, [favorites])
```

**Ajouter APRÈS:**
```javascript
useEffect(() => { 
  localStorage.setItem('boutique1_remember_me', rememberMe ? 'true' : 'false') 
}, [rememberMe])
```

---

## Résumé des corrections

| Bug | Fichier | Description |
|-----|---------|-------------|
| 1 | AppContext.jsx | Session effacée au lieu d'être restaurée |
| 2 | Login.jsx | Remember Me non fonctionnel |
| 3 | Products.jsx | Filtre nearMe non implémenté |
| 4 | AppContext.jsx | rememberMe non sauvegardé |

Appliquez ces corrections manuellement dans votre projet.
