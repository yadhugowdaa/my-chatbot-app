// src/components/MessageView.tsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  created_at: string
}

export function MessageView({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [botIsReplying, setBotIsReplying] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages]);

  // This effect runs when the component loads or the chat ID changes
  useEffect(() => {
    setMessages([])
    setLoading(true)
    setBotIsReplying(false)

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
      } else if (data) {
        setMessages(data)
      }
      setLoading(false)
    }

    fetchMessages()
  }, [chatId])

  // This effect implements the POLLING logic
  useEffect(() => {
    if (!botIsReplying) return; // Only run when the bot is supposed to be replying

    // Function to check for the bot's reply
    const pollForReply = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Polling error:', error);
        return; // Stop on error
      }

      // Check if the last message is from the bot and is new
      if (data && data.length > messages.length && data[data.length - 1].sender === 'bot') {
        setMessages(data); // Update the UI with the new message list
        setBotIsReplying(false); // Stop the "typing" indicator
      }
    };

    // Set up an interval to run the pollForReply function every 2 seconds
    const intervalId = setInterval(pollForReply, 2000);

    // Clean up the interval when the component unmounts or when the bot has replied
    return () => clearInterval(intervalId);

  }, [botIsReplying, chatId, messages.length]); // Re-run this effect if these values change

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newMessage.trim() || botIsReplying) return

    const userMessageContent = newMessage
    const currentMessages = messages;
    
    // Optimistically update the UI with the user's message
    const optimisticMessage: Message = {
        id: crypto.randomUUID(), // temporary ID
        content: userMessageContent,
        sender: 'user',
        created_at: new Date().toISOString()
    }
    setMessages([...currentMessages, optimisticMessage]);
    setNewMessage('')
    setBotIsReplying(true)

    try {
      const { error } = await supabase.functions.invoke('send-message', {
        body: {
          chat_id: chatId,
          message: userMessageContent,
        },
      })

      if (error) throw error
      // The polling `useEffect` will now take over to wait for the bot's reply.

    } catch (error) {
      console.error('Error sending message:', error)
      setBotIsReplying(false) // Stop indicator on error
      setMessages(currentMessages) // Revert optimistic update on error
      alert('Sorry, there was an error sending your message.')
    }
  }
  
  if (loading) {
    return <div style={{padding: '20px'}}>Loading messages...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              margin: '10px 0',
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                padding: '10px 15px',
                borderRadius: '20px',
                backgroundColor: msg.sender === 'user' ? '#007bff' : '#e9e9eb',
                color: msg.sender === 'user' ? 'white' : 'black',
                maxWidth: '70%',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {botIsReplying && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '10px 0' }}>
            <div style={{ padding: '10px 15px', borderRadius: '20px', backgroundColor: '#e9e9eb' }}>
              Bot is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ padding: '10px', borderTop: '1px solid #ccc', background: '#fff' }}>
        <div style={{display: 'flex', gap: '10px'}}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={botIsReplying}
          style={{flex: 1}}
        />
        <button type="submit" disabled={botIsReplying}>
          Send
        </button>
        </div>
      </form>
    </div>
  )
}