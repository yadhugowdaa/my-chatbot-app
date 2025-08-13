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

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    const { data, error } = await supabase.from('chats').select('id, title, created_at')
    if (error) {
      console.error('Error fetching chats:', error)
    } else if (data) {
      setChats(data)
    }
    setLoading(false)
  }

  const handleCreateChat = async () => {
    // We need the user_id to create a chat.
    const user_id = session.user.id
    const { data, error } = await supabase.from('chats').insert({ user_id }).select().single()

    if (error) {
      console.error('Error creating chat:', error)
    } else if (data) {
      // Add the new chat to our list and select it
      setChats([...chats, data])
      setSelectedChatId(data.id)
    }
  }

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  if (loading) {
    return <div>Loading chats...</div>
  }

  return (
    <div style={{ display: 'flex', height: '90vh', border: '1px solid #ccc', borderRadius: '8px' }}>
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '10px', display: 'flex', flexDirection: 'column' }}>
        <button onClick={handleCreateChat} style={{ padding: '10px', marginBottom: '10px' }}>
          + New Chat
        </button>
        <h3 style={{ marginTop: 0 }}>Your Chats</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', flex: 1 }}>
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              style={{
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: selectedChatId === chat.id ? '#e0e0e0' : 'transparent',
              }}
            >
              {chat.title}
            </li>
          ))}
        </ul>
        <button onClick={handleSignOut} style={{ padding: '10px', marginTop: 'auto' }}>
          Sign Out
        </button>
      </div>
      <div style={{ flex: 1 }}>
        {selectedChatId ? (
          <MessageView chatId={selectedChatId} />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <h2>Select a chat or create a new one to start messaging.</h2>
          </div>
        )}
      </div>
    </div>
  )
}