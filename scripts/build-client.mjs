import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const packageName = packageJson.name
if (typeof packageName !== 'string' || !packageName) throw new Error('package.json name is required')

await mkdir(new URL('../lib/', import.meta.url), { recursive: true })
const bodyPath = fileURLToPath(new URL('../lib/client.body.cjs', import.meta.url))
await esbuild.build({
  entryPoints: ['src/client/index.js'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  external: ['react'],
  outfile: bodyPath,
  minify: false,
  legalComments: 'none',
})
const body = await readFile(bodyPath, 'utf8')
const newline = String.fromCharCode(10)
const bundle = `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageName)}, factory: (require) => {${newline}`
  + `var module = { exports: {} };${newline}var exports = module.exports;${newline}`
  + body + `${newline}return module.exports;${newline}} });${newline}`
await writeFile(new URL('../lib/client.js', import.meta.url), bundle)
await unlink(bodyPath)
console.log(`built ${packageName}/client`)
