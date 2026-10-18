import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getXp } from '../db'
import { addDays, dateKey, formatDay, greeting, streakOf } from '../lib/dates'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'more'

const PLANT_STAGES = [
  { min: 0, emoji: '🌱', name: 'Setzling' },
  { min: 50, emoji: '🌿', name: 'Triebe' },
  { min: 150, emoji: '🪴', name: 'Topfpflanze' },
  { min: 300, emoji: '🌸', name: 'Blühend' },
]

function stageFor(xp: number) {
  let index = 0
  for (let i = 0; i < PLANT_STAGES.length; i++) {
    if (xp >= PLANT_STAGES[i].min) index = i
  }
  const current = PLANT_STAGES[index]
  const next = PLANT_STAGES[index + 1]
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100
  return { current, next, progress }
}

export function Today({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [today] = useState(() => dateKey())
  const [newHabit, setNewHabit] = useState('')

  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const logs = useLiveQuery(() => db.habitLogs.toArray(), [], [])
  const events = useLiveQuery(
    () => db.events.where('date').equals(today).sortBy('time'),
    [today],
    [],
  )
  const xp = useLiveQuery(getXp, [], 0)
  const meals = useLiveQuery(() => db.meals.where('date').equals(today).count(), [today], 0)
  const water = useLiveQuery(
    async () => (await db.water.where('date').equals(today).toArray()).reduce((s, w) => s + w.ml, 0),
    [today],
    0,
  )

  const doneToday = (habitId: number) => logs.some((l) => l.habitId === habitId && l.date === today)

  async function toggleHabit(habitId: number) {
    const log = logs.find((l) => l.habitId === habitId && l.date === today)
    if (log?.id !== undefined) {
      await db.habitLogs.delete(log.id)
    } else {
      await db.habitLogs.add({ habitId, date: today })
    }
  }

  async function addHabit() {
    const name = newHabit.trim()
    if (!name) return
    await db.habits.add({ name, createdAt: Date.now() })
    setNewHabit('')
  }

  async function removeHabit(id: number) {
    await db.habits.delete(id)
    await db.habitLogs.where('habitId').equals(id).delete()
  }

  function streak(habitId: number) {
    const dates = new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date))
    return streakOf(dates, today)
  }

  const { current, next, progress } = stageFor(xp ?? 0)
  const doneCount = habits.filter((h) => h.id !== undefined && doneToday(h.id)).length

  return (
    <section className="stack">
      <header>
        <p className="subtitle">{formatDay(today)}</p>
        <h1 className="title">{greeting()} 🌤️</h1>
      </header>

      <div className="card">
        <div className="plant">
          <div className="plant-emoji" aria-hidden="true">{current.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600 }}>{current.name}</p>
            <p className="muted">{xp ?? 0} XP{next ? ` · noch ${next.min - (xp ?? 0)} bis „${next.name}“` : ' · voll aufgeblüht'}</p>
            <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">Gewohnheiten · {doneCount}/{habits.length} heute</div>
      <div className="stack" style={{ gap: 8 }}>
        {habits.length === 0 && <p className="empty">Lege deine erste Gewohnheit an, z. B. „Wasser trinken“ oder „10 Min. Spazieren“.</p>}
        {habits.map((h) => {
          const done = h.id !== undefined && doneToday(h.id)
          const s = h.id !== undefined ? streak(h.id) : 0
          return (
            <div key={h.id} className="habit-row">
              <button
                type="button"
                className={`habit ${done ? 'done' : ''}`}
                onClick={() => h.id !== undefined && toggleHabit(h.id)}
                aria-pressed={done}
              >
                <span className="check" aria-hidden="true">✓</span>
                <span className="habit-name">{h.name}</span>
                {s > 0 && <span className="pill terra">🔥 {s}</span>}
              </button>
              {h.id !== undefined && (
                <button type="button" className="btn ghost small" aria-label={`${h.name} löschen`} onClick={() => removeHabit(h.id!)}>
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          addHabit()
        }}
      >
        <input className="input" placeholder="Neue Gewohnheit…" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} />
        <button className="btn primary" type="submit">+</button>
      </form>

      <div className="section-title">Heute</div>
      <div className="card">
        {events.length === 0 ? (
          <p className="empty">Keine Termine heute. 🌿</p>
        ) : (
          events.map((ev) => (
            <div className="list-item" key={ev.id}>
              <span className="time">{ev.time ?? 'ganzt.'}</span>
              <div className="grow">{ev.title}</div>
            </div>
          ))
        )}
        <button type="button" className="btn ghost small" onClick={() => onNavigate('calendar')}>Zum Kalender →</button>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button type="button" className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNavigate('food')}>
          <p className="muted">Essen</p>
          <p style={{ fontWeight: 600 }}>{meals ?? 0} Mahlzeiten</p>
          <p className="muted">💧 {((water ?? 0) / 1000).toFixed(1)} L</p>
        </button>
        <button type="button" className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNavigate('training')}>
          <p className="muted">Training</p>
          <p style={{ fontWeight: 600 }}>Workout starten</p>
          <p className="muted">🏋️ Plan wählen</p>
        </button>
      </div>

      <p className="muted" style={{ textAlign: 'center', marginTop: 4 }}>
        Morgen: {formatDay(addDays(today, 1), { weekday: 'long' })}
      </p>
    </section>
  )
}
