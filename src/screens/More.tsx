import { useEffect, useState } from 'react'
import { onSyncStatus, signOutAndClear, type SyncStatus } from '../lib/sync'
import { readKv, useKv, writeKv } from '../lib/store'
import type { Rezept } from '../lib/content'

const STATUS_TEXT: Record<SyncStatus, string> = {
  idle: 'Bereit',
  syncing: 'Synchronisiert…',
  synced: 'Alles gesichert ✓',
  error: 'Keine Verbindung. Deine Daten bleiben lokal.',
}

// Erkennt, welche Datei hochgeladen wurde, und speichert sie an der richtigen Stelle.
// Holt den JSON-Teil aus dem eingefügten Text, auch wenn Code-Markierungen oder Zusatztext dabei sind
function cleanPaste(text: string): string {
  const s = text.trim()
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  return a >= 0 && b > a ? s.slice(a, b + 1) : s
}

async function importData(data: Record<string, unknown>): Promise<string> {

  if (Array.isArray(data.rezepte) && data.basics_einkauf) {
    await writeKv('content.rezepte', data)
    return 'Rezepte'
  }
  // Eigene Rezepte als Datei: { "eigeneRezepte": [ { titel, portionen, zutaten: [{name, menge, einheit, kategorie}], schritte, kcal, protein, carbs, fat } ] }
  if (Array.isArray(data.eigeneRezepte)) {
    type Eingang = {
      titel: string
      portionen?: number
      zutaten: { name: string; menge: number; einheit?: string; kategorie?: string }[]
      schritte?: string[]
      kcal?: number
      protein?: number
      carbs?: number
      fat?: number
    }
    const eingang = data.eigeneRezepte as Eingang[]
    const current = await readKv<Rezept[]>('myRecipes', [])
    const stamp = Date.now()
    const neu: Rezept[] = eingang.map((r, i) => {
      const base = r.portionen && r.portionen > 0 ? r.portionen : 3
      return {
        id: 'import-' + stamp + '-' + i,
        titel: r.titel,
        hinweis: 'Eigenes Rezept',
        zutaten_fuer_3: r.zutaten.map((z) => ({
          name: z.name,
          menge: Math.round(((z.menge * 3) / base) * 10) / 10,
          einheit: z.einheit ?? 'g',
          kategorie: z.kategorie ?? 'Sonstiges',
        })),
        schritte: r.schritte ?? [],
      }
    })
    await writeKv('myRecipes', [...current, ...neu])
    const nutri = await readKv<Record<string, { kcal: number; protein: number; carbs: number; fat: number }>>('recipeNutrition', {})
    eingang.forEach((r, i) => {
      if (r.kcal && r.kcal > 0) nutri[neu[i].id] = { kcal: r.kcal, protein: r.protein ?? 0, carbs: r.carbs ?? 0, fat: r.fat ?? 0 }
    })
    await writeKv('recipeNutrition', nutri)
    return 'Eigene Rezepte (' + neu.length + ')'
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

async function importFile(file: File): Promise<string> {
  return importData(JSON.parse(await file.text()) as Record<string, unknown>)
}

export function More({ email }: { email?: string }) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState('')

  async function importPasted() {
    setBusy(true)
    setMessage(null)
    try {
      const result = await importData(JSON.parse(cleanPaste(pasteText)) as Record<string, unknown>)
      setMessage('Importiert: ' + result)
      setPasteText('')
    } catch {
      setMessage('Der Text ist kein gültiges Rezept-Format.')
    } finally {
      setBusy(false)
    }
  }
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
        <div className="section-title" style={{ margin: '12px 0 6px' }}>Oder Text einfügen</div>
        <textarea className="textarea" style={{ minHeight: 120 }} placeholder="Rezepte im Textformat hier einfügen" value={pasteText} onChange={(e) => setPasteText(e.target.value)} aria-label="Rezepte einfügen" />
        <button type="button" className="btn primary" style={{ marginTop: 6 }} disabled={busy || !pasteText.trim()} onClick={importPasted}>
          Einfügen und speichern
        </button>

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
