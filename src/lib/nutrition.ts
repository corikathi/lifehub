// Lebensmittel-Suche über Open Food Facts (offene Datenbank, ODbL).
// Werte beziehen sich auf 100 g bzw. 100 ml.

export interface FoodHit {
  name: string
  brand: string
  kcal: number // pro 100 g
  protein: number
  carbs: number
  fat: number
}

export interface NutriEntry {
  id: string
  name: string
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

type OffProduct = {
  product_name?: string
  product_name_de?: string
  brands?: string
  nutriments?: Record<string, number | undefined>
}

export async function searchFood(query: string): Promise<FoodHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page_size=12&search_simple=1' +
    '&fields=product_name,product_name_de,brands,nutriments&search_terms=' +
    encodeURIComponent(q)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Suche fehlgeschlagen')
  const data = (await res.json()) as { products?: OffProduct[] }
  return (data.products ?? [])
    .map((p) => {
      const n = p.nutriments ?? {}
      const energy = n['energy_100g']
      const kcal = n['energy-kcal_100g'] ?? (energy !== undefined ? energy / 4.184 : undefined)
      return {
        name: p.product_name_de || p.product_name || '',
        brand: p.brands ?? '',
        kcal: Math.round(kcal ?? 0),
        protein: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
        carbs: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
        fat: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
      }
    })
    .filter((f) => f.name && f.kcal > 0)
}

// Werte für eine Menge in Gramm
export function forGrams(hit: FoodHit, grams: number): Omit<NutriEntry, 'id' | 'name' | 'grams'> {
  const f = grams / 100
  return {
    kcal: Math.round(hit.kcal * f),
    protein: Math.round(hit.protein * f * 10) / 10,
    carbs: Math.round(hit.carbs * f * 10) / 10,
    fat: Math.round(hit.fat * f * 10) / 10,
  }
}

// Produkt über den Barcode (EAN) nachschlagen
export async function lookupBarcode(code: string): Promise<FoodHit | null> {
  const clean = code.replace(/\D/g, '')
  if (clean.length < 8) return null
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,product_name_de,brands,nutriments`,
  )
  if (!res.ok) throw new Error('Barcode-Suche fehlgeschlagen')
  const data = (await res.json()) as { status?: number; product?: OffProduct }
  if (data.status !== 1 || !data.product) return null
  const p = data.product
  const n = p.nutriments ?? {}
  const energy = n['energy_100g']
  const kcal = n['energy-kcal_100g'] ?? (energy !== undefined ? energy / 4.184 : undefined)
  return {
    name: p.product_name_de || p.product_name || '',
    brand: p.brands ?? '',
    kcal: Math.round(kcal ?? 0),
    protein: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
    carbs: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    fat: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
  }
}

// Gewicht einer Zutat in Gramm. Stück und Löffel sind Richtwerte, die sich anpassen lassen.
const PIECE_GRAMS: [RegExp, number][] = [
  [/zwiebel/i, 80],
  [/paprika/i, 150],
  [/zucchini/i, 200],
  [/tomate/i, 120],
  [/gurke/i, 300],
  [/kartoffel/i, 100],
  [/lauch/i, 100],
  [/ei$|eier/i, 60],
  [/zehe|knoblauch/i, 5],
]

export function unitGrams(name: string, menge: number, einheit: string): number {
  const unit = einheit.trim().toLowerCase()
  if (unit === 'g' || unit === 'ml') return menge
  if (unit === 'el') return menge * 15
  if (unit === 'tl') return menge * 5
  if (unit === 'zehe' || unit === 'zehen') return menge * 5
  // Stück, Stangen und ähnliches
  const hit = PIECE_GRAMS.find(([re]) => re.test(name))
  return menge * (hit ? hit[1] : 100)
}
