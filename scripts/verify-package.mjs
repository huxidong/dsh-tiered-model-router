import { access, readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const clientExport = packageJson.exports?.['./client']
const clientPath = typeof clientExport === 'string' ? clientExport : clientExport?.default
if (typeof clientPath !== 'string') throw new Error('package must expose exports["./client"]')
await access(new URL(`../${clientPath.replaceAll('\\', '/')}`, import.meta.url))
const clientSource = await readFile(new URL(`../${clientPath.replaceAll('\\', '/')}`, import.meta.url), 'utf8')
if (!clientSource.includes('window.__ModuleLoader__.load')) throw new Error('client export is not a DSH module-loader bundle')
if (packageJson.dsh?.bundle?.patch !== './cordis.patch.yml') throw new Error('package must declare its cordis.patch.yml bundle layer')
if (packageJson.dsh?.client?.platform !== 'web') throw new Error('package must declare a web client module')
console.log(`verified ${packageJson.name}@${packageJson.version}`)
