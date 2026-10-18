import { Cat } from './Cat'

// Flache Landschafts-Szene als Kopf des Heute-Tabs: Hügel, Bäume, ein Häuschen mit
// warmem Licht und die Katze davor. Himmel und Licht folgen der Tageszeit.

function palette(hour: number) {
  if (hour >= 6 && hour < 11)
    return { skyTop: '#cfe6e2', skyBottom: '#eef7f4', sun: '#fff4d6', hillFar: '#b9d6cd', hillNear: '#98c2b5', tree: '#7fb0a1', window: '#ffe2a0', night: false }
  if (hour >= 11 && hour < 17)
    return { skyTop: '#c4e0dc', skyBottom: '#e9f5f2', sun: '#fff7dc', hillFar: '#afd0c6', hillNear: '#8dbcaf', tree: '#6fa597', window: '#ffe09a', night: false }
  if (hour >= 17 && hour < 21)
    return { skyTop: '#c9d6e2', skyBottom: '#eef2f4', sun: '#ffdca8', hillFar: '#b4c7c9', hillNear: '#8fb0aa', tree: '#6d9a90', window: '#ffcf7a', night: false }
  return { skyTop: '#3f5566', skyBottom: '#6d8590', sun: '#f7ebc4', hillFar: '#4f6a72', hillNear: '#3f5c62', tree: '#557a72', window: '#ffd27a', night: true }
}

export function CozyScene({
  hour = new Date().getHours(),
  mood = 'calm',
}: {
  hour?: number
  mood?: 'happy' | 'calm'
}) {
  const p = palette(hour)
  const id = `sky-${hour}`

  return (
    <svg
      viewBox="0 0 360 170"
      role="img"
      aria-label="Ein kleines Haus in der Landschaft mit einer Katze davor"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 22 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.skyTop} />
          <stop offset="100%" stopColor={p.skyBottom} />
        </linearGradient>
      </defs>

      {/* Himmel */}
      <rect x="0" y="0" width="360" height="170" rx="22" fill={`url(#${id})`} />

      {/* Sonne oder Mond */}
      {p.night ? (
        <circle cx="300" cy="36" r="13" fill={p.sun} />
      ) : (
        <circle cx="300" cy="40" r="16" fill={p.sun} />
      )}
      {p.night && (
        <>
          <circle cx="60" cy="28" r="1.6" fill="#fff" />
          <circle cx="130" cy="18" r="1.2" fill="#fff" />
          <circle cx="200" cy="30" r="1.4" fill="#fff" />
        </>
      )}

      {/* Ferne Hügel */}
      <path d="M0 110 C 60 80, 120 96, 180 84 C 240 72, 300 96, 360 82 L360 170 L0 170 Z" fill={p.hillFar} />

      {/* Bäume hinten */}
      <g fill={p.tree} opacity="0.9">
        <path d="M262 96 L274 62 L286 96 Z" />
        <path d="M278 100 L292 68 L306 100 Z" />
        <path d="M24 92 L34 66 L44 92 Z" />
      </g>

      {/* Nahe Hügel */}
      <path d="M0 128 C 70 104, 150 124, 220 116 C 280 110, 330 122, 360 116 L360 170 L0 170 Z" fill={p.hillNear} />

      {/* Haus */}
      <g>
        <rect x="112" y="92" width="62" height="48" rx="4" fill="#f7fbf9" />
        <path d="M104 96 L143 66 L182 96 Z" fill="#d9a07a" />
        <rect x="136" y="110" width="14" height="30" rx="3" fill="#8d6a4a" />
        <rect x="156" y="104" width="12" height="12" rx="2" fill={p.window} />
        <rect x="120" y="104" width="12" height="12" rx="2" fill={p.window} />
        {/* Schornstein mit Rauch */}
        <rect x="150" y="70" width="8" height="16" fill="#a25f3a" />
        <circle cx="154" cy="64" r="3" fill="#f7fbf9" opacity="0.8" />
        <circle cx="158" cy="56" r="2.2" fill="#f7fbf9" opacity="0.6" />
      </g>

      {/* Weg zur Tür */}
      <path d="M140 140 L132 170 L160 170 L150 140 Z" fill="#e2c69f" opacity="0.8" />

      {/* Bäume vorn */}
      <g>
        <rect x="46" y="118" width="5" height="20" fill="#7a5a3a" />
        <circle cx="48" cy="110" r="14" fill={p.tree} />
        <rect x="200" y="122" width="4" height="16" fill="#7a5a3a" />
        <circle cx="202" cy="116" r="11" fill={p.tree} />
      </g>

      {/* Katze auf dem Weg */}
      <Cat x={246} y={140} happy={mood === 'happy'} />
    </svg>
  )
}
