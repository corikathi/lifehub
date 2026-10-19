import { useState } from 'react'
import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'

interface Values {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

// Nährwerte pro Portion für alle Rezepte, auch für importierte. Die Werte lassen sich von Hand
// ändern und erscheinen danach auf der Heute-Seite.
export function NutriEdit() {
  const content = useRecipes()
  const [nutri, setNutri] = useKv<Record<string, Values>>('recipeNutrition', {})
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ kcal: '', protein: '', carbs: '', fat: '' })
  const recipes = content?.rezepte ?? []

  function startEdit(id: string) {
    const n = nutri[id]
    setDraft(n ? { kcal: String(n.kcal), protein: String(n.protein), carbs: String(n.carbs), fat: String(n.fat) } : { kcal: '', protein: '', carbs: '', fat: '' })
    setEditId(id)
  }

  async function save() {
    if (!editId) return
    const num = (v: string) => Number(v.replace(',', '.')) || 0
    await setNutri({
      ...nutri,
      [editId]: { kcal: num(draft.kcal), protein: num(draft.protein), carbs: num(draft.carbs), fat: num(draft.fat) },
    })
    setEditId(null)
  }

  return (
    <div className="card stack" style={{ gap: 8 }}>
      <div className="section-title" style={{ margin: 0 }}>Nährwerte pro Portion</div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Die Werte jedes Rezepts kannst du hier ändern. Sie erscheinen danach auf der Heute-Seite.
      </p>
      {recipes.map((r) => {
        const n = nutri[r.id]
        return (
          <div key={r.id}>
            <div className="list-item">
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{r.titel}</div>
                <p className="muted">{n ? `${n.kcal} kcal · P ${n.protein} g · KH ${n.carbs} g · F ${n.fat} g` : 'Noch keine Werte'}</p>
              </div>
              <button type="button" className="btn ghost small" aria-label={`Nährwerte von ${r.titel} ändern`} onClick={() => startEdit(r.id)}>✎</button>
            </div>
            {editId === r.id && (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void save()
                }}
              >
                <div className="manual-grid">
                  <input className="input" inputMode="decimal" placeholder="kcal" value={draft.kcal} onChange={(e) => setDraft({ ...draft, kcal: e.target.value })} aria-label="kcal" />
                  <input className="input" inputMode="decimal" placeholder="Protein g" value={draft.protein} onChange={(e) => setDraft({ ...draft, protein: e.target.value })} aria-label="Protein" />
                  <input className="input" inputMode="decimal" placeholder="KH g" value={draft.carbs} onChange={(e) => setDraft({ ...draft, carbs: e.target.value })} aria-label="Kohlenhydrate" />
                  <input className="input" inputMode="decimal" placeholder="Fett g" value={draft.fat} onChange={(e) => setDraft({ ...draft, fat: e.target.value })} aria-label="Fett" />
                </div>
                <div className="row">
                  <button type="button" className="btn ghost" onClick={() => setEditId(null)}>Abbrechen</button>
                  <button type="submit" className="btn primary" style={{ flex: 1 }}>Speichern</button>
                </div>
              </form>
            )}
          </div>
        )
      })}
    </div>
  )
}
