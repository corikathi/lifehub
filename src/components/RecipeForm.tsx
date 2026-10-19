import { useState } from 'react'
import { useKv } from '../lib/store'
import type { Rezept, Zutat } from '../lib/content'

const CATEGORIES = ['Obst & Gemüse', 'Fleisch & Fisch', 'Vorrat', 'Kühlregal', 'Sonstiges']

interface Row {
  name: string
  menge: string
  einheit: string
  kategorie: string
}

const EMPTY_ROW: Row = { name: '', menge: '', einheit: 'g', kategorie: 'Vorrat' }

// Eigenes Rezept anlegen. Die Mengen werden auf die Basis von 3 Personen umgerechnet,
// damit Portionen und Einkaufsliste wie bei den anderen Rezepten funktionieren.
export function RecipeForm() {
  const [mine, setMine] = useKv<Rezept[]>('myRecipes', [])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [persons, setPersons] = useState('2')
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }])
  const [steps, setSteps] = useState('')

  function updateRow(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }

  async function save() {
    const base = Number(persons.replace(',', '.')) || 1
    const zutaten: Zutat[] = rows
      .filter((r) => r.name.trim() && r.menge.trim())
      .map((r) => ({
        name: r.name.trim(),
        menge: Math.round(((Number(r.menge.replace(',', '.')) || 0) * 3) / base * 10) / 10,
        einheit: r.einheit.trim() || 'g',
        kategorie: r.kategorie,
      }))
    if (!title.trim() || zutaten.length === 0) return
    const rezept: Rezept = {
      id: `own-${Date.now()}`,
      titel: title.trim(),
      hinweis: 'Eigenes Rezept',
      zutaten_fuer_3: zutaten,
      schritte: steps.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    await setMine([...mine, rezept])
    setTitle('')
    setPersons('2')
    setRows([{ ...EMPTY_ROW }])
    setSteps('')
    setOpen(false)
  }

  async function remove(id: string) {
    await setMine(mine.filter((r) => r.id !== id))
  }

  if (!open) {
    return (
      <div className="stack" style={{ gap: 8 }}>
        <button type="button" className="btn primary" onClick={() => setOpen(true)}>+ Eigenes Rezept anlegen</button>
        {mine.map((r) => (
          <div className="list-item" key={r.id}>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{r.titel}</div>
              <p className="muted">{r.zutaten_fuer_3.length} Zutaten</p>
            </div>
            <button type="button" className="btn ghost small danger" aria-label={`${r.titel} löschen`} onClick={() => remove(r.id)}>×</button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <div className="section-title" style={{ margin: 0 }}>Neues Rezept</div>
      <input className="input" placeholder="Name, z. B. Linsensuppe" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="row">
        <span className="muted">Für</span>
        <input className="input" style={{ maxWidth: 90 }} inputMode="numeric" value={persons} onChange={(e) => setPersons(e.target.value)} aria-label="Portionen" />
        <span className="muted">Personen</span>
      </div>

      <div className="section-title" style={{ margin: 0 }}>Zutaten</div>
      {rows.map((r, i) => (
        <div className="ingredient-row" key={i}>
          <input className="input" placeholder="Zutat" value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} aria-label="Zutat" />
          <input className="input" inputMode="decimal" placeholder="Menge" value={r.menge} onChange={(e) => updateRow(i, { menge: e.target.value })} aria-label="Menge" />
          <input className="input" placeholder="Einheit" value={r.einheit} onChange={(e) => updateRow(i, { einheit: e.target.value })} aria-label="Einheit" />
          <select className="select" value={r.kategorie} onChange={(e) => updateRow(i, { kategorie: e.target.value })} aria-label="Kategorie">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      ))}
      <button type="button" className="btn ghost small" onClick={() => setRows([...rows, { ...EMPTY_ROW }])}>+ Zutat</button>

      <textarea className="textarea" placeholder="Zubereitung, eine Zeile pro Schritt (optional)" value={steps} onChange={(e) => setSteps(e.target.value)} />

      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Abbrechen</button>
        <button type="submit" className="btn primary" style={{ flex: 1 }} disabled={!title.trim()}>Speichern</button>
      </div>
    </form>
  )
}
