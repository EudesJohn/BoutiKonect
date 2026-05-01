import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { AppContext } from '../../context/AppContextInstance';
import './Receipt.css';

export default function ReceiptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, services, seller } = useContext(AppContext);
  const [data, setData] = useState(null);

  useEffect(() => {
    // 1. Essayer sessionStorage (le plus frais après paiement)
    const stored = sessionStorage.getItem('last_promotion_receipt');
    if (stored) {
      setData(JSON.parse(stored));
      return;
    }

    // 2. Essayer via ID produit (historique)
    const pid = searchParams.get('pid');
    if (pid) {
      const allItems = [...products, ...services];
      const item = allItems.find(p => p.id === pid);
      
      if (item && item.last_transaction_id) {
        setData({
          transactionId: item.last_transaction_id,
          productTitle: item.title,
          productImage: item.images?.[0] || null,
          plan: { 
            name: item.promotion_plan_name || 'Promotion Vedette',
            price: item.promotion_plan_price || 0,
            days: 0 
          },
          seller: seller || { name: item.sellerName || 'Vendeur' },
          date: item.promotion_start_date || item.updatedAt
        });
        return;
      }
    }

    // 3. Fallback sur les query params directs
    const tid = searchParams.get('tid');
    const title = searchParams.get('title');
    const price = searchParams.get('price');
    
    if (tid && title && price) {
      setData({
        transactionId: tid,
        productTitle: title,
        plan: { price: parseInt(price), name: searchParams.get('plan') || 'Promotion' },
        seller: { name: searchParams.get('seller') || 'Client' },
        date: new Date().toISOString()
      });
    }
  }, [searchParams, products, services, seller]);

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="receipt-page-empty">
        <div className="container">
          <h2>Quittance introuvable</h2>
          <p>Désolé, nous n'avons pas pu charger les détails de cette quittance.</p>
          <Link to="/profile" className="btn btn-primary">Retour au profil</Link>
        </div>
      </div>
    );
  }

  const formatPrice = (amount) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  };

  const receiptNumber = `BK-${(data.timestamp || Date.now()).toString(36).toUpperCase()}`;

  return (
    <div className="receipt-page">
      <div className="container">
        <div className="no-print receipt-nav">
          <button onClick={() => navigate(-1)} className="btn-back">
            <ArrowLeft size={20} /> Retour
          </button>
          <div className="receipt-actions">
            <button onClick={handlePrint} className="btn btn-primary">
              <Printer size={18} /> Imprimer / PDF
            </button>
          </div>
        </div>

        <motion.div 
          className="receipt-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="receipt-header">
            <div className="brand">
              <h1>BoutiKonect<span>.</span>bj</h1>
              <p>Marketplace Officielle du Bénin</p>
            </div>
            <div className="receipt-id">
              <span>N° Quittance</span>
              <strong>{receiptNumber}</strong>
            </div>
          </div>

          <div className="status-banner">
            <div className="status-icon">✅</div>
            <div className="status-text">
              <strong>Paiement Confirmé</strong>
              <span>Traité par FedaPay le {formatDate(data.date)}</span>
            </div>
          </div>

          <div className="receipt-content">
            <section className="receipt-section">
              <h3 className="section-title">🏷️ Service</h3>
              <div className="promo-info">
                {data.productImage && <img src={data.productImage} alt={data.productTitle} className="promo-img" />}
                <div className="promo-details">
                  <span className="promo-name">{data.productTitle}</span>
                  <span className="promo-badge"><Zap size={14} /> Mise en avant Vedette</span>
                </div>
              </div>
            </section>

            <section className="receipt-section">
              <h3 className="section-title">👤 Bénéficiaire</h3>
              <div className="info-grid">
                <div className="info-group">
                  <label>Nom du vendeur</label>
                  <p>{data.seller?.name || 'N/A'}</p>
                </div>
                <div className="info-group">
                  <label>Email</label>
                  <p>{data.seller?.email || 'N/A'}</p>
                </div>
                <div className="info-group">
                  <label>Téléphone</label>
                  <p>{data.seller?.phone || data.seller?.whatsapp || 'N/A'}</p>
                </div>
                <div className="info-group">
                  <label>Date</label>
                  <p>{formatDate(data.date)}</p>
                </div>
              </div>
            </section>

            <section className="receipt-section">
              <h3 className="section-title">💳 Détails de la transaction</h3>
              <table className="receipt-table">
                <tbody>
                  <tr>
                    <td>Désignation</td>
                    <td className="text-right">Promotion Annonce ({data.plan?.name || 'Standard'})</td>
                  </tr>
                  <tr>
                    <td>ID Transaction FedaPay</td>
                    <td className="text-right mono">{data.transactionId || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Moyen de paiement</td>
                    <td className="text-right">Mobile Money / Carte (FedaPay)</td>
                  </tr>
                  <tr className="total-row">
                    <td>Montant Total Payé</td>
                    <td className="text-right total-value">{formatPrice(data.plan?.price || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          <div className="receipt-footer">
            <div className="footer-text">
              <p>Ce document est une preuve officielle de paiement.</p>
              <p>BoutiKonect - Support : support@boutikonect.bj</p>
            </div>
            <div className="secure-tag">
              <ShieldCheck size={16} /> <span>Sécurisé</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
