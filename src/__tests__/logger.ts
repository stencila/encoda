import { configure } from '../log'

// Force TTY style output for better readability
process.stderr.isTTY = true

// Allow debug mode in DEBUG env var set e.g.
//   DEBUG=1 npm test
configure(process.env.DEBUG !== undefined)
