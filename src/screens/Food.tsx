import { useMemo, useState } from 'react'
import { useKv } from '../lib/store'
import { addDays, dateKey, formatDay, weekDays } from '../lib/dates'
import {
  DAYS,
  defaultSlot,
  findRecipe,
  rotationWeek,
  scaleAmount,
  type RezepteFile,
  type Zutat,
} from '../lib/content'

interface MealsState {
  persons: number
  skip: Record<string, number[]> // Tage ohne Kochen, z. B. auswärts
  weeks: Record<string, string[]> // Montag -> 7 Einträge (Rezept-ID oder eigener Text)
}

interface ShopItem {
  name: string
  einheit: string
  menge: number
  kategorie: string
}

// Eigene Gerichte werden als "custom:Text" gespeichert
function titleOf(slot: string, recipeTitle?: string): string {
  if (recipeTitle) return recipeTitle
  return slot.startsWith("custom:") ? slot.slice(7) : slot
}

interface DrinkEntry {
  ml: number
  t: string
  ts: number
}

const EMPTY_MEALS: MealsState = { persons: 2, skip: {}, weeks: {} }
const WATER_GOAL = 2000
const WATER_STEPS = [250, 500]

function mondayOf(key: string): string {
  const d = new Date(`${key}T12:00:00`)
  return addDays(key, -((d.getDay() + 6) % 7))
}

export function Food() {
  const today = dateKey()
  const [content] = useKv<RezepteFile | null>('content.rezepte', null)
  const [meals, setMeals] = useKv<MealsState>('meals', EMPTY_MEALS)
  const [drinks, setDrinks] = useKv<Record<string, DrinkEntry[]>>('drinks', {})
  const [checked, setChecked] = useKv<Record<string, boolean>>('shoppingChecked', {})
  const [weekStart, setWeekStart] = useState(() => mondayOf(today))
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [view, setView] = useState<'plan' | 'shopping'>('plan')

  const days = weekDays(weekStart)
  const skipped = meals.skip[weekStart] ?? []

  if (!content) {
    return (
      <section className="stack">
        <h1 className="title">Essen</h1>
        <div className="card">
          <p className="muted">Noch keine Rezepte geladen. Importiere `rezepte.json` im Tab „Mehr“.</p>
        </div>
      </section>
    )
  }

  const slotFor = (i: number) => meals.weeks[weekStart]?.[i] ?? defaultSlot(weekStart, i)

  async function setSlots(next: string[]) {
    await setMeals({ ...meals, weeks: { ...meals.weeks, [weekStart]: next } })
  }

  async function setSlot(i: number, value: string) {
    const next = Array.from({ length: 7 }, (_, idx) => slotFor(idx))
    next[i] = value
    await setSlots(next)
  }

  async function swapDays(a: number, b: number) {
    const next = Array.from({ length: 7 }, (_, idx) => slotFor(idx))
    ;[next[a], next[b]] = [next[b], next[a]]
    await setSlots(next)
  }

  async function toggleSkip(i: number) {
    const current = meals.skip[weekStart] ?? []
    const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i]
    await setMeals({ ...meals, skip: { ...meals.skip, [weekStart]: next } })
  }

  async function setPersons(n: number) {
    await setMeals({ ...meals, persons: n })
  }

  const todayDrinks = drinks[today] ?? []
  const todayMl = todayDrinks.reduce((s, d) => s + d.ml, 0)

  async function addWater(ml: number) {
    const list = drinks[today] ?? []
    await setDrinks({ ...drinks, [today]: [...list, { ml, t: 'wasser', ts: Date.now() }] })
  }

  async function undoWater() {
    const list = drinks[today] ?? []
    if (list.length === 0) return
    await setDrinks({ ...drinks, [today]: list.slice(0, -1) })
  }

  return (
    <section className="stack">
      <header>
        <h1 className="title">Essen</h1>
        <p className="subtitle">{formatDay(today)}</p>
      </header>

      <div className="card">
        <div className="row between">
          <div>
            <p className="muted">Wasser heute</p>
            <p className="water-amount">{todayMl} ml</p>
          </div>
          <span className="pill">Ziel {WATER_GOAL} ml</span>
        </div>
        <div className="progress terra" role="progressbar" aria-valuenow={Math.min(100, Math.round((todayMl / WATER_GOAL) * 100))} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.min((todayMl / WATER_GOAL) * 100, 100)}%` }} />
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          {WATER_STEPS.map((ml) => (
            <button key={ml} type="button" className="btn" style={{ flex: 1 }} onClick={() => addWater(ml)}>
              + {ml} ml
            </button>
          ))}
          <button type="button" className="btn ghost small" onClick={undoWater} aria-label="Letzten Eintrag rückgängig machen">↶</button>
        </div>
      </div>

      <div className="row between">
        <button type="button" className="btn ghost" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Vorwoche">←</button>
        <span className="muted">
          Woche ab {formatDay(weekStart, { day: 'numeric', month: 'short' })} · Rotation {rotationWeek(weekStart)}
        </span>
        <button type="button" className="btn ghost" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Nächste Woche">→</button>
      </div>

      <div className="segmented" role="tablist">
        <button type="button" className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}>Wochenplan</button>
        <button type="button" className={view === 'shopping' ? 'active' : ''} onClick={() => setView('shopping')}>Einkaufszettel</button>
      </div>

      {view === 'plan' && (
        <>
          <div className="row between">
            <span className="muted">Für</span>
            <div className="stepper">
              <button type="button" className="btn small" onClick={() => setPersons(Math.max(1, meals.persons - 1))} aria-label="Weniger Personen">−</button>
              <strong>{meals.persons} {meals.persons === 1 ? 'Person' : 'Personen'}</strong>
              <button type="button" className="btn small" onClick={() => setPersons(Math.min(6, meals.persons + 1))} aria-label="Mehr Personen">+</button>
            </div>
          </div>

          {days.map((d, i) => {
            const slot = slotFor(i)
            const recipe = findRecipe(content.rezepte, slot)
            const isSkipped = skipped.includes(i)
            const isOpen = openDay === i
            return (
              <div key={d} className={`card day-card ${d === today ? 'today-card' : ''} ${isSkipped ? 'skipped' : ''}`}>
                <button type="button" className="day-head" onClick={() => setOpenDay(isOpen ? null : i)} aria-expanded={isOpen}>
                  <span className="day-name">{DAYS[i]} · {formatDay(d, { day: 'numeric', month: 'numeric' })}</span>
                  <span className="day-title">{isSkipped ? 'Auswärts / kein Kochen' : titleOf(slot, recipe?.titel)}</span>
                </button>

                {isOpen && (
                  <div className="stack" style={{ gap: 10, marginTop: 10 }}>
                    {recipe?.hinweis && <p className="hint">💡 {recipe.hinweis}</p>}

                    {!isSkipped && recipe && (
                      <>
                        <ul className="ingredients">
                          {recipe.zutaten_fuer_3.map((z: Zutat) => (
                            <li key={z.name}>
                              <span>{z.name}</span>
                              <span className="muted">{scaleAmount(z, meals.persons)} {z.einheit}</span>
                            </li>
                          ))}
                        </ul>
                        <ol className="steps">
                          {recipe.schritte.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ol>
                      </>
                    )}

                    <div className="form day-actions">
                      <p className="section-title" style={{ margin: 0 }}>Tauschen oder ändern</p>
                        <select className="select" value={recipe ? slot : ''} onChange={(e) => e.target.value && setSlot(i, e.target.value)}>
                          <option value="" disabled>Anderes Rezept wählen…</option>
                          {content.rezepte.map((r) => (
                            <option key={r.id} value={r.id}>{r.titel}</option>
                          ))}
                        </select>
                        <CustomMeal onSave={(text) => setSlot(i, `custom:${text}`)} />
                        <select className="select" defaultValue="" onChange={(e) => {
                          if (e.target.value !== '') swapDays(i, Number(e.target.value))
                          e.target.value = ''
                        }}>
                          <option value="">Mit anderem Tag tauschen…</option>
                          {DAYS.map((label, j) => (j !== i ? <option key={label} value={j}>{label}</option> : null))}
                        </select>
                        <button type="button" className="btn small" onClick={() => toggleSkip(i)}>
                          {isSkipped ? 'Doch kochen' : 'Auswärts essen (nicht kochen)'}
                        </button>
                        <button type="button" className="btn ghost small" onClick={() => setSlot(i, defaultSlot(weekStart, i))}>
                          Zurück zum Standard
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {view === 'shopping' && (
        <Shopping
          content={content}
          weekDaysList={days}
          slotFor={slotFor}
          skipped={skipped}
          persons={meals.persons}
          weekStart={weekStart}
          checked={checked}
          setChecked={setChecked}
        />
      )}
    </section>
  )
}

function CustomMeal({ onSave }: { onSave: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        onSave(text.trim())
        setText('')
      }}
    >
      <input className="input" placeholder="Eigenes Gericht…" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn" type="submit">✓</button>
    </form>
  )
}

interface ShoppingProps {
  content: RezepteFile
  weekDaysList: string[]
  slotFor: (i: number) => string
  skipped: number[]
  persons: number
  weekStart: string
  checked: Record<string, boolean>
  setChecked: (next: Record<string, boolean>) => Promise<void>
}

function Shopping({ content, slotFor, skipped, persons, weekStart, checked, setChecked }: ShoppingProps) {
  const groups = useMemo(() => {
    const map = new Map<string, ShopItem>()
    for (let i = 0; i < 7; i++) {
      if (skipped.includes(i)) continue
      const recipe = findRecipe(content.rezepte, slotFor(i))
      if (!recipe) continue
      for (const z of recipe.zutaten_fuer_3) {
        const key = `${z.name}|${z.einheit}`
        const entry = map.get(key) ?? { name: z.name, einheit: z.einheit, menge: 0, kategorie: z.kategorie }
        entry.menge += scaleAmount(z, persons)
        map.set(key, entry)
      }
    }
    const byCat: Record<string, ShopItem[]> = {}
    for (const entry of map.values()) {
      ;(byCat[entry.kategorie] ??= []).push(entry)
    }
    return byCat
  }, [content, skipped, persons, slotFor])

  const toggle = (key: string) => setChecked({ ...checked, [key]: !checked[key] })
  const weekPrefix = `${weekStart}|`

  return (
    <div className="stack">
      {Object.keys(groups).length === 0 && <p className="empty">Diese Woche gibt es nichts einzukaufen.</p>}
      {Object.entries(groups).map(([cat, items]) => (
        <div className="card" key={cat}>
          <p className="section-title" style={{ margin: '0 0 6px' }}>{cat}</p>
          {items.map((it) => {
            const key = `${weekPrefix}${it.name}|${it.einheit}`
            return (
              <label className="check-row" key={key}>
                <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)} />
                <span className={checked[key] ? 'done-text' : ''}>
                  {it.name} · {Math.round(it.menge * 10) / 10} {it.einheit}
                </span>
              </label>
            )
          })}
        </div>
      ))}

      <div className="card">
        <p className="section-title" style={{ margin: '0 0 6px' }}>Basics</p>
        {Object.entries(content.basics_einkauf).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 8 }}>
            <p className="muted" style={{ fontWeight: 600 }}>{group}</p>
            {items.map((item) => {
              const key = `basics|${item}`
              return (
                <label className="check-row" key={key}>
                  <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)} />
                  <span className={checked[key] ? 'done-text' : ''}>{item}</span>
                </label>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
