// Minimaler Renderer für die Prototyp-Vorlagen. Unterstützt:
//   <sc-for list="{{ name }}" as="x"> ... </sc-for>   Wiederholung je Eintrag
//   {{ pfad.zu.wert }}                                 Platzhalter (HTML-escaped)
// Klicks werden über data-act-Attribute an den Aufrufer zurückgegeben.

type Ctx = Record<string, unknown>

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lookup(ctx: Ctx, path: string): unknown {
  return path.split('.').reduce<unknown>((obj, key) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key]
    return undefined
  }, ctx)
}

export function renderTemplate(html: string, ctx: Ctx): string {
  const withLoops = html.replace(
    /<sc-for list="\{\{ ([\w.]+) \}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g,
    (_m, listPath: string, alias: string, body: string) => {
      const items = lookup(ctx, listPath)
      if (!Array.isArray(items)) return ''
      return items.map((item) => renderTemplate(body, { ...ctx, [alias]: item })).join('')
    },
  )
  return withLoops.replace(/\{\{ ([\w.]+) \}\}/g, (_m, path: string) => {
    const value = lookup(ctx, path)
    return value === undefined || value === null ? '' : escapeHtml(String(value))
  })
}
