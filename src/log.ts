import * as logga from '@stencila/logga'
import * as stencila from '@stencila/schema'
import { deleteAt } from 'fp-ts/lib/Record'

const log = logga.getLogger('encoda')
export default log

/**
 * Configure logger so that it:
 *
 * - only shows DEBUG entries if `debug=true`
 * - does not show the same message twice within 5s
 *
 * @param debug In debug mode?
 */
export const configure = (debug = false): void => {
  logga.replaceHandlers((data: logga.LogData): void => {
    logga.defaultHandler(data, {
      maxLevel: debug ? logga.LogLevel.debug : logga.LogLevel.info,
      throttle: {
        // Do not repeat the same message within 5s
        signature: `${data.tag}${data.level}${data.message}`,
        duration: 5000
      }
    })
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
 * @param lost An object with data that will be lost (if any)
 */
export const logWarnLossIfAny = (
  codec: string,
  op: CodecOperation,
  node: stencila.Node,
  lost: object
): void => {
  const rest = deleteAt('type')(lost)
  const properties = Object.keys(rest)
  if (properties.length > 0) {
    log.warn(
      `${codec} Properties of \`${stencila.nodeType(
        node
      )}\` not supported by ${op}: ${properties
        .map(prop => `\`${prop}\``)
        .join(', ')}`
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
    `${codec}:${op} Expecting node of type ${types} but got node of type ${stencila.nodeType(
      node
    )}`
  )
}
