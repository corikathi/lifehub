import { useEffect, useRef, useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'
import { forGrams, lookupBarcode, searchFood, type FoodHit, type NutriEntry } from '../lib/nutrition'

// Lebensmittel-Suche oben im Essen-Tab (wie Yazio): suchen, Barcode scannen oder eintippen.
// Eigene und zuletzt verwendete Lebensmittel stehen bereit. Pro Lebensmittel gibt es Einheiten
// wie Scheibe oder Portion, die sich mit Gramm-Angabe speichern lassen.
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type DetectorCtor = new (opts: { formats: string[] }) => Detector

interface Macros {
  kcal: string
  protein: string
  carbs: string
  fat: string
}

interface Unit {
  name: string
  grams: number
}

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
  const [recent, setRecent] = useKv<FoodHit[]>('recentFoods', [])
  const [unitsByFood, setUnitsByFood] = useKv<Record<string, Unit[]>>('foodUnits', {})
  const [goal, setGoal] = useKv<number>('kcalGoal', 2000)
  const [query, setQuery] = useState('')
  const [onlineHits, setOnlineHits] = useState<FoodHit[]>([])
  const [searched, setSearched] = useState(false)
  const [picked, setPicked] = useState<FoodHit | null>(null)
  const [unit, setUnit] = useState('g')
  const [amount, setAmount] = useState('100')
  const [newUnitName, setNewUnitName] = useState('')
  const [newUnitGrams, setNewUnitGrams] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [own, setOwn] = useState(EMPTY_OWN)
  const [macroOverride, setMacroOverride] = useState<Macros | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Macros>({ kcal: '', protein: '', carbs: '', fat: '' })
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasDetector = typeof window !== 'undefined' && !!(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector

  const q = query.trim().toLowerCase()
  const ownHits = q.length >= 2 ? myFoods.filter((f) => f.name.toLowerCase().includes(q)) : []
  const hits = [...ownHits, ...onlineHits]
  const units: Unit[] = picked ? (unitsByFood[picked.name] ?? []) : []

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
              if (hit) choose(hit)
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

  function choose(hit: FoodHit) {
    setPicked(hit)
    setUnit('g')
    setAmount('100')
    setNewUnitName('')
    setNewUnitGrams('')
    setMacroOverride(null)
  }

  async function lookupCode() {
    setError(null)
    setBusy(true)
    try {
      const hit = await lookupBarcode(code)
      if (hit) choose(hit)
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

  // Gramm aus Menge und Einheit berechnen
  const amountNumber = Number(amount.replace(',', '.')) || 0
  const unitInfo = units.find((u) => u.name === unit)
  const gramsNow = unit === 'g' ? amountNumber : amountNumber * (unitInfo?.grams ?? 0)
  const computedMacros = picked ? forGrams(picked, gramsNow) : { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const macrosNow = macroOverride
    ? { kcal: num(macroOverride.kcal), protein: num(macroOverride.protein), carbs: num(macroOverride.carbs), fat: num(macroOverride.fat) }
    : computedMacros

  async function add() {
    if (!picked || gramsNow <= 0) return
    const label = unit === 'g' ? picked.name : `${picked.name} (${amountNumber} ${unit})`
    const entry: NutriEntry = { id: `n-${Date.now()}`, name: label, grams: Math.round(gramsNow), ...macrosNow }
    await setLog({ ...log, [today]: [...entries, entry] })
    // Zuletzt verwendet merken, ohne Doppelungen
    const rest = recent.filter((r) => r.name !== picked.name)
    await setRecent([picked, ...rest].slice(0, 12))
    setPicked(null)
    setQuery('')
    setOnlineHits([])
    setSearched(false)
    setCode('')
  }

  async function addUnit() {
    if (!picked) return
    const grams = Number(newUnitGrams.replace(',', '.')) || 0
    const name = newUnitName.trim()
    if (!name || grams <= 0) return
    const list = [...units.filter((u) => u.name !== name), { name, grams }]
    await setUnitsByFood({ ...unitsByFood, [picked.name]: list })
    setUnit(name)
    setAmount('1')
    setNewUnitName('')
    setNewUnitGrams('')
  }

  function startEdit(en: NutriEntry) {
    setEditingId(en.id)
    setEditValues({ kcal: String(en.kcal), protein: String(en.protein), carbs: String(en.carbs), fat: String(en.fat) })
  }

  async function saveEdit() {
    if (!editingId) return
    const updated = entries.map((x) =>
      x.id === editingId ? { ...x, kcal: num(editValues.kcal), protein: num(editValues.protein), carbs: num(editValues.carbs), fat: num(editValues.fat) } : x,
    )
    await setLog({ ...log, [today]: updated })
    setEditingId(null)
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
    await setMyFoods([...myFoods.filter((f) => f.name !== name), food])
    setCreating(false)
    setOwn(EMPTY_OWN)
    choose(food)
  }

  // Auswahl ohne Suche: eigene und zuletzt verwendete Lebensmittel
  const showQuickList = query.trim().length < 2 && !picked
  const quickRecent = recent.filter((r) => !myFoods.some((m) => m.name === r.name))

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

        {showQuickList && myFoods.length > 0 && (
          <>
            <div className="section-title" style={{ margin: 0 }}>Meine Lebensmittel</div>
            <div className="stack" style={{ gap: 6 }}>
              {myFoods.map((h, i) => (
                <button key={`my-${h.name}-${i}`} type="button" className="recipe-row" onClick={() => choose(h)}>
                  <span className="grow">{h.name}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{h.kcal} kcal / 100 g</span>
                </button>
              ))}
            </div>
          </>
        )}

        {showQuickList && quickRecent.length > 0 && (
          <>
            <div className="section-title" style={{ margin: 0 }}>Zuletzt verwendet</div>
            <div className="stack" style={{ gap: 6 }}>
              {quickRecent.map((h, i) => (
                <button key={`rec-${h.name}-${i}`} type="button" className="recipe-row" onClick={() => choose(h)}>
                  <span className="grow">{h.name}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{h.kcal} kcal / 100 g</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!picked &&
          hits.map((h, i) => (
            <button key={`${h.name}-${i}`} type="button" className="btn" style={{ textAlign: 'left' }} onClick={() => choose(h)}>
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
            <div className="chips">
              <button type="button" className={`chip ${unit === 'g' ? 'active' : ''}`} onClick={() => { setUnit('g'); setAmount('100') }}>Gramm</button>
              {units.map((u) => (
                <button key={u.name} type="button" className={`chip ${unit === u.name ? 'active' : ''}`} onClick={() => { setUnit(u.name); setAmount('1') }}>
                  {u.name} ({u.grams} g)
                </button>
              ))}
            </div>
            <div className="row">
              <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Menge" />
              <span>{unit === 'g' ? 'g' : unit}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {gramsNow > 0 ? `${Math.round(gramsNow)} g · ${forGrams(picked, gramsNow).kcal} kcal` : 'Menge eingeben'}
            </p>
            <div className="manual-grid">
              {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
                <label key={k} className="muted" style={{ fontSize: 12 }}>
                  {k === 'kcal' ? 'kcal' : k === 'protein' ? 'Protein g' : k === 'carbs' ? 'Kohlenhydrate g' : 'Fett g'}
                  <input
                    className="input"
                    inputMode="decimal"
                    value={macroOverride ? macroOverride[k] : String(Math.round(computedMacros[k] * 10) / 10)}
                    onChange={(ev) => setMacroOverride({ ...(macroOverride ?? { kcal: String(computedMacros.kcal), protein: String(computedMacros.protein), carbs: String(computedMacros.carbs), fat: String(computedMacros.fat) }), [k]: ev.target.value })}
                  />
                </label>
              ))}
            </div>
            <button className="btn primary" type="submit" disabled={gramsNow <= 0}>Eintragen</button>

            <div className="section-title" style={{ margin: 0 }}>Neue Einheit, z. B. Scheibe oder Portion</div>
            <div className="ingredient-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
              <input className="input" placeholder="Name, z. B. Scheibe" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} aria-label="Einheitenname" />
              <input className="input" inputMode="decimal" placeholder="Gramm" value={newUnitGrams} onChange={(e) => setNewUnitGrams(e.target.value)} aria-label="Gramm pro Einheit" />
              <button type="button" className="btn small" onClick={addUnit} disabled={!newUnitName.trim() || !(Number(newUnitGrams.replace(',', '.')) > 0)}>Speichern</button>
            </div>
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
        {editingId && (
          <form className="form" style={{ marginTop: 8 }} onSubmit={(ev) => { ev.preventDefault(); void saveEdit() }}>
            <p style={{ fontWeight: 700, margin: 0 }}>Werte anpassen</p>
            <div className="manual-grid">
              {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
                <label key={k} className="muted" style={{ fontSize: 12 }}>
                  {k === 'kcal' ? 'kcal' : k === 'protein' ? 'Protein g' : k === 'carbs' ? 'Kohlenhydrate g' : 'Fett g'}
                  <input className="input" inputMode="decimal" value={editValues[k]} onChange={(ev) => setEditValues({ ...editValues, [k]: ev.target.value })} />
                </label>
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setEditingId(null)}>Abbrechen</button>
              <button type="submit" className="btn primary" style={{ flex: 1 }}>Speichern</button>
            </div>
          </form>
        )}
        {entries.length > 0 && (
          <div className="stack" style={{ gap: 6, marginTop: 10 }}>
            {entries.map((e) => (
              <div className="list-item" key={e.id}>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{e.name} · {e.grams} g</div>
                  <p className="muted">{e.kcal} kcal · P {e.protein} · KH {e.carbs} · F {e.fat}</p>
                </div>
                <button type="button" className="btn ghost small" aria-label={"Werte von " + e.name + " anpassen"} onClick={() => startEdit(e)}>✎</button>
                <button type="button" className="btn ghost small danger" aria-label={`${e.name} löschen`} onClick={() => remove(e.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
