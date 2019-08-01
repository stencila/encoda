import * as logga from '@stencila/logga'
import * as stencila from '@stencila/schema'
import { nodeType } from '@stencila/schema/dist/util'

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

type CodecOperation = 'decode' | 'encode'

export const errorNodeType = (
  codec: string,
  op: CodecOperation,
  types: string,
  node: stencila.Node
): void => {
  log.error(
    `${codec}:${op} Expecting node of type ${types} but node of type ${nodeType(
      node
    )}`
  )
}

export const warnLoss = (
  codec: string,
  op: CodecOperation,
  message: string
): void => {
  log.warn(`${codec}:${op} ${message}`)
}

export const warnLossIfAny = (
  codec: string,
  op: CodecOperation,
  node: stencila.Node,
  lost: { [key: string]: any }
): void => {
  const { type, ...rest } = lost
  const properties = Object.keys(rest)
  if (properties.length > 0) {
    log.warn(
      `${codec}:${op} Properties of \`${nodeType(
        node
      )}\` not supported: ${properties.map(prop => `\`${prop}\``).join(', ')}`
    )
  }
}
