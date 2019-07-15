import { replaceHandlers, defaultHandler } from '@stencila/logga'

/**
 * Show all log entries except for DEBUG level during tests
 */
replaceHandlers(data => {
  process.stderr.isTTY = true
  if (data.level < 3) defaultHandler(data)
})
