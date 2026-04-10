import { supabase } from '../supabase/client'

// FedaPay Public Key (Sandbox by default)
const FEDAPAY_PUBLIC_KEY = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY || 'pk_sandbox_G8pu2tZrQ2XvxN-IfsN6Ubar';

/**
 * Prix des promotions (en XOF)
 */
export const PROMOTION_PRICES = {
  threeDays: { name: '3 jours', price: 1000, days: 3 },
  week: { name: '1 semaine', price: 2500, days: 7 },
  month: { name: '1 mois', price: 9000, days: 30 }
}

export const getPromotionPrices = () => PROMOTION_PRICES;

/**
 * Ouvre l'overlay de paiement FedaPay.
 */
export const openFedaPayOverlay = ({ amount, description, customer }) => {
  return new Promise((resolve) => {
    if (!window.FedaPay) {
      resolve({ success: false, error: "Le SDK FedaPay n'est pas chargé." });
      return;
    }

    const checkout = window.FedaPay.init({
      public_key: FEDAPAY_PUBLIC_KEY,
      transaction: {
        amount: amount,
        description: description || "Paiement BoutiKonect"
      },
      customer: {
        email: customer.email,
        lastname: customer.name || 'Client',
        firstname: '',
        phone_number: {
          number: customer.phone || '',
          country: 'BJ'
        }
      },
      onComplete: (result) => {
        console.log('FedaPay Complete:', result);
        // Le statut 'approved' ou 'successful' indique un succès
        const status = result.status || (result.transaction && result.transaction.status);
        if (status === 'approved' || status === 'successful') {
          resolve({ success: true, transactionId: result.transaction?.id });
        } else {
          resolve({ success: false, error: "Le paiement n'a pas été approuvé (Statut: " + status + ")" });
        }
      },
      onClose: () => {
        resolve({ success: false, error: "La fenêtre de paiement a été fermée." });
      }
    });

    checkout.open();
  });
}

/**
 * Simule ou initie la session de paiement.
 */
export const createPromotionCheckoutSession = async (productId, plan) => {
  return {
    success: true,
    url: '#', // Géré par le widget FedaPay
    productId,
    plan
  };
}

/**
 * Confirme le paiement de la promotion en enregistrant un état "pending" dans Supabase.
 */
export const confirmPromotionPayment = async (productId, plan, userUid, fedapayTransactionId = null) => {
  try {
    const officialPrices = getPromotionPrices();
    const planKey = Object.keys(officialPrices).find(
      key => officialPrices[key].days === plan.days
    ) || plan.key;

    const officialPlan = officialPrices[planKey];

    if (!officialPlan || plan.price < officialPlan.price) {
      console.error('[SECURITY] Tentative de manipulation du prix détectée !');
      return { success: false, error: 'Données de paiement invalides.' };
    }

    const { error } = await supabase.from('admin_notifications').insert([{
      type: 'promotion_payment',
      data: {
        productId,
        plan: {
          name: officialPlan.name,
          days: officialPlan.days,
          price: officialPlan.price 
        },
        userUid,
        fedapayTransactionId: fedapayTransactionId ? String(fedapayTransactionId) : 'client_unverified',
        status: 'pending_verification',
      }
    }])

    if (error) throw error

    console.warn('[PAYMENT] Promotion en attente de vérification. ID:', fedapayTransactionId)
    return {
      success: true,
      pending: true,
      message: "Votre demande de promotion a été enregistrée. Elle sera activée après vérification du paiement."
    }
  } catch (error) {
    console.error('[PAYMENT] Erreur:', error)
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
  openFedaPayOverlay,
  createPromotionCheckoutSession,
  confirmPromotionPayment,
  formatPrice,
  getUssdInstructions,
  createStripeCheckoutSession
}
