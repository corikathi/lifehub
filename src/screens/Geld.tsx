import { useState } from 'react'
import { useKv } from '../lib/store'
import { dateKey, formatDay } from '../lib/dates'

interface Category {
  name: string
  limit: number
}

interface Fixed {
  name: string
  amount: number
}

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  note: string
}

interface BudgetState {
  limit: number // Monatsbudget gesamt
  categories: Category[]
  fixed: Fixed[]
  expenses: Expense[]
}

const DEFAULT_BUDGET: BudgetState = {
  limit: 1500,
  categories: [
    { name: 'Essen', limit: 400 },
    { name: 'Training', limit: 80 },
    { name: 'Freizeit', limit: 150 },
    { name: 'Sonstiges', limit: 200 },
  ],
  fixed: [],
  expenses: [],
}

const money = (value: number) => `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €`

// Monatsbudget: manuelle Eingabe, ohne Bankanbindung
export function Geld() {
  const today = dateKey()
  const month = today.slice(0, 7)
  const [budget, setBudget] = useKv<BudgetState>('budget', DEFAULT_BUDGET)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(budget.categories[0]?.name ?? 'Sonstiges')
  const [note, setNote] = useState('')
  const [fixedName, setFixedName] = useState('')
  const [fixedAmount, setFixedAmount] = useState('')

  const monthExpenses = budget.expenses.filter((e) => e.date.startsWith(month))
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const fixedTotal = budget.fixed.reduce((s, f) => s + f.amount, 0)
  const free = budget.limit - fixedTotal - spent
  const lastDay = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()
  const daysLeft = Math.max(1, lastDay - Number(today.slice(8, 10)) + 1)
  const perDay = Math.max(0, free) / daysLeft

  async function addExpense() {
    const value = Number(amount.replace(',', '.'))
    if (!value) return
    const entry: Expense = { id: `e-${Date.now()}`, date: today, amount: value, category, note: note.trim() }
    await setBudget({ ...budget, expenses: [...budget.expenses, entry] })
    setAmount('')
    setNote('')
  }

  async function removeExpense(id: string) {
    await setBudget({ ...budget, expenses: budget.expenses.filter((e) => e.id !== id) })
  }

  async function addFixed() {
    const value = Number(fixedAmount.replace(',', '.'))
    if (!fixedName.trim() || !value) return
    await setBudget({ ...budget, fixed: [...budget.fixed, { name: fixedName.trim(), amount: value }] })
    setFixedName('')
    setFixedAmount('')
  }

  async function setLimit(value: number) {
    await setBudget({ ...budget, limit: value })
  }

  return (
    <section className="stack">
      <header>
        <p className="subtitle">{formatDay(today, { month: 'long', year: 'numeric' })} · noch {daysLeft} Tage</p>
        <h1 className="title">Geld</h1>
      </header>

      <div className="money-hero">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Noch frei diesen Monat</p>
            <p className="big-number">{money(free)}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: '#6b5340' }}>
            <div><b>{money(perDay)}</b> pro Tag</div>
            <div>bis Monatsende</div>
          </div>
        </div>
        <div className="progress terra" style={{ marginTop: 8 }}>
          <span style={{ width: `${Math.min(100, Math.max(0, ((spent + fixedTotal) / budget.limit) * 100))}%` }} />
        </div>
        <div className="row between" style={{ marginTop: 8 }}>
          <span className="muted">Ausgaben {money(spent)}</span>
          <span className="muted">Fix {money(fixedTotal)}</span>
        </div>
        <label className="row" style={{ marginTop: 10 }}>
          <span className="muted">Monatsbudget</span>
          <input
            className="input"
            style={{ maxWidth: 140 }}
            inputMode="decimal"
            value={budget.limit}
            onChange={(e) => setLimit(Number(e.target.value.replace(',', '.')) || 0)}
          />
        </label>
      </div>

      <div className="section-title">Kategorien</div>
      <div className="card stack" style={{ gap: 12 }}>
        {budget.categories.map((c) => {
          const used = monthExpenses.filter((e) => e.category === c.name).reduce((s, e) => s + e.amount, 0)
          const percent = c.limit ? Math.min(100, (used / c.limit) * 100) : 0
          return (
            <div key={c.name}>
              <div className="row between">
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span className="muted">{money(used)} / {money(c.limit)}</span>
              </div>
              <div className="progress" style={{ marginTop: 4 }}>
                <span style={{ width: `${percent}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          void addExpense()
        }}
      >
        <div className="section-title" style={{ margin: 0 }}>Ausgabe eintragen</div>
        <input className="input" inputMode="decimal" placeholder="Betrag, z. B. 12,50" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {budget.categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <input className="input" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!amount.trim()}>Speichern</button>
      </form>

      <div className="section-title">Letzte Ausgaben</div>
      <div className="card">
        {monthExpenses.length === 0 && <p className="empty">Noch keine Ausgaben diesen Monat.</p>}
        {[...monthExpenses].reverse().slice(0, 12).map((e) => (
          <div className="list-item" key={e.id}>
            <span className="time">{formatDay(e.date, { day: 'numeric', month: 'short' })}</span>
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{money(e.amount)} · {e.category}</div>
              {e.note && <p className="muted">{e.note}</p>}
            </div>
            <button type="button" className="btn ghost small danger" aria-label="Ausgabe löschen" onClick={() => removeExpense(e.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="section-title">Fixkosten</div>
      <div className="card">
        {budget.fixed.length === 0 && <p className="empty">z. B. Miete, Handy, Versicherungen.</p>}
        {budget.fixed.map((f, i) => (
          <div className="list-item" key={`${f.name}-${i}`}>
            <div className="grow">{f.name}</div>
            <span className="muted">{money(f.amount)}</span>
            <button type="button" className="btn ghost small danger" aria-label={`${f.name} löschen`} onClick={() => setBudget({ ...budget, fixed: budget.fixed.filter((_, j) => j !== i) })}>×</button>
          </div>
        ))}
        <form
          className="form"
          style={{ marginTop: 10 }}
          onSubmit={(e) => {
            e.preventDefault()
            void addFixed()
          }}
        >
          <input className="input" placeholder="Name" value={fixedName} onChange={(e) => setFixedName(e.target.value)} />
          <input className="input" placeholder="Betrag im Monat" inputMode="decimal" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} />
          <button className="btn" type="submit">Fixkosten hinzufügen</button>
        </form>
      </div>
    </section>
  )
}
