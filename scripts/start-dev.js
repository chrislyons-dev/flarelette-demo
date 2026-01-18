#!/usr/bin/env node
/**
 * Start all flarelette-demo services in a single terminal with color-coded output
 * Uses concurrently to run all services in parallel
 */
import concurrently from 'concurrently'

console.log('🚀 Starting Flarelette Demo local development stack...\n')

const { result } = concurrently(
  [
    {
      command: 'npm run dev -- --port 8788',
      name: 'content',
      cwd: 'workers/content-service',
      prefixColor: 'blue',
    },
    {
      command: 'npm run dev -- --port 8789',
      name: 'forms',
      cwd: 'workers/forms-service',
      prefixColor: 'magenta',
    },
    {
      command: 'npm run dev -- --port 8790',
      name: 'images',
      cwd: 'workers/image-service',
      prefixColor: 'yellow',
    },
    {
      command: 'npm run dev -- --port 8787',
      name: 'gateway',
      cwd: 'workers/gateway',
      prefixColor: 'green',
    },
    {
      command: 'npm run dev',
      name: 'ui',
      cwd: 'ui',
      prefixColor: 'cyan',
    },
  ],
  {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 3,
    timestampFormat: 'HH:mm:ss',
  }
)

// Handle cleanup
result
  .then(
    () => {
      console.log('\n✅ All services exited successfully')
      process.exit(0)
    },
    (error) => {
      console.error('\n❌ One or more services failed:', error.message)
      process.exit(1)
    }
  )
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })

// Display helpful info after a brief delay (let services start logging first)
setTimeout(() => {
  console.log('\n📡 Services:')
  console.log('   Content Service  → http://localhost:8788')
  console.log('   Forms Service    → http://localhost:8789')
  console.log('   Image Service    → http://localhost:8790')
  console.log('   Gateway          → http://localhost:8787')
  console.log('   UI               → http://localhost:4321')
  console.log('\n💡 Gateway proxies to services via HTTP (USE_HTTP_SERVICES=true)')
  console.log('🛑 Press Ctrl+C to stop all services\n')
}, 3000)
