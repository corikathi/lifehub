// Helle Scottish Fold im flachen Illustrationsstil: einfache Formen, klarer Umriss,
// volle Farben ohne Verläufe. Die Ohren sind klein und nach vorn gefaltet, der Kopf
// ist rund mit Wangen. Sie schaut fröhlich, wenn der Tag gut läuft, und ruhig sonst.

const LINE = '#5a4632'
const FUR = '#f7efe2'
const FUR_SHADE = '#ead9bf'
const EAR_IN = '#f0c3b6'
const NOSE = '#e0a08f'

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
        {/* Körper: kompakt und rund */}
        <ellipse cx="0" cy="13" rx="17" ry="13" fill={FUR} stroke={LINE} strokeWidth="1.3" />
        <ellipse cx="0" cy="18" rx="8" ry="5.5" fill={FUR_SHADE} />

        {/* Pfoten */}
        <ellipse cx="-8" cy="24" rx="5.5" ry="3.8" fill={FUR} stroke={LINE} strokeWidth="1.1" />
        <ellipse cx="8" cy="24" rx="5.5" ry="3.8" fill={FUR} stroke={LINE} strokeWidth="1.1" />

        {/* Ohren: klein, nach vorn und unten geknickt, liegen am Kopf an */}
        <path
          d="M-13 -13 C -15 -18, -12 -21, -8 -20 C -5 -19, -4 -15, -5 -12 C -8 -11, -11 -11, -13 -13 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M13 -13 C 15 -18, 12 -21, 8 -20 C 5 -19, 4 -15, 5 -12 C 8 -11, 11 -11, 13 -13 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M-10.5 -14.5 C -11.5 -17, -9.5 -18, -8.5 -17.5 C -7 -17, -7 -15, -8 -13.5 C -9.5 -13.5, -10.2 -14, -10.5 -14.5 Z" fill={EAR_IN} />
        <path d="M10.5 -14.5 C 11.5 -17, 9.5 -18, 8.5 -17.5 C 7 -17, 7 -15, 8 -13.5 C 9.5 -13.5, 10.2 -14, 10.5 -14.5 Z" fill={EAR_IN} />

        {/* Kopf: rund, mit vollen Wangen */}
        <path
          d="M0 -20 C 12 -20, 17 -12, 17 -3 C 17 7, 11 12, 0 12 C -11 12, -17 7, -17 -3 C -17 -12, -12 -20, 0 -20 Z"
          fill={FUR}
          stroke={LINE}
          strokeWidth="1.3"
        />

        {/* Augen: klein und tief gesetzt, wie bei einer Scottish Fold */}
        {happy ? (
          <>
            <path d="M-9 -1 Q-6 -4.5 -3 -1" stroke={LINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M3 -1 Q6 -4.5 9 -1" stroke={LINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="-6" cy="-1" r="2.2" fill={LINE} />
            <circle cx="6" cy="-1" r="2.2" fill={LINE} />
            <circle cx="-5.3" cy="-1.8" r="0.7" fill="#fff" />
            <circle cx="6.7" cy="-1.8" r="0.7" fill="#fff" />
          </>
        )}

        {/* Nase und Mund */}
        <path d="M-1.8 3.2 Q0 2.2 1.8 3.2 Q0 5 -1.8 3.2 Z" fill={NOSE} stroke={LINE} strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M0 5 Q-1.4 6.8 -3.2 6" stroke={LINE} strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M0 5 Q1.4 6.8 3.2 6" stroke={LINE} strokeWidth="0.8" fill="none" strokeLinecap="round" />

        {/* Schnurrhaare */}
        <g stroke={LINE} strokeWidth="0.5" opacity="0.7">
          <line x1="-9" y1="4.5" x2="-19" y2="3" />
          <line x1="-9" y1="6" x2="-19" y2="7.5" />
          <line x1="9" y1="4.5" x2="19" y2="3" />
          <line x1="9" y1="6" x2="19" y2="7.5" />
        </g>
      </g>

      {happy && (
        <text x="16" y="-26" fontSize="8" fill="#c4703f">♥</text>
      )}
    </g>
  )
}
