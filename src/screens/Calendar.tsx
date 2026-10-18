import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { addDays, dateKey, formatDay, weekDays } from '../lib/dates'

export function Calendar() {
  const today = dateKey()
  const [selected, setSelected] = useState(today)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

  const days = weekDays(selected)
  const events = useLiveQuery(
    () => db.events.where('date').equals(selected).sortBy('time'),
    [selected],
    [],
  )
  const weekEvents = useLiveQuery(
    () => db.events.where('date').between(days[0], days[6], true, true).toArray(),
    [days[0], days[6]],
    [],
  )

  const dayLetters = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

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
    <section className="stack">
      <header>
        <h1 className="title">Kalender</h1>
        <p className="subtitle">{formatDay(selected)}</p>
      </header>

      <div className="row between">
        <button type="button" className="btn ghost" onClick={() => setSelected(addDays(selected, -7))} aria-label="Vorwoche">←</button>
        <button type="button" className="btn ghost small" onClick={() => setSelected(today)}>Heute</button>
        <button type="button" className="btn ghost" onClick={() => setSelected(addDays(selected, 7))} aria-label="Nächste Woche">→</button>
      </div>

      <div className="week">
        {days.map((d, i) => {
          const count = weekEvents.filter((e) => e.date === d).length
          const isActive = d === selected
          return (
            <button
              key={d}
              type="button"
              className={`day ${isActive ? 'active' : ''} ${d === today ? 'today' : ''}`}
              onClick={() => setSelected(d)}
              aria-pressed={isActive}
            >
              <small>{dayLetters[i]}</small>
              <strong>{Number(d.slice(8))}</strong>
              <span className="dot" style={{ opacity: count ? 1 : 0 }} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="card">
        <div className="section-title" style={{ margin: '0 0 6px' }}>Termine</div>
        {events.length === 0 && <p className="empty">Nichts eingetragen. Ein freier Tag ist auch ein Geschenk. 🌤️</p>}
        {events.map((ev) => (
          <div className="list-item" key={ev.id}>
            <span className="time">{ev.time ?? 'ganzt.'}</span>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{ev.title}</div>
              {ev.note && <p className="muted">{ev.note}</p>}
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

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          addEvent()
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
