/**
 * Point d'entrée central pour les services de l'application.
 * Ce fichier ré-exporte les fonctions utiles des différents modules de service.
 */

// Service d'authentification et de gestion des utilisateurs
export * from './authService'

// Service d'authentification spécifique à l'administrateur
export { 
  verifyAdminCredentials, 
  isUserAdmin, 
  isAdminConfigured, 
  getAdminInfo,
  adminLogout 
} from './adminAuth';

// Service de gestion des emails (vérification, mot de passe oublié)
export * from './emailService';

// Service de gestion des avis produits
export * from './reviewsService';
