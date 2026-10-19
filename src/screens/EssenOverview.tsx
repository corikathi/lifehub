import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'
import { addDays, dateKey, weekDays } from '../lib/dates'
import {
  DAYS,
  defaultSlot,
  findRecipe,
  rotationWeek,
  scaleAmount,
} from '../lib/content'
import { ESSEN } from '../prototype/essen'
import { WATER } from '../prototype/water'
import { PrototypeScreen } from '../components/PrototypeScreen'
import type { NutriEntry } from '../lib/nutrition'
import { Suche } from './Suche'
import { WeightEntry } from '../components/WeightEntry'
import { PlannedMeal } from '../components/PlannedMeal'

interface MealsState {
  persons: number
  skip: Record<string, number[]>
  weeks: Record<string, string[]>
}

// Die Mahlzeiten-Karte der Vorlage entfällt, die Einträge stehen unter der Kalorien-Suche
function removeMealsCard(html: string): string {
  const at = html.indexOf('Mahlzeiten heute')
  if (at < 0) return html
  const header = html.lastIndexOf('<div', at)
  const start = html.lastIndexOf('<div', header - 1)
  const listEnd = html.indexOf('</sc-for>', at)
  if (listEnd < 0) return html
  const end = html.indexOf('</div>', listEnd) + '</div>'.length
  return html.slice(0, start) + html.slice(end)
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


// Vorlage aufteilen: oben kcal und Makros, unten Mahlzeiten und Rest
const SPLIT = ESSEN.lastIndexOf('<div', ESSEN.indexOf('Mahlzeiten heute'))
const PART_TOP = ESSEN.slice(0, SPLIT) + '</div>'
const PART_BOTTOM = removeMealsCard(ESSEN.slice(SPLIT)).replace(/<\/div>\s*$/, '')

// Unterer Teil in drei Stücke: vor der Gewichtskarte, die Karten-Reihe, danach
const GEW_CARD = PART_BOTTOM.indexOf('{{ pg.name }}')
const GRID_START = PART_BOTTOM.lastIndexOf('<div', PART_BOTTOM.lastIndexOf('<div', GEW_CARD) - 1)
const GRID_END = blockEnd(PART_BOTTOM, GRID_START)
const PART_BOTTOM_A = PART_BOTTOM.slice(0, GRID_START)
const PART_BOTTOM_GRID = PART_BOTTOM.slice(GRID_START, GRID_END)
const PART_BOTTOM_C = PART_BOTTOM.slice(GRID_END)

// Ziele für Makros. Der Prototyp hat keine Werte, diese sind Startwerte und lassen sich im Code ändern.
const TARGET_PROTEIN = 140
const TARGET_CARBS = 220
const TARGET_FAT = 70

const dayLabel = (i: number) => DAYS[i] ?? ''

function line(values: number[], width = 100, height = 30): string {
  if (values.length === 0) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width
      const y = height - 3 - ((v - min) / span) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

// Essen 1:1 aus dem Prototyp, mit den Daten aus unserer App.
export function EssenOverview() {
  const today = dateKey()
  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)
  const days = weekDays(today)

  const content = useRecipes()
  const [mealsState, setMealsState] = useKv<MealsState>('meals', { persons: 2, skip: {}, weeks: {} })
  const [nutri] = useKv<Record<string, NutriEntry[]>>('nutriLog', {})
  const [recipeNutri] = useKv<Record<string, { kcal: number; protein: number; carbs: number; fat: number }>>('recipeNutrition', {})
  const [goal] = useKv<number>('kcalGoal', 2000)
  const [checked, setChecked] = useKv<Record<string, boolean>>('shoppingChecked', {})
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})
  const [measures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })

  const persons = mealsState.persons ?? 2
  const slotFor = (i: number) => mealsState.weeks[monday]?.[i] ?? defaultSlot(monday, i)
  const todaySlot = slotFor(weekIndex)
  const recipe = findRecipe(content?.rezepte ?? [], todaySlot)
  const recipeTitle = recipe?.titel ?? (todaySlot.startsWith('custom:') ? todaySlot.slice(7) : 'Noch nichts geplant')

  // Kalorien und Makros von heute
  const entries = nutri[today] ?? []
  const eaten = entries.reduce((s, e) => s + e.kcal, 0)
  const protein = entries.reduce((s, e) => s + e.protein, 0)
  const carbs = entries.reduce((s, e) => s + e.carbs, 0)
  const fat = entries.reduce((s, e) => s + e.fat, 0)
  const target = goal

  // Wochen-Werte für Diagramme
  const todayWater = (drinks[today] ?? []).reduce((s, d) => s + d.ml, 0)
  const GLASSES = 8
  const filled = Math.min(GLASSES, Math.floor(todayWater / 250))
  const glasses = Array.from({ length: GLASSES }, (_, i) => ({ bg: i < filled ? '#7fa9b8' : '#fffaf0', tap: 'water:add' }))
  const waterCtx = { glasses, waterText: `${filled} / ${GLASSES} Gläser` }

  const weekProtein = days.map((d) => (nutri[d] ?? []).reduce((s, e) => s + e.protein, 0))
  const weekKcal = days.map((d) => (nutri[d] ?? []).reduce((s, e) => s + e.kcal, 0))
  const recentWeights = [...(measures.log ?? [])].slice(-7)
  const latest = recentWeights[recentWeights.length - 1]?.gewicht
  const first = recentWeights[0]?.gewicht
  const avgKcal = weekKcal.filter(Boolean).length
    ? Math.round(weekKcal.filter(Boolean).reduce((s, v) => s + v, 0) / weekKcal.filter(Boolean).length)
    : 0

  // Einkaufsliste der Woche aus den Rezepten
  const groups = new Map<string, { name: string; einheit: string; menge: number; kategorie: string }[]>()
  for (let i = 0; i < 7; i++) {
    const r = findRecipe(content?.rezepte ?? [], slotFor(i))
    if (!r) continue
    for (const z of r.zutaten_fuer_3) {
      const list = groups.get(z.kategorie) ?? []
      const existing = list.find((x) => x.name === z.name && x.einheit === z.einheit)
      if (existing) existing.menge += scaleAmount(z, persons)
      else list.push({ name: z.name, einheit: z.einheit, menge: scaleAmount(z, persons), kategorie: z.kategorie })
      groups.set(z.kategorie, list)
    }
  }
  const shopKey = (name: string, einheit: string) => `${monday}|${name}|${einheit}`
  let shopOpen = 0
  const shop = [...groups.entries()].map(([cat, items]) => ({
    name: cat,
    items: items.map((it) => {
      const done = !!checked[shopKey(it.name, it.einheit)]
      if (!done) shopOpen++
      return {
        name: `${it.name} · ${Math.round(it.menge * 10) / 10} ${it.einheit}`,
        box: done ? '#8fa35a' : 'transparent',
        mark: done ? '✓' : '',
        color: done ? '#8d7459' : '#4a3828',
        deco: done ? 'line-through' : 'none',
        toggle: `shop:${shopKey(it.name, it.einheit)}`,
      }
    }),
  }))

  const ctx = {
    rotationText: `Rotation Woche ${rotationWeek(monday)} von 4`,
    recipeTitle,
    recipeTag: 'Heute · Plan',
    recipeInfo: recipe && recipeNutri[recipe.id]
      ? 'Pro Portion: ' + recipeNutri[recipe.id].kcal + ' kcal · ' + recipeNutri[recipe.id].protein + ' g Protein · ' + recipeNutri[recipe.id].carbs + ' g KH · ' + recipeNutri[recipe.id].fat + ' g Fett'
      : recipe
      ? 'Für ' + persons + ' Personen · ' + recipe.zutaten_fuer_3.length + ' Zutaten · ' + recipe.schritte.length + ' Schritte'
      : todaySlot.startsWith('custom:') ? 'Eigenes Gericht' : 'Noch kein Rezept für heute',
    persons,
    lessP: 'persons:-1',
    moreP: 'persons:+1',
    ingredients: recipe
      ? recipe.zutaten_fuer_3.map((z) => ({ name: z.name, amount: `${scaleAmount(z, persons)} ${z.einheit}` }))
      : [],
    kcalEaten: eaten,
    kcalLeft: target - eaten,
    kcalTarget: target,
    macroHint: `Noch ${Math.max(0, TARGET_PROTEIN - Math.round(protein))} g Protein bis zum Ziel.`,
    macros: [
      { name: 'Protein', val: `${Math.round(protein)} / ${TARGET_PROTEIN} g`, pct: `${Math.round((protein / TARGET_PROTEIN) * 100)}%`, h: `${Math.min(100, (protein / TARGET_PROTEIN) * 100)}%`, bg: '#8fa35a', ink: '#fffaf0' },
      { name: 'Kohlenhydrate', val: `${Math.round(carbs)} / ${TARGET_CARBS} g`, pct: `${Math.round((carbs / TARGET_CARBS) * 100)}%`, h: `${Math.min(100, (carbs / TARGET_CARBS) * 100)}%`, bg: '#e8b04a', ink: '#3d2a12' },
      { name: 'Fett', val: `${Math.round(fat)} / ${TARGET_FAT} g`, pct: `${Math.round((fat / TARGET_FAT) * 100)}%`, h: `${Math.min(100, (fat / TARGET_FAT) * 100)}%`, bg: '#c9764a', ink: '#fffaf0' },
    ],
    mealsDone: `${entries.length} erfasst`,
    meals: entries.map((e) => ({
      name: e.name,
      slot: `${e.grams} g`,
      p: Math.round(e.protein),
      kcal: e.kcal,
      mark: '✓',
      checkBg: '#8fa35a',
      bg: '#fffaf0',
      toggle: 'noop',
    })),
    progress: [
      {
        name: 'Gewicht',
        val: latest !== undefined ? `${latest} kg` : '–',
        delta: latest !== undefined && first !== undefined && recentWeights.length > 1 ? `${(latest - first) > 0 ? '+' : ''}${Math.round((latest - first) * 10) / 10} kg` : '',
        points: line(recentWeights.map((m) => m.gewicht)),
        bg: '#fffaf0',
        ink: '#5d6b3d',
      },
      {
        name: 'Kalorien Ø 7 Tage',
        val: avgKcal ? `${avgKcal} kcal` : '–',
        delta: '',
        points: line(weekKcal),
        bg: '#fffaf0',
        ink: '#c4703f',
      },
    ],
    protHit: `${weekProtein.filter((p) => p >= TARGET_PROTEIN).length} von 7 Tagen erreicht`,
    protWeek: days.map((_d, i) => ({
      d: dayLabel(i),
      h: `${Math.min(100, (weekProtein[i] / TARGET_PROTEIN) * 100)}%`,
      bg: weekProtein[i] >= TARGET_PROTEIN ? '#8fa35a' : '#e8d7b8',
    })),
    shop,
    shopOpen: String(shopOpen),
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
    else if (action.startsWith('shop:')) {
      const key = action.slice(5)
      void setChecked({ ...checked, [key]: !checked[key] })
    }
  }

  return (
    <>
      <WeightEntry />
      <PrototypeScreen template={PART_TOP} ctx={ctx} onAct={handleAct} />
      <PlannedMeal />
      <Suche />
      <PrototypeScreen template={WATER} ctx={waterCtx} onAct={handleWater} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {PART_BOTTOM_A.trim() && <PrototypeScreen template={PART_BOTTOM_A} ctx={ctx} onAct={handleAct} />}
        <PrototypeScreen template={PART_BOTTOM_GRID} ctx={ctx} onAct={handleAct} />
        <PrototypeScreen template={PART_BOTTOM_C} ctx={ctx} onAct={handleAct} />
      </div>
    </>
  )
}
