// Sync: Die lokale IndexedDB bleibt die Arbeitskopie. Zusätzlich liegt pro Nutzer
// ein Snapshot aller Tabellen in Supabase. Bei Änderungen wird nach kurzer Pause
// hochgeladen. Beim Login wird der Snapshot geladen, falls einer existiert.

import Dexie from 'dexie'
import { db } from '../db'
import { supabase } from './supabase'

const TABLE_NAMES = [
  'habits',
  'habitLogs',
  'events',
  'meals',
  'water',
  'workoutPlans',
  'workouts',
  'workoutSets',
] as const

type TableName = (typeof TABLE_NAMES)[number]
type Snapshot = Record<TableName, unknown[]>

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

let status: SyncStatus = 'idle'
const listeners = new Set<(s: SyncStatus) => void>()

function setStatus(next: SyncStatus) {
  status = next
  listeners.forEach((l) => l(next))
}

export function onSyncStatus(cb: (s: SyncStatus) => void) {
  listeners.add(cb)
  cb(status)
  return () => {
    listeners.delete(cb)
  }
}

let applyingRemote = false
let pushTimer: ReturnType<typeof setTimeout> | undefined
let started = false

async function exportSnapshot(): Promise<Snapshot> {
  const entries = await Promise.all(
    TABLE_NAMES.map(async (name) => [name, await db.table(name).toArray()] as const),
  )
  return Object.fromEntries(entries) as Snapshot
}

async function importSnapshot(snapshot: Partial<Snapshot>) {
  applyingRemote = true
  try {
    await db.transaction('rw', TABLE_NAMES.map((n) => db.table(n)), async () => {
      for (const name of TABLE_NAMES) {
        const table = db.table(name)
        await table.clear()
        const rows = snapshot[name] ?? []
        if (rows.length > 0) await table.bulkAdd(rows)
      }
    })
  } finally {
    applyingRemote = false
  }
}

async function clearLocal() {
  await db.transaction('rw', TABLE_NAMES.map((n) => db.table(n)), async () => {
    for (const name of TABLE_NAMES) await db.table(name).clear()
  })
}

async function pushNow() {
  if (pushTimer !== undefined) {
    clearTimeout(pushTimer)
    pushTimer = undefined
  }
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return

  setStatus('syncing')
  const payload = await exportSnapshot()
  const { error } = await supabase
    .from('lifehub_snapshots')
    .upsert({ user_id: userId, payload, updated_at: new Date().toISOString() })

  if (error) {
    console.error('Sync-Upload fehlgeschlagen', error)
    setStatus('error')
    return
  }
  setStatus('synced')
}

function schedulePush() {
  if (pushTimer !== undefined) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void pushNow()
  }, 1500)
}

// Lädt beim Login den Snapshot aus der Cloud. Gibt es noch keinen, wird der lokale
// Stand hochgeladen (z. B. deine bisherigen Daten vom PC).
export async function syncOnLogin(userId: string) {
  setStatus('syncing')
  const { data, error } = await supabase
    .from('lifehub_snapshots')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Sync-Download fehlgeschlagen', error)
    // Offline oder Fehler: lokale Daten bleiben unverändert erhalten
    setStatus('error')
    return
  }

  if (data) {
    await importSnapshot(data.payload as Partial<Snapshot>)
    setStatus('synced')
  } else {
    await pushNow()
  }
}

// Einmal beim App-Start aufrufen. Registriert die Änderungs-Überwachung.
export function startSync() {
  if (started) return
  started = true

  // Feuert nach jeder Schreiboperation auf der Datenbank
  Dexie.on('storagemutated', () => {
    if (!applyingRemote) schedulePush()
  })

  // Ausstehende Änderungen sofort sichern, wenn die App in den Hintergrund geht
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pushTimer !== undefined) {
      void pushNow()
    }
  })
}

// Beim Abmelden: letzte Änderungen hochladen, dann lokale Daten entfernen,
// damit auf einem geteilten Gerät nichts zurückbleibt.
export async function signOutAndClear() {
  if (pushTimer !== undefined) await pushNow()
  await supabase.auth.signOut()
  await clearLocal()
  setStatus('idle')
}
