/**
 * Utility functions for data validation
 * Centralizes all validation logic for the application
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate phone number format (Benin format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  // Accept any phone number with at least 8 digits (flexible validation)
  const digitsOnly = phone.replace(/[^\d]/g, '')
  return digitsOnly.length >= 8
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid and error message
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Le mot de passe est requis' }
  }
  
  const errors = [];
  if (password.length < 8) {
    errors.push('au moins 8 caractères');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('une lettre minuscule');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('une lettre majuscule');
  }
  if (!/\d/.test(password)) {
    errors.push('un chiffre');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('un caractère spécial (@$!%*?&)');
  }

  if (errors.length > 0) {
    return { isValid: false, error: `Le mot de passe doit contenir ${errors.join(', ')}.` };
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate required field
 * @param {string} value - Value to check
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} - Object with isValid and error message
 */
export const validateRequired = (value, fieldName = 'Ce champ') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, error: `${fieldName} est requis` }
  }
  return { isValid: true, error: null }
}

/**
 * Validate address (delivery address)
 * @param {string} address - Address to validate
 * @returns {object} - Object with isValid and error message
 */
export const validateAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'L\'adresse de livraison est requise' }
  }
  
  if (address.trim().length < 10) {
    return { isValid: false, error: 'Veuillez fournir une adresse plus détaillée' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate name (full name)
 * @param {string} name - Name to validate
 * @returns {object} - Object with isValid and error message
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Le nom est requis' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Le nom doit contenir au moins 2 caractères' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate price
 * @param {number|string} price - Price to validate
 * @returns {boolean} - True if valid positive price
 */
export const validatePrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return !isNaN(numPrice) && numPrice > 0
}

/**
 * Validate quantity
 * @param {number} quantity - Quantity to validate
 * @param {number} maxStock - Maximum available stock
 * @returns {object} - Object with isValid and error message
 */
export const validateQuantity = (quantity, maxStock = 0) => {
  const numQty = typeof quantity === 'string' ? parseInt(quantity) : quantity
  
  if (isNaN(numQty) || numQty < 1) {
    return { isValid: false, error: 'La quantité doit être au moins 1' }
  }
  
  if (maxStock > 0 && numQty > maxStock) {
    return { isValid: false, error: `Stock insuffisant. Maximum disponible: ${maxStock}` }
  }
  
  return { isValid: true, error: null }
}

/**
 * Sanitize input string to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return ''
  // Remplacer les caractères HTML spéciaux par leurs entités pour empêcher l'injection de script (XSS)
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Validate product data
 * @param {object} product - Product data to validate
 * @returns {object} - Object with isValid and errors array
 */
export const validateProduct = (product) => {
  const errors = []
  
  if (!validateRequired(product.title, 'Le titre').isValid) {
    errors.push('Le titre du produit est requis')
  }
  
  if (!validatePrice(product.price)) {
    errors.push('Le prix doit être un nombre positif')
  }
  
  if (product.stock !== undefined && product.stock < 0) {
    errors.push('Le stock ne peut pas être négatif')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Error messages for authentication - avoid revealing too much information
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  ACCOUNT_LOCKED: 'Compte temporairement verrouillé. Veuillez réessayer plus tard.',
  RATE_LIMIT: 'Trop de tentatives. Veuillez patienter quelques instants.',
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
  UNKNOWN_ERROR: 'Une erreur est survenue. Veuillez réessayer.'
}

/**
 * Validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  INVALID_EMAIL: 'Format d\'email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caractères, avec majuscule, minuscule, chiffre et symbole.',
  ADDRESS_TOO_SHORT: 'Veuillez fournir une adresse plus détaillée',
  NAME_TOO_SHORT: 'Le nom doit contenir au moins 2 caractères'
}
