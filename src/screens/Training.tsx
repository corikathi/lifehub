import { useEffect, useState } from 'react'
import { useKv } from '../lib/store'
import { addDays, dateKey, formatDay, weekDays } from '../lib/dates'
import {
  DAYS,
  groupKeyFor,
  incrementFor,
  parseSets,
  restSecondsFor,
  type Anleitung,
  type TrainingFile,
} from '../lib/content'
import { Ride } from './Ride'
import { GuidedWorkout } from '../components/GuidedWorkout'

type Section = 'plan' | 'kraft' | 'rad' | 'verlauf'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'kraft', label: 'Kraft' },
  { id: 'rad', label: 'Rad' },
  { id: 'verlauf', label: 'Verlauf' },
]

export interface SetRow {
  w: number
  r: number
}

interface WeekPlan {
  plan: string[] // Eintrag pro Wochentag, z. B. "Kraft A" oder "Pause"
  done: boolean[]
}

interface WorkoutDraft {
  unit: string
  date: string
  sets: Record<string, SetRow[]> // Anzeigename -> geloggte Sätze
  subs: Record<string, string> // Original -> Alternative (Gerät besetzt)
}

export interface WorkoutEntry {
  id: string
  date: string
  unit: string
  sets: Record<string, SetRow[]>
  finishedAt: number
}

export function Training() {
  const [content] = useKv<TrainingFile | null>('content.training', null)
  // Abschnitt aus dem Heute-Tab übernehmen (z. B. Rad), danach wieder zurücksetzen
  const [section, setSection] = useState<Section>(() => {
    try {
      const saved = localStorage.getItem('lifehub.trainingSection')
      localStorage.removeItem('lifehub.trainingSection')
      return saved === 'rad' ? 'rad' : 'plan'
    } catch {
      return 'plan'
    }
  })
  const [unit, setUnit] = useState('Kraft A')

  if (!content) {
    return (
      <section className="stack">
        <h1 className="title">Training</h1>
        <div className="card">
          <p className="muted">Noch keine Trainingsdaten geladen. Importiere `training.json` im Tab „Mehr“.</p>
        </div>
      </section>
    )
  }

  function startUnit(name: string) {
    setUnit(name)
    setSection('kraft')
  }

  return (
    <section className="stack">
      <header>
        <h1 className="title">Training</h1>
        <p className="subtitle">Ein Schritt nach dem anderen. 💪</p>
      </header>

      <GuidedWorkout training={content} />

      <div className="segmented" role="tablist">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" className={section === s.id ? 'active' : ''} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'plan' && <WeekPlanView content={content} onStart={startUnit} />}
      {section === 'kraft' && <Strength content={content} unit={unit} setUnit={setUnit} />}
      {section === 'rad' && <Ride content={content} />}
      {section === 'verlauf' && <History />}
    </section>
  )
}

// ---------- Wochenplan ----------

function WeekPlanView({ content, onStart }: { content: TrainingFile; onStart: (unit: string) => void }) {
  const today = dateKey()
  const monday = addDays(today, -((new Date(`${today}T12:00:00`).getDay() + 6) % 7))
  const [weeks, setWeeks] = useKv<Record<string, WeekPlan>>('trainingWeeks', {})
  const days = weekDays(monday)
  const defaults = content.wochenplan_standard.map((line) => line.split(': ')[1] ?? line)
  const week: WeekPlan = weeks[monday] ?? { plan: defaults, done: Array(7).fill(false) }
  const todayIndex = days.indexOf(today)

  async function save(next: WeekPlan) {
    await setWeeks({ ...weeks, [monday]: next })
  }

  function swap(i: number, j: number) {
    const plan = [...week.plan]
    const done = [...week.done]
    ;[plan[i], plan[j]] = [plan[j], plan[i]]
    ;[done[i], done[j]] = [done[j], done[i]]
    save({ plan, done })
  }

  function toggleDone(i: number) {
    const done = [...week.done]
    done[i] = !done[i]
    save({ ...week, done })
  }

  const isStrength = (label: string) => label.startsWith('Kraft')
  const consecutive = week.plan.some((label, i) => i < 6 && isStrength(label) && isStrength(week.plan[i + 1]))

  return (
    <div className="stack">
      <p className="muted">Woche ab {formatDay(monday, { day: 'numeric', month: 'short' })}</p>

      {consecutive && (
        <div className="card warn">
          <p>Zwei Krafttage liegen direkt hintereinander. Für Erholung besser einen Pausentag dazwischen.</p>
        </div>
      )}

      {days.map((d, i) => {
        const label = week.plan[i]
        return (
          <div key={d} className={`card day-card ${i === todayIndex ? 'today-card' : ''}`}>
            <div className="row between">
              <label className="check-row" style={{ margin: 0 }}>
                <input type="checkbox" checked={week.done[i]} onChange={() => toggleDone(i)} />
                <span className={week.done[i] ? 'done-text' : ''}>
                  <strong>{DAYS[i]}</strong> · {label}
                </span>
              </label>
              {isStrength(label) && (
                <button type="button" className="btn small primary" onClick={() => onStart(label)}>Start</button>
              )}
            </div>
            <details style={{ marginTop: 8 }}>
              <summary className="muted">Verschieben</summary>
              <select
                className="select"
                style={{ marginTop: 8 }}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value !== '') swap(i, Number(e.target.value))
                }}
              >
                <option value="">Tauschen mit…</option>
                {DAYS.map((name, j) => (j !== i ? <option key={name} value={j}>{name}</option> : null))}
              </select>
            </details>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Kraft A/B/C mit Gym-Modus ----------

function Strength({
  content,
  unit,
  setUnit,
}: {
  content: TrainingFile
  unit: string
  setUnit: (u: string) => void
}) {
  const [draft, setDraft] = useKv<WorkoutDraft | null>('workoutDraft', null)
  const [log, setLog] = useKv<WorkoutEntry[]>('workoutLog', [])
  const units = Object.keys(content.einheiten)

  const active = draft && draft.unit === unit ? draft : null

  async function begin() {
    setDraft({ unit, date: dateKey(), sets: {}, subs: {} })
  }

  async function finish(d: WorkoutDraft) {
    const entry: WorkoutEntry = {
      id: `w-${Date.now()}`,
      date: d.date,
      unit: d.unit,
      sets: d.sets,
      finishedAt: Date.now(),
    }
    await setLog([...log, entry])
    await setDraft(null)
  }

  return (
    <div className="stack">
      <div className="segmented" role="tablist">
        {units.map((u) => (
          <button key={u} type="button" className={unit === u ? 'active' : ''} onClick={() => setUnit(u)}>{u}</button>
        ))}
      </div>

      <div className="card soft">
        <p style={{ fontWeight: 600 }}>{content.einheiten[unit].tag} · {content.einheiten[unit].dauer}</p>
        <p className="muted">{content.progression.regel}</p>
      </div>

      {!active && draft && (
        <div className="card warn">
          <p>Du hast ein offenes Training ({draft.unit}). Schließe es zuerst ab oder verwirf es.</p>
          <div className="row" style={{ marginTop: 8 }}>
            <button type="button" className="btn small" onClick={() => setUnit(draft.unit)}>Zu {draft.unit}</button>
          </div>
        </div>
      )}
      {!active && !draft && (
        <button type="button" className="btn primary" onClick={begin}>{unit} starten</button>
      )}

      {active && <ActiveSession content={content} draft={active} setDraft={setDraft} log={log} onFinish={finish} />}
    </div>
  )
}

function ActiveSession({
  content,
  draft,
  setDraft,
  log,
  onFinish,
}: {
  content: TrainingFile
  draft: WorkoutDraft
  setDraft: (d: WorkoutDraft | null) => Promise<void>
  log: WorkoutEntry[]
  onFinish: (d: WorkoutDraft) => Promise<void>
}) {
  const unitDef = content.einheiten[draft.unit]
  const [timer, setTimer] = useState<{ seconds: number; key: number }>({ seconds: 0, key: 0 })

  const rowsFor = (name: string) => draft.sets[name] ?? []
  const lastRowsFor = (name: string): SetRow[] | undefined => {
    for (let i = log.length - 1; i >= 0; i--) {
      const rows = log[i].sets[name]
      if (rows?.length) return rows
    }
    return undefined
  }

  async function logSet(name: string, w: number, r: number, seconds: number) {
    const current = draft.sets[name] ?? []
    await setDraft({ ...draft, sets: { ...draft.sets, [name]: [...current, { w, r }] } })
    setTimer((t) => ({ seconds, key: t.key + 1 }))
  }

  async function removeSet(name: string, index: number) {
    const current = (draft.sets[name] ?? []).filter((_, i) => i !== index)
    await setDraft({ ...draft, sets: { ...draft.sets, [name]: current } })
  }

  async function substitute(orig: string, alt: string | null) {
    const subs = { ...draft.subs }
    if (alt) subs[orig] = alt
    else delete subs[orig]
    await setDraft({ ...draft, subs })
  }

  const exercises = unitDef.uebungen.map((ex) => {
    const name = draft.subs[ex.name] ?? ex.name
    const planned = parseSets(ex.saetze)
    const done = rowsFor(name).length >= planned.sets
    return { ex, name, planned, done }
  })
  const allDone = exercises.every((e) => e.done)

  return (
    <div className="stack">
      <RestTimer seconds={timer.seconds} runKey={timer.key} />

      {allDone && (
        <div className="card celebrate">
          <p className="celebrate-title">🎉 Geschafft!</p>
          <p className="muted">Alle Übungen von {draft.unit} sind erledigt. Stark.</p>
          <button type="button" className="btn primary" onClick={() => onFinish(draft)}>Training abschließen</button>
        </div>
      )}

      {exercises.map(({ ex, name, planned, done }) => {
        const rows = rowsFor(name)
        const last = lastRowsFor(name)
        const target = targetFor(name, planned, last)
        const group = groupKeyFor(ex.name)
        const anleitung = group ? content.anleitungen[group] : undefined
        const alts = group ? content.alternativen_bei_besetztem_geraet[group] ?? [] : []
        const rest = restSecondsFor(name, content.progression.pausen)

        return (
          <ExerciseCard
            key={ex.name}
            name={name}
            tip={ex.tipp}
            saetze={ex.saetze}
            done={done}
            rows={rows}
            planned={planned.sets}
            target={target}
            lastText={last?.length ? `Letzte Mal: ${last[0].w} kg × ${last[0].r}` : undefined}
            anleitung={anleitung}
            alts={alts}
            isSubstituted={!!draft.subs[ex.name]}
            onSubstitute={(alt) => substitute(ex.name, alt)}
            onLog={(w, r) => logSet(name, w, r, rest)}
            onRemove={(i) => removeSet(name, i)}
          />
        )
      })}

      <div className="row between">
        <button type="button" className="btn ghost danger" onClick={() => setDraft(null)}>Abbrechen</button>
        {!allDone && <button type="button" className="btn" onClick={() => onFinish(draft)}>Vorzeitig beenden</button>}
      </div>
    </div>
  )
}

function targetFor(name: string, planned: { sets: number; min: number; max: number }, last: SetRow[] | undefined) {
  if (!last?.length) return { w: 0, r: planned.max, known: false }
  const allHit = last.length >= planned.sets && last.every((s) => s.r >= planned.max)
  const lastW = last[0].w
  if (allHit) return { w: lastW + incrementFor(name), r: planned.min, known: true }
  return { w: lastW, r: Math.min(planned.max, last[0].r + 1), known: true }
}

function ExerciseCard({
  name,
  tip,
  saetze,
  done,
  rows,
  planned,
  target,
  lastText,
  anleitung,
  alts,
  isSubstituted,
  onSubstitute,
  onLog,
  onRemove,
}: {
  name: string
  tip: string
  saetze: string
  done: boolean
  rows: SetRow[]
  planned: number
  target: { w: number; r: number; known: boolean }
  lastText?: string
  anleitung?: Anleitung
  alts: string[]
  isSubstituted: boolean
  onSubstitute: (alt: string | null) => void
  onLog: (w: number, r: number) => void
  onRemove: (index: number) => void
}) {
  const [w, setW] = useState('')
  const [r, setR] = useState('')
  const [showAlts, setShowAlts] = useState(false)

  return (
    <div className={`card ${done ? 'done-card' : ''}`}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontWeight: 600 }}>{name} {done && '✓'}</p>
          <p className="muted">{saetze} · {rows.length}/{planned} Sätze</p>
        </div>
        {target.known ? <span className="pill">Ziel {target.w} kg × {target.r}</span> : <span className="pill terra">Erstes Mal</span>}
      </div>
      {lastText && <p className="muted" style={{ marginTop: 4 }}>{lastText}</p>}
      {tip && <p className="hint">💡 {tip}</p>}

      <div className="stack" style={{ gap: 6, marginTop: 8 }}>
        {rows.map((row, i) => (
          <div className="row between" key={i}>
            <span className="set-chip">Satz {i + 1}: {row.w} kg × {row.r}</span>
            <button type="button" className="btn ghost small danger" aria-label={`Satz ${i + 1} löschen`} onClick={() => onRemove(i)}>×</button>
          </div>
        ))}
      </div>

      {!done && (
        <form
          className="set-row"
          style={{ marginTop: 10 }}
          onSubmit={(e) => {
            e.preventDefault()
            const weight = Number(w || target.w)
            const reps = Number(r || target.r)
            if (!reps) return
            onLog(weight, reps)
            setR('')
          }}
        >
          <input className="input" type="number" inputMode="decimal" placeholder={String(target.w)} aria-label="Gewicht in kg" value={w} onChange={(e) => setW(e.target.value)} />
          <input className="input" type="number" inputMode="numeric" placeholder={String(target.r)} aria-label="Wiederholungen" value={r} onChange={(e) => setR(e.target.value)} />
          <button className="btn primary" type="submit">+ Satz</button>
        </form>
      )}

      <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        {anleitung && (
          <details className="fold">
            <summary className="muted">So geht’s</summary>
            <ol className="steps">{anleitung.so_gehts.map((s, i) => <li key={i}>{s}</li>)}</ol>
            {anleitung.achte_auf.length > 0 && (
              <>
                <p className="muted" style={{ fontWeight: 600 }}>Achte auf</p>
                <ul className="steps">{anleitung.achte_auf.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </>
            )}
            {anleitung.vermeide.length > 0 && (
              <>
                <p className="muted" style={{ fontWeight: 600 }}>Vermeide</p>
                <ul className="steps">{anleitung.vermeide.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </>
            )}
            {anleitung.bild_svg && (
              <div className="exercise-svg" dangerouslySetInnerHTML={{ __html: anleitung.bild_svg }} />
            )}
          </details>
        )}

        {alts.length > 0 && (
          <button type="button" className="btn small" onClick={() => setShowAlts((v) => !v)}>Gerät besetzt?</button>
        )}
        {isSubstituted && (
          <button type="button" className="btn ghost small" onClick={() => onSubstitute(null)}>Zurück zur Hauptübung</button>
        )}
      </div>

      {showAlts && (
        <div className="stack" style={{ gap: 6, marginTop: 10 }}>
          <p className="muted">Alternative wählen oder später probieren:</p>
          {alts.map((alt) => (
            <button key={alt} type="button" className="btn" onClick={() => { onSubstitute(alt); setShowAlts(false) }}>{alt}</button>
          ))}
          <button type="button" className="btn ghost small" onClick={() => setShowAlts(false)}>Später</button>
        </div>
      )}
    </div>
  )
}

// ---------- Pausen-Timer ----------

function RestTimer({ seconds, runKey }: { seconds: number; runKey: number }) {
  const [left, setLeft] = useState<number | null>(null)
  const [total, setTotal] = useState(90)

  // Startet automatisch, sobald nach einem Satz ein neuer runKey kommt
  useEffect(() => {
    if (runKey === 0 || seconds <= 0) return
    setTotal(seconds)
    setLeft(seconds)
  }, [runKey, seconds])

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
  const value = left ?? total
  const mm = String(Math.floor(value / 60))
  const ss = String(value % 60).padStart(2, '0')

  return (
    <div className="card soft">
      <p className="muted" style={{ textAlign: 'center' }}>Pause</p>
      <div className={`timer ${running ? 'running' : ''}`}>{mm}:{ss}</div>
      <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
        {running ? (
          <button type="button" className="btn small" onClick={() => setLeft(null)}>Stopp</button>
        ) : (
          <button type="button" className="btn small" onClick={() => setLeft(total)}>{total} Sek. starten</button>
        )}
      </div>
    </div>
  )
}

// ---------- Verlauf ----------

function History() {
  const [log] = useKv<WorkoutEntry[]>('workoutLog', [])
  const [measures, setMeasures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })
  const [weight, setWeight] = useState('')

  const recent = [...log].reverse().slice(0, 10)
  const weights = [...(measures.log ?? [])].reverse().slice(0, 8)

  async function addWeight() {
    const value = Number(weight.replace(',', '.'))
    if (!value) return
    await setMeasures({ log: [...(measures.log ?? []), { date: dateKey(), gewicht: value }] })
    setWeight('')
  }

  return (
    <div className="stack">
      <div className="section-title">Trainings</div>
      <div className="card">
        {recent.length === 0 && <p className="empty">Noch kein Training abgeschlossen.</p>}
        {recent.map((w) => {
          const sets = Object.values(w.sets).reduce((s, rows) => s + rows.length, 0)
          return (
            <div className="list-item" key={w.id}>
              <span className="time">{formatDay(w.date, { day: 'numeric', month: 'short' })}</span>
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{w.unit}</div>
                <p className="muted">{sets} Sätze</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-title">Körpergewicht</div>
      <div className="card">
        <form className="row" onSubmit={(e) => { e.preventDefault(); addWeight() }}>
          <input className="input" inputMode="decimal" placeholder="kg, z. B. 69,5" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <button className="btn" type="submit" disabled={!weight.trim()}>+</button>
        </form>
        <div style={{ marginTop: 10 }}>
          {weights.length === 0 && <p className="empty">Noch keine Messung.</p>}
          {weights.map((m, i) => (
            <div className="list-item" key={i}>
              <span className="time">{formatDay(m.date, { day: 'numeric', month: 'short' })}</span>
              <div className="grow">{m.gewicht} kg</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
