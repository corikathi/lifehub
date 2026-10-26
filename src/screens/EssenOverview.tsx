import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'
import { addDays, dateKey } from '../lib/dates'
import { defaultSlot, findRecipe, rotationWeek, scaleAmount } from '../lib/content'
import { ESSEN } from '../prototype/essen'
import { WATER } from '../prototype/water'
import { PrototypeScreen } from '../components/PrototypeScreen'
import { WeightEntry } from '../components/WeightEntry'

interface MealsState {
  persons: number
  skip: Record<string, number[]>
  weeks: Record<string, string[]>
}

// Ende eines ausgeglichenen Div-Blocks ab Startposition
function blockEnd(s: string, start: number): number {
  let depth = 0
  let i = start
  while (i < s.length) {
    const o = s.indexOf('<div', i)
    const c = s.indexOf('</div>', i)
    if (c < 0) return -1
    if (o >= 0 && o < c) {
      depth++
      i = o + 4
    } else {
      depth--
      i = c + 6
      if (depth === 0) return i
    }
  }
  return -1
}

// Die Rezeptkarte der Vorlage: geplantes Gericht mit Portionen, Zutaten und Anleitung
const RECIPE_START = ESSEN.indexOf('<div style="background:#f3c25e')
const RECIPE_CARD = ESSEN.slice(RECIPE_START, blockEnd(ESSEN, RECIPE_START))

// Essen auf der Heute-Seite: das geplante Rezept. Im Trend-Teil: Wasser und Gewicht.
// Kalorien und Nährwerte werden in dieser App nicht erfasst.
export function EssenOverview({ part }: { part: 'heute' | 'trend' }) {
  const today = dateKey()
  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)

  const content = useRecipes()
  const [mealsState, setMealsState] = useKv<MealsState>('meals', { persons: 2, skip: {}, weeks: {} })
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})

  const persons = mealsState.persons ?? 2
  const slotFor = (i: number) => mealsState.weeks[monday]?.[i] ?? defaultSlot(monday, i)
  const todaySlot = slotFor(weekIndex)
  const recipe = findRecipe(content?.rezepte ?? [], todaySlot)
  const recipeTitle = recipe?.titel ?? (todaySlot.startsWith('custom:') ? todaySlot.slice(7) : 'Noch nichts geplant')

  // Wasser von heute
  const todayWater = (drinks[today] ?? []).reduce((s, d) => s + d.ml, 0)
  const GLASSES = 12
  const GOAL_LITERS = 3
  const filled = Math.min(GLASSES, Math.floor(todayWater / 250))
  const glasses = Array.from({ length: GLASSES }, (_, i) => ({ bg: i < filled ? '#7fa9b8' : '#fffaf0', tap: 'water:add' }))
  const waterCtx = { glasses, waterText: `${(todayWater / 1000).toFixed(1)} / ${GOAL_LITERS} L` }

  const ctx = {
    rotationText: `Rotation Woche ${rotationWeek(monday)} von 4`,
    recipeTitle,
    recipeTag: 'Heute · Plan',
    recipeInfo: recipe
      ? 'Für ' + persons + ' Personen · ' + recipe.zutaten_fuer_3.length + ' Zutaten · ' + recipe.schritte.length + ' Schritte'
      : todaySlot.startsWith('custom:') ? 'Eigenes Gericht' : 'Noch kein Rezept für heute',
    persons,
    lessP: 'persons:-1',
    moreP: 'persons:+1',
    ingredients: recipe
      ? recipe.zutaten_fuer_3.map((z) => ({ name: z.name, amount: `${scaleAmount(z, persons)} ${z.einheit}` }))
      : [],
    steps: recipe ? recipe.schritte.map((text, i) => ({ n: i + 1, text })) : [],
  }

  async function addWater(ml: number) {
    const list = drinks[today] ?? []
    await setDrinks({ ...drinks, [today]: [...list, { ml, t: 'wasser', ts: Date.now() }] })
  }

  async function undoWater() {
    const list = drinks[today] ?? []
    if (list.length === 0) return
    await setDrinks({ ...drinks, [today]: list.slice(0, -1) })
  }

  function handleWater(action: string) {
    if (action === 'water:add') void addWater(250)
    else if (action === 'water:250') void addWater(250)
    else if (action === 'water:500') void addWater(500)
    else if (action === 'water:undo') void undoWater()
  }

  function handleAct(action: string) {
    if (action === 'persons:-1') void setMealsState({ ...mealsState, persons: Math.max(1, persons - 1) })
    else if (action === 'persons:+1') void setMealsState({ ...mealsState, persons: Math.min(6, persons + 1) })
  }

  if (part === 'heute') {
    return <PrototypeScreen template={RECIPE_CARD} ctx={ctx} onAct={handleAct} />
  }

  return (
    <>
      <PrototypeScreen template={WATER} ctx={waterCtx} onAct={handleWater} />
      <WeightEntry />
    </>
  )
}
