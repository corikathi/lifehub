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
  limit: number // Insgesamt verfügbar im Monat
  categories: Category[]
  fixed: Fixed[]
  expenses: Expense[]
}

const DEFAULT_BUDGET: BudgetState = {
  limit: 1500,
  categories: [
    { name: 'Lebensmittel', limit: 420 },
    { name: 'Drogerie', limit: 60 },
    { name: 'Freizeit', limit: 200 },
    { name: 'Transport', limit: 120 },
    { name: 'Sonstiges', limit: 150 },
  ],
  fixed: [],
  expenses: [],
}

// Farben der Kategorien aus dem Prototyp, wiederholen sich bei mehr Kategorien
const CAT_COLORS = ['#e8b04a', '#8aa3b3', '#a9ba74', '#c9764a', '#7b6b9c', '#a9998a']

const money = (value: number) => `${value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €`

// Budget im Stil des Prototyps: Übrig-Betrag, Gesamtbudget, Kategorien mit Bearbeiten,
// Fixkosten und die letzten Ausgaben. Eingabe manuell, ohne Bankanbindung.
export function Geld() {
  const today = dateKey()
  const month = today.slice(0, 7)
  const [budget, setBudget] = useKv<BudgetState>('budget', DEFAULT_BUDGET)
  const [editCats, setEditCats] = useState(false)
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

  const spentIn = (name: string) => monthExpenses.filter((e) => e.category === name).reduce((s, e) => s + e.amount, 0)

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

  async function updateCategory(i: number, patch: Partial<Category>) {
    const categories = budget.categories.map((c, j) => (j === i ? { ...c, ...patch } : c))
    await setBudget({ ...budget, categories })
  }

  async function deleteCategory(i: number) {
    await setBudget({ ...budget, categories: budget.categories.filter((_, j) => j !== i) })
  }

  async function addCategory() {
    await setBudget({ ...budget, categories: [...budget.categories, { name: 'Neue Kategorie', limit: 50 }] })
  }

  const lastOfMonth = formatDay(`${month}-${String(lastDay).padStart(2, '0')}`, { day: 'numeric', month: 'numeric' })

  return (
    <section className="stack" style={{ gap: 18 }}>
      <header style={{ paddingTop: 6 }}>
        <p className="subtitle" style={{ margin: 0 }}>{formatDay(today, { month: 'long', year: 'numeric' })} · noch {daysLeft} Tage</p>
        <h1 className="title" style={{ margin: '2px 0 0' }}>Budget</h1>
      </header>

      <div className="money-hero">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Übrig für Lebensmittel &amp; Co.</p>
            <p className="big-number">{money(free)}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: '#6b5340' }}>
            <div><b>{money(perDay)}</b> pro Tag</div>
            <div>bis {lastOfMonth}</div>
          </div>
        </div>
        <div className="progress terra">
          <span style={{ width: `${Math.min(100, Math.max(0, ((spent + fixedTotal) / budget.limit) * 100))}%` }} />
        </div>
        <div className="row between">
          <span className="muted">Ausgaben {money(spent)}</span>
          <span className="muted">Fix {money(fixedTotal)}</span>
        </div>
        <label className="row between" style={{ marginTop: 4 }}>
          <span className="muted">Insgesamt verfügbar</span>
          <span className="row" style={{ gap: 6 }}>
            <input
              className="input"
              style={{ maxWidth: 130, textAlign: 'right' }}
              inputMode="decimal"
              value={budget.limit}
              onChange={(e) => setBudget({ ...budget, limit: Number(e.target.value.replace(',', '.')) || 0 })}
            />
            <span>€</span>
          </span>
        </label>
      </div>

      <div className="row between">
        <h2 className="section-heading">Budget nach Kategorie</h2>
        <button type="button" className="btn ghost small" onClick={() => setEditCats((v) => !v)}>
          {editCats ? 'Fertig' : 'Bearbeiten'}
        </button>
      </div>

      {editCats && (
        <div className="card stack" style={{ gap: 8 }}>
          {budget.categories.map((c, i) => (
            <div className="cat-edit" key={i}>
              <input className="input" value={c.name} onChange={(e) => updateCategory(i, { name: e.target.value })} aria-label="Kategoriename" />
              <input
                className="input"
                style={{ maxWidth: 110, textAlign: 'right' }}
                inputMode="decimal"
                value={c.limit}
                onChange={(e) => updateCategory(i, { limit: Math.max(0, Number(e.target.value.replace(',', '.')) || 0) })}
                aria-label="Budget"
              />
              <button type="button" className="btn ghost small danger" aria-label="Kategorie löschen" onClick={() => deleteCategory(i)}>×</button>
            </div>
          ))}
          <button type="button" className="btn small" style={{ background: '#e8b04a', borderColor: '#e8b04a', color: '#3d2a12' }} onClick={addCategory}>
            + Kategorie hinzufügen
          </button>
        </div>
      )}

      <div className="card stack" style={{ gap: 14 }}>
        {budget.categories.map((c, i) => {
          const used = spentIn(c.name)
          const over = used > c.limit
          const percent = c.limit ? Math.min(100, (used / c.limit) * 100) : 0
          return (
            <div key={`${c.name}-${i}`}>
              <div className="row between">
                <span style={{ fontWeight: 700 }}>{c.name}</span>
                <span style={{ color: over ? '#a2452a' : '#6b5340', fontSize: 13, fontWeight: 600 }}>
                  {money(Math.round(used))} / {money(c.limit)}
                </span>
              </div>
              <div className="progress" style={{ marginTop: 6 }}>
                <span style={{ width: `${percent}%`, background: over ? '#c9764a' : CAT_COLORS[i % CAT_COLORS.length] }} />
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
        <div className="row between">
          <h2 className="section-heading" style={{ margin: 0 }}>Ausgabe eintragen</h2>
        </div>
        <input className="input" inputMode="decimal" placeholder="Betrag in €, z. B. 12,50" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {budget.categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <input className="input" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!amount.trim()}>Speichern</button>
      </form>

      <h2 className="section-heading">Letzte Ausgaben</h2>
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

      <h2 className="section-heading">Fixkosten</h2>
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
