// Helle Scottish Fold im flachen Illustrationsstil: einfache Formen, klarer Umriss,
// volle Farben ohne Verläufe. Runder Kopf mit kurzer Schnauze, flach angelegte Ohren,
// kurzer Schwanz. Sie schaut fröhlich, wenn der Tag gut läuft, und ruhig sonst.

const LINE = '#5a4632'
const FUR = '#f7efe2'
const FUR_SHADE = '#ead9bf'
const EAR_IN = '#f0c3b6'
const NOSE = '#e0a08f'

export function Cat({ x, y, happy }: { x: number; y: number; happy: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`}>
      {/* Bodenschatten, flach */}
      <ellipse cx="0" cy="28" rx="24" ry="4.5" fill={LINE} opacity="0.15" />

      {/* Schwanz: kurz und buschig, liegt seitlich am Körper */}
      <path
        d="M16 23 C 25 25, 28 19, 24 15"
        stroke={LINE}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 23 C 25 25, 28 19, 24 15"
        stroke={FUR}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      <g className="cat-breathe">
        {/* Körper: dick und rund */}
        <ellipse cx="0" cy="15" rx="19" ry="13" fill={FUR} stroke={LINE} strokeWidth="1.3" />
        <ellipse cx="0" cy="20" rx="9" ry="5" fill={FUR_SHADE} />

        {/* Pfoten, vorn nebeneinander */}
        <ellipse cx="-8" cy="25" rx="6" ry="3.6" fill={FUR} stroke={LINE} strokeWidth="1.1" />
        <ellipse cx="8" cy="25" rx="6" ry="3.6" fill={FUR} stroke={LINE} strokeWidth="1.1" />

        {/* Ohren: flach nach vorn gefaltet, sitzen seitlich am Kopf */}
        <path
          d="M-16 -7 C -19 -12, -16 -18, -10 -17 C -7 -16, -6 -12, -8 -8 C -11 -6, -14 -6, -16 -7 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M16 -7 C 19 -12, 16 -18, 10 -17 C 7 -16, 6 -12, 8 -8 C 11 -6, 14 -6, 16 -7 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M-13.5 -10 C -14.5 -13, -12.5 -15, -10.5 -14.5 C -9 -14, -9 -12, -10 -10.5 C -11.5 -10, -13 -10, -13.5 -10 Z" fill={EAR_IN} />
        <path d="M13.5 -10 C 14.5 -13, 12.5 -15, 10.5 -14.5 C 9 -14, 9 -12, 10 -10.5 C 11.5 -10, 13 -10, 13.5 -10 Z" fill={EAR_IN} />

        {/* Kopf: breit und rund mit vollen Wangen, kurze Schnauze */}
        <path
          d="M0 -18 C 14 -18, 19 -10, 19 -1 C 19 9, 12 14, 0 14 C -12 14, -19 9, -19 -1 C -19 -10, -14 -18, 0 -18 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.3"
        />

        {/* Augen: rund, tief gesetzt */}
        {happy ? (
          <>
            <path d="M-10 0 Q-7 -3.5 -4 0" stroke={LINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M4 0 Q7 -3.5 10 0" stroke={LINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="-7" cy="0" r="2.6" fill={LINE} />
            <circle cx="7" cy="0" r="2.6" fill={LINE} />
            <circle cx="-6" cy="-0.9" r="0.8" fill="#fff" />
            <circle cx="8" cy="-0.9" r="0.8" fill="#fff" />
          </>
        )}

        {/* Nase klein und rund, Mund als kleines W */}
        <ellipse cx="0" cy="4.5" rx="2" ry="1.4" fill={NOSE} stroke={LINE} strokeWidth="0.6" />
        <path d="M0 6 Q-1.5 7.6 -3.4 6.8" stroke={LINE} strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M0 6 Q1.5 7.6 3.4 6.8" stroke={LINE} strokeWidth="0.8" fill="none" strokeLinecap="round" />

        {/* Schnurrhaare: kurz, damit es nicht nach Ratte aussieht */}
        <g stroke={LINE} strokeWidth="0.5" opacity="0.6">
          <line x1="-10" y1="5" x2="-16" y2="4" />
          <line x1="-10" y1="7" x2="-16" y2="8" />
          <line x1="10" y1="5" x2="16" y2="4" />
          <line x1="10" y1="7" x2="16" y2="8" />
        </g>
      </g>

      {happy && (
        <text x="16" y="-24" fontSize="8" fill="#c4703f">♥</text>
      )}
    </g>
  )
}
