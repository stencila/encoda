import * as log from '../log'

// Many tests take longer than the default 5s timeout
jest.setTimeout(5 * 60 * 1000)

// Force TTY style output for better log readability
process.stderr.isTTY = true

// Allow debug mode in DEBUG env var set e.g.
//   DEBUG=1 npm test
log.configure(process.env.DEBUG !== undefined)
