import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageCircle, X, Send, User, Bot, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { faqData } from './faqData';
import { AppContext } from '../../context/AppContext';
import './VirtualAssistant.css';

const VirtualAssistant = () => {
  const { products, services } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Bonjour ! 👋 Bienvenue sur BoutiKonect.bj. Je suis votre IA assistante. Posez-moi vos questions ou demandez-moi de chercher des produits/services sur le site.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const generateAIResponse = (query) => {
    const q = query.toLowerCase();
    
    // Basic smart matching
    if (q.includes('bonjour') || q.includes('salut')) return "Bonjour ! Comment puis-je vous aider sur BoutiKonect aujourd'hui ?";
    if (q.includes('merci')) return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.";
    if (q.includes('combien de produit')) return `Nous avons actuellement ${products?.length || 0} produits merveilleux sur notre plateforme !`;
    if (q.includes('combien de service')) return `Il y a environ ${services?.length || 0} services professionnels proposés près de chez vous.`;
    
    // Search products or services
    if (q.includes('cherche') || q.includes('trouver') || q.includes('avez-vous') || q.includes('je veux')) {
      const term = q.replace(/(je |cherche |voudrais |trouver |avez-vous |des |un |une |le |la |les |de )/gi, '').trim();
      if (term.length > 2) {
        const foundProducts = products.filter(p => p.title.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term))).slice(0, 3);
        const foundServices = services.filter(s => s.title.toLowerCase().includes(term)).slice(0, 3);
        
        let response = `Voici ce que j'ai trouvé pour *"${term}"* sur le site :\n\n`;
        if (foundProducts.length > 0) {
          response += `📦 Produits :\n`;
          foundProducts.forEach(p => response += `- ${p.title} (${p.price} XOF)\n`);
        }
        if (foundServices.length > 0) {
          response += `\n💼 Services :\n`;
          foundServices.forEach(s => response += `- ${s.title} (${s.priceType === 'Devis' ? 'Sur Devis' : s.price + ' XOF'})\n`);
        }
        if (foundProducts.length === 0 && foundServices.length === 0) {
          response = `Désolé, je n'ai rien trouvé pour "${term}". Essayez d'autres mots-clés ou consultez directement nos catégories.`;
        } else {
          response += `\nUtilisez la barre de recherche au sommet de la page pour découvrir plus de résultats !`;
        }
        return response;
      }
    }

    // Answer matching FAQ (Enhanced with keyword scoring)
    const queryWords = q.split(/[\s,.'?]+/).filter(w => w.length > 3);
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of faqData) {
      const faqWords = (faq.question + " " + faq.id).toLowerCase().split(/[\s,.'?]+/).filter(w => w.length > 3);
      let score = 0;
      
      // Calculate match score
      queryWords.forEach(qw => {
        if (faqWords.some(fw => fw.includes(qw) || qw.includes(fw))) {
          score += 1;
        }
      });

      // Boost for direct title match
      if (q.includes(faq.question.toLowerCase())) score += 5;

      if (score > highestScore && score >= 1) {
        highestScore = score;
        bestMatch = faq.answer;
      }
    }

    if (bestMatch) return bestMatch;

    return "Je suis une IA intégrée à BoutiKonect.bj. Mon champ de recherche comprend tous les services, produits et FAQ de la plateforme. Soyez plus spécifique dans votre recherche ou vérifiez la FAQ !";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  const handleFAQClick = (faq) => {
    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: faq.question,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: faq.answer + "\n\nPuis-je vous aider pour autre chose ? Je suis là pour vous accompagner.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // AI generated dynamic response
    setTimeout(() => {
      const response = generateAIResponse(userMsg.text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  // Format time (HH:MM)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="virtual-assistant-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="va-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="va-header">
              <div className="va-header-info">
                <div className="va-avatar">
                  <Bot size={24} />
                  <span className="va-status-dot"></span>
                </div>
                <div>
                  <h3 className="va-title">Assistant BoutiKonect</h3>
                  <span className="va-status-text">En ligne</span>
                </div>
              </div>
              <button className="va-close-btn" onClick={toggleAssistant} aria-label="Fermer l'assistant">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="va-messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`va-message-row ${msg.sender}`}>
                  {msg.sender === 'bot' && (
                    <div className="va-msg-avatar bot">
                      <Bot size={16} />
                    </div>
                  )}
                  
                  <div className="va-message-content">
                    <div className={`va-bubble ${msg.sender}`} style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                    <span className="va-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="va-message-row bot">
                  <div className="va-msg-avatar bot">
                    <Bot size={16} />
                  </div>
                  <div className="va-bubble bot typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              {messages.length === 1 && !isTyping && (
                <div className="va-suggestions-wrapper">
                  <p className="va-suggestions-title">Questions fréquentes :</p>
                  <div className="va-suggestions">
                    {faqData.map((faq) => (
                      <button 
                        key={faq.id} 
                        className="va-suggestion-btn"
                        onClick={() => handleFAQClick(faq)}
                      >
                        <span>{faq.question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form className="va-input-area" onSubmit={handleSubmit}>
              <input 
                type="text" 
                className="va-input" 
                placeholder="Écrivez un message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button 
                type="submit" 
                className="va-send-btn" 
                disabled={!inputValue.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        className="va-toggle-btn"
        onClick={toggleAssistant}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};

export default VirtualAssistant;
