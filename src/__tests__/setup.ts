import * as log from '../log'

// Force TTY style output for better log readability
process.stderr.isTTY = true

// Allow debug mode in DEBUG env var set e.g.
//   DEBUG=1 npm test
log.configure(process.env.DEBUG !== undefined)
