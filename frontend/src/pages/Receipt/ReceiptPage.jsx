import { useEffect, useState, useContext, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, ShieldCheck } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { AppContext } from '../../context/AppContextInstance';
import './Receipt.css';

// --- Helpers hors du composant : pas recréés à chaque rendu ---
const formatPrice = (amount) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

const formatDate = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
};

export default function ReceiptPage() {
  // --- Données et États ---
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, services, seller } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Chargement des données de la quittance ---
  useEffect(() => {
    // 1. sessionStorage — données fraîches après paiement
    try {
      const stored = sessionStorage.getItem('last_promotion_receipt');
      if (stored) {
        try {
          setData(JSON.parse(stored));
          return;
        } catch {
          // Données corrompues — ignorer et continuer
          sessionStorage.removeItem('last_promotion_receipt');
        }
      }
    } catch {
      // sessionStorage inaccessible (mode privé strict) — continuer
    }

    // 2. Via ID produit (historique)
    const pid = searchParams.get('pid');
    if (pid) {
      const allItems = [...products, ...services];
      const item = allItems.find(p => p.id === pid);

      if (item?.lastTransactionId) {
        setData({
          productId: item.id,
          transactionId: item.lastTransactionId,
          productTitle: item.title || 'Produit',
          productImage: item.images?.[0] || null,
          plan: {
            name: item.promotionPlanName || 'Promotion Vedette',
            price: Number.isFinite(item.promotion_plan_price) ? item.promotion_plan_price : 0,
            days: item.promotion_plan_days || item.promotionDays || 0
          },
          seller: seller || { name: item.sellerName || 'Vendeur' },
          date: item.promotion_start_date || item.updatedAt || new Date().toISOString()
        });
        return;
      }
    }

    // 3. Fallback sur les query params directs
    const tid = searchParams.get('tid');
    const title = searchParams.get('title');
    const rawPrice = searchParams.get('price');
    const parsedPrice = parseInt(rawPrice, 10);

    if (tid && title && Number.isFinite(parsedPrice)) {
      setData({
        productId: searchParams.get('pid'),
        transactionId: tid,
        productTitle: title,
        plan: { price: parsedPrice, name: searchParams.get('plan') || 'Promotion' },
        seller: { name: searchParams.get('seller') || 'Client' },
        date: new Date().toISOString()
      });
    }
  }, [searchParams, products, services, seller]);

  // --- Téléchargement PDF Direct ---
  const handleDownloadPDF = useCallback(() => {
    if (!data) return;

    setIsGenerating(true);
    const element = document.getElementById('receipt-content-to-export');
    
    // Options optimisées pour une fidélité maximale "Photo"
    const opt = {
      margin: 0,
      filename: `Quittance_BoutiKonect_${data.transactionId || 'export'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 3, // Haute résolution
        useCORS: true, // Pour les images externes (avatars, logos)
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Largeur fixe pour éviter les media queries de mobile
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Exécution directe
    html2pdf().from(element).set(opt).save()
      .then(() => {
        setIsGenerating(false);
      })
      .catch(err => {
        console.error('Erreur de génération PDF:', err);
        setIsGenerating(false);
        // Fallback ultime si erreur fatale
        window.print();
      });
  }, [data]);

  // --- État vide avec bouton de ré-essai ---
  if (!data) {
    return (
      <div className="receipt-page-empty">
        <div className="container">
          <h2>Quittance introuvable</h2>
          <p>Désolé, nous n'avons pas pu charger les détails de cette quittance.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Réessayer
            </button>
            <Link to="/profile" className="btn btn-primary">Retour au profil</Link>
          </div>
        </div>
      </div>
    );
  }

  // receiptNumber : BK- suivi des 8 derniers caractères de l'ID de transaction
  // Si transactionId est absent, on génère un identifiant basé sur l'heure courante
  const receiptNumber = data.transactionId
    ? `BK-${data.transactionId.toString().slice(-8).toUpperCase()}`
    : `BK-${Date.now().toString(36).toUpperCase()}`;

  // QR data : valeur de secours si transactionId manquant
  const qrData = data.transactionId
    ? `BoutiKonect-TX-${data.transactionId}`
    : 'BoutiKonect-TX-unknown';

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
              {isGenerating ? 'Génération...' : <><Download size={18} /> Télécharger la Quittance (PDF)</>}
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
              <img src="/logo.jpg" alt="BoutiKonect Logo" className="receipt-logo" />
              <div className="header-left-text">
                <div className="logo-text">BoutiKonect<span>.</span>bj</div>
                <p>République du Bénin</p>
              </div>
            </div>
            <div className="header-right">
              <h2>QUITTANCE DE PAIEMENT</h2>
              <div className="receipt-no">Réf: {receiptNumber}</div>
            </div>
          </div>

          <div className="modern-body">
            <div className="status-indicator">
              <div className="indicator-dot"></div>
              <span>Transaction Confirmée &amp; Sécurisée</span>
            </div>

            <div className="product-preview-section">
              {data.productImage && (
                <img src={data.productImage} alt={data.productTitle} className="product-receipt-img" />
              )}
              <div className="product-receipt-info">
                <h3>{data.productTitle}</h3>
                <p>Plan : {data.plan?.name || 'Vedette'}</p>
                <p>Durée : {data.plan?.days || 30} jours</p>
              </div>
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
                <strong>Promotion &quot;Vedette&quot; - {data.productTitle}</strong>
              </div>
              <div className="billing-item">
                <span>ID Transaction</span>
                <span className="mono">{data.transactionId || '—'}</span>
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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`}
                  alt="QR Validation"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextSibling;
                    if (fallback) fallback.textContent = `TX: ${data.transactionId || '—'}`;
                  }}
                />
                <span>Vérifié</span>
              </div>

              <div className="footer-legal-flow">
                <p>Ce document certifie le paiement des frais de promotion sur BoutiKonect.bj.</p>
                <p>BoutiKonect.bj - République du Bénin</p>
                <p>Contact : support@boutikonect.bj | www.boutikonect.bj</p>
                <div className="secure-badge-center">
                  <ShieldCheck size={14} /> DOCUMENT SÉCURISÉ &amp; AUTHENTIQUE
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
