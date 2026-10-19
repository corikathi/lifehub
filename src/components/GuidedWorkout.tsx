import { useEffect, useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'
import { incrementFor, parseSets, restSecondsFor, type TrainingFile } from '../lib/content'

interface SetRow {
  w: number
  r: number
}

interface GuidedEntry {
  date: string
  unit: string
  minutes: number
  exercises: Record<string, SetRow[]>
}

// Geführter Kraft-Durchgang: Übung für Übung, Satz für Satz, mit Pause dazwischen.
export function GuidedWorkout({ training }: { training: TrainingFile }) {
  const unit = 'Kraft A'
  const exercises = training.einheiten[unit]?.uebungen ?? []
  const pausen = training.progression.pausen
  const [log, setLog] = useKv<GuidedEntry[]>('guidedWorkouts', [])
  const [current, setCurrent] = useState(-1) // -1 = bereit, 0..n-1 = Übung, n = fertig
  const [rows, setRows] = useState<Record<string, SetRow[]>>({})
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rest, setRest] = useState<number | null>(null)
  const [restTotal, setRestTotal] = useState(0)
  const [startedAt, setStartedAt] = useState(0)

  // Pause zählt herunter, am Ende kurz vibrieren
  useEffect(() => {
    if (rest === null) return
    if (rest <= 0) {
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        // Vibration ist nicht überall verfügbar
      }
      setRest(null)
      return
    }
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000)
    return () => clearTimeout(t)
  }, [rest])

  const running = current >= 0 && current < exercises.length
  const finished = current >= exercises.length && exercises.length > 0
  const today = dateKey()

  // Letztes Ergebnis einer Übung, für das Ziel und den Vergleich
  const lastRows = (name: string): SetRow[] | undefined => {
    for (let i = log.length - 1; i >= 0; i--) {
      const r = log[i].exercises?.[name]
      if (r?.length) return r
    }
    return undefined
  }

  function targetFor(name: string, sets: number, min: number, max: number) {
    const last = lastRows(name)
    if (!last?.length) return { w: 0, r: max, known: false }
    const allHit = last.length >= sets && last.every((s) => s.r >= max)
    if (allHit) return { w: last[0].w + incrementFor(name), r: min, known: true }
    return { w: last[0].w, r: Math.min(max, last[0].r + 1), known: true }
  }

  function start() {
    setCurrent(0)
    setRows({})
    setStartedAt(Date.now())
    setRest(null)
    prefill(0)
  }

  function prefill(index: number) {
    const ex = exercises[index]
    if (!ex) return
    const p = parseSets(ex.saetze)
    const t = targetFor(ex.name, p.sets, p.min, p.max)
    setWeight(t.w ? String(t.w) : '')
    setReps(String(t.r))
  }

  function logSet() {
    const ex = exercises[current]
    if (!ex) return
    const w = Number(weight.replace(',', '.')) || 0
    const r = Number(reps.replace(',', '.')) || 0
    if (!r) return
    const list = [...(rows[ex.name] ?? []), { w, r }]
    setRows({ ...rows, [ex.name]: list })
    const p = parseSets(ex.saetze)
    if (list.length < p.sets) {
      // Pause nach jedem Satz, außer nach dem letzten der Übung
      setRestTotal(restSecondsFor(ex.name, pausen))
      setRest(restSecondsFor(ex.name, pausen))
      setReps(String(r))
    } else {
      // Übung fertig, zur nächsten
      const next = current + 1
      setCurrent(next)
      setRest(null)
      prefill(next)
    }
  }

  async function finish() {
    const entry: GuidedEntry = {
      date: today,
      unit,
      minutes: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      exercises: rows,
    }
    await setLog([...log, entry])
    setCurrent(-1)
    setRows({})
  }

  if (!exercises.length) {
    return (
      <div className="card">
        <p className="empty">Importiere deinen Trainingsplan, dann startet der geführte Modus hier.</p>
      </div>
    )
  }

  if (finished) {
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
    const totalSets = Object.values(rows).reduce((s, list) => s + list.length, 0)
    return (
      <div className="card workout-summary stack" style={{ gap: 8 }}>
        <h2 className="section-heading">Training geschafft</h2>
        <p className="muted">{totalSets} Sätze in {minutes} Minuten.</p>
        {exercises.map((ex) => {
          const now = rows[ex.name] ?? []
          const before = lastRows(ex.name)
          const bestNow = now.reduce((b, s) => (s.w > b.w || (s.w === b.w && s.r > b.r) ? s : b), { w: 0, r: 0 })
          const bestBefore = before?.reduce((b, s) => (s.w > b.w || (s.w === b.w && s.r > b.r) ? s : b), { w: 0, r: 0 })
          let verdict = 'Erstes Mal erfasst'
          if (bestBefore && bestBefore.w) {
            if (bestNow.w > bestBefore.w) verdict = 'Mehr Gewicht als letztes Mal'
            else if (bestNow.w === bestBefore.w && bestNow.r > bestBefore.r) verdict = 'Mehr Wiederholungen als letztes Mal'
            else if (bestNow.w === bestBefore.w && bestNow.r === bestBefore.r) verdict = 'Gleich wie letztes Mal'
            else verdict = 'Etwas weniger als letztes Mal'
          }
          return (
            <div key={ex.name} className="list-item">
              <div className="grow">
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                <p className="muted" style={{ margin: 0 }}>
                  {now.length ? `Bestes: ${bestNow.w} kg × ${bestNow.r}` : 'Nicht gemacht'}
                  {bestBefore && bestBefore.w ? ` · vorher ${bestBefore.w} kg × ${bestBefore.r}` : ''}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: verdict.startsWith('Mehr') ? '#5d6b3d' : '#8d7459' }}>{verdict}</p>
              </div>
            </div>
          )
        })}
        <button type="button" className="btn primary" onClick={finish}>Speichern und fertig</button>
      </div>
    )
  }

  if (running) {
    const ex = exercises[current]
    const p = parseSets(ex.saetze)
    const done = rows[ex.name]?.length ?? 0
    const next = exercises[current + 1]
    return (
      <div className="card workout-run stack" style={{ gap: 8 }}>
        <p className="muted" style={{ margin: 0 }}>Übung {current + 1} von {exercises.length}</p>
        <h2 className="section-heading" style={{ fontSize: 26 }}>{ex.name}</h2>
        <p className="muted" style={{ margin: 0 }}>{ex.tipp}</p>

        {rest !== null ? (
          <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
            <p className="muted" style={{ margin: 0 }}>Pause</p>
            <div className="timer big running">{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</div>
            <p className="muted" style={{ margin: 0 }}>von {restTotal} Sekunden</p>
            <button type="button" className="btn" onClick={() => setRest(null)}>Pause überspringen</button>
          </div>
        ) : (
          <>
            <div className="row between" style={{ marginTop: 4 }}>
              <span className="pill">Satz {Math.min(done + 1, p.sets)} von {p.sets}</span>
              <span className="muted">{ex.saetze}</span>
            </div>
            <div className="set-row">
              <input className="input" inputMode="decimal" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} aria-label="Gewicht in kg" />
              <input className="input" inputMode="numeric" placeholder="Wdh." value={reps} onChange={(e) => setReps(e.target.value)} aria-label="Wiederholungen" />
              <button type="button" className="btn primary" onClick={logSet}>Satz fertig</button>
            </div>
          </>
        )}

        {next && rest !== null && <p className="muted" style={{ margin: 0 }}>Als Nächstes: {next.name}</p>}
        {rest === null && done > 0 && (
          <div className="stack" style={{ gap: 4 }}>
            {(rows[ex.name] ?? []).map((s, i) => (
              <span key={i} className="set-chip">Satz {i + 1}: {s.w} kg × {s.r}</span>
            ))}
          </div>
        )}
        <button type="button" className="btn ghost small" onClick={() => { setCurrent(-1); setRows({}); setRest(null) }}>Abbrechen</button>
      </div>
    )
  }

  return (
    <div className="card workout-idle">
      <p style={{ fontWeight: 700, margin: 0 }}>{unit}</p>
      <p className="muted" style={{ margin: '4px 0 10px' }}>{exercises.length} Übungen · geführt, mit Pause zwischen den Sätzen</p>
      <button type="button" className="btn primary" onClick={start}>Kraft-Training starten</button>
    </div>
  )
}
