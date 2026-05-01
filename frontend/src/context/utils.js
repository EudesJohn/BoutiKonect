import { ADMIN_EMAILS } from '../services/adminAuth'

/**
 * Sécurise une chaîne contre les injections XSS avant envoi en base
 */
export function sanitizeText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return String(value);
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

export function checkIsAdmin(profile) {
  if (!profile) return false;
  return profile.is_admin === true || 
         profile.role === 'admin' || 
         (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase()));
}

export function parseDate(dateValue) {
  if (!dateValue) return new Date();
  let normalizedDate = dateValue;
  if (typeof dateValue === 'string') {
    if (dateValue.includes(' ') && !dateValue.includes('T')) {
      normalizedDate = dateValue.replace(' ', 'T');
    }
  }
  const d = new Date(normalizedDate);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function cleanObject(obj) {
  if (!obj) return {};
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      newObj[key] = obj[key]
    }
  })
  return newObj
}

export function mapItemFromDB(item) {
  if (!item) return null;
  const rawImages = Array.isArray(item.images) ? item.images : (item.images ? [item.images] : []);
  return {
    ...item,
    images: rawImages.length > 0 ? rawImages : ['https://via.placeholder.com/600'],
    sellerId: item.seller_id,
    sellerName: item.seller_name,
    sellerCity: item.seller_city,
    sellerNeighborhood: item.seller_neighborhood,
    sellerAvatar: item.seller_avatar,
    priceType: item.price_type,
    isPromoted: item.is_promoted,
    promotionEndDate: item.promotion_end_date,
    lastTransactionId: item.last_transaction_id,
    promotionPlanName: item.promotion_plan_name,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

export function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

export function mapOrderFromDB(order) {
  if (!order) return null;
  return {
    ...order,
    productId: order.product_id,
    productTitle: order.product_title,
    productImage: order.product_image,
    sellerId: order.seller_id,
    sellerName: order.seller_name,
    buyerId: order.buyer_id,
    buyerName: order.buyer_name,
    buyerPhone: order.buyer_phone,
    buyerAddress: order.buyer_address,
    createdAt: order.created_at
  }
}

export function mapOrderToDB(order) {
  if (!order) return null;
  const {
    productId, productTitle, productImage, serviceId, serviceTitle,
    sellerId, sellerName, sellerCity, sellerNeighborhood, buyerId, buyerName, buyerPhone, buyerAddress,
    paymentId, paymentStatus, paymentMethod, ...rest
  } = order;

  // Normaliser payment_status en minuscules pour correspondre à la contrainte CHECK SQL
  const normalizedPaymentStatus = paymentStatus
    ? paymentStatus.toLowerCase().trim()
    : null;

  // Colonnes de base toujours présentes dans la table orders
  const dbOrder = {
    product_id:      productId || serviceId || null,
    product_title:   sanitizeText(productTitle || serviceTitle),
    product_image:   productImage || null,
    seller_id:       sellerId || null,
    seller_name:     sanitizeText(sellerName),
    buyer_id:        buyerId || null,
    buyer_name:      sanitizeText(buyerName),
    buyer_phone:     buyerPhone ? buyerPhone.replace(/[^\d+\-\s]/g, '').trim() : null,
    buyer_address:   sanitizeText(buyerAddress),
    price:           order.price || null,
    quantity:        order.quantity || 1,
    status:          order.status || 'pending',
    // Colonnes de paiement (ajoutées via migration SQL fix_all_issues.sql)
    payment_id:      paymentId || null,
    payment_status:  normalizedPaymentStatus,
    payment_method:  paymentMethod || null
  };

  // Filtrer les valeurs null/undefined pour éviter les erreurs PostgREST
  return Object.fromEntries(
    Object.entries(dbOrder).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );
}

export function mapItemToDB(item) {
  if (!item) return null;
  const { 
    sellerId, seller_id,
    sellerName, seller_name,
    sellerCity, seller_city,
    sellerNeighborhood, seller_neighborhood,
    sellerAvatar, seller_avatar,
    priceType, price_type,
    isPromoted, is_promoted,
    promotionEndDate, promotion_end_date,
    ...rest 
  } = item;

  return cleanObject({
    ...rest,
    seller_id: sellerId || seller_id,
    seller_name: sellerName || seller_name,
    seller_city: sellerCity || seller_city,
    seller_neighborhood: sellerNeighborhood || seller_neighborhood,
    seller_avatar: sellerAvatar || seller_avatar,
    price_type: priceType || price_type,
    is_promoted: isPromoted || is_promoted,
    promotion_end_date: promotionEndDate || promotion_end_date,
    latitude: item.latitude,
    longitude: item.longitude
  });
}
