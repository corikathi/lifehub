import { useEffect, useState } from 'react'
import { onSyncStatus, signOutAndClear, type SyncStatus } from '../lib/sync'
import { useKv, writeKv } from '../lib/store'

const STATUS_TEXT: Record<SyncStatus, string> = {
  idle: 'Bereit',
  syncing: 'Synchronisiert…',
  synced: 'Alles gesichert ✓',
  error: 'Keine Verbindung. Deine Daten bleiben lokal.',
}

// Erkennt, welche Datei hochgeladen wurde, und speichert sie an der richtigen Stelle.
async function importFile(file: File): Promise<string> {
  const data = JSON.parse(await file.text()) as Record<string, unknown>

  if (Array.isArray(data.rezepte) && data.basics_einkauf) {
    await writeKv('content.rezepte', data)
    return 'Rezepte'
  }
  if (data.einheiten && data.rad) {
    await writeKv('content.training', data)
    return 'Training'
  }

  // Persönliche Daten: jeder Eintrag wird unter seinem eigenen Schlüssel gespeichert
  const keys = Object.keys(data)
  if (keys.length === 0) throw new Error('Leere Datei')
  for (const key of keys) {
    await writeKv(key, data[key])
  }
  return `Persönliche Daten (${keys.length} Bereiche)`
}

export function More({ email }: { email?: string }) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [content] = useKv<unknown>('content.rezepte', null)
  const [training] = useKv<unknown>('content.training', null)

  useEffect(() => onSyncStatus(setStatus), [])

  async function logout() {
    if (!window.confirm('Abmelden? Lokale Daten auf diesem Gerät werden entfernt. Deine Daten bleiben in der Cloud.')) return
    setBusy(true)
    await signOutAndClear()
    setBusy(false)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setMessage(null)
    const done: string[] = []
    const failed: string[] = []
    for (const file of Array.from(files)) {
      try {
        done.push(await importFile(file))
      } catch {
        failed.push(file.name)
      }
    }
    setBusy(false)
    const parts: string[] = []
    if (done.length) parts.push(`Importiert: ${done.join(', ')}`)
    if (failed.length) parts.push(`Nicht lesbar: ${failed.join(', ')}`)
    setMessage(parts.join(' · '))
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
        <p className="section-title" style={{ margin: '0 0 6px' }}>Daten importieren</p>
        <p className="muted">
          Wähle `rezepte.json`, `training.json` und `meine-daten.json` aus. Die Dateien bleiben
          außerhalb des Repos und landen nur in deinem Konto.
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Rezepte: {content ? 'geladen ✓' : 'fehlt'} · Training: {training ? 'geladen ✓' : 'fehlt'}
        </p>
        <label className="btn primary file-btn" style={{ marginTop: 10 }}>
          Dateien auswählen
          <input
            type="file"
            accept="application/json,.json"
            multiple
            hidden
            disabled={busy}
            onChange={(e) => {
              void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
        {busy && <p className="muted" style={{ marginTop: 8 }}>Importiere…</p>}
        {message && <p className="info" style={{ marginTop: 8 }}>{message}</p>}
      </div>

      <div className="card">
        <p className="muted">Bald hier: Stimmung, Journal, Ziele und Wochenrückblick.</p>
      </div>

      <button type="button" className="btn danger" onClick={logout} disabled={busy}>
        Abmelden
      </button>

      <p className="muted" style={{ textAlign: 'center' }}>Version 0.2</p>
    </section>
  )
}
