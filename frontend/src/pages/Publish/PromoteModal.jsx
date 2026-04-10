import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { openFedaPayOverlay } from '../../services/paymentService';
import { X, Zap, CheckCircle, Loader } from 'lucide-react';
import './Publish.css';

export default function PromoteModal({ product, onClose }) {
  const { PROMOTION_PRICES, promoteProduct, seller } = useContext(AppContext);
  const [selectedPlan, setSelectedPlan] = useState('week');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handlePromote = async () => {
    setLoading(true);
    setError(null);
    
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
    
    // 1. Ouvrir l'overlay de paiement
    const paymentResult = await openFedaPayOverlay({
      amount: plan.price,
      description: `Promotion de l'annonce : ${product.title} (${plan.name})`,
      customer: userInfo
    });

    if (!paymentResult.success) {
      setError(paymentResult.error || "Le paiement a été annulé.");
      setLoading(false);
      return;
    }

    // 2. Si le paiement est réussi, enregistrer la promotion
    const result = await promoteProduct(product.id, selectedPlan);
    
    if (result && result.success) {
      // 3. [MODE TEST/SANDBOX] Activer immédiatement la promotion pour le feedback visuel
      // Puisque le vendeur a le droit d'éditer ses propres produits (RLS), on peut le faire ici
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.days);

      try {
        const { error: updateError } = await (await import('../../supabase/client')).supabase
          .from('products')
          .update({
            is_promoted: true,
            promotion_end_date: endDate.toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) console.error("Erreur activation immédiate:", updateError);
      } catch (e) {
        console.error("Erreur lors de l'activation automatique:", e);
      }

      setSuccess(true);
    } else {
      setError(result?.error || "Le plan de promotion n'a pas pu être enregistré malgré le paiement.");
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
            <h3>Annonce promue !</h3>
            <p>Votre annonce apparaîtra désormais en tête des résultats.</p>
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

