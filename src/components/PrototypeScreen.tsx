import { useMemo, type ChangeEvent, type MouseEvent } from 'react'
import { renderTemplate } from '../prototype/template'

// Zeigt eine Prototyp-Vorlage mit unseren Daten. Klicks auf Elemente mit data-act
// geben die Aktion an onAct, Eingaben mit data-change an onChange.
export function PrototypeScreen({
  template,
  ctx,
  onAct,
  onChange,
}: {
  template: string
  ctx: Record<string, unknown>
  onAct?: (action: string) => void
  onChange?: (key: string, value: string) => void
}) {
  const html = useMemo(() => renderTemplate(template, ctx), [template, ctx])

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (el?.dataset.act && onAct) onAct(el.dataset.act)
  }

  function handleChange(e: ChangeEvent<HTMLDivElement>) {
    const el = e.target as HTMLInputElement
    const key = el.closest<HTMLElement>('[data-change]')?.dataset.change ?? el.dataset.change
    if (key && onChange) onChange(key, el.value)
  }

  return <div onClick={handleClick} onChange={handleChange} dangerouslySetInnerHTML={{ __html: html }} />
}
