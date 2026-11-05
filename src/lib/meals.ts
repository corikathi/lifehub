import { supabase } from './supabase'

// Grobe Einschätzung einer Mahlzeit. Keine genauen Kalorien, nur eine Richtung.
export interface MealEstimate {
  name: string
  kcal: number // grob, gerundet auf 50
  eiweissG: number // grob, gerundet auf 5
  eiweiss: 'hoch' | 'mittel' | 'niedrig'
  saettigend: 'ja' | 'eher nicht'
  hinweis: string
}

export interface MealEntry extends MealEstimate {
  id: string
  ts: number
}

// Schickt Text oder ein Foto (als Base64) an die Supabase-Funktion und gibt die Einschätzung zurück.
export async function estimateMeal(input: { text?: string; imageBase64?: string; mediaType?: string }): Promise<MealEstimate> {
  const { data, error } = await supabase.functions.invoke<MealEstimate & { error?: string }>('estimate-meal', { body: input })
  if (error) throw new Error('Die Schätzung hat gerade nicht geklappt.')
  if (!data || data.error) throw new Error(data?.error ?? 'Die Schätzung hat gerade nicht geklappt.')
  return data
}

// Foto als Base64 lesen, ohne das Präfix "data:…;base64,"
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error('Foto konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}
