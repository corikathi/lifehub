// Helle Scottish Fold mit 3D-Anmutung: cremiges Fell mit Verlauf, runde nach vorn
// geknickte Ohren, große bernsteinfarbene Augen und sanftes Atmen.
// Sie schaut fröhlich, wenn der Tag gut läuft, und ruhig sonst.

export function Cat({ x, y, happy }: { x: number; y: number; happy: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`}>
      <defs>
        <radialGradient id="catFur" cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fffdf8" />
          <stop offset="60%" stopColor="#f1e4d2" />
          <stop offset="100%" stopColor="#d6c4aa" />
        </radialGradient>
        <radialGradient id="catBelly" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#efe2cf" />
        </radialGradient>
        <radialGradient id="catEye" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f5c76a" />
          <stop offset="100%" stopColor="#b57a2a" />
        </radialGradient>
        <radialGradient id="catShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5a4632" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#5a4632" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bodenschatten */}
      <ellipse cx="0" cy="27" rx="26" ry="6" fill="url(#catShadow)" />

      {/* Schwanz, weich und leicht buschig */}
      <path d="M12 19 C 32 22, 36 2, 28 -8" stroke="#d6c4aa" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M12 19 C 32 22, 36 2, 28 -8" stroke="#fffdf8" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8" transform="translate(-1 -1)" />

      <g className="cat-breathe">
        {/* Körper */}
        <ellipse cx="0" cy="12" rx="19" ry="15" fill="url(#catFur)" stroke="#c9b597" strokeWidth="0.6" />
        <ellipse cx="0" cy="17" rx="10" ry="8" fill="url(#catBelly)" />

        {/* Pfoten */}
        <ellipse cx="-9" cy="24" rx="6" ry="4" fill="#fffdf8" stroke="#c9b597" strokeWidth="0.5" />
        <ellipse cx="9" cy="24" rx="6" ry="4" fill="#fffdf8" stroke="#c9b597" strokeWidth="0.5" />

        {/* Ohren: bei der Scottish Fold nach vorn geknickt und abgerundet */}
        <path d="M-13 -9 C -18 -14, -17 -22, -10 -22 C -6 -22, -4 -16, -6 -10 Z" fill="#f4e9da" stroke="#c9b597" strokeWidth="0.6" />
        <path d="M13 -9 C 18 -14, 17 -22, 10 -22 C 6 -22, 4 -16, 6 -10 Z" fill="#f4e9da" stroke="#c9b597" strokeWidth="0.6" />
        <path d="M-11.5 -12 C -14 -15, -13.5 -18, -10.5 -18.5 C -8.5 -18.5, -8 -15.5, -9 -13 Z" fill="#f2b8ae" opacity="0.6" />
        <path d="M11.5 -12 C 14 -15, 13.5 -18, 10.5 -18.5 C 8.5 -18.5, 8 -15.5, 9 -13 Z" fill="#f2b8ae" opacity="0.6" />

        {/* Kopf: rund und voll */}
        <circle cx="0" cy="-6" r="15.5" fill="url(#catFur)" stroke="#c9b597" strokeWidth="0.6" />

        {/* Augen: groß, bernsteinfarben */}
        {happy ? (
          <>
            <path d="M-9.5 -5.5 Q-6 -9.5 -2.5 -5.5" stroke="#5a4632" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M2.5 -5.5 Q6 -9.5 9.5 -5.5" stroke="#5a4632" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="-6" cy="-5.5" rx="3.2" ry="3.6" fill="url(#catEye)" />
            <ellipse cx="6" cy="-5.5" rx="3.2" ry="3.6" fill="url(#catEye)" />
            <ellipse cx="-6" cy="-5.5" rx="1.4" ry="2.4" fill="#2c2018" />
            <ellipse cx="6" cy="-5.5" rx="1.4" ry="2.4" fill="#2c2018" />
            <circle cx="-5" cy="-6.8" r="0.9" fill="#fff" />
            <circle cx="7" cy="-6.8" r="0.9" fill="#fff" />
          </>
        )}

        {/* Wangen */}
        <circle cx="-10" cy="0" r="2.8" fill="#f2b8ae" opacity="0.45" />
        <circle cx="10" cy="0" r="2.8" fill="#f2b8ae" opacity="0.45" />

        {/* Nase und Mund */}
        <path d="M-1.5 -1.4 L1.5 -1.4 L0 0.2 Z" fill="#e39a8f" />
        <path d="M0 0.2 Q-1.5 2 -3.2 1.2" stroke="#6b5440" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        <path d="M0 0.2 Q1.5 2 3.2 1.2" stroke="#6b5440" strokeWidth="0.6" fill="none" strokeLinecap="round" />

        {/* Schnurrhaare */}
        <g stroke="#8c7760" strokeWidth="0.4" opacity="0.6">
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
