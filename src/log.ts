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
      // Signature for determining if already emitted excludes trace
      const signature = `${data.tag}${data.level}${data.message}`
      if (debug || !previousLogData.has(signature)) {
        logga.defaultHandler(data)
        previousLogData.add(signature)
      }
    }
  })
}

type CodecOperation = 'decode' | 'encode'

/**
 * Log a warning about the loss of data
 *
 * ```ts
 * logWarn('html', 'decode', `Unhandled element type ${elem.name}`)
 * ```
 *
 * @param codec The codec emitting the warning
 * @param op The operation emitting the warning
 * @param message The message to emit
 */
export const logWarnLoss = (
  codec: string,
  op: CodecOperation,
  message: string
): void => {
  log.warn(`${codec}:${op} ${message}`)
}

/**
 * Log a warning if there is any loss of data
 *
 * Use this function to warn the user of any loss of
 * data during encoding or decoding e.g.
 *
 * ```ts
 * const {used, ...lost} = node
 * logWarnLossIfAny('html', 'encode', node, lost)
 * ```
 *
 * @param codec The codec emitting the warning
 * @param op The operation emitting the warning
 * @param node The node from which data may be lost
 * @param lost An object with data that will be lost (is any)
 */
export const logWarnLossIfAny = (
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

/**
 * Log an error regarding unhandled / unexpected node type
 *
 * @param codec The codec emitting the warning
 * @param op The operation emitting the warning
 * @param types The type/s expected
 * @param node The node from which data may be lost
 */
export const logErrorNodeType = (
  codec: string,
  op: CodecOperation,
  types: string,
  node: stencila.Node
): void => {
  log.error(
    `${codec}:${op} Expecting node of type ${types} but got node of type ${nodeType(
      node
    )}`
  )
}
