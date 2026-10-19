import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { CSSProperties } from 'react'
import { Today } from './screens/Today'
import { Calendar } from './screens/Calendar'
import { Food } from './screens/Food'
import { Training } from './screens/Training'
import { More } from './screens/More'
import { Login } from './screens/Login'
import { supabase } from './lib/supabase'
import { startSync, syncOnLogin } from './lib/sync'
import { Unlock } from './screens/Unlock'
import { db } from './db'
import { useLiveQuery } from 'dexie-react-hooks'
import { Geld } from './screens/Geld'
import { Ruhe } from './screens/Ruhe'
import { PrototypeScreen } from './components/PrototypeScreen'
import { NAV } from './prototype/nav'
import { SHEET } from './prototype/sheet'
import { readKv, writeKv } from './lib/store'
import { DEFAULT_BUDGET, normalizeBudget } from './lib/budget'
import { dateKey } from './lib/dates'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'money' | 'more'

const ACTIVE = '#5d6b3d'
const IDLE = '#a8957c'
const KINDS = ['To-do', 'Termin', 'Ausgabe', 'Einkauf', 'Gewohnheit']
const PLACEHOLDER: Record<string, string> = {
  'To-do': 'Was steht an?',
  Termin: 'z. B. Friseur',
  Ausgabe: 'z. B. Bäcker',
  Einkauf: 'z. B. Haferflocken',
  Gewohnheit: 'z. B. Wasser trinken',
}

interface SheetState {
  open: boolean
  kind: string
  draft: string
  amount: string
  cat: string
  time: string
}

// Container der unteren Leiste aus dem Prototyp (am Telefonrahmen ausgerichtet)
const NAV_STYLE: CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 0,
  width: '100%',
  maxWidth: 560,
  padding: '8px 8px 22px',
  background: '#fffaf0',
  borderTop: '1px solid #ecdcc0',
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  alignItems: 'end',
  zIndex: 10,
}

const NAV_TABS: Record<string, Tab> = {
  'nav:heute': 'today',
  'nav:woche': 'calendar',
  'nav:essen': 'food',
  'nav:training': 'training',
  'nav:geld': 'money',
  'nav:mehr': 'more',
}

function App() {
  const [tab, setTab] = useState<Tab>('today')
  // undefined = noch am Prüfen, null = abgemeldet
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [skipUnlock, setSkipUnlock] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const [sheet, setSheet] = useState<SheetState>({ open: false, kind: 'To-do', draft: '', amount: '', cat: 'Lebensmittel', time: '18:00' })
  // undefined = noch am Laden, false = Daten fehlen noch
  const bundleLoaded = useLiveQuery(async () => !!(await db.kv.get('bundle.v1')), [], undefined)
  const [budgetRaw] = [useLiveQuery(() => readKv<unknown>('budget', DEFAULT_BUDGET), [], DEFAULT_BUDGET)]
  const categories = normalizeBudget(budgetRaw).categories

  useEffect(() => {
    startSync()
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (next && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        void syncOnLogin(next.user.id)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="app">
        <main className="screen" style={{ display: 'grid', placeItems: 'center' }}>
          <p className="muted">Lade…</p>
        </main>
      </div>
    )
  }

  if (session === null) return <Login />

  if (bundleLoaded === false && !skipUnlock) {
    return <Unlock onSkip={() => setSkipUnlock(true)} />
  }

  function openSheet(kind = sheet.kind) {
    setSheet((s) => ({ ...s, open: true, kind }))
  }

  async function addItem() {
    const title = sheet.draft.trim()
    if (!title) return
    const today = dateKey()
    if (sheet.kind === 'Ausgabe') {
      const amount = Number(sheet.amount.replace(',', '.')) || 0
      const budget = normalizeBudget(await readKv<unknown>('budget', DEFAULT_BUDGET))
      await writeKv('budget', {
        ...budget,
        expenses: [...budget.expenses, { id: `e-${Date.now()}`, name: title, cat: sheet.cat, date: today, amount }],
      })
    } else if (sheet.kind === 'Gewohnheit') {
      await db.habits.add({ name: title, createdAt: Date.now() })
    } else if (sheet.kind === 'Termin') {
      await db.events.add({ date: today, title, time: sheet.time || undefined })
    } else {
      // To-do und Einkauf landen in der Liste „Heute erledigen“
      const todos = await readKv<{ id: string; title: string; meta: string; tag: string; done: boolean }[]>('todos', [])
      const isShop = sheet.kind === 'Einkauf'
      await writeKv('todos', [
        ...todos,
        { id: `t-${Date.now()}`, title: isShop ? `${title} kaufen` : title, meta: isShop ? 'Einkauf' : 'To-do', tag: isShop ? 'Einkauf' : 'To-do', done: false },
      ])
    }
    setSheet((s) => ({ ...s, open: false, draft: '', amount: '' }))
  }

  function handleNav(action: string) {
    if (action === 'sheet:open') openSheet()
    else if (NAV_TABS[action]) setTab(NAV_TABS[action])
  }

  function handleSheet(action: string) {
    if (action === 'sheet:close') setSheet((s) => ({ ...s, open: false }))
    else if (action.startsWith('kind:')) setSheet((s) => ({ ...s, kind: action.slice(5) }))
    else if (action.startsWith('cat:')) setSheet((s) => ({ ...s, cat: action.slice(4) }))
    else if (action === 'add') void addItem()
  }

  function handleSheetChange(key: string, value: string) {
    if (key === 'draft') setSheet((s) => ({ ...s, draft: value }))
    else if (key === 'amount') setSheet((s) => ({ ...s, amount: value }))
    else if (key === 'time') setSheet((s) => ({ ...s, time: value }))
  }

  const navCtx = {
    goHeute: 'nav:heute',
    goWoche: 'nav:woche',
    goEssen: 'nav:essen',
    goTraining: 'nav:training',
    goGeld: 'nav:geld',
    openSheet: 'sheet:open',
    tc: {
      heute: tab === 'today' ? ACTIVE : IDLE,
      woche: tab === 'calendar' ? ACTIVE : IDLE,
      essen: tab === 'food' ? ACTIVE : IDLE,
      training: tab === 'training' ? ACTIVE : IDLE,
      geld: tab === 'money' ? ACTIVE : IDLE,
    },
  }

  const sheetCtx = {
    sheetOpen: sheet.open,
    closeSheet: 'sheet:close',
    kinds: KINDS.map((k) => ({
      name: k,
      bg: sheet.kind === k ? '#4a3828' : '#f2e8d6',
      ink: sheet.kind === k ? '#fffaf0' : '#4a3828',
      pick: `kind:${k}`,
    })),
    draft: sheet.draft,
    draftPh: PLACEHOLDER[sheet.kind] ?? '',
    setDraft: 'draft',
    draftAmount: sheet.amount,
    setAmount: 'amount',
    catChips: categories.map((c) => ({
      name: c.name,
      bg: sheet.cat === c.name ? '#e8b04a' : '#f2e8d6',
      ink: '#4a3828',
      pick: `cat:${c.name}`,
    })),
    isAusgabe: sheet.kind === 'Ausgabe',
    isTermin: sheet.kind === 'Termin',
    draftTime: sheet.time,
    setTime: 'time',
    addItem: 'add',
  }

  return (
    <div className="app">
      <main className="screen">
        {sosOpen && <Ruhe onClose={() => setSosOpen(false)} />}
        {!sosOpen && tab === 'today' && <Today onNavigate={setTab} onOpenSos={() => setSosOpen(true)} />}
        {tab === 'calendar' && <Calendar />}
        {tab === 'food' && <Food />}
        {tab === 'training' && <Training />}
        {tab === 'money' && <Geld onOpenSheet={(kind) => openSheet(kind === 'Ausgabe' ? 'Ausgabe' : sheet.kind)} />}
        {tab === 'more' && <More email={session.user.email} />}
      </main>

      <PrototypeScreen template={NAV} ctx={navCtx} onAct={handleNav} style={NAV_STYLE} />
      <PrototypeScreen template={SHEET} ctx={sheetCtx} onAct={handleSheet} onChange={handleSheetChange} />
    </div>
  )
}

export default App
