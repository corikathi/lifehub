import { useState } from 'react'
import { useKv } from '../lib/store'
import { findRecipe, scaleAmount, type RezepteFile } from '../lib/content'
import { SHOP } from '../prototype/shop'
import { PrototypeScreen } from './PrototypeScreen'

// Reihenfolge der Kategorien, so wie man durch einen Supermarkt geht
const CATEGORY_ORDER = ['Obst & Gemüse', 'Fleisch & Fisch', 'Kühlregal', 'Vorrat', 'Sonstiges']
const rank = (cat: string) => {
  const i = CATEGORY_ORDER.indexOf(cat)
  return i < 0 ? CATEGORY_ORDER.length : i
}

// Vorschläge für Eiweiß und Sättigung, nach den Quellen aus dem Netz. Ein Tipp übernimmt sie.
const SUGGESTIONS = [
  'Magerquark',
  'Skyr',
  'Griechischer Joghurt',
  'Proteinjoghurt',
  'Mini Babybel Light',
  'Eier',
  'Hühnerbrust',
  'Linsen',
  'Kichererbsen',
  'Haferflocken',
  'Kartoffeln',
]

// Einheit, mit der Dauerartikel in der Liste stehen (ohne Menge)
const STAPLE_UNIT = 'Dauerartikel'

// Einkaufsliste der Woche, aus den Rezepten des Wochenplans berechnet.
// Abgehakt wird pro Woche und Zutat, der Stand bleibt gespeichert.
// Dauerartikel stehen immer dabei, in ihrer Kategorie zwischen den anderen Zutaten.
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
  const [stapleCats, setStapleCats] = useKv<Record<string, string>>('stapleCats', {})
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

  // Dauerartikel in ihre Kategorie einsortieren
  for (const s of staples) {
    const cat = stapleCats[s] ?? 'Sonstiges'
    const list = groups.get(cat) ?? []
    list.push({ name: s, einheit: STAPLE_UNIT, menge: 0, kategorie: cat })
    groups.set(cat, list)
  }

  const key = (name: string, einheit: string) => `${monday}|${name}|${einheit}`
  let open = 0
  const shop = [...groups.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([cat, items]) => ({
      name: cat,
      items: items.map((it) => {
        const done = !!checked[key(it.name, it.einheit)]
        if (!done) open++
        const label = it.einheit === STAPLE_UNIT ? it.name : `${it.name} · ${Math.round(it.menge * 10) / 10} ${it.einheit}`
        return {
          name: label,
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

  async function addStaple(name: string) {
    const trimmed = name.trim()
    if (!trimmed || staples.includes(trimmed)) return
    await setStaples([...staples, trimmed])
    setNewStaple('')
  }

  async function removeStaple(name: string) {
    await setStaples(staples.filter((s) => s !== name))
  }

  async function setCategory(name: string, cat: string) {
    await setStapleCats({ ...stapleCats, [name]: cat })
  }

  return (
    <>
      <PrototypeScreen template={SHOP} ctx={{ shop, shopOpen: String(open) }} onAct={handleAct} />
      <div className="card form" style={{ marginTop: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>Dauerartikel</div>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Was du immer wieder kaufst, z. B. Gouda oder Toast. Du wählst die Kategorie, damit sie im Markt an der richtigen Stelle steht.
        </p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            void addStaple(newStaple)
          }}
        >
          <input className="input" placeholder="z. B. Gouda" value={newStaple} onChange={(e) => setNewStaple(e.target.value)} aria-label="Dauerartikel" />
          <button type="submit" className="btn small" disabled={!newStaple.trim()}>Hinzufügen</button>
        </form>
        {staples.map((s) => (
          <div className="list-item" key={s}>
            <span className="grow">{s}</span>
            <select
              className="select"
              style={{ maxWidth: 150 }}
              value={stapleCats[s] ?? 'Sonstiges'}
              onChange={(e) => void setCategory(s, e.target.value)}
              aria-label={`Kategorie von ${s}`}
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="button" className="btn ghost small danger" aria-label={`${s} entfernen`} onClick={() => removeStaple(s)}>×</button>
          </div>
        ))}
        <div className="section-title" style={{ margin: '4px 0 0' }}>Vorschläge für Eiweiß und Sättigung</div>
        <div className="chips">
          {SUGGESTIONS.filter((s) => !staples.includes(s)).map((s) => (
            <button key={s} type="button" className="chip" onClick={() => void addStaple(s)}>
              + {s}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
