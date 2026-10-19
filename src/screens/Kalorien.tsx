import { useEffect, useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'
import { forGrams, searchFood, type FoodHit, type NutriEntry } from '../lib/nutrition'

// Kalorien-Tracking mit Lebensmittel-Suche (Open Food Facts).
export function Kalorien() {
  const today = dateKey()
  const [log, setLog] = useKv<Record<string, NutriEntry[]>>('nutriLog', {})
  const [goal, setGoal] = useKv<number>('kcalGoal', 2000)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<FoodHit[]>([])
  const [picked, setPicked] = useState<FoodHit | null>(null)
  const [grams, setGrams] = useState('100')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Suche mit kurzer Pause, damit nicht bei jedem Buchstaben eine Anfrage läuft
  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([])
      return
    }
    const t = setTimeout(() => {
      setBusy(true)
      setError(null)
      searchFood(query)
        .then(setHits)
        .catch(() => setError('Die Suche ist gerade nicht erreichbar.'))
        .finally(() => setBusy(false))
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  const entries = log[today] ?? []
  const sum = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => entries.reduce((s, e) => s + e[k], 0)
  const kcalEaten = sum('kcal')
  const kcalLeft = goal - kcalEaten

  async function add() {
    if (!picked) return
    const g = Number(grams.replace(',', '.'))
    if (!g) return
    const values = forGrams(picked, g)
    const entry: NutriEntry = { id: `n-${Date.now()}`, name: picked.name, grams: g, ...values }
    await setLog({ ...log, [today]: [...entries, entry] })
    setPicked(null)
    setQuery('')
    setHits([])
  }

  async function remove(id: string) {
    await setLog({ ...log, [today]: entries.filter((e) => e.id !== id) })
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Noch übrig heute</p>
            <p className="big-number">{kcalLeft} <span style={{ fontSize: 18 }}>kcal</span></p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: '#6b5340' }}>
            <div><b>{kcalEaten}</b> gegessen</div>
            <div>
              Ziel{' '}
              <input
                className="input"
                style={{ maxWidth: 90, textAlign: 'right', display: 'inline-block' }}
                inputMode="numeric"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value) || 0)}
                aria-label="Kalorienziel"
              />
            </div>
          </div>
        </div>
        <div className="progress" style={{ marginTop: 10 }}>
          <span style={{ width: `${Math.min(100, goal ? (kcalEaten / goal) * 100 : 0)}%` }} />
        </div>
        <div className="row between" style={{ marginTop: 10, fontSize: 13 }}>
          <span>Protein {Math.round(sum('protein'))} g</span>
          <span>Kohlenhydrate {Math.round(sum('carbs'))} g</span>
          <span>Fett {Math.round(sum('fat'))} g</span>
        </div>
      </div>

      <div className="card form">
        <div className="section-title" style={{ margin: 0 }}>Lebensmittel suchen</div>
        <input
          className="input"
          placeholder="z. B. Haferflocken, Hähnchenbrust"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPicked(null)
          }}
        />
        {busy && <p className="muted">Suche…</p>}
        {error && <p className="error">{error}</p>}
        {!picked &&
          hits.map((h, i) => (
            <button key={`${h.name}-${i}`} type="button" className="btn" style={{ textAlign: 'left' }} onClick={() => setPicked(h)}>
              <span style={{ fontWeight: 700 }}>{h.name}</span>
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>{h.brand} · {h.kcal} kcal / 100 g</span>
            </button>
          ))}
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

      <div className="section-title">Heute gegessen</div>
      <div className="card">
        {entries.length === 0 && <p className="empty">Noch nichts eingetragen.</p>}
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
    </div>
  )
}
