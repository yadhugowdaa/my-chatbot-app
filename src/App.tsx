import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { Auth } from './components/Auth'
import { ChatLayout } from './components/ChatLayout'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Check for an existing session when the app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for changes in authentication state (sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Cleanup the listener when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  // If there is no session, show the Auth component
  // Otherwise, show the main ChatLayout
  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {!session ? <Auth /> : <ChatLayout key={session.user.id} session={session} />}
    </div>
  )
}

export default App