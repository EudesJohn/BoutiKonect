/**
 * Service de génération de quittance (reçu) pour les paiements de promotion.
 * Génère un document HTML stylisé et ouvre la fenêtre d'impression du navigateur.
 */

const formatPrice = (amount) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);

/**
 * Génère et affiche la fenêtre d'impression d'une quittance de promotion.
 * @param {Object} params
 * @param {string} params.transactionId - ID de transaction FedaPay
 * @param {string} params.productTitle - Nom du produit promu
 * @param {string} params.productImage - URL de l'image du produit
 * @param {Object} params.plan - Plan de promotion { name, price, days }
 * @param {Object} params.seller - { name, email, phone }
 */
export function generatePromotionReceipt({ transactionId, productTitle, productImage, plan, seller }) {
  const receiptNumber = `BK-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = formatDate();
  const planDuration = plan.days === 3 ? '3 Jours' : plan.days === 7 ? '1 Semaine' : '1 Mois';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Quittance BoutiKonect - ${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 40px 20px;
    }
    .receipt {
      max-width: 680px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 30px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    /* Header */
    .receipt-header {
      background: linear-gradient(135deg, #FF6A00 0%, #FF8C00 100%);
      padding: 32px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand h1 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .brand p { font-size: 12px; opacity: 0.9; margin-top: 4px; }
    .receipt-badge {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      border-radius: 8px;
      padding: 8px 16px;
      text-align: center;
    }
    .receipt-badge span { font-size: 11px; opacity: 0.85; display: block; }
    .receipt-badge strong { font-size: 18px; }
    /* Status bar */
    .status-bar {
      background: #ecfdf5;
      border-top: 3px solid #10b981;
      padding: 14px 32px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-bar .icon { font-size: 22px; }
    .status-bar strong { color: #059669; font-size: 16px; }
    .status-bar span { color: #6b7280; font-size: 13px; margin-left: 6px; }
    /* Body */
    .receipt-body { padding: 32px; }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-item label {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-item p {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 2px;
    }
    /* Promotion summary box */
    .promo-box {
      background: linear-gradient(135deg, #fff7ed, #fffbeb);
      border: 1px solid #fed7aa;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .promo-box img {
      width: 72px;
      height: 72px;
      object-fit: cover;
      border-radius: 10px;
      border: 2px solid #fdba74;
      flex-shrink: 0;
    }
    .promo-box .promo-name { font-size: 18px; font-weight: 700; color: #c2410c; }
    .promo-box .plan-chip {
      display: inline-block;
      margin-top: 6px;
      background: #FF6A00;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 99px;
    }
    /* Amount table */
    .amount-table { width: 100%; border-collapse: collapse; }
    .amount-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .amount-table .label { color: #64748b; }
    .amount-table .value { text-align: right; font-weight: 600; color: #1e293b; }
    .amount-table .total-row td {
      padding-top: 16px;
      border-bottom: none;
      font-size: 18px;
      font-weight: 800;
    }
    .amount-table .total-row .label { color: #1e293b; }
    .amount-table .total-row .value { color: #FF6A00; font-size: 22px; }
    /* Footer */
    .receipt-footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .receipt-footer p { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .secure-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 99px;
      padding: 4px 12px;
    }
    .secure-badge span { font-size: 11px; font-weight: 600; color: #059669; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-header">
      <div class="brand">
        <h1>BoutiKonect<span style="color:#FFD700;">.</span>bj</h1>
        <p>Marketplace Officielle du Bénin</p>
      </div>
      <div class="receipt-badge">
        <span>N° Quittance</span>
        <strong>${receiptNumber}</strong>
      </div>
    </div>

    <div class="status-bar">
      <div class="icon">✅</div>
      <strong>Paiement Confirmé</strong>
      <span>— Traité par FedaPay le ${dateStr}</span>
    </div>

    <div class="receipt-body">
      
      <div class="section">
        <div class="section-title">🏷️ Annonce Promue</div>
        <div class="promo-box">
          ${productImage ? `<img src="${productImage}" alt="${productTitle}" />` : '<div style="width:72px;height:72px;background:#fed7aa;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:28px;">📦</div>'}
          <div>
            <div class="promo-name">${productTitle}</div>
            <div class="plan-chip">⭐ Vedette — ${planDuration}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">👤 Informations Vendeur</div>
        <div class="info-grid">
          <div class="info-item">
            <label>Nom</label>
            <p>${seller?.name || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Email</label>
            <p>${seller?.email || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Téléphone</label>
            <p>${seller?.phone || seller?.whatsapp || 'N/A'}</p>
          </div>
          <div class="info-item">
            <label>Date de paiement</label>
            <p>${dateStr}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">💳 Détail du Paiement</div>
        <table class="amount-table">
          <tr>
            <td class="label">Plan de promotion</td>
            <td class="value">${plan.name || planDuration}</td>
          </tr>
          <tr>
            <td class="label">Durée</td>
            <td class="value">${plan.days} jours</td>
          </tr>
          <tr>
            <td class="label">Moyen de paiement</td>
            <td class="value">FedaPay</td>
          </tr>
          <tr>
            <td class="label">ID Transaction FedaPay</td>
            <td class="value" style="font-family:monospace; font-size:12px;">${transactionId || 'N/A'}</td>
          </tr>
          <tr class="total-row">
            <td class="label">Montant Total Payé</td>
            <td class="value">${formatPrice(plan.price)}</td>
          </tr>
        </table>
      </div>

    </div>

    <div class="receipt-footer">
      <p>
        Ce document est une preuve officielle de paiement délivrée par BoutiKonect.<br>
        Conservez ce reçu pour vos archives. Contact : support@boutikonect.bj
      </p>
      <div class="secure-badge">
        <span>🔒 Paiement Sécurisé</span>
      </div>
    </div>
  </div>

  <div class="no-print" style="text-align:center; margin-top:24px;">
    <button onclick="window.print()" style="
      background: linear-gradient(135deg, #FF6A00, #FF8C00);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255,106,0,0.4);
    ">🖨️ Imprimer / Enregistrer en PDF</button>
    <button onclick="window.close()" style="
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 24px;
      font-size: 14px;
      cursor: pointer;
      margin-left: 12px;
    ">Fermer</button>
  </div>
</body>
</html>
  `;

  // Ouvrir dans une nouvelle fenêtre propre
  const win = window.open('', '_blank', 'width=760,height=900,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
    // Déclencher l'impression automatiquement après chargement
    win.onload = () => setTimeout(() => win.print(), 500);
  }
}
