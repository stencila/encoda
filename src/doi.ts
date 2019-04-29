/**
 * Compiler for a Digital Object Identifier (DOI)
 */

import stencila from '@stencila/schema'
import * as csl from './csl'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/x-doi']
export const extNames = ['doi']

// See https://www.crossref.org/blog/dois-and-matching-regular-expressions/
// for notes on DOI matching
const regex = /^\s*((DOI\s*:?\s*)|(https?:\/\/doi\.org\/))?(10.\d{4,9}\/[^\s]+)\s*$/i

export async function sniff(content: string): Promise<boolean> {
  return regex.test(content)
}

export async function parse(file: VFile): Promise<stencila.Node> {
  const content = dump(file)
  const match = content.match(regex)
  if (!match) throw new Error('Unable to parse content')
  const doi = load(match[4])
  return csl.parse(doi, '@doi/id')
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  throw new Error(`Unparsing to DOI is not yet implemented`)
}
