import { useState } from 'react'
import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'
import { forGrams, searchFood, unitGrams, type FoodHit } from '../lib/nutrition'
import type { Rezept } from '../lib/content'

// Zuordnung Zutat -> Datenbank-Eintrag, einmal gewählt, gilt für alle Rezepte.
export interface Matches {
  [ingredient: string]: FoodHit | null
}

// Berechnete Werte pro Portion, je Rezept.
export interface RecipeNutrition {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

const BASE_PERSONS = 3

// Nährwerte für alle Rezepte berechnen: jede Zutat einmal zuordnen, dann rechnet die App.
export function NutriCalc() {
  const recipes = useRecipes()
  const [matches, setMatches] = useKv<Matches>('ingredientMatches', {})
  const [nutrition, setNutrition] = useKv<Record<string, RecipeNutrition>>('recipeNutrition', {})
  const [openId, setOpenId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  if (!recipes) return null

  const open = recipes.rezepte.find((r) => r.id === openId)

  return (
    <div className="card">
      <button type="button" className="btn ghost" style={{ width: '100%' }} onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Nährwerte ausblenden' : 'Nährwerte für Rezepte'}
      </button>
      {expanded && (
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          {recipes.rezepte.map((r) => (
            <button key={r.id} type="button" className="recipe-row" onClick={() => setOpenId(r.id === openId ? null : r.id)}>
              <span className="grow" style={{ fontWeight: 600 }}>{r.titel}</span>
              <span className="muted" style={{ fontSize: 13 }}>
                {nutrition[r.id] ? `${Math.round(nutrition[r.id].kcal)} kcal / Portion` : 'noch nicht berechnet'}
              </span>
            </button>
          ))}
          {open && (
            <RecipeNutritionPanel
              key={open.id}
              recipe={open}
              matches={matches}
              setMatches={setMatches}
              onSave={(n) => setNutrition({ ...nutrition, [open.id]: n })}
            />
          )}
        </div>
      )}
    </div>
  )
}

function RecipeNutritionPanel({
  recipe,
  matches,
  setMatches,
  onSave,
}: {
  recipe: Rezept
  matches: Matches
  setMatches: (m: Matches) => Promise<void>
  onSave: (n: RecipeNutrition) => Promise<void>
}) {
  const [hits, setHits] = useState<Record<string, FoodHit[]>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [manual, setManual] = useState({ kcal: '', protein: '', carbs: '', fat: '' })

  async function find(name: string) {
    setBusy(name)
    try {
      const found = await searchFood(name)
      setHits({ ...hits, [name]: found.slice(0, 6) })
    } catch {
      setHits({ ...hits, [name]: [] })
    } finally {
      setBusy(null)
    }
  }

  async function choose(name: string, hit: FoodHit | null) {
    await setMatches({ ...matches, [name]: hit })
  }

  const rows = recipe.zutaten_fuer_3.map((z) => {
    const grams = unitGrams(z.name, z.menge, z.einheit)
    return { name: z.name, grams: Math.round(grams) }
  })

  const matched = rows.filter((r) => matches[r.name])
  const missing = rows.length - matched.length

  async function calculate() {
    const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    for (const r of matched) {
      const v = forGrams(matches[r.name] as FoodHit, r.grams)
      sum.kcal += v.kcal
      sum.protein += v.protein
      sum.carbs += v.carbs
      sum.fat += v.fat
    }
    await onSave({
      kcal: Math.round(sum.kcal / BASE_PERSONS),
      protein: Math.round((sum.protein / BASE_PERSONS) * 10) / 10,
      carbs: Math.round((sum.carbs / BASE_PERSONS) * 10) / 10,
      fat: Math.round((sum.fat / BASE_PERSONS) * 10) / 10,
    })
  }

  return (
    <div className="card form" style={{ marginTop: 4 }}>
      <p style={{ fontWeight: 700, margin: 0 }}>{recipe.titel}</p>
      <p className="muted" style={{ margin: 0 }}>Werte pro Portion, Basis {BASE_PERSONS} Personen. Stück und Löffel sind Richtwerte.</p>
      <div className="section-title" style={{ margin: 0 }}>Pro Portion von Hand eintragen</div>
      <div className="manual-grid">
        <input className="input" inputMode="decimal" placeholder="kcal" value={manual.kcal} onChange={(e) => setManual({ ...manual, kcal: e.target.value })} aria-label="kcal" />
        <input className="input" inputMode="decimal" placeholder="Protein g" value={manual.protein} onChange={(e) => setManual({ ...manual, protein: e.target.value })} aria-label="Protein" />
        <input className="input" inputMode="decimal" placeholder="KH g" value={manual.carbs} onChange={(e) => setManual({ ...manual, carbs: e.target.value })} aria-label="Kohlenhydrate" />
        <input className="input" inputMode="decimal" placeholder="Fett g" value={manual.fat} onChange={(e) => setManual({ ...manual, fat: e.target.value })} aria-label="Fett" />
      </div>
      <button type="button" className="btn" disabled={!(Number(manual.kcal.replace(',', '.')) > 0)} onClick={() => { const num = (v: string) => Number(v.replace(',', '.')) || 0; void onSave({ kcal: num(manual.kcal), protein: num(manual.protein), carbs: num(manual.carbs), fat: num(manual.fat) }) }}>
        Von Hand speichern
      </button>

      {rows.map((r) => {
        const m = matches[r.name]
        const options = hits[r.name]
        return (
          <div key={r.name} className="stack" style={{ gap: 4 }}>
            <div className="row between">
              <span style={{ fontWeight: 600 }}>{r.name} · {r.grams} g</span>
              <button type="button" className="btn small" onClick={() => find(r.name)} disabled={busy === r.name}>
                {busy === r.name ? '…' : m ? 'ändern' : 'suchen'}
              </button>
            </div>
            {m && <p className="muted" style={{ margin: 0 }}>{m.name} · {m.kcal} kcal / 100 g</p>}
            {m === null && <p className="muted" style={{ margin: 0 }}>Ohne Nährwerte</p>}
            {options && (
              <div className="stack" style={{ gap: 4 }}>
                {options.length === 0 && <p className="muted" style={{ margin: 0 }}>Nichts gefunden.</p>}
                {options.map((h, i) => (
                  <button key={`${h.name}-${i}`} type="button" className="recipe-row" onClick={() => choose(r.name, h)}>
                    <span className="grow">{h.name}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{h.kcal} kcal</span>
                  </button>
                ))}
                <button type="button" className="btn ghost small" onClick={() => choose(r.name, null)}>Ohne Nährwerte lassen</button>
              </div>
            )}
          </div>
        )
      })}
      <p className="muted" style={{ margin: 0 }}>{missing > 0 ? `${missing} Zutat(en) noch ohne Zuordnung` : 'Alle Zutaten zugeordnet'}</p>
      <button type="button" className="btn primary" onClick={calculate} disabled={matched.length === 0}>
        Nährwerte berechnen
      </button>
    </div>
  )
}
