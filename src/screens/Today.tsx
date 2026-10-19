import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useKv } from '../lib/store'
import { dateKey, formatDay, greeting, streakOf, weekDays } from '../lib/dates'
import { HEUTE } from '../prototype/heute'
import { PrototypeScreen } from '../components/PrototypeScreen'
import { Abendplan } from '../components/Abendplan'

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
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})

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

  async function addGlass() {
    const list = drinks[today] ?? []
    await setDrinks({ ...drinks, [today]: [...list, { ml: GLASS_ML, t: 'wasser', ts: Date.now() }] })
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

  const taskTiles = events.length
    ? events.map((ev) => ({
        title: ev.title,
        meta: ev.note ?? 'Termin',
        tag: ev.time ?? 'ganztägig',
        mark: '',
        toggle: 'noop',
        color: '#4a3828',
        deco: 'none',
        checkBg: '#fffaf0',
        tagBg: '#f7e2b5',
        tagInk: '#7a561a',
      }))
    : [
        {
          title: 'Heute nichts eingetragen',
          meta: 'Ein freier Tag',
          tag: 'Frei',
          mark: '',
          toggle: 'noop',
          color: '#4a3828',
          deco: 'none',
          checkBg: '#fffaf0',
          tagBg: '#dcebe7',
          tagInk: '#2d6a5e',
        },
      ]

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
    tasks: taskTiles,
    taskCount: `${events.length} ${events.length === 1 ? 'Termin' : 'Termine'}`,
    glasses: glassTiles,
    waterText: `${filled} / ${GLASSES} Gläser`,
    mascotMsg: mochiMessages[mIdx % mochiMessages.length],
    nextMsg: 'mochi:next',
  }

  function handleAct(action: string) {
    if (action === 'nav:ruhe') onOpenSos()
    else if (action === 'nav:woche') onNavigate('calendar')
    else if (action === 'water:add') void addGlass()
    else if (action === 'mochi:next') setMIdx((i) => i + 1)
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

      <Abendplan />
    </section>
  )
}

