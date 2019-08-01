/**
 * Codec for BibTeX
 */

import stencila from '@stencila/schema';
import { Encode, EncodeOptions } from '../..';
import * as vfile from '../../util/vfile';
import * as csl from '../csl';

export const mediaTypes = ['application/x-bibtex']

export const extNames = ['bib', 'bibtex']

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return csl.decode(file, '@bibtex/text')
}

export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  return csl.encode(node, {format: 'bibtex'})
}
