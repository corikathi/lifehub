// Datums-Helfer. Alle Tage werden als lokale Strings "YYYY-MM-DD" gespeichert.

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

// Woche beginnt am Montag
export function weekDays(key: string): string[] {
  const d = parseKey(key)
  const offset = (d.getDay() + 6) % 7
  const monday = addDays(key, -offset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function formatDay(key: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  return parseKey(key).toLocaleDateString('de-DE', options)
}

export function greeting(hour: number = new Date().getHours()): string {
  if (hour < 5) return 'Gute Nacht'
  if (hour < 11) return 'Guten Morgen'
  if (hour < 17) return 'Hallo'
  if (hour < 22) return 'Guten Abend'
  return 'Gute Nacht'
}

// Serie: zählt zusammenhängende Tage bis heute (oder gestern, falls heute noch offen ist)
export function streakOf(doneDates: Set<string>, today: string): number {
  let count = 0
  let day = doneDates.has(today) ? today : addDays(today, -1)
  while (doneDates.has(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}
