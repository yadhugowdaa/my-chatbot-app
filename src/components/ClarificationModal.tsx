// src/components/ClarificationModal.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Draggable from 'react-draggable';

interface ClarificationMessage {
  id: number;
  sender: 'user' | 'bot';
  content: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextMessage: string;
}

export function ClarificationModal({ isOpen, onClose, contextMessage }: ModalProps) {
  const [messages, setMessages] = useState<ClarificationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const nodeRef = useRef(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input;
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', content: userQuestion }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('clarify-message', {
        body: { context: contextMessage, question: userQuestion }
      });

      // --- THIS IS THE IMPORTANT DEBUGGING LINE ---
      console.log("DATA RECEIVED FROM FUNCTION:", data);

      if (error) throw error;
      
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: data.reply }]);
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: 'Sorry, I had trouble with that question.' }]);
    }
    setIsLoading(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <Draggable nodeRef={nodeRef} handle=".modal-header" bounds="parent">
        <div ref={nodeRef} className="modal-content">
          <button className="modal-close-button" onClick={onClose}>×</button>
          <div className="modal-header">
            <p>Clarification Thread</p>
            <div className="modal-context">
              <strong>Original Message:</strong> "{contextMessage}"
            </div>
          </div>
          <div className="modal-messages">
            {messages.map(msg => (
              <div key={msg.id} style={{ margin: '0.5rem 0', display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
               <div className={`message-bubble ${msg.sender === 'user' ? 'message-bubble-user' : 'message-bubble-bot'}`}>
                 {msg.content}
               </div>
              </div>
            ))}
           {isLoading && 
             <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '0.5rem 0' }}>
               <div className="message-bubble-bot">...</div>
             </div>
           }
           <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="chat-input-form">
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." disabled={isLoading} autoFocus />
              <button type="submit" disabled={isLoading}>Ask</button>
            </div>
          </form>
        </div>
      </Draggable>
    </div>
  );
}