import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'
import { addDays, dateKey, formatDay, weekDays } from '../lib/dates'
import { DAYS, defaultSlot, findRecipe, type TrainingFile } from '../lib/content'
import { WOCHE } from '../prototype/woche'
import { PrototypeScreen } from '../components/PrototypeScreen'

const DAY_LETTERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Woche 1:1 aus dem Prototyp. Termine, Essen und Training kommen aus unseren Daten.
export function Calendar() {
  const today = dateKey()
  const [selected, setSelected] = useState(today)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

  const days = weekDays(selected)
  const monday = days[0]
  const events = useLiveQuery(() => db.events.where('date').equals(selected).sortBy('time'), [selected], [])
  const weekEvents = useLiveQuery(
    () => db.events.where('date').between(days[0], days[6], true, true).toArray(),
    [days[0], days[6]],
    [],
  )

  const content = useRecipes()
  const [trainingContent] = useKv<TrainingFile | null>('content.training', null)
  const [mealsState] = useKv<{ weeks: Record<string, string[]> }>('meals', { weeks: {} })
  const [trainingWeeks] = useKv<Record<string, { plan: string[] }>>('trainingWeeks', {})

  const mealFor = (i: number) => {
    const slot = mealsState.weeks[monday]?.[i] ?? defaultSlot(monday, i)
    if (slot.startsWith('custom:')) return slot.slice(7)
    return findRecipe(content?.rezepte ?? [], slot)?.titel ?? 'Noch nichts geplant'
  }
  const trainingFor = (i: number) =>
    trainingWeeks[monday]?.plan?.[i] ?? trainingContent?.wochenplan_standard[i]?.split(': ')[1] ?? '–'

  const ctx = {
    rangeText: `${formatDay(days[0], { day: 'numeric', month: 'long' })} – ${formatDay(days[6], { day: 'numeric', month: 'long' })}`,
    selDayName: formatDay(selected, { weekday: 'long', day: 'numeric', month: 'long' }),
    days: days.map((d, i) => {
      const isSel = d === selected
      const hasEvents = weekEvents.some((e) => e.date === d)
      return {
        label: DAY_LETTERS[i],
        date: Number(d.slice(8)),
        weight: d === today ? 800 : 600,
        bg: isSel ? '#8fa35a' : '#efe2c9',
        dot: hasEvents ? '#c4703f' : 'transparent',
        go: `day:${d}`,
      }
    }),
    events: events.map((ev) => ({
      time: ev.time ?? 'ganzt.',
      title: ev.title,
      sub: ev.note ?? '',
      bg: '#f7e2b5',
      ink: '#6b4a1e',
    })),
    plan: DAY_LETTERS.map((label, i) => ({
      day: label,
      dayInk: i === days.indexOf(today) ? '#5d6b3d' : '#4a3828',
      meal: mealFor(i),
      trBg: '#dce8ea',
      trInk: '#3f5a66',
      training: trainingFor(i),
    })),
  }

  function handleAct(action: string) {
    if (action.startsWith('day:')) setSelected(action.slice(4))
  }

  async function addEvent() {
    const trimmed = title.trim()
    if (!trimmed) return
    await db.events.add({
      date: selected,
      title: trimmed,
      time: time || undefined,
      note: note.trim() || undefined,
    })
    setTitle('')
    setTime('')
    setNote('')
  }

  return (
    <section className="stack" style={{ gap: 18 }}>
      <PrototypeScreen template={WOCHE} ctx={ctx} onAct={handleAct} />

      <div className="row between">
        <button type="button" className="btn ghost" onClick={() => setSelected(addDays(selected, -7))} aria-label="Vorwoche">←</button>
        <button type="button" className="btn ghost small" onClick={() => setSelected(today)}>Heute</button>
        <button type="button" className="btn ghost" onClick={() => setSelected(addDays(selected, 7))} aria-label="Nächste Woche">→</button>
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          void addEvent()
        }}
      >
        <div className="section-title" style={{ margin: 0 }}>Neuer Termin am {DAYS[days.indexOf(selected)] ?? ''}</div>
        <input className="input" placeholder="Titel, z. B. Zahnarzt" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Uhrzeit" />
        <input className="input" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!title.trim()}>Termin speichern</button>
      </form>
    </section>
  )
}
