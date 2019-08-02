/**
 * Codec for an Open Researcher and Contributor ID (ORCID)
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as http from '../../util/http'
import { coerce } from '../../util'

export const mediaTypes = ['text/x-orcid']

export const extNames = ['orcid']

const regex = /^\s*((ORCID\s*:?\s*)|(https?:\/\/orcid\.org\/))?(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])\s*$/i

export async function sniff(content: string): Promise<boolean> {
  return regex.test(content)
}

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const content = await vfile.dump(file)
  const match = content.match(regex)
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
    return coerce(data, 'Person')
  }
  throw new Error(`Request failed`)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function encode(node: stencila.Node): Promise<vfile.VFile> {
  throw new Error(`Encoding to an ORCID is not yet implemented`)
}
