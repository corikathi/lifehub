import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey } from '../lib/dates'

// Gewichtskarte im Raster neben den Kalorien. Mit dem Plus wird der Tageswert gespeichert.
// Die Werte landen in denselben Messungen wie im Training-Tab.
export function WeightEntry() {
  const today = dateKey()
  const [measures, setMeasures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })
  const [value, setValue] = useState('')
  const log = measures.log ?? []
  const last = log[log.length - 1]
  const first = log[0]
  const delta = last && first && log.length > 1 ? Math.round((last.gewicht - first.gewicht) * 10) / 10 : undefined

  async function save() {
    const kg = Number(value.replace(',', '.'))
    if (!kg) return
    const others = log.filter((m) => m.date !== today)
    await setMeasures({ log: [...others, { date: today, gewicht: kg }] })
    setValue('')
  }

  return (
    <div style={{ background: '#fffaf0', borderRadius: 20, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 6px 18px rgba(94,60,25,0.08)' }}>
      <span style={{ fontWeight: 800, fontSize: 14, color: '#5d6b3d' }}>Gewicht</span>
      <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 26, color: '#5d6b3d', lineHeight: 1 }}>
        {last ? `${last.gewicht} kg` : '–'}
      </span>
      {delta !== undefined && <span style={{ fontSize: 13, color: '#5d6b3d' }}>{delta > 0 ? '+' : ''}{delta} kg</span>}
      <form
        style={{ display: 'flex', gap: 6, marginTop: 4 }}
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <input
          className="input"
          style={{ minWidth: 0, padding: '8px 10px', fontSize: 14 }}
          inputMode="decimal"
          placeholder="kg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Gewicht in kg"
        />
        <button className="btn primary" type="submit" disabled={!value.trim()} aria-label="Gewicht speichern" style={{ minWidth: 44, padding: '0 10px' }}>
          +
        </button>
      </form>
    </div>
  )
}
