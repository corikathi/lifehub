import { useKv } from './store'
import type { Rezept, RezepteFile } from './content'

// Rezepte aus dem Import und eigene Rezepte, zusammengeführt.
// Alle Bereiche (Wochenplan, Einkaufsliste, Heute, Woche) lesen über diesen Hook.
export function useRecipes(): RezepteFile | null {
  const [base] = useKv<RezepteFile | null>('content.rezepte', null)
  const [own] = useKv<Rezept[]>('myRecipes', [])
  if (!base) {
    return own.length ? { info: '', rotation: '', rezepte: own, basics_einkauf: {} } : null
  }
  return { ...base, rezepte: [...base.rezepte, ...own] }
}
