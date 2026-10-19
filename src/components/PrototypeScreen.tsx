import { useLayoutEffect, useMemo, useRef, type ChangeEvent, type CSSProperties, type FocusEvent, type MouseEvent } from 'react'
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
  const shown = useRef<string | null>(null)
  const pending = useRef<string | null>(null)

  // Solange ein Textfeld den Fokus hat, bleibt das Markup unverändert. Sonst würde das
  // Feld beim Tippen neu aufgebaut und der eingegebene Wert springt zurück.
  // Die neue Ansicht wird übernommen, sobald das Feld verlassen wird.
  function isEditing(root: HTMLElement): boolean {
    const active = document.activeElement
    return !!active && root.contains(active) && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
  }

  function apply(markup: string) {
    if (!ref.current) return
    ref.current.innerHTML = markup
    shown.current = markup
    pending.current = null
  }

  useLayoutEffect(() => {
    const root = ref.current
    if (!root || shown.current === html) return
    if (isEditing(root)) {
      pending.current = html
      return
    }
    apply(html)
  }, [html])

  function handleBlur(_e: FocusEvent<HTMLDivElement>) {
    if (pending.current === null) return
    // Kurz warten, damit ein Tipp auf einen Knopf noch ausgeführt wird, bevor die Ansicht wechselt
    setTimeout(() => {
      const root = ref.current
      if (!root || pending.current === null || isEditing(root)) return
      apply(pending.current)
    }, 250)
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (el?.dataset.act && onAct) onAct(el.dataset.act)
  }

  function handleChange(e: ChangeEvent<HTMLDivElement>) {
    const el = e.target as HTMLInputElement
    const key = el.closest<HTMLElement>('[data-change]')?.dataset.change ?? el.dataset.change
    if (key && onChange) onChange(key, el.value)
  }

  return <div ref={ref} style={style} onClick={handleClick} onChange={handleChange} onBlur={handleBlur} />
}
