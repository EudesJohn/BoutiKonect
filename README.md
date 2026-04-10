# 🚀 BoutiKonect - Le Guide Ultime (Manuel d'Utilisation Complet)

Bienvenue dans la documentation officielle de **BoutiKonect** (également connu sous le nom de **MaBoutique229**), la marketplace n°1 au Bénin pour l'achat et la vente de produits et services.

Ce guide est divisé en sections pour les acheteurs, les vendeurs, les administrateurs et les développeurs.

---

## 📂 Structure du Projet

Suite à la réorganisation, le projet est structuré comme suit :

- **`/frontend`** : Contient l'application web React (Vite, Firebase, UI).
- **`/Backend`** : Contient les scripts de collecte de données (Python) et la logique serveur.
- **`/frontend/root_backups`** : Sauvegarde des fichiers qui étaient à la racine (legacy).

---

## 🛒 1. Guide de l'Acheteur

### Inscription et Connexion
- **Inscription** : Cliquez sur "S'inscrire". Le formulaire se fait en 3 étapes : Informations personnelles, Localisation (Commune/Quartier), et numéro WhatsApp.
- **Connexion** : Utilisez votre email et mot de passe. Vous pouvez aussi utiliser Google pour une connexion rapide.

### Recherche de Produits et Services
- **Filtrage Intelligent** : Recherchez par catégorie, par prix, ou par proximité ("Près de moi").
- **Géolocalisation** : Activez la localisation pour voir les vendeurs les plus proches de vous (rayon de 50km).

### Panier et Commande
- **Ajout au panier** : Cliquez sur "Ajouter au panier" sur n'importe quel produit.
- **Validation** : Vérifiez vos articles et validez la commande. 
- **Paiement** : Le paiement s'effectue **à la livraison**, directement au vendeur.

---

## 🏪 2. Guide du Vendeur

### Devenir Vendeur
- Allez dans votre **Profil** et cliquez sur le bouton **"Devenir Vendeur"**. Votre compte sera instantanément mis à jour.

### Publier un Produit ou Service
1. Cliquez sur **"Publier"** dans le menu.
2. Remplissez les détails : Titre, Description, Prix (XOF), Catégorie et Stock.
3. Ajoutez des images (upload ou liens).
4. Pour les services, vous pouvez proposer un "Devis" ou un prix fixe.

### Gestion des Commandes
- Accédez à votre **Tableau de Bord Vendeur** pour voir vos statistiques (revenus, commandes, produits).
- Dans la section **Commandes**, vous pouvez confirmer, annuler ou marquer une commande comme livrée.
- **Note** : Contactez l'acheteur via WhatsApp ou téléphone pour organiser la livraison.

### Promotion (Mise en avant)
- Boostez la visibilité de vos produits en utilisant le système de promotion :
  - **3 Jours** : 1 000 XOF
  - **1 Semaine** : 2 500 XOF
  - **1 Mois** : 9 000 XOF
- Le paiement se fait via **Mobile Money (FedaPay)**.

---

## 🛡️ 3. Guide de l'Administrateur

L'accès à la page **/admin** est réservé aux administrateurs.

1. **Dashboard** : Vue d'ensemble des utilisateurs, produits, commandes et signalements.
2. **Gestion des Utilisateurs** : Rechercher, réinitialiser des mots de passe (via WhatsApp) ou supprimer des comptes.
3. **Gestion des Signalements** : Examinez les produits signalés par la communauté pour fraude ou contenu inapproprié.

---

## 💻 4. Guide du Développeur

### Installation (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### Technologies Utilisées
- **UI** : React 18, Tailwind CSS, Framer Motion (animations), Lucide React (icônes).
- **Backend / DB** : Supabase (Auth, Database, Storage), PostgreSQL.
- **Paiement** : FedaPay (Mobile Money au Bénin) et Stripe (Optionnel).

---

## 🤖 Assistant Virtuel
Le site intègre un assistant IA (Chatbot) pour répondre aux questions fréquentes et aider les utilisateurs à trouver des produits. Il est basé sur une base de connaissances locale (`faqData.js`).

---

## 🔧 Configuration Supabase Additionnelle

### Changement d'E-mail
Par défaut, Supabase exige la validation sur l'ancienne ET la nouvelle adresse.
Pour simplifier ce processus :
1. Allez sur le **Dashboard Supabase** > **Authentication** > **Providers** > **Email**.
2. Décochez **"Secure email change"**.
3. Sauvegardez. 
Désormais, seule la validation sur la nouvelle adresse sera requise.

---

*Documentation mise à jour le 10 Avril 2026*
*BoutiKonect - La proximité avant tout.*
