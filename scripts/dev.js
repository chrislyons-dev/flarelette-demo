/**
 * Development server orchestrator
 * Starts Miniflare (workers) and Astro (UI) in parallel
 */
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const rootDir = process.cwd()

// Check prerequisites
const devVarsPath = join(rootDir, 'workers/gateway/.dev.vars')
if (!existsSync(devVarsPath)) {
  console.error('❌ Error: Setup not complete. Run: pnpm run setup')
  process.exit(1)
}

console.log('🚀 Starting Flarelette Demo development environment...\n')

// Start Miniflare (workers)
const miniflare = spawn('pnpm', ['run', 'dev:workers'], {
  stdio: 'inherit',
  shell: true,
})

// Wait a bit for Miniflare to start, then start Astro
setTimeout(() => {
  console.log('\n🎨 Starting Astro frontend...\n')

  const astro = spawn('pnpm', ['run', 'dev:ui'], {
    stdio: 'inherit',
    shell: true,
  })

  astro.on('exit', (code) => {
    console.log(`\nAstro exited with code ${code}`)
    miniflare.kill()
    process.exit(code)
  })
}, 2000)

miniflare.on('exit', (code) => {
  console.log(`\nMiniflare exited with code ${code}`)
  process.exit(code)
})

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down development environment...')
  miniflare.kill()
  process.exit(0)
})
