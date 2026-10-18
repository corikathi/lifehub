import { useState } from 'react'
import { decryptBundle, storeBundle } from '../lib/bundle'

export function Unlock({ onSkip }: { onSkip: () => void }) {
  const [passphrase, setPassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function unlock() {
    setBusy(true)
    setError(null)
    try {
      const bundle = await decryptBundle(passphrase)
      await storeBundle(bundle)
    } catch {
      setError('Passwort falsch oder Datenbündel fehlt.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen login">
      <div className="login-card card">
        <div className="login-icon" aria-hidden="true">🔒</div>
        <h1 className="title">Deine Daten</h1>
        <p className="subtitle">Gib das Passwort einmal ein. Danach bleibt alles auf deinem Konto.</p>

        <form
          className="form"
          style={{ marginTop: 20 }}
          onSubmit={(e) => {
            e.preventDefault()
            void unlock()
          }}
        >
          <input
            className="input"
            type="password"
            autoComplete="off"
            placeholder="Passwort"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy || !passphrase}>
            {busy ? '…' : 'Entsperren'}
          </button>
        </form>

        <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={onSkip}>
          Später
        </button>
      </div>
    </main>
  )
}
