import { useEffect, useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'

// Ruhe-Ecke im Stil des Prototyps: Atmen, Erden, beruhigende Sätze
// und die Notfallnummern. Eigene Kontakte und Notizen bleiben unten erhalten.

interface Contact {
  name: string
  number: string
}

interface PanicNote {
  date: string
  time: string
  text: string
}

type View = 'menu' | 'atmen' | 'erden' | 'saetze'

const GROUNDING: [number, string, string][] = [
  [5, 'Nenne 5 Dinge, die du siehst', 'Schau dich langsam um. Eine Lampe, deine Hände, eine Farbe.'],
  [4, 'Nenne 4 Dinge, die du fühlen kannst', 'Den Stoff deiner Kleidung, den Boden unter den Füßen.'],
  [3, 'Nenne 3 Dinge, die du hörst', 'Geräusche draußen, deinen Atem, ein leises Summen.'],
  [2, 'Nenne 2 Dinge, die du riechst', 'Oder zwei Gerüche, die du magst.'],
  [1, 'Nenne 1 Sache, die du schmeckst', 'Oder nimm einen Schluck Wasser.'],
]

const SENTENCES = [
  'Das ist eine Panikattacke. Sie fühlt sich schlimm an, aber sie ist nicht gefährlich.',
  'Sie geht vorbei. Meistens schon nach wenigen Minuten.',
  'Ich muss gerade nichts tun außer atmen.',
  'Mein Körper schlägt Alarm, obwohl ich sicher bin.',
  'Ich habe das schon einmal geschafft. Ich schaffe es auch jetzt.',
  'Ich darf mich hinsetzen und warten, bis es leiser wird.',
  'Jeder Atemzug bringt mich ein Stück zurück.',
]

// Atmen: 4 Sekunden ein, 2 halten, 6 aus
const BREATH: [string, number, number, string][] = [
  ['Einatmen', 4, 1, 'Durch die Nase, langsam in den Bauch.'],
  ['Halten', 2, 1, 'Ganz kurz halten, ohne Druck.'],
  ['Ausatmen', 6, 0.55, 'Durch den Mund, länger als das Einatmen.'],
]

export function Ruhe({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>('menu')
  const [contacts, setContacts] = useKv<Contact[]>('sosContacts', [])
  const [notes, setNotes] = useKv<PanicNote[]>('panicNotes', [])
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [note, setNote] = useState('')

  // Atmen
  const [breathT, setBreathT] = useState(0)
  const [breathOn, setBreathOn] = useState(false)
  useEffect(() => {
    if (!breathOn) return
    const t = setTimeout(() => setBreathT((x) => x + 1), 1000)
    return () => clearTimeout(t)
  }, [breathOn, breathT])
  const cyc = breathT % 12
  let phase = BREATH[0]
  let remaining = 4
  let acc = 0
  for (const p of BREATH) {
    if (cyc < acc + p[1]) {
      phase = p
      remaining = acc + p[1] - cyc
      break
    }
    acc += p[1]
  }
  const rounds = Math.floor(breathT / 12)

  // Erden
  const [groundStep, setGroundStep] = useState(0)
  const [groundTaps, setGroundTaps] = useState(0)
  const groundDone = groundStep >= GROUNDING.length

  // Sätze
  const [sIdx, setSIdx] = useState(0)

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

  function back() {
    setBreathOn(false)
    setView('menu')
  }

  return (
    <section className="ruhe">
      <div className="row between" style={{ marginBottom: 6 }}>
        {view === 'menu' ? (
          <button type="button" className="btn ghost small" onClick={onClose}>← Zurück</button>
        ) : (
          <button type="button" className="btn ghost small" onClick={back}>← Übersicht</button>
        )}
      </div>

      {view === 'menu' && (
        <div className="stack" style={{ gap: 16 }}>
          <div>
            <h1 className="title" style={{ margin: 0 }}>Du bist sicher.</h1>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              Das Gefühl ist stark, aber es geht vorbei. Such dir eine Sache aus, wir machen es zusammen.
            </p>
          </div>

          <button type="button" className="ruhe-main" onClick={() => setView('atmen')}>
            <span className="ruhe-dot" aria-hidden="true" />
            <span>
              <span className="ruhe-main-title">Atmen</span>
              <span className="ruhe-main-sub">4 ein · 2 halten · 6 aus</span>
            </span>
          </button>

          <div className="ruhe-tiles">
            <button type="button" className="ruhe-tile" onClick={() => setView('erden')}>
              <span className="ruhe-tile-name">5-4-3-2-1</span>
              <span className="ruhe-tile-sub">Zurück ins Hier und Jetzt</span>
            </button>
            <button type="button" className="ruhe-tile" onClick={() => setView('saetze')}>
              <span className="ruhe-tile-name">Beruhigende Sätze</span>
              <span className="ruhe-tile-sub">Zum langsamen Lesen</span>
            </button>
          </div>

          <div className="card soft">
            <p style={{ fontWeight: 700, margin: 0 }}>Schnell etwas Körperliches</p>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Kaltes Wasser über die Handgelenke laufen lassen. Beide Füße fest auf den Boden drücken. Langsam einen Schluck Wasser trinken.
            </p>
          </div>

          <div className="card">
            <p style={{ fontWeight: 700, margin: 0 }}>Wenn du jemanden brauchst</p>
            <div className="stack" style={{ gap: 8, marginTop: 10 }}>
              <a className="ruhe-call" href="tel:08001110111">
                <span>
                  <span style={{ fontWeight: 700 }}>Telefonseelsorge</span>
                  <span className="muted" style={{ display: 'block' }}>kostenlos, rund um die Uhr</span>
                </span>
                <span>0800 111 0 111</span>
              </a>
              <a className="ruhe-call" href="tel:112">
                <span style={{ fontWeight: 700 }}>Notruf</span>
                <span>112</span>
              </a>
              <a className="ruhe-call" href="tel:116123">
                <span style={{ fontWeight: 700 }}>Seelische Gesundheit</span>
                <span>116 123</span>
              </a>
            </div>
          </div>

          <div className="card">
            <p style={{ fontWeight: 700, margin: 0 }}>Meine Kontakte</p>
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
            <p style={{ fontWeight: 700, margin: 0 }}>Nach einem Moment festhalten</p>
            <p className="muted" style={{ margin: '4px 0 0' }}>Was war vorher? Das hilft dir später, Muster zu erkennen.</p>
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
        </div>
      )}

      {view === 'atmen' && (
        <div className="stack" style={{ alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <h1 className="title" style={{ margin: 0 }}>{breathT === 0 ? 'Bereit?' : phase[0]}</h1>
          <div className="breath-stage">
            <div
              className="breath-orb"
              style={{
                transform: `scale(${breathT === 0 ? 0.55 : phase[2]})`,
                transitionDuration: breathOn ? `${phase[1]}s` : '0.6s',
              }}
            />
            <span className="breath-count">{breathOn ? remaining : ''}</span>
          </div>
          <p className="muted">{breathT === 0 ? 'Folge dem Kreis. Er wird groß beim Einatmen und klein beim Ausatmen.' : phase[3]}</p>
          <button type="button" className="btn primary" onClick={() => setBreathOn((v) => !v)}>
            {breathOn ? 'Pause' : breathT > 0 ? 'Weiter atmen' : 'Starten'}
          </button>
          <span className="muted">{rounds > 0 ? `${rounds} ${rounds === 1 ? 'Runde' : 'Runden'} geschafft` : 'Schon 3–5 Runden helfen oft.'}</span>
        </div>
      )}

      {view === 'erden' && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="progress-dots">
            {GROUNDING.map((_, i) => (
              <span key={i} className="progress-dot" style={{ background: i < groundStep ? '#7b6b9c' : i === groundStep ? '#b9a9d4' : '#ddd2ea' }} />
            ))}
          </div>
          {!groundDone ? (
            <>
              <div>
                <p className="muted">Schritt {groundStep + 1} von 5</p>
                <h1 className="title" style={{ margin: 0 }}>{GROUNDING[groundStep][1]}</h1>
                <p className="muted">{GROUNDING[groundStep][2]}</p>
              </div>
              <div className="ground-dots">
                {Array.from({ length: GROUNDING[groundStep][0] }, (_, i) => {
                  const filled = i < groundTaps
                  return (
                    <button
                      key={i}
                      type="button"
                      className="ground-dot"
                      style={{ background: filled ? '#7b6b9c' : '#fffaf0', color: '#fffaf0' }}
                      onClick={() => {
                        if (i !== groundTaps) return
                        const n = groundTaps + 1
                        if (n >= GROUNDING[groundStep][0]) {
                          setTimeout(() => {
                            setGroundStep((s) => s + 1)
                            setGroundTaps(0)
                          }, 500)
                        }
                        setGroundTaps(n)
                      }}
                    >
                      {filled ? i + 1 : ''}
                    </button>
                  )
                })}
              </div>
              <p className="muted" style={{ textAlign: 'center' }}>Tippe für jede Sache einen Kreis an.</p>
            </>
          ) : (
            <div className="stack" style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
              <h1 className="title" style={{ margin: 0 }}>Gut gemacht.</h1>
              <p className="muted">Du bist hier, in diesem Moment. Atme noch einmal langsam aus.</p>
              <button type="button" className="btn" onClick={() => { setGroundStep(0); setGroundTaps(0) }}>Noch einmal</button>
            </div>
          )}
        </div>
      )}

      {view === 'saetze' && (
        <div className="stack" style={{ gap: 16 }}>
          <p className="muted">Lies den Satz langsam, gern auch laut.</p>
          <p className="sentence">{SENTENCES[sIdx % SENTENCES.length]}</p>
          <div className="progress-dots">
            {SENTENCES.map((_, i) => (
              <span key={i} className="progress-dot" style={{ background: i === sIdx % SENTENCES.length ? '#7b6b9c' : '#ddd2ea' }} />
            ))}
          </div>
          <button type="button" className="btn primary" onClick={() => setSIdx((i) => i + 1)}>Nächster Satz</button>
        </div>
      )}

    </section>
  )
}
