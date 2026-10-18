// Verschlüsselt deine drei Export-Dateien zu einer einzigen Datei für das Repo.
//
// Aufruf (im Projektordner):
//   node scripts/encrypt-data.mjs "C:\Users\zellm\Downloads\fuel-flow-export\daten"
//
// Das Passwort wird im Terminal abgefragt (sichtbar) und nirgends gespeichert.
// Ergebnis: public/data/daten.enc.json (wird ins Repo committet, ist verschlüsselt).
// Die Klartext-Dateien bleiben bei dir.

import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ITERATIONS = 600_000

const dataDir = process.argv[2]
if (!dataDir) {
  console.error('Bitte den Ordner mit rezepte.json, training.json und meine-daten.json angeben.')
  process.exit(1)
}

function readJson(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
}

// Liest eine Eingabe aus dem Terminal. Die Zeichen sind sichtbar, damit die Eingabe
// in jedem Terminal funktioniert.
async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise((resolve) => rl.question(question, resolve))
  rl.close()
  return answer
}

const passphrase = await ask('Passwort (mind. 12 Zeichen): ')
const confirm = await ask('Passwort wiederholen: ')
if (passphrase !== confirm || passphrase.length < 12) {
  console.error('Passwörter stimmen nicht überein oder sind kürzer als 12 Zeichen.')
  process.exit(1)
}

const bundle = {
  rezepte: readJson('rezepte.json'),
  training: readJson('training.json'),
  personal: readJson('meine-daten.json'),
}

const salt = randomBytes(16)
const iv = randomBytes(12)
const key = pbkdf2Sync(passphrase, salt, ITERATIONS, 32, 'sha256')
const cipher = createCipheriv('aes-256-gcm', key, iv)
const encrypted = Buffer.concat([cipher.update(JSON.stringify(bundle), 'utf8'), cipher.final()])
// Im Browser liegt der Authentifizierungs-Tag hinter den verschlüsselten Daten
const data = Buffer.concat([encrypted, cipher.getAuthTag()])

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(
  join(outDir, 'daten.enc.json'),
  JSON.stringify({
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iter: ITERATIONS,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    data: data.toString('base64'),
  }),
)

console.log('Fertig: public/data/daten.enc.json ist verschlüsselt. Du kannst es jetzt committen.')
