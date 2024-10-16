import * as log from '../util/logging'

// Force TTY style output for better log readability
process.stderr.isTTY = true

// Show debug log entries if DEBUG env var set e.g.
//   DEBUG=1 npm test
// Do not exit on errors
log.configure(process.env.DEBUG !== undefined, false)
