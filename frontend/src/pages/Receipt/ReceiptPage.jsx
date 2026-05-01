import { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { AppContext } from '../../context/AppContextInstance';
import './Receipt.css';

export default function ReceiptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, services, seller } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Inject html2pdf script
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);
    }

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
      
      if (item && item.lastTransactionId) {
        setData({
          transactionId: item.lastTransactionId,
          productTitle: item.title,
          productImage: item.images?.[0] || null,
          plan: { 
            name: item.promotionPlanName || 'Promotion Vedette',
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

  const handleDownloadPDF = () => {
    if (!window.html2pdf) {
      alert("Le module PDF est en cours de chargement, veuillez réessayer dans une seconde.");
      return;
    }

    setIsGenerating(true);
    const element = document.getElementById('receipt-content-to-export');
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Quittance_BoutiKonect_${data.transactionId}.pdf`,
      image:        { type: 'png', quality: 1 },
      html2canvas:  { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        width: 760,
        backgroundColor: '#ffffff'
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsGenerating(false);
    }).catch(err => {
      console.error('PDF Error:', err);
      setIsGenerating(false);
      window.print(); // Fallback to print if html2pdf fails
    });
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

  const receiptNumber = data.transactionId 
    ? `BK-${data.transactionId.toString().slice(-8).toUpperCase()}` 
    : `BK-${(data.timestamp || Date.now()).toString(36).toUpperCase()}`;

  return (
    <div className="receipt-page">
      <div className="container">
        <div className="no-print receipt-nav">
          <button onClick={() => navigate(-1)} className="btn-back">
            <ArrowLeft size={20} /> Retour
          </button>
          <div className="receipt-actions">
            <button 
              onClick={handleDownloadPDF} 
              className={`btn btn-primary ${isGenerating ? 'loading' : ''}`}
              disabled={isGenerating}
            >
              {isGenerating ? 'Génération...' : <><Download size={18} /> Télécharger PDF</>}
            </button>
          </div>
        </div>

        <motion.div 
          id="receipt-content-to-export"
          className="receipt-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="receipt-header">
            <div className="brand">
              <h1>BoutiKonect<span>.</span>bj</h1>
              <p>Plateforme Officielle de Commerce</p>
            </div>
            <div className="receipt-id">
              <span>N° QUITTANCE</span>
              <strong>{receiptNumber}</strong>
            </div>
          </div>

          <div className="status-banner">
            <div className="status-icon">✓</div>
            <div className="status-text">
              <strong>Transaction Confirmée</strong>
              <span>Approuvé par le système de paiement FedaPay</span>
            </div>
          </div>

          <div className="receipt-content">
            <section className="receipt-section">
              <h3 className="section-title">Annonce Mise en Vedette</h3>
              <div className="promo-info">
                {data.productImage && <img src={data.productImage} alt={data.productTitle} className="promo-img" />}
                <div className="promo-details">
                  <span className="promo-name">{data.productTitle}</span>
                  <span className="promo-badge"><Zap size={14} /> Pack Promotionnel Activé</span>
                </div>
              </div>
            </section>

            <div className="info-grid">
              <section className="receipt-section">
                <h3 className="section-title">Propriétaire</h3>
                <div className="info-group">
                  <label>Nom Complet</label>
                  <p>{data.seller?.name || 'Client BoutiKonect'}</p>
                </div>
                <div className="info-group" style={{marginTop: '10px'}}>
                  <label>Contact</label>
                  <p>{data.seller?.phone || data.seller?.whatsapp || data.seller?.email || 'N/A'}</p>
                </div>
              </section>

              <section className="receipt-section">
                <h3 className="section-title">Date d'émission</h3>
                <div className="info-group">
                  <label>Date et Heure</label>
                  <p>{formatDate(data.date)}</p>
                </div>
                <div className="info-group" style={{marginTop: '10px'}}>
                  <label>Plateforme</label>
                  <p>BoutiKonect.bj (Bénin)</p>
                </div>
              </section>
            </div>

            <section className="receipt-section">
              <h3 className="section-title">Détails de Facturation</h3>
              <div className="billing-details">
                <div className="billing-row">
                  <span className="label">Désignation du service</span>
                  <span className="value">Promotion "Vedette" - {data.plan?.name || 'Annonce'}</span>
                </div>
                <div className="billing-row">
                  <span className="label">Référence de transaction</span>
                  <span className="value mono">{data.transactionId || 'BK-INTERNAL'}</span>
                </div>
                <div className="billing-row">
                  <span className="label">Mode de paiement</span>
                  <span className="value">FedaPay (Mobile Money/Card)</span>
                </div>
                <div className="billing-row total-row">
                  <span className="label total-label">Montant Total Net</span>
                  <span className="value total-value">{formatPrice(data.plan?.price || 0)}</span>
                </div>
              </div>

              <div className="qr-container">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BoutiKonect-TX-${data.transactionId}`} 
                  alt="QR Code de Validation" 
                  className="qr-code"
                />
                <span>SCAN VALIDE</span>
              </div>

              <div className="receipt-footer-inline">
                <div className="footer-text">
                  <p>Ce document certifie le paiement des frais de promotion sur BoutiKonect.bj.</p>
                  <p>BoutiKonect.bj - République du Bénin</p>
                  <p>Contact : support@boutikonect.bj | www.boutikonect.bj</p>
                </div>
                <div className="secure-tag">
                  <ShieldCheck size={14} /> DOCUMENT SÉCURISÉ & AUTHENTIQUE
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
