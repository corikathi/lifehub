// Helle Scottish Fold im flachen Illustrationsstil: einfache Formen, klarer Umriss,
// volle Farben ohne Verläufe. Sie schaut fröhlich, wenn der Tag gut läuft, und ruhig sonst.

const LINE = '#5a4632'
const FUR = '#f7efe2'
const FUR_SHADE = '#ead9bf'
const EAR_IN = '#f0c3b6'

export function Cat({ x, y, happy }: { x: number; y: number; happy: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`}>
      {/* Bodenschatten, flach */}
      <ellipse cx="0" cy="27" rx="24" ry="4.5" fill={LINE} opacity="0.15" />

      {/* Schwanz */}
      <path
        d="M12 19 C 32 22, 36 2, 28 -8"
        stroke={LINE}
        strokeWidth="7.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 19 C 32 22, 36 2, 28 -8"
        stroke={FUR}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      <g className="cat-breathe">
        {/* Körper */}
        <ellipse cx="0" cy="12" rx="19" ry="15" fill={FUR} stroke={LINE} strokeWidth="1.3" />
        <ellipse cx="0" cy="18" rx="9" ry="6.5" fill={FUR_SHADE} />

        {/* Pfoten */}
        <ellipse cx="-9" cy="24" rx="6" ry="4" fill={FUR} stroke={LINE} strokeWidth="1.1" />
        <ellipse cx="9" cy="24" rx="6" ry="4" fill={FUR} stroke={LINE} strokeWidth="1.1" />

        {/* Ohren: nach vorn geknickt und abgerundet */}
        <path
          d="M-13 -9 C -18 -14, -17 -22, -10 -22 C -6 -22, -4 -16, -6 -10 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M13 -9 C 18 -14, 17 -22, 10 -22 C 6 -22, 4 -16, 6 -10 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M-11.5 -12 C -13.5 -15, -13 -18, -10.5 -18.5 C -8.5 -18.5, -8 -15.5, -9 -13 Z" fill={EAR_IN} />
        <path d="M11.5 -12 C 13.5 -15, 13 -18, 10.5 -18.5 C 8.5 -18.5, 8 -15.5, 9 -13 Z" fill={EAR_IN} />

        {/* Kopf */}
        <circle cx="0" cy="-6" r="15.5" fill={FUR} stroke={LINE} strokeWidth="1.3" />

        {/* Augen */}
        {happy ? (
          <>
            <path d="M-9.5 -5.5 Q-6 -9.5 -2.5 -5.5" stroke={LINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M2.5 -5.5 Q6 -9.5 9.5 -5.5" stroke={LINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="-6" cy="-5.5" r="2.8" fill={LINE} />
            <circle cx="6" cy="-5.5" r="2.8" fill={LINE} />
            <circle cx="-5" cy="-6.6" r="0.9" fill="#fff" />
            <circle cx="7" cy="-6.6" r="0.9" fill="#fff" />
          </>
        )}

        {/* Nase und Mund */}
        <path d="M-1.6 -1.6 L1.6 -1.6 L0 0 Z" fill={LINE} />
        <path d="M0 0 Q-1.6 1.8 -3.2 1" stroke={LINE} strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M0 0 Q1.6 1.8 3.2 1" stroke={LINE} strokeWidth="0.8" fill="none" strokeLinecap="round" />

        {/* Schnurrhaare */}
        <g stroke={LINE} strokeWidth="0.5" opacity="0.7">
          <line x1="-8" y1="1" x2="-19" y2="0" />
          <line x1="-8" y1="2.5" x2="-19" y2="3.5" />
          <line x1="8" y1="1" x2="19" y2="0" />
          <line x1="8" y1="2.5" x2="19" y2="3.5" />
        </g>
      </g>

      {happy && (
        <text x="16" y="-26" fontSize="8" fill="#c4703f">♥</text>
      )}
    </g>
  )
}
