// Entschlüsselt die verschlüsselte Datenbündel-Datei aus dem Repo (scripts/encrypt-data.mjs).
// Alles läuft lokal im Browser, das Passwort verlässt das Gerät nicht.

import { writeKv } from './store'

interface EncryptedBundle {
  v: number
  kdf: string
  iter: number
  salt: string
  iv: string
  data: string
}

interface DataBundle {
  rezepte: unknown
  training: unknown
  personal: Record<string, unknown>
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
  return bytes as Uint8Array<ArrayBuffer>
}

export async function decryptBundle(passphrase: string): Promise<DataBundle> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/daten.enc.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Datenbündel nicht gefunden')
  const bundle = (await res.json()) as EncryptedBundle

  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(bundle.salt), iterations: bundle.iter, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  // Wirft eine Exception, wenn das Passwort falsch ist (GCM prüft die Integrität)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(bundle.iv) },
    key,
    fromBase64(bundle.data),
  )
  return JSON.parse(new TextDecoder().decode(plain)) as DataBundle
}

// Schreibt das entschlüsselte Bündel in den lokalen Speicher. Danach synchronisiert
// die App es automatisch in dein Konto.
export async function storeBundle(bundle: DataBundle): Promise<void> {
  await writeKv('content.rezepte', bundle.rezepte)
  await writeKv('content.training', bundle.training)
  for (const [key, value] of Object.entries(bundle.personal)) {
    await writeKv(key, value)
  }
  await writeKv('bundle.v1', true)
}
