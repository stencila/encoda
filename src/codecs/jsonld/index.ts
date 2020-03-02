/**
 * @module jsonld
 */

import { getLogger } from '@stencila/logga'
import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import jsonld from 'jsonld'
import path from 'path'
import { coerce } from '../../util/coerce'
import * as http from '../../util/http'
import orderProperties from '../../util/orderProperties'
import { transformSync } from '../../util/transform'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

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

  private static context: { [key: string]: any } = {}

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
    const compacted = await jsonld.compact(expanded, JsonLdCodec.context, {
      documentLoader
    })

    // Remove `@context` and other JSON-LD keywords
    // @ts-ignore
    const { '@context': context, '@reverse': reverse, ...rest } = compacted

    // Transform tree to better match Stencila schema
    const transformed = await transformSync(rest, node => {
      if (!stencila.isPrimitive(node)) {
        const type = stencila.nodeType(node)
        if (type === 'Date') {
          // The `jsonld` package uses `@value` for these types.
          // e.g. `{ type: 'Date', '@value': '2008-01-25' }`
          // So rename that to plain `value`.
          // @ts-ignore
          const { '@value': value, ...rest } = node
          return { ...rest, value }
        } else if (type === 'Object') {
          // The `jsonld` package expands URI strings into an object with an id e.g.
          //
          //   "url": {
          //     "id": "http://example.org/"
          //   }
          //
          // So transform an object with only `id` property (no type even) into a string
          // @ts-ignore
          const { id, ...rest } = node
          if (typeof id === 'string' && Object.keys(rest).length === 0)
            return id
        }
      }
      return node
    })

    // Coerce types so that the data fits the Stencila schema
    // e.g. singleton vs arrays
    const coerced = await coerce(transformed)
    return coerced
  }

  /**
   * @implements {@link Codec.decode}
   *
   * @details For `Entity` nodes will order properties as is done by
   * similar codecs e.g. `json`, `yaml`. Wraps primitive nodes into
   * a https://schema.org/PropertyValue.
   */
  public readonly encode = (node: stencila.Node): Promise<vfile.VFile> => {
    const content = stencila.isEntity(node)
      ? (orderProperties(node) as stencila.Entity)
      : {
          type: 'PropertyValue',
          value: node
        }

    const jsonld = JSON.stringify(
      {
        '@context': 'http://schema.stenci.la',
        ...content
      },
      null,
      '  '
    )

    return Promise.resolve(vfile.load(jsonld))
  }
}
