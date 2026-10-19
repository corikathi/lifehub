import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useKv } from '../lib/store'
import { addDays, dateKey, formatDay, greeting, streakOf, weekDays } from '../lib/dates'
import { HEUTE } from '../prototype/heute'
import { PrototypeScreen } from '../components/PrototypeScreen'
import { defaultSlot, findRecipe, type RezepteFile, type TrainingFile } from '../lib/content'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'money' | 'more'

const GLASSES = 8
const GLASS_ML = 250
const DAY_LETTERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Heute 1:1 aus dem Prototyp. Die Inhalte kommen aus unseren Daten.
export function Today({ onNavigate, onOpenSos }: { onNavigate: (tab: Tab) => void; onOpenSos: () => void }) {
  const [today] = useState(() => dateKey())
  const [newHabit, setNewHabit] = useState('')
  const [mIdx, setMIdx] = useState(0)

  const habits = useLiveQuery(() => db.habits.toArray(), [], [])
  const logs = useLiveQuery(() => db.habitLogs.toArray(), [], [])
  const events = useLiveQuery(() => db.events.where('date').equals(today).sortBy('time'), [today], [])
  const [todos, setTodos] = useKv<{ id: string; title: string; meta: string; tag: string; done: boolean }[]>('todos', [])
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})
  const [content] = useKv<RezepteFile | null>('content.rezepte', null)
  const [trainingContent] = useKv<TrainingFile | null>('content.training', null)
  const [mealsState] = useKv<{ weeks: Record<string, string[]> }>('meals', { weeks: {} })
  const [trainingWeeks] = useKv<Record<string, { plan: string[] }>>('trainingWeeks', {})
  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)
  const slot = mealsState.weeks[monday]?.[weekIndex] ?? defaultSlot(monday, weekIndex)
  const todayMeal = slot.startsWith('custom:') ? slot.slice(7) : findRecipe(content?.rezepte ?? [], slot)?.titel ?? 'Noch nichts geplant'
  const todayTraining = trainingWeeks[monday]?.plan?.[weekIndex] ?? trainingContent?.wochenplan_standard[weekIndex]?.split(': ')[1] ?? '–'

  const doneToday = (habitId: number) => logs.some((l) => l.habitId === habitId && l.date === today)
  const water = (drinks[today] ?? []).reduce((sum, d) => sum + d.ml, 0)
  const filled = Math.min(GLASSES, Math.floor(water / GLASS_ML))
  const doneCount = habits.filter((h) => h.id !== undefined && doneToday(h.id)).length
  const openHabit = habits.find((h) => h.id !== undefined && !doneToday(h.id))

  async function toggleHabit(habitId: number) {
    const log = logs.find((l) => l.habitId === habitId && l.date === today)
    if (log?.id !== undefined) {
      await db.habitLogs.delete(log.id)
    } else {
      await db.habitLogs.add({ habitId, date: today })
    }
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

  async function addHabit() {
    const name = newHabit.trim()
    if (!name) return
    await db.habits.add({ name, createdAt: Date.now() })
    setNewHabit('')
  }

  const mochiMessages = [
    openHabit
      ? `Heute stehen noch ${habits.length - doneCount} Gewohnheiten an. Fang mit „${openHabit.name}“ an.`
      : 'Alle Gewohnheiten für heute erledigt. Jetzt darfst du auf dem Sofa liegen, so wie ich.',
    filled < GLASSES
      ? `Du hast ${filled} von ${GLASSES} Gläsern Wasser getrunken. Ich trinke auch gleich was.`
      : 'Acht Gläser Wasser, perfekt.',
    'Wenn es dir zu viel wird: die Ruhe-Ecke ist nur einen Tipp entfernt. Ich bleib bei dir.',
  ]

  const days = weekDays(today).map((d, i) => {
    const isToday = d === today
    return {
      label: DAY_LETTERS[i],
      date: Number(d.slice(8)),
      weight: isToday ? 800 : 600,
      bg: isToday ? '#8fa35a' : '#efe2c9',
      go: 'nav:woche',
    }
  })

  const habitTiles = habits.map((h) => {
    const done = h.id !== undefined && doneToday(h.id)
    const dates = new Set(logs.filter((l) => l.habitId === h.id).map((l) => l.date))
    const s = streakOf(dates, today)
    return {
      name: h.name,
      streak: s > 0 ? `${s} Tage in Folge` : 'Heute starten',
      mark: done ? '✓' : '',
      bg: done ? '#e7e9cf' : '#fffaf0',
      ink: '#4a3828',
      check: done ? '#8fa35a' : 'transparent',
      toggle: `habit:${h.id}`,
    }
  })

  function markOf(done: boolean) {
    return {
      mark: done ? '✓' : '',
      color: done ? '#8d7459' : '#4a3828',
      deco: done ? 'line-through' : 'none',
      checkBg: done ? '#8fa35a' : '#fffaf0',
    }
  }
  const taskTiles = [
    { title: todayMeal, meta: 'Mahlzeit heute', tag: 'Essen', toggle: 'noop', tagBg: '#f7e2b5', tagInk: '#7a561a', ...markOf(false) },
    { title: todayTraining, meta: 'Training', tag: 'Training', toggle: 'noop', tagBg: '#dce8ea', tagInk: '#3f5a66', ...markOf(false) },
    ...events.map((ev) => ({ title: ev.title, meta: ev.note ?? 'Termin', tag: ev.time ?? 'ganztägig', toggle: 'noop', tagBg: '#f7e2b5', tagInk: '#7a561a', ...markOf(false) })),
  ]

  const todoTiles = todos.map((td) => ({ title: td.title, meta: td.meta, tag: td.tag, toggle: 'todo:' + td.id, tagBg: '#e2d2b5', tagInk: '#4a3828', ...markOf(td.done) }))
  const taskList = [...taskTiles, ...todoTiles]

  const glassTiles = Array.from({ length: GLASSES }, (_, i) => ({
    bg: i < filled ? '#7fa9b8' : '#fffaf0',
    tap: 'water:add',
  }))

  const ctx = {
    greeting: greeting(),
    dateText: formatDay(today),
    openCalm: 'nav:ruhe',
    days,
    habits: habitTiles,
    taskCount: `${taskList.length} heute`,
    tasks: taskList,
    glasses: glassTiles,
    waterText: `${filled} / ${GLASSES} Gläser`,
    mascotMsg: mochiMessages[mIdx % mochiMessages.length],
    nextMsg: 'mochi:next',
  }

  function handleAct(action: string) {
    if (action === 'nav:ruhe') onOpenSos()
    else if (action === 'nav:woche') onNavigate('calendar')
    else if (action === 'water:add') void addWater(GLASS_ML)
    else if (action === 'water:250') void addWater(250)
    else if (action === 'water:500') void addWater(500)
    else if (action === 'water:undo') void undoWater()
    else if (action === 'mochi:next') setMIdx((i) => i + 1)
    else if (action === 'nav:mehr') onNavigate('more')
    else if (action.startsWith('todo:')) {
      const id = action.slice(5)
      void setTodos(todos.map((td) => (td.id === id ? { ...td, done: !td.done } : td)))
    }
    else if (action.startsWith('habit:')) {
      const id = Number(action.slice(6))
      if (!Number.isNaN(id)) void toggleHabit(id)
    }
  }

  return (
    <section className="stack" style={{ gap: 18 }}>
      <PrototypeScreen template={HEUTE} ctx={ctx} onAct={handleAct} />

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

    </section>
  )
}

