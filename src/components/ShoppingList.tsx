import { useState } from 'react'
import { useKv } from '../lib/store'
import { findRecipe, scaleAmount, type RezepteFile } from '../lib/content'
import { SHOP } from '../prototype/shop'
import { PrototypeScreen } from './PrototypeScreen'

const STAPLE_GROUP = 'Immer nachkaufen'

// Einkaufsliste der Woche, aus den Rezepten des Wochenplans berechnet.
// Abgehakt wird pro Woche und Zutat, der Stand bleibt gespeichert.
// Dauerartikel (z. B. Gouda, Toast) stehen immer dabei, unabhängig vom Wochenplan.
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
  const [staples, setStaples] = useKv<string[]>('staples', [])
  const [newStaple, setNewStaple] = useState('')

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

  // Dauerartikel als eigene Gruppe, zuerst
  if (staples.length > 0) {
    shop.unshift({
      name: STAPLE_GROUP,
      items: staples.map((s) => {
        const done = !!checked[key(s, 'Dauerartikel')]
        if (!done) open++
        return {
          name: s,
          box: done ? '#8fa35a' : 'transparent',
          mark: done ? '✓' : '',
          color: done ? '#8d7459' : '#4a3828',
          deco: done ? 'line-through' : 'none',
          toggle: `shop:${key(s, 'Dauerartikel')}`,
        }
      }),
    })
  }

  function handleAct(action: string) {
    if (!action.startsWith('shop:')) return
    const k = action.slice(5)
    void setChecked({ ...checked, [k]: !checked[k] })
  }

  async function addStaple() {
    const name = newStaple.trim()
    if (!name || staples.includes(name)) return
    await setStaples([...staples, name])
    setNewStaple('')
  }

  async function removeStaple(name: string) {
    await setStaples(staples.filter((s) => s !== name))
  }

  return (
    <>
      <PrototypeScreen template={SHOP} ctx={{ shop, shopOpen: String(open) }} onAct={handleAct} />
      <div className="card form" style={{ marginTop: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>Dauerartikel</div>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Was du immer wieder kaufst, z. B. Gouda oder Toast. Steht dann auf jeder Einkaufsliste.
        </p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            void addStaple()
          }}
        >
          <input className="input" placeholder="z. B. Gouda" value={newStaple} onChange={(e) => setNewStaple(e.target.value)} aria-label="Dauerartikel" />
          <button type="submit" className="btn small" disabled={!newStaple.trim()}>Hinzufügen</button>
        </form>
        {staples.map((s) => (
          <div className="list-item" key={s}>
            <span className="grow">{s}</span>
            <button type="button" className="btn ghost small danger" aria-label={`${s} entfernen`} onClick={() => removeStaple(s)}>×</button>
          </div>
        ))}
      </div>
    </>
  )
}
