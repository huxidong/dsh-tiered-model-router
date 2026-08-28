import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'

await mkdir(new URL('../dist/', import.meta.url), { recursive: true })
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const command = process.platform === 'win32' ? 'npm.cmd pack --pack-destination dist' : 'npm pack --pack-destination dist'
const child = process.platform === 'win32'
  ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], { stdio: 'inherit' })
  : spawn(npm, ['pack', '--pack-destination', 'dist'], { stdio: 'inherit' })
child.on('error', (error) => {
  console.error(`could not start ${npm}: ${error.message}`)
  process.exitCode = 1
})
child.on('exit', (code, signal) => {
  if (signal) process.exitCode = 1
  else if (typeof code === 'number') process.exitCode = code
})
