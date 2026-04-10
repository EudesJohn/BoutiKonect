import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronDown, Bot } from 'lucide-react';
import { findResponse, initialMessage, quickReplies } from './knowledgeBase';
import './HelpCenter.css';

// Helper to parse markdown-like text into React elements
const ResponseParser = ({ text, onLinkClick }) => {
  // Regex to find **bold**, *italic*, and [links](url)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

  return (
    <div className="message-content">
      {parts.map((part, index) => {
        // Bold: **text**
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        }
        // Italic: *text*
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.substring(1, part.length - 1)}</em>;
        }
        // Link: [text](url)
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          if (linkUrl.startsWith('/')) {
            return <Link key={index} to={linkUrl} className="chat-link" onClick={onLinkClick}>{linkText}</Link>;
          }
          return <a key={index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="chat-link">{linkText}</a>;
        }
        // Plain text or newlines
        return part.split('\n').map((line, i) => (
          <span key={`${index}-${i}`}>
            {line}
            {i < part.split('\n').length - 1 && <br />}
          </span>
        ));
      })}
    </div>
  );
};

export default function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = (e, quickReplyText = null) => {
    if (e) e.preventDefault();
    
    const userText = quickReplyText || inputValue.trim();
    if (!userText) return;
    
    setShowQuickReplies(false); // Hide quick replies on first interaction

    // Ajouter message utilisateur
    const newUserMsg = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simuler un délai de réflexion "intelligent"
    setTimeout(() => {
      const botResponseText = findResponse(userText);
      
      const newBotMsg = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false);

      // Play sound
      audioRef.current?.play().catch(err => console.log("Audio play failed:", err));
    }, 1000 + Math.random() * 500); // Délai aléatoire entre 1s et 1.5s
  };

  const toggleOpen = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
    if (!isOpen) setShowQuickReplies(true); // Show quick replies when chat is opened
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="help-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="bot-avatar-header">
                  <Bot size={20} />
                </div>
                <div>
                  <h3>Assistant Afritana</h3>
                  <span className="online-status">En ligne</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="close-chat-btn">
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender}`}>
                  {msg.sender === 'bot' && <div className="message-avatar"><Bot size={16} /></div>}
                  <div className="message-bubble">
                    {msg.sender === 'bot' 
                      ? <ResponseParser text={msg.text} onLinkClick={() => setIsOpen(false)} /> 
                      : <p>{msg.text}</p>
                    }
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {showQuickReplies && messages.length < 2 && (
                <div className="quick-replies">
                  {quickReplies.map(reply => (
                    <button key={reply.id} onClick={(e) => handleSend(e, reply.text)} className="quick-reply-btn">{reply.text}</button>
                  ))}
                </div>
              )}
              
              {isTyping && (
                <div className="message bot typing">
                  <div className="message-avatar"><Bot size={16} /></div>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Posez votre question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" disabled={!inputValue.trim()}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="help-floating-btn"
        drag
        dragMomentum={false}
        dragConstraints={{ left: -window.innerWidth + 60, right: 0, top: -window.innerHeight + 60, bottom: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        onClick={toggleOpen}
        title="Besoin d'aide ? Appui long pour déplacer"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && <span className="help-badge">1</span>}
      </motion.button>

      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto"></audio>
    </>
  );
}