import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    setInfo(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError('E-Mail oder Passwort stimmt nicht.')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
      })
      if (error) {
        setError(error.message)
      } else if (!data.session) {
        setInfo('Fast geschafft: Bestätige deine E-Mail-Adresse über den Link in der Mail.')
      }
    }
    setBusy(false)
  }

  return (
    <main className="screen login">
      <div className="login-card card">
        <div className="login-icon" aria-hidden="true">🌿</div>
        <h1 className="title">Lifehub</h1>
        <p className="subtitle">Dein gemütliches Zuhause</p>

        <form
          className="form"
          style={{ marginTop: 20 }}
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="error">{error}</p>}
          {info && <p className="info">{info}</p>}
          <button className="btn primary" type="submit" disabled={busy || !email || !password}>
            {busy ? '…' : mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: 12 }}
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'signin' ? 'Noch kein Konto? Jetzt anlegen' : 'Schon ein Konto? Anmelden'}
        </button>
      </div>
    </main>
  )
}
