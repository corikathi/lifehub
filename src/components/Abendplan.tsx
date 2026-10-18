import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'

// Fester Abendablauf: hilft, den Abend nicht im Chaos enden zu lassen.
const STEPS = [
  'Küche aufräumen und Licht dimmen',
  'Geplanten Abendsnack essen, z. B. Quark oder Joghurt mit Protein',
  'Ein Glas Wasser oder Tee',
  'Vor dem Naschen eine Minute warten und fragen: Hunger oder etwas anderes?',
  'Zähne putzen als Abschluss des Tages',
]

export function Abendplan() {
  const today = dateKey()
  const [plan, setPlan] = useKv<Record<string, boolean[]>>('abendplan', {})
  const done = plan[today] ?? STEPS.map(() => false)
  const count = done.filter(Boolean).length

  async function toggle(i: number) {
    const next = [...done]
    next[i] = !next[i]
    await setPlan({ ...plan, [today]: next })
  }

  return (
    <div className="card">
      <div className="row between">
        <p style={{ fontWeight: 600 }}>Abendplan</p>
        <span className="pill">{count}/{STEPS.length}</span>
      </div>
      <div className="progress" style={{ marginTop: 8 }}>
        <span style={{ width: `${(count / STEPS.length) * 100}%` }} />
      </div>
      <div style={{ marginTop: 8 }}>
        {STEPS.map((step, i) => (
          <label className="check-row" key={step}>
            <input type="checkbox" checked={done[i]} onChange={() => toggle(i)} />
            <span className={done[i] ? 'done-text' : ''}>{step}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
