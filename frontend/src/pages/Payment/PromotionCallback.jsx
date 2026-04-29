import { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle, CircleX as XCircle, Loader2 as Loader } from 'lucide-react';
import { AppContext } from '../../context/AppContextInstance';

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
            let promoData;

            // Validation: parser et vérifier la structure de promoData
            try {
              promoData = JSON.parse(rawPromoData);
            } catch {
              throw new Error('Données de promotion corrompues dans le stockage local.');
            }

            // Vérification des champs obligatoires pour éviter les erreurs silencieuses
            if (!promoData?.productId || typeof promoData.productId !== 'string' || promoData.productId.length < 10) {
              throw new Error('ID de produit manquant ou invalide dans les données de promotion.');
            }
            if (!promoData?.plan?.days || typeof promoData.plan.days !== 'number' || promoData.plan.days <= 0) {
              throw new Error('Plan de promotion invalide (durée manquante).');
            }
            if (!promoData?.plan?.price || typeof promoData.plan.price !== 'number' || promoData.plan.price <= 0) {
              throw new Error('Plan de promotion invalide (prix manquant).');
            }

            console.log('Données de promotion validées:', { productId: promoData.productId, days: promoData.plan.days });

            // Activation immédiate côté client
            const result = await activatePromotionInstant(promoData.productId, promoData.plan.days);
            console.log('Résultat activation immédiate:', result);

            // Confirmer au serveur sans rouvrir le popup
            const { confirmPromotionPayment } = await import('../../services/paymentService');
            const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
            const userId = currentUser?.id || promoData.uid || promoData.id || null;
            await confirmPromotionPayment(promoData.productId, promoData.plan, userId, transactionId);

            sessionStorage.removeItem('fedapay_promotion_data');
            setPromoItem(promoData);
          } else {
            console.warn('Aucune donnée de promotion en session. L\'utilisateur revient peut-être d\'une autre page.');
          }

          setStatus('success');
          setMessage('Paiement réussi ! Votre produit/service est maintenant mis en avant.');
        } catch (err) {
          console.error('Erreur post-promotion:', err);
          setStatus('error');
          // Afficher le message d'erreur réel à l'utilisateur pour faciliter le débogage
          setMessage(
            err.message?.includes('invalid') || err.message?.includes('manquant') || err.message?.includes('corrompu')
              ? `Erreur de données: ${err.message}`
              : "Le paiement a réussi mais une erreur s'est produite lors de l'application de la promotion. Contactez le support."
          );
        }
      } else if (fedapayStatus === 'canceled' || fedapayStatus === 'declined') {
        setStatus('error');
        setMessage('Le paiement a été annulé ou refusé.');
      } else {
        setStatus('error');
        setMessage(`Statut de paiement inconnu: "${fedapayStatus || 'non spécifié'}". Veuillez réessayer.`);
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
              <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
                {promoItem && (
                  <button 
                    onClick={() => activatePromotionInstant(promoItem.productId, promoItem.plan.days)}
                    className="btn btn-outline"
                    style={{ borderColor: '#FFD700', color: '#FFD700' }}
                  >
                    🚀 Réactiver / Forcer
                  </button>
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
