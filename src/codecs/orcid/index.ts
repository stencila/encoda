/**
 * Codec for an Open Researcher and Contributor ID (ORCID)
 */

import * as stencila from '@stencila/schema'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class OrcidCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/x-orcid']

  public readonly extNames = ['orcid']

  public static regex = /^\s*((ORCID\s*:?\s*)|(https?:\/\/orcid\.org\/))?(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])\s*$/i

  public readonly sniff = async (content: string): Promise<boolean> => {
    return OrcidCodec.regex.test(content)
  }

  public readonly decode = async (
    file: vfile.VFile | string
  ): Promise<stencila.Node> => {
    const content = typeof file === 'string' ? file : await vfile.dump(file)
    const match = content.match(OrcidCodec.regex)
    if (!match) throw new Error('Unable to parse content')

    const orcid = match[4]
    const response = await http.get(`https://orcid.org/${orcid}`, {
      headers: {
        Accept: 'application/ld+json'
      }
    })
    if (response.statusCode === 200 && response.body) {
      const data = JSON.parse(response.body)
      if (Array.isArray(data.url) && data.url.length > 0) data.url = data.url[0]
      // TODO: Should be using a JSON-LD decode function here; following is temporary
      // https://github.com/stencila/encoda/issues/207
      const { givenName, familyName } = data
      return stencila.person({
        givenNames: [givenName],
        familyNames: [familyName]
      })
    }
    throw new Error(`Request failed`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    throw new Error(`Encoding to an ORCID is not yet implemented`)
  }
}
