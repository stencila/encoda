/**
 * @module jsonld
 */

import stencila from '@stencila/schema'
import jsonld from 'jsonld'
import { Codec } from '../types'
import * as vfile from '../../util/vfile'
import { coerce } from '../../util/coerce'

export class JsonLdCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/ld+json']

  public readonly extNames = ['jsonld']

  // TODO: Implement a custom loader to cache any contexts, including the Stencila @context
  // See https://github.com/digitalbazaar/jsonld.js/#custom-document-loader
  // Currently using schema.org
  private static readonly stencilaContext = 'http://schema.org'

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    const data = JSON.parse(content)
    // Expand the data (thereby removing it's context) and then compact it
    // using the Stencila `@context`
    const expanded = await jsonld.expand(data)
    const compacted = await jsonld.compact(
      expanded,
      JsonLdCodec.stencilaContext
    )
    // Remove and rename properties and coerce types so that the data
    // fits the Stencila schema
    const coerced = await coerce(compacted)
    return coerced
  }

  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    // TODO: um, like, everything
    const jsonld = ''
    return vfile.load(jsonld)
  }
}
