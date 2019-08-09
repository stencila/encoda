/**
 * Codec for BibTeX
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { CSL } from '../csl'
import { Codec } from '../types'

const csl = new CSL()

export class Bib extends Codec implements Codec {
  public mediaTypes = ['application/x-bibtex']

  public extNames = ['bib', 'bibtex']

  public decode = (file: vfile.VFile): Promise<stencila.Node> => {
    return csl.decode(file, { format: '@bibtex/text' })
  }

  public encode = async (node: stencila.Node): Promise<vfile.VFile> => {
    return csl.encode(node, { format: 'bibtex' })
  }
}
