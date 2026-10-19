import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getXp } from '../db'
import { useKv } from '../lib/store'
import { defaultSlot, findRecipe, type RezepteFile, type TrainingFile } from '../lib/content'
import { addDays, dateKey, formatDay, greeting, streakOf, weekDays } from '../lib/dates'
import { CozyScene } from '../components/CozyScene'
import { Abendplan } from '../components/Abendplan'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'more'

const GLASS_ML = 250
const GLASSES = 8
const DAY_LETTERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function Today({ onNavigate, onOpenSos }: { onNavigate: (tab: Tab) => void; onOpenSos: () => void }) {
  const [today] = useState(() => dateKey())
  const [newHabit, setNewHabit] = useState('')

  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const logs = useLiveQuery(() => db.habitLogs.toArray(), [], [])
  const events = useLiveQuery(() => db.events.where('date').equals(today).sortBy('time'), [today], [])
  const xp = useLiveQuery(getXp, [], 0)
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})
  const [sleep] = useKv<Record<string, number>>('sleep', {})
  const [content] = useKv<RezepteFile | null>('content.rezepte', null)
  const [trainingContent] = useKv<TrainingFile | null>('content.training', null)
  const [mealsState] = useKv<{ weeks: Record<string, string[]> }>('meals', { weeks: {} })
  const [trainingWeeks] = useKv<Record<string, { plan: string[] }>>('trainingWeeks', {})

  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)
  const days = weekDays(today)
  const slot = mealsState.weeks[monday]?.[weekIndex] ?? defaultSlot(monday, weekIndex)
  const todayMeal = slot.startsWith('custom:') ? slot.slice(7) : findRecipe(content?.rezepte ?? [], slot)?.titel ?? 'Noch nichts geplant'
  const todayTraining = trainingWeeks[monday]?.plan?.[weekIndex] ?? trainingContent?.wochenplan_standard[weekIndex]?.split(': ')[1] ?? '–'

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

  async function addGlass() {
    const list = drinks[today] ?? []
    await setDrinks({ ...drinks, [today]: [...list, { ml: GLASS_ML, t: 'wasser', ts: Date.now() }] })
  }

  const water = (drinks[today] ?? []).reduce((sum, d) => sum + d.ml, 0)
  const filledGlasses = Math.min(GLASSES, Math.floor(water / GLASS_ML))
  const doneCount = habits.filter((h) => h.id !== undefined && doneToday(h.id)).length
  const level = Math.min(4, Math.floor((xp ?? 0) / 100))
  const nextUnlock = (level + 1) * 100 - (xp ?? 0)

  // Schlaf: letzte Nacht und Durchschnitt der letzten sieben Tage
  const lastSevenDays = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const sleepValues = lastSevenDays.map((d) => sleep[d])
  const sleepKnown = sleepValues.filter((v): v is number => typeof v === 'number')
  const sleepAvg = sleepKnown.length ? sleepKnown.reduce((s, v) => s + v, 0) / sleepKnown.length : undefined

  // Punkte fürs Zimmer: erledigte Gewohnheiten und Abendplan
  const maxPoints = habits.length + 5
  const points = doneCount

  return (
    <section className="stack" style={{ gap: 18 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 6 }}>
        <div>
          <p className="subtitle" style={{ margin: 0 }}>{formatDay(today)}</p>
          <h1 className="title" style={{ margin: '2px 0 0' }}>{greeting()}</h1>
        </div>
        <div className="level-bubble" aria-label={`Stufe ${level}`}>
          <span className="level-num">{level}</span>
          <span className="level-label">STUFE</span>
        </div>
      </header>

      <div className="week-strip">
        {days.map((d, i) => {
          const isToday = d === today
          return (
            <button key={d} type="button" className="week-day" onClick={() => onNavigate('calendar')} aria-label={`${DAY_LETTERS[i]} ${formatDay(d, { day: 'numeric', month: 'numeric' })}`}>
              <span className="week-letter" style={{ fontWeight: isToday ? 800 : 600 }}>{DAY_LETTERS[i]}</span>
              <span className={`week-date ${isToday ? 'today' : ''}`}>{Number(d.slice(8))}</span>
            </button>
          )
        })}
      </div>

      <div className="card room-card">
        <CozyScene level={level} mood={habits.length > 0 && doneCount >= Math.ceil(habits.length / 2) ? 'happy' : 'calm'} />
        <div className="row between" style={{ marginTop: 12, alignItems: 'baseline' }}>
          <span className="room-title">Dein Zimmer</span>
          <span className="muted" style={{ fontWeight: 600 }}>{points} von {maxPoints} Punkten</span>
        </div>
        <div className="progress room-progress"><span style={{ width: `${Math.min(100, (points / maxPoints) * 100)}%` }} /></div>
        <p className="muted" style={{ marginTop: 6 }}>Noch {nextUnlock} XP bis zum nächsten Möbelstück.</p>
      </div>

      <button type="button" className="sos-btn" onClick={onOpenSos}>Ruhe-Ecke</button>

      <div className="section-title">Termine heute</div>
      <div className="stack" style={{ gap: 10 }}>
        {events.length === 0 && <p className="empty">Heute nichts eingetragen. 🌿</p>}
        {events.map((ev) => (
          <div className="event-card" key={ev.id}>
            <span className="event-time">{ev.time ?? 'ganzt.'}</span>
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{ev.title}</div>
              {ev.note && <p className="muted">{ev.note}</p>}
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost small" onClick={() => onNavigate('calendar')}>Zum Kalender →</button>
      </div>

      <div className="section-title">Gewohnheiten · {doneCount}/{habits.length} heute</div>
      {habits.length === 0 && <p className="empty">Lege deine erste Gewohnheit an, z. B. „Wasser trinken“ oder „10 Min. Spazieren“.</p>}
      <div className="habit-grid">
        {habits.map((h) => {
          const done = h.id !== undefined && doneToday(h.id)
          const s = h.id !== undefined ? streak(h.id) : 0
          return (
            <div key={h.id} className={`habit-tile ${done ? 'done' : ''}`}>
              <button type="button" className="habit-tile-main" onClick={() => h.id !== undefined && toggleHabit(h.id)} aria-pressed={done}>
                <span className="habit-tile-top">
                  <span className="habit-tile-name">{h.name}</span>
                  <span className="habit-tile-check" aria-hidden="true">{done ? '✓' : ''}</span>
                </span>
                <span className="habit-tile-streak">{s > 0 ? `${s} Tage in Folge` : 'Heute starten'}</span>
              </button>
              {h.id !== undefined && (
                <button type="button" className="habit-tile-del" aria-label={`${h.name} löschen`} onClick={() => removeHabit(h.id!)}>×</button>
              )}
            </div>
          )
        })}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          void addHabit()
        }}
      >
        <input className="input" placeholder="Neue Gewohnheit…" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} />
        <button className="btn primary" type="submit">+</button>
      </form>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="mini-card water">
          <div className="row between">
            <span className="mini-title">Wasser</span>
            <span className="mini-sub">{(water / 1000).toFixed(1)} L</span>
          </div>
          <div className="glass-grid">
            {Array.from({ length: GLASSES }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`glass ${i < filledGlasses ? 'filled' : ''}`}
                onClick={() => addGlass()}
                aria-label={`Glas ${i + 1}`}
              />
            ))}
          </div>
          <span className="mini-sub">Tippen zum Auffüllen</span>
        </div>

        <div className="mini-card sleep">
          <div className="row between">
            <span className="mini-title">Schlaf</span>
            <span className="mini-sub">{sleepAvg !== undefined ? `Ø ${sleepAvg.toFixed(1)} h` : 'noch keine Werte'}</span>
          </div>
          <span className="sleep-big">{sleep[today] !== undefined ? `${sleep[today]} h` : '–'}</span>
          <div className="sleep-bars">
            {sleepValues.map((v, i) => (
              <div key={i} className="sleep-bar" style={{ height: `${Math.min(100, ((v ?? 0) / 9) * 100)}%`, opacity: v === undefined ? 0.25 : 1 }} />
            ))}
          </div>
        </div>
      </div>

      <Abendplan />

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button type="button" className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNavigate('food')}>
          <p className="muted">Essen</p>
          <p style={{ fontWeight: 600 }}>{todayMeal}</p>
        </button>
        <button type="button" className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onNavigate('training')}>
          <p className="muted">Training</p>
          <p style={{ fontWeight: 600 }}>{todayTraining}</p>
        </button>
      </div>
    </section>
  )
}
