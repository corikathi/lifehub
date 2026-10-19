import { useLayoutEffect, useMemo, useRef, type ChangeEvent, type CSSProperties, type MouseEvent } from 'react'
import { renderTemplate } from '../prototype/template'

// Zeigt eine Prototyp-Vorlage mit unseren Daten. Klicks auf Elemente mit data-act
// geben die Aktion an onAct, Eingaben mit data-change an onChange.
export function PrototypeScreen({
  template,
  ctx,
  onAct,
  onChange,
  style,
}: {
  template: string
  ctx: Record<string, unknown>
  onAct?: (action: string) => void
  onChange?: (key: string, value: string) => void
  style?: CSSProperties
}) {
  const html = useMemo(() => renderTemplate(template, ctx), [template, ctx])
  const ref = useRef<HTMLDivElement>(null)
  const lastHtml = useRef<string | null>(null)

  // Nur neu setzen, wenn sich das Markup ändert. Hat ein Eingabefeld den Fokus, wird
  // Fokus und Cursor danach wiederhergestellt, sonst schließt sich die Tastatur bei jedem Buchstaben.
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || lastHtml.current === html) return
    const active = document.activeElement as HTMLInputElement | null
    const focusKey = active && root.contains(active) ? active.getAttribute('data-change') : null
    const caret = focusKey ? active?.selectionStart ?? null : null
    root.innerHTML = html
    lastHtml.current = html
    if (focusKey) {
      const el = root.querySelector<HTMLInputElement>(`input[data-change="${focusKey}"]`)
      if (el) {
        el.focus()
        if (caret !== null) el.setSelectionRange(caret, caret)
      }
    }
  }, [html])

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (el?.dataset.act && onAct) onAct(el.dataset.act)
  }

  function handleChange(e: ChangeEvent<HTMLDivElement>) {
    const el = e.target as HTMLInputElement
    const key = el.closest<HTMLElement>('[data-change]')?.dataset.change ?? el.dataset.change
    if (key && onChange) onChange(key, el.value)
  }

  return <div ref={ref} style={style} onClick={handleClick} onChange={handleChange} />
}
