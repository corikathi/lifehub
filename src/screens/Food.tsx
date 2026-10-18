import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type MealType } from '../db'
import { dateKey, formatDay } from '../lib/dates'

const MEAL_TYPES: MealType[] = ['Frühstück', 'Mittag', 'Abendessen', 'Snack']
const WATER_GOAL = 2000
const WATER_STEPS = [250, 500]

export function Food() {
  const today = dateKey()
  const [type, setType] = useState<MealType>('Frühstück')
  const [text, setText] = useState('')

  const meals = useLiveQuery(() => db.meals.where('date').equals(today).toArray(), [today], [])
  const water = useLiveQuery(
    async () => (await db.water.where('date').equals(today).toArray()).reduce((s, w) => s + w.ml, 0),
    [today],
    0,
  )

  async function addMeal() {
    const trimmed = text.trim()
    if (!trimmed) return
    await db.meals.add({ date: today, type, text: trimmed })
    setText('')
  }

  async function addWater(ml: number) {
    await db.water.add({ date: today, ml })
  }

  async function undoWater() {
    const last = await db.water.where('date').equals(today).last()
    if (last?.id !== undefined) await db.water.delete(last.id)
  }

  const percent = Math.min(((water ?? 0) / WATER_GOAL) * 100, 100)

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
            <p className="water-amount">{water ?? 0} ml</p>
          </div>
          <span className="pill">Ziel {WATER_GOAL} ml</span>
        </div>
        <div className="progress terra" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} />
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

      <div className="section-title">Mahlzeiten</div>
      <div className="card">
        {meals.length === 0 && <p className="empty">Noch nichts gegessen erfasst. Was gab es Schönes?</p>}
        {MEAL_TYPES.map((mt) => {
          const items = meals.filter((m) => m.type === mt)
          if (items.length === 0) return null
          return (
            <div key={mt} style={{ marginBottom: 8 }}>
              <p className="muted" style={{ fontWeight: 600 }}>{mt}</p>
              {items.map((m) => (
                <div className="list-item" key={m.id}>
                  <div className="grow">{m.text}</div>
                  <button
                    type="button"
                    className="btn ghost small danger"
                    aria-label={`${m.text} löschen`}
                    onClick={() => m.id !== undefined && db.meals.delete(m.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          addMeal()
        }}
      >
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt}
              type="button"
              className={`pill ${type === mt ? '' : 'terra'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '6px 12px' }}
              onClick={() => setType(mt)}
              aria-pressed={type === mt}
            >
              {mt}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Was hast du gegessen?" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!text.trim()}>Mahlzeit speichern</button>
      </form>
    </section>
  )
}
