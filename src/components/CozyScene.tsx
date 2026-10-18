import { Cat } from './Cat'

// Dein Zimmer. Es wächst mit deinem Fortschritt: Stufe 0 ist fast leer, mit jeder Stufe
// kommen Pflanze, Lampe, Regal und Teppich dazu. Licht und Fenster folgen der Tageszeit.

function light(hour: number) {
  if (hour >= 6 && hour < 11) return { wall: '#f6e7cf', sky: '#cfe6ea', glow: 0.25, sun: true }
  if (hour >= 11 && hour < 17) return { wall: '#f7ecd9', sky: '#bfe0e6', glow: 0.1, sun: true }
  if (hour >= 17 && hour < 21) return { wall: '#f3dcc0', sky: '#f1c49a', glow: 0.5, sun: true }
  return { wall: '#5a4d6a', sky: '#2e3450', glow: 0.8, sun: false }
}

export function CozyScene({
  hour = new Date().getHours(),
  level = 0,
  mood = 'calm',
}: {
  hour?: number
  level?: number
  mood?: 'happy' | 'calm'
}) {
  const p = light(hour)
  const night = !p.sun

  return (
    <svg
      viewBox="0 0 360 200"
      role="img"
      aria-label="Dein Zimmer mit Katze"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 26 }}
    >
      {/* Wand und Boden */}
      <rect x="0" y="0" width="360" height="200" rx="26" fill={p.wall} />
      <rect x="0" y="150" width="360" height="50" rx="0" fill="#e2c9a4" />
      <path d="M0 150 L360 150" stroke="#c9ab80" strokeWidth="2" />

      {/* Fenster mit Himmel */}
      <rect x="36" y="32" width="86" height="72" rx="10" fill={p.sky} stroke="#b08a5e" strokeWidth="5" />
      <line x1="79" y1="32" x2="79" y2="104" stroke="#b08a5e" strokeWidth="4" />
      <line x1="36" y1="68" x2="122" y2="68" stroke="#b08a5e" strokeWidth="4" />
      {night ? (
        <>
          <circle cx="100" cy="48" r="8" fill="#fff6d6" />
          <circle cx="56" cy="50" r="1.4" fill="#fff" />
          <circle cx="66" cy="84" r="1.2" fill="#fff" />
        </>
      ) : (
        <circle cx="104" cy="50" r="9" fill="#fff4cf" />
      )}

      {/* Bild an der Wand */}
      <rect x="150" y="38" width="44" height="34" rx="4" fill="#fffaf0" stroke="#b08a5e" strokeWidth="3" />
      <path d="M156 66 L170 52 L180 62 L186 56 L190 66 Z" fill="#8c9a63" />

      {/* Sofa */}
      <rect x="150" y="104" width="112" height="34" rx="14" fill="#c4703f" />
      <rect x="140" y="112" width="18" height="32" rx="8" fill="#b35f33" />
      <rect x="252" y="112" width="18" height="32" rx="8" fill="#b35f33" />
      <rect x="160" y="96" width="84" height="14" rx="7" fill="#d68a5c" />

      {/* Lampe: ab Stufe 2 */}
      {level >= 2 && (
        <>
          <ellipse cx="312" cy="82" rx="58" ry="46" fill="#ffd98a" opacity={p.glow} />
          <path d="M296 40 L328 40 L322 60 L302 60 Z" fill="#e8b04a" />
          <line x1="312" y1="60" x2="312" y2="112" stroke="#8d6a4a" strokeWidth="3" />
          <ellipse cx="312" cy="114" rx="12" ry="3.5" fill="#8d6a4a" />
        </>
      )}

      {/* Pflanze: ab Stufe 1 */}
      {level >= 1 && (
        <g>
          <path d="M28 150 L50 150 L46 176 L32 176 Z" fill="#c4703f" />
          <path d="M39 150 C 28 130, 22 118, 16 104 C 30 108, 40 124, 39 150 Z" fill="#8c9a63" />
          <path d="M39 150 C 46 128, 58 118, 68 110 C 64 126, 52 142, 39 150 Z" fill="#5d6b3d" />
          <path d="M39 150 C 40 136, 36 122, 34 108 C 46 118, 46 136, 39 150 Z" fill="#8c9a63" />
        </g>
      )}

      {/* Regal mit Büchern: ab Stufe 3 */}
      {level >= 3 && (
        <g>
          <rect x="256" y="46" width="88" height="6" rx="2" fill="#8d6a4a" />
          <rect x="256" y="92" width="88" height="6" rx="2" fill="#8d6a4a" />
          <rect x="262" y="58" width="8" height="34" fill="#8c9a63" />
          <rect x="272" y="62" width="7" height="30" fill="#c4703f" />
          <rect x="281" y="56" width="9" height="36" fill="#e8b04a" />
          <rect x="302" y="60" width="8" height="32" fill="#8c9a63" />
          <rect x="312" y="64" width="9" height="28" fill="#d9a07a" />
        </g>
      )}

      {/* Teppich: ab Stufe 4 */}
      {level >= 4 && <ellipse cx="200" cy="184" rx="110" ry="10" fill="#d9a07a" opacity="0.7" />}

      {/* Katze auf dem Teppich bzw. Boden */}
      <Cat x={80} y={170} happy={mood === 'happy'} />
    </svg>
  )
}
