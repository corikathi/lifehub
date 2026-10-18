import { Cat } from './Cat'

// Kleine Wohnzimmer-Szene als Kopf des Heute-Tabs. Die Farben folgen der Tageszeit.

function palette(hour: number) {
  if (hour >= 6 && hour < 11) return { sky: '#f9d9a6', sun: '#fff3c4', wall: '#f3e2c7', glow: 0.25 }
  if (hour >= 11 && hour < 17) return { sky: '#f6e6c0', sun: '#fff8d6', wall: '#f5e8d2', glow: 0.1 }
  if (hour >= 17 && hour < 21) return { sky: '#f2b98a', sun: '#ffd49a', wall: '#ecd3b3', glow: 0.45 }
  return { sky: '#3b3557', sun: '#f5e7b8', wall: '#4a4062', glow: 0.7 }
}

export function CozyScene({
  hour = new Date().getHours(),
  mood = 'calm',
}: {
  hour?: number
  mood?: 'happy' | 'calm'
}) {
  const p = palette(hour)
  const night = hour >= 21 || hour < 6

  return (
    <svg
      viewBox="0 0 360 130"
      role="img"
      aria-label="Gemütliches Wohnzimmer"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Wand */}
      <rect x="0" y="0" width="360" height="130" rx="18" fill={p.wall} />
      {/* Fenster */}
      <rect x="36" y="18" width="88" height="76" rx="44" fill={p.sky} stroke="#b08a5e" strokeWidth="5" />
      <line x1="80" y1="18" x2="80" y2="94" stroke="#b08a5e" strokeWidth="4" />
      <line x1="36" y1="56" x2="124" y2="56" stroke="#b08a5e" strokeWidth="4" />
      {night ? (
        <>
          <circle cx="104" cy="36" r="9" fill="#fff8d6" />
          <circle cx="60" cy="40" r="1.6" fill="#fff" />
          <circle cx="96" cy="72" r="1.4" fill="#fff" />
          <circle cx="66" cy="78" r="1.2" fill="#fff" />
        </>
      ) : (
        <circle cx="104" cy="34" r="10" fill={p.sun} />
      )}
      {/* Lampe mit Lichtschein */}
      <ellipse cx="282" cy="62" rx="70" ry="54" fill="#ffd98a" opacity={p.glow} />
      <path d="M262 26 L302 26 L296 46 L268 46 Z" fill="#c4703f" />
      <line x1="282" y1="46" x2="282" y2="78" stroke="#8d7459" strokeWidth="3" />
      <ellipse cx="282" cy="80" rx="14" ry="4" fill="#8d7459" />
      {/* Regal mit Pflanze */}
      <rect x="150" y="84" width="60" height="6" rx="3" fill="#b08a5e" />
      <path d="M160 90 L200 90 L196 110 L164 110 Z" fill="#c4703f" />
      <path d="M180 88 C170 70 158 66 152 54 C168 56 180 66 180 88 Z" fill="#8c9a63" />
      <path d="M180 88 C188 68 200 62 210 56 C206 72 194 84 180 88 Z" fill="#5d6b3d" />
      <path d="M180 88 C180 76 176 62 174 48 C186 58 186 74 180 88 Z" fill="#8c9a63" />
      {/* Teppich */}
      <ellipse cx="180" cy="122" rx="120" ry="8" fill="#e2c69f" opacity="0.7" />
      {/* Kerze auf dem Tisch */}
      <rect x="22" y="104" width="14" height="18" rx="3" fill="#fffaf2" />
      <path d="M29 96 C26 100 27 103 29 103 C31 103 32 100 29 96 Z" fill="#f2a04f" />
      <Cat x={318} y={100} happy={mood === 'happy'} />
    </svg>
  )
}
