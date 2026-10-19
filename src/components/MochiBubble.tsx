import { useState } from 'react'
import { Cat } from './Cat'

// Mochi, die Katze, mit einer Sprechblase. Ein Tipp auf die Blase zeigt die nächste Nachricht.
export function MochiBubble({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0)
  const text = messages.length ? messages[index % messages.length] : ''

  return (
    <button
      type="button"
      className="mochi-row"
      onClick={() => setIndex((i) => i + 1)}
      aria-label="Nächste Nachricht von Mochi"
    >
      <svg viewBox="-42 -34 84 64" className="mochi-cat" aria-hidden="true">
        <Cat x={0} y={0} happy={false} />
      </svg>
      <span className="mochi-bubble">
        <span className="mochi-name">MOCHI</span>
        <span className="mochi-text">{text}</span>
      </span>
    </button>
  )
}
