# Plan d'Implémentation - MaBoutique.bj

## Résumé des Fonctionnalités Demandées

1. **Géolocalisation** - Accès à la localisation pour proposer les produits à proximité
2. **Moyen de paiement** - Intégration d'un système de paiement
3. **Promotion de produits** - Système de mise en vedette avec tarification:
   - 1 semaine = 1000FCFA
   - 2 semaines = 1700FCFA
   - 1 mois = 3000FCFA
4. **Filtrage par prix** - Déjà existant dans Products.jsx

---

## Détails du Plan

### 1. Géolocalisation (Priority: HIGH)

**Fichiers à modifier:**
- `src/context/AppContext.jsx` - Ajouter état et fonctions de localisation
- `src/components/Navbar/Navbar.jsx` - Bouton de localisation
- `src/pages/Products/Products.jsx` - Filtrage par proximité

**Fonctionnalités:**
- Demander permission de localisation via API Geolocation
- Stocker position utilisateur (latitude, longitude)
- Calculer distance avec les produits/vendeurs
- Afficher produits par ordre de proximité
- Ajouter filtre "Produits près de chez moi"

---

### 2. Système de Paiement (Priority: HIGH)

**Approche:** Paiement Mobile Money (OM/Moov) via USSD ou Intégration

**Fichiers à créer:**
- `src/services/paymentService.js` - Service de paiement
- `src/pages/Payment/Payment.jsx` - Page de paiement
- `src/pages/Payment/Payment.css` - Styles

**Fonctionnalités:**
- Intégration avec API de paiement (Stripe, Flutterwave, ou paiement local)
- Génération de facture
- Confirmation de paiement
- Notification au vendeur

---

### 3. Promotion de Produits / Mise en Vedette (Priority: HIGH)

**Fichiers à modifier:**
- `src/context/AppContext.jsx` - Ajouter état pour produits vedettes
- `src/pages/Publish/Publish.jsx` - Ajouter option promotion
- `src/pages/MyProducts/MyProducts.jsx` - Gérer promotions
- `src/components/ProductCard/ProductCard.jsx` - Badge "Vedette"
- `src/pages/Products/Products.jsx` - Filtre vedette
- `db.json` - Schema mise à jour

**Schema produit à ajouter:**
```json
{
  "isPromoted": false,
  "promotionStartDate": null,
  "promotionEndDate": null,
  "promotionDuration": null  // "week", "twoWeeks", "month"
}
```

**Prix de promotion:**
- 1 semaine: 1000 XOF
- 2 semaines: 1700 XOF  
- 1 mois: 3000 XOF

---

### 4. Filtre par Prix (Priority: MEDIUM)

**Statut:** Déjà implémenté dans Products.jsx
- Filtre prix min/max disponible
- Fonctionne correctement

---

## Ordre d'Implémentation Suggéré

1. **Phase 1:** Géolocalisation
2. **Phase 2:** Système de promotion/vedette
3. **Phase 3:** Paiement
4. **Phase 4:** Tests et refinements

---

## Fichiers à Modifier/Créer

### À créer:
- `src/services/paymentService.js`
- `src/pages/Payment/Payment.jsx`
- `src/pages/Payment/Payment.css`
- `src/components/LocationModal/LocationModal.jsx`
- `src/components/LocationModal/LocationModal.css`

### À modifier:
- `src/context/AppContext.jsx`
- `src/components/Navbar/Navbar.jsx`
- `src/components/Navbar/Navbar.css`
- `src/pages/Products/Products.jsx`
- `src/pages/Products/Products.css`
- `src/pages/Publish/Publish.jsx`
- `src/pages/Publish/Publish.css`
- `src/pages/MyProducts/MyProducts.jsx`
- `src/components/ProductCard/ProductCard.jsx`
- `src/components/ProductCard/Product `src/App.jsx` (routes)
- `db.json`

Card.css`
----

## Suivi

- Créer TODO.md avec les tâches détaillées
- Tester chaque fonctionnalité
- Mettre à jour la documentation

