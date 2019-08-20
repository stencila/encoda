/**
 * @module jsonld
 */

import * as stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'
import fs from 'fs-extra'
import jsonld from 'jsonld'
import path from 'path'
import { Codec } from '../types'
import { coerce } from '../../util/coerce'
import * as http from '../../util/http'
import transform from '../../util/transform'
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

  private static context: {[key: string]: any} = {}

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    const data = JSON.parse(content)

    // Load the Stencila JSON-LD context if necessary
    if (Object.keys(JsonLdCodec.context).length === 0) {
      const location = path.join(
        path.dirname(require.resolve('@stencila/schema')),
        'stencila.jsonld'
      )
      JsonLdCodec.context = await fs.readJSON(location)
    }

    // Expand the data (thereby removing it's context) and then compact it
    // using the Stencila `@context` (thereby changing property names
    // and types to those in the schema).
    const expanded = await jsonld.expand(data, { documentLoader })
    const compacted = await jsonld.compact(
      expanded,
      JsonLdCodec.context,
      { documentLoader }
    )

    // `jsonld` expands url string into an object with an id e.g.
    //
    //   "url": {
    //     "id": "http://example.org/"
    //   }
    //
    // so we transform these to strings (including arrays of URLs)
    // by walking the compacted doc
    const transformed = await transform(compacted, async (node, path) => {
      if (!stencila.isPrimitive(node) && stencila.nodeType(node) === 'object') {
        if (path !== undefined && (path.pop() === 'url' || path.pop() === 'url'))
          // @ts-ignore
          if ('id' in node) return node.id
      }
      return node
    })

    // Coerce types so that the data fits the Stencila schema
    // e.g. singleton vs arrays
    const coerced = await coerce(transformed)
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
