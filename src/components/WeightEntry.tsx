import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey, formatDay } from '../lib/dates'

// Körpergewicht eintragen. Die Werte landen in denselben Messungen wie im Training-Tab,
// damit das Gewichtsdiagramm im Essen-Tab sie anzeigt.
export function WeightEntry() {
  const today = dateKey()
  const [measures, setMeasures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })
  const [value, setValue] = useState('')
  const last = measures.log?.[measures.log.length - 1]

  async function save() {
    const kg = Number(value.replace(',', '.'))
    if (!kg) return
    const others = (measures.log ?? []).filter((m) => m.date !== today)
    await setMeasures({ log: [...others, { date: today, gewicht: kg }] })
    setValue('')
  }

  return (
    <div className="card">
      <div className="row between">
        <div>
          <p className="muted" style={{ margin: 0 }}>Gewicht</p>
          <p style={{ fontWeight: 600, margin: 0 }}>
            {last ? `${last.gewicht} kg · ${formatDay(last.date, { day: 'numeric', month: 'short' })}` : 'Noch kein Eintrag'}
          </p>
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <input className="input" style={{ maxWidth: 110 }} inputMode="decimal" placeholder="kg heute" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Gewicht in kg" />
          <button className="btn primary" type="submit" disabled={!value.trim()}>Speichern</button>
        </form>
      </div>
    </div>
  )
}
