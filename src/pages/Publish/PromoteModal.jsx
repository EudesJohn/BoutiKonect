import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { createPromotionCheckoutSession, initFedaPay } from '../../services/paymentService';
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
    
    // Les informations du plan sont désormais gérées directement par promoteProduct via la clé selectedPlan
    
    const userInfo = {
      name: seller?.name || 'Client',
      email: seller?.email || 'client@example.com',
      phone: seller?.whatsapp || seller?.phone || '',
    };
    
    // Vérifier que FedaPay est chargé
    if (typeof window.FedaPay === 'undefined') {
      setError("Le service de paiement n'est pas disponible. Actualisez la page et réessayez.");
      setLoading(false);
      return;
    }

    // Appel direct à promoteProduct — il gère désormais tout le flux (init FedaPay + confirmation Firestore)
    const result = await promoteProduct(product.id, selectedPlan);
    
    if (result && result.success) {
      setSuccess(true);
    } else {
      setError(result?.error || "Le paiement n'a pas pu être complété.");
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

