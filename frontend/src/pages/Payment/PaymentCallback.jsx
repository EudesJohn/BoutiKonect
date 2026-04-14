import { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { createOrder, clearCart } = useContext(AppContext);
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Vérification de votre paiement en cours...');

  useEffect(() => {
    const fedapayStatus = searchParams.get('status');
    const transactionId = searchParams.get('id');

    if (fedapayStatus === 'approved' || fedapayStatus === 'successful') {
      try {
        const rawPendingData = sessionStorage.getItem('pending_order');
        if (rawPendingData) {
          const pendingData = JSON.parse(rawPendingData);
          
          // Créer toutes les commandes
          for (const item of pendingData.cart) {
            await createOrder({
              productId: item.id,
              productTitle: item.title,
              productImage: item.images[0],
              price: item.price,
              quantity: item.quantity,
              sellerId: item.sellerId,
              buyerId: pendingData.buyerId,
              buyerName: pendingData.buyerName,
              buyerPhone: pendingData.phone,
              paymentId: transactionId || `FEDA_${Date.now()}`,
              paymentStatus: 'paid'
            });
          }

          clearCart();
          sessionStorage.removeItem('pending_order');
        }
        
        setStatus('success');
        setMessage('Paiement réussi ! Merci pour votre achat.');
      } catch (err) {
        console.error("Erreur post-paiement:", err);
        setStatus('error');
        setMessage("Le paiement a réussi mais une erreur s'est produite lors de la validation de la commande.");
      }
    } else if (fedapayStatus === 'canceled' || fedapayStatus === 'declined') {
      setStatus('error');
      setMessage('Le paiement a été annulé ou refusé.');
    } else {
      // Cas générique ou validation inconnue
      setStatus('error');
      setMessage('Statut de paiement inconnu.');
    }
  }, [searchParams, createOrder, clearCart]);

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
                <Link to="/profile" className="btn btn-outline">Mes Commandes</Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={64} style={{ color: '#e74c3c', margin: '0 auto var(--space-lg)' }} />
              <h2>Transaction échouée</h2>
              <p>{message}</p>
              <div style={{ marginTop: 'var(--space-xl)' }}>
                <Link to="/payment" className="btn btn-primary">Réessayer le paiement</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
