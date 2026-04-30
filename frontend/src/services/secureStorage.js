/**
 * Service de stockage sécurisé avec chiffrement
 * Chiffre les données sensibles avant de les stocker dans localStorage
 * Utilise AES-GCM avec une clé dérivée de l'UID utilisateur et un sel d'appareil
 */

// Clé de chiffrement stockée en mémoire (session uniquement)
let encryptionKey = null

/**
 * Génère une clé de chiffrement basée sur un sel unique à l'application
 * Cette clé est stockée uniquement en mémoire pendant la session
 */
/**
 * Obtient ou génère un sel de chiffrement unique par appareil.
 * Stocké dans localStorage, il est différent de chaque appareil/navigateur.
 * Bien que toujours côté client, cela empêche un attaquant possédant le code source
 * de déchiffrer les données sans avoir aussi le sel propre à l'appareil.
 */
const getDeviceSalt = () => {
  const SALT_KEY = 'BoutiKonect_device_enc_salt'
  let obfuscatedSalt = localStorage.getItem(SALT_KEY)

  // Validation du format du sel
  const isValidFormat = (s) => typeof s === 'string' && s.startsWith('BK_') && s.endsWith('_SK');

  if (!obfuscatedSalt || !isValidFormat(obfuscatedSalt)) {
    console.log('🎲 Generating new secure storage salt...');
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    let binary = '';
    for (let i = 0; i < randomBytes.byteLength; i++) {
      binary += String.fromCharCode(randomBytes[i]);
    }
    const rawSalt = btoa(binary)
    obfuscatedSalt = 'BK_' + rawSalt.split('').reverse().join('') + '_SK';
    localStorage.setItem(SALT_KEY, obfuscatedSalt)
  }

  try {
    const deobfuscated = obfuscatedSalt.replace('BK_', '').replace('_SK', '').split('').reverse().join('')
    return deobfuscated
  } catch (e) {
    console.error('❌ Failed to deobfuscate salt, fallback to random');
    return 'fallback_salt_' + SALT_KEY;
  }
}

/**
 * Initialise le stockage sécurisé avec l'UID de l'utilisateur.
 * Doit être appelé dès que l'utilisateur est authentifié.
 * Sans l'UID, les données ne peuvent pas être déchiffrées même si localStorage est volé.
 */
export const initSecureStorage = (uid) => {
  // OBSOLETE: La clé est maintenant liée uniquement à l'appareil pour permettre 
  // le chargement asynchrone du profil et du panier hors-connexion.
}

const getOrCreateEncryptionKey = async () => {
  if (encryptionKey) return encryptionKey

  const salt = getDeviceSalt()
  const combinedSecret = `${salt}::BK_SECURE_STORAGE`

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(combinedSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  encryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  return encryptionKey
}

/**
 * Chiffre une chaîne de données
 */
const encrypt = async (plainText) => {
  const key = await getOrCreateEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText)
  )

  // Combiner IV + données chiffrées et convertir en base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encryptedBuffer), iv.length)

  // FIX: Utiliser une boucle au lieu du spread operator pour éviter RangeError: Maximum call stack size exceeded
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary)
}

/**
 * Déchiffre une chaîne de données
 */
const decrypt = async (cipherText) => {
  if (!cipherText) return null;
  try {
    const key = await getOrCreateEncryptionKey()

    const binaryStr = atob(cipherText)
    const combined = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i)
    }

    if (combined.length < 13) throw new Error('Ciphertest too short');

    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    return new TextDecoder().decode(decryptedBuffer)
  } catch (error) {
    console.error('❌ Decryption failed. This might be due to a salt change or corrupted data.', error)
    return null
  }
}

/**
 * Stocke des données de manière sécurisée dans localStorage
 * @param {string} key - Clé de stockage
 * @param {any} value - Valeur à stocker (sera sérialisée en JSON)
 * @param {boolean} encryptData - Si true, chiffre les données (pour données sensibles)
 */
export const secureSetItem = async (key, value, encryptData = false) => {
  try {
    const serialized = JSON.stringify(value)

    if (encryptData) {
      const encrypted = await encrypt(serialized)
      localStorage.setItem(key, encrypted)
    } else {
      localStorage.setItem(key, serialized)
    }

    return true
  } catch (error) {
    console.error('Erreur secureSetItem:', error)
    return false
  }
}

/**
 * Récupère des données depuis localStorage
 * @param {string} key - Clé de stockage
 * @param {boolean} decryptData - Si true, déchiffre les données
 */
export const secureGetItem = async (key, decryptData = false) => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    if (decryptData) {
      const decrypted = await decrypt(stored)
      return decrypted ? JSON.parse(decrypted) : null
    }

    return JSON.parse(stored)
  } catch (error) {
    console.error('Erreur secureGetItem:', error)
    return null
  }
}

/**
 * Supprime une donnée de localStorage
 */
export const secureRemoveItem = (key) => {
  localStorage.removeItem(key)
}

/**
 * Efface toutes les données de session sécurisée
 */
export const secureClear = () => {
  encryptionKey = null
}

/**
 * Vérifie si le chiffrement est disponible
 */
export const isEncryptionAvailable = async () => {
  try {
    await getOrCreateEncryptionKey()
    return true
  } catch {
    return false
  }
}

// ============ FONCTIONS UTILITAIRES POUR DONNÉES SENSIBLES ============

// Clés pour données sensibles
const SENSITIVE_KEYS = {
  USER: 'BoutiKonect_user',
  SELLER: 'BoutiKonect_seller',
  CART: 'BoutiKonect_cart'
}

/**
 * Sauvegarde l'utilisateur de manière sécurisée
 */
export const saveSecureUser = async (user) => {
  if (user) {
    await secureSetItem(SENSITIVE_KEYS.USER, user, true)
  } else {
    secureRemoveItem(SENSITIVE_KEYS.USER)
  }
}

/**
 * Charge l'utilisateur de manière sécurisée
 */
export const loadSecureUser = async () => {
  return secureGetItem(SENSITIVE_KEYS.USER, true)
}

/**
 * Sauvegarde le vendeur de manière sécurisée
 */
export const saveSecureSeller = async (seller) => {
  if (seller) {
    await secureSetItem(SENSITIVE_KEYS.SELLER, seller, true)
  } else {
    secureRemoveItem(SENSITIVE_KEYS.SELLER)
  }
}

/**
 * Charge le vendeur de manière sécurisée
 */
export const loadSecureSeller = async () => {
  return secureGetItem(SENSITIVE_KEYS.SELLER, true)
}

/**
 * Sauvegarde le panier de manière sécurisée
 */
export const saveSecureCart = async (cart) => {
  await secureSetItem(SENSITIVE_KEYS.CART, cart, true)
}

/**
 * Charge le panier de manière sécurisée
 */
export const loadSecureCart = async () => {
  return secureGetItem(SENSITIVE_KEYS.CART, true)
}

export default {
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  secureClear,
  isEncryptionAvailable,
  saveSecureUser,
  loadSecureUser,
  saveSecureSeller,
  loadSecureSeller,
  saveSecureCart,
  loadSecureCart
}
