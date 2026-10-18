import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ComponentType } from 'react'
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
import { BowlIcon, CalendarIcon, DumbbellIcon, HomeIcon, PotIcon } from './components/Icons'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'more'

const TABS: { id: Tab; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'today', label: 'Heute', Icon: HomeIcon },
  { id: 'calendar', label: 'Kalender', Icon: CalendarIcon },
  { id: 'food', label: 'Essen', Icon: BowlIcon },
  { id: 'training', label: 'Training', Icon: DumbbellIcon },
  { id: 'more', label: 'Mehr', Icon: PotIcon },
]

function App() {
  const [tab, setTab] = useState<Tab>('today')
  // undefined = noch am Prüfen, null = abgemeldet
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [skipUnlock, setSkipUnlock] = useState(false)
  // undefined = noch am Laden, false = Daten fehlen noch
  const bundleLoaded = useLiveQuery(async () => !!(await db.kv.get('bundle.v1')), [], undefined)

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

  return (
    <div className="app">
      <main className="screen">
        {tab === 'today' && <Today onNavigate={setTab} />}
        {tab === 'calendar' && <Calendar />}
        {tab === 'food' && <Food />}
        {tab === 'training' && <Training />}
        {tab === 'more' && <More email={session.user.email} />}
      </main>

      <nav className="tabbar" aria-label="Hauptnavigation">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true"><t.Icon size={24} /></span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
