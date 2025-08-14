import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { MessageView } from './MessageView'
import type { Session } from '@supabase/supabase-js'

interface Chat {
  id: string
  title: string
  created_at: string
}

type Theme = 'light' | 'dark'

export function ChatLayout({ session, theme, toggleTheme }: { session: Session, theme: Theme, toggleTheme: () => void }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchChats = async () => { /* ... (This function remains the same) ... */
    setLoading(true);
    const { data, error } = await supabase.from('chats').select('id, title, created_at').order('created_at', { ascending: false });
    if (error) console.error('Error fetching chats:', error)
    else if (data) setChats(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchChats()
  }, [])
  
  const handleCreateChat = async () => { /* ... (This function remains the same) ... */
    const user_id = session.user.id
    const { data, error } = await supabase.from('chats').insert({ user_id }).select().single()
    if (error) console.error('Error creating chat:', error)
    else if (data) {
      setChats([data, ...chats])
      setSelectedChatId(data.id)
      setIsSidebarOpen(false);
    }
  }
  
  const handleDeleteChat = async (chatIdToDelete: string, event: React.MouseEvent) => { /* ... (This function remains the same) ... */
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        const { error } = await supabase.functions.invoke('delete-chat', { body: { chat_id: chatIdToDelete }, });
        if (error) throw error;
        setChats(chats.filter(chat => chat.id !== chatIdToDelete));
        if (selectedChatId === chatIdToDelete) setSelectedChatId(null);
      } catch (error) {
        console.error('Failed to delete chat:', error);
        alert('Could not delete chat.');
      }
    }
  };

  const handleSelectChat = (chatId: string) => { /* ... (This function remains the same) ... */
    setSelectedChatId(chatId);
    setIsSidebarOpen(false);
  }

  const handleSignOut = () => { /* ... (This function remains the same) ... */
    supabase.auth.signOut()
  }

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="chat-layout-container">
      <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? '✕' : '☰'}
      </button>
      
      <div className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button onClick={handleCreateChat} style={{ width: '100%', marginBottom: '1.5rem' }}>+ New Chat</button>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          {loading ? <p style={{textAlign: 'center'}}>...</p> : chats.map((chat) => (
            <div key={chat.id} onClick={() => handleSelectChat(chat.id)} className={`chat-list-item ${selectedChatId === chat.id ? 'selected' : ''}`}>
              <span style={{flex: 1, textOverflow: 'ellipsis', overflow: 'hidden'}}>{chat.title}</span>
              <button onClick={(e) => handleDeleteChat(chat.id, e)} className="delete-chat-button">×</button>
            </div>
          ))}
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem'}}>
           <button onClick={handleSignOut} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)'}}>Sign Out</button>
           <button onClick={toggleTheme} className="theme-toggle-button" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff'}}>
            {theme === 'light' ? '🌙' : '☀️'}
           </button>
        </div>
      </div>

      <div className="chat-main-view">
        {selectedChatId && selectedChat ? (
            <MessageView key={selectedChatId} chatId={selectedChatId} chatTitle={selectedChat.title} onTitleGenerated={fetchChats} />
        ) : (
            <div className="chat-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <h2 style={{marginTop: '20px'}}>Your AI Assistant</h2>
                <p style={{color: 'var(--text-secondary)'}}>Select a chat or create a new one to begin.</p>
            </div>
        )}
      </div>
    </div>
  )
}