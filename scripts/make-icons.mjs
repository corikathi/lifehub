// Erzeugt die PNG-Icons für Homescreen und Installation aus public/icon.svg.
// Aufruf: node scripts/make-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(here, '..', 'public', 'icon.svg'))
const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const t of targets) {
  await sharp(svg, { density: 384 }).resize(t.size, t.size).png().toFile(join(here, '..', 'public', t.file))
  console.log('erstellt:', t.file)
}
