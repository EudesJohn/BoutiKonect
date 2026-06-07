# Documentation Complète - MaBoutique229

## Table des Matières

1. [Presentation Generale](#presentation-generale)
2. [Fonctionnalites pour les Acheteurs](#fonctionnalites-pour-les-acheteurs)
3. [Fonctionnalites pour les Vendeurs](#fonctionnalites-pour-les-vendeurs)
4. [Fonctionnalites Admin](#fonctionnalites-admin)
5. [Systeme de Geolocalisation](#systeme-de-geolocalisation)
6. [Systeme de Paiement](#systeme-de-paiement)
7. [Technologies Utilisees](#technologies-utilisees)

---

## Presentation Generale

**MaBoutique229** est une marketplace e-commerce dédiée au Bénin. La plateforme permet aux utilisateurs :

- 浏览和购买本地卖家的产品
- 成为卖家并发布自己的产品
- Le vendeur contacte l'acheteur après la commande pour la livraison.
- 根据地理位置查找附近的产品

### Caracteristiques Principales

| Caracteristique | Description |
|----------------|-------------|
| **Zone de couverture** | Tout le Benin (77 communes) | | **Categorie de produits** | 10 categories principales | | **Authentification** | Email/Mot de passe + Google | | **Paiement** | Paiement a la livraison |

---

## Fonctionnalites pour les Acheteurs

### 1. Inscription / Connexion

**Inscription (Register.jsx)**
- Formulaire en 3 etapes :
  - **Etape 1 :** Informations personnelles (nom, telephone, email, mot de passe)
  - **Etape 2 :** Localisation (commune/ville, quartier)
  - **Etape 3 :** Numero WhatsApp pour les communications
- Validation des champs en temps reel
- Mot de passe requis (minimum 6 caracteres)

**Connexion (Login.jsx)**
- Authentification par email et mot de passe
- Option "Se souvenir de moi" (connexion automatique)
- Recuperation de mot de passe

### 2. Navigation et Recherche

**Barre de recherche (Navbar.jsx)**
- Recherche de produits par mot-cle
- Redirection vers la page produits filtres

**Filtres avances (Products.jsx)**
- Filtre par categorie
- Filtre par commune/ville
- Filtre par quartier/zone
- Filtre par gamme de prix (min/max)
- Filtre "Produits en vedette" (promus)
- Filtre "Pres de moi" (geolocalisation)
- Pagination (12 produits par page)

### 3. Consultation des Produits

**Page d'accueil (Home.jsx)**
- Section hero avec statistiques
- 10 categories populaires avec icones
- Produits en vedette (8 premiers)
- Nouveautes (4 derniers produits)

**Liste des produits (Products.jsx)**
- Grille de produits avec pagination
- Affichage des badges (Nouveau, Vedette, Rupture de stock)
- Affichage du prix, localisation et titre

**Detail du produit (ProductDetail.jsx)**
- Galerie d'images (navigation, fullscreen)
- Informations complete : titre, description, prix, categorie
- Localisation du vendeur
- Note et avis (systeme de notation 1-5 etoiles)
- Boutons d'action :
  - Ajouter au panier  
  - Ajouter aux favoris
  - Partager le produit
  - Signaler le produit

### 4. Panier et Commandes

**Panier (Cart.jsx)**
- Ajout/suppression de produits
- Modification des quantites
- Calcul automatique du total
- Verification du stock en temps reel
- Validation de commande avec :
  - Nom complet
  - Numero de telephone
  - Adresse de livraison

### 5. Gestion du Profil

**Profil utilisateur (Profile.jsx)**
- Modification des informations personnelles
- Changement de mot de passe
- Consultation des favoris
- Consultation des commandes (pour les vendeurs)
- Upgrade vers compte vendeur

### 6. Favoris

- Ajout/suppression de produits en favoris
- Stockage local (localStorage)
- Consultation depuis le profil

---

## Fonctionnalites pour les Vendeurs

### 1. Devenir Vendeur

**Processus d'upgrade (Profile.jsx)**
- Bouton "Devenir vendeur" pour les utilisateurs
- Mise a jour automatique du compte

### 2. Publication de Produits

**Page de publication (Publish.jsx)**
- Formulaire de creation de produit :
  - Titre (requis)
  - Description (requis)
  - Prix en XOF (requis)
  - Categorie (requis)
  - Stock/Quantite (requis)  
  - Images (requis - URL ou upload)  
- Upload d'images multiples
- Apercu des images avant publication
- Edition des produits existants
- Suppression de produits

### 3. Gestion des Produits

**Mes produits (MyProducts.jsx)**
- Liste de tous vos produits
- Edition en ligne
- Suppression avec confirmation
- Lien vers la page de detail

### 4. Gestion des Commandes

**Tableau de bord vendeur (SellerDashboard.jsx)**
- Statistiques :
  - Revenus totaux
  - Nombre de commandes
  - Nombre de produits
  - Commandes en attente
- Actions rapides :
  - Nouveau produit
  - Gerer mes produits

**Gestion des commandes (Profile.jsx) - Section Orders**
- Liste des commandes recues
- Statut des commandes :
  - En attente
  - Confirmee
  - Annulee
  - Terminee/Livree
- Actions :
  - Confirmer la commande
  - Annuler la commande
  - Marquer comme livree

### 5. Promotion de Produits

**Page de promotion (Promote.jsx)**
- Promotion de produits pour plus de visibilite
- Durees disponibles :
  - 3 jours : 1000 XOF
  - 1 semaine : 2500 XOF
  - 1 mois : 9000 XOF
- Badge "Vedette" sur les produits promus

---

## Fonctionnalites Admin

### 1. Tableau de Bord Admin

**Page Admin (Admin.jsx)**

**Statistiques globales :**
- Nombre total d'utilisateurs
- Nombre total de produits
- Nombre total de commandes
- Nombre de signalements

### 2. Gestion des Utilisateurs

**Onglet Utilisateurs :**
- Liste de tous les utilisateurs
- Recherche multi-criteres (nom, email, telephone, ville)
- Informations affichees :
  - Nom
  - Email
  - Telephone
  - Localisation
  - Date d'inscription
- Actions :
  - Reinitialiser le mot de passe (envoi par WhatsApp)
  - Supprimer un utilisateur (avec confirmation)

### 3. Gestion des Produits

**Onglet Tous les produits :**
- Tableau de tous les produits
- Informations : ID, titre, prix, vendeur, categorie
- Action : Supprimer un produit

### 4. Gestion des Commandes

**Onglet Commandes :**
- Regroupement par vendeur
- Tableau detaille :
  - ID commande
  - Produit
  - Quantite
  - Prix
  - Total
  - Acheteur
  - Telephone
  - Date

### 5. Gestion des Signalements

**Onglet Signalements :**
- Liste des produits signales
- Motifs de signalement :
  - Produit contrefait ou faux
  - Prix excessif ou trompeur
  - Produit interdit ou illegal
  - Photos non correspondantes
  - Vendeur suspect ou frauduleux
  - Autre raison
- Actions :
  - Marquer comme resolu
  - Supprimer le produit signale

---

## Systeme de Geolocalisation

### 1. Base de Donnees des Villes

**77 communes du Benin (AppContext.jsx)**

Liste complete des communes avec :
- Coordonnees GPS (latitude/longitude)
- Liste des quartiers/villages

### 2. Fonctionnalites de Geolocalisation

**Obtention de la position (AppContext.jsx)**
- API Geolocation HTML5
- Demande de permission utilisateur
- Stockage de la position en local
- Calcul de distance (formule de Haversine)

**Filtre "Pres de moi" (Products.jsx)**
- Affichage des produits dans un rayon de 50km
- Calcul automatique de la distance
- Mise a jour en temps reel

---

## Systeme de Paiement

### 1. Modele de Paiement

**Paiement a la livraison**
- Le client commande en ligne
- Paiement effectue lors de la reception du produit
- Le vendeur est notifié de la commande

### 2. Processus de Commande

**Creation de commande (Cart.jsx)**
1. L'utilisateur ajoute des produits au panier
2. Il remplit les informations de livraison
3. La commande est enregistree
4. Le vendeur recoit une notification
5. Le vendeur contacte l'acheteur pour organiser la livraison

### 3. Gestion des Statuts

**Statuts de commande :**
- `pending` - En attente de confirmation
- `confirmed` - Confirmee par le vendeur
- `cancelled` - Annulee
- `completed` - Terminee/Livree

---

## Technologies Utilisees

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.x | Framework UI |
| **React Router** | 6.x | Navigation/Routing |
| **Framer Motion** | - | Animations |
| **Lucide React** | - | Icons |

### Backend / Base de Donnees

| Technologie | Usage |
|------------|-------|
| **Firebase Firestore** | Base de donnees principale |
| **json-server** | API REST locale |
| **localStorage** | Stockage local (favoris, panier, sessions) |

### Services

| Service | Fichier | Description |
|---------|---------|-------------|
| Authentification | `adminAuth.js` | Gestion admin via Firebase Auth |
| Avis/Notes | `reviewsService.js` | Systeme de notation produits |
| Local Database | `localDatabase.js` | Stockage local同步 |
| API | `api.js` | Communications avec json-server |
| Validation | `utils/validation.js` | Validation des formulaires |

### Fonctionnalites Supplementaires

- **ScrollToTop** - Remontée automatique en haut de page
- **Navbar responsive** - Menu mobile integre
- **Footer** - Liens rapides et reseaux sociaux
- **SEO** - Meta tags et balises semantiques

---

## Structure des Donnees

### Produit
```javascript
{
  id: string,
  title: string,
  description: string,
  price: number,
  category: string,
  stock: number,
  images: string[],
  sellerId: string,
  sellerName: string,
  sellerCity: string,
  sellerNeighborhood: string,
  sellerAvatar: string,
  isPromoted: boolean,
  promotionStartDate: string,
  promotionEndDate: string,
  promotionDuration: string,
  createdAt: string
}
```

### Utilisateur
```javascript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  whatsapp: string,
  city: string,
  neighborhood: string,
  avatar: string,
  isSeller: boolean,
  isAdmin: boolean,
  isEmailVerified: boolean,
  createdAt: string
}
```

### Commande
```javascript
{
  id: string,
  productId: string,
  productTitle: string,
  productImage: string,
  price: number,
  quantity: number,
  total: number,
  sellerId: string,
  sellerName: string,
  buyerId: string,
  buyerName: string,
  buyerPhone: string,
  buyerAddress: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  createdAt: string
}
```

---

## Categories de Produits

1. **Electronique** - Smartphone, ordinateur, accessoires
2. **Vetements** - Vetements, chaussures, accessoires
3. **Alimentation** - Produits alimentaires, beverages
4. **Maison** - Meubles, decoration, electromenager
5. **Beaute** - Cosmetiques, produits de soins
6. **Sports** - Equipements sportifs, vetements de sport
7. **Jouets** - Jouets, jeux video
8. **Vehicules** - Voitures, motos, pieces detachées
9. **Services** - Services divers
10. **Autres** - Produits divers

---

*Documentation generee le : {new Date().toLocaleDateString('fr-FR')}*
*Pour MaBoutique229 - Marketplace N°1 au Benin*
