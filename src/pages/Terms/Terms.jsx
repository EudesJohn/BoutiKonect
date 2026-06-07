import { Link } from 'react-router-dom'
import { ArrowLeft, Scale, Shield, Users, ShoppingCart, AlertCircle } from 'lucide-react'
import './Terms.css'

export default function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </Link>

        <h1 className="terms-title">
          <Scale size={32} />
          Conditions d'Utilisation
        </h1>
        <p className="terms-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="terms-content">
          <section className="terms-section">
            <h2><ShoppingCart size={24} /> 1. Introduction</h2>
            <p>
             Bienvenue sur BoutiKonect.bj, votre marketplace locale de confiance au Bénin. 
              Les présentes Conditions d'Utilisation régissent votre accès et votre utilisation 
              de notre plateforme de commerce en ligne.
            </p>
            <p>
              En accédant à BoutiKonect.bj, vous acceptez d'être lié par ces conditions. 
              Si vous n'acceptez pas certaines dispositions, veuillez ne pas utiliser notre site.
            </p>
          </section>

          <section className="terms-section">
            <h2><Users size={24} /> 2. Définitions</h2>
            <ul>
              <li><strong>"Plateforme"</strong> : Le site web BoutiKonect.bj et tous ses services</li>
              <li><strong>"Vendeur" ou "Prestataire"</strong> : Tout utilisateur qui propose des produits à la vente ou des services</li>
              <li><strong>"Acheteur" ou "Client"</strong> : Tout utilisateur qui achète des produits ou sollicite des services sur la plateforme</li>
              <li><strong>"Annonce"</strong> : Offre de produit physique ou prestation de service publiée sur la plateforme</li>
              <li><strong>"Compte"</strong> : Le profil personnel de chaque utilisateur enregistré</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2><Shield size={24} /> 3. Création de Compte</h2>
            <p>Pour utiliser notre plateforme, vous devez :</p>
            <ul>
              <li>Être âgé d'au moins 18 ans ou avoir l'autorisation d'un représentant légal</li>
              <li>Fournir des informations véridiques et complètes lors de l'inscription</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>être responsable de toutes les activités effectuées sous votre compte</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2><ShoppingCart size={24} /> 4. Obligations des Vendeurs et Prestataires</h2>
            <p>Les vendeurs et prestataires de services s'engagent à :</p>
            <ul>
              <li>Proposer des produits et services conformes à la description fournie</li>
              <li>Respecter les prix affichés et les promotions convenues (ou fournir des devis clairs pour les services)</li>
              <li>Livrer les produits dans les délais convenus avec l'acheteur</li>
              <li>Maintenir un service client de qualité</li>
              <li>Ne pas proposer de produits illégaux ou prohibés au Bénin</li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>Pour les prestataires : détenir les qualifications et autorisations nécessaires à l'exercice de leur profession</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2><Users size={24} /> 5. Obligations des Acheteurs et Clients</h2>
            <p>Les acheteurs et clients s'engagent à :</p>
            <ul>
              <li>Vérifier la description des produits ou services avant tout achat ou engagement</li>
              <li>Effectuer le paiement conformément aux modalités choisies</li>
              <li>Communiquer des informations exactes (livraison, adresse d'intervention pour un service)</li>
              <li>Traiter les vendeurs avec respect et professionnalisme</li>
              <li>Signaler tout problème de manière constructive</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2><AlertCircle size={24} /> 6. Responsabilités</h2>
            <p>
              BoutiKonect.bj agit en tant qu'intermédiaire entre acheteurs et vendeurs. 
              Nous nous réservons le droit de :
            </p>
            <ul>
              <li>Suspendre ou supprimer un compte en cas de violation des conditions</li>
              <li>Retirer un produit qui ne respecte pas nos règles</li>
              <li>Blocuer une transaction suspecte</li>
              <li>Modifier les fonctionnalités du site sans préavis</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2><Shield size={24} /> 7. Propriété Intellectuelle</h2>
            <p>
              Tout le contenu présent sur BoutiKonect.bj (logos, textes, images, vidéos) 
              est protégé par les droits de propriété intellectuelle. Toute reproduction 
              ou utilisation non autorisée est interdite.
            </p>
          </section>

          <section className="terms-section">
            <h2><AlertCircle size={24} /> 8. Limitation de Responsabilité</h2>
            <p>
              BoutiKonect.bj s'efforce de fournir un service de mise en relation de qualité, mais nous ne pouvons 
              garantir l'exactitude complète des informations fournies par les vendeurs et prestataires. 
            </p>
            <p>
              <strong>Pour les services :</strong> BoutiKonect.bj agit uniquement comme un intermédiaire de mise en relation. 
              Nous ne sommes pas partie au contrat de prestation de service conclu entre le client et le prestataire, et nous 
              déclinons toute responsabilité quant à la qualité, la sécurité ou la licéité des services rendus, ni quant aux 
              éventuels dommages causés lors de la prestation.
            </p>
            <p>Les transactions se font aux risques des utilisateurs.</p>
          </section>

          <section className="terms-section">
            <h2><Scale size={24} /> 9. Droit Applicable</h2>
            <p>
              Les présentes conditions sont régies par le droit béninois. En cas de litige, 
              les tribunaux de Cotonou seront seuls compétents.
            </p>
          </section>

          <section className="terms-section">
            <h2><Users size={24} /> 10. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, veuillez nous contacter :
            </p>
            <ul className="contact-info">
              <li><strong>Email :</strong> BoutiKonectbj229@gmail.com</li>
              <li><strong>Téléphone :</strong> +229 01 40 57 13 73</li>
              <li><strong>Adresse :</strong> Lokossa, Cotonou, République du Bénin</li>
            </ul>
          </section>
        </div>

        <div className="terms-footer">
          <p>
            En utilisant BoutiKonect.bj, vous reconnaissez avoir lu et compris 
            ces Conditions d'Utilisation et acceptez d'y être lié.
          </p>
        </div>
      </div>
    </div>
  )
}
