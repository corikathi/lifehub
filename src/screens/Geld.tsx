import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey, formatDay } from '../lib/dates'
import { BUDGET } from '../prototype/budget'
import { PrototypeScreen } from '../components/PrototypeScreen'
import { DEFAULT_BUDGET, eur, normalizeBudget, type BudgetV2 } from '../lib/budget'

const CAT_COLORS = ['#e8b04a', '#8aa3b3', '#a9ba74', '#c9764a', '#7b6b9c', '#a9998a']

// Budget 1:1 aus dem Prototyp. Zahlen kommen aus unseren Daten.
export function Geld({ onOpenSheet }: { onOpenSheet: (kind: string) => void }) {
  const today = dateKey()
  const month = today.slice(0, 7)
  const [raw, setRaw] = useKv<unknown>('budget', DEFAULT_BUDGET)
  const budget = normalizeBudget(raw)
  const [editCats, setEditCats] = useState(false)

  const save = (next: BudgetV2) => setRaw(next)
  const monthExpenses = budget.expenses.filter((e) => e.date.startsWith(month))
  const spentIn = (name: string) => monthExpenses.filter((e) => e.cat === name).reduce((s, e) => s + e.amount, 0)
  const varSpent = budget.categories.reduce((s, c) => s + spentIn(c.name), 0)
  const free = Math.max(0, budget.avail - varSpent)
  const lastDay = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()
  const daysLeft = Math.max(1, lastDay - Number(today.slice(8, 10)) + 1)
  const { target, saved, monthly } = budget.saving
  const months = monthly > 0 ? Math.ceil(Math.max(0, target - saved) / monthly) : 0

  const ctx = {
    isGeld: true,
    availStr: String(budget.avail).replace('.', ','),
    moneyLeft: eur(Math.round(free)),
    perDay: eur(Math.round(free / daysLeft)),
    editCats,
    editLabel: editCats ? 'Fertig' : 'Bearbeiten',
    toggleEdit: 'cat:toggle',
    catRows: budget.categories.map((c, i) => ({
      name: c.name,
      budget: String(c.limit).replace('.', ','),
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
    recent: [...monthExpenses].reverse().slice(0, 6).map((e) => ({
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

  function handleAct(action: string) {
    if (action === 'cat:toggle') setEditCats((v) => !v)
    else if (action === 'cat:add') void save({ ...budget, categories: [...budget.categories, { name: 'Neue Kategorie', limit: 50 }] })
    else if (action.startsWith('cat:del:')) {
      const i = Number(action.slice(8))
      void save({ ...budget, categories: budget.categories.filter((_, j) => j !== i) })
    } else if (action.startsWith('sheet:')) onOpenSheet(action.slice(6))
  }

  function handleChange(key: string, value: string) {
    if (key === 'avail') {
      void save({ ...budget, avail: Math.max(0, Number(value.replace(',', '.')) || 0) })
    } else if (key.startsWith('cat:name:')) {
      const i = Number(key.slice(9))
      void save({ ...budget, categories: budget.categories.map((c, j) => (j === i ? { ...c, name: value } : c)) })
    } else if (key.startsWith('cat:budget:')) {
      const i = Number(key.slice(11))
      const limit = Math.max(0, Number(value.replace(',', '.')) || 0)
      void save({ ...budget, categories: budget.categories.map((c, j) => (j === i ? { ...c, limit } : c)) })
    }
  }

  return <PrototypeScreen template={BUDGET} ctx={ctx} onAct={handleAct} onChange={handleChange} />
}
