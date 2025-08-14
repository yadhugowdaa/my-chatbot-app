import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { ClarificationDrawer } from './ClarificationDrawer' // Import the new component

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export function MessageView({ chatId, chatTitle, onTitleGenerated }: { chatId: string; chatTitle: string; onTitleGenerated: () => void; }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [botIsReplying, setBotIsReplying] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  // New state for the clarification drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clarificationContext, setClarificationContext] = useState('');

  const handleOpenDrawer = (messageContent: string) => {
    setClarificationContext(messageContent);
    setIsDrawerOpen(true);
  }

  // ... (All other functions and hooks remain the same)
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  useEffect(scrollToBottom, [messages]);
  useEffect(() => {
    setMessages([])
    setLoading(true)
    setBotIsReplying(false)
    const fetchMessages = async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
      if (error) console.error('Error fetching messages:', error)
      else if (data) setMessages(data)
      setLoading(false)
    }
    fetchMessages()
  }, [chatId])
  useEffect(() => {
    if (!botIsReplying) return;
    const pollForReply = async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
      if (error) { console.error('Polling error:', error); return; }
      if (data && data.length > messages.length && data[data.length - 1].sender === 'bot') {
        setMessages(data);
        setBotIsReplying(false);
      }
    };
    const intervalId = setInterval(pollForReply, 2000);
    return () => clearInterval(intervalId);
  }, [botIsReplying, chatId, messages.length]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newMessage.trim() || botIsReplying) return
    const wasNewChat = chatTitle === 'New Chat';
    const userMessageContent = newMessage
    const currentMessages = messages;
    const optimisticMessage: Message = { id: crypto.randomUUID(), content: userMessageContent, sender: 'user', created_at: new Date().toISOString() }
    setMessages([...currentMessages, optimisticMessage]);
    setNewMessage('')
    setBotIsReplying(true)
    try {
      const { error } = await supabase.functions.invoke('send-message', { body: { chat_id: chatId, message: userMessageContent, chat_title: chatTitle }, })
      if (error) throw error
      if (wasNewChat) {
        setTimeout(() => {
          onTitleGenerated();
        }, 4000);
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setBotIsReplying(false)
      setMessages(currentMessages)
      alert('Sorry, there was an error sending your message.')
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading messages...</div>
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
          <h3 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chatTitle}</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={msg.sender === 'user' ? 'message-bubble-user' : 'message-bubble-bot'} style={{ padding: '10px 15px', borderRadius: '20px', maxWidth: '80%', lineHeight: '1.5' }}>
                {msg.content}
                {/* Add clarification icon ONLY for bot messages */}
                {msg.sender === 'bot' && (
                  <button className="clarification-icon" onClick={() => handleOpenDrawer(msg.content)}>
                    ?
                  </button>
                )}
              </div>
            </div>
          ))}
          {botIsReplying && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '0.5rem 0' }}>
              <div className="message-bubble-bot" style={{ padding: '10px 15px', borderRadius: '20px' }}>
                ...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={botIsReplying} style={{ flex: 1 }} />
            <button type="submit" disabled={botIsReplying}>Send</button>
          </div>
        </form>
      </div>
      
      {/* Render the Drawer component */}
      <ClarificationDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contextMessage={clarificationContext}
      />
    </>
  )
}