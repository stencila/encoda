/**
 * Compiler for a Digital Object Identifier (DOI)
 */

import stencila from '@stencila/schema'
import * as csl from './csl'
import { VFile } from './vfile'

export const mediaTypes = ['text/x-doi']

export const extNames = ['doi']

export async function sniff(content: string): Promise<boolean> {
  // See https://www.crossref.org/blog/dois-and-matching-regular-expressions/
  // for notes on DOI matching
  return /^\s*(DOI)?\s*:?\s*(10.\d{4,9}\/[^\s]+)\s*$/i.test(content)
}

export async function parse(file: VFile): Promise<stencila.Node> {
  return csl.parse(file, '@doi/id')
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  throw new Error(`Unparsing to DOI is not yet implemented`)
}
