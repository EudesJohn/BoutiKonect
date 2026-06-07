/**
 * Service de Paiement pour BoutiKonect.bj
 * Utilise FedaPay comme fournisseur de paiement principal pour les promotions.
 * 
 * ⚠️  SÉCURITÉ PRODUCTION : La confirmation de paiement doit obligatoirement être
 * validée par un Webhook Firebase Functions côté serveur via l'API FedaPay.
 * Ne jamais accorder de promotions sans vérification serveur.
 */

import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// FedaPay Public Key (Sandbox by default)
const FEDAPAY_PUBLIC_KEY = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY || 'pk_sandbox_G8pu2tZrQ2XvxN-IfsN6Ubar';

// Get promotion prices - Source de vérité unique
export const getPromotionPrices = () => {
  return {
    threeDays: { name: '3 jours', price: 1000, days: 3 },
    week: { name: '1 semaine', price: 2500, days: 7 },
    month: { name: '1 mois', price: 9000, days: 30 }
  };
}

// Export PROMOTION_PRICES for backward compatibility
export const PROMOTION_PRICES = getPromotionPrices()

/**
 * Initialise le paiement FedaPay de façon immédiate.
 * Appelle FedaPay.create(...) et .open()
 */
/**
 * Initialise le paiement FedaPay avec FedaPay.init() (API v1.1.7 correcte)
 * @param {object} options - { transaction, customer, onSuccess, onCancel }
 */
export const initFedaPay = (options) => {
  // Vérifier que FedaPay est disponible
  if (typeof window.FedaPay === 'undefined') {
    return { success: false, error: "Le service de paiement n'est pas disponible. Réessayez dans quelques secondes." }
  }

  try {
    const checkoutOptions = {
      public_key: FEDAPAY_PUBLIC_KEY,
      transaction: options.transaction,
      customer: options.customer,
      environment: FEDAPAY_PUBLIC_KEY.includes('sandbox') ? 'sandbox' : 'live',
      onComplete: function (transaction) {
        // Détermination du succès
        const isSuccess = (transaction.reason === (window.FedaPay?.CHECKOUT_COMPLETED || 'checkout.completed')) || 
                        (transaction.status === 'approved') || 
                        (transaction.reason === 'checkout.completed');

        if (isSuccess) {
          if (typeof options.onSuccess === 'function') {
            options.onSuccess(transaction)
          }
        } else {
          if (typeof options.onCancel === 'function') {
            options.onCancel(transaction)
          }
        }
      }
    };

    // Mode 1: FedaPay.init() (souvent utilisé avec un widget retourné)
    if (typeof window.FedaPay.init === 'function') {
      const widget = window.FedaPay.init(checkoutOptions);
      if (widget && typeof widget.open === 'function') {
        widget.open();
      } else {
        // Si init ne retourne pas d'objet avec open(), il a peut-être déjà ouvert ou utilise une autre méthode
        console.log("FedaPay.init() appelé, pas de bouton open détecté.");
      }
    } 
    // Mode 2: FedaPay.open() (Méthode directe alternative)
    else if (typeof window.FedaPay.open === 'function') {
      window.FedaPay.open(checkoutOptions);
    } 
    // Mode 3: FedaPay.Checkout.init() (Ancienne API)
    else if (window.FedaPay.Checkout && typeof window.FedaPay.Checkout.init === 'function') {
      window.FedaPay.Checkout.init(checkoutOptions);
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur FedaPay:', error)
    return { success: false, error: "Erreur de paiement: " + error.message }
  }
}

/**
 * Crée une session de paiement pour la promotion d'un produit.
 */
export const createPromotionCheckoutSession = async (product, plan, user) => {
  if (!product || !plan || !user) {
    return { success: false, error: 'Informations produit, plan ou utilisateur manquantes.' };
  }

  if (typeof window.FedaPay === 'undefined') {
    console.error("FedaPay n'est pas chargé.");
    return { success: false, error: "Le service de paiement n'est pas disponible." };
  }

  try {
    // 🛡️ SÉCURITÉ : Récupérer le plan officiel pour forcer le prix réel chez FedaPay
    const officialPrices = getPromotionPrices();
    const planKey = Object.keys(officialPrices).find(
      key => officialPrices[key].days === plan.days
    ) || plan.key;
    const officialPlan = officialPrices[planKey];

    if (!officialPlan) return { success: false, error: 'Plan de promotion invalide.' };

    const transaction = {
      amount: officialPlan.price, // On ignore le prix du client et on force le prix officiel
      description: `Promotion: ${product.title} (${officialPlan.name})`
    };

    const customer = {
      email: user.email || 'client@example.com',
      lastname: user.name?.split(' ').slice(1).join(' ') || 'Boutique',
      firstname: user.name?.split(' ')[0] || 'Client',
    };

    // Stocker les infos pour le callback
    sessionStorage.setItem('fedapay_promotion_data', JSON.stringify({
      productId: product.id,
      type: product.type || 'product',
      plan: plan,
      timestamp: Date.now()
    }));

    return {
      success: true,
      data: {
        transaction,
        customer,
        callback_url: window.location.origin + '/promotion/success',
        cancel_url: window.location.href
      }
    };
  } catch (error) {
    console.error('Erreur FedaPay:', error);
    return { success: false, error: 'Erreur: ' + error.message };
  }
}

/**
 * Confirme le paiement de la promotion en enregistrant un état "pending" dans Firestore.
 * 
 * ⚠️  SÉCURITÉ : Cette fonction côté client NE FAIT PAS encore de vrai contrôle.
 * La promotion est placée en état "pending_verification" dans Firestore.
 * 
 * → Pour la production, un Webhook Firebase Function doit écouter les événements
 *   FedaPay et passer le statut à "active" une fois le paiement validé côté serveur.
 */
export const confirmPromotionPayment = async (productId, plan, userUid, fedapayTransactionId = null) => {
  const db = getFirestore()
  try {
    const officialPrices = {
      threeDays: { name: '3 jours', price: 1000, days: 3 },
      week: { name: '1 semaine', price: 2500, days: 7 },
      month: { name: '1 mois', price: 9000, days: 30 }
    };

    // Trouver le plan officiel correspondant à celui envoyé par le client (via le nom ou la clé)
    const planKey = Object.keys(officialPrices).find(
      key => officialPrices[key].days === plan.days
    ) || plan.key;

    const officialPlan = officialPrices[planKey];

    if (!officialPlan || plan.price < officialPlan.price) {
      console.error('[SECURITY] Tentative de manipulation du prix détectée !');
      return { success: false, error: 'Données de paiement invalides.' };
    }

    const pendingRef = doc(db, 'pending_promotions', `${productId}_${userUid}_${Date.now()}`)
    await setDoc(pendingRef, {
      productId,
      plan: {
        name: officialPlan.name,
        days: officialPlan.days,
        price: officialPlan.price // On utilise le prix officiel, pas celui du client
      },
      userUid,
      fedapayTransactionId: fedapayTransactionId ? String(fedapayTransactionId) : 'client_unverified',
      status: 'pending_verification',
      createdAt: serverTimestamp(),
      // Ce document sera lu par une Firebase Cloud Function / Webhook FedaPay
      // qui changera le statut à "active" après vérification réelle du paiement
    })

    console.warn('[PAYMENT] Promotion en attente de vérification serveur. ID de transaction:', fedapayTransactionId)
    return {
      success: true,
      pending: true,
      message: "Votre demande de promotion a été enregistrée. Elle sera activée après vérification du paiement."
    }
  } catch (error) {
    console.error('[PAYMENT] Erreur enregistrement promotion pendng:', error)
    return { success: false, error: 'Impossible d\'enregistrer la demande de promotion.' }
  }
}

// Format price in XOF
export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price)
}

/**
 * Instructions de paiement USSD pour Moov et MTN.
 */
export const getUssdInstructions = (phoneNumber, amount) => {
  const formattedPhone = phoneNumber.replace(/^\+?229/, '').replace(/^229/, '')

  return {
    moov: '*144*4*' + formattedPhone + '*' + amount + '#',
    mtn: '*156*3*' + formattedPhone + '*' + amount + '#',
    instructions: 'Composez *144*4*' + formattedPhone + '*' + amount + '# pour Moov ou *156*3*' + formattedPhone + '*' + amount + '# pour MTN'
  }
}

/**
 * Fonction de paiement Stripe (compatibilité)
 */
export const createStripeCheckoutSession = async (amount, description, type) => {
  // Simulation de création de session Stripe
  return {
    success: true,
    sessionId: 'stripe_session_' + Date.now(),
    amount: amount,
    description: description
  };
}

export default {
  getPromotionPrices,
  PROMOTION_PRICES,
  initFedaPay,
  createPromotionCheckoutSession,
  confirmPromotionPayment,
  formatPrice,
  getUssdInstructions,
  createStripeCheckoutSession
}
