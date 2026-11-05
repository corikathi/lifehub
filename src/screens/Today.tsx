import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'
import { addDays, dateKey, formatDay, greeting } from '../lib/dates'
import { defaultSlot, findRecipe, type TrainingFile } from '../lib/content'
import type { Todo } from '../lib/todos'
import { Cat } from '../components/Cat'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'money' | 'more'

const GLASSES = 12 // 12 Gläser à 250 ml = 3 Liter
const GOAL_LITERS = 3
const GLASS_ML = 250
const DEFAULT_SUPPLEMENTS = ['Omega-3', 'Magnesium', 'Kreatin', 'Vitamin D']
const DEFAULT_TRAINING_TARGET = 4
const DEFAULT_GOAL_WEIGHT = 58
const REACTIONS = ['Miau!', 'Schnurr… das tut gut.', 'Schön, dass du da bist.', 'Kraul mich weiter, ich mag das.']

// Startseite: Warum, Supplements, Training der Woche, Gewicht zum Ziel, Am-Ball-Zähler und Mochi.
export function Today({ onNavigate, onOpenSos }: { onNavigate: (tab: Tab) => void; onOpenSos: () => void }) {
  const [today] = useState(() => dateKey())
  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)
  const sunday = addDays(monday, 6)

  const [warum, setWarum] = useKv<string>('warum', 'Wieder an mein Anfangsgewicht und stärker werden.')
  const [ballStart, setBallStart] = useKv<string | null>('ballStart', null)
  const [supplements] = useKv<string[]>('supplements', DEFAULT_SUPPLEMENTS)
  const [suppDone, setSuppDone] = useKv<Record<string, string[]>>('supplementsDone', {})
  const [trainingTarget] = useKv<number>('trainingTarget', DEFAULT_TRAINING_TARGET)
  const [goalWeight] = useKv<number>('goalWeight', DEFAULT_GOAL_WEIGHT)
  const [measures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })
  const [workoutLog] = useKv<{ date: string }[]>('workoutLog', [])
  const [guided] = useKv<{ date: string }[]>('guidedWorkouts', [])
  const [rides] = useKv<{ log: { date: string }[] }>('rides', { log: [] })
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})
  const [todos, setTodos] = useKv<Todo[]>('todos', [])
  const [taskDone, setTaskDone] = useKv<Record<string, boolean>>('taskDone', {})
  const [trainingContent] = useKv<TrainingFile | null>('content.training', null)
  const [trainingWeeks] = useKv<Record<string, { plan: string[] }>>('trainingWeeks', {})
  const [mealsState] = useKv<{ weeks: Record<string, string[]> }>('meals', { weeks: {} })
  const [mochiName, setMochiName] = useKv<string>('mochiName', 'Mochi')
  const content = useRecipes()
  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const logs = useLiveQuery(() => db.habitLogs.toArray(), [], [])
  const events = useLiveQuery(() => db.events.where('date').equals(today).sortBy('time'), [today], [])

  // Ab heute gezählt, wenn noch kein Startdatum gesetzt ist
  useEffect(() => {
    if (ballStart === null) void setBallStart(today)
  }, [ballStart, today, setBallStart])

  const [reacting, setReacting] = useState(false)
  const [reactIdx, setReactIdx] = useState(0)

  // Am-Ball-Zähler
  const startDay = ballStart ?? today
  const daysOnBall = Math.max(1, Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${startDay}T12:00:00`).getTime()) / 86400000) + 1)

  // Supplements heute
  const doneToday = suppDone[today] ?? []
  const suppCount = supplements.filter((s) => doneToday.includes(s)).length

  // Training in dieser Woche: jeder Tag mit einer Einheit zählt einmal
  const weekDates = new Set<string>()
  const inWeek = (d: string) => d >= monday && d <= sunday
  for (const w of workoutLog) if (inWeek(w.date)) weekDates.add(w.date)
  for (const g of guided) if (inWeek(g.date)) weekDates.add(g.date)
  for (const r of rides.log) if (inWeek(r.date)) weekDates.add(r.date)
  const trainedThisWeek = weekDates.size

  // Gewicht zum Ziel
  const latestWeight = measures.log.length ? measures.log[measures.log.length - 1].gewicht : undefined

  // Wasser heute
  const water = (drinks[today] ?? []).reduce((sum, d) => sum + d.ml, 0)
  const filled = Math.min(GLASSES, Math.floor(water / GLASS_ML))

  // Aufgaben heute: Mahlzeit, Training, Termine, To-dos
  const slot = mealsState.weeks[monday]?.[weekIndex] ?? defaultSlot(monday, weekIndex)
  const todayMeal = slot.startsWith('custom:') ? slot.slice(7) : findRecipe(content?.rezepte ?? [], slot)?.titel ?? 'Noch nichts geplant'
  const todayTraining = trainingWeeks[monday]?.plan?.[weekIndex] ?? trainingContent?.wochenplan_standard[weekIndex]?.split(': ')[1] ?? '–'
  const doneOf = (id: string) => !!taskDone[today + '|' + id]
  const taskList = [
    { id: 'meal', title: todayMeal, meta: 'Mahlzeit heute' },
    { id: 'training', title: todayTraining, meta: 'Training' },
    ...events.map((ev) => ({ id: 'ev:' + ev.id, title: ev.title, meta: ev.time ?? 'ganztägig' })),
  ]
  const dueTodos = todos.filter((td) => !td.date || td.date <= today)

  const doneCount = habits.filter((h) => h.id !== undefined && logs.some((l) => l.habitId === h.id && l.date === today)).length

  // Mochi: eine Zeile, die sich am Fortschritt orientiert, ohne Vorwurf
  const mochiMessages = [
    `Heute schon ${suppCount} von ${supplements.length} Supplements. Das reicht für den Anfang.`,
    `Diese Woche bist du ${trainedThisWeek} von ${trainingTarget} Mal im Training. Jedes Mal zählt.`,
    filled < GLASSES
      ? `Du hast ${(water / 1000).toFixed(1)} von ${GOAL_LITERS} Litern getrunken. Ich trinke auch gleich was.`
      : 'Drei Liter, perfekt. Das hast du geschafft.',
    `Du bist seit ${daysOnBall} Tagen dabei. Das ist mehr, als du denkst.`,
  ]
  const [mIdx, setMIdx] = useState(0)
  const mochiText = reacting ? REACTIONS[reactIdx % REACTIONS.length] : mochiMessages[mIdx % mochiMessages.length]

  async function toggleSupplement(name: string) {
    const list = doneToday.includes(name) ? doneToday.filter((s) => s !== name) : [...doneToday, name]
    await setSuppDone({ ...suppDone, [today]: list })
  }

  async function toggleHabit(habitId: number) {
    const log = logs.find((l) => l.habitId === habitId && l.date === today)
    if (log?.id !== undefined) await db.habitLogs.delete(log.id)
    else await db.habitLogs.add({ habitId, date: today })
  }

  async function addWater(ml: number) {
    const list = drinks[today] ?? []
    await setDrinks({ ...drinks, [today]: [...list, { ml, t: 'wasser', ts: Date.now() }] })
  }

  async function undoWater() {
    const list = drinks[today] ?? []
    if (list.length === 0) return
    await setDrinks({ ...drinks, [today]: list.slice(0, -1) })
  }

  function restartBall() {
    if (window.confirm('Neustart setzen? Ab heute zählt die Serie neu, deine bisherigen Tage bleiben im Verlauf.')) {
      void setBallStart(today)
    }
  }

  function touchMochi() {
    setReacting(true)
    setReactIdx((i) => i + 1)
    setMIdx((i) => i + 1)
    setTimeout(() => setReacting(false), 2500)
  }

  const card: React.CSSProperties = { background: '#fffaf0', borderRadius: 24, padding: 16, boxShadow: '0 6px 18px rgba(94,60,25,.08)' }
  const label: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 700, color: '#8d7459' }
  const big: React.CSSProperties = { margin: '2px 0 0', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: '#4a3828' }

  return (
    <section className="stack" style={{ gap: 16, paddingTop: 6 }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, color: '#8d7459' }}>{greeting()} · {formatDay(today)}</p>
        <h1 style={{ margin: '2px 0 0', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 30 }}>Heute</h1>
      </div>

      {/* Warum und Am-Ball-Zähler */}
      <div style={{ ...card, background: '#e7e9cf' }}>
        <p style={label}>Mein Warum</p>
        <input
          className="input"
          style={{ marginTop: 6, background: 'transparent', border: 'none', padding: 0, fontWeight: 700, fontSize: 16 }}
          value={warum}
          onChange={(e) => void setWarum(e.target.value)}
          aria-label="Mein Warum"
        />
        <div className="row between" style={{ marginTop: 12 }}>
          <div>
            <p style={label}>Am Ball seit</p>
            <p style={big}>{daysOnBall} {daysOnBall === 1 ? 'Tag' : 'Tagen'}</p>
          </div>
          <button type="button" className="btn small" onClick={restartBall}>Neustart</button>
        </div>
      </div>

      {/* Heute in drei Schritten */}
      <div style={card}>
        <div className="row between">
          <p style={label}>Supplements</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: suppCount === supplements.length ? '#5d6b3d' : '#8d7459' }}>
            {suppCount} von {supplements.length}
          </span>
        </div>
        <div className="chips" style={{ marginTop: 8 }}>
          {supplements.map((s) => {
            const done = doneToday.includes(s)
            return (
              <button key={s} type="button" className="chip" onClick={() => void toggleSupplement(s)} style={{ background: done ? '#8fa35a' : '#f2e8d6', color: done ? '#fffaf0' : '#4a3828' }}>
                {done ? '✓ ' : ''}{s}
              </button>
            )
          })}
        </div>
      </div>

      <div style={card}>
        <div className="row between">
          <p style={label}>Training diese Woche</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: trainedThisWeek >= trainingTarget ? '#5d6b3d' : '#8d7459' }}>
            {trainedThisWeek} von {trainingTarget}
          </span>
        </div>
        <div className="progress" style={{ marginTop: 8 }}>
          <span style={{ width: `${Math.min(100, (trainedThisWeek / trainingTarget) * 100)}%` }} />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: '#4a3828' }}>Heute: {todayTraining}</p>
        <button type="button" className="btn small" style={{ marginTop: 8 }} onClick={() => onNavigate('training')}>Zum Training</button>
      </div>

      <div style={card}>
        <div className="row between">
          <p style={label}>Wasser</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#8d7459' }}>{(water / 1000).toFixed(1)} / {GOAL_LITERS} L</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 8 }}>
          {Array.from({ length: GLASSES }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label="Glas Wasser"
              onClick={() => void addWater(GLASS_ML)}
              style={{ height: 28, borderRadius: 8, border: '1.5px solid #ecdcc0', background: i < filled ? '#7fa9b8' : '#fffaf0', cursor: 'pointer' }}
            />
          ))}
        </div>
        {water > 0 && (
          <button type="button" className="btn ghost small" style={{ marginTop: 6 }} onClick={() => void undoWater()}>Letztes Glas zurück</button>
        )}
      </div>

      {/* Gewicht zum Ziel */}
      <div style={card}>
        <p style={label}>Gewicht</p>
        <p style={big}>{latestWeight !== undefined ? `${latestWeight} kg` : '–'} <span style={{ fontSize: 15, color: '#8d7459' }}>· Ziel {goalWeight} kg</span></p>
        <button type="button" className="btn ghost small" style={{ marginTop: 6 }} onClick={() => onNavigate('food')}>Gewicht eintragen</button>
      </div>

      {/* Aufgaben heute */}
      <div style={card}>
        <p style={label}>Heute erledigen · {taskList.length + dueTodos.length}</p>
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          {taskList.map((t) => {
            const done = doneOf(t.id)
            return (
              <button key={t.id} type="button" className="list-item" onClick={() => void setTaskDone({ ...taskDone, [today + '|' + t.id]: !done })} style={{ textAlign: 'left', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>
                <span className="grow">
                  <span style={{ display: 'block', fontWeight: 700 }}>{t.title}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{t.meta}</span>
                </span>
                <span>{done ? '✓' : ''}</span>
              </button>
            )
          })}
          {dueTodos.map((td) => (
            <button key={td.id} type="button" className="list-item" onClick={() => void setTodos(todos.map((x) => (x.id === td.id ? { ...x, done: !x.done } : x)))} style={{ textAlign: 'left', textDecoration: td.done ? 'line-through' : 'none', opacity: td.done ? 0.6 : 1 }}>
              <span className="grow">
                <span style={{ display: 'block', fontWeight: 700 }}>{td.title}</span>
                <span className="muted" style={{ fontSize: 13 }}>{td.meta}</span>
              </span>
              <span>{td.done ? '✓' : ''}</span>
            </button>
          ))}
          {taskList.length === 0 && dueTodos.length === 0 && <p className="muted" style={{ margin: 0 }}>Heute steht nichts an.</p>}
        </div>
      </div>

      {habits.length > 0 && (
        <div style={card}>
          <p style={label}>Gewohnheiten · {doneCount} von {habits.length}</p>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {habits.map((h) => {
              const done = h.id !== undefined && logs.some((l) => l.habitId === h.id && l.date === today)
              return (
                <button key={h.id} type="button" className="list-item" onClick={() => h.id !== undefined && void toggleHabit(h.id)} style={{ textAlign: 'left' }}>
                  <span className="grow" style={{ fontWeight: 700 }}>{h.name}</span>
                  <span>{done ? '✓' : ''}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Mochi */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <button type="button" onClick={touchMochi} aria-label="Mochi antippen" style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
          <svg viewBox="-42 -34 84 64" className={reacting ? 'mochi-cat mochi-react' : 'mochi-cat'} style={{ width: 92, height: 'auto', display: 'block' }} aria-hidden="true">
            <Cat x={0} y={0} happy={reacting} />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0, background: '#fffaf0', borderRadius: '22px 22px 22px 6px', padding: '14px 16px', boxShadow: '0 6px 18px rgba(94,60,25,.08)' }}>
          <button type="button" onClick={() => { const n = window.prompt('Wie soll deine Katze heißen?', mochiName)?.trim(); if (n) void setMochiName(n) }} style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 12, fontWeight: 800, color: '#c9764a', cursor: 'pointer' }}>
            {mochiName.toUpperCase()}
          </button>
          <p style={{ margin: '3px 0 0', fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: '#4a3828' }}>{mochiText}</p>
        </div>
      </div>

      <button type="button" className="btn ghost" onClick={onOpenSos}>Ruhe-Ecke öffnen</button>
    </section>
  )
}
