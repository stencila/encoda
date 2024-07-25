/**
 * [[include:src/codecs/orcid/README.md]]
 *
 * @module codecs/orcid
 */

import { schema, http } from '@stencila/jesta'
import { getLogger } from '@stencila/logga'
import { load } from '../..'
import { getErrorMessage } from '../../util/errors'

import * as vfile from '../../util/vfile'
import { Codec } from '../types'

const log = getLogger('encoda:orcid')

export class OrcidCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/x-orcid']

  public readonly extNames = ['orcid']

  public static regex =
    /^\s*((ORCID\s*:?\s*)|(https?:\/\/orcid\.org\/))?(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])\s*$/i

  public static apiVersion = 'v3.0'

  public readonly sniff = (content: string): Promise<boolean> => {
    return Promise.resolve(OrcidCodec.regex.exec(content) !== null)
  }

  public readonly decode = async (
    file: vfile.VFile | string
  ): Promise<schema.Node> => {
    const content = typeof file === 'string' ? file : await vfile.dump(file)
    const match = OrcidCodec.regex.exec(content)
    if (match !== null) {
      const orcid = match[4]
      try {
        const response = await http.get(
          `https://pub.orcid.org/${OrcidCodec.apiVersion}/${orcid}`,
          {
            headers: { Accept: 'application/ld+json' },
          }
        )
        if (response.statusCode === 200 && response.body.length > 0)
          return load(response.body, 'jsonld')
      } catch (error) {
        log.error(
          `Error fetching or decoding JSON-LD: ${getErrorMessage(error)}`
        )
      }
    } else {
      log.error('Unable to parse content as ORCID')
    }
    return schema.person()
  }

  public readonly encode = (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to an ORCID is not yet implemented`)
  }
}
