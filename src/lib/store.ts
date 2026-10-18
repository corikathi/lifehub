import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

// Liest ein Dokument aus dem Schlüssel-Wert-Speicher und aktualisiert die Ansicht live.
export function useKv<T>(key: string, fallback: T): [T, (next: T) => Promise<void>] {
  const stored = useLiveQuery(async () => (await db.kv.get(key))?.value as T | undefined, [key])
  const value = stored ?? fallback
  const setValue = async (next: T) => {
    await db.kv.put({ key, value: next })
  }
  return [value, setValue]
}

export async function readKv<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key)
  return (row?.value as T | undefined) ?? fallback
}

export async function writeKv(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value })
}
