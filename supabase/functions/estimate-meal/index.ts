// Schätzt eine Mahlzeit grob ein, aus Text oder Foto, mit Claude.
// Läuft als Supabase-Funktion. Der Schlüssel liegt als Geheimnis ANTHROPIC_API_KEY auf dem Server,
// nicht in der App. Nur angemeldete Nutzer dürfen die Funktion aufrufen (Standard von Supabase).

const MODEL = 'claude-sonnet-5-5'

const PROMPT = `Du schätzt eine Mahlzeit grob ein, für eine Person, die keine genauen Zahlen will.
Antworte NUR mit JSON in genau dieser Form:
{"name": "kurzer Name der Mahlzeit", "kcal": Zahl, "eiweissG": Zahl, "eiweiss": "hoch" | "mittel" | "niedrig", "saettigend": "ja" | "eher nicht", "hinweis": "ein freundlicher Satz, max. 20 Wörter"}
kcal rund auf 50 und eiweissG rund auf 5 gerundet, als grobe Schätzung für eine typische Portion.
Keine Erklärung außerhalb des JSON.`

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Nur POST', { status: 405 })

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return Response.json({ error: 'Schlüssel fehlt auf dem Server' }, { status: 500 })

  const body = (await req.json()) as { text?: string; imageBase64?: string; mediaType?: string }
  const content: unknown[] = []
  if (body.imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: body.mediaType ?? 'image/jpeg', data: body.imageBase64 },
    })
  }
  const text = (body.text ?? '').trim().slice(0, 1000)
  if (text) content.push({ type: 'text', text: `Mahlzeit: ${text}` })
  if (content.length === 0) return Response.json({ error: 'Nichts zum Schätzen' }, { status: 400 })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: PROMPT,
      messages: [{ role: 'user', content }],
    }),
  })
  if (!res.ok) return Response.json({ error: 'Schätzung fehlgeschlagen' }, { status: 502 })

  const data = (await res.json()) as { content?: { type: string; text?: string }[] }
  const out = data.content?.find((c) => c.type === 'text')?.text ?? ''
  try {
    const parsed = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1))
    return Response.json(parsed)
  } catch {
    return Response.json({ error: 'Antwort nicht lesbar' }, { status: 502 })
  }
})
