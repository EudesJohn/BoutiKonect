import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, Lock, Users, Database, Bell, Trash2 } from 'lucide-react'
import './Privacy.css'

export default function Privacy() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </Link>

        <h1 className="privacy-title">
          <Shield size={32} />
          Politique de Confidentialité
        </h1>
        <p className="privacy-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="privacy-content">
          <section className="privacy-section">
            <h2><Eye size={24} /> 1. Introduction</h2>
            <p>
              La présente Politique de Confidentialité décrit comment BoutiKonect.bj 
              collecte, utilise et protège vos données personnelles. Nous nous engageons 
              à protéger votre vie privée et vos données conformément à la loi N° 2017-20 
              portant Code du numérique en République du Bénin.
            </p>
            <p>
              En utilisant BoutiKonect.bj, vous acceptez les pratiques décrites dans cette politique.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Database size={24} /> 2. Données Collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul>
              <li><strong>Informations d'identification :</strong> Nom, prénom, adresse email, numéro de téléphone, et informations professionnelles pour les prestataires de services</li>
              <li><strong>Informations de localisation :</strong> Ville, quartier pour la livraison ou zone d'intervention pour un service</li>
              <li><strong>Informations de transaction :</strong> Historique d'achats, produits consultés, services sollicités</li>
              <li><strong>Données techniques :</strong> Adresse IP, type de navigateur, pages visitées</li>
              <li><strong>Communications :</strong> Messages échangés avec les vendeurs ou prestataires (devis, requêtes)</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2><Users size={24} /> 3. Utilisation des Données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul>
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Traiter vos commandes, paiements et demandes de devis</li>
              <li>Faciliter la mise en relation entre clients et prestataires de services</li>
              <li>Communiquer avec vous concernant vos transactions et sollicitations</li>
              <li>Améliorer nos services et votre expérience utilisateur</li>
              <li>Vous envoyer des notifications sur vos commandes</li>
              <li>Prévenir les fraudes et assurer la sécurité</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2><Lock size={24} /> 4. Protection des Données</h2>
            <p>Nous mettons en œuvre des mesures de sécurité robustes :</p>
            <ul>
              <li>Cryptage SSL/TLS pour toutes les transmissions de données</li>
              <li>Stockage sécurisé des mots de passe (hachage)</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Sauvegardes régulières des données</li>
              <li>Vérification d'identité pour les actions sensibles</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2><Users size={24} /> 5. Partage des Données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul>
              <li><strong>Les vendeurs et prestataires :</strong> Pour traiter vos commandes ou demandes de prestation (nom, adresse/localisation, téléphone)</li>
              <li><strong>Les transporteurs :</strong> Pour la livraison de vos commandes physiques</li>
              <li><strong>Les autorités :</strong> Sur demande légale ou pour prévenir la fraude</li>
              <li><strong>Nos prestataires :</strong> Pour les services techniques (hébergement, paiement)</li>
            </ul>
            <p className="privacy-note">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Eye size={24} /> 6. Cookies</h2>
            <p>
              BoutiKonect.bj utilise des cookies pour améliorer votre expérience. 
              Les cookies sont de petits fichiers stockés sur votre appareil.
            </p>
            <ul>
              <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site</li>
              <li><strong>Cookies analytiques :</strong> Pour analyser le trafic du site</li>
              <li><strong>Cookies de personnalisation :</strong> Pour mémoriser vos préférences</li>
            </ul>
            <p>
              Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, 
              mais cela peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Users size={24} /> 7. Vos Droits</h2>
            <p>Conformément à la réglementation béninoise, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
              <li><strong>Droit de retrait :</strong> Retirer votre consentement à tout moment</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2><Trash2 size={24} /> 8. Conservation des Données</h2>
            <p>
              Nous conservons vos données personnelles uniquement pendant la durée nécessaire 
              aux finalités pour lesquelles elles ont été collectées :
            </p>
            <ul>
              <li><strong>Compte utilisateur :</strong> Pendant toute la durée de votre compte actif</li>
              <li><strong>Données de transaction :</strong> 5 ans après la dernière transaction</li>
              <li><strong>Logs de connexion :</strong> 12 mois</li>
              <li><strong>Données marketing :</strong> Jusqu'au retrait de votre consentement</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2><Bell size={24} /> 9. Notifications et Communications</h2>
            <p>Vous pouvez choisir de recevoir ou non nos communications :</p>
            <ul>
              <li><strong>Emails transactionnels :</strong> Confirmations de commande, suivis de livraison (obligatoires)</li>
              <li><strong>Emails marketing :</strong> Promotions, nouvelles fonctionnalités (optionnels)</li>
              <li><strong>Notifications push :</strong> Alertes sur votre navigateur (optionnels)</li>
            </ul>
            <p>
              Vous pouvez modifier vos préférences à tout moment dans votre profil ou 
              vous désabonner via le lien dans nos emails.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Shield size={24} /> 10. Sécurité des Transactions</h2>
            <p>
              Pour les paiements en ligne, nous utilisons des passerelles de paiement sécurisées 
              conformes aux standards internationaux. Vos informations financières ne sont 
              jamais stockées sur nos serveurs.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Lock size={24} /> 11. Mineurs</h2>
            <p>
              BoutiKonect.bj n'autorise pas l'inscription aux personnes âgées de moins de 18 ans 
              sans l'autorisation d'un représentant légal. Si nous découvrons qu'un mineur 
              a fourni des données personnelles, nous supprimerons rapidement son compte.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Shield size={24} /> 12. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de temps à autre. En cas de modification 
              significative, nous vous en informerons par email ou via une notification sur le site. 
              Votre utilisation continue du site après ces modifications vaut acceptation.
            </p>
          </section>

          <section className="privacy-section">
            <h2><Users size={24} /> 13. Contact</h2>
            <p>
              Pour toute question concernant cette politique ou pour exercer vos droits, 
              veuillez nous contacter :
            </p>
            <ul className="contact-info">
              <li><strong>Email :</strong> BoutiKonectbj229@gmail.com</li>
              <li><strong>Téléphone :</strong> +229 01 40 57 13 73</li>
              <li><strong>Adresse :</strong> Lokossa, Cotonou, République du Bénin</li>
              <li><strong>Formulaire :</strong> Via la page Contact du site</li>
            </ul>
          </section>
        </div>

        <div className="privacy-footer">
          <p>
            Nous vous remercions de votre confiance. La protection de vos données est notre priorité.
          </p>
        </div>
      </div>
    </div>
  )
}
