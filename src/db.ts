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

export type MealType = 'Frühstück' | 'Mittag' | 'Abendessen' | 'Snack'

export interface Meal {
  id?: number
  date: string
  type: MealType
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

class LifehubDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  events!: EntityTable<CalEvent, 'id'>
  meals!: EntityTable<Meal, 'id'>
  water!: EntityTable<WaterEntry, 'id'>
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workoutSets!: EntityTable<WorkoutSet, 'id'>

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
  }
}

export const db = new LifehubDB()

// Erfahrungspunkte werden aus den Logs berechnet, damit es keine zweite Wahrheit gibt.
export const XP = { habit: 10, meal: 5, workout: 30 }

export async function getXp(): Promise<number> {
  const [habitDone, mealCount, finished] = await Promise.all([
    db.habitLogs.count(),
    db.meals.count(),
    db.workouts.filter((w) => w.finishedAt !== undefined).count(),
  ])
  return habitDone * XP.habit + mealCount * XP.meal + finished * XP.workout
}
