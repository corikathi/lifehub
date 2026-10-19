import { useMemo, type MouseEvent } from 'react'
import { renderTemplate } from '../prototype/template'

// Zeigt eine Prototyp-Vorlage mit unseren Daten. Klicks auf Elemente mit data-act
// werden als Aktion (Text) an onAct gegeben.
export function PrototypeScreen({
  template,
  ctx,
  onAct,
}: {
  template: string
  ctx: Record<string, unknown>
  onAct: (action: string) => void
}) {
  const html = useMemo(() => renderTemplate(template, ctx), [template, ctx])

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (el?.dataset.act) onAct(el.dataset.act)
  }

  return <div onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
}
