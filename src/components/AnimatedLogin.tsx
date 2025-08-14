import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

const codeSnippets = [
  "await chatbot.getResponse()",
  "Initializing AI Assistant...",
  "Compiling neural network...",
  "supabase.auth.signIn()",
  "n8n.workflow.trigger()",
  "SELECT * FROM conversations;"
];

export function AnimatedLogin() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [subtitle, setSubtitle] = useState(codeSnippets[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitle(prev => {
        const currentIndex = codeSnippets.indexOf(prev);
        const nextIndex = (currentIndex + 1) % codeSnippets.length;
        return codeSnippets[nextIndex];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Signup successful! Please check your email to verify.')
    setLoading(false)
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-graphic-side">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#020617" } },
            fpsLimit: 60,
            interactivity: {
              events: { onHover: { enable: true, mode: "repulse" }, resize: true },
              modes: { repulse: { distance: 150, duration: 0.4 } }
            },
            particles: {
              color: { value: "#ffffff" },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.4, // Increased link visibility
                width: 1
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false
              },
              number: {
                density: { enable: true, area: 800 },
                value: 200 // More particles
              },
              opacity: {
                value: 0.6 // Increased particle visibility
              },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />
      </div>
      <div className="login-form-side">
        <div className="login-form-card">
          <h1>Chatbot</h1>
          <p className="subtitle">{subtitle}</p>
          <form>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@example.com" value={email} required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="••••••••" value={password} required onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleLogin} disabled={loading} style={{ flex: 1 }}>Sign In</button>
              <button onClick={handleSignup} disabled={loading} style={{ flex: 1, background: 'none', border: '1px solid var(--border-color)' }}>Sign Up</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}