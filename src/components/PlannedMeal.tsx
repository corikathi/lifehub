import { useKv } from '../lib/store'
import { addDays, dateKey } from '../lib/dates'
import { defaultSlot, findRecipe } from '../lib/content'
import { useRecipes } from '../lib/recipes'
import { unitGrams, type NutriEntry } from '../lib/nutrition'
import type { RecipeNutrition } from './NutriCalc'

// Das geplante Gericht von heute als eine Portion eintragen, ohne alles nochmal einzugeben.
export function PlannedMeal() {
  const today = dateKey()
  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)
  const recipes = useRecipes()
  const [mealsState] = useKv<{ weeks: Record<string, string[]> }>('meals', { weeks: {} })
  const [nutrition] = useKv<Record<string, RecipeNutrition>>('recipeNutrition', {})
  const [log, setLog] = useKv<Record<string, NutriEntry[]>>('nutriLog', {})

  const slot = mealsState.weeks[monday]?.[weekIndex] ?? defaultSlot(monday, weekIndex)
  const recipe = findRecipe(recipes?.rezepte ?? [], slot)
  if (!recipe) return null

  const entries = log[today] ?? []
  const alreadyEaten = entries.some((e) => e.name === recipe.titel)
  const n = nutrition[recipe.id]
  // Gramm pro Portion: Summe der Zutaten, geteilt durch die Basis von 3 Personen
  const gramsPerPortion = Math.round(
    recipe.zutaten_fuer_3.reduce((s, z) => s + unitGrams(z.name, z.menge, z.einheit), 0) / 3,
  )

  async function eat() {
    if (!n) return
    const entry: NutriEntry = {
      id: `n-${Date.now()}`,
      name: recipe!.titel,
      grams: gramsPerPortion,
      kcal: n.kcal,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
    }
    await setLog({ ...log, [today]: [...entries, entry] })
  }

  return (
    <div className="card planned">
      <p className="muted" style={{ margin: 0 }}>Heute geplant</p>
      <p style={{ fontWeight: 700, margin: '2px 0 8px' }}>{recipe.titel}</p>
      {alreadyEaten && <p className="muted" style={{ margin: 0 }}>✓ Schon eingetragen</p>}
      {!alreadyEaten && n && (
        <button type="button" className="btn primary" onClick={eat}>
          Als gegessen eintragen · {n.kcal} kcal
        </button>
      )}
      {!alreadyEaten && !n && (
        <p className="muted" style={{ margin: 0 }}>Für dieses Rezept fehlen die Nährwerte. Unter „Nährwerte für Rezepte“ berechnen oder von Hand eintragen.</p>
      )}
    </div>
  )
}
