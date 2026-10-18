// Kleine Katze mit 3D-Anmutung: Lichtverläufe, Bodenschatten und sanftes Atmen.
// Die Katze schaut fröhlich, wenn der Tag gut läuft, und ruhig sonst.

export function Cat({ x, y, happy }: { x: number; y: number; happy: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`}>
      <defs>
        <radialGradient id="catFur" cx="35%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fbd9a8" />
          <stop offset="55%" stopColor="#dd9a5c" />
          <stop offset="100%" stopColor="#a86a36" />
        </radialGradient>
        <radialGradient id="catBelly" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff4e2" />
          <stop offset="100%" stopColor="#f0cfa2" />
        </radialGradient>
        <radialGradient id="catShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a2a1e" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3a2a1e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bodenschatten */}
      <ellipse cx="0" cy="27" rx="26" ry="6" fill="url(#catShadow)" />

      {/* Schwanz */}
      <path d="M13 18 C 34 20, 36 -2, 26 -12" stroke="#a86a36" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M13 18 C 34 20, 36 -2, 26 -12" stroke="#fbd9a8" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" transform="translate(-1 -1)" />

      <g className="cat-breathe">
        {/* Körper */}
        <ellipse cx="0" cy="12" rx="19" ry="15" fill="url(#catFur)" />
        <ellipse cx="0" cy="17" rx="10" ry="8" fill="url(#catBelly)" />

        {/* Pfoten */}
        <ellipse cx="-9" cy="24" rx="6" ry="4" fill="#fbe0bd" />
        <ellipse cx="9" cy="24" rx="6" ry="4" fill="#fbe0bd" />
        <line x1="-11" y1="23" x2="-11" y2="25" stroke="#c98a50" strokeWidth="0.7" />
        <line x1="-8" y1="23" x2="-8" y2="25" stroke="#c98a50" strokeWidth="0.7" />
        <line x1="8" y1="23" x2="8" y2="25" stroke="#c98a50" strokeWidth="0.7" />
        <line x1="11" y1="23" x2="11" y2="25" stroke="#c98a50" strokeWidth="0.7" />

        {/* Ohren */}
        <path d="M-15 -10 L-14 -28 L-2 -17 Z" fill="#c98a50" />
        <path d="M15 -10 L14 -28 L2 -17 Z" fill="#c98a50" />
        <path d="M-12.5 -12 L-12.5 -22 L-6 -16 Z" fill="#f2a8a0" />
        <path d="M12.5 -12 L12.5 -22 L6 -16 Z" fill="#f2a8a0" />

        {/* Kopf */}
        <circle cx="0" cy="-6" r="15.5" fill="url(#catFur)" />

        {/* Augen */}
        {happy ? (
          <>
            <path d="M-9.5 -6 Q-6 -10 -2.5 -6" stroke="#3a2a1e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M2.5 -6 Q6 -10 9.5 -6" stroke="#3a2a1e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="-6" cy="-6" rx="2.3" ry="3" fill="#2f2219" />
            <ellipse cx="6" cy="-6" rx="2.3" ry="3" fill="#2f2219" />
            <circle cx="-5.2" cy="-7.2" r="0.9" fill="#fff" />
            <circle cx="6.8" cy="-7.2" r="0.9" fill="#fff" />
          </>
        )}

        {/* Wangen */}
        <circle cx="-10" cy="-1" r="2.8" fill="#f08a78" opacity="0.5" />
        <circle cx="10" cy="-1" r="2.8" fill="#f08a78" opacity="0.5" />

        {/* Nase und Mund */}
        <path d="M-1.6 -1.8 L1.6 -1.8 L0 -0.2 Z" fill="#e0837a" />
        <path d="M0 -0.2 Q-1.6 1.8 -3.4 1" stroke="#3a2a1e" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        <path d="M0 -0.2 Q1.6 1.8 3.4 1" stroke="#3a2a1e" strokeWidth="0.7" fill="none" strokeLinecap="round" />

        {/* Schnurrhaare */}
        <g stroke="#3a2a1e" strokeWidth="0.45" opacity="0.55">
          <line x1="-8" y1="-1" x2="-19" y2="-2.5" />
          <line x1="-8" y1="1" x2="-19" y2="1.5" />
          <line x1="8" y1="-1" x2="19" y2="-2.5" />
          <line x1="8" y1="1" x2="19" y2="1.5" />
        </g>
      </g>

      {happy && (
        <text x="16" y="-26" fontSize="8" fill="#e0837a">♥</text>
      )}
    </g>
  )
}
