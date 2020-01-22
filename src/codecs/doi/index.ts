/**
 * Codec for Digital Object Identifiers (DOI)
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { CSLCodec } from '../csl'
import { Codec } from '../types'

export class DoiCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/x-doi']

  public readonly extNames = ['doi']

  private static csl = new CSLCodec()

  // See https://www.crossref.org/blog/dois-and-matching-regular-expressions/
  // for notes on DOI matching
  private static regex = /^\s*((DOI\s*:?\s*)|(https?:\/\/doi\.org\/))?(10.\d{4,9}\/[^\s]+)\s*$/i

  public readonly sniff = (content: string): Promise<boolean> => {
    return Promise.resolve(DoiCodec.regex.exec(content) !== null)
  }

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)
    const match = DoiCodec.regex.exec(content)
    if (match === null) throw new Error('Unable to parse content')
    const doi = vfile.load(match[4])
    return DoiCodec.csl.decode(doi, { format: '@doi/id' })
  }

  public readonly encode = (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to DOI is not yet implemented`)
  }
}
