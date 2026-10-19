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
