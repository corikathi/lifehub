import { useState } from 'react'
import { Today } from './screens/Today'
import { Calendar } from './screens/Calendar'
import { Food } from './screens/Food'
import { Training } from './screens/Training'

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

  return (
    <div className="app">
      <main className="screen">
        {tab === 'today' && <Today onNavigate={setTab} />}
        {tab === 'calendar' && <Calendar />}
        {tab === 'food' && <Food />}
        {tab === 'training' && <Training />}
        {tab === 'more' && (
          <section className="stack">
            <h1 className="title">Mehr</h1>
            <div className="card">
              <p className="muted">Hier kommen bald Stimmung, Journal, Ziele und Wochenrückblick hin.</p>
            </div>
          </section>
        )}
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
