// src/components/ChatLayout.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { MessageView } from './MessageView'
import type { Session } from '@supabase/supabase-js'

interface Chat {
  id: string
  title: string
  created_at: string
}

export function ChatLayout({ session }: { session: Session }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  const fetchChats = async () => {
    const { data, error } = await supabase.from('chats').select('id, title, created_at').order('created_at', { ascending: false });
    if (error) console.error('Error fetching chats:', error)
    else if (data) setChats(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchChats()
  }, [])

  const handleCreateChat = async () => {
    const user_id = session.user.id
    const { data, error } = await supabase.from('chats').insert({ user_id }).select().single()

    if (error) {
      console.error('Error creating chat:', error)
    } else if (data) {
      setChats([data, ...chats]) // Add new chat to the top of the list
      setSelectedChatId(data.id)
      setIsSidebarOpen(false); // Close sidebar on mobile after creating a chat
    }
  }
  
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting a chat
  }

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="chat-layout-container">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        ☰
      </button>
      
      {/* Sidebar */}
      <div className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button onClick={handleCreateChat} style={{ width: '100%', marginBottom: '1rem' }}>
          + New Chat
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <p>Loading...</p> : chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`chat-list-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            >
              {chat.title}
            </div>
          ))}
        </div>
        <button onClick={handleSignOut} style={{ width: '100%', marginTop: '1rem' }}>
          Sign Out
        </button>
      </div>

      {/* Main Chat View */}
      <div className="chat-main-view">
        {selectedChatId && selectedChat ? (
            <MessageView key={selectedChatId} chatId={selectedChatId} chatTitle={selectedChat.title} onTitleGenerated={fetchChats} />
        ) : (
            <div className="chat-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                <h2 style={{marginTop: '20px'}}>Select a chat or create a new one.</h2>
            </div>
        )}
      </div>
    </div>
  )
}