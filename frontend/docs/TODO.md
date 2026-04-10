# TODO - Ajout Publication Services

## Plan Approuvé
Listings unifiés (`products` + `type: 'product'|'service'`).  
Services: `duration` (1h/4h/1j/sem), `availability` (bool).

## Steps (à cocher après chaque)

- [ ] **1. Edit `pages/Publish/Publish.jsx`** : type toggle + conditional fields (duration/availability)
- [ ] **2. Edit `context/AppContext.jsx`** : addProduct() gère `type`
- [ ] **3. Edit `pages/Products/Products.jsx`** : filtre type (Tous/Produits/Services)
- [ ] **4. Edit `components/ProductCard/ProductCard.jsx`** : badges/buttons adaptés service
- [ ] **5. Edit `pages/ProductDetail/ProductDetail.jsx`** : UI service (RDV vs panier)
- [ ] **6. Test complet** : `npm run dev`, publish/view/filter service
- [ ] **7. Sample data** : ajouter service exemple dans db.json

## Status
**Prêt pour Step 1.** Mise à jour après chaque ✓.
