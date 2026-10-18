import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'

interface Contact {
  name: string
  number: string
}

interface PanicNote {
  date: string
  time: string
  text: string
}

// Hilfe im Moment: Atmung, Erdung, Notfallnummern und eigene Kontakte.
export function Sos({ onClose }: { onClose: () => void }) {
  const [contacts, setContacts] = useKv<Contact[]>('sosContacts', [])
  const [notes, setNotes] = useKv<PanicNote[]>('panicNotes', [])
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [note, setNote] = useState('')

  async function addContact() {
    if (!name.trim() || !number.trim()) return
    await setContacts([...contacts, { name: name.trim(), number: number.trim() }])
    setName('')
    setNumber('')
  }

  async function addNote() {
    if (!note.trim()) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    await setNotes([...notes, { date: dateKey(), time, text: note.trim() }])
    setNote('')
  }

  return (
    <section className="stack sos">
      <header className="row between">
        <h1 className="title">Hilfe</h1>
        <button type="button" className="btn ghost small" onClick={onClose}>Zurück</button>
      </header>

      <div className="card soft">
        <p style={{ fontWeight: 600 }}>Du musst gerade nichts entscheiden.</p>
        <p className="muted">Atme einfach mit dem Kreis mit.</p>
      </div>

      <div className="card breath-card">
        <div className="breath-circle" aria-hidden="true" />
        <p className="breath-text">Einatmen 4 Sekunden · Ausatmen 6 Sekunden</p>
      </div>

      <div className="card">
        <p style={{ fontWeight: 600 }}>Erdung: 5-4-3-2-1</p>
        <ol className="steps">
          <li>5 Dinge, die du siehst</li>
          <li>4 Dinge, die du spürst</li>
          <li>3 Geräusche, die du hörst</li>
          <li>2 Dinge, die du riechst</li>
          <li>1 Sache, die du schmeckst</li>
        </ol>
      </div>

      <div className="card">
        <p style={{ fontWeight: 600 }}>Notfallnummern</p>
        <div className="stack" style={{ gap: 6, marginTop: 8 }}>
          <a className="btn" href="tel:112">112 · Notruf bei akuter Gefahr</a>
          <a className="btn" href="tel:116123">116 123 · Seelische Gesundheit</a>
          <a className="btn" href="tel:08001110111">0800 111 0 111 · Telefonseelsorge</a>
          <a className="btn" href="tel:08001110222">0800 111 0 222 · Telefonseelsorge</a>
        </div>
      </div>

      <div className="card">
        <p style={{ fontWeight: 600 }}>Meine Kontakte</p>
        {contacts.length === 0 && <p className="empty">Trag eine Person ein, die du in so einem Moment anrufen kannst.</p>}
        {contacts.map((c, i) => (
          <div className="list-item" key={`${c.name}-${i}`}>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <a href={`tel:${c.number.replace(/\s/g, '')}`}>{c.number}</a>
            </div>
            <button type="button" className="btn ghost small danger" aria-label={`${c.name} löschen`} onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <form
          className="form"
          style={{ marginTop: 10 }}
          onSubmit={(e) => {
            e.preventDefault()
            void addContact()
          }}
        >
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Telefonnummer" inputMode="tel" value={number} onChange={(e) => setNumber(e.target.value)} />
          <button className="btn" type="submit">Hinzufügen</button>
        </form>
      </div>

      <div className="card">
        <p style={{ fontWeight: 600 }}>Nach einem Moment festhalten</p>
        <p className="muted">Was war vorher? Das hilft dir später, Muster zu erkennen.</p>
        <form
          className="form"
          style={{ marginTop: 8 }}
          onSubmit={(e) => {
            e.preventDefault()
            void addNote()
          }}
        >
          <textarea className="textarea" placeholder="z. B. nach einem Streit, wenig geschlafen" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn" type="submit" disabled={!note.trim()}>Speichern</button>
        </form>
        {[...notes].reverse().slice(0, 5).map((n, i) => (
          <div className="list-item" key={i}>
            <span className="time">{n.date.slice(5)} {n.time}</span>
            <div className="grow">{n.text}</div>
          </div>
        ))}
      </div>

      <p className="muted" style={{ textAlign: 'center' }}>
        Das ersetzt keine ärztliche Behandlung. Wenn es oft passiert, sprich mit deiner Ärztin oder deinem Arzt.
      </p>
    </section>
  )
}
