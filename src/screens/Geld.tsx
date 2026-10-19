import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey, formatDay } from '../lib/dates'
import { BUDGET } from '../prototype/budget'
import { PrototypeScreen } from '../components/PrototypeScreen'
import { BUDGET_START, DEFAULT_BUDGET, eur, normalizeBudget, type BudgetCategory, type BudgetV2 } from '../lib/budget'

const CAT_COLORS = ['#e8b04a', '#8aa3b3', '#a9ba74', '#c9764a', '#7b6b9c', '#a9998a']

// Während des Bearbeitens stehen die Werte im Speicher der Seite. So geht beim schnellen Tippen
// nichts verloren, weil die Datenbank erst später antwortet.
interface CatDraft {
  name: string
  limit: string
}

// Budget 1:1 aus dem Prototyp. Zahlen kommen aus unseren Daten.
export function Geld({ onOpenSheet }: { onOpenSheet: (kind: string) => void }) {
  const today = dateKey()
  // Vor dem Startmonat zeigt das Budget den Startmonat, ohne Ausgaben davor
  const started = today.slice(0, 7) >= BUDGET_START
  const month = started ? today.slice(0, 7) : BUDGET_START
  const [raw, setRaw] = useKv<unknown>('budget', DEFAULT_BUDGET)
  const budget = normalizeBudget(raw)
  const [editCats, setEditCats] = useState(false)
  const [catDraft, setCatDraft] = useState<CatDraft[] | null>(null)
  const [availDraft, setAvailDraft] = useState<string | null>(null)

  const save = (next: BudgetV2) => setRaw(next)
  const monthExpenses = budget.expenses.filter((e) => e.date.startsWith(month))
  const spentIn = (name: string) => monthExpenses.filter((e) => e.cat === name).reduce((s, e) => s + e.amount, 0)
  const varSpent = budget.categories.reduce((s, c) => s + spentIn(c.name), 0)
  const free = Math.max(0, budget.avail - varSpent)
  const [yearNum, monthNum] = month.split('-').map(Number)
  const lastDay = new Date(yearNum, monthNum, 0).getDate()
  const daysLeft = started ? Math.max(1, lastDay - Number(today.slice(8, 10)) + 1) : lastDay
  const { target, saved, monthly } = budget.saving
  const months = monthly > 0 ? Math.ceil(Math.max(0, target - saved) / monthly) : 0

  // Zeilen für den Bearbeiten-Modus: beim Tippen die Entwurfswerte, sonst die gespeicherten
  const rows: CatDraft[] = catDraft ?? budget.categories.map((c) => ({ name: c.name, limit: String(c.limit) }))

  const ctx = {
    isGeld: true,
    availStr: availDraft ?? String(budget.avail).replace('.', ','),
    moneyLeft: eur(Math.round(free)),
    perDay: eur(Math.round(free / daysLeft)),
    editCats,
    editLabel: editCats ? 'Fertig' : 'Bearbeiten',
    toggleEdit: 'cat:toggle',
    catRows: rows.map((r, i) => ({
      name: r.name,
      budget: r.limit,
      setName: `cat:name:${i}`,
      setBudget: `cat:budget:${i}`,
      del: `cat:del:${i}`,
    })),
    addCat: 'cat:add',
    cats: budget.categories.map((c, i) => {
      const used = spentIn(c.name)
      const over = used > c.limit
      return {
        name: c.name,
        val: `${eur(Math.round(used))} / ${eur(c.limit)}`,
        valInk: over ? '#a2452a' : '#6b5340',
        w: `${c.limit ? Math.min(100, (used / c.limit) * 100) : 0}%`,
        bg: over ? '#c9764a' : CAT_COLORS[i % CAT_COLORS.length],
      }
    }),
    // Die Liste zeigt jede Ausgabe, auch vor dem Startmonat. Gezählt wird nur ab dem Startmonat.
    recent: [...budget.expenses].reverse().slice(0, 6).map((e) => ({
      name: e.name,
      cat: e.cat,
      when: formatDay(e.date, { day: 'numeric', month: 'short' }),
      amount: '−' + eur(e.amount),
      bg: CAT_COLORS[Math.max(0, budget.categories.findIndex((c) => c.name === e.cat)) % CAT_COLORS.length],
    })),
    addExpense: 'sheet:Ausgabe',
    savePct: `${target ? Math.round((saved / target) * 100) : 0}%`,
    saveText: `${eur(saved)} von ${eur(target)} · mit ${eur(monthly)} im Monat in ${months} Monaten erreicht`,
    setAvail: 'avail',
  }

  // Kategorien speichern, im Bearbeiten-Modus zusätzlich den Entwurf aktualisieren
  function commitCats(next: BudgetCategory[]) {
    if (catDraft) setCatDraft(next.map((c) => ({ name: c.name, limit: String(c.limit) })))
    void save({ ...budget, categories: next })
  }

  function handleAct(action: string) {
    if (action === 'cat:toggle') {
      if (editCats) {
        setCatDraft(null)
      } else {
        setCatDraft(budget.categories.map((c) => ({ name: c.name, limit: String(c.limit) })))
      }
      setEditCats((v) => !v)
    } else if (action === 'cat:add') commitCats([...budget.categories, { name: 'Neue Kategorie', limit: 50 }])
    else if (action.startsWith('cat:del:')) {
      const i = Number(action.slice(8))
      commitCats(budget.categories.filter((_, j) => j !== i))
    } else if (action.startsWith('sheet:')) onOpenSheet(action.slice(6))
  }

  function handleChange(key: string, value: string) {
    if (key === 'avail') {
      setAvailDraft(value)
      void save({ ...budget, avail: Math.max(0, Number(value.replace(',', '.')) || 0) })
    } else if (key.startsWith('cat:name:')) {
      const i = Number(key.slice(9))
      const draft = rows.map((r, j) => (j === i ? { ...r, name: value } : r))
      setCatDraft(draft)
      void save({ ...budget, categories: budget.categories.map((c, j) => (j === i ? { ...c, name: value } : c)) })
    } else if (key.startsWith('cat:budget:')) {
      const i = Number(key.slice(11))
      const limit = Math.max(0, Number(value.replace(',', '.')) || 0)
      // Der Entwurf behält die getippte Schreibweise, z. B. "550" oder "5,"
      const draft = rows.map((r, j) => (j === i ? { ...r, limit: value } : r))
      setCatDraft(draft)
      void save({ ...budget, categories: budget.categories.map((c, j) => (j === i ? { ...c, limit } : c)) })
    }
  }

  return (
    <>
      {!started && (
        <div className="card">
          <p style={{ margin: 0 }}>
            Das Budget startet am 1. November 2026. Bis dahin werden Ausgaben nicht gezählt.
          </p>
        </div>
      )}
      <PrototypeScreen template={BUDGET} ctx={ctx} onAct={handleAct} onChange={handleChange} />
    </>
  )
}
