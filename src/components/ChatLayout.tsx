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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchChats = async () => {
    setLoading(true);
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
      setChats([data, ...chats])
      setSelectedChatId(data.id)
      setIsSidebarOpen(false);
    }
  }

  const handleDeleteChat = async (chatIdToDelete: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        const { error } = await supabase.functions.invoke('delete-chat', {
          body: { chat_id: chatIdToDelete },
        });
        if (error) throw error;
        setChats(chats.filter(chat => chat.id !== chatIdToDelete));
        if (selectedChatId === chatIdToDelete) {
          setSelectedChatId(null);
        }
      } catch (error) {
        console.error('Failed to delete chat:', error);
        alert('Could not delete chat.');
      }
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsSidebarOpen(false);
  }

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  return (
    <div className="chat-layout-container">
      <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
      <div className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button onClick={handleCreateChat} style={{ width: '100%', marginBottom: '1rem' }}>+ New Chat</button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <p>Loading...</p> : chats.map((chat) => (
            <div key={chat.id} onClick={() => handleSelectChat(chat.id)} className={`chat-list-item ${selectedChatId === chat.id ? 'selected' : ''}`}>
              <span style={{flex: 1, textOverflow: 'ellipsis', overflow: 'hidden'}}>{chat.title}</span>
              <button onClick={(e) => handleDeleteChat(chat.id, e)} className="delete-chat-button">×</button>
            </div>
          ))}
        </div>
        <button onClick={handleSignOut} style={{ width: '100%', marginTop: '1rem' }}>Sign Out</button>
      </div>
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