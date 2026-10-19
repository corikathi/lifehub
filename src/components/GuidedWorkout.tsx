import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'
import { parseSets, type TrainingFile } from '../lib/content'

interface GuidedEntry {
  date: string
  unit: string
  sets: number
  minutes: number
}

// Geführter Kraft-Modus für die Woche: eine Übung nach der anderen, Satz für Satz.
// Die Übungen kommen aus deinem importierten Trainingsplan (Kraft A).
export function GuidedWorkout({ training }: { training: TrainingFile }) {
  const unit = 'Kraft A'
  const exercises = training.einheiten[unit]?.uebungen ?? []
  const [log, setLog] = useKv<GuidedEntry[]>('guidedWorkouts', [])
  const [current, setCurrent] = useState(-1) // -1 = bereit, 0..n-1 = Übung, n = fertig
  const [setsDone, setSetsDone] = useState<number[]>([])
  const [startedAt, setStartedAt] = useState(0)

  const parsed = exercises.map((ex) => parseSets(ex.saetze))
  const finished = current >= exercises.length && exercises.length > 0
  const running = current >= 0 && current < exercises.length
  const totalSets = setsDone.reduce((s, n) => s + n, 0)
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))

  const today = dateKey()
  const weekAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000)
  const weekStart = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`
  const thisWeek = log.filter((e) => e.date >= weekStart).length

  function start() {
    setCurrent(0)
    setSetsDone(exercises.map(() => 0))
    setStartedAt(Date.now())
  }

  async function tap() {
    const target = parsed[current]?.sets ?? 3
    const done = setsDone[current] ?? 0
    if (done < target) {
      const next = [...setsDone]
      next[current] = done + 1
      setSetsDone(next)
      return
    }
    // Übung fertig: zur nächsten
    const nextIndex = current + 1
    setCurrent(nextIndex)
    if (nextIndex >= exercises.length) {
      await setLog([...log, { date: today, unit, sets: totalSets, minutes }])
    }
  }

  function abort() {
    setCurrent(-1)
    setSetsDone([])
  }

  if (!exercises.length) {
    return (
      <div className="card">
        <p className="empty">Importiere deinen Trainingsplan, dann startet der geführte Modus hier.</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="card workout-summary">
        <h2 className="section-heading">Training geschafft</h2>
        <p className="muted">{totalSets} Sätze in {minutes} Minuten.</p>
        <button type="button" className="btn primary" onClick={() => setCurrent(-1)}>Fertig</button>
      </div>
    )
  }

  if (running) {
    const ex = exercises[current]
    const target = parsed[current].sets
    const done = setsDone[current] ?? 0
    return (
      <div className="card workout-run">
        <p className="muted" style={{ margin: 0 }}>Übung {current + 1} von {exercises.length}</p>
        <h2 className="section-heading" style={{ fontSize: 26 }}>{ex.name}</h2>
        <p className="muted" style={{ margin: 0 }}>{ex.tipp}</p>
        <div className="row between" style={{ marginTop: 6 }}>
          <span className="pill">Satz {Math.min(done + 1, target)} von {target}</span>
          <span className="muted">{ex.saetze}</span>
        </div>
        <button type="button" className="btn primary" style={{ marginTop: 6 }} onClick={tap}>
          {done < target ? 'Satz fertig' : current + 1 < exercises.length ? 'Weiter zur nächsten Übung' : 'Training beenden'}
        </button>
        <button type="button" className="btn ghost small" onClick={abort}>Abbrechen</button>
      </div>
    )
  }

  return (
    <div className="card workout-idle">
      <p style={{ fontWeight: 700, margin: 0 }}>{unit}</p>
      <p className="muted" style={{ margin: '4px 0 10px' }}>{exercises.length} Übungen · diese Woche {thisWeek} Einheit{thisWeek === 1 ? '' : 'en'}</p>
      <button type="button" className="btn primary" onClick={start}>Kraft-Training starten</button>
    </div>
  )
}
