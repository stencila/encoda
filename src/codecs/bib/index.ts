/**
 * Codec for BibTeX
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { CSLCodec } from '../csl'
import { Codec } from '../types'

const csl = new CSLCodec()

export class BibCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/x-bibtex']

  public readonly extNames = ['bib', 'bibtex']

  public readonly decode = (file: vfile.VFile): Promise<stencila.Node> => {
    return csl.decode(file, { format: '@bibtex/text' })
  }

  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    return csl.encode(node, { format: 'bibtex' })
  }
}
