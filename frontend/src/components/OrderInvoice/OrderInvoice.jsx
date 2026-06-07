import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Printer, Download, Home, ShoppingBag, Package, MapPin, Phone, User, Calendar, Loader, FileText, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import './OrderInvoice.css'

/**
 * Generate a human-readable order reference
 * Format: BK-XXXXXX-YYMMDDHHMM
 */
const generateOrderRef = (index = 0) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const now = new Date()
  const ts = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  return `BK-${rand}-${ts}${index > 0 ? `-${index + 1}` : ''}`
}

/**
 * Format price in XOF
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * Format date to French locale
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format short date for invoice
 */
const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export default function OrderInvoice({
  items,
  buyerName,
  buyerPhone,
  buyerAddress,
  buyerEmail,
  total,
  orderDate = new Date(),
  orderIndex = 0,
  paymentMethod = 'Commande directe',
  paymentStatus = 'En attente',
  showActions = true
}) {
  const invoiceRef = useRef(null)
  const orderRef = generateOrderRef(orderIndex)
  // États de la génération PDF — machine à états simple pour éviter les combinaisons impossibles
  const [pdfStatus, setPdfStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [pdfErrorMessage, setPdfErrorMessage] = useState(null)
  const timeoutRef = useRef(null)

  const isPaid = paymentStatus === 'Payé' || paymentStatus === 'paid'
  const pdfLoading = pdfStatus === 'loading'
  const showSuccessToast = pdfStatus === 'success'
  const pdfError = pdfStatus === 'error' ? pdfErrorMessage : null

  // Nettoyer les timeouts au démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  /**
   * Génère un vrai fichier PDF avec html2pdf.js
   * Fallback vers window.print() si la librairie n'est pas disponible
   */
  const handleDownload = async () => {
    setPdfStatus('loading')
    setPdfErrorMessage(null)

    try {
      // Tenter d'importer html2pdf.js dynamiquement
      let html2pdf
      try {
        const mod = await import('html2pdf.js')
        html2pdf = mod.default || mod
      } catch {
        // Si l'import échoue, essayer via window
        if (typeof window.html2pdf === 'function') {
          html2pdf = window.html2pdf
        } else {
          throw new Error('html2pdf not available')
        }
      }

      if (!html2pdf) throw new Error('html2pdf not available')

      const element = invoiceRef.current
      if (!element) throw new Error('Invoice element not found')

      // Options de génération PDF optimisées
      const opt = {
        margin:        [0.5, 0.5, 0.5, 0.5], // top, right, bottom, left (in)
        filename:     `facture-${orderRef}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  {
          scale:       2,
          useCORS:     true,
          logging:     false,
          backgroundColor: '#ffffff',
          width:       element.scrollWidth,
          height:      element.scrollHeight,
          windowWidth: element.scrollWidth
        },
        jsPDF:        {
          unit:        'in',
          format:      'a4',
          orientation: 'portrait'
        },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      }

      await html2pdf().set(opt).from(element).save()

      setPdfStatus('success')
      timeoutRef.current = setTimeout(() => setPdfStatus('idle'), 3000)
    } catch (err) {
      console.warn('PDF generation failed, falling back to print:', err)
      setPdfErrorMessage("Génération PDF indisponible sur cet appareil. Utilisation de l'impression navigateur.")
      setPdfStatus('error')
      // Fallback: ouvrir la boîte de dialogue d'impression
      timeoutRef.current = setTimeout(() => {
        window.print()
        setPdfStatus('idle')
        setPdfErrorMessage(null)
      }, 500)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <motion.div
      className="invoice-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Success Toast */}
      {showSuccessToast && (
        <motion.div
          className="invoice-toast"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <CheckCircle size={20} />
          <span>PDF téléchargé avec succès !</span>
        </motion.div>
      )}

      {/* PDF Error Alert */}
      {pdfError && (
        <motion.div
          className="invoice-alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={18} />
          <span>{pdfErrorMessage}</span>
        </motion.div>
      )}

      {/* Success Banner */}
      <motion.div
        className="invoice-success-banner"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <div className="banner-icon">
          <CheckCircle size={48} />
        </div>
        <h1>Commande confirmée !</h1>
        <p>Merci pour votre achat. Le vendeur vous contactera bientôt.</p>
      </motion.div>

      {/* Invoice Document */}
      <div className="invoice-document-wrapper" ref={invoiceRef}>
        <div className="invoice-document">
          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="invoice-brand">
              <div className="brand-logo">
                <Package size={28} />
                <span className="brand-name">Bouti<span className="brand-accent">Konect</span></span>
              </div>
              <p className="brand-tagline">Marché de confiance au Bénin</p>
            </div>
            <div className="invoice-meta">
              <h2>Facture</h2>
              <p className="invoice-ref">{orderRef}</p>
              <div className="invoice-date">
                <Calendar size={14} />
                <span>{formatShortDate(orderDate)}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`invoice-status ${isPaid ? 'paid' : 'pending'}`}>
            <span className="status-dot" />
            {isPaid ? 'Payée' : 'En attente de paiement'}
          </div>

          {/* Buyer Info */}
          <div className="invoice-buyer">
            <h3><User size={16} /> Acheteur</h3>
            <div className="buyer-details">
              <div className="buyer-row">
                <span className="buyer-label">Nom</span>
                <span className="buyer-value">{buyerName || 'Non renseigné'}</span>
              </div>
              <div className="buyer-row">
                <span className="buyer-label"><Phone size={14} /></span>
                <span className="buyer-value">{buyerPhone || 'Non renseigné'}</span>
              </div>
              {buyerAddress && (
                <div className="buyer-row">
                  <span className="buyer-label"><MapPin size={14} /></span>
                  <span className="buyer-value">{buyerAddress}</span>
                </div>
              )}
              {buyerEmail && (
                <div className="buyer-row">
                  <span className="buyer-label">Email</span>
                  <span className="buyer-value">{buyerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="invoice-items">
            <h3>Articles commandés</h3>
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th className="th-product">Produit</th>
                    <th className="th-qty">Qté</th>
                    <th className="th-price">Prix unit.</th>
                    <th className="th-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items && items.length > 0 ? (
                    items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="td-product">
                          <div className="product-info">
                            {item.images?.[0] && (
                              <img src={item.images[0]} alt={item.title} className="product-thumb" />
                            )}
                            <div>
                              <span className="product-title">{item.title}</span>
                              {item.sellerName && (
                                <span className="product-seller">Vendu par {item.sellerName}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="td-qty">{item.quantity}</td>
                        <td className="td-price">{formatPrice(item.price)}</td>
                        <td className="td-total">{formatPrice(item.price * (item.quantity || 1))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="td-empty">Aucun article</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="invoice-totals">
            <div className="total-row subtotal">
              <span>Sous-total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="total-row shipping">
              <span>Livraison</span>
              <span className="free">Gratuite</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span className="total-amount">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="invoice-payment">
            <div className="payment-row">
              <span>Moyen de paiement</span>
              <span>{paymentMethod}</span>
            </div>
            <div className="payment-row">
              <span>Statut</span>
              <span className={`payment-status-badge ${isPaid ? 'paid' : 'pending'}`}>
                {isPaid ? 'Payé' : 'À payer à la livraison'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="footer-contact">
              <Package size={16} />
              <span>BoutiKonect.bj — Votre marché de confiance</span>
            </div>
            <p className="footer-legal">
              Cette facture est générée automatiquement. Pour toute réclamation,
              contactez le service client via l'application.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <motion.div
          className="invoice-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="actions-primary">
            <button
              className="btn btn-primary btn-with-icon btn-download"
              onClick={handleDownload}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <><Loader size={20} className="spin" /> Génération PDF...</>
              ) : (
                <><Download size={20} /> Télécharger (PDF)</>
              )}
            </button>

            <button className="btn btn-outline btn-with-icon" onClick={handlePrint}>
              <Printer size={20} />
              Imprimer
            </button>
          </div>

          <div className="actions-links">
            <Link to="/" className="btn btn-outline btn-with-icon">
              <Home size={18} />
              Accueil
            </Link>
            <Link to="/products" className="btn btn-outline btn-with-icon">
              <ShoppingBag size={18} />
              Continuer vos achats
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
