import { useEffect, useMemo, useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey, formatDay } from '../lib/dates'
import type { RadPhase, TrainingFile } from '../lib/content'

type RideMode = 'locker' | 'intervalle' | 'edm'

interface RideEntry {
  date: string
  feel: string
  km: number
  min: number
  ts: number
  type: RideMode
}

const MODES: { id: RideMode; label: string }[] = [
  { id: 'locker', label: 'Locker' },
  { id: 'intervalle', label: 'Intervalle' },
  { id: 'edm', label: 'EDM Ride' },
]

const FEELINGS = ['gut', 'mittel', 'schwer']

function mmss(total: number): string {
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

function vibrate() {
  try {
    navigator.vibrate?.([150, 80, 150])
  } catch {
    // Vibration ist nicht überall verfügbar
  }
}

export function Ride({ content }: { content: TrainingFile }) {
  const [mode, setMode] = useState<RideMode>('locker')
  const [rides, setRides] = useKv<{ log: RideEntry[] }>('rides', { log: [] })

  const phases: RadPhase[] = useMemo(() => {
    if (mode === 'locker') return [{ phase: 'Locker', sekunden: content.rad.locker.ziel_minuten * 60 }]
    if (mode === 'intervalle') return content.rad.intervalle
    return content.rad.edm_ride
  }, [mode, content])

  const [index, setIndex] = useState(0)
  const [left, setLeft] = useState(phases[0].sekunden)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState(false)

  function switchMode(next: RideMode) {
    setMode(next)
    setIndex(0)
    setRunning(false)
    setElapsed(0)
    setFinished(false)
  }

  // Sekunden zählen, solange die Fahrt läuft
  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => {
      setElapsed((e) => e + 1)
      setLeft((l) => l - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [running, left])

  // Phase vorbei: nächste Phase starten oder Fahrt beenden
  useEffect(() => {
    if (!running || left > 0) return
    vibrate()
    if (index + 1 < phases.length) {
      setIndex(index + 1)
      setLeft(phases[index + 1].sekunden)
    } else {
      setRunning(false)
      setFinished(true)
    }
  }, [left, running, index, phases])

  function skipPhase() {
    if (index + 1 < phases.length) {
      setIndex(index + 1)
      setLeft(phases[index + 1].sekunden)
    } else {
      setRunning(false)
      setFinished(true)
    }
  }

  const current = phases[index]
  const next = phases[index + 1]
  const totalTarget = phases.reduce((s, p) => s + p.sekunden, 0)

  return (
    <div className="stack">
      <div className="segmented" role="tablist">
        {MODES.map((m) => (
          <button key={m.id} type="button" className={mode === m.id ? 'active' : ''} onClick={() => switchMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="card soft">
        <p className="muted">
          {mode === 'locker' && `Ziel ${content.rad.locker.ziel_minuten} Min. gemütlich`}
          {mode === 'intervalle' && 'Einrollen, sechs harte Intervalle, Ausrollen'}
          {mode === 'edm' && 'Anstiege, Sprints und Drops mit Widerstand und Trittfrequenz'}
        </p>
      </div>

      <div className="card ride-card">
        <p className="muted" style={{ textAlign: 'center' }}>{index + 1} / {phases.length} · {current.phase}</p>
        <div className={`timer big ${running ? 'running' : ''}`}>{mmss(Math.max(left, 0))}</div>

        {current.hart && <p className="pill terra" style={{ margin: '0 auto', display: 'table' }}>Hart</p>}
        {(current.widerstand_1_10 !== undefined || current.trittfrequenz) && (
          <div className="ride-targets">
            {current.widerstand_1_10 !== undefined && <span>Widerstand <strong>{current.widerstand_1_10}/10</strong></span>}
            {current.trittfrequenz && <span>Trittfrequenz <strong>{current.trittfrequenz}</strong></span>}
          </div>
        )}
        {next && <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>Danach: {next.phase}</p>}

        <div className="progress" style={{ marginTop: 14 }}>
          <span style={{ width: `${Math.min((elapsed / totalTarget) * 100, 100)}%` }} />
        </div>

        <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
          {!finished && (
            <>
              <button type="button" className="btn primary" onClick={() => setRunning((r) => !r)}>
                {running ? 'Pause' : elapsed > 0 ? 'Weiter' : 'Start'}
              </button>
              <button type="button" className="btn" onClick={skipPhase}>Weiter →</button>
            </>
          )}
          {!finished && elapsed > 0 && (
            <button type="button" className="btn ghost danger" onClick={() => { setRunning(false); setFinished(true) }}>Beenden</button>
          )}
        </div>
      </div>

      {finished && (
        <RideFinish
          mode={mode}
          minutes={Math.max(1, Math.round(elapsed / 60))}
          onSave={async (km, feel) => {
            await setRides({
              log: [...rides.log, { date: dateKey(), feel, km, min: Math.max(1, Math.round(elapsed / 60)), ts: Date.now(), type: mode }],
            })
            switchMode(mode)
          }}
          onDiscard={() => switchMode(mode)}
        />
      )}

      <div className="section-title">Fahrten</div>
      <div className="card">
        {rides.log.length === 0 && <p className="empty">Noch keine Fahrt eingetragen.</p>}
        {[...rides.log].reverse().slice(0, 10).map((r) => (
          <div className="list-item" key={r.ts}>
            <span className="time">{formatDay(r.date, { day: 'numeric', month: 'short' })}</span>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{MODES.find((m) => m.id === r.type)?.label ?? r.type}</div>
              <p className="muted">{r.km} km · {r.min} Min. · {r.feel}</p>
            </div>
            <button
              type="button"
              className="btn ghost small danger"
              aria-label={`Fahrt vom ${formatDay(r.date, { day: 'numeric', month: 'short' })} löschen`}
              onClick={() => {
                if (window.confirm('Diese Fahrt löschen?')) void setRides({ log: rides.log.filter((x) => x.ts !== r.ts) })
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function RideFinish({
  minutes,
  onSave,
  onDiscard,
}: {
  mode: RideMode
  minutes: number
  onSave: (km: number, feel: string) => Promise<void>
  onDiscard: () => void
}) {
  const [km, setKm] = useState('')
  const [feel, setFeel] = useState('gut')

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault()
        void onSave(Number(km.replace(',', '.')) || 0, feel)
      }}
    >
      <p style={{ fontWeight: 600 }}>Fahrt eintragen · {minutes} Min.</p>
      <input className="input" inputMode="decimal" placeholder="Kilometer, z. B. 15,2" value={km} onChange={(e) => setKm(e.target.value)} />
      <div className="segmented">
        {FEELINGS.map((f) => (
          <button key={f} type="button" className={feel === f ? 'active' : ''} onClick={() => setFeel(f)}>{f}</button>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn ghost" onClick={onDiscard}>Verwerfen</button>
        <button type="submit" className="btn primary" style={{ flex: 1 }}>Speichern</button>
      </div>
    </form>
  )
}
