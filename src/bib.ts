/**
 * Compiler for BibTeX
 */

import stencila from '@stencila/schema'
import * as csl from './csl'
import { VFile } from './vfile'

export const mediaTypes = ['application/x-bibtex']

export const extNames = ['bib', 'bibtex']

export async function parse(file: VFile): Promise<stencila.Node> {
  return csl.parse(file, '@bibtex/text')
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return csl.unparse(node, 'bibtex')
}
