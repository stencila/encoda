/**
 * @module jsonld
 */

import stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'
import jsonld from 'jsonld'
import { Codec } from '../types'
import { coerce } from '../../util/coerce'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'

const log = getLogger('encoda:jsonld')

/**
 * An in-memory cache of JSON-LD contexts
 */
const contexts: { [key: string]: unknown } = {}

/**
 * Custom document loader that loads from the
 * in-memory cache first if possible. Uses
 * the `util/http` module to fetch for it's
 * on-disk caching based on response headers.
 *
 * Also, when using `jsonld`'s own document loader
 * we found that there were weird `301` errors,
 * but only when running under `jest` (???) e.g.
 * https://travis-ci.org/stencila/encoda/jobs/571721565#L616
 *
 * See https://github.com/digitalbazaar/jsonld.js/#custom-document-loader
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const documentLoader = async (url: string): Promise<any> => {
  // Obtain from in-memory cache if possible
  if (url in contexts) {
    return {
      document: contexts[url]
    }
  }
  // Fetch from remote
  let response
  try {
    response = await http.get(url, {
      headers: {
        Accept: 'application/ld+json, application/json, */*'
      }
    })
  } catch (error) {
    log.error(error)
    return null
  }
  // Cache and return document
  const document = JSON.parse(response.body)
  contexts[url] = document
  return { document }
}

export class JsonLdCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/ld+json']

  public readonly extNames = ['jsonld']

  // TODO: Use the stencila `@context` from the `stencila/schema` repo
  // Currently using schema.org
  private static readonly stencilaContext = 'http://schema.org'

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    const data = JSON.parse(content)
    // Expand the data (thereby removing it's context) and then compact it
    // using the Stencila `@context`
    const expanded = await jsonld.expand(data, { documentLoader })
    const compacted = await jsonld.compact(
      expanded,
      JsonLdCodec.stencilaContext,
      { documentLoader }
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
