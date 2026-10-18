import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Today } from './screens/Today'
import { Calendar } from './screens/Calendar'
import { Food } from './screens/Food'
import { Training } from './screens/Training'
import { More } from './screens/More'
import { Login } from './screens/Login'
import { supabase } from './lib/supabase'
import { startSync, syncOnLogin } from './lib/sync'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'more'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Heute', icon: '🏡' },
  { id: 'calendar', label: 'Kalender', icon: '📅' },
  { id: 'food', label: 'Essen', icon: '🥗' },
  { id: 'training', label: 'Training', icon: '🏋️' },
  { id: 'more', label: 'Mehr', icon: '✨' },
]

function App() {
  const [tab, setTab] = useState<Tab>('today')
  // undefined = noch am Prüfen, null = abgemeldet
  const [session, setSession] = useState<Session | null | undefined>(undefined)

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
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
