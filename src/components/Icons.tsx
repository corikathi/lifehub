// Eigene Linien-Icons im Stil der Wohnung: runde Enden, warme Strichstärke.
// Sie erben die Farbe über currentColor, damit der aktive Tab farbig wird.

interface IconProps {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

// Haus mit Schornstein-Rauch: Heute
export function HomeIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 11.2 12 4.5l8 6.7" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-4.5h4v4.5" />
    </svg>
  )
}

// Kalenderblatt mit zwei Ringen: Kalender
export function CalendarIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="4" />
      <path d="M4 10.5h16" />
      <path d="M8.5 3.5v3.5M15.5 3.5v3.5" />
      <path d="M8.5 14h2.2M13.3 14h2.2M8.5 17h2.2" />
    </svg>
  )
}

// Schale mit Blatt: Essen
export function BowlIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 11h16a8 8 0 0 1-16 0Z" />
      <path d="M9 19.5h6" />
      <path d="M12 11V8.5" />
      <path d="M12 8.5c0-2 1.4-3.2 3.6-3.2 0 2.2-1.4 3.2-3.6 3.2Z" />
    </svg>
  )
}

// Hantel: Training
export function DumbbellIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6.5 8.5v7" />
      <path d="M17.5 8.5v7" />
      <path d="M3.5 10.5v3" />
      <path d="M20.5 10.5v3" />
      <path d="M6.5 12h11" />
    </svg>
  )
}

// Kleiner Topf mit Pflanze: Mehr
export function PotIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 13h10l-1.2 6.5H8.2Z" />
      <path d="M5.5 13h13" />
      <path d="M12 13V9.5" />
      <path d="M12 9.5C9.5 9.5 8 8 8 5.8c2.5 0 4 1.5 4 3.7Z" />
      <path d="M12 9.5c0-2.4 1.6-3.9 4.2-3.9 0 2.5-1.6 3.9-4.2 3.9Z" />
    </svg>
  )
}

// Münze mit Eurozeichen-Linie: Geld
export function CoinIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.6 0-2.5.8-2.5 2s.9 1.7 2.5 2c1.6.3 2.5.8 2.5 2s-.9 2-2.5 2c-1.2 0-2.1-.5-2.6-1.3" />
      <path d="M12 6.5V8m0 8v1.5" />
    </svg>
  )
}
