import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const roots = ['src', 'public', 'scripts', 'test']
const files = []
const walk = async (directory) => {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) await walk(target)
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) files.push(target)
  }
}
for (const root of roots) await walk(root)

for (const file of files) {
  const source = await fs.readFile(file, 'utf8')
  if (/[ \t]+$/m.test(source)) throw new Error(`${file}: trailing whitespace found`)
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || `${file}: syntax check failed`)
}
console.log(`Checked ${files.length} JavaScript files.`)
