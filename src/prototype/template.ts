// Minimaler Renderer für die Prototyp-Vorlagen. Unterstützt:
//   <sc-if value="{{ flag }}"> ... </sc-if>            Bedingung (wahr/falsch)
//   <sc-for list="{{ name }}" as="x"> ... </sc-for>     Wiederholung je Eintrag
//   {{ pfad.zu.wert }}                                  Platzhalter (HTML-escaped)
// Klicks liefern data-act, Eingaben liefern data-change an den Aufrufer.

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

// Innerste Bedingungen zuerst, damit verschachtelte Blöcke funktionieren
function renderConditions(html: string, ctx: Ctx): string {
  const re = /<sc-if value="\{\{ ([\w.]+) \}\}"[^>]*>((?:(?!<sc-if)[\s\S])*?)<\/sc-if>/
  let out = html
  let m = re.exec(out)
  while (m) {
    const show = Boolean(lookup(ctx, m[1]))
    out = out.slice(0, m.index) + (show ? m[2] : '') + out.slice(m.index + m[0].length)
    m = re.exec(out)
  }
  return out
}

export function renderTemplate(html: string, ctx: Ctx): string {
  const withConditions = renderConditions(html, ctx)
  const withLoops = withConditions.replace(
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
