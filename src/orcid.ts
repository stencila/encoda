/**
 * Compiler for an Open Researcher and Contributor ID (ORCID)
 */

import stencila, { mutate } from '@stencila/schema'
import axios from 'axios'
import { dump, VFile } from './vfile'

export const mediaTypes = ['text/x-orcid']
export const extNames = ['orcid']

const regex = /^\s*((ORCID\s*:?\s*)|(https?:\/\/orcid\.org\/))?(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])\s*$/i

export async function sniff(content: string) {
  return regex.test(content)
}

export async function parse(file: VFile): Promise<stencila.Node> {
  const content = dump(file)
  const match = content.match(regex)
  if (!match) throw new Error('Unable to parse content')

  const orcid = match[4]
  const response = await axios.get(`https://orcid.org/${orcid}`, {
    headers: {
      Accept: 'application/ld+json'
    }
  })
  if (response.status === 200 && response.data) {
    const data = response.data
    if (Array.isArray(data.url) && data.url.length > 0) data.url = data.url[0]
    return mutate(data, 'Person')
  }
  throw new Error(`Request failed`)
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  throw new Error(`Unparsing to an ORCID is not yet implemented`)
}
