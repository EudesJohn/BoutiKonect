import { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { categories, serviceCategories } from '../../context/constants'
import { Plus, Image as ImageIcon, Trash2, CheckCircle, ArrowLeft, Package, Edit2, X, Store, MessageCircle, ShoppingBag, Zap, Briefcase, AlertTriangle, Loader2 } from 'lucide-react'
import './Publish.css'
import PromoteModal from './PromoteModal'

export default function Publish() {
  const { 
    seller, user, 
    addProduct, products, deleteProduct, updateProduct, 
    addService, services, deleteService, updateService,
    upgradeToSeller, formatPrice, checkIsAdmin 
  } = useContext(AppContext)
  const navigate = useNavigate()
  
  const [publishType, setPublishType] = useState('product') // 'product' | 'service'
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priceType: 'Fixe', // Nouveauté pour les services: Fixe, Devis, /Heure, /Jour, etc.
    category: '',
    condition: 'Neuf', // Neuf, Très bon état, Bon état, Satisfaisant
    stock: 1,
    duration: '', // Nouveauté pour les services: 1h, 4h, 1j, sem
    experience: '', // Nouveauté pour les services (ex: "5 ans")
    images: [],
    whatsapp: seller?.whatsapp || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [productToPromote, setProductToPromote] = useState(null)

  useEffect(() => {
    if (!seller && !user) {
      navigate('/login')
    }
  }, [seller, user, navigate])

  const isAdmin = checkIsAdmin(seller) || checkIsAdmin(user)
  const sellerProducts = products.filter(p => p.sellerId === seller?.id).filter(p => p.type === 'product' || !p.type)
  const sellerServices = services.filter(s => s.sellerId === seller?.id)

  const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    let cleaned = phone.replace(/^\+?229/, '')
    return '+229' + cleaned
  }


  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis'
    if (!formData.description.trim()) newErrors.description = 'La description est requise'
    if (publishType === 'product' && !formData.price) newErrors.price = 'Le prix est requis'
    if (!formData.category) newErrors.category = 'La catégorie est requise'
    if (publishType === 'product' && formData.stock < 1) newErrors.stock = 'Le stock doit être au moins 1'
    if (formData.images.length === 0) newErrors.images = 'Au moins une image est requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // --- Compression d'image avant upload (canvas) ---
  const compressImage = (base64Str, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.images.length === 0) {
      setErrors({...errors, images: 'Au moins une image est requise'})
      return
    }
    
    if (validateForm()) {
      if (!seller) {
        setErrors({ general: "Vos informations de vendeur ne sont pas encore chargées. Veuillez patienter un instant." })
        return
      }
      const formattedWhatsapp = formatPhoneNumber(formData.whatsapp)
      
      const itemData = {
        title: formData.title,
        description: formData.description,
        type: publishType,
        price: (formData.price && !isNaN(formData.price)) ? parseInt(formData.price) : 0,
        category: formData.category,
        images: formData.images,
        whatsapp: formattedWhatsapp,
        seller_id: seller.id,
        seller_name: seller.name,
        seller_city: seller.city || '',
        seller_neighborhood: seller.neighborhood || '',
        seller_avatar: seller.avatar || '',
      }

      // Add conditional fields and remove unwanted ones
      if (publishType === 'product') {
        itemData.stock = parseInt(formData.stock) || 1
        itemData.condition = formData.condition || 'Neuf'
      } else {
        itemData.price_type = formData.priceType || 'Fixe'
        itemData.experience = formData.experience
        itemData.duration = formData.duration
      }

      setIsSubmitting(true)
      setErrors({})
      console.log("Données de publication préparées:", itemData)

      // Vérification de la taille des images (limite indicative de 2Mo au total pour base64)
      const totalSize = JSON.stringify(itemData.images).length
      if (totalSize > 5000000) { // ~5MB
        setErrors({ general: "Les images sont trop lourdes. Veuillez en supprimer ou réduire leur taille." })
        setIsSubmitting(false)
        return
      }

      // 🛡️ SÉCURITÉ : Vérifier si l'utilisateur est bien enregistré comme vendeur
      if (!seller || !seller.is_seller) {
        setErrors({ general: "Action non autorisée. Vous devez être enregistré comme vendeur pour publier." })
        setIsSubmitting(false)
        return
      }

      let result;
      try {
        if (editingProduct) {
          console.log("Mise à jour de l'item:", editingProduct.id)
          if (publishType === 'product') {
            result = await updateProduct(editingProduct.id, itemData)
          } else {
            result = await updateService(editingProduct.id, itemData)
          }
        } else {
          console.log("Ajout d'un nouvel item")
          if (publishType === 'product') {
            result = await addProduct(itemData)
          } else {
            result = await addService(itemData)
          }
        }

        console.log("Résultat Supabase:", result)

        if (result && (result.success || result === undefined)) {
          setSuccess(true)
          setEditingProduct(null)
          setFormData({
            title: '',
            description: '',
            price: '',
            priceType: 'Fixe',
            category: '',
            condition: 'Neuf',
            stock: 1,
            experience: '',
            duration: '',
            images: [],
            whatsapp: seller?.whatsapp || ''
          })
          window.scrollTo(0, 0)
          
          // Notification de succès
          setTimeout(() => {
            navigate(publishType === 'product' ? '/my-products' : '/my-services')
          }, 2000)
        } else {
          const errorMsg = result?.error || "Une erreur est survenue lors de la publication. Vérifiez votre connexion."
          console.error("Échec publication:", errorMsg)
          setErrors({ general: errorMsg })
        }
      } catch (error) {
        console.error("Erreur soumission:", error)
        setErrors({ general: "Une erreur inattendue est survenue. Veuillez réessayer." })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setErrors(prev => ({ ...prev, general: "Veuillez corriger les erreurs dans le formulaire." }))
    }
  }

  const handleEditItem = (item, type) => {
    setPublishType(type)
    setEditingProduct(item)
    setFormData({
      title: item.title || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      priceType: item.priceType || 'Fixe',
      category: item.category || '',
      condition: item.condition || 'Neuf',
      stock: item.stock || 1,
      experience: item.experience || '',
      duration: item.duration || '',
      images: item.images || [],
      whatsapp: item.whatsapp || seller?.whatsapp || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setFormData({
      title: '',
      description: '',
      price: '',
      priceType: 'Fixe',
      category: '',
      condition: 'Neuf',
      stock: 1,
      experience: '',
      duration: '',
      images: [],
      whatsapp: seller?.whatsapp || ''
    })
  }

  const handlePromoteClick = (product) => {
    setProductToPromote(product)
    setShowPromoteModal(true)
  }


  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (formData.images.length + files.length > 5) {
      alert('Maximum 5 images autorisées')
      return
    }

    setIsSubmitting(true)
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader()
      const base64 = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
      
      try {
        const compressed = await compressImage(base64)
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, compressed]
        }))
      } catch (err) {
        console.error("Erreur compression:", err)
      }
    }
    setIsSubmitting(false)
  }

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    })
    if (formData.images.length <= 1) {
      setErrors({...errors, images: 'Au moins une image est requise'})
    }
  }

  const isLoggedIn = seller || user
  const isOnlyUser = user && !seller

  if (!isLoggedIn) {
    return null
  }

  // Show message to non-seller users who want to become sellers
  if (isOnlyUser) {
    return (
      <div className="publish-page">
        <div className="container">
          <motion.div
            className="become-seller-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="become-seller-icon">
              <Store size={64} />
            </div>
            <h1>Devenez Vendeur sur BoutiKonect.bj</h1>
            <p>Vous êtes actuellement connecté en tant qu'acheteur. Pour publier des produits et commencer à vendre, vous devez devenir vendeur.</p>
            
            <div className="seller-benefits">
              <div className="benefit">
                <Package size={24} />
                <span>Publiez vos produits</span>
              </div>
              <div className="benefit">
                <ShoppingBag size={24} />
                <span>Gérez vos commandes</span>
              </div>
              <div className="benefit">
                <MessageCircle size={24} />
                <span>Contact direct avec les clients</span>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-large"
              onClick={async () => {
                await upgradeToSeller(user.id, {})
                window.location.reload()
              }}
            >
              <Plus size={20} />
              Devenir vendeur
            </button>
            
            <Link to="/" className="back-link">
              <ArrowLeft size={18} />
              Retour à l'accueil
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="publish-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Retour
        </button>

        <div className="publish-layout">
          {seller && (
            <motion.div
              className="publish-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="publish-header">
                <div className="publish-icon">
                  {publishType === 'product' ? <Package size={28} /> : <Briefcase size={28} />}
                </div>
                <h1>Publier une Annonce</h1>
                <p>Choisissez le type d'annonce et remplissez les informations</p>
              </div>

              {/* Type Switcher */}
              {!editingProduct && (
                <div className="publish-type-switcher">
                  <button 
                    className={`type-btn ${publishType === 'product' ? 'active' : ''}`}
                    onClick={() => setPublishType('product')}
                  >
                    <Package size={20} />
                    Un Produit
                  </button>
                  <button 
                    className={`type-btn ${publishType === 'service' ? 'active' : ''}`}
                    onClick={() => setPublishType('service')}
                  >
                    <Briefcase size={20} />
                    Un Service
                  </button>
                </div>
              )}

              {success && (
                <motion.div 
                  className="success-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle size={20} />
                  {editingProduct ? 'Annonce mise à jour avec succès!' : 'Annonce publiée avec succès!'}
                </motion.div>
              )}

              {errors.general && (
                <div className="error-alert" style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', background: 'rgba(255, 23, 68, 0.1)', color: '#FF1744', border: '1px solid currentColor', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} />
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="publish-form">
                <div className="form-group">
                  <label className="form-label">{publishType === 'product' ? 'Titre du produit' : 'Titre du service'}</label>
                  <input 
                    type="text" 
                    className={`form-input ${errors.title ? 'error' : ''}`}
                    placeholder={publishType === 'product' ? "Ex: iPhone 14 Pro Max 256Go" : "Ex: Dépannage Plomberie 24/7"}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  {errors.title && <span className="error-text">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className={`form-input ${errors.description ? 'error' : ''}`}
                    placeholder={`Décrivez votre ${publishType === 'product' ? 'produit' : 'service'} en détail...`}
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prix (XOF) {publishType === 'service' && <span className="optional">- Optionnel</span>}</label>
                    <input 
                      type="number" 
                      className={`form-input ${errors.price ? 'error' : ''}`}
                      placeholder={publishType === 'product' ? "Ex: 650000" : "Ex: 5000"}
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                    {errors.price && <span className="error-text">{errors.price}</span>}
                  </div>

                  {publishType === 'service' && (
                    <div className="form-group">
                      <label className="form-label">Type de prix</label>
                      <select 
                        className="form-select"
                        value={formData.priceType}
                        onChange={(e) => setFormData({...formData, priceType: e.target.value})}
                      >
                        <option value="Fixe">Prix Fixe</option>
                        <option value="Devis">Sur Devis</option>
                        <option value="/Heure">Par Heure</option>
                        <option value="/Jour">Par Jour</option>
                        <option value="/Mois">Par Mois</option>
                        <option value="/Prestation">Par Prestation</option>
                      </select>
                    </div>
                  )}

                  {publishType === 'service' && (
                    <div className="form-group">
                      <label className="form-label">Durée estimée</label>
                      <select 
                        className="form-select"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      >
                        <option value="">Non spécifié</option>
                        <option value="1h">1 Heure</option>
                        <option value="4h">4 Heures</option>
                        <option value="1j">1 Jour</option>
                        <option value="sem">1 Semaine</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Catégorie</label>
                    <select 
                      className={`form-select ${errors.category ? 'error' : ''}`}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {(publishType === 'product' ? categories : serviceCategories).map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>
                </div>

                <div className="form-row">
                  {publishType === 'product' ? (
                    <div className="form-group">
                      <label className="form-label">État du produit</label>
                      <select 
                        className="form-select"
                        value={formData.condition}
                        onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      >
                        <option value="Neuf">Neuf</option>
                        <option value="Très bon état">Très bon état</option>
                        <option value="Bon état">Bon état</option>
                        <option value="Satisfaisant">Satisfaisant</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Expérience (Optionnel)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Ex: 5 ans, Certifié, etc."
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  {publishType === 'product' && (
                    <div className="form-group">
                      <label className="form-label">Stock (Quantité)</label>
                      <input 
                        type="number" 
                        className={`form-input ${errors.stock ? 'error' : ''}`}
                        placeholder="Ex: 10"
                        value={formData.stock}
                        min="1"
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      />
                      {errors.stock && <span className="error-text">{errors.stock}</span>}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input 
                      type="tel" 
                      className="form-input"
                      placeholder="+2290140571373"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <ImageIcon size={18} />
                    Images du produit
                  </label>
                  
                  <div className="file-upload-wrapper">
                    <label className="file-upload-label">
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="file-input"
                      />
                      <span className="file-upload-btn">
                        <Plus size={18} />
                        Parcourir les images
                      </span>
                    </label>
                  </div>

                  {errors.images && (
                    <span className="error-text">{errors.images}</span>
                  )}

                  {formData.images.length > 0 && (
                    <div className="image-previews">
                      {formData.images.map((img, index) => (
                        <div key={index} className="image-preview">
                          <img src={img} alt={`Preview ${index + 1}`} />
                          <button 
                            type="button"
                            className="remove-image"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-large"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      {editingProduct ? 'Mettre à jour' : (publishType === 'product' ? 'Publier le produit' : 'Publier le service')}
                    </>
                  )}
                </button>
              </form>

              {editingProduct && (
                <button 
                  type="button" 
                  className="btn btn-outline btn-large"
                  onClick={handleCancelEdit}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  <X size={20} />
                  Annuler
                </button>
              )}
            </motion.div>
          )}

          <div className="seller-products">
            <h2>Mes Annonces ({sellerProducts.length + sellerServices.length})</h2>
            
            {sellerProducts.length > 0 || sellerServices.length > 0 ? (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Type</th>
                      <th>Titre</th>
                      <th>Prix</th>
                      <th>Catégorie</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Products */}
                    {sellerProducts.map(product => (
                      <tr key={product.id} className="product-row">
                        <td className="product-image-cell">
                          <img 
                            src={product.images[0] || 'https://via.placeholder.com/100'} 
                            alt={product.title}
                          />
                        </td>
                        <td className="product-type-cell">
                          <span className="type-badge product">Produit</span>
                        </td>
                        <td className="product-title-cell">
                          <span className="product-title">{product.title}</span>
                        </td>
                        <td className="product-price-cell">
                          <span className="product-price">{formatPrice(product.price)}</span>
                        </td>
                        <td className="product-category-cell">
                          <span className="product-category">{product.category}</span>
                        </td>
                        <td className="product-actions-cell">
                          <div className="action-buttons">
                            <button 
                              className="btn btn-primary btn-small"
                              onClick={() => handleEditItem(product, 'product')}
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <Link to={`/product/${product.id}`} className="btn btn-outline btn-small">
                              Voir
                            </Link>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
                                  deleteProduct(product.id)
                                }
                              }}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                            {!product.isPromoted && (
                              <button
                                className="btn btn-highlight btn-small"
                                onClick={() => handlePromoteClick(product)}
                                title="Mettre en avant"
                              >
                                <Zap size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Render Services */}
                    {sellerServices.map(service => (
                      <tr key={service.id} className="product-row">
                        <td className="product-image-cell">
                          <img 
                            src={service.images[0] || 'https://via.placeholder.com/100'} 
                            alt={service.title}
                          />
                        </td>
                        <td className="product-type-cell">
                          <span className="type-badge service">Service</span>
                        </td>
                        <td className="product-title-cell">
                          <span className="product-title">{service.title}</span>
                        </td>
                        <td className="product-price-cell">
                          <span className="product-price">
                            {service.priceType === 'Devis' ? 'Devis' : formatPrice(service.price)}
                          </span>
                        </td>
                        <td className="product-category-cell">
                          <span className="product-category">{service.category}</span>
                        </td>
                        <td className="product-actions-cell">
                          <div className="action-buttons">
                            <button 
                              className="btn btn-primary btn-small"
                              onClick={() => handleEditItem(service, 'service')}
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <Link to={`/service/${service.id}`} className="btn btn-outline btn-small">
                              Voir
                            </Link>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service?')) {
                                  deleteService(service.id)
                                }
                              }}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                            {!service.isPromoted && (
                              <button
                                className="btn btn-highlight btn-small"
                                onClick={() => handlePromoteClick(service)}
                                title="Mettre en avant"
                              >
                                <Zap size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-products">
                <Package size={48} />
                <p>Vous n'avez pas encore d'annonces</p>
                <p>Publiez votre premier produit ou service!</p>
              </div>
            )}
          </div>
        </div>

        {showPromoteModal && productToPromote && (
          <PromoteModal
            product={productToPromote}
            onClose={() => setShowPromoteModal(false)}
          />
        )}
      </div>
    </div>
  )
}
