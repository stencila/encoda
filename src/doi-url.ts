/**
 * Compiler for a Digital Object Identifier (DOI) URL i.e. `http[s]://doi.org/<DOI>`
 */

import stencila from '@stencila/schema'
import * as csl from './csl'
import { VFile } from './vfile'

export const mediaTypes = ['text/x-doi-url']

export const extNames = ['doi-url']

export async function sniff(content: string): Promise<boolean> {
  return /^\s*https?:\/\/doi\.org\//.test(content)
}

export async function parse(file: VFile): Promise<stencila.Node> {
  return csl.parse(file, '@doi/api')
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  throw new Error(`Unparsing to DOI URL is not yet implemented`)
}
