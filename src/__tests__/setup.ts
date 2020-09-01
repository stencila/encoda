import * as log from '../log'
import { shutdown } from '../'

// Many tests take longer than the default 5s timeout
jest.setTimeout(5 * 60 * 1000)

// Force TTY style output for better log readability
process.stderr.isTTY = true

// Show debug log entries if DEBUG env var set e.g.
//   DEBUG=1 npm test
// Do not exit on errors
log.configure(process.env.DEBUG !== undefined, false)

// After all tests have finished run the shutdown
// function. This needs to be done here, rather
// than in a global teardown script because
// tests are run in separate processes
afterAll(async () => {
  await shutdown()
})
