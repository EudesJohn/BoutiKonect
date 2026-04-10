import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageCircle, X, Send, User, Bot, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { faqData } from './faqData';
import { AppContext } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import './VirtualAssistant.css';
import assistantAvatar from '../../assets/stickers/assistant_avatar.png';

const VirtualAssistant = () => {
  const { products, services } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Bonjour ! 👋 Bienvenue sur BoutiKonect.bj. Je suis votre assistant personnel. Comment puis-je vous aider à briller aujourd\'hui ? ✨',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const getAIResponse = async (query) => {
    try {
      // First, try local matching for basic intent (faster)
      const q = query.toLowerCase();
      
      // Local triggers for instant response (Greetings)
      const greetings = ['bonjour', 'salut', 'coucou', 'bonsoir', 'hello', 'hey', 'hi', 'allo'];
      if (greetings.some(g => q.includes(g))) {
        const hour = new Date().getHours();
        if (q.includes('bonsoir') || (hour >= 18 && q.includes('bonjour'))) {
          return "Bonsoir ! Comment puis-je vous aider sur BoutiKonect ce soir ?";
        }
        return "Bonjour ! Comment puis-je vous aider sur BoutiKonect aujourd'hui ?";
      }

      if (q.includes('merci')) return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.";

      // Call Gemini for complex queries
      const response = await aiService.generateResponse(query, { products, services });
      return response;
    } catch (error) {
      console.error("AI Assistant Error:", error);
      // Fallback logic
      return "Je suis désolé, je rencontre une petite difficulté. Essayez d'être plus spécifique ou consultez notre FAQ.";
    }
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
    const fetchResponse = async () => {
      try {
        const response = await getAIResponse(userMsg.text);
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);
      } catch (err) {
        console.error("Critical Assistant Error:", err);
        const errorMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Désolé, je rencontre une erreur de connexion. Veuillez réessayer plus tard.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    };

    fetchResponse();
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
              <div className="chat-header-info">
                <div className="header-avatar">
                  <img src={assistantAvatar} alt="AI" />
                </div>
                <div>
                  <h3>Assistant BoutiKonect</h3>
                  <span className="online-status">En ligne</span>
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
                    <div className="message-avatar bot-avatar">
                      <img src={assistantAvatar} alt="AI" className="assistant-sticker-avatar" />
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
