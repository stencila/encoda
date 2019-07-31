import * as logga from '@stencila/logga'

const log = logga.getLogger('encoda')
export default log

const previousLogData = new Set<string>()

/**
 * Configure logger so that it:
 *
 * - only shows DEBUG entries if `debug=true`
 * - does not show duplicate entries unless `debug=true`
 *
 * @param debug In debug mode?
 */
export const configure = (debug: boolean = false): void => {
  logga.replaceHandlers((data: logga.LogData): void => {
    if (data.level <= (debug ? 3 : 2)) {
      const json = JSON.stringify(data)
      if (debug || !previousLogData.has(json)) {
        logga.defaultHandler(data)
        previousLogData.add(json)
      }
    }
  })
}
