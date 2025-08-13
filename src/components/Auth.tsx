// src/components/Auth.tsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'

export function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Corrected line below
      alert(error.message)
    }
    setLoading(false)
  }

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      // Corrected line below
      alert(error.message)
    } else {
      alert('Signup successful! Please check your email to verify.')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '300px' }}>
        <h1 style={{ textAlign: 'center' }}>Chatbot Login</h1>
        <p style={{ textAlign: 'center' }}>Sign in or create an account</p>
        <form>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Your email"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleLogin} disabled={loading} style={{ flex: 1, padding: '10px' }}>
              {loading ? <span>Loading...</span> : <span>Sign In</span>}
            </button>
            <button onClick={handleSignup} disabled={loading} style={{ flex: 1, padding: '10px' }}>
              {loading ? <span>Loading...</span> : <span>Sign Up</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}