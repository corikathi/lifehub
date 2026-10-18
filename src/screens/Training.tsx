import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Workout, type WorkoutPlan } from '../db'
import { dateKey, formatDay } from '../lib/dates'

export function Training() {
  const active = useLiveQuery(
    () => db.workouts.filter((w) => w.finishedAt === undefined).first(),
    [],
    undefined,
  )

  if (active) return <ActiveWorkout workout={active} />
  return <Overview />
}

// ---------- Übersicht: Pläne & Verlauf ----------

function Overview() {
  const plans = useLiveQuery(() => db.workoutPlans.toArray(), [], [])
  const history = useLiveQuery(
    () => db.workouts.filter((w) => w.finishedAt !== undefined).reverse().limit(5).toArray(),
    [],
    [],
  )
  const [name, setName] = useState('')
  const [exercisesText, setExercisesText] = useState('')

  async function createPlan() {
    const exercises = exercisesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (!name.trim()) return
    await db.workoutPlans.add({ name: name.trim(), exercises })
    setName('')
    setExercisesText('')
  }

  async function startWorkout(plan?: WorkoutPlan) {
    const workout: Workout = {
      date: dateKey(),
      name: plan?.name ?? 'Freies Training',
      planId: plan?.id,
      startedAt: Date.now(),
    }
    await db.workouts.add(workout)
  }

  return (
    <section className="stack">
      <header>
        <h1 className="title">Training</h1>
        <p className="subtitle">Ein Schritt nach dem anderen. 💪</p>
      </header>

      <button type="button" className="btn primary" onClick={() => startWorkout()}>
        Freies Training starten
      </button>

      <div className="section-title">Pläne</div>
      {plans.length === 0 && <p className="empty">Noch kein Plan. Lege unten deinen ersten an, z. B. „Ganzkörper A“.</p>}
      {plans.map((p) => (
        <div className="card" key={p.id}>
          <div className="row between">
            <div>
              <p style={{ fontWeight: 600 }}>{p.name}</p>
              <p className="muted">{p.exercises.length} Übungen</p>
            </div>
            <div className="row">
              <button type="button" className="btn small primary" onClick={() => startWorkout(p)}>Start</button>
              <button
                type="button"
                className="btn ghost small danger"
                aria-label={`${p.name} löschen`}
                onClick={() => p.id !== undefined && db.workoutPlans.delete(p.id)}
              >
                ×
              </button>
            </div>
          </div>
          {p.exercises.length > 0 && (
            <p className="muted" style={{ marginTop: 8 }}>{p.exercises.join(' · ')}</p>
          )}
        </div>
      ))}

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          createPlan()
        }}
      >
        <div className="section-title" style={{ margin: 0 }}>Neuer Plan</div>
        <input className="input" placeholder="Name, z. B. Ganzkörper A" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="textarea"
          placeholder={'Eine Übung pro Zeile, z. B.\nKniebeuge\nBankdrücken\nRudern'}
          value={exercisesText}
          onChange={(e) => setExercisesText(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={!name.trim()}>Plan speichern</button>
      </form>

      {history.length > 0 && (
        <>
          <div className="section-title">Zuletzt</div>
          <div className="card">
            {history.map((w) => (
              <div className="list-item" key={w.id}>
                <span className="time">{formatDay(w.date, { day: 'numeric', month: 'short' })}</span>
                <div className="grow">{w.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// ---------- Aktives Workout ----------

function ActiveWorkout({ workout }: { workout: Workout }) {
  const plan = useLiveQuery(
    () => (workout.planId !== undefined ? db.workoutPlans.get(workout.planId) : undefined),
    [workout.planId],
    undefined,
  )
  const sets = useLiveQuery(
    () => db.workoutSets.where('workoutId').equals(workout.id!).toArray(),
    [workout.id],
    [],
  )
  const [extra, setExtra] = useState<string[]>([])
  const [newExercise, setNewExercise] = useState('')

  const setNames = sets.map((s) => s.exercise)
  const exercises = Array.from(new Set([...(plan?.exercises ?? []), ...extra, ...setNames]))

  function addExercise() {
    const trimmed = newExercise.trim()
    if (!trimmed || exercises.includes(trimmed)) return
    setExtra([...extra, trimmed])
    setNewExercise('')
  }

  async function finish() {
    await db.workouts.update(workout.id!, { finishedAt: Date.now() })
  }

  async function discard() {
    if (!window.confirm('Training verwerfen? Alle Sätze dieses Workouts gehen verloren.')) return
    await db.workoutSets.where('workoutId').equals(workout.id!).delete()
    await db.workouts.delete(workout.id!)
  }

  const minutes = Math.max(1, Math.round((Date.now() - workout.startedAt) / 60000))

  return (
    <section className="stack">
      <header className="row between">
        <div>
          <h1 className="title" style={{ fontSize: 24 }}>{workout.name}</h1>
          <p className="subtitle">{minutes} Min. · {sets.length} Sätze</p>
        </div>
        <button type="button" className="btn ghost small danger" onClick={discard}>Verwerfen</button>
      </header>

      <RestTimer />

      {exercises.length === 0 && <p className="empty">Füge unten eine Übung hinzu, dann geht es los.</p>}
      {exercises.map((ex) => (
        <ExerciseBlock key={ex} exercise={ex} workoutId={workout.id!} sets={sets.filter((s) => s.exercise === ex)} />
      ))}

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          addExercise()
        }}
      >
        <input className="input" placeholder="Übung hinzufügen…" value={newExercise} onChange={(e) => setNewExercise(e.target.value)} />
        <button className="btn" type="submit">+</button>
      </form>

      <button type="button" className="btn primary" onClick={finish}>Training beenden 🎉</button>
    </section>
  )
}

function ExerciseBlock({
  exercise,
  workoutId,
  sets,
}: {
  exercise: string
  workoutId: number
  sets: { id?: number; weight: number; reps: number }[]
}) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const history = useLiveQuery(
    () => db.workoutSets.where('exercise').equals(exercise).sortBy('createdAt'),
    [exercise],
    [],
  )
  const last = history.at(-1)

  async function addSet() {
    const w = Number(weight || last?.weight || 0)
    const r = Number(reps || last?.reps || 0)
    if (!r) return
    await db.workoutSets.add({ workoutId, exercise, weight: w, reps: r, createdAt: Date.now() })
    setReps('')
  }

  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <p style={{ fontWeight: 600 }}>{exercise}</p>
        {last && <span className="muted">Letzte Mal: {last.weight} kg × {last.reps}</span>}
      </div>

      <div className="stack" style={{ gap: 6 }}>
        {sets.map((s, i) => (
          <div className="row between" key={s.id}>
            <span className="set-chip">Satz {i + 1}: {s.weight} kg × {s.reps}</span>
            <button
              type="button"
              className="btn ghost small danger"
              aria-label={`Satz ${i + 1} löschen`}
              onClick={() => s.id !== undefined && db.workoutSets.delete(s.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <form
        className="set-row"
        style={{ marginTop: 10 }}
        onSubmit={(e) => {
          e.preventDefault()
          addSet()
        }}
      >
        <input
          className="input"
          type="number"
          inputMode="decimal"
          placeholder={last ? String(last.weight) : 'kg'}
          aria-label="Gewicht in kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          className="input"
          type="number"
          inputMode="numeric"
          placeholder={last ? String(last.reps) : 'Wdh.'}
          aria-label="Wiederholungen"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <button className="btn primary" type="submit">+ Satz</button>
      </form>
    </div>
  )
}

// ---------- Pausen-Timer ----------

const REST_SECONDS = 90

function RestTimer() {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    if (left === null) return
    if (left <= 0) {
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        // Vibration ist nicht überall verfügbar
      }
      setLeft(null)
      return
    }
    const t = setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000)
    return () => clearTimeout(t)
  }, [left])

  const running = left !== null
  const value = left ?? REST_SECONDS
  const mm = String(Math.floor(value / 60))
  const ss = String(value % 60).padStart(2, '0')

  return (
    <div className="card soft">
      <p className="muted" style={{ textAlign: 'center' }}>Pause</p>
      <div className={`timer ${running ? 'running' : ''}`} aria-live="off">{mm}:{ss}</div>
      <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
        {running ? (
          <button type="button" className="btn small" onClick={() => setLeft(null)}>Stopp</button>
        ) : (
          <button type="button" className="btn small primary" onClick={() => setLeft(REST_SECONDS)}>
            {REST_SECONDS} Sek. starten
          </button>
        )}
      </div>
    </div>
  )
}
