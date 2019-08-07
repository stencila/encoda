/**
 * @module jsonld
 */

import stencila from '@stencila/schema'
import jsonld from 'jsonld'
import { Encode } from '../..'
import * as vfile from '../../util/vfile'
import { coerce } from '../../util/coerce'

export const mediaTypes = ['application/ld+json']

export const extNames = ['jsonld']

// TODO: Implement a custom loader to cache any contexts, including the Stencila @context
// See https://github.com/digitalbazaar/jsonld.js/#custom-document-loader
const stencilaContext = 'http://schema.org'

/**
 * Decode a `VFile` with JSON-LD to a Stencila `Node`.
 *
 * This involves `expand`ing the JSON-LD with its declared
 * `@context` and then `compact`ing it using the Stencila
 * `@context`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const content = await vfile.dump(file)
  const data = JSON.parse(content)
  // Expand the data (thereby removing it's context) and then compact it
  // using the Stencila `@context`
  const expanded = await jsonld.expand(data)
  const compacted = await jsonld.compact(expanded, stencilaContext)
  // Now remove and rename properties and coerce types so that the data
  // fits the Stencila schema
  // TODO: Enable removing of unrecognised properties `coerce`
  const coerced = compacted // await coerce(compacted)
  return coerced
}

/**
 * Encode a Stencila `Node` to a `VFile` with JSON5 content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  // TODO: um, like, everything
  const jsonld = ''
  return vfile.load(jsonld)
}
