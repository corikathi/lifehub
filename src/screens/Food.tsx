import { useState } from 'react'
import { useKv } from '../lib/store'
import { Hunger } from './Hunger'
import { ShoppingList } from '../components/ShoppingList'
import { EssenOverview } from './EssenOverview'
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


// Eigene Gerichte werden als "custom:Text" gespeichert
function titleOf(slot: string, recipeTitle?: string): string {
  if (recipeTitle) return recipeTitle
  return slot.startsWith("custom:") ? slot.slice(7) : slot
}


const EMPTY_MEALS: MealsState = { persons: 2, skip: {}, weeks: {} }

function mondayOf(key: string): string {
  const d = new Date(`${key}T12:00:00`)
  return addDays(key, -((d.getDay() + 6) % 7))
}

export function Food() {
  const today = dateKey()
  const [content] = useKv<RezepteFile | null>('content.rezepte', null)
  const [meals, setMeals] = useKv<MealsState>('meals', EMPTY_MEALS)
  const [weekStart, setWeekStart] = useState(() => mondayOf(today))
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [view, setView] = useState<'plan' | 'shopping' | 'hunger' | 'kcal'>('plan')

  const days = weekDays(weekStart)
  const skipped = meals.skip[weekStart] ?? []

  if (!content) {
    return (
      <section className="stack">
        <EssenOverview />
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


  return (
    <section className="stack">
      <EssenOverview />

      
      <div className="row between">
        <button type="button" className="btn ghost" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Vorwoche">←</button>
        <span className="muted">
          Woche ab {formatDay(weekStart, { day: 'numeric', month: 'short' })} · Rotation {rotationWeek(weekStart)}
        </span>
        <button type="button" className="btn ghost" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Nächste Woche">→</button>
      </div>

      <div className="segmented" role="tablist">
        <button type="button" className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}>Wochenplan</button>
        <button type="button" className={view === 'shopping' ? 'active' : ''} onClick={() => setView('shopping')}>Einkaufsliste</button>
        <button type="button" className={view === 'hunger' ? 'active' : ''} onClick={() => setView('hunger')}>Heißhunger</button>
      </div>

      {view === 'hunger' && <Hunger />}
      {view === 'shopping' && content && (
        <ShoppingList content={content} slots={[0, 1, 2, 3, 4, 5, 6].map(slotFor)} persons={meals.persons} monday={weekStart} />
      )}

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


