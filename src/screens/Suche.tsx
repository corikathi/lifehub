import { useEffect, useRef, useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'
import { forGrams, lookupBarcode, searchFood, type FoodHit, type NutriEntry } from '../lib/nutrition'

// Lebensmittel-Suche oben im Essen-Tab (wie Yazio): suchen, Barcode scannen oder eintippen.
// Eigene Lebensmittel werden zuerst gezeigt und lassen sich anlegen, wenn die Datenbank nichts findet.
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type DetectorCtor = new (opts: { formats: string[] }) => Detector

function getDetector(): Detector | null {
  const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
  if (!Ctor) return null
  return new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
}

const EMPTY_OWN = { name: '', kcal: '', protein: '', carbs: '', fat: '' }

export function Suche() {
  const today = dateKey()
  const [log, setLog] = useKv<Record<string, NutriEntry[]>>('nutriLog', {})
  const [myFoods, setMyFoods] = useKv<FoodHit[]>('myFoods', [])
  const [goal, setGoal] = useKv<number>('kcalGoal', 2000)
  const [query, setQuery] = useState('')
  const [onlineHits, setOnlineHits] = useState<FoodHit[]>([])
  const [searched, setSearched] = useState(false)
  const [picked, setPicked] = useState<FoodHit | null>(null)
  const [grams, setGrams] = useState('100')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [own, setOwn] = useState(EMPTY_OWN)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasDetector = typeof window !== 'undefined' && !!(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector

  // Eigene Lebensmittel zuerst, dann die Online-Treffer
  const q = query.trim().toLowerCase()
  const ownHits = q.length >= 2 ? myFoods.filter((f) => f.name.toLowerCase().includes(q)) : []
  const hits = [...ownHits, ...onlineHits]

  // Suche mit kurzer Pause
  useEffect(() => {
    if (query.trim().length < 2) {
      setOnlineHits([])
      setSearched(false)
      return
    }
    const t = setTimeout(() => {
      setBusy(true)
      setError(null)
      searchFood(query)
        .then(setOnlineHits)
        .catch(() => setError('Die Online-Suche ist gerade nicht erreichbar. Eigene Lebensmittel funktionieren trotzdem.'))
        .finally(() => {
          setBusy(false)
          setSearched(true)
        })
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  // Kamera für den Barcode-Scan
  useEffect(() => {
    if (!scanning) return
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setInterval> | undefined
    let stopped = false
    const detector = getDetector()

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!videoRef.current || stopped) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        timer = setInterval(async () => {
          if (!videoRef.current || !detector) return
          try {
            const found = await detector.detect(videoRef.current)
            if (found[0]?.rawValue) {
              stopped = true
              setScanning(false)
              setBusy(true)
              const hit = await lookupBarcode(found[0].rawValue)
              setBusy(false)
              if (hit) setPicked(hit)
              else setError('Produkt nicht gefunden. Du kannst den Namen suchen.')
            }
          } catch {
            // Kurzer Aussetzer beim Erkennen, einfach weiter versuchen
          }
        }, 500)
      } catch {
        setError('Die Kamera ist nicht verfügbar. Gib die Barcode-Nummer ein.')
        setScanning(false)
      }
    }
    void start()
    return () => {
      stopped = true
      if (timer) clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [scanning])

  async function lookupCode() {
    setError(null)
    setBusy(true)
    try {
      const hit = await lookupBarcode(code)
      if (hit) setPicked(hit)
      else setError('Produkt nicht gefunden.')
    } catch {
      setError('Die Produktsuche ist gerade nicht erreichbar.')
    } finally {
      setBusy(false)
    }
  }

  const entries = log[today] ?? []
  const kcalEaten = entries.reduce((s, e) => s + e.kcal, 0)
  const kcalLeft = goal - kcalEaten

  async function add() {
    if (!picked) return
    const g = Number(grams.replace(',', '.'))
    if (!g) return
    const entry: NutriEntry = { id: `n-${Date.now()}`, name: picked.name, grams: g, ...forGrams(picked, g) }
    await setLog({ ...log, [today]: [...entries, entry] })
    setPicked(null)
    setQuery('')
    setOnlineHits([])
    setSearched(false)
    setCode('')
  }

  async function remove(id: string) {
    await setLog({ ...log, [today]: entries.filter((e) => e.id !== id) })
  }

  async function saveOwn() {
    const name = (own.name || query).trim()
    const kcal = Number(own.kcal.replace(',', '.'))
    if (!name || !kcal) return
    const food: FoodHit = {
      name,
      brand: 'Eigenes Lebensmittel',
      kcal,
      protein: Number(own.protein.replace(',', '.')) || 0,
      carbs: Number(own.carbs.replace(',', '.')) || 0,
      fat: Number(own.fat.replace(',', '.')) || 0,
    }
    await setMyFoods([...myFoods, food])
    setPicked(food)
    setCreating(false)
    setOwn(EMPTY_OWN)
  }

  return (
    <div className="stack">
      <div className="card form">
        <div className="row">
          <input
            className="input"
            placeholder="Lebensmittel suchen…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPicked(null)
            }}
            aria-label="Lebensmittel suchen"
          />
          <button type="button" className="btn" onClick={() => setScanning(true)} aria-label="Barcode scannen" disabled={!hasDetector}>
            ▦ Scannen
          </button>
        </div>
        {!hasDetector && (
          <div className="row">
            <input className="input" inputMode="numeric" placeholder="Barcode-Nummer" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Barcode-Nummer" />
            <button type="button" className="btn" onClick={lookupCode} disabled={code.replace(/\D/g, '').length < 8}>Suchen</button>
          </div>
        )}
        {busy && <p className="muted">Suche…</p>}
        {error && <p className="error">{error}</p>}

        {scanning && (
          <div className="scan-box">
            <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 16 }} />
            <button type="button" className="btn ghost" onClick={() => setScanning(false)}>Abbrechen</button>
          </div>
        )}

        {!picked &&
          hits.map((h, i) => (
            <button key={`${h.name}-${i}`} type="button" className="btn" style={{ textAlign: 'left' }} onClick={() => setPicked(h)}>
              <span style={{ fontWeight: 700 }}>{h.name}</span>
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>{h.brand} · {h.kcal} kcal / 100 g</span>
            </button>
          ))}

        {!picked && query.trim().length >= 2 && searched && !busy && hits.length === 0 && !creating && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="muted" style={{ margin: 0 }}>Nichts gefunden.</p>
            <button type="button" className="btn primary" onClick={() => { setCreating(true); setOwn({ ...EMPTY_OWN, name: query.trim() }) }}>
              „{query.trim()}“ als eigenes Lebensmittel anlegen
            </button>
          </div>
        )}

        {creating && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              void saveOwn()
            }}
          >
            <p style={{ fontWeight: 700, margin: 0 }}>Eigenes Lebensmittel (Werte pro 100 g)</p>
            <input className="input" placeholder="Name" value={own.name} onChange={(e) => setOwn({ ...own, name: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="kcal" value={own.kcal} onChange={(e) => setOwn({ ...own, kcal: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Protein (g)" value={own.protein} onChange={(e) => setOwn({ ...own, protein: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Kohlenhydrate (g)" value={own.carbs} onChange={(e) => setOwn({ ...own, carbs: e.target.value })} />
            <input className="input" inputMode="decimal" placeholder="Fett (g)" value={own.fat} onChange={(e) => setOwn({ ...own, fat: e.target.value })} />
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setCreating(false)}>Abbrechen</button>
              <button type="submit" className="btn primary" style={{ flex: 1 }} disabled={!own.kcal.trim()}>Speichern</button>
            </div>
          </form>
        )}

        {picked && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              void add()
            }}
          >
            <p style={{ fontWeight: 700, margin: 0 }}>{picked.name}</p>
            <div className="row">
              <input className="input" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} aria-label="Menge in Gramm" />
              <span>g</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>{forGrams(picked, Number(grams.replace(',', '.')) || 0).kcal} kcal</p>
            <button className="btn primary" type="submit">Eintragen</button>
          </form>
        )}
        <p className="muted" style={{ fontSize: 11, margin: 0 }}>Daten: Open Food Facts (ODbL). Werte können abweichen.</p>
      </div>

      <div className="card">
        <div className="row between">
          <p className="section-heading" style={{ fontSize: 18, margin: 0 }}>Heute gegessen</p>
          <div style={{ textAlign: 'right', fontSize: 13, color: '#6b5340' }}>
            <div>Ziel{' '}
              <input className="input" style={{ maxWidth: 90, textAlign: 'right', display: 'inline-block' }} inputMode="numeric" value={goal} onChange={(e) => setGoal(Number(e.target.value) || 0)} aria-label="Kalorienziel" />
            </div>
            <div><b>{kcalLeft}</b> kcal übrig</div>
          </div>
        </div>
        {entries.length === 0 && <p className="empty">Noch nichts eingetragen.</p>}
        {entries.length > 0 && (
          <div className="stack" style={{ gap: 6, marginTop: 10 }}>
            {entries.map((e) => (
              <div className="list-item" key={e.id}>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{e.name} · {e.grams} g</div>
                  <p className="muted">{e.kcal} kcal · P {e.protein} · KH {e.carbs} · F {e.fat}</p>
                </div>
                <button type="button" className="btn ghost small danger" aria-label={`${e.name} löschen`} onClick={() => remove(e.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
