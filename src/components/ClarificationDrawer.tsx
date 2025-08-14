// src/components/ClarificationDrawer.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

interface ClarificationMessage {
  id: number;
  sender: 'user' | 'bot';
  content: string;
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextMessage: string;
}

export function ClarificationDrawer({ isOpen, onClose, contextMessage }: DrawerProps) {
  const [messages, setMessages] = useState<ClarificationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset messages when the drawer is opened
      setMessages([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input;
    setInput('');
    setIsLoading(true);

    // Add user message to state
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', content: userQuestion }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('clarify-message', {
        body: {
          context: contextMessage,
          question: userQuestion
        }
      });
      if (error) throw error;
      
      // Add bot reply to state
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: data.reply }]);
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: 'Sorry, I had trouble with that question.' }]);
    }
    setIsLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close-button" onClick={onClose}>×</button>
        <div className="drawer-header">
          <p>Clarification Thread</p>
          <div className="drawer-context">
            <strong>Original Message:</strong> "{contextMessage}"
          </div>
        </div>
        <div className="drawer-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message-bubble ${msg.sender === 'user' ? 'message-bubble-user' : 'message-bubble-bot'}`} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', margin: '5px 0' }}>
              {msg.content}
            </div>
          ))}
           {isLoading && <div className="message-bubble message-bubble-bot" style={{alignSelf: 'flex-start'}}>...</div>}
        </div>
        <form onSubmit={handleSubmit} className="chat-input-form" style={{background: 'var(--card-bg)'}}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question about the message..." disabled={isLoading} />
            <button type="submit" disabled={isLoading}>Ask</button>
          </div>
        </form>
      </div>
    </div>
  );
}