import { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

export default function PromotionCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activatePromotionInstant, user, seller } = useContext(AppContext);
  const currentUser = seller || user;
  
  const [status, setStatus] = useState('processing'); 
  const [message, setMessage] = useState('Vérification de votre promotion en cours...');
  const [promoItem, setPromoItem] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const fedapayStatus = searchParams.get('status');

      if (fedapayStatus === 'approved' || fedapayStatus === 'successful') {
        try {
          const rawPromoData = sessionStorage.getItem('fedapay_promotion_data');
          if (rawPromoData) {
            const promoData = JSON.parse(rawPromoData);
            
            // Activation immédiate côté client pour le confort utilisateur
            activatePromotionInstant(promoData.productId, promoData.plan.days);
            
            // Confirmer au serveur sans rouvrir le popup
            const { confirmPromotionPayment } = await import('../../services/paymentService');
            const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
            await confirmPromotionPayment(promoData.productId, promoData.plan, currentUser?.uid || promoData.uid, transactionId);

            sessionStorage.removeItem('fedapay_promotion_data');
            setPromoItem(promoData);
          }
          
          setStatus('success');
          setMessage('Paiement réussi ! Votre produit/service est maintenant mis en avant.');
        } catch (err) {
          console.error("Erreur post-promotion:", err);
          setStatus('error');
          setMessage("Le paiement a réussi mais une erreur s'est produite lors de l'application de la promotion.");
        }
      } else if (fedapayStatus === 'canceled' || fedapayStatus === 'declined') {
        setStatus('error');
        setMessage('Le paiement a été annulé ou refusé.');
      } else {
        setStatus('error');
        setMessage('Statut de paiement inconnu.');
      }
    };

    handleCallback();
  }, [searchParams, activatePromotionInstant, currentUser]);

  return (
    <div className="payment-page">
      <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px', minHeight: '60vh' }}>
        <motion.div 
          className="payment-success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}
        >
          {status === 'processing' && (
            <>
              <Loader size={64} className="spin" style={{ color: 'var(--primary)', margin: '0 auto var(--space-lg)' }} />
              <h2>{message}</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={64} style={{ color: '#2ecc71', margin: '0 auto var(--space-lg)' }} />
              <h2>{message}</h2>
              <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
                {promoItem && (
                  <Link 
                    to={promoItem.type === 'service' ? `/service/${promoItem.productId}` : `/product/${promoItem.productId}`} 
                    className="btn btn-outline"
                    style={{ borderColor: '#FFD700', color: '#FFD700' }}
                  >
                    Voir mon annonce
                  </Link>
                )}
                <Link to="/profile" className="btn btn-outline">Mon Profil</Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={64} style={{ color: '#e74c3c', margin: '0 auto var(--space-lg)' }} />
              <h2>Transaction échouée</h2>
              <p>{message}</p>
              <div style={{ marginTop: 'var(--space-xl)' }}>
                <Link to="/my-products" className="btn btn-primary">Retour aux produits</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
