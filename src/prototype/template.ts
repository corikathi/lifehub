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

// Schleifen: das passende schließende Tag wird über die Verschachtelung gezählt
function expandLoops(html: string, ctx: Ctx): string {
  const openRe = /<sc-for list="\{\{ ([\w.]+) \}\}" as="(\w+)"[^>]*>/
  let out = ''
  let rest = html
  let m = openRe.exec(rest)
  while (m) {
    const cur: RegExpExecArray = m
    out += rest.slice(0, cur.index)
    const bodyStart = cur.index + cur[0].length
    // Schließendes Tag mit gleicher Verschachtelungstiefe suchen
    let depth = 1
    let pos = bodyStart
    let end = -1
    while (depth > 0) {
      const nextOpen = rest.indexOf('<sc-for', pos)
      const nextClose = rest.indexOf('</sc-for>', pos)
      if (nextClose < 0) break
      if (nextOpen >= 0 && nextOpen < nextClose) {
        depth++
        pos = nextOpen + 7
      } else {
        depth--
        if (depth === 0) end = nextClose
        pos = nextClose + 9
      }
    }
    if (end < 0) {
      out += rest.slice(cur.index)
      return out
    }
    const body = rest.slice(bodyStart, end)
    const items = lookup(ctx, cur[1])
    if (Array.isArray(items)) {
      out += items.map((item) => renderTemplate(body, { ...ctx, [cur[2]]: item })).join('')
    }
    rest = rest.slice(end + '</sc-for>'.length)
    m = openRe.exec(rest)
  }
  return out + rest
}

export function renderTemplate(html: string, ctx: Ctx): string {
  const withConditions = renderConditions(html, ctx)
  const withLoops = expandLoops(withConditions, ctx)
  // {{{ pfad }}} fügt fertiges HTML (z. B. ein SVG) unverändert ein
  const withRaw = withLoops.replace(/\{\{\{ ([\w.]+) \}\}\}/g, (_m, path: string) => {
    const value = lookup(ctx, path)
    return value === undefined || value === null ? '' : String(value)
  })
  return withRaw.replace(/\{\{ ([\w.]+) \}\}/g, (_m, path: string) => {
    const value = lookup(ctx, path)
    return value === undefined || value === null ? '' : escapeHtml(String(value))
  })
}
