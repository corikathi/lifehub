import { useEffect, useState } from 'react'
import { onSyncStatus, signOutAndClear, type SyncStatus } from '../lib/sync'

const STATUS_TEXT: Record<SyncStatus, string> = {
  idle: 'Bereit',
  syncing: 'Synchronisiert…',
  synced: 'Alles gesichert ✓',
  error: 'Keine Verbindung. Deine Daten bleiben lokal.',
}

export function More({ email }: { email?: string }) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [busy, setBusy] = useState(false)

  useEffect(() => onSyncStatus(setStatus), [])

  async function logout() {
    if (!window.confirm('Abmelden? Lokale Daten auf diesem Gerät werden entfernt. Deine Daten bleiben in der Cloud.')) return
    setBusy(true)
    await signOutAndClear()
    setBusy(false)
  }

  return (
    <section className="stack">
      <header>
        <h1 className="title">Mehr</h1>
        <p className="subtitle">{email}</p>
      </header>

      <div className="card">
        <p className="muted">Sync</p>
        <p style={{ fontWeight: 600 }}>{STATUS_TEXT[status]}</p>
      </div>

      <div className="card">
        <p className="muted">Bald hier: Stimmung, Journal, Ziele und Wochenrückblick.</p>
      </div>

      <button type="button" className="btn danger" onClick={logout} disabled={busy}>
        Abmelden
      </button>

      <p className="muted" style={{ textAlign: 'center' }}>Version 0.1</p>
    </section>
  )
}
