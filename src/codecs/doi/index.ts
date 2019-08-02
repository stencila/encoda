/**
 * Codec for Digital Object Identifiers (DOI)
 */

import stencila from '@stencila/schema'
import * as csl from '../csl'
import * as vfile from '../../util/vfile'

export const mediaTypes = ['text/x-doi']
export const extNames = ['doi']

// See https://www.crossref.org/blog/dois-and-matching-regular-expressions/
// for notes on DOI matching
const regex = /^\s*((DOI\s*:?\s*)|(https?:\/\/doi\.org\/))?(10.\d{4,9}\/[^\s]+)\s*$/i

export async function sniff(content: string): Promise<boolean> {
  return regex.test(content)
}

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const content = await vfile.dump(file)
  const match = content.match(regex)
  if (!match) throw new Error('Unable to parse content')
  const doi = vfile.load(match[4])
  return csl.decode(doi, '@doi/id')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function encode(node: stencila.Node): Promise<vfile.VFile> {
  throw new Error(`Unparsing to DOI is not yet implemented`)
}
