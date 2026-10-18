import { useEffect, useState } from 'react'
import { useKv } from '../lib/store'
import { addDays, dateKey, formatDay } from '../lib/dates'

// Ein Eintrag im Heißhunger-Log. Alles lokal und in deinem Konto, nichts wird geteilt.
export interface HungerEntry {
  id: string
  date: string
  time: string
  trigger: string
  what: string
}

export const TRIGGERS = ['Stress', 'Müdigkeit', 'Langeweile', 'Nach dem Training', 'Zu wenig gegessen', 'Anderes']

const WINDOWS = [
  'Vormittag (5–12 Uhr)',
  'Nachmittag (12–17 Uhr)',
  'Früher Abend (17–20 Uhr)',
  'Später Abend (20–23 Uhr)',
  'Nacht (ab 23 Uhr)',
]

export function windowOf(time: string): string {
  const h = Number(time.slice(0, 2))
  if (h >= 5 && h < 12) return WINDOWS[0]
  if (h < 17) return WINDOWS[1]
  if (h < 20) return WINDOWS[2]
  if (h < 23) return WINDOWS[3]
  return WINDOWS[4]
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best: string | undefined
  let bestCount = 0
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v
      bestCount = c
    }
  }
  return best
}

export function Hunger() {
  const today = dateKey()
  const [entries, setEntries] = useKv<HungerEntry[]>('hunger', [])
  const [sleep, setSleep] = useKv<Record<string, number>>('sleep', {})
  const [time, setTime] = useState(nowTime())
  const [trigger, setTrigger] = useState(TRIGGERS[0])
  const [what, setWhat] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [sleepInput, setSleepInput] = useState(String(sleep[today] ?? ''))

  async function save() {
    const entry: HungerEntry = {
      id: `h-${Date.now()}`,
      date: today,
      time,
      trigger,
      what: what.trim(),
    }
    await setEntries([...entries, entry])
    setWhat('')
    setTime(nowTime())
  }

  async function removeEntry(id: string) {
    await setEntries(entries.filter((e) => e.id !== id))
  }

  async function saveSleep() {
    const value = Number(sleepInput.replace(',', '.'))
    if (!value) return
    await setSleep({ ...sleep, [today]: value })
  }

  // Auswertung der letzten 14 Tage
  const since = addDays(today, -13)
  const recent = entries.filter((e) => e.date >= since)
  const topWindow = mostCommon(recent.map((e) => windowOf(e.time)))
  const topTrigger = mostCommon(recent.map((e) => e.trigger))

  // Schlaf an Tagen mit und ohne Heißhunger vergleichen
  const bingeDays = new Set(recent.map((e) => e.date))
  const sleepWith = Object.entries(sleep)
    .filter(([d]) => d >= since && bingeDays.has(d))
    .map(([, h]) => h)
  const sleepWithout = Object.entries(sleep)
    .filter(([d]) => d >= since && !bingeDays.has(d))
    .map(([, h]) => h)
  const avg = (list: number[]) => (list.length ? list.reduce((s, x) => s + x, 0) / list.length : undefined)
  const avgWith = avg(sleepWith)
  const avgWithout = avg(sleepWithout)

  return (
    <div className="stack">
      <div className="card warn">
        <p style={{ fontWeight: 600 }}>Gerade Heißhunger?</p>
        <p>Erst eine Minute innehalten. Danach entscheidest du in Ruhe.</p>
        <button type="button" className="btn small" style={{ marginTop: 8 }} onClick={() => setShowHelp((v) => !v)}>
          {showHelp ? 'Pause schließen' : 'Eine Minute Pause'}
        </button>
        {showHelp && <PausePanel />}
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className="section-title" style={{ margin: 0 }}>Eintrag</div>
        <div className="row">
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Uhrzeit" />
        </div>
        <div className="chips">
          {TRIGGERS.map((t) => (
            <button key={t} type="button" className={`chip ${trigger === t ? 'active' : ''}`} onClick={() => setTrigger(t)}>
              {t}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Was hast du gegessen? (optional)" value={what} onChange={(e) => setWhat(e.target.value)} />
        <button className="btn primary" type="submit">Eintragen</button>
      </form>

      <div className="card">
        <div className="section-title" style={{ margin: '0 0 6px' }}>Auswertung · letzte 14 Tage</div>
        {recent.length === 0 && <p className="empty">Noch keine Einträge. Schon ein paar Tage sammeln, dann zeigt sich ein Muster.</p>}
        {recent.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <p>Einträge: <strong>{recent.length}</strong></p>
            {topWindow && <p>Meist: <strong>{topWindow}</strong></p>}
            {topTrigger && <p>Häufigster Auslöser: <strong>{topTrigger}</strong></p>}
            {avgWith !== undefined && avgWithout !== undefined && (
              <p>
                Schlaf an Tagen mit Heißhunger: <strong>{avgWith.toFixed(1)} h</strong>, ohne: <strong>{avgWithout.toFixed(1)} h</strong>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title" style={{ margin: '0 0 6px' }}>Schlaf letzte Nacht</div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            void saveSleep()
          }}
        >
          <input className="input" inputMode="decimal" placeholder="Stunden, z. B. 6,5" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} />
          <button className="btn" type="submit">Speichern</button>
        </form>
        <p className="muted" style={{ marginTop: 6 }}>Trag die Stunden aus Google Health ein. Dann siehst du den Zusammenhang.</p>
      </div>

      <div className="section-title">Letzte Einträge</div>
      <div className="card">
        {entries.length === 0 && <p className="empty">Noch nichts eingetragen.</p>}
        {[...entries].reverse().slice(0, 12).map((e) => (
          <div className="list-item" key={e.id}>
            <span className="time">{formatDay(e.date, { day: 'numeric', month: 'short' })} {e.time}</span>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{e.trigger}</div>
              {e.what && <p className="muted">{e.what}</p>}
            </div>
            <button type="button" className="btn ghost small danger" aria-label="Eintrag löschen" onClick={() => removeEntry(e.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Eine Minute Pause mit wechselnden Anweisungen
function PausePanel() {
  const [left, setLeft] = useState(60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left])

  const phase = left > 40 ? 'Einatmen … 4 Sekunden' : left > 20 ? 'Ausatmen … 6 Sekunden' : 'Frag dich: Bin ich hungrig oder brauche ich gerade etwas anderes?'

  return (
    <div className="pause-panel">
      <div className="timer">{left} s</div>
      <p style={{ textAlign: 'center' }}>{running ? phase : 'Atme ruhig, während du wartest.'}</p>
      <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
        {!running && left === 60 && (
          <button type="button" className="btn small primary" onClick={() => setRunning(true)}>Starten</button>
        )}
        {running && left > 0 && (
          <button type="button" className="btn small" onClick={() => setRunning(false)}>Pause</button>
        )}
        {left === 0 && <p>Gut gemacht. Nimm dir einen Moment, bevor du entscheidest.</p>}
      </div>
    </div>
  )
}
