// Typen und Helfer für Rezepte und Training. Die Inhalte kommen aus dem Import
// (rezepte.json, training.json) und liegen lokal bzw. in Supabase, nicht im Repo.

export interface Zutat {
  name: string
  menge: number
  einheit: string
  kategorie: string
}

export interface Rezept {
  id: string
  titel: string
  hinweis: string
  zutaten_fuer_3: Zutat[]
  schritte: string[]
}

export interface RezepteFile {
  info: string
  rotation: string
  rezepte: Rezept[]
  basics_einkauf: Record<string, string[]>
}

export interface UebungDef {
  name: string
  saetze: string
  tipp: string
}

export interface Einheit {
  tag: string
  dauer: string
  uebungen: UebungDef[]
}

export interface Anleitung {
  so_gehts: string[]
  achte_auf: string[]
  vermeide: string[]
  bild_svg: string
}

export interface RadPhase {
  phase: string
  sekunden: number
  hart?: boolean
  widerstand_1_10?: number
  trittfrequenz?: string
  intensitaet?: number
}

export interface TrainingFile {
  wochenplan_standard: string[]
  einheiten: Record<string, Einheit>
  progression: { regel: string; pausen: Record<string, string> }
  alternativen_bei_besetztem_geraet: Record<string, string[]>
  anleitungen: Record<string, Anleitung>
  rad: { locker: { ziel_minuten: number }; intervalle: RadPhase[]; edm_ride: RadPhase[] }
}

// Wochentage: Index 0 = Montag
export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Anker: Woche mit dem Start von Rotation w1 (Montag)
const ROTATION_ANCHOR = '2026-09-21'

// Übungsname -> Schlüssel für Alternativen und Anleitungen
const GROUP_KEYS: [RegExp, string][] = [
  [/hip thrust|glute bridge/i, 'hip'],
  [/beinpresse/i, 'press'],
  [/brustpresse|bankdr/i, 'brust'],
  [/latzug|klimmzug/i, 'latzug'],
  [/abduktor/i, 'abd'],
  [/seitheben/i, 'seit'],
  [/trizeps/i, 'trizeps'],
  [/split squat/i, 'bss'],
  [/beinbeuger/i, 'curl_leg'],
  [/rudern|rudermaschine/i, 'rudern'],
  [/schulterpresse|schulterdr/i, 'schulter'],
  [/bizeps/i, 'bizeps'],
]

export function groupKeyFor(exercise: string): string | undefined {
  return GROUP_KEYS.find(([re]) => re.test(exercise))?.[1]
}

// "3 × 8–12 /S" -> { sets: 3, min: 8, max: 12 }
export function parseSets(text: string): { sets: number; min: number; max: number } {
  const m = text.match(/(\d+)\s*×\s*(\d+)\s*[–-]\s*(\d+)/)
  if (!m) return { sets: 3, min: 8, max: 12 }
  return { sets: Number(m[1]), min: Number(m[2]), max: Number(m[3]) }
}

// Pausenzeit aus der Progressionsregel: Beine/Brust bekommen mehr Zeit
export function restSecondsFor(exercise: string, pausen: Record<string, string>): number {
  const name = exercise.toLowerCase()
  const matchKey = Object.keys(pausen).find(
    (k) => k !== 'alle anderen' && k.split(',').some((part) => name.includes(part.trim().toLowerCase())),
  )
  const text = pausen[matchKey ?? 'alle anderen'] ?? ''
  const m = text.match(/(\d+)/)
  return m ? Number(m[1]) : 75
}

// Gewichts-Schritt bei doppelter Progression
export function incrementFor(exercise: string): number {
  return /seitheben|bizeps|trizeps/i.test(exercise) ? 1 : 2.5
}

// Rotation: welche Woche (1–4) gilt für einen Montag?
export function rotationWeek(weekKey: string): number {
  const ms = parseKey(weekKey).getTime() - parseKey(ROTATION_ANCHOR).getTime()
  const weeks = Math.round(ms / (7 * 24 * 3600 * 1000))
  return ((weeks % 4) + 4) % 4 + 1
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function defaultSlot(weekKey: string, dayIndex: number): string {
  return `w${rotationWeek(weekKey)}d${dayIndex}`
}

export function findRecipe(rezepte: Rezept[], id: string): Rezept | undefined {
  return rezepte.find((r) => r.id === id)
}

// Mengen von "für 3 Personen" auf die gewählte Personenzahl umrechnen.
// Hackfleisch wird fest mit 125 g pro Person gerechnet.
export function scaleAmount(z: Zutat, persons: number): number {
  if (/hackfleisch/i.test(z.name)) return 125 * persons
  return Math.round((z.menge * persons) / 3 * 10) / 10
}
