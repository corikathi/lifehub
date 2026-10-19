// Eintrag in „Heute erledigen“. Mit Datum und Uhrzeit erscheint er im Wochen-Tab am Tag,
// ohne Datum gilt er als Aufgabe für heute.
export interface Todo {
  id: string
  title: string
  meta: string
  tag: string
  done: boolean
  date?: string
  time?: string
}

// Ob ein Eintrag an einem Tag zu sehen ist (Heute: alles bis heute, Woche: genau dieser Tag)
export function todoOn(todo: Todo, day: string): boolean {
  return todo.date === day
}
