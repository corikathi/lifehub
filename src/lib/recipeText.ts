// Liest Rezepte aus normalem Text, z. B. so:
//   Titel
//   Nährwerte (pro Person): Kalorien ca. 680 kcal, Protein ca. 38 g, Kohlenhydrate ca. 62 g, Fett ca. 30 g
//   Zutaten:
//   500–600 g Lachsfilet
//   2 EL Sojasoße
//   Anleitung:
//   Schritt 1
//   Schritt 2
// Mehrere Rezepte werden nacheinander eingefügt, getrennt durch eine neue Titelzeile.

export interface ParsedRecipe {
  titel: string
  portionen: number
  zutaten: { name: string; menge: number; einheit: string; kategorie: string }[]
  schritte: string[]
  kcal?: number
  protein?: number
  carbs?: number
  fat?: number
}

const UNITS = ['g', 'kg', 'ml', 'l', 'el', 'tl', 'stück', 'stk', 'paket', 'dose', 'zehe', 'zehen', 'bund', 'becher', 'scheibe', 'scheiben', 'prise']

const CATEGORY_RULES: [RegExp, string][] = [
  [/hähnchen|lachs|hack|pute|rind|fisch|wurst|schinken|speck|garnele/i, 'Fleisch & Fisch'],
  [/käse|quark|joghurt|sour cream|milch|sahne|butter|skyr|ei\b|eier/i, 'Kühlregal'],
  [/paprika|zwiebel|tomate|gurke|knoblauch|zucchini|karotte|kartoffel|lauch|salat|brokkoli|spinat|apfel|banane|beere/i, 'Obst & Gemüse'],
  [/reis|nudel|mehl|öl|soße|sauce|honig|sirup|gewürz|pulver|dose|paket|wrap|bohne|mais|linse|haferflocken|essig|brühe|salz|pfeffer|kreuzkümmel|paprikapulver/i, 'Vorrat'],
]

function categoryOf(name: string): string {
  return CATEGORY_RULES.find(([re]) => re.test(name))?.[1] ?? 'Sonstiges'
}

// Zahl mit Komma oder Bereich ("500–600", "1,5") -> Mittelwert
function parseNumber(raw: string): number {
  const parts = raw.replace(',', '.').split(/[–-]/).map((p) => Number(p.trim())).filter((n) => !Number.isNaN(n))
  if (parts.length === 0) return 0
  return parts.reduce((s, n) => s + n, 0) / parts.length
}

function parseIngredient(line: string): { name: string; menge: number; einheit: string; kategorie: string } | null {
  const clean = line.replace(/^[-•*]\s*/, '').trim()
  if (!clean) return null
  // Zahl (evtl. Bereich) am Anfang, danach optional eine Einheit
  const m = clean.match(/^(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?)\s*([A-Za-zÄÖÜäöüß.]+)?\s+(.*)$/)
  let menge = 1
  let einheit = 'Stück'
  let rest = clean
  if (m) {
    menge = parseNumber(m[1])
    const word = (m[2] ?? '').replace('.', '').toLowerCase()
    if (UNITS.includes(word)) {
      einheit = word === 'stk' ? 'Stück' : m[2]!.replace('.', '')
      rest = m[3]
    } else {
      rest = m[2] ? `${m[2]} ${m[3]}` : m[3]
    }
  } else if (/^etwas\s+/i.test(clean)) {
    menge = 1
    einheit = 'Prise'
    rest = clean.replace(/^etwas\s+/i, '')
  }
  const name = rest.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
  if (!name) return null
  return { name, menge, einheit, kategorie: categoryOf(name) }
}

function parseNutrition(line: string): Partial<Pick<ParsedRecipe, 'kcal' | 'protein' | 'carbs' | 'fat'>> {
  const out: Partial<Pick<ParsedRecipe, 'kcal' | 'protein' | 'carbs' | 'fat'>> = {}
  const grab = (re: RegExp) => {
    const m = line.match(re)
    const v = m ? (m[1] ?? m[2]) : undefined
    return v ? parseNumber(v) : undefined
  }
  out.kcal = grab(/kcal[^\d]*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*kcal/i) ?? undefined
  out.protein = grab(/protein[^\d]*(\d+(?:[.,]\d+)?)/i)
  out.carbs = grab(/(?:kohlenhydrate|kh)[^\d]*(\d+(?:[.,]\d+)?)/i)
  out.fat = grab(/fett[^\d]*(\d+(?:[.,]\d+)?)/i)
  return out
}

// Nur gefundene Werte übernehmen, vorhandene nicht überschreiben
function mergeDefined(target: ParsedRecipe, values: Partial<ParsedRecipe>): void {
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined) (target as unknown as Record<string, unknown>)[k] = v
  }
}

export function parseRecipeText(text: string): ParsedRecipe[] {
  // Unsichtbare Zeichen aus dem Kopieren (Zero-Width, geschütztes Leerzeichen) entfernen
  const cleaned = text.normalize('NFC').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ')
  const lines = cleaned.split('\n').map((l) => l.trim())
  const recipes: ParsedRecipe[] = []
  let current: ParsedRecipe | null = null
  let section: 'none' | 'naehr' | 'zutaten' | 'anleitung' = 'none'
  let pendingTitle = ''

  const cleanTitle = (l: string) => l.replace(/^\d+[.)]\s*/, '').replace(/^#+\s*/, '').trim()
  const startRecipe = (): ParsedRecipe => {
    const r: ParsedRecipe = { titel: pendingTitle || 'Eigenes Rezept', portionen: 3, zutaten: [], schritte: [] }
    recipes.push(r)
    return r
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const next = lines.slice(i + 1).find((l) => l) ?? ''
    const headingNut = /^nährwerte/i.test(line)
    const headingZut = /^zutaten/i.test(line)
    const headingAnl = /^(anleitung|zubereitung)/i.test(line)
    const isHeading = headingNut || headingZut || headingAnl

    if (!isHeading) {
      // Titelzeile erkennen: steht vor einem Abschnitt (Nährwerte oder Zutaten)
      if (/^(nährwerte|zutaten)/i.test(next) && section !== 'naehr') {
        pendingTitle = cleanTitle(line)
        section = 'none'
        continue
      }
      if (section === 'none') pendingTitle = cleanTitle(line)
    }

    if (headingNut) {
      if (!current || current.zutaten.length > 0) current = startRecipe()
      mergeDefined(current as ParsedRecipe, parseNutrition(line))
      section = 'naehr'
      continue
    }
    if (headingZut) {
      if (!current || current.zutaten.length > 0) current = startRecipe()
      section = 'zutaten'
      continue
    }
    if (headingAnl) {
      section = 'anleitung'
      continue
    }
    if (!current) continue

    if (section === 'naehr') {
      mergeDefined(current, parseNutrition(line))
    } else if (section === 'zutaten') {
      const ing = parseIngredient(line)
      if (ing) current.zutaten.push(ing)
    } else if (section === 'anleitung') {
      current.schritte.push(line.replace(/^\d+[.)]\s*/, '').trim())
    }
  }
  return recipes.filter((r) => r.zutaten.length > 0)
}
