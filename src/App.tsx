import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { AnimatedLogin } from './components/AnimatedLogin' // Import the new component
import { ChatLayout } from './components/ChatLayout'

type Theme = 'light' | 'dark'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [theme, setTheme] = useState<Theme>(localStorage.getItem('theme') as Theme || 'light')

  useEffect(() => {
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Use the new AnimatedLogin component
  if (!session) {
    return <AnimatedLogin />
  }

  return (
    <div className="container">
      <ChatLayout 
        key={session.user.id} 
        session={session} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
    </div>
  )
}

export default App