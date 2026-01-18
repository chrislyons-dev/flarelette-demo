#!/usr/bin/env node
/**
 * Kill processes running on development ports
 *
 * Ports: 8787-8790 (gateway, content, forms, image services), 4321 (ui)
 * Works on Windows, macOS, and Linux
 */

import { execSync } from 'child_process'
import process from 'process'

const PORTS = [8787, 8788, 8789, 8790, 4321]
const isWindows = process.platform === 'win32'

/**
 * Find PIDs listening on a specific port
 */
function findPIDsOnPort(port) {
  try {
    if (isWindows) {
      // Windows: Use netstat -ano
      const output = execSync(`netstat -ano`, { encoding: 'utf8' })
      const lines = output.split('\n')
      const pids = new Set()

      for (const line of lines) {
        if (line.includes(`LISTENING`) && line.includes(`:${port} `)) {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && /^\d+$/.test(pid)) {
            pids.add(pid)
          }
        }
      }

      return Array.from(pids)
    } else {
      // Unix/macOS: Use lsof
      try {
        const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' })
        return output.trim().split('\n').filter(Boolean)
      } catch (error) {
        // lsof returns exit code 1 if no process found
        return []
      }
    }
  } catch (error) {
    return []
  }
}

/**
 * Get process name by PID
 */
function getProcessName(pid) {
  try {
    if (isWindows) {
      const output = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: 'utf8',
      })
      const match = output.match(/"([^"]+)"/)
      return match ? match[1] : 'unknown'
    } else {
      const output = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' })
      return output.trim() || 'unknown'
    }
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Kill process by PID
 */
function killProcess(pid) {
  try {
    if (isWindows) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Checking for processes on development ports...\n')

  for (const port of PORTS) {
    console.log(`Port ${port}:`)

    const pids = findPIDsOnPort(port)

    if (pids.length === 0) {
      console.log('  No process found')
    } else {
      for (const pid of pids) {
        const processName = getProcessName(pid)
        console.log(`  Found: ${processName} (PID: ${pid})`)

        const killed = killProcess(pid)
        if (killed) {
          console.log(`  [OK] Killed process ${pid}`)
        } else {
          console.log(`  [WARN] Failed to kill PID ${pid}`)
        }
      }
    }

    console.log('')
  }

  console.log('Done!')
}

main()
