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
      margin:       10,
      filename:     `Quittance_BoutiKonect_${data.transactionId}.pdf`,
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
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
          className="receipt-modern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="modern-header">
            <div className="header-left">
              <div className="logo-text">BoutiKonect<span>.</span>bj</div>
              <p>République du Bénin</p>
            </div>
            <div className="header-right">
              <h2>QUITTANCE DE PAIEMENT</h2>
              <div className="receipt-no">Réf: {receiptNumber}</div>
            </div>
          </div>

          <div className="modern-body">
            <div className="status-indicator">
              <div className="indicator-dot"></div>
              <span>Transaction Confirmée & Sécurisée</span>
            </div>

            <div className="info-section">
              <div className="info-col">
                <label>Bénéficiaire</label>
                <div className="info-val">{data.seller?.name || 'Vendeur BoutiKonect'}</div>
                <div className="info-sub">{data.seller?.email || 'Contact vérifié'}</div>
              </div>
              <div className="info-col text-right">
                <label>Date de Paiement</label>
                <div className="info-val">{formatDate(data.date)}</div>
                <div className="info-sub">Heure locale de Cotonou</div>
              </div>
            </div>

            <div className="billing-box">
              <div className="billing-title">Détails de la Promotion</div>
              <div className="billing-item">
                <span>Description du Service</span>
                <strong>Promotion "Vedette" - {data.productTitle}</strong>
              </div>
              <div className="billing-item">
                <span>ID Transaction</span>
                <span className="mono">{data.transactionId}</span>
              </div>
              <div className="billing-item">
                <span>Méthode de règlement</span>
                <span>FedaPay Mobile Money</span>
              </div>
              <div className="billing-total">
                <span>Total Payé</span>
                <span className="total-amount">{formatPrice(data.plan?.price || 0)}</span>
              </div>
            </div>

            <div className="modern-footer-vertical">
              <div className="footer-qr-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=BoutiKonect-TX-${data.transactionId}`} 
                  alt="QR Validation" 
                />
                <span>SCAN DE VALIDITÉ</span>
              </div>

              <div className="footer-legal-flow">
                <p>Ce document certifie le paiement des frais de promotion sur BoutiKonect.bj.</p>
                <p>BoutiKonect.bj - République du Bénin</p>
                <p>Contact : support@boutikonect.bj | www.boutikonect.bj</p>
                <div className="secure-badge-center">
                  <ShieldCheck size={14} /> DOCUMENT SÉCURISÉ & AUTHENTIQUE
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
