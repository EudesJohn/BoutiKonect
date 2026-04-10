# Boutique1 - Plateforme E-commerce Type Alibaba

## 1. Aperçu du Projet

**Nom du projet:** Boutique1  
**Type:** Application Web E-commerce  
**Résumé:** Plateforme de marketplace permettant aux vendeurs de publier leurs produits et aux acheteurs d'acheter sans créer de compte, avec un filtrage par proximité géographique.  
**Utilisateurs cibles:** Vendeurs locaux et acheteurs cherchant des produits de proximité.

---

## 2. Spécification UI/UX

### Structure des Pages

1. **Page d'accueil** - Accueil avec hero illuminé, catégories, produits populaires
2. **Page Produits** - Liste des produits avec filtres (proximité, catégorie, prix)
3. **Page Détail Produit** - Fiche produit avec photos, description, bouton d'achat
4. **Page Publication** - Formulaire pour publier un produit (réservé aux vendeurs identifiés)
5. **Page Inscription Vendeur** - Formulaire avec localisation (ville, quartier)
6. **Page Panier** - Panier d'achats

### Design Alibaba - Palette Couleurs

| Élément | Couleur | Code |
|---------|---------|------|
| Primary (Alibaba Orange) | Orange vif | `#FF6A00` |
| Secondary | Bleu Alibaba | `#00A2E8` |
| Background | Blanc éclatant | `#FFFFFF` |
| Text Primary | Gris foncé | `#333333` |
| Accent/Lumière | Or lumineux | `#FFD700` |
| Success | Vert | `#00C853` |
| Danger | Rouge | `#FF1744` |

### Typographie

- **Font Principal:** "Cairo" (Google Fonts) - Moderne, arabe-friendly, élégante
- **Font Secondaire:** "Poppins" - Pour les textes secondaires
- **Heading:** 700 (Bold)
- **Body:** 400 (Regular)

### Effets Visuels Lumineux

- **Glow Effect:** Box-shadow avec couleurs primaires sur les boutons et cartes
- **Gradient Background:** Dégradé subtle sur le hero section
- **Animations:** Fade-in, slide-up, pulse sur les éléments interactifs
- **Hover Effects:** Scale + glow sur les cartes produits
- **Neon Accents:** Bordures lumineuses sur certains éléments

### Layout Responsive

- **Mobile:** < 768px (1 colonne)
- **Tablet:** 768px - 1024px (2 colonnes)
- **Desktop:** > 1024px (4-5 colonnes produits)

---

## 3. Spécification Fonctionnelle

### Fonctionnalités Principales

#### 3.1 Système d'Identification Vendeur
- Formulaire d'inscription avec:
  - Nom complet
  - Numéro de téléphone
  - Ville (liste déroulante)
  - Quartier/Commune
  - Photo de profil (optionnel)
- Stockage local (localStorage) pour la démo
- Notification de succès

#### 3.2 Publication de Produits
- Titre du produit
- Description
- Prix
- Catégorie
- Images (upload multiple)
- Ville/Quartier (auto-renseigné depuis le profil vendeur)
- Contact WhatsApp

#### 3.3 Achat Sans Compte
- Ajout au panier sans authentification
- Informations acheteur demandées uniquement lors de la commande:
  - Nom
  - Téléphone
  - Adresse de livraison
- Génération de numéro de commande

#### 3.5 Filtrage par Proximité
- Filtrer les produits par:
  - Même ville
  - Même quartier
  - Rayon configurable
- Carte visualisant les vendeurs

### Flux Utilisateur

```
Acheteur:
1. Parcourir les produits
2. Filtrer par proximité
3. Voir détail produit
4. Contacter vendeur (messagerie) OU acheter directement
5. Remplir infos commande
6. Confirmer achat

Vendeur:
1. S'inscrire avec localisation
2. Publier un produit
3. Recevoir messages d'acheteurs
4. Gérer ses produits
```

---

## 4. Stack Technique

- **Framework:** React 18 + Vite
- **Routing:** React Router DOM v6
- **State Management:** React Context API
- **Styling:** CSS Modules + Variables CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Build:** Local pour démonstration

---

## 5. Critères d'Acceptation

### Design
- [ ] Ressemblance visuelle avec Alibaba (couleur orange dominante)
- [ ] Effets lumineux/glow visibles
- [ ] Design responsive mobile-first
- [ ] Animations fluides

### Fonctionnalités
- [ ] Inscription vendeur avec localisation
- [ ] Publication de produit fonctionnelle
- [ ] Liste produits avec filtres
- [ ] Achat sans compte
- [ ] Panier fonctionnel

### Performance
- [ ] Chargement < 3 secondes
- [ ] Aucune erreur console
- [ ] Navigation fluide entre pages
