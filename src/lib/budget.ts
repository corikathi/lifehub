import { dateKey } from './dates'

// Budget im Stil des Prototyps. Alte Daten aus der ersten Version werden übernommen.
export interface BudgetCategory {
  name: string
  limit: number
}

export interface BudgetExpense {
  id: string
  name: string
  cat: string
  date: string
  amount: number
}

export interface BudgetV2 {
  avail: number // Insgesamt verfügbar
  income: number
  saving: { target: number; saved: number; monthly: number }
  categories: BudgetCategory[]
  expenses: BudgetExpense[]
}

// Ab diesem Monat zählt das Budget. Ausgaben davor werden nicht berechnet.
export const BUDGET_START = '2026-11'

export const DEFAULT_BUDGET: BudgetV2 = {
  avail: 1500,
  income: 2600,
  saving: { target: 3000, saved: 1860, monthly: 300 },
  categories: [
    { name: 'Lebensmittel', limit: 420 },
    { name: 'Drogerie', limit: 60 },
    { name: 'Freizeit', limit: 200 },
    { name: 'Transport', limit: 120 },
    { name: 'Sonstiges', limit: 150 },
  ],
  expenses: [],
}

// Übernimmt die Daten aus der ersten Version (limit, note) in die neue Form
export function normalizeBudget(raw: unknown): BudgetV2 {
  const r = (raw ?? {}) as Record<string, unknown>
  if (typeof r.avail === 'number') return { ...DEFAULT_BUDGET, ...(r as Partial<BudgetV2>) }
  const oldExpenses = Array.isArray(r.expenses) ? (r.expenses as Record<string, unknown>[]) : []
  return {
    ...DEFAULT_BUDGET,
    avail: typeof r.limit === 'number' ? r.limit : DEFAULT_BUDGET.avail,
    categories: Array.isArray(r.categories) ? (r.categories as BudgetCategory[]) : DEFAULT_BUDGET.categories,
    expenses: oldExpenses.map((e, i) => ({
      id: String(e.id ?? `old-${i}`),
      name: String(e.note ?? e.name ?? e.category ?? 'Ausgabe'),
      cat: String(e.category ?? e.cat ?? 'Sonstiges'),
      date: String(e.date ?? dateKey()),
      amount: Number(e.amount ?? 0),
    })),
  }
}

export const eur = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'
