import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContextInstance';
import { openFedaPayOverlay } from '../../services/paymentService';
import { X, Zap, CircleCheck as CheckCircle, Loader2 as Loader } from 'lucide-react';
import './Publish.css';

export default function PromoteModal({ product, onClose }) {
  const { PROMOTION_PRICES, activatePromotionInstant, seller } = useContext(AppContext);
  const [selectedPlan, setSelectedPlan] = useState('week');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handlePromote = async () => {
    setLoading(true);
    setError(null);

    // Vérification préalable : clé FedaPay présente ?
    if (!import.meta.env.VITE_FEDAPAY_PUBLIC_KEY) {
      setError("❌ Configuration de paiement manquante (clé FedaPay). Contactez l'administrateur.");
      setLoading(false);
      return;
    }

    const plan = PROMOTION_PRICES[selectedPlan];
    if (!plan) {
      setError("Plan de promotion invalide.");
      setLoading(false);
      return;
    }

    const userInfo = {
      name: seller?.name || 'Client',
      email: seller?.email || 'client@example.com',
      phone: seller?.whatsapp || seller?.phone || '',
    };

    // Sauvegarder en sessionStorage pour récupérer si FedaPay redirige
    const promoData = {
      productId: product.id,
      plan: plan,
      uid: seller?.id,
      type: product.type
    };
    sessionStorage.setItem('fedapay_promotion_data', JSON.stringify(promoData));

    // ÉTAPE 1 : Ouvrir l'overlay de paiement FedaPay
    const paymentResult = await openFedaPayOverlay({
      amount: plan.price,
      description: `Promotion : ${product.title} (${plan.name})`,
      customer: userInfo,
      callbackUrl: `${window.location.origin}/promotion/success`
    });

    if (!paymentResult.success) {
      setError(paymentResult.error || "Le paiement a été annulé.");
      sessionStorage.removeItem('fedapay_promotion_data');
      setLoading(false);
      return;
    }

    // ÉTAPE 2 : Paiement validé par FedaPay → Activer le badge Vedette IMMÉDIATEMENT en BDD
    // On appelle directement activatePromotionInstant (met is_promoted=true dans products)
    // Sans passer par promoteProduct qui ne faisait PAS la mise à jour BDD
    const activationResult = await activatePromotionInstant(product.id, plan.days);

    if (activationResult && activationResult.success) {
      sessionStorage.removeItem('fedapay_promotion_data');
      setSuccess(true);

      // ÉTAPE 3 (non-bloquante) : Notifier l'admin en arrière-plan
      try {
        const { confirmPromotionPayment } = await import('../../services/paymentService');
        await confirmPromotionPayment(product.id, plan, seller?.id, paymentResult.transactionId);
      } catch (notifErr) {
        console.warn('[PromoteModal] Notification admin non envoyée (non bloquant):', notifErr.message);
      }
    } else {
      // Paiement OK mais activation échouée (ex: RLS, produit introuvable)
      const errMsg = activationResult?.error || "Erreur d'activation";
      setError(`Paiement reçu ✓ mais activation échouée: ${errMsg}. Notez l'ID de transaction FedaPay: ${paymentResult.transactionId || 'N/A'} et contactez le support.`);
    }
    setLoading(false);
  };

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal promote-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="modal-header">
          <h2><Zap size={24} /> Promouvoir cette annonce</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        {success ? (
          <motion.div className="promotion-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle size={64} className="success-icon" />
            <h3>⭐ Annonce promue avec succès !</h3>
            <p>Votre annonce apparaît désormais en tête des résultats pendant <strong>{PROMOTION_PRICES[selectedPlan]?.name || 'la durée choisie'}</strong>.</p>
          </motion.div>
        ) : (
          <>
            <div className="modal-product-summary">
              <img src={product.images[0]} alt={product.title} />
              <div>
                <h4>{product.title}</h4>
                <p>{formatPrice(product.price)}</p>
              </div>
            </div>

            <div className="promotion-plans">
              {Object.entries(PROMOTION_PRICES).map(([key, plan]) => {
                const labels = {
                  threeDays: '3 Jours',
                  week: '1 Semaine',
                  month: '1 Mois'
                };
                return (
                  <label key={key} className={`plan-option ${selectedPlan === key ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="promotionPlan"
                      value={key}
                      checked={selectedPlan === key}
                      onChange={() => setSelectedPlan(key)}
                    />
                    <div className="plan-details">
                      <span className="plan-duration">{labels[key]}</span>
                      <span className="plan-price">{formatPrice(plan.price)}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {error && (
              <div className="error-alert" style={{ marginBottom: '15px', padding: '10px' }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                id="fedapay-checkout-btn"
                className="btn btn-primary btn-large"
                onClick={handlePromote}
                disabled={loading}
              >
                {loading ? <Loader size={20} className="spin" /> : <Zap size={20} />}
                {loading ? 'Paiement en cours...' : `Confirmer la Promotion`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
