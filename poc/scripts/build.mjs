import fs from 'node:fs/promises'

await import('./check.mjs')
await fs.mkdir('dist/public', { recursive: true })
for (const file of ['index.html', 'app.js', 'styles.css']) {
  await fs.copyFile(`public/${file}`, `dist/public/${file}`)
}
await fs.writeFile('dist/build.json', `${JSON.stringify({ builtAt: new Date().toISOString(), runtime: 'node', entry: 'src/server.js' }, null, 2)}\n`)
console.log('Build completed: validated server source and copied browser assets to dist/.')
