import { ADMIN_EMAILS } from '../services/adminAuth'

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
    if (obj[key] !== undefined && obj[key] !== null) {
      newObj[key] = obj[key]
    }
  })
  return newObj
}

export function mapItemFromDB(item) {
  if (!item) return null;
  return {
    ...item,
    sellerId: item.seller_id,
    sellerName: item.seller_name,
    sellerCity: item.seller_city,
    sellerNeighborhood: item.seller_neighborhood,
    sellerAvatar: item.seller_avatar,
    priceType: item.price_type,
    isPromoted: item.is_promoted,
    promotionEndDate: item.promotion_end_date,
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
    sellerId, sellerName, buyerId, buyerName, buyerPhone, buyerAddress,
    paymentId, paymentStatus, paymentMethod, ...rest
  } = order;

  return cleanObject({
    ...rest,
    product_id: productId || serviceId,
    product_title: productTitle || serviceTitle,
    product_image: productImage,
    seller_id: sellerId,
    seller_name: sellerName,
    buyer_id: buyerId,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    buyer_address: buyerAddress,
    location: buyerAddress,
    delivery_address: buyerAddress,
    payment_id: paymentId,
    payment_status: paymentStatus,
    payment_method: paymentMethod
  });
}

export function mapItemToDB(item) {
  if (!item) return null;
  const { 
    sellerId, sellerName, sellerCity, sellerNeighborhood, sellerAvatar,
    priceType, isPromoted, promotionEndDate, ...rest 
  } = item;

  return cleanObject({
    ...rest,
    seller_id: sellerId,
    seller_name: sellerName,
    seller_city: sellerCity,
    seller_neighborhood: sellerNeighborhood,
    seller_avatar: sellerAvatar,
    price_type: priceType,
    is_promoted: isPromoted,
    promotion_end_date: promotionEndDate,
    latitude: item.latitude,
    longitude: item.longitude
  });
}
