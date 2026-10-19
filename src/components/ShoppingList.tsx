import { useKv } from '../lib/store'
import { findRecipe, scaleAmount, type RezepteFile } from '../lib/content'
import { SHOP } from '../prototype/shop'
import { PrototypeScreen } from './PrototypeScreen'

// Einkaufsliste der Woche, aus den Rezepten des Wochenplans berechnet.
// Abgehakt wird pro Woche und Zutat, der Stand bleibt gespeichert.
export function ShoppingList({
  content,
  slots,
  persons,
  monday,
}: {
  content: RezepteFile
  slots: string[]
  persons: number
  monday: string
}) {
  const [checked, setChecked] = useKv<Record<string, boolean>>('shoppingChecked', {})

  const groups = new Map<string, { name: string; einheit: string; menge: number; kategorie: string }[]>()
  for (const slot of slots) {
    const r = findRecipe(content.rezepte, slot)
    if (!r) continue
    for (const z of r.zutaten_fuer_3) {
      const list = groups.get(z.kategorie) ?? []
      const existing = list.find((x) => x.name === z.name && x.einheit === z.einheit)
      if (existing) existing.menge += scaleAmount(z, persons)
      else list.push({ name: z.name, einheit: z.einheit, menge: scaleAmount(z, persons), kategorie: z.kategorie })
      groups.set(z.kategorie, list)
    }
  }

  const key = (name: string, einheit: string) => `${monday}|${name}|${einheit}`
  let open = 0
  const shop = [...groups.entries()].map(([cat, items]) => ({
    name: cat,
    items: items.map((it) => {
      const done = !!checked[key(it.name, it.einheit)]
      if (!done) open++
      return {
        name: `${it.name} · ${Math.round(it.menge * 10) / 10} ${it.einheit}`,
        box: done ? '#8fa35a' : 'transparent',
        mark: done ? '✓' : '',
        color: done ? '#8d7459' : '#4a3828',
        deco: done ? 'line-through' : 'none',
        toggle: `shop:${key(it.name, it.einheit)}`,
      }
    }),
  }))

  function handleAct(action: string) {
    if (!action.startsWith('shop:')) return
    const k = action.slice(5)
    void setChecked({ ...checked, [k]: !checked[k] })
  }

  return <PrototypeScreen template={SHOP} ctx={{ shop, shopOpen: String(open) }} onAct={handleAct} />
}
