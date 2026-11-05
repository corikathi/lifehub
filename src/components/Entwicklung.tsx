import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'

// Gewichtskurve mit Ziel und eine kleine Liste mit positiven Sätzen über den bisherigen Weg
export function Entwicklung() {
  const today = dateKey()
  const [measures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })
  const [goalWeight] = useKv<number>('goalWeight', 58)
  const [ballStart] = useKv<string | null>('ballStart', null)

  const log = [...measures.log].sort((a, b) => a.date.localeCompare(b.date))
  const points = log.slice(-14)
  const latest = points.length ? points[points.length - 1].gewicht : undefined
  const first = log.length ? log[0].gewicht : undefined
  const diff = latest !== undefined && first !== undefined ? Math.round((latest - first) * 10) / 10 : undefined

  const days = ballStart
    ? Math.max(1, Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${ballStart}T12:00:00`).getTime()) / 86400000) + 1)
    : 0

  // Kurve: höchster Wert oben, niedrigster unten, mit etwas Luft
  const w = 300
  const h = 90
  const vals = points.map((p) => p.gewicht)
  const min = vals.length ? Math.min(...vals, goalWeight) - 1 : 0
  const max = vals.length ? Math.max(...vals) + 1 : 1
  const span = max - min || 1
  const coords = points
    .map((p, i) => {
      const x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w
      const y = h - ((p.gewicht - min) / span) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const card: React.CSSProperties = { background: '#fffdf8', borderRadius: 28, padding: 18, boxShadow: '0 8px 24px rgba(94,60,25,.08)' }
  const tile: React.CSSProperties = { background: '#f6eee3', borderRadius: 20, padding: '12px 14px', flex: 1 }
  const small: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, color: '#8a6f58' }
  const big: React.CSSProperties = { margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#3f2e20' }

  const items: { text: string; good: boolean }[] = []
  if (diff !== undefined) {
    items.push({ text: diff < 0 ? `${Math.abs(diff)} kg seit Start` : diff > 0 ? `${diff} kg seit Start, dranbleiben zählt` : 'Gewicht stabil seit Start', good: diff <= 0 })
  }
  if (days > 0) {
    items.push({ text: `${days} ${days === 1 ? 'Tag' : 'Tage'} am Ball`, good: true })
  }
  if (items.length === 0) {
    items.push({ text: 'Trag dein erstes Gewicht ein, dann siehst du hier deinen Weg.', good: false })
  }

  return (
    <div style={card}>
      <p style={small}>Deine Entwicklung</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={tile}>
          <p style={small}>Aktuell</p>
          <p style={big}>{latest !== undefined ? `${latest} kg` : '–'}</p>
        </div>
        <div style={tile}>
          <p style={small}>Ziel</p>
          <p style={big}>{goalWeight} kg</p>
        </div>
      </div>

      {points.length > 1 && (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 96, marginTop: 14 }} aria-label="Gewichtskurve">
          <polyline points={coords} fill="none" stroke="#e8793a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {items.map((it) => (
          <div key={it.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#3f2e20' }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, background: it.good ? '#e8793a' : '#e6dccd', color: '#fffdf8', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900, flex: 'none' }}>
              {it.good ? '✓' : ''}
            </span>
            {it.text}
          </div>
        ))}
      </div>
    </div>
  )
}
