/**
 * Colored console logger for setup scripts
 * Provides consistent, readable output
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
}

class Logger {
  constructor() {
    this.startTime = Date.now()
  }

  header(text) {
    console.log(`\n${colors.bright}${colors.cyan}${text}${colors.reset}\n`)
  }

  section(emoji, title) {
    console.log(`\n${emoji} ${colors.bright}${title}${colors.reset}`)
  }

  success(message) {
    console.log(`  ${colors.green}✓${colors.reset} ${message}`)
  }

  error(message) {
    console.log(`  ${colors.red}✗${colors.reset} ${message}`)
  }

  warning(message) {
    console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`)
  }

  info(message) {
    console.log(`  ${colors.blue}ℹ${colors.reset} ${message}`)
  }

  dim(message) {
    console.log(`  ${colors.gray}${message}${colors.reset}`)
  }

  progress(current, total, item) {
    const percent = Math.round((current / total) * 100)
    console.log(`  ${colors.cyan}[${current}/${total}]${colors.reset} ${item}`)
  }

  finish() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1)
    console.log(`\n${colors.green}✅ Setup complete in ${elapsed}s${colors.reset}\n`)
  }

  fatal(message, error) {
    console.log(`\n${colors.red}${colors.bright}💥 Fatal Error${colors.reset}`)
    console.log(`${colors.red}${message}${colors.reset}`)
    if (error) {
      console.log(`\n${colors.gray}${error.stack || error.message}${colors.reset}\n`)
    }
    process.exit(1)
  }
}

export const logger = new Logger()
