# 🛡️ Manuel d'Utilisation Administrateur - BoutiKonect (Afritana)

Félicitations pour l'acquisition de la plateforme **BoutiKonect**. Ce manuel a été conçu pour vous aider, en tant que propriétaire et administrateur, à gérer efficacement votre marketplace.

---

## 🔑 1. Accès au Panel d'Administration

Le panel d'administration est intégré directement sur le site pour une gestion simple et rapide.

1. **URL d'accès** : Connectez-vous normalement sur `www.boutikonect.bj` (ou votre domaine actuel).
2. **Identifiants** : Utilisez votre compte administrateur.
3. **Redirection** : Une fois connecté, rendez-vous sur la page `/admin` depuis le menu ou via l'URL directe.

> [!IMPORTANT]
> Ne partagez jamais vos accès administrateur. Si vous suspectez une intrusion, réinitialisez votre mot de passe immédiatement via votre interface de profil ou demandez une réinitialisation par email.

---

## 📊 2. Tableau de Bord et Statistiques

Le tableau de bord (`Admin.jsx`) vous offre une vue d'ensemble de l'activité du site :
- **Nombre total d'utilisateurs** (Acheteurs et Vendeurs).
- **Volume total des produits/services** publiés.
- **Nombre de commandes** passées sur la plateforme.
- **Alertes de signalements** : Nombre de produits signalés par la communauté.

---

## 👤 3. Gestion des Utilisateurs

Dans l'onglet **"Utilisateurs"**, vous pouvez :
- **Rechercher** un utilisateur par son nom, son numéro de téléphone ou sa ville.
- **Voir les détails** : Date d'inscription, statut (Vendeur ou non), ville et quartier.
- **Actions** :
  - **Réinitialiser le mot de passe** : Un lien est généré pour être envoyé par WhatsApp à l'utilisateur.
  - **Supprimer un compte** : En cas de non-respect des règles (une confirmation est toujours demandée).

---

## 📦 4. Suivi des Produits et Services

Dans l'onglet **"Tous les produits"**, vous avez une liste complète :
- Vous pouvez vérifier si les photos et descriptions sont conformes.
- Vous avez le droit de **supprimer tout produit** illégal ou ne respectant pas les critères de la plateforme (contrefaçons, articles interdits).

---

## 🛒 5. Suivi des Commandes

Toutes les transactions entre acheteurs et vendeurs sont visibles dans l'onglet **"Commandes"** :
- Les commandes sont regroupées par vendeur pour une meilleure lisibilité.
- Vous pouvez voir quel acheteur a commandé quel produit et son numéro de téléphone.
- Cela vous permet d'intervenir en cas de litige entre un acheteur et un vendeur.

---

## 🚩 6. Gestion des Signalements (Modération)

C'est l'outil le plus crucial pour la santé de votre site. Les utilisateurs peuvent signaler un produit pour :
- **Prix excessif** ou fraude.
- **Produit interdit**.
- **Vendeur suspect**.

Action recommandée : Examinez chaque signalement. Si la plainte est justifiée, supprimez l'article. Si non, marquez-le comme "Résolu".

---

## ⚙️ 7. Maintenance Technique (Backend)

Le système est conçu pour être autonome, mais voici les points à retenir :
1. **Base de données** : Tout est stocké de manière sécurisée sur **Supabase (PostgreSQL)**.
2. **Collecteur** : Des scripts de collecte de données permettent d'enrichir votre site.
3. **Paiements par Mobile Money** : Les promotions de produits sont gérées par **FedaPay**. Assurez-vous que vos clés API sont à jour dans le fichier `.env` du frontend.

---

## 📞 8. Support Client

En tant qu'admin, si un utilisateur vous contacte, voici les canaux officiels configurés sur le site :
- **WhatsApp Support** : `+229 01 40 57 13 73`
- **Email Professionnel** : `contact@afritana.com`

---

*Ce manuel est confidentiel et destiné uniquement à l'usage interne de l'administration de BoutiKonect (Afritana).*
