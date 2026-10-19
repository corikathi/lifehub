import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useKv } from '../lib/store'
import { addDays, dateKey, formatDay, weekDays } from '../lib/dates'
import { DAYS, defaultSlot, findRecipe, type RezepteFile, type TrainingFile } from '../lib/content'

const DAY_LETTERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Woche im Stil des Prototyps: Wochenstreifen mit Punkten, Termine des Tages und
// der Wochenplan mit Essen und Training pro Tag.
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

  const [content] = useKv<RezepteFile | null>('content.rezepte', null)
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

  const selectedIndex = days.indexOf(selected)
  const selectedName = DAYS[selectedIndex] ? formatDay(selected, { weekday: 'long', day: 'numeric', month: 'long' }) : formatDay(selected)

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
      <header style={{ paddingTop: 6 }}>
        <p className="subtitle" style={{ margin: 0 }}>
          {formatDay(days[0], { day: 'numeric', month: 'long' })} – {formatDay(days[6], { day: 'numeric', month: 'long' })}
        </p>
        <h1 className="title" style={{ margin: '2px 0 0' }}>Deine Woche</h1>
      </header>

      <div className="row between">
        <button type="button" className="btn ghost" onClick={() => setSelected(addDays(selected, -7))} aria-label="Vorwoche">←</button>
        <button type="button" className="btn ghost small" onClick={() => setSelected(today)}>Heute</button>
        <button type="button" className="btn ghost" onClick={() => setSelected(addDays(selected, 7))} aria-label="Nächste Woche">→</button>
      </div>

      <div className="week-strip">
        {days.map((d, i) => {
          const count = weekEvents.filter((e) => e.date === d).length
          const isActive = d === selected
          return (
            <button key={d} type="button" className="week-day" onClick={() => setSelected(d)} aria-pressed={isActive}>
              <span className="week-letter" style={{ fontWeight: d === today ? 800 : 600 }}>{DAY_LETTERS[i]}</span>
              <span className={`week-date ${isActive ? 'today' : ''}`}>{Number(d.slice(8))}</span>
              <span className="week-dot" style={{ background: count ? '#c4703f' : 'transparent' }} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="card day-panel">
        <h2 className="panel-title">{selectedName}</h2>
        {events.length === 0 && <p className="empty">Nichts eingetragen. Ein freier Tag ist auch ein Geschenk. 🌤️</p>}
        {events.map((ev) => (
          <div className="timeline-row" key={ev.id}>
            <span className="timeline-time">{ev.time ?? 'ganzt.'}</span>
            <div className="timeline-event">
              <div style={{ fontWeight: 700 }}>{ev.title}</div>
              {ev.note && <p className="muted" style={{ margin: 0 }}>{ev.note}</p>}
            </div>
            <button
              type="button"
              className="btn ghost small danger"
              aria-label={`${ev.title} löschen`}
              onClick={() => ev.id !== undefined && db.events.delete(ev.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="section-title">Wochenplan</div>
      <div className="card plan-list">
        {DAY_LETTERS.map((label, i) => (
          <div className="plan-row" key={label}>
            <span className="plan-day" style={{ color: i === selectedIndex ? '#5d6b3d' : undefined }}>{label}</span>
            <span className="plan-chip meal">{mealFor(i)}</span>
            <span className="plan-chip training">{trainingFor(i)}</span>
          </div>
        ))}
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          void addEvent()
        }}
      >
        <div className="section-title" style={{ margin: 0 }}>Neuer Termin</div>
        <input className="input" placeholder="Titel, z. B. Zahnarzt" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="row">
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Uhrzeit" />
        </div>
        <input className="input" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!title.trim()}>Termin speichern</button>
      </form>
    </section>
  )
}
