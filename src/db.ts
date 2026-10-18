import Dexie, { type EntityTable } from 'dexie'

export interface Habit {
  id?: number
  name: string
  createdAt: number
}

export interface HabitLog {
  id?: number
  habitId: number
  date: string
}

export interface CalEvent {
  id?: number
  date: string
  time?: string
  title: string
  note?: string
}

// Alte Tabellen aus der ersten Version bleiben bestehen, werden aber nicht mehr genutzt.
export interface Meal {
  id?: number
  date: string
  type: string
  text: string
}

export interface WaterEntry {
  id?: number
  date: string
  ml: number
}

export interface WorkoutPlan {
  id?: number
  name: string
  exercises: string[]
}

export interface Workout {
  id?: number
  date: string
  name: string
  planId?: number
  startedAt: number
  finishedAt?: number
}

export interface WorkoutSet {
  id?: number
  workoutId: number
  exercise: string
  weight: number
  reps: number
  createdAt: number
}

// Schlüssel-Wert-Speicher für Essen, Training, Rad und die importierten Daten.
// Jeder Eintrag ist ein ganzes Dokument, z. B. "meals", "workoutLog", "content.rezepte".
export interface KvRow {
  key: string
  value: unknown
}

class LifehubDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  events!: EntityTable<CalEvent, 'id'>
  meals!: EntityTable<Meal, 'id'>
  water!: EntityTable<WaterEntry, 'id'>
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workoutSets!: EntityTable<WorkoutSet, 'id'>
  kv!: EntityTable<KvRow, 'key'>

  constructor() {
    super('lifehub')
    this.version(1).stores({
      habits: '++id',
      habitLogs: '++id, habitId, date',
      events: '++id, date',
      meals: '++id, date',
      water: '++id, date',
      workoutPlans: '++id',
      workouts: '++id, date',
      workoutSets: '++id, workoutId, exercise',
    })
    this.version(2).stores({
      kv: 'key',
    })
  }
}

export const db = new LifehubDB()

// Erfahrungspunkte werden aus den Logs berechnet, damit es keine zweite Wahrheit gibt.
export const XP = { habit: 10, workout: 30, ride: 20 }

export async function getXp(): Promise<number> {
  const [habitDone, workoutLog, rideLog] = await Promise.all([
    db.habitLogs.count(),
    db.kv.get('workoutLog'),
    db.kv.get('rides'),
  ])
  const workouts = Array.isArray(workoutLog?.value) ? workoutLog.value.length : 0
  const rides = Array.isArray((rideLog?.value as { log?: unknown[] } | undefined)?.log)
    ? (rideLog!.value as { log: unknown[] }).log.length
    : 0
  return habitDone * XP.habit + workouts * XP.workout + rides * XP.ride
}
