import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useKv } from '../lib/store'
import { useRecipes } from '../lib/recipes'
import { addDays, dateKey, formatDay } from '../lib/dates'
import { defaultSlot, findRecipe, type TrainingFile } from '../lib/content'
import type { Todo } from '../lib/todos'
import { Cat } from '../components/Cat'
import { estimateMeal, fileToBase64, type MealEntry, type MealEstimate } from '../lib/meals'

type Tab = 'today' | 'calendar' | 'food' | 'training' | 'money' | 'more'

const GLASSES = 12 // 12 Gläser à 250 ml = 3 Liter
const GOAL_LITERS = 3
const GLASS_ML = 250
const DEFAULT_SUPPLEMENTS = ['Omega-3', 'Magnesium', 'Kreatin', 'Vitamin D']
const DEFAULT_TRAINING_TARGET = 4
const DEFAULT_GOAL_WEIGHT = 58
const DEFAULT_BALL_GOAL = 30
const REACTIONS = ['Miau!', 'Schnurr… das tut gut.', 'Schön, dass du da bist.', 'Kraul mich weiter, ich mag das.']

// Farben der Startseite: warm und ruhig, mit einem olivgrünen Akzent
const T = {
  bg: '#f6eee3',
  card: '#fffdf8',
  line: '#ecdcc8',
  text: '#3f2e20',
  muted: '#8a6f58',
  accent: '#e8793a',
  warn: '#c4703f',
}

// Startseite: Warum, Ziel am Ball, Supplements, Training der Woche, Gewicht zum Ziel, Mochi.
export function Today({ onNavigate, onOpenSos }: { onNavigate: (tab: Tab) => void; onOpenSos: () => void }) {
  const [today] = useState(() => dateKey())
  const weekIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const monday = addDays(today, -weekIndex)
  const sunday = addDays(monday, 6)

  const [warum, setWarum] = useKv<string>('warum', 'Wieder an mein Anfangsgewicht und stärker werden.')
  const [ballStart, setBallStart] = useKv<string | null>('ballStart', null)
  const [ballGoal, setBallGoal] = useKv<number>('ballGoal', DEFAULT_BALL_GOAL)
  const [supplements] = useKv<string[]>('supplements', DEFAULT_SUPPLEMENTS)
  const [suppDone, setSuppDone] = useKv<Record<string, string[]>>('supplementsDone', {})
  const [trainingTarget] = useKv<number>('trainingTarget', DEFAULT_TRAINING_TARGET)
  const [goalWeight] = useKv<number>('goalWeight', DEFAULT_GOAL_WEIGHT)
  const [measures] = useKv<{ log: { date: string; gewicht: number }[] }>('measures', { log: [] })
  const [workoutLog] = useKv<{ date: string }[]>('workoutLog', [])
  const [guided] = useKv<{ date: string }[]>('guidedWorkouts', [])
  const [rides] = useKv<{ log: { date: string }[] }>('rides', { log: [] })
  const [drinks, setDrinks] = useKv<Record<string, { ml: number; t: string; ts: number }[]>>('drinks', {})
  const [todos, setTodos] = useKv<Todo[]>('todos', [])
  const [taskDone, setTaskDone] = useKv<Record<string, boolean>>('taskDone', {})
  const [trainingContent] = useKv<TrainingFile | null>('content.training', null)
  const [trainingWeeks] = useKv<Record<string, { plan: string[] }>>('trainingWeeks', {})
  const [mealsState] = useKv<{ weeks: Record<string, string[]> }>('meals', { weeks: {} })
  const [mochiName, setMochiName] = useKv<string>('mochiName', 'Mochi')
  const content = useRecipes()
  const events = useLiveQuery(() => db.events.where('date').equals(today).sortBy('time'), [today], [])

  // Ab heute gezählt, wenn noch kein Startdatum gesetzt ist
  useEffect(() => {
    if (ballStart === null) void setBallStart(today)
  }, [ballStart, today, setBallStart])

  const [reacting, setReacting] = useState(false)
  const [reactIdx, setReactIdx] = useState(0)
  const [mIdx, setMIdx] = useState(0)

  // Mahlzeiten: Text oder Foto, grob eingeschätzt
  const [mealLog, setMealLog] = useKv<Record<string, MealEntry[]>>('mealLog', {})
  const [mealText, setMealText] = useState('')
  const [mealBusy, setMealBusy] = useState(false)
  const [mealError, setMealError] = useState('')
  const [pending, setPending] = useState<MealEstimate | null>(null)
  const todayMeals = mealLog[today] ?? []
  // Tagessumme aus den beschriebenen oder fotografierten Mahlzeiten, gerundet, nur als Richtung
  const todayKcal = Math.round(todayMeals.reduce((s, m) => s + (m.kcal ?? 0), 0) / 50) * 50
  const todayProtein = Math.round(todayMeals.reduce((s, m) => s + (m.eiweissG ?? 0), 0) / 5) * 5
  // Schnelle Einschätzung: ein Tipp pro Mahlzeit, ohne Text
  const [quick, setQuick] = useKv<Record<string, string[]>>('mealQuick', {})
  const quickToday = quick[today] ?? []

  // Am-Ball-Zähler und Ziel
  const startDay = ballStart ?? today
  const daysOnBall = Math.max(1, Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${startDay}T12:00:00`).getTime()) / 86400000) + 1)
  const ballPct = Math.min(100, (daysOnBall / ballGoal) * 100)

  // Supplements heute
  const doneToday = suppDone[today] ?? []
  const suppCount = supplements.filter((s) => doneToday.includes(s)).length
  // Wie viele Tage in Folge ein Supplement genommen wurde. Ist heute noch offen, zählt die Serie bis gestern.
  const streakOfSupp = (name: string) => {
    let n = 0
    let d = doneToday.includes(name) ? today : addDays(today, -1)
    while ((suppDone[d] ?? []).includes(name)) {
      n++
      d = addDays(d, -1)
    }
    return n
  }

  // Training in dieser Woche: jeder Tag mit einer Einheit zählt einmal
  const weekDates = new Set<string>()
  const inWeek = (d: string) => d >= monday && d <= sunday
  for (const w of workoutLog) if (inWeek(w.date)) weekDates.add(w.date)
  for (const g of guided) if (inWeek(g.date)) weekDates.add(g.date)
  for (const r of rides.log) if (inWeek(r.date)) weekDates.add(r.date)
  const trainedThisWeek = weekDates.size

  // Wochenringe: an wie vielen Tagen dieser Woche (bis heute) alle Supplements und genug Wasser
  const weekSoFar = Array.from({ length: weekIndex + 1 }, (_, i) => addDays(monday, i))
  const suppWeekDays = weekSoFar.filter((d) => supplements.every((s) => (suppDone[d] ?? []).includes(s))).length
  const waterWeekDays = weekSoFar.filter((d) => (drinks[d] ?? []).reduce((s, x) => s + x.ml, 0) >= 2000).length

  // Gewicht zum Ziel
  const latestWeight = measures.log.length ? measures.log[measures.log.length - 1].gewicht : undefined

  // Wasser heute
  const water = (drinks[today] ?? []).reduce((sum, d) => sum + d.ml, 0)
  const filled = Math.min(GLASSES, Math.floor(water / GLASS_ML))

  // Tagesring: was heute schon erledigt ist (Supplements, Training, Wasser ab 2 L, eine Mahlzeit)
  const trainedToday = weekDates.has(today)
  const ringTotal = supplements.length + 3
  const ringDone = suppCount + (trainedToday ? 1 : 0) + (water >= 2000 ? 1 : 0) + (todayMeals.length > 0 ? 1 : 0)
  const ringPct = Math.min(1, ringDone / ringTotal)
  const ringCirc = 2 * Math.PI * 36

  // Aufgaben heute: Mahlzeit, Training, Termine, To-dos
  const slot = mealsState.weeks[monday]?.[weekIndex] ?? defaultSlot(monday, weekIndex)
  const todayMeal = slot.startsWith('custom:') ? slot.slice(7) : findRecipe(content?.rezepte ?? [], slot)?.titel ?? 'Noch nichts geplant'
  const todayTraining = trainingWeeks[monday]?.plan?.[weekIndex] ?? trainingContent?.wochenplan_standard[weekIndex]?.split(': ')[1] ?? '–'
  const doneOf = (id: string) => !!taskDone[today + '|' + id]
  const taskList = [
    { id: 'meal', title: todayMeal, meta: 'Mahlzeit heute' },
    { id: 'training', title: todayTraining, meta: 'Training' },
    ...events.map((ev) => ({ id: 'ev:' + ev.id, title: ev.title, meta: ev.time ?? 'ganztägig' })),
  ]
  const dueTodos = todos.filter((td) => !td.date || td.date <= today)


  // Mochi: eine Zeile, die sich am Fortschritt orientiert, ohne Vorwurf
  const mochiMessages = [
    `Heute schon ${suppCount} von ${supplements.length} Supplements. Das reicht für den Anfang.`,
    `Diese Woche bist du ${trainedThisWeek} von ${trainingTarget} Mal im Training. Jedes Mal zählt.`,
    filled < GLASSES
      ? `Du hast ${(water / 1000).toFixed(1)} von ${GOAL_LITERS} Litern getrunken. Ich trinke auch gleich was.`
      : 'Drei Liter, perfekt. Das hast du geschafft.',
    `Du bist seit ${daysOnBall} Tagen dabei. Das ist mehr, als du denkst.`,
  ]
  const mochiText = reacting ? REACTIONS[reactIdx % REACTIONS.length] : mochiMessages[mIdx % mochiMessages.length]

  async function toggleSupplement(name: string) {
    const list = doneToday.includes(name) ? doneToday.filter((s) => s !== name) : [...doneToday, name]
    await setSuppDone({ ...suppDone, [today]: list })
  }

  async function addWater(ml: number) {
    const list = drinks[today] ?? []
    await setDrinks({ ...drinks, [today]: [...list, { ml, t: 'wasser', ts: Date.now() }] })
  }

  async function undoWater() {
    const list = drinks[today] ?? []
    if (list.length === 0) return
    await setDrinks({ ...drinks, [today]: list.slice(0, -1) })
  }

  async function runEstimate(input: { text?: string; imageBase64?: string; mediaType?: string }) {
    setMealBusy(true)
    setMealError('')
    try {
      setPending(await estimateMeal(input))
    } catch (e) {
      setMealError((e as Error).message)
    } finally {
      setMealBusy(false)
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    if (file.size > 4_000_000) {
      setMealError('Das Foto ist zu groß, bitte ein kleineres nehmen.')
      return
    }
    const imageBase64 = await fileToBase64(file)
    await runEstimate({ imageBase64, mediaType: file.type || 'image/jpeg' })
  }

  async function addQuick(rating: string) {
    await setQuick({ ...quick, [today]: [...quickToday, rating] })
  }

  async function saveMeal(est: MealEstimate) {
    const entry: MealEntry = { ...est, id: `m-${Date.now()}`, ts: Date.now() }
    await setMealLog({ ...mealLog, [today]: [...todayMeals, entry] })
    setPending(null)
    setMealText('')
  }

  function restartBall() {
    if (window.confirm('Neustart setzen? Ab heute zählt die Serie neu, deine bisherigen Tage bleiben im Verlauf.')) {
      void setBallStart(today)
    }
  }

  function changeBallGoal() {
    const n = Number(window.prompt('Wie viele Tage am Ball sind dein Ziel?', String(ballGoal)))
    if (n > 0) void setBallGoal(Math.round(n))
  }

  function touchMochi() {
    setReacting(true)
    setReactIdx((i) => i + 1)
    setMIdx((i) => i + 1)
    setTimeout(() => setReacting(false), 2500)
  }

  const card: React.CSSProperties = { background: T.card, borderRadius: 28, padding: 18, boxShadow: '0 8px 24px rgba(94,60,25,.08)' }
  const label: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 700, color: T.muted }
  const big: React.CSSProperties = { margin: '4px 0 0', fontWeight: 900, fontSize: 24, lineHeight: 1, color: T.text, letterSpacing: -0.5 }
  const bar: React.CSSProperties = { height: 6, background: T.line, marginTop: 10, position: 'relative', overflow: 'hidden' }
  const barFill = (pct: number, color: string): React.CSSProperties => ({ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color })
  const pill = (on: boolean): React.CSSProperties => ({
    border: `1.5px solid ${on ? T.accent : T.line}`,
    background: on ? T.accent : 'transparent',
    color: on ? '#fffaf0' : T.text,
    padding: '10px 14px',
    fontWeight: 800,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    cursor: 'pointer',
  })
  const ghostBtn: React.CSSProperties = { border: 'none', borderRadius: 99, background: '#f3e7d6', color: T.text, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }

  return (
    <section style={{ background: T.bg, margin: '-16px', padding: '16px 16px 24px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: T.muted }}>{formatDay(today)}</p>
        <h1 style={{ margin: '2px 0 0', fontWeight: 900, fontSize: 24, letterSpacing: -0.5, textTransform: 'uppercase', color: T.text }}>Heute</h1>
      </div>

      {/* Mochi */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <button type="button" onClick={touchMochi} aria-label="Mochi antippen" style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
          <svg viewBox="-42 -34 84 64" className={reacting ? 'mochi-cat mochi-react' : 'mochi-cat'} style={{ width: 92, height: 'auto', display: 'block' }} aria-hidden="true">
            <Cat x={0} y={0} happy={reacting} />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0, background: T.card, border: `1px solid ${T.line}`, padding: '12px 14px' }}>
          <button type="button" onClick={() => { const n = window.prompt('Wie soll deine Katze heißen?', mochiName)?.trim(); if (n) void setMochiName(n) }} style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: T.accent, textTransform: 'uppercase', cursor: 'pointer' }}>
            {mochiName}
          </button>
          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: T.text }}>{mochiText}</p>
        </div>
      </div>

      {/* Warum und Ziel am Ball */}
      <div style={card}>
        <p style={label}>Mein Warum</p>
        <input
          style={{ marginTop: 4, width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.line}`, padding: '2px 0', fontWeight: 700, fontSize: 14, color: T.text, outline: 'none' }}
          value={warum}
          onChange={(e) => void setWarum(e.target.value)}
          aria-label="Mein Warum"
        />
        <div style={{ marginTop: 16 }}>
          <div className="row between">
            <p style={label}>Am Ball</p>
            <button type="button" style={ghostBtn} onClick={changeBallGoal}>Ziel {ballGoal}</button>
          </div>
          <p style={big}>{daysOnBall}<span style={{ fontSize: 18, color: T.muted }}> / {ballGoal} Tage</span></p>
          <div style={bar}><span style={barFill(ballPct, T.accent)} /></div>
        </div>
        <div className="row between" style={{ marginTop: 14 }}>
          <span style={{ fontSize: 12, color: T.muted }}>Seit {formatDay(startDay)}</span>
          <button type="button" style={ghostBtn} onClick={restartBall}>Neustart</button>
        </div>
      </div>

      {/* Tagesring */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
          <circle cx="44" cy="44" r="36" stroke={T.line} strokeWidth="8" fill="none" />
          <circle cx="44" cy="44" r="36" stroke={T.accent} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${ringPct * ringCirc} ${ringCirc}`} transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray .6s ease" }} />
          <text x="44" y="50" textAnchor="middle" fontSize="18" fontWeight="800" fill={T.text}>{Math.round(ringPct * 100)}%</text>
        </svg>
        <div>
          <p style={label}>Heute</p>
          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: T.text }}>{ringDone} von {ringTotal} erledigt</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.muted }}>Supplements, Training, Wasser und eine Mahlzeit.</p>
        </div>
      </div>

      {/* Diese Woche in Kreisen */}
      <div style={card}>
        <p style={label}>Diese Woche</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <Ring value={trainedThisWeek} total={trainingTarget} label="Training" />
          <Ring value={suppWeekDays} total={weekIndex + 1} label="Supplements" />
          <Ring value={waterWeekDays} total={weekIndex + 1} label="Wasser" />
        </div>
      </div>

      {/* Mahlzeit: schnell mit einem Tipp, Text oder Foto nur wenn du willst */}
      <div style={card}>
        <div className="row between">
          <p style={label}>Wie war dein Essen heute?</p>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.muted }}>{quickToday.length} eingetragen</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {['gut', 'okay', 'schwierig'].map((r) => (
            <button key={r} type="button" style={{ ...pill(false), flex: 1, textAlign: 'center' }} onClick={() => void addQuick(r)}>
              {r}
            </button>
          ))}
        </div>
        {(() => {
          const week = Object.entries(quick).filter(([d]) => inWeek(d)).flatMap(([, v]) => v)
          if (week.length === 0) return null
          const count = (r: string) => week.filter((x) => x === r).length
          return (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: T.muted }}>
              Diese Woche: {count('gut')} gut · {count('okay')} okay · {count('schwierig')} schwierig
            </p>
          )
        })()}
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 13, color: T.muted, cursor: 'pointer' }}>Genauer eintragen (Text oder Foto)</summary>
          <div style={{ marginTop: 10 }}>
        <p style={label}>Was hast du gegessen?</p>
        <textarea
          value={mealText}
          onChange={(e) => setMealText(e.target.value)}
          placeholder="z. B. Skyr mit Beeren und Nüssen, dazu ein Kaffee"
          style={{ width: '100%', minHeight: 64, marginTop: 8, border: `1px solid ${T.line}`, borderRadius: 14, padding: 10, background: T.bg, color: T.text, fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" style={ghostBtn} disabled={mealBusy || !mealText.trim()} onClick={() => void runEstimate({ text: mealText })}>Text schätzen</button>
          <label style={{ ...ghostBtn, display: 'inline-block' }}>
            Foto aufnehmen
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </label>
        </div>
        {mealBusy && <p style={{ margin: '8px 0 0', fontSize: 14, color: T.muted }}>Einen Moment, ich schaue mir das an…</p>}
        {mealError && <p style={{ margin: '8px 0 0', fontSize: 14, color: T.warn }}>{mealError}</p>}
        {pending && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: '#e7e9cf' }}>
            <p style={{ margin: 0, fontWeight: 800, color: T.text }}>{pending.name}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: T.text }}>ca. {pending.kcal} kcal · ca. {pending.eiweissG} g Eiweiß · Sättigung: {pending.saettigend}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: T.muted }}>{pending.hinweis}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" style={ghostBtn} onClick={() => setPending(null)}>Verwerfen</button>
              <button type="button" style={pill(true)} onClick={() => void saveMeal(pending)}>Übernehmen</button>
            </div>
          </div>
        )}
        {todayMeals.length > 0 && (
          <p style={{ margin: '12px 0 0', fontSize: 14, fontWeight: 800, color: T.text }}>
            Heute ungefähr: ca. {todayKcal} kcal · ca. {todayProtein} g Eiweiß
          </p>
        )}
        {todayMeals.map((m) => (
          <p key={m.id} style={{ margin: '8px 0 0', fontSize: 14, color: T.text }}><b>{m.name}</b> · ca. {m.kcal} kcal · {m.eiweissG} g Eiweiß</p>
        ))}
          </div>
        </details>
      </div>

      {/* Supplements */}
      <div style={card}>
        <div className="row between">
          <p style={label}>Supplements</p>
          <span style={{ fontSize: 13, fontWeight: 900, color: suppCount === supplements.length ? T.accent : T.muted }}>
            {suppCount}/{supplements.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {supplements.map((s) => {
            const done = doneToday.includes(s)
            const streak = streakOfSupp(s)
            return (
              <button key={s} type="button" onClick={() => void toggleSupplement(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: done ? '#fbe5d3' : 'transparent', border: `1px solid ${T.line}`, borderRadius: 14, padding: '10px 12px', color: T.text, cursor: 'pointer' }}>
                <span style={{ width: 24, height: 24, borderRadius: 99, border: `2px solid ${T.accent}`, background: done ? T.accent : 'transparent', color: '#fffdf8', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13, flex: 'none' }}>{done ? '✓' : ''}</span>
                <span style={{ flex: 1, fontWeight: 800 }}>{s}</span>
                <span style={{ fontSize: 12, color: T.muted }}>{streak > 0 ? `${streak} Tage in Folge` : 'Heute starten'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Training */}
      <div style={card}>
        <div className="row between">
          <p style={label}>Training diese Woche</p>
          <span style={{ fontSize: 13, fontWeight: 900, color: trainedThisWeek >= trainingTarget ? T.accent : T.muted }}>
            {trainedThisWeek}/{trainingTarget}
          </span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: T.text }}>Heute: {todayTraining}</p>
        <button type="button" style={{ ...ghostBtn, marginTop: 10 }} onClick={() => onNavigate('training')}>Zum Training</button>
      </div>

      {/* Wasser */}
      <div style={card}>
        <div className="row between">
          <p style={label}>Wasser</p>
          <span style={{ fontSize: 13, fontWeight: 900, color: T.muted }}>{(water / 1000).toFixed(1)}/{GOAL_LITERS} L</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 10 }}>
          {Array.from({ length: GLASSES }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label="Glas Wasser"
              onClick={() => void addWater(GLASS_ML)}
              style={{ height: 26, border: `1px solid ${T.line}`, background: i < filled ? T.accent : 'transparent', cursor: 'pointer' }}
            />
          ))}
        </div>
        {water > 0 && (
          <button type="button" style={{ ...ghostBtn, marginTop: 10 }} onClick={() => void undoWater()}>Letztes Glas zurück</button>
        )}
      </div>

      {/* Gewicht */}
      <div style={card}>
        <p style={label}>Gewicht</p>
        <p style={big}>{latestWeight !== undefined ? `${latestWeight}` : '–'}<span style={{ fontSize: 18, color: T.muted }}> kg · Ziel {goalWeight} kg</span></p>
        <button type="button" style={{ ...ghostBtn, marginTop: 10 }} onClick={() => onNavigate('food')}>Gewicht eintragen</button>
      </div>

      {/* Aufgaben */}
      <div style={card}>
        <p style={label}>Heute erledigen · {taskList.length + dueTodos.length}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {taskList.map((t) => {
            const done = doneOf(t.id)
            return (
              <button key={t.id} type="button" onClick={() => void setTaskDone({ ...taskDone, [today + '|' + t.id]: !done })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', background: 'transparent', border: `1px solid ${T.line}`, padding: '10px 12px', color: T.text, opacity: done ? 0.45 : 1, cursor: 'pointer' }}>
                <span>
                  <span style={{ display: 'block', fontWeight: 800, textDecoration: done ? 'line-through' : 'none' }}>{t.title}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>{t.meta}</span>
                </span>
                <span style={{ color: T.accent, fontWeight: 900 }}>{done ? '✓' : ''}</span>
              </button>
            )
          })}
          {dueTodos.map((td) => (
            <button key={td.id} type="button" onClick={() => void setTodos(todos.map((x) => (x.id === td.id ? { ...x, done: !x.done } : x)))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', background: 'transparent', border: `1px solid ${T.line}`, padding: '10px 12px', color: T.text, opacity: td.done ? 0.45 : 1, cursor: 'pointer' }}>
              <span>
                <span style={{ display: 'block', fontWeight: 800, textDecoration: td.done ? 'line-through' : 'none' }}>{td.title}</span>
                <span style={{ fontSize: 12, color: T.muted }}>{td.meta}</span>
              </span>
              <span style={{ color: T.accent, fontWeight: 900 }}>{td.done ? '✓' : ''}</span>
            </button>
          ))}
          {taskList.length === 0 && dueTodos.length === 0 && <p style={{ margin: 0, color: T.muted }}>Heute steht nichts an.</p>}
        </div>
      </div>

      <button type="button" onClick={onOpenSos} style={{ ...ghostBtn, width: '100%', padding: '14px', color: T.warn, borderColor: T.warn }}>Ruhe-Ecke öffnen</button>
      <button type="button" onClick={() => onNavigate('more')} style={{ ...ghostBtn, width: '100%', padding: '14px' }}>Mehr: Import, Export, Sync</button>
    </section>
  )
}

// Ring mit Anzahl in der Mitte, z. B. 2/4
function Ring({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(1, value / total) : 0
  const circ = 2 * Math.PI * 28
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="28" stroke={T.line} strokeWidth="7" fill="none" />
        <circle cx="36" cy="36" r="28" stroke={T.accent} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} transform="rotate(-90 36 36)" style={{ transition: "stroke-dasharray .6s ease" }} />
        <text x="36" y="42" textAnchor="middle" fontSize="16" fontWeight="800" fill={T.text}>{value}/{total}</text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 800, color: T.muted }}>{label}</span>
    </div>
  )
}
